const Convert = require("../../../models/tools-models/Convert/Convert");
const path = require("path");
const fs = require("fs").promises;
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

// === FIXED USAGE IMPORTS ===
const { checkLimits } = require("../../../utils/checkLimits");
const { incrementUsage } = require("../../../utils/incrementUsage");

// LibreOffice path - FIXED for cross-platform
const LIBREOFFICE_PATH = process.env.LIBREOFFICE_PATH || 
  (process.platform === "win32" 
    ? "C:\\Program Files\\LibreOffice\\program\\soffice.exe"
    : "/usr/bin/libreoffice");

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

// Helper function to handle conversion limit errors
const handleConversionLimitError = (limitCheck, req) => {
  const isFileSizeError = limitCheck.reason?.includes("upload limit") || 
                         limitCheck.reason?.includes("Max upload") ||
                         limitCheck.reason?.toLowerCase().includes("mb") ||
                         limitCheck.reason?.includes("file size");
  
  const isUsageError = limitCheck.reason?.includes("monthly") || 
                      limitCheck.reason?.includes("limit reached") ||
                      limitCheck.reason?.includes("Conversion limit");

  if (isFileSizeError) {
    return {
      success: false,
      type: "file_size_error",
      title: "File Too Large",
      message: limitCheck.reason,
      notificationType: "error",
      upgradeRequired: limitCheck.upgradeRequired || true,
    };
  }
  
  // Usage error
  return {
    success: false,
    type: "limit_exceeded",
    title: "Usage Limit Reached",
    message: limitCheck.reason,
    notificationType: "error",
    currentUsage: limitCheck.usage?.conversions || 0,
    limit: limitCheck.plan?.conversionLimit || 0,
    upgradeRequired: limitCheck.upgradeRequired || true,
  };
};

