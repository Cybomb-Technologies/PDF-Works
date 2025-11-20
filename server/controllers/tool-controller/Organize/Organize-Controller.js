// server/controllers/tool-controller/organize/Organize-controller.js

const { PDFDocument, degrees } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

// NEW: Function to save processed files to user account
const saveFileToUserAccount = async (
  fileBuffer,
  originalName,
  mimetype,
  userId,
  toolUsed = "organize"
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
    const filename = `organized-${uniqueSuffix}${fileExtension}`;
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
      category: "processed",
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

const organizePDF = async (req, res) => {
  const { tool } = req.params;
  const files = req.files;
  const { pages, side } = req.query; // Now includes 'side' for rotation

  if (!files || files.length === 0) {
    return res.status(400).send("No files uploaded.");
  }

  try {
    let outputPdfBytes;
    let filename = "processed-pdf.pdf";
    let toolUsed = "organize";

    switch (tool) {
      case "merge":
        if (files.length < 2) {
          return res
            .status(400)
            .send("Merging requires at least two PDF files.");
        }
        const mergedPdf = await PDFDocument.create();
        for (const file of files) {
          const pdfDoc = await PDFDocument.load(file.buffer);
          const copiedPages = await mergedPdf.copyPages(
            pdfDoc,
            pdfDoc.getPageIndices()
          );
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        outputPdfBytes = await mergedPdf.save();
        filename = "merged-pdf.pdf";
        toolUsed = "merge";
        break;

      case "split":
        if (files.length !== 1) {
          return res.status(400).send("Splitting requires a single PDF file.");
        }
        if (!pages) {
          return res
            .status(400)
            .send("Splitting requires a page range (e.g., ?pages=1,3-5).");
        }

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
          return res.status(400).send("Invalid or empty page range specified.");
        }

        const extractedPages = await splitPdf.copyPages(
          originalPdf,
          pageIndices
        );
        extractedPages.forEach((page) => splitPdf.addPage(page));
        outputPdfBytes = await splitPdf.save();
        filename = "split-pdf.pdf";
        toolUsed = "split";
        break;

      case "rotate":
        if (files.length !== 1) {
          return res.status(400).send("Rotating requires a single PDF file.");
        }
        if (!["90", "-90", "180"].includes(side)) {
          return res
            .status(400)
            .send("Invalid rotation side specified. Use 90, -90, or 180.");
        }

        const rotatePdf = await PDFDocument.load(files[0].buffer);
        const rotationAngle = parseInt(side);

        const pagesToRotate = rotatePdf.getPages();
        pagesToRotate.forEach((page) =>
          page.setRotation(degrees(rotationAngle))
        );

        outputPdfBytes = await rotatePdf.save();
        filename = `rotated-${rotationAngle}-pdf.pdf`;
        toolUsed = "rotate";
        break;

      default:
        return res.status(400).send("Invalid tool specified.");
    }

    // NEW: Save processed file to user account if user is authenticated
    let savedFileRecord = null;
    if (req.user && req.user.id) {
      try {
        savedFileRecord = await saveFileToUserAccount(
          Buffer.from(outputPdfBytes),
          filename,
          "application/pdf",
          req.user.id,
          toolUsed
        );
        console.log("Organized file saved to user account");
      } catch (saveError) {
        console.error(
          "Failed to save organized file to user account:",
          saveError
        );
        // Don't fail the operation if saving fails
      }
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // NEW: Include file save info in response headers for frontend
    if (savedFileRecord) {
      res.setHeader("X-File-Saved", "true");
      res.setHeader("X-File-Id", savedFileRecord._id.toString());
    }

    res.send(Buffer.from(outputPdfBytes));
  } catch (error) {
    console.error("PDF processing failed:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  organizePDF,
};
