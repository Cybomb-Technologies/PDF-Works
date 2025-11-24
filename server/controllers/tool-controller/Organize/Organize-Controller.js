// server/controllers/tool-controller/Organize/Organize-Controller.js
const { PDFDocument, degrees } = require("pdf-lib");
const fs = require("fs").promises;
const path = require("path");
const Organize = require("../../../models/tools-models/Organize/Organize-Model");

// ✅ FIXED: Import usage tracking functions
const { checkLimits } = require("../../../utils/checkLimits");
const { incrementUsage } = require("../../../utils/incrementUsage");

// Save organized file to Organize model
const saveToOrganizeModel = async (fileBuffer, originalFilenames, processedFilename, operationType, userId, metadata = {}) => {
  try {
    const uploadsDir = path.join(__dirname, '../../../uploads/organized');
    await fs.mkdir(uploadsDir, { recursive: true });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `organized-${uniqueSuffix}-${processedFilename}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, fileBuffer);

    const organizeRecord = new Organize({
      userId: userId,
      originalFilenames: originalFilenames,
      processedFilename: processedFilename,
      operationType: operationType,
      fileSize: fileBuffer.length,
      operationStatus: "completed",
      downloadUrl: `/api/tools/organize/download/${filename}`,
      outputPath: filePath,
      operationMetadata: metadata
    });

    await organizeRecord.save();
    console.log("✅ File saved to Organize model:", organizeRecord._id);
    return organizeRecord;
  } catch (error) {
    console.error("❌ Error saving to Organize model:", error);
    throw error;
  }
};

// Download organized file
const downloadOrganizedFile = async (req, res) => {
  try {
    const { filename } = req.params;

    const filePath = path.join(__dirname, '../../../uploads/organized', filename);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const fileBuffer = await fs.readFile(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Download organized file error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user's organize history
const getOrganizeHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const organizes = await Organize.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      organizes
    });

  } catch (error) {
    console.error('Get organize history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const organizePDF = async (req, res) => {
  const { tool } = req.params;
  const files = req.files;
  const { pages, side } = req.query;
  const userId = req.user?.id;

  console.log('Organize request received:', {
    tool: tool,
    filesCount: files ? files.length : 0,
    pages: pages,
    side: side,
    userId: userId
  });

  // -------------------------------------------------------
  // ✅ USAGE LIMIT CHECK - FIXED
  // -------------------------------------------------------
  if (userId) {
    try {
      const limitCheck = await checkLimits(userId, "organize-tools");
      if (!limitCheck.allowed) {
        return res.status(200).json({
          success: false,
          type: "limit_exceeded",
          title: "Usage Limit Reached",
          message: limitCheck.reason,
          notificationType: "error",
          currentUsage: limitCheck.usage?.organizeTools || 0,
          limit: limitCheck.plan?.organizeToolsLimit || 0,
          upgradeRequired: true
        });
      }
    } catch (limitErr) {
      return res.status(200).json({
        success: false,
        type: "limit_exceeded",
        title: "Usage Limit Error",
        message: limitErr.message,
        notificationType: "error"
      });
    }
  }

  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      error: "No files uploaded."
    });
  }

  try {
    let outputPdfBytes;
    let filename = "processed-pdf.pdf";
    let operationType = "organize";
    let metadata = {};

    switch (tool) {
      case "merge":
        if (files.length < 2) {
          return res.status(400).json({
            success: false,
            error: "Merging requires at least two PDF files."
          });
        }
        
        console.log(`Starting merge process with ${files.length} files`);
        
        try {
          const mergedPdf = await PDFDocument.create();
          let totalPages = 0;
          
          for (const [index, file] of files.entries()) {
            console.log(`Processing file ${index + 1}: ${file.originalname}, size: ${file.size} bytes`);
            
            try {
              // Validate PDF file
              if (!file.buffer || file.buffer.length === 0) {
                throw new Error('File buffer is empty');
              }
              
              const pdfDoc = await PDFDocument.load(file.buffer);
              const pageIndices = pdfDoc.getPageIndices();
              console.log(`File ${file.originalname} has ${pageIndices.length} pages`);
              
              const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
              copiedPages.forEach((page) => mergedPdf.addPage(page));
              totalPages += copiedPages.length;
              
              console.log(`Successfully added ${copiedPages.length} pages from ${file.originalname}`);
            } catch (fileError) {
              console.error(`Error processing file ${file.originalname}:`, fileError);
              return res.status(400).json({
                success: false,
                error: `Invalid PDF file: ${file.originalname}. Please ensure it's a valid PDF.`
              });
            }
          }
          
          outputPdfBytes = await mergedPdf.save();
          filename = "merged-document.pdf";
          operationType = "merge";
          metadata = {
            totalFiles: files.length,
            totalPages: totalPages,
            fileNames: files.map(f => f.originalname),
            processedAt: new Date().toISOString()
          };
          
          console.log(`Merge completed successfully. Total pages: ${totalPages}`);
          
        } catch (mergeError) {
          console.error('Merge process failed:', mergeError);
          return res.status(500).json({
            success: false,
            error: `Merge failed: ${mergeError.message}`
          });
        }
        break;

      case "split":
        if (files.length !== 1) {
          return res.status(400).json({
            success: false,
            error: "Splitting requires a single PDF file."
          });
        }
        if (!pages) {
          return res.status(400).json({
            success: false,
            error: "Splitting requires a page range (e.g., ?pages=1,3-5)."
          });
        }

        try {
          const originalPdf = await PDFDocument.load(files[0].buffer);
          const splitPdf = await PDFDocument.create();

          const pageIndices = pages
            .split(",")
            .flatMap((range) => {
              const [start, end] = range.split("-").map(Number);
              if (isNaN(start)) return [];
              if (isNaN(end)) return [start - 1];
              return Array.from(
                { length: end - start + 1 },
                (_, i) => start + i - 1
              );
            })
            .filter((index) => index >= 0 && index < originalPdf.getPageCount());

          if (pageIndices.length === 0) {
            return res.status(400).json({
              success: false,
              error: "Invalid or empty page range specified."
            });
          }

          const extractedPages = await splitPdf.copyPages(
            originalPdf,
            pageIndices
          );
          extractedPages.forEach((page) => splitPdf.addPage(page));
          outputPdfBytes = await splitPdf.save();
          filename = "split-document.pdf";
          operationType = "split";
          metadata = {
            originalPages: originalPdf.getPageCount(),
            extractedPages: pages,
            pageIndices: pageIndices,
            processedAt: new Date().toISOString()
          };
        } catch (splitError) {
          console.error('Split process failed:', splitError);
          return res.status(400).json({
            success: false,
            error: `Split failed: ${splitError.message}`
          });
        }
        break;

      case "rotate":
        if (files.length !== 1) {
          return res.status(400).json({
            success: false,
            error: "Rotating requires a single PDF file."
          });
        }
        if (!["90", "-90", "180"].includes(side)) {
          return res.status(400).json({
            success: false,
            error: "Invalid rotation side specified. Use 90, -90, or 180."
          });
        }

        try {
          const rotatePdf = await PDFDocument.load(files[0].buffer);
          const rotationAngle = parseInt(side);

          const pagesToRotate = rotatePdf.getPages();
          pagesToRotate.forEach((page) =>
            page.setRotation(degrees(rotationAngle))
          );

          outputPdfBytes = await rotatePdf.save();
          filename = `rotated-document.pdf`;
          operationType = "rotate";
          metadata = {
            rotationAngle: rotationAngle,
            totalPages: pagesToRotate.length,
            processedAt: new Date().toISOString()
          };
        } catch (rotateError) {
          console.error('Rotate process failed:', rotateError);
          return res.status(400).json({
            success: false,
            error: `Rotation failed: ${rotateError.message}`
          });
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid tool specified."
        });
    }

    const fileBuffer = Buffer.from(outputPdfBytes);

    // Save to Organize model if user is authenticated
    let organizeRecord = null;
    if (userId) {
      try {
        organizeRecord = await saveToOrganizeModel(
          fileBuffer,
          files.map(f => f.originalname),
          filename,
          operationType,
          userId,
          metadata
        );

        // ✅ INCREMENT USAGE FOR ORGANIZE TOOLS
        await incrementUsage(userId, "organize-tools");

      } catch (saveError) {
        console.error("Failed to save to Organize model:", saveError);
        // Don't fail the operation if saving fails
      }
    }

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Include organize info in response headers for frontend
    if (organizeRecord) {
      res.setHeader("X-Organize-Id", organizeRecord._id.toString());
      res.setHeader("X-Download-Url", organizeRecord.downloadUrl);
      res.setHeader("X-File-Saved", "true");
    }

    res.send(fileBuffer);

  } catch (error) {
    console.error("PDF processing failed:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error: " + error.message
    });
  }
};

module.exports = {
  organizePDF,
  downloadOrganizedFile,
  getOrganizeHistory
};