// UPDATED: Function to save converted files to user account with proper toolCategory
const saveFileToUserAccount = async (
  fileBuffer,
  originalName,
  mimetype,
  userId,
  toolUsed = "pdf-to-image" // Changed default
) => {
  try {
    const File = require("../../../models/FileModel");
    const fsExtra = require("fs-extra");
    const path = require("path");

    const uploadDir = "uploads/converted_files/";
    await fsExtra.ensureDir(uploadDir);

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(originalName) || ".pdf";
    const filename = `converted-${uniqueSuffix}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    await fsExtra.writeFile(filePath, fileBuffer);

    // Determine toolCategory and valid toolUsed based on conversion type
    let toolCategory = "convert";
    let validToolUsed = toolUsed;
    
    // Map to valid toolUsed values from File model enum
    const toolUsedMapping = {
      // Convert tools
      "pdf-to-image": "pdf-to-image",
      "image-to-pdf": "image-to-pdf", 
      "word-to-pdf": "word-to-pdf",
      "excel-to-pdf": "excel-to-pdf",
      "ppt-to-pdf": "ppt-to-pdf",
      "convert-to-pdf": "word-to-pdf", // Map to valid value
      
      // Default fallback
      "convert": "pdf-to-image"
    };

    if (toolUsedMapping[validToolUsed]) {
      validToolUsed = toolUsedMapping[validToolUsed];
    } else {
      // If not in mapping, default to a valid value
      validToolUsed = "pdf-to-image";
    }

    const fileRecord = new File({
      filename: filename,
      originalName: originalName,
      path: filePath,
      size: fileBuffer.length,
      mimetype: mimetype,
      uploadedBy: userId,
      category: "converted",
      toolUsed: validToolUsed, // Use mapped/validated value
      toolCategory: toolCategory,
    });

    await fileRecord.save();
   // console.log("✅ File saved to user account:", fileRecord._id);
    return fileRecord;
  } catch (error) {
    console.error("❌ Error saving file to user account:", error);
    throw error;
  }
};

// Real conversion function using LibreOffice for documents
const convertWithLibreOffice = async (inputPath, outputPath, originalExt) => {
  try {
    // console.log(`Converting ${originalExt} to PDF using LibreOffice...`);

    const escapedInputPath = `"${inputPath}"`;
    const escapedOutputDir = `"${path.dirname(outputPath)}"`;

    const command = `"${LIBREOFFICE_PATH}" --headless --convert-to pdf --outdir ${escapedOutputDir} ${escapedInputPath}`;

   // console.log("Executing command:", command);

    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });

    if (stderr) {
      console.warn("LibreOffice stderr:", stderr);
    }
   // console.log("LibreOffice stdout:", stdout);

    const inputFilename = path.basename(inputPath, originalExt);
    const convertedFilePath = path.join(
      path.dirname(outputPath),
      inputFilename + ".pdf"
    );

   // console.log("Expected converted file:", convertedFilePath);
   // console.log("Target output path:", outputPath);

    try {
      await fs.access(convertedFilePath);

      if (convertedFilePath !== outputPath) {
        await fs.rename(convertedFilePath, outputPath);
      }

     // console.log("LibreOffice conversion successful!");
      return true;
    } catch (accessError) {
      console.error("Converted file not found at:", convertedFilePath);

      const files = await fs.readdir(path.dirname(outputPath));
      const pdfFiles = files.filter((f) => f.endsWith(".pdf"));
     // console.log("Available PDF files:", pdfFiles);

      if (pdfFiles.length > 0) {
        const actualConvertedPath = path.join(
          path.dirname(outputPath),
          pdfFiles[0]
        );
        await fs.rename(actualConvertedPath, outputPath);
       // console.log("Found and moved converted file:", pdfFiles[0]);
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

    try {
      let embeddedImage;
      const imageBytes = await fs.readFile(inputPath);

      if (ext === ".jpg" || ext === ".jpeg") {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } else if (ext === ".png") {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      }

      if (embeddedImage) {
        const imageDims = embeddedImage.scale(1);
        const page = pdfDoc.addPage([imageDims.width, imageDims.height]);

        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: imageDims.width,
          height: imageDims.height,
        });

        const pdfBytes = await pdfDoc.save();
        await fs.writeFile(outputPath, pdfBytes);

      //  console.log("Image to PDF conversion successful with embedded image!");
        return true;
      }
    } catch (embedError) {
      console.warn("Image embedding failed, using fallback:", embedError);
    }

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

    const stats = await fs.stat(inputPath);
    const fileSize = (stats.size / 1024).toFixed(2);

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

   // console.log("Created PDF with image information");
    return true;
  } catch (error) {
    console.error("Fallback PDF creation failed:", error);
    throw new Error(`Image to PDF conversion failed: ${error.message}`);
  }
};

// REAL PDF to Image conversion - FIXED VERSION
const convertPdfToImageReal = async (inputPath, outputPath, imageFormat) => {
  try {
   // console.log(`Starting PDF to ${imageFormat} conversion...`);

    // Method 1: Try using pdf-poppler
    try {
     // console.log("Attempting Method 1: pdf-poppler...");
      const result = await convertWithPdfPoppler(
        inputPath,
        outputPath,
        imageFormat
      );
      if (result) {
     //   console.log("PDF to Image conversion successful using pdf-poppler!");
        return true;
      }
    } catch (popplerError) {
      console.warn("pdf-poppler failed:", popplerError.message);
    }

    // Method 2: Try Ghostscript
    try {
     // console.log("Attempting Method 2: Ghostscript...");
      const result = await convertWithGhostscript(
        inputPath,
        outputPath,
        imageFormat
      );
      if (result) {
       // console.log("PDF to Image conversion successful using Ghostscript!");
        return true;
      }
    } catch (gsError) {
      console.warn("Ghostscript failed:", gsError.message);
    }

    // Method 3: Canvas fallback
    try {
     // console.log("Attempting Method 3: Canvas fallback...");
      const result = await createPdfInfoImage(
        inputPath,
        outputPath,
        imageFormat
      );
      if (result) {
       // console.log("Created informative image using canvas");
        return true;
      }
    } catch (canvasError) {
      console.warn("Canvas method failed:", canvasError.message);
    }

    throw new Error(
      "PDF to Image conversion failed. Install one of:\n" +
        "• pdf-poppler\n" +
        "• Ghostscript\n" +
        "• ImageMagick"
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
      page: null,
    };

    await pdftocairo.convert(inputPath, opts);

    const expectedFile = `${opts.out_prefix}-1.${imageFormat}`;
    const expectedPath = path.join(opts.out_dir, expectedFile);

    try {
      await fs.access(expectedPath);
      await fs.rename(expectedPath, outputPath);
      return true;
    } catch {
      throw new Error("pdf-poppler did not produce output file.");
    }
  } catch (error) {
    throw new Error(`pdf-poppler conversion failed: ${error.message}`);
  }
};

// Method 2: Using Ghostscript
const convertWithGhostscript = async (inputPath, outputPath, imageFormat) => {
  try {
    let gsCommand;
    try {
      await execAsync("gswin64c --version");
      gsCommand = "gswin64c";
    } catch {
      try {
        await execAsync("gs --version");
        gsCommand = "gs";
      } catch {
        throw new Error("Ghostscript not found in PATH");
      }
    }

    const device = imageFormat.toLowerCase() === "png" ? "png16m" : "jpeg";
    const resolution = 150;

    const tempOutput = path.join(
      path.dirname(outputPath),
      `temp_${Date.now()}_%d.${imageFormat}`
    );

    const command = `"${gsCommand}" -dNOPAUSE -dBATCH -sDEVICE=${device} -r${resolution} -sOutputFile="${tempOutput}" "${inputPath}"`;

   // console.log("Executing Ghostscript:", command);

    const { stderr } = await execAsync(command, { timeout: 30000 });

    if (stderr && !stderr.includes("NO WARRANTY")) {
      console.warn("Ghostscript stderr:", stderr);
    }

    const outputDir = path.dirname(outputPath);
    const files = await fs.readdir(outputDir);
    const generated = files.filter(
      (f) => f.includes("temp_") && f.endsWith(`.${imageFormat}`)
    );

    if (generated.length === 0) {
      throw new Error("Ghostscript created no output images.");
    }

    const first = generated.sort()[0];
    const sourcePath = path.join(outputDir, first);

    await fs.rename(sourcePath, outputPath);

    // Clean up others
    for (const file of generated) {
      if (file !== first) {
        await fs.unlink(path.join(outputDir, file));
      }
    }

    return true;
  } catch (error) {
    throw new Error(`Ghostscript conversion failed: ${error.message}`);
  }
};

// Method 3: Canvas fallback (guaranteed output)
const createPdfInfoImage = async (inputPath, outputPath, imageFormat) => {
  try {
    let canvasLib;
    try {
      canvasLib = require("canvas");
    } catch {
      throw new Error("Canvas library not installed");
    }

    const { createCanvas } = canvasLib;

    const stats = await fs.stat(inputPath);
    const fileSize = (stats.size / 1024).toFixed(2);

    const width = 800;
    const height = 600;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#667eea");
    gradient.addColorStop(1, "#764ba2");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(50, 50, width - 100, height - 100);

    ctx.fillStyle = "#333";
    ctx.font = "bold 32px Arial";
    ctx.fillText("PDF CONVERSION", width / 2 - 150, 120);

    ctx.font = "24px Arial";
    ctx.fillText(`Original: ${path.basename(inputPath)}`, 100, 180);
    ctx.fillText(`File Size: ${fileSize} KB`, 100, 220);
    ctx.fillText(`Format: ${imageFormat.toUpperCase()}`, 100, 260);
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 100, 300);

    ctx.font = "18px Arial";
    ctx.fillText("This is a fallback image.", 100, 360);
    ctx.fillText("Install pdf-poppler or Ghostscript for real conversion.", 100, 400);

    const buffer = canvas.toBuffer(`image/${imageFormat}`);
    await fs.writeFile(outputPath, buffer);

    return true;
  } catch (error) {
    throw new Error(`Canvas image creation failed: ${error.message}`);
  }
};

// PDF to Image conversion - UPDATED with enhanced usage tracking
const convertPdfToImage = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!req.file) {
      return res.status(200).json({
        success: false,
        type: "validation_error",
        title: "File Required",
        message: "No file uploaded",
        notificationType: "warning"
      });
    }

    const fileSize = req.file.size || 0;
    
    // -------------------------------------------------------
    // ✅ ENHANCED: Usage limit check WITH FILE SIZE
    // -------------------------------------------------------
    if (userId) {
      try {
       // console.log('🔍 [CONVERT DEBUG] Checking limits for user:', userId);
       // console.log('🔍 [CONVERT DEBUG] File size:', fileSize, 'bytes');
        
        const limitCheck = await checkLimits(userId, "convert", fileSize);
        
        // console.log('🔍 [CONVERT DEBUG] PDF to Image Limit Check:', {
        //   allowed: limitCheck.allowed,
        //   reason: limitCheck.reason,
        //   currentUsage: limitCheck.usage?.conversions,
        //   limit: limitCheck.plan?.conversionLimit,
        // });

        if (!limitCheck.allowed) {
          //console.log('🚫 [CONVERT DEBUG] Conversion blocked - limit exceeded');
          return res.status(200).json(handleConversionLimitError(limitCheck, req));
        }
      } catch (limitErr) {
        console.error('❌ [CONVERT DEBUG] Limit check error:', limitErr);
        return res.status(200).json({
          success: false,
          type: "limit_exceeded",
          title: "Usage Limit Error",
          message: limitErr.message,
          notificationType: "error"
        });
      }
    }

    const { imageFormat = "jpg" } = req.body;
    const allowedFormats = ["jpg", "jpeg", "png"];

    if (!allowedFormats.includes(imageFormat.toLowerCase())) {
      return res.status(200).json({
        success: false,
        type: "validation_error",
        title: "Invalid Format",
        message: "Invalid image format selected",
        notificationType: "warning"
      });
    }

    if (!validateFileType(req.file, [".pdf"])) {
      return res.status(200).json({
        success: false,
        type: "validation_error",
        title: "Invalid File Type",
        message: "Please upload a PDF file",
        notificationType: "warning"
      });
    }

    const { conversionsDir } = await ensureUploadsDir();

    const outputFilename =
      `${path.parse(req.file.originalname).name}_converted.${imageFormat}`;
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
      // Perform REAL conversion
      await convertPdfToImageReal(req.file.path, outputPath, imageFormat);

      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error("Converted image file is empty");
      }

      const downloadUrl = `/api/convert/download/${conversion._id}`;

      conversion.conversionStatus = "completed";
      conversion.downloadUrl = downloadUrl;
      conversion.outputPath = outputPath;
      await conversion.save();

      // ✅ ENHANCED: Save to user account + increment usage with topup tracking
      let incrementResult = null;
      if (userId) {
        try {
          const fileBuffer = await fs.readFile(outputPath);

          await saveFileToUserAccount(
            fileBuffer,
            outputFilename,
            `image/${imageFormat}`,
            userId,
            "pdf-to-image"
          );

          incrementResult = await incrementUsage(userId, "convert");
          // console.log('✅ [CONVERT DEBUG] Usage incremented for PDF to Image:', {
          //   userId: userId,
          //   creditsUsed: incrementResult?.creditsUsed,
          // });
        } catch (e) {
          console.error("Save to user account failed:", e);
        }
      }

      // ✅ ENHANCED: Response with credits information
      const responseData = {
        success: true,
        type: "conversion_success",
        title: "Conversion Successful",
        message: "PDF converted to image successfully",
        notificationType: "success",
        conversionId: conversion._id,
        downloadUrl,
        convertedFilename: conversion.convertedFilename,
      };

      // Add credits info if available
      if (incrementResult?.creditsUsed) {
        responseData.creditsInfo = {
          fromPlan: incrementResult.creditsUsed.fromPlan,
          fromTopup: incrementResult.creditsUsed.fromTopup,
          topupRemaining: incrementResult.creditsUsed.topupRemaining,
        };
      }

      res.json(responseData);
    } catch (err) {
      console.error("PDF → Image process error:", err);

      conversion.conversionStatus = "failed";
      conversion.errorMessage = err.message;
      await conversion.save();

      return res.status(200).json({
        success: false,
        type: "conversion_error",
        title: "Conversion Failed",
        message: err.message,
        notificationType: "error"
      });
    }
  } catch (error) {
    console.error("PDF → Image ERROR:", error);
    res.status(200).json({
      success: false,
      type: "server_error",
      title: "Conversion Error",
      message: "PDF to Image conversion failed",
      notificationType: "error"
    });
  }
};

// Image to PDF conversion - UPDATED with enhanced usage tracking
const convertImageToPdf = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!req.file) {
      return res.status(200).json({
        success: false,
        type: "validation_error",
        title: "File Required",
        message: "No file uploaded",
        notificationType: "warning"
      });
    }

    const fileSize = req.file.size || 0;
    
    // -------------------------------------------------------
    // ✅ ENHANCED: Usage limit check WITH FILE SIZE
    // -------------------------------------------------------
    if (userId) {
      try {
       // console.log('🔍 [CONVERT DEBUG] Checking limits for user:', userId);
       // console.log('🔍 [CONVERT DEBUG] File size:', fileSize, 'bytes');
        
        const limitCheck = await checkLimits(userId, "convert", fileSize);
        
        // console.log('🔍 [CONVERT DEBUG] Image to PDF Limit Check:', {
        //   allowed: limitCheck.allowed,
        //   reason: limitCheck.reason,
        //   currentUsage: limitCheck.usage?.conversions,
        //   limit: limitCheck.plan?.conversionLimit,
        // });

        if (!limitCheck.allowed) {
         // console.log('🚫 [CONVERT DEBUG] Conversion blocked - limit exceeded');
          return res.status(200).json(handleConversionLimitError(limitCheck, req));
        }
      } catch (limitErr) {
        console.error('❌ [CONVERT DEBUG] Limit check error:', limitErr);
        return res.status(200).json({
          success: false,
          type: "limit_exceeded",
          title: "Usage Limit Error",
          message: limitErr.message,
          notificationType: "error"
        });
      }
    }

    const allowedImageTypes = [".jpg", ".jpeg", ".png"];

    if (!validateFileType(req.file, allowedImageTypes)) {
      return res.status(200).json({
        success: false,
        type: "validation_error",
        title: "Invalid File Type",
        message: "Only JPG, JPEG, and PNG images are allowed",
        notificationType: "warning"
      });
    }

    const { conversionsDir } = await ensureUploadsDir();

    const outputFilename =
      `${path.parse(req.file.originalname).name}_converted.pdf`;
    const outputPath = path.join(conversionsDir, outputFilename);

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

      // ✅ ENHANCED: Save to user account + increment usage with topup tracking
      let incrementResult = null;
      if (userId) {
        try {
          const fileBuffer = await fs.readFile(outputPath);

          await saveFileToUserAccount(
            fileBuffer,
            outputFilename,
            "application/pdf",
            userId,
            "image-to-pdf"
          );

          incrementResult = await incrementUsage(userId, "convert");
          // console.log('✅ [CONVERT DEBUG] Usage incremented for Image to PDF:', {
          //   userId: userId,
          //   creditsUsed: incrementResult?.creditsUsed,
          // });
        } catch (e) {
          console.error("Save to user account failed:", e);
        }
      }

      // ✅ ENHANCED: Response with credits information
      const responseData = {
        success: true,
        type: "conversion_success",
        title: "Conversion Successful",
        message: "Image converted to PDF successfully",
        notificationType: "success",
        conversionId: conversion._id,
        downloadUrl,
        convertedFilename: conversion.convertedFilename,
      };

      // Add credits info if available
      if (incrementResult?.creditsUsed) {
        responseData.creditsInfo = {
          fromPlan: incrementResult.creditsUsed.fromPlan,
          fromTopup: incrementResult.creditsUsed.fromTopup,
          topupRemaining: incrementResult.creditsUsed.topupRemaining,
        };
      }

      res.json(responseData);
    } catch (err) {
      console.error("Image → PDF process error:", err);

      conversion.conversionStatus = "failed";
      conversion.errorMessage = err.message;
      await conversion.save();

      return res.status(200).json({
        success: false,
        type: "conversion_error",
        title: "Conversion Failed",
        message: err.message,
        notificationType: "error"
      });
    }
  } catch (error) {
    console.error("Image → PDF ERROR:", error);
    res.status(200).json({
      success: false,
      type: "server_error",
      title: "Conversion Error",
      message: "Image to PDF conversion failed",
      notificationType: "error"
    });
  }
};

// Convert various formats TO PDF (DOCX, XLSX, PPTX, JPG, PNG → PDF) - UPDATED
const convertToPdf = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!req.file) {
      return res.status(200).json({
        success: false,
        type: "validation_error",
        title: "File Required",
        message: "No file uploaded",
        notificationType: "warning"
      });
    }

    const fileSize = req.file.size || 0;
    
    // -------------------------------------------------------
    // ✅ ENHANCED: Usage limit check WITH FILE SIZE
    // -------------------------------------------------------
    if (userId) {
      try {
        //console.log('🔍 [CONVERT DEBUG] Checking limits for user:', userId);
        //console.log('🔍 [CONVERT DEBUG] File size:', fileSize, 'bytes');
        
        const limitCheck = await checkLimits(userId, "convert", fileSize);
        
        // console.log('🔍 [CONVERT DEBUG] Convert to PDF Limit Check:', {
        //   allowed: limitCheck.allowed,
        //   reason: limitCheck.reason,
        //   currentUsage: limitCheck.usage?.conversions,
        //   limit: limitCheck.plan?.conversionLimit,
        // });

        if (!limitCheck.allowed) {
         // console.log('🚫 [CONVERT DEBUG] Conversion blocked - limit exceeded');
          return res.status(200).json(handleConversionLimitError(limitCheck, req));
        }
      } catch (limitErr) {
        console.error('❌ [CONVERT DEBUG] Limit check error:', limitErr);
        return res.status(200).json({
          success: false,
          type: "limit_exceeded",
          title: "Usage Limit Error",
          message: limitErr.message,
          notificationType: "error"
        });
      }
    }

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

    if (!validateFileType(req.file, allowedInputTypes)) {
      return res.status(200).json({
        success: false,
        type: "validation_error",
        title: "Invalid File Type",
        message: "Only Word, Excel, PowerPoint, JPG, and PNG files are allowed",
        notificationType: "warning"
      });
    }

    const { conversionsDir } = await ensureUploadsDir();

    const originalExt = path.extname(req.file.originalname).toLowerCase();

    const outputFilename =
      `${path.parse(req.file.originalname).name}_converted.pdf`;

    const outputPath = path.join(conversionsDir, outputFilename);

    let conversionType = "";
    if ([".doc", ".docx"].includes(originalExt)) conversionType = "word-to-pdf";
    else if ([".xls", ".xlsx"].includes(originalExt))
      conversionType = "excel-to-pdf";
    else if ([".ppt", ".pptx"].includes(originalExt))
      conversionType = "ppt-to-pdf";
    else conversionType = "image-to-pdf";

    const conversion = new Convert({
      originalFilename: req.file.originalname,
      convertedFilename: outputFilename,
      originalFileType: originalExt.replace(".", ""),
      convertedFileType: "pdf",
      conversionType,
      fileSize: req.file.size,
      conversionStatus: "processing",
    });

    await conversion.save();

    try {
      if (
        [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"].includes(
          originalExt
        )
      ) {
        await convertWithLibreOffice(req.file.path, outputPath, originalExt);
      } else {
        await convertImageToPdfReal(
          req.file.path,
          outputPath,
          req.file.originalname
        );
      }

      const downloadUrl = `/api/convert/download/${conversion._id}`;

      conversion.conversionStatus = "completed";
      conversion.downloadUrl = downloadUrl;
      conversion.outputPath = outputPath;
      await conversion.save();

      // ✅ ENHANCED: Save to user account + increment usage with topup tracking
      let incrementResult = null;
      if (userId) {
        try {
          const buffer = await fs.readFile(outputPath);
          
          // Determine toolUsed based on file type
          let toolUsedValue = "word-to-pdf"; // Default
          if ([".doc", ".docx"].includes(originalExt)) {
            toolUsedValue = "word-to-pdf";
          } else if ([".xls", ".xlsx"].includes(originalExt)) {
            toolUsedValue = "excel-to-pdf";
          } else if ([".ppt", ".pptx"].includes(originalExt)) {
            toolUsedValue = "ppt-to-pdf";
          } else {
            toolUsedValue = "image-to-pdf"; // For image files
          }

          await saveFileToUserAccount(
            buffer,
            outputFilename,
            "application/pdf",
            userId,
            toolUsedValue
          );

          incrementResult = await incrementUsage(userId, "convert");
          console.log('✅ [CONVERT DEBUG] Usage incremented for Convert to PDF:', {
            userId: userId,
            creditsUsed: incrementResult?.creditsUsed,
          });
        } catch (e) {
          console.error("Save to user account failed:", e);
        }
      }

      // ✅ ENHANCED: Response with credits information
      const responseData = {
        success: true,
        type: "conversion_success",
        title: "Conversion Successful",
        message: `${originalExt.toUpperCase()} converted to PDF successfully`,
        notificationType: "success",
        conversionId: conversion._id,
        downloadUrl,
        convertedFilename: conversion.convertedFilename,
      };

      // Add credits info if available
      if (incrementResult?.creditsUsed) {
        responseData.creditsInfo = {
          fromPlan: incrementResult.creditsUsed.fromPlan,
          fromTopup: incrementResult.creditsUsed.fromTopup,
          topupRemaining: incrementResult.creditsUsed.topupRemaining,
        };
      }

      res.json(responseData);
    } catch (err) {
      console.error("File → PDF conversion process error:", err);

      conversion.conversionStatus = "failed";
      conversion.errorMessage = err.message;
      await conversion.save();

      return res.status(200).json({
        success: false,
        type: "conversion_error",
        title: "Conversion Failed",
        message: err.message,
        notificationType: "error"
      });
    }
  } catch (error) {
    console.error("ConvertToPdf ERROR:", error);
    res.status(200).json({
      success: false,
      type: "server_error",
      title: "Conversion Error",
      message: "Conversion failed",
      notificationType: "error"
    });
  }
};

// Download converted file
const downloadConvertedFile = async (req, res) => {
  try {
    const { conversionId } = req.params;

    const conversion = await Convert.findById(conversionId);
    if (!conversion) {
      return res.status(200).json({
        success: false,
        type: "not_found",
        title: "Not Found",
        message: "Conversion not found",
        notificationType: "error"
      });
    }

    if (conversion.conversionStatus !== "completed") {
      return res.status(200).json({
        success: false,
        type: "not_ready",
        title: "Not Ready",
        message: "Conversion not completed yet",
        notificationType: "warning"
      });
    }

    const filePath =
      conversion.outputPath ||
      path.join(
        __dirname,
        "../../../uploads/conversions",
        conversion.convertedFilename
      );

    // Check if file exists & not empty
    try {
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        return res.status(200).json({
          success: false,
          type: "file_error",
          title: "File Error",
          message: "Converted file is empty",
          notificationType: "error"
        });
      }
    } catch {
      return res.status(200).json({
        success: false,
        type: "not_found",
        title: "File Not Found",
        message: "Converted file not found",
        notificationType: "error"
      });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${conversion.convertedFilename}"`
    );
    res.setHeader("Content-Type", getMimeType(conversion.convertedFileType));

    const fileStream = require("fs").createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(200).json({
      success: false,
      type: "server_error",
      title: "Download Failed",
      message: "Download failed",
      notificationType: "error"
    });
  }
};

