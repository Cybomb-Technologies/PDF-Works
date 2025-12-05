// server/controllers/tool-controller/Organize/Organize-Controller.js
const { PDFDocument, degrees } = require("pdf-lib");
const fs = require("fs").promises;
const path = require("path");
const Organize = require("../../../models/tools-models/Organize/Organize-Model");

// ✅ ENHANCED: Import usage tracking functions with TOPUP support
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

  console.log('🔍 [ORGANIZE DEBUG] Organize request received:', {
    tool: tool,
    filesCount: files ? files.length : 0,
    pages: pages,
    side: side,
    userId: userId
  });

  // -------------------------------------------------------
  // ✅ ENHANCED: Usage limit check WITH TOPUP SUPPORT
  // -------------------------------------------------------
  let creditsInfo = null;
  if (userId) {
    try {
      console.log('🔍 [ORGANIZE DEBUG] Checking limits for user:', userId);
      
      const limitCheck = await checkLimits(userId, "organize-tools");
      creditsInfo = limitCheck.creditsInfo;
      
      console.log('🔍 [ORGANIZE DEBUG] Organize Tools Limit Check:', {
        allowed: limitCheck.allowed,
        reason: limitCheck.reason,
        currentUsage: limitCheck.usage?.organizeTools || 0,
        limit: limitCheck.plan?.organizeToolsLimit || 0,
        usingTopup: limitCheck.creditsInfo?.usingTopup || false,
        topupAvailable: limitCheck.creditsInfo?.topupAvailable || 0
      });

      if (!limitCheck.allowed) {
        console.log('🚫 [ORGANIZE DEBUG] Organize Tools blocked - limit exceeded');
        return res.status(200).json({
          success: false,
          type: "limit_exceeded",
          title: limitCheck.title || "Usage Limit Reached",
          message: limitCheck.reason,
          notificationType: "error",
          currentUsage: limitCheck.usage?.organizeTools || 0,
          limit: limitCheck.plan?.organizeToolsLimit || 0,
          upgradeRequired: limitCheck.upgradeRequired || true,
          creditsInfo: {
            planLimit: limitCheck.creditsInfo?.planLimit || 0,
            planUsed: limitCheck.creditsInfo?.planUsed || 0,
            planRemaining: limitCheck.creditsInfo?.planRemaining || 0,
            topupAvailable: limitCheck.creditsInfo?.topupAvailable || 0,
            totalAvailable: limitCheck.creditsInfo?.totalAvailable || 0,
            usingTopup: limitCheck.creditsInfo?.usingTopup || false
          }
        });
      }
    } catch (limitErr) {
      console.error('❌ [ORGANIZE DEBUG] Limit check error:', limitErr);
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
        
        console.log(`🔍 [ORGANIZE DEBUG] Starting merge process with ${files.length} files`);
        
        try {
          const mergedPdf = await PDFDocument.create();
          let totalPages = 0;
          
          for (const [index, file] of files.entries()) {
            console.log(`🔍 [ORGANIZE DEBUG] Processing file ${index + 1}: ${file.originalname}, size: ${file.size} bytes`);
            
            try {
              // Validate PDF file
              if (!file.buffer || file.buffer.length === 0) {
                throw new Error('File buffer is empty');
              }
              
              const pdfDoc = await PDFDocument.load(file.buffer);
              const pageIndices = pdfDoc.getPageIndices();
              console.log(`🔍 [ORGANIZE DEBUG] File ${file.originalname} has ${pageIndices.length} pages`);
              
              const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
              copiedPages.forEach((page) => mergedPdf.addPage(page));
              totalPages += copiedPages.length;
              
              console.log(`✅ [ORGANIZE DEBUG] Successfully added ${copiedPages.length} pages from ${file.originalname}`);
            } catch (fileError) {
              console.error(`❌ [ORGANIZE DEBUG] Error processing file ${file.originalname}:`, fileError);
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
          
          console.log(`✅ [ORGANIZE DEBUG] Merge completed successfully. Total pages: ${totalPages}`);
          
        } catch (mergeError) {
          console.error('❌ [ORGANIZE DEBUG] Merge process failed:', mergeError);
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
          
          console.log(`✅ [ORGANIZE DEBUG] Split completed successfully. Extracted ${pageIndices.length} pages`);
          
        } catch (splitError) {
          console.error('❌ [ORGANIZE DEBUG] Split process failed:', splitError);
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
          
          console.log(`✅ [ORGANIZE DEBUG] Rotate completed successfully. Rotated ${pagesToRotate.length} pages by ${rotationAngle}°`);
          
        } catch (rotateError) {
          console.error('❌ [ORGANIZE DEBUG] Rotate process failed:', rotateError);
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
    let incrementResult = null;
    
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

        // ✅ ENHANCED: Increment usage with topup tracking
        incrementResult = await incrementUsage(userId, "organize-tools");
        console.log('✅ [ORGANIZE DEBUG] Usage incremented for organize tools:', {
          userId: userId,
          creditsUsed: incrementResult?.creditsUsed,
          topupRemaining: incrementResult?.creditsUsed?.topupRemaining
        });

      } catch (saveError) {
        console.error("❌ [ORGANIZE DEBUG] Failed to save to Organize model:", saveError);
        // Don't fail the operation if saving fails
      }
    }

    // ✅ ENHANCED: Create enhanced response
    const responseData = {
      success: true,
      message: `${tool.charAt(0).toUpperCase() + tool.slice(1)} operation completed successfully`,
      filename: filename,
      fileSize: fileBuffer.length,
      organizeId: organizeRecord?._id,
      downloadUrl: organizeRecord?.downloadUrl
    };

    // Add credits info if available
    if (creditsInfo || incrementResult?.creditsUsed) {
      responseData.creditsInfo = {
        ...creditsInfo,
        ...(incrementResult?.creditsUsed && {
          creditsUsed: incrementResult.creditsUsed.total,
          fromPlan: incrementResult.creditsUsed.fromPlan,
          fromTopup: incrementResult.creditsUsed.fromTopup,
          topupRemaining: incrementResult.creditsUsed.topupRemaining,
          planRemaining: creditsInfo ? Math.max(0, creditsInfo.planRemaining - (incrementResult.creditsUsed.fromPlan || 0)) : 0,
          topupAvailable: incrementResult.creditsUsed.topupRemaining || 0
        })
      };
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

    // Send JSON response with file data
    res.json({
      ...responseData,
      fileData: fileBuffer.toString('base64')
    });

  } catch (error) {
    console.error("❌ [ORGANIZE DEBUG] PDF processing failed:", error);
    
    // ✅ ENHANCED: Return credits info even in error if available
    const errorResponse = {
      success: false,
      error: "Internal Server Error: " + error.message
    };
    
    if (creditsInfo) {
      errorResponse.creditsInfo = creditsInfo;
    }
    
    res.status(500).json(errorResponse);
  }
};

module.exports = {
  organizePDF,
  downloadOrganizedFile,
  getOrganizeHistory
};