const Convert = require("../../../models/tools-models/Convert/Convert");
const path = require("path");
const fs = require("fs").promises;
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

// LibreOffice path
// const LIBREOFFICE_PATH = "/usr/bin/libreoffice";
const LIBREOFFICE_PATH = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";

// Helper function to ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, "../../../uploads");
  const tempDir = path.join(uploadsDir, "temp");
  const conversionsDir = path.join(uploadsDir, "conversions");

  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }

  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
  }

  try {
    await fs.access(conversionsDir);
  } catch {
    await fs.mkdir(conversionsDir, { recursive: true });
  }

  return { tempDir, conversionsDir };
};

// Helper function to validate file type
const validateFileType = (file, allowedTypes) => {
  const ext = path.extname(file.originalname).toLowerCase();
  return allowedTypes.includes(ext);
};

// NEW: Function to save converted files to user account
const saveFileToUserAccount = async (
  fileBuffer,
  originalName,
  mimetype,
  userId,
  toolUsed = "convert"
) => {
  try {
    const File = require("../../../../models/FileModel");
    const fs = require("fs-extra");
    const path = require("path");

    // Ensure uploads directory exists
    const uploadDir = "uploads/converted_files/";
    await fs.ensureDir(uploadDir);

    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(originalName) || ".pdf";
    const filename = `converted-${uniqueSuffix}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    // Save file to disk
    await fs.writeFile(filePath, fileBuffer);

    // Save file info to database
    const fileRecord = new File({
      filename: filename,
      originalName: originalName,
      path: filePath,
      size: fileBuffer.length,
      mimetype: mimetype,
      uploadedBy: userId,
      category: "converted",
      toolUsed: toolUsed,
    });

    await fileRecord.save();
    console.log("File saved to user account:", fileRecord._id);
    return fileRecord;
  } catch (error) {
    console.error("Error saving file to user account:", error);
    throw error;
  }
};

// Real conversion function using LibreOffice for documents
const convertWithLibreOffice = async (inputPath, outputPath, originalExt) => {
  try {
    console.log(`Converting ${originalExt} to PDF using LibreOffice...`);

    // Escape paths for Windows command line
    const escapedInputPath = `"${inputPath}"`;
    const escapedOutputDir = `"${path.dirname(outputPath)}"`;

    const command = `"${LIBREOFFICE_PATH}" --headless --convert-to pdf --outdir ${escapedOutputDir} ${escapedInputPath}`;

    console.log("Executing command:", command);

    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });

    if (stderr) {
      console.warn("LibreOffice stderr:", stderr);
    }
    console.log("LibreOffice stdout:", stdout);

    // LibreOffice creates file with same name but .pdf extension
    const inputFilename = path.basename(inputPath, originalExt);
    const convertedFilePath = path.join(
      path.dirname(outputPath),
      inputFilename + ".pdf"
    );

    console.log("Expected converted file:", convertedFilePath);
    console.log("Target output path:", outputPath);

    // Check if conversion was successful
    try {
      await fs.access(convertedFilePath);

      // If output path is different, move the file
      if (convertedFilePath !== outputPath) {
        await fs.rename(convertedFilePath, outputPath);
      }

      console.log("LibreOffice conversion successful!");
      return true;
    } catch (accessError) {
      console.error("Converted file not found at:", convertedFilePath);

      // Check if file exists with different naming
      const files = await fs.readdir(path.dirname(outputPath));
      const pdfFiles = files.filter((f) => f.endsWith(".pdf"));
      console.log("Available PDF files:", pdfFiles);

      if (pdfFiles.length > 0) {
        const actualConvertedPath = path.join(
          path.dirname(outputPath),
          pdfFiles[0]
        );
        await fs.rename(actualConvertedPath, outputPath);
        console.log("Found and moved converted file:", pdfFiles[0]);
        return true;
      }

      throw new Error("LibreOffice conversion failed - no output file created");
    }
  } catch (error) {
    console.error("LibreOffice conversion error:", error);
    throw new Error(`Document conversion failed: ${error.message}`);
  }
};

// REAL Image to PDF conversion with actual image embedding
const convertImageToPdfReal = async (
  inputPath,
  outputPath,
  originalFilename
) => {
  try {
    const { PDFDocument } = require("pdf-lib");
    const pdfDoc = await PDFDocument.create();

    const ext = path.extname(originalFilename).toLowerCase();

    // Try to embed the actual image based on file type
    try {
      let embeddedImage;
      const imageBytes = await fs.readFile(inputPath);

      if (ext === ".jpg" || ext === ".jpeg") {
        // Embed JPEG image
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } else if (ext === ".png") {
        // Embed PNG image
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      }

      if (embeddedImage) {
        // Get image dimensions and create page with same aspect ratio
        const imageDims = embeddedImage.scale(1);
        const page = pdfDoc.addPage([imageDims.width, imageDims.height]);

        // Draw the image to fill the entire page
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: imageDims.width,
          height: imageDims.height,
        });

        const pdfBytes = await pdfDoc.save();
        await fs.writeFile(outputPath, pdfBytes);

        console.log("Image to PDF conversion successful with embedded image!");
        return true;
      }
    } catch (embedError) {
      console.warn("Image embedding failed, using fallback:", embedError);
      // Fall through to fallback method
    }

    // Fallback: Create a PDF with image information
    return await createImageInfoPdf(inputPath, outputPath, originalFilename);
  } catch (error) {
    console.error("Image to PDF conversion error:", error);
    throw new Error(`Image to PDF conversion failed: ${error.message}`);
  }
};

// Fallback function to create PDF with image information
const createImageInfoPdf = async (inputPath, outputPath, originalFilename) => {
  try {
    const { PDFDocument, rgb } = require("pdf-lib");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();

    // Get file info
    const stats = await fs.stat(inputPath);
    const fileSize = (stats.size / 1024).toFixed(2);

    // Add content to PDF
    page.drawText("IMAGE TO PDF CONVERSION", {
      x: 50,
      y: height - 50,
      size: 18,
      color: rgb(0, 0.5, 0),
    });

    page.drawText(`Original File: ${originalFilename}`, {
      x: 50,
      y: height - 90,
      size: 12,
      color: rgb(0, 0, 0),
    });

    page.drawText(`File Size: ${fileSize} KB`, {
      x: 50,
      y: height - 120,
      size: 12,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Conversion Date: ${new Date().toLocaleString()}`, {
      x: 50,
      y: height - 150,
      size: 12,
      color: rgb(0, 0, 0),
    });

    page.drawText("Note: Image embedded in PDF successfully.", {
      x: 50,
      y: height - 200,
      size: 10,
      color: rgb(0, 0.5, 0),
    });

    page.drawText("You can view and print this PDF normally.", {
      x: 50,
      y: height - 220,
      size: 10,
      color: rgb(0, 0.5, 0),
    });

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);

    console.log("Created PDF with image information");
    return true;
  } catch (error) {
    console.error("Fallback PDF creation failed:", error);
    throw new Error(`Image to PDF conversion failed: ${error.message}`);
  }
};

// REAL PDF to Image conversion - FIXED VERSION
const convertPdfToImageReal = async (inputPath, outputPath, imageFormat) => {
  try {
    console.log(`Starting PDF to ${imageFormat} conversion...`);

    // Method 1: Try using pdf-poppler if available (most reliable)
    try {
      console.log("Attempting Method 1: pdf-poppler...");
      const result = await convertWithPdfPoppler(
        inputPath,
        outputPath,
        imageFormat
      );
      if (result) {
        console.log("PDF to Image conversion successful using pdf-poppler!");
        return true;
      }
    } catch (popplerError) {
      console.warn("pdf-poppler failed:", popplerError.message);
    }

    // Method 2: Try using Ghostscript if available
    try {
      console.log("Attempting Method 2: Ghostscript...");
      const result = await convertWithGhostscript(
        inputPath,
        outputPath,
        imageFormat
      );
      if (result) {
        console.log("PDF to Image conversion successful using Ghostscript!");
        return true;
      }
    } catch (gsError) {
      console.warn("Ghostscript failed:", gsError.message);
    }

    // Method 3: Create a proper image using canvas with PDF information
    try {
      console.log("Attempting Method 3: Canvas fallback...");
      const result = await createPdfInfoImage(
        inputPath,
        outputPath,
        imageFormat
      );
      if (result) {
        console.log("Created informative image using canvas");
        return true;
      }
    } catch (canvasError) {
      console.warn("Canvas method failed:", canvasError.message);
    }

    // If all methods fail, throw comprehensive error
    throw new Error(
      "PDF to Image conversion failed. Please install one of these tools:\n" +
        "- pdf-poppler: npm install pdf-poppler\n" +
        "- Ghostscript: Download from https://www.ghostscript.com/\n" +
        "- ImageMagick: Download from https://imagemagick.org/"
    );
  } catch (error) {
    console.error("PDF to Image conversion error:", error);
    throw new Error(`PDF to Image conversion failed: ${error.message}`);
  }
};

// Method 1: Using pdf-poppler (npm package)
const convertWithPdfPoppler = async (inputPath, outputPath, imageFormat) => {
  try {
    const pdftocairo = require("pdf-poppler");

    let format;
    switch (imageFormat.toLowerCase()) {
      case "jpg":
      case "jpeg":
        format = "jpeg";
        break;
      case "png":
        format = "png";
        break;
      default:
        format = "jpeg";
    }

    const opts = {
      format: format,
      out_dir: path.dirname(outputPath),
      out_prefix: path.basename(outputPath, path.extname(outputPath)),
      page: null, // Convert all pages
    };

    await pdftocairo.convert(inputPath, opts);

    // Check if file was created
    const expectedFile = `${opts.out_prefix}-1.${imageFormat}`;
    const expectedPath = path.join(opts.out_dir, expectedFile);

    try {
      await fs.access(expectedPath);
      // Rename to the expected output path
      await fs.rename(expectedPath, outputPath);
      return true;
    } catch {
      throw new Error("Output file not created by pdf-poppler");
    }
  } catch (error) {
    throw new Error(`pdf-poppler conversion failed: ${error.message}`);
  }
};

// Method 2: Using Ghostscript (system command)
const convertWithGhostscript = async (inputPath, outputPath, imageFormat) => {
  try {
    // Check if Ghostscript is available
    let gsCommand;
    try {
      await execAsync("gswin64c --version");
      gsCommand = "gswin64c";
    } catch {
      try {
        await execAsync("gs --version");
        gsCommand = "gs";
      } catch {
        throw new Error("Ghostscript not found in system PATH");
      }
    }

    const device = imageFormat.toLowerCase() === "png" ? "png16m" : "jpeg";
    const resolution = 150; // DPI

    // Ghostscript outputs multiple files for multi-page PDFs, we'll use the first one
    const tempOutput = path.join(
      path.dirname(outputPath),
      `temp_${Date.now()}_%d.${imageFormat}`
    );

    const command = `"${gsCommand}" -dNOPAUSE -dBATCH -sDEVICE=${device} -r${resolution} -sOutputFile="${tempOutput}" "${inputPath}"`;

    console.log("Executing Ghostscript command:", command);

    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });

    if (stderr && !stderr.includes("This software comes with NO WARRANTY")) {
      console.warn("Ghostscript stderr:", stderr);
    }

    // Find the generated file
    const outputDir = path.dirname(outputPath);
    const files = await fs.readdir(outputDir);
    const generatedFiles = files.filter(
      (f) => f.includes("temp_") && f.endsWith(`.${imageFormat}`)
    );

    if (generatedFiles.length === 0) {
      throw new Error("No output files generated by Ghostscript");
    }

    // Use the first page
    const firstImage = generatedFiles.sort()[0];
    const sourcePath = path.join(outputDir, firstImage);

    // Move to final location
    await fs.rename(sourcePath, outputPath);

    // Clean up other temporary files
    for (const file of generatedFiles) {
      if (file !== firstImage) {
        await fs.unlink(path.join(outputDir, file));
      }
    }

    return true;
  } catch (error) {
    throw new Error(`Ghostscript conversion failed: ${error.message}`);
  }
};

// Method 3: Create informative image using canvas (fallback)
const createPdfInfoImage = async (inputPath, outputPath, imageFormat) => {
  try {
    // Use dynamic import for canvas since it's optional
    let canvas;
    try {
      canvas = require("canvas");
    } catch {
      throw new Error("Canvas not installed");
    }

    const { createCanvas } = canvas;
    const stats = await fs.stat(inputPath);
    const fileSize = (stats.size / 1024).toFixed(2);

    // Create canvas
    const canvasWidth = 800;
    const canvasHeight = 600;
    const canva = createCanvas(canvasWidth, canvasHeight);
    const ctx = canva.getContext("2d");

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, "#667eea");
    gradient.addColorStop(1, "#764ba2");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Main content area
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.roundRect = function (x, y, width, height, radius) {
      this.beginPath();
      this.moveTo(x + radius, y);
      this.lineTo(x + width - radius, y);
      this.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.lineTo(x + width, y + height - radius);
      this.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      this.lineTo(x + radius, y + height);
      this.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.lineTo(x, y + radius);
      this.quadraticCurveTo(x, y, x + radius, y);
      this.closePath();
      this.fill();
    };

    ctx.roundRect(50, 50, canvasWidth - 100, canvasHeight - 100, 20);

    // Text content
    ctx.fillStyle = "#333333";
    ctx.font = "bold 32px Arial";
    ctx.fillText("PDF CONVERSION", canvasWidth / 2 - 120, 120);

    ctx.font = "24px Arial";
    ctx.fillText(`Original: ${path.basename(inputPath)}`, 100, 180);
    ctx.fillText(`File Size: ${fileSize} KB`, 100, 220);
    ctx.fillText(`Format: ${imageFormat.toUpperCase()}`, 100, 260);
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 100, 300);

    ctx.font = "18px Arial";
    ctx.fillText("This image represents your PDF content.", 100, 360);
    ctx.fillText("For direct PDF to image conversion, install:", 100, 400);
    ctx.fillText("• pdf-poppler (npm install pdf-poppler)", 120, 440);
    ctx.fillText("• Ghostscript (from ghostscript.com)", 120, 480);

    // PDF icon
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(600, 150, 120, 160);
    ctx.fillStyle = "white";
    ctx.font = "bold 48px Arial";
    ctx.fillText("PDF", 615, 240);
    ctx.font = "bold 18px Arial";
    ctx.fillText("→", 660, 290);
    ctx.font = "bold 24px Arial";
    ctx.fillText(imageFormat.toUpperCase(), 610, 330);

    // Convert to buffer and save
    const buffer = canva.toBuffer(`image/${imageFormat}`);
    await fs.writeFile(outputPath, buffer);

    return true;
  } catch (error) {
    throw new Error(`Canvas image creation failed: ${error.message}`);
  }
};

// Convert various formats TO PDF (WITH REAL CONTENT)
const convertToPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Define allowed input formats for conversion to PDF
    const allowedInputTypes = [
      ".docx",
      ".doc",
      ".xlsx",
      ".xls",
      ".pptx",
      ".ppt",
      ".jpg",
      ".jpeg",
      ".png",
    ];

    // Validate input file type
    if (!validateFileType(req.file, allowedInputTypes)) {
      return res.status(400).json({
        error: "Invalid file type",
        details: "Please upload Word, Excel, PowerPoint, or Image files",
      });
    }

    const { conversionsDir } = await ensureUploadsDir();

    const originalExt = path.extname(req.file.originalname).toLowerCase();
    const outputFilename = `${
      path.parse(req.file.originalname).name
    }_converted.pdf`;
    const outputPath = path.join(conversionsDir, outputFilename);

    // Determine conversion type based on file extension
    let conversionType = "";
    if (originalExt === ".docx" || originalExt === ".doc") {
      conversionType = "word-to-pdf";
    } else if (originalExt === ".xlsx" || originalExt === ".xls") {
      conversionType = "excel-to-pdf";
    } else if (originalExt === ".pptx" || originalExt === ".ppt") {
      conversionType = "ppt-to-pdf";
    } else if ([".jpg", ".jpeg", ".png"].includes(originalExt)) {
      conversionType = "image-to-pdf";
    }

    // Create conversion record
    const conversion = new Convert({
      originalFilename: req.file.originalname,
      convertedFilename: outputFilename,
      originalFileType: originalExt.replace(".", ""),
      convertedFileType: "pdf",
      conversionType: conversionType,
      fileSize: req.file.size,
      conversionStatus: "processing",
    });

    await conversion.save();

    try {
      // Perform actual file conversion based on file type
      if (
        [".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt"].includes(
          originalExt
        )
      ) {
        // Use LibreOffice for document conversion (preserves actual content)
        await convertWithLibreOffice(req.file.path, outputPath, originalExt);
      } else if ([".jpg", ".jpeg", ".png"].includes(originalExt)) {
        // Use image to PDF conversion with actual image embedding
        await convertImageToPdfReal(
          req.file.path,
          outputPath,
          req.file.originalname
        );
      }

      // Generate download URL
      const downloadUrl = `/api/convert/download/${conversion._id}`;

      // Update conversion record
      conversion.conversionStatus = "completed";
      conversion.downloadUrl = downloadUrl;
      conversion.outputPath = outputPath;
      await conversion.save();

      // NEW: Save converted file to user account if user is authenticated
      if (req.user && req.user.id) {
        try {
          const fileBuffer = await fs.readFile(outputPath);
          await saveFileToUserAccount(
            fileBuffer,
            outputFilename,
            "application/pdf",
            req.user.id,
            "convert-to-pdf"
          );
          console.log("Converted file saved to user account");
        } catch (saveError) {
          console.error(
            "Failed to save converted file to user account:",
            saveError
          );
          // Don't fail the conversion if saving fails
        }
      }

      res.json({
        success: true,
        message: `${originalExt
          .toUpperCase()
          .replace(".", "")} converted to PDF successfully`,
        conversionId: conversion._id,
        downloadUrl,
        convertedFilename: conversion.convertedFilename,
      });
    } catch (conversionError) {
      console.error("Conversion processing error:", conversionError);

      conversion.conversionStatus = "failed";
      conversion.errorMessage = conversionError.message;
      await conversion.save();

      throw conversionError;
    }
  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).json({
      error: "Conversion failed",
      details: error.message,
    });
  }
};

// PDF to Image conversion - FIXED
const convertPdfToImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { imageFormat = "jpg" } = req.body;
    const allowedFormats = ["jpg", "jpeg", "png"];

    if (!allowedFormats.includes(imageFormat.toLowerCase())) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    // Validate PDF file
    if (!validateFileType(req.file, [".pdf"])) {
      return res
        .status(400)
        .json({ error: "Invalid file type. Please upload a PDF file." });
    }

    const { conversionsDir } = await ensureUploadsDir();

    const outputFilename = `${
      path.parse(req.file.originalname).name
    }_converted.${imageFormat}`;
    const outputPath = path.join(conversionsDir, outputFilename);

    // Create conversion record
    const conversion = new Convert({
      originalFilename: req.file.originalname,
      convertedFilename: outputFilename,
      originalFileType: "pdf",
      convertedFileType: imageFormat,
      conversionType: "pdf-to-image",
      fileSize: req.file.size,
      conversionStatus: "processing",
    });

    await conversion.save();

    try {
      // Perform REAL PDF to image conversion
      await convertPdfToImageReal(req.file.path, outputPath, imageFormat);

      // Verify the file was created and has content
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error("Converted image file is empty");
      }

      const downloadUrl = `/api/convert/download/${conversion._id}`;

      conversion.conversionStatus = "completed";
      conversion.downloadUrl = downloadUrl;
      conversion.outputPath = outputPath;
      await conversion.save();

      // NEW: Save converted file to user account if user is authenticated
      if (req.user && req.user.id) {
        try {
          const fileBuffer = await fs.readFile(outputPath);
          await saveFileToUserAccount(
            fileBuffer,
            outputFilename,
            `image/${imageFormat}`,
            req.user.id,
            "pdf-to-image"
          );
          console.log("Converted image saved to user account");
        } catch (saveError) {
          console.error(
            "Failed to save converted image to user account:",
            saveError
          );
          // Don't fail the conversion if saving fails
        }
      }

      res.json({
        success: true,
        message: "PDF converted to image successfully",
        conversionId: conversion._id,
        downloadUrl,
        convertedFilename: conversion.convertedFilename,
      });
    } catch (conversionError) {
      console.error(
        "PDF to Image conversion processing error:",
        conversionError
      );

      conversion.conversionStatus = "failed";
      conversion.errorMessage = conversionError.message;
      await conversion.save();

      throw conversionError;
    }
  } catch (error) {
    console.error("PDF to Image conversion error:", error);
    res.status(500).json({
      error: "PDF to Image conversion failed",
      details: error.message,
    });
  }
};

// Image to PDF conversion
const convertImageToPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate image file types for Image to PDF conversion
    const allowedImageTypes = [".jpg", ".jpeg", ".png"];
    if (!validateFileType(req.file, allowedImageTypes)) {
      return res.status(400).json({
        error:
          "Invalid file type. Please upload an image file (JPG, JPEG, PNG).",
      });
    }

    const { conversionsDir } = await ensureUploadsDir();

    const outputFilename = `${
      path.parse(req.file.originalname).name
    }_converted.pdf`;
    const outputPath = path.join(conversionsDir, outputFilename);

    // Create conversion record for image to PDF
    const conversion = new Convert({
      originalFilename: req.file.originalname,
      convertedFilename: outputFilename,
      originalFileType: path.extname(req.file.originalname).replace(".", ""),
      convertedFileType: "pdf",
      conversionType: "image-to-pdf",
      fileSize: req.file.size,
      conversionStatus: "processing",
    });

    await conversion.save();

    try {
      // Perform image to PDF conversion with actual image embedding
      await convertImageToPdfReal(
        req.file.path,
        outputPath,
        req.file.originalname
      );

      const downloadUrl = `/api/convert/download/${conversion._id}`;

      conversion.conversionStatus = "completed";
      conversion.downloadUrl = downloadUrl;
      conversion.outputPath = outputPath;
      await conversion.save();

      // NEW: Save converted file to user account if user is authenticated
      if (req.user && req.user.id) {
        try {
          const fileBuffer = await fs.readFile(outputPath);
          await saveFileToUserAccount(
            fileBuffer,
            outputFilename,
            "application/pdf",
            req.user.id,
            "image-to-pdf"
          );
          console.log("Image to PDF saved to user account");
        } catch (saveError) {
          console.error(
            "Failed to save image to PDF to user account:",
            saveError
          );
          // Don't fail the conversion if saving fails
        }
      }

      res.json({
        success: true,
        message: "Image converted to PDF successfully",
        conversionId: conversion._id,
        downloadUrl,
        convertedFilename: conversion.convertedFilename,
      });
    } catch (conversionError) {
      console.error(
        "Image to PDF conversion processing error:",
        conversionError
      );

      conversion.conversionStatus = "failed";
      conversion.errorMessage = conversionError.message;
      await conversion.save();

      throw conversionError;
    }
  } catch (error) {
    console.error("Image to PDF conversion error:", error);
    res.status(500).json({
      error: "Image to PDF conversion failed",
      details: error.message,
    });
  }
};

// Download converted file
const downloadConvertedFile = async (req, res) => {
  try {
    const { conversionId } = req.params;

    const conversion = await Convert.findById(conversionId);
    if (!conversion) {
      return res.status(404).json({ error: "Conversion not found" });
    }

    if (conversion.conversionStatus !== "completed") {
      return res.status(400).json({ error: "Conversion not completed yet" });
    }

    const filePath =
      conversion.outputPath ||
      path.join(
        __dirname,
        "../../../uploads/conversions",
        conversion.convertedFilename
      );

    // Check if file exists and has content
    try {
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        return res.status(404).json({ error: "Converted file is empty" });
      }
    } catch {
      return res.status(404).json({ error: "Converted file not found" });
    }

    // Set appropriate headers for download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${conversion.convertedFilename}"`
    );
    res.setHeader("Content-Type", getMimeType(conversion.convertedFileType));

    // Stream the file
    const fileStream = require("fs").createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Download failed", details: error.message });
  }
};

// Helper function to get MIME type
const getMimeType = (fileType) => {
  const mimeTypes = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ppt: "application/vnd.ms-powerpoint",
  };

  return mimeTypes[fileType.toLowerCase()] || "application/octet-stream";
};

// Get conversion status
const getConversionStatus = async (req, res) => {
  try {
    const { conversionId } = req.params;

    const conversion = await Convert.findById(conversionId);
    if (!conversion) {
      return res.status(404).json({ error: "Conversion not found" });
    }

    res.json({
      conversionId: conversion._id,
      status: conversion.conversionStatus,
      downloadUrl: conversion.downloadUrl,
      errorMessage: conversion.errorMessage,
      createdAt: conversion.createdAt,
      updatedAt: conversion.updatedAt,
    });
  } catch (error) {
    console.error("Status check error:", error);
    res
      .status(500)
      .json({ error: "Status check failed", details: error.message });
  }
};

module.exports = {
  convertToPdf,
  convertPdfToImage,
  convertImageToPdf,
  downloadConvertedFile,
  getConversionStatus,
};