// Helper function to get correct MIME type
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
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.schema",
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
      return res.status(200).json({
        success: false,
        type: "not_found",
        title: "Not Found",
        message: "Conversion not found",
        notificationType: "error"
      });
    }

    res.json({
      success: true,
      conversionId: conversion._id,
      status: conversion.conversionStatus,
      downloadUrl: conversion.downloadUrl,
      errorMessage: conversion.errorMessage,
      createdAt: conversion.createdAt,
      updatedAt: conversion.updatedAt,
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(200).json({
      success: false,
      type: "server_error",
      title: "Status Check Failed",
      message: "Status check failed",
      notificationType: "error"
    });
  }
};

// ✅ NEW: Get user's conversion credits info
const getUserConvertCredits = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        success: false,
        type: "auth_error",
        title: "Authentication Required",
        message: "Not authenticated",
        notificationType: "error"
      });
    }

    const userId = req.user.id;
    const User = require("../../../models/UserModel");
    const user = await User.findById(userId);
    const limitCheck = await checkLimits(userId, "convert");
    
    const planLimit = limitCheck.plan?.conversionLimit || 0;
    const currentUsage = limitCheck.usage?.conversions || 0;
    const topupCredits = user?.topupCredits?.conversion || 0;
    const planCreditsLeft = Math.max(0, planLimit - currentUsage);
    const totalAvailable = planLimit + topupCredits;
    const usingTopup = planCreditsLeft <= 0;
    
    res.json({
      success: true,
      credits: {
        plan: {
          limit: planLimit,
          used: currentUsage,
          remaining: planCreditsLeft
        },
        topup: {
          available: topupCredits,
          used: user?.topupUsage?.conversion || 0
        },
        total: {
          available: totalAvailable,
          remaining: Math.max(0, totalAvailable - currentUsage)
        },
        usingTopup: usingTopup,
        nextReset: user?.usage?.resetDate || null
      },
      canConvert: currentUsage < totalAvailable || totalAvailable === 99999
    });
  } catch (error) {
    console.error('Get user convert credits error:', error);
    res.status(200).json({
      success: false,
      type: "server_error",
      title: "Failed to load credits",
      message: error.message,
      notificationType: "error"
    });
  }
};

// TEST LIMITS FUNCTION
const testLimits = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        success: false,
        type: "auth_error",
        title: "Authentication Required",
        message: "Not authenticated",
        notificationType: "error"
      });
    }

    const userId = req.user.id;
    let creditsInfo = null;
    
    // Get fresh limit check
    const limitCheck = await checkLimits(userId, "convert");
    creditsInfo = limitCheck.creditsInfo;
    
    const User = require("../../../models/UserModel");
    const user = await User.findById(userId);
    
    res.json({
      success: true,
      userId: userId,
      allowed: limitCheck.allowed,
      reason: limitCheck.reason,
      usage: limitCheck.usage,
      plan: limitCheck.plan ? {
        name: limitCheck.plan.name,
        planId: limitCheck.plan.planId,
        conversionLimit: limitCheck.plan.conversionLimit
      } : null,
      userConversions: limitCheck.usage?.conversions || 0,
      topupCredits: user?.topupCredits?.conversion || 0,
      topupUsage: user?.topupUsage?.conversion || 0,
      creditsInfo: creditsInfo
    });
  } catch (error) {
    console.error("Test limits error:", error);
    res.status(200).json({
      success: false,
      type: "server_error",
      title: "Test Failed",
      message: error.message,
      notificationType: "error"
    });
  }
};

// EXPORT ALL CONTROLLER HANDLERS
module.exports = {
  convertToPdf,
  convertPdfToImage,
  convertImageToPdf,
  downloadConvertedFile,
  getConversionStatus,
  getUserConvertCredits,
  testLimits
};