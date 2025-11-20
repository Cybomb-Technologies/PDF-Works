// controllers/tool-controller/Edit/Edit-Controller.js - UPDATED VERSION
const path = require('path');
const fs = require('fs').promises;
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
const { createCanvas } = require('canvas');

// Import usage tracking
const { checkLimits } = require("../../../utils/checkLimits");
const { incrementUsage } = require("../../../utils/incrementUsage");

// Configure PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, '../../../node_modules/pdfjs-dist/build/pdf.worker.js');
 
class EditController {
  constructor() {
    console.log('EditController initialized');
    this.configurePDFJS();
    this.uploadPDF = this.uploadPDF.bind(this);
    this.extractPDFStructure = this.extractPDFStructure.bind(this);
    this.getStructure = this.getStructure.bind(this);
    this.updateText = this.updateText.bind(this);
    this.exportPDF = this.exportPDF.bind(this);
    this.serveImage = this.serveImage.bind(this);
    this.applyEdits = this.applyEdits.bind(this);
    this.downloadEdited = this.downloadEdited.bind(this);
    this.renderPageToImage = this.renderPageToImage.bind(this);
    this.serveBackgroundImage = this.serveBackgroundImage.bind(this);
    this.getEdits = this.getEdits.bind(this);
    this.embedCanvasAsPage = this.embedCanvasAsPage.bind(this);
    this.addOriginalPageAsImage = this.addOriginalPageAsImage.bind(this);
  }

  // Configure PDF.js to suppress font warnings
  configurePDFJS() {
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      if (typeof args[0] === 'string' && 
          (args[0].includes('getPathGenerator') || 
           args[0].includes('fetchStandardFontData') ||
           args[0].includes('Requesting object that isn\'t resolved yet'))) {
        return; // Suppress font-related warnings
      }
      originalConsoleWarn.apply(console, args);
    };
  }

  // Upload PDF and extract structure - WITH LIMIT CHECKING
  async uploadPDF(req, res) {
    console.log('uploadPDF method called');
    try {
      if (!req.file) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "File Required",
          message: "No file uploaded",
          notificationType: "warning"
        });
      }

      if (req.file.mimetype !== 'application/pdf') {
        return res.status(200).json({
          success: false,
          type: "validation_error", 
          title: "Invalid File Type",
          message: "Only PDF files are allowed",
          notificationType: "warning"
        });
      }

      // CHECK EDIT TOOLS LIMITS
      if (req.user && req.user.id) {
        const limitCheck = await checkLimits(req.user.id, "edit-tools", req.file.size);
        console.log("🔍 EDIT TOOLS LIMIT CHECK:", {
          allowed: limitCheck.allowed,
          reason: limitCheck.reason,
          currentUsage: limitCheck.usage?.editTools,
          limit: limitCheck.plan?.editToolsLimit
        });

        if (!limitCheck.allowed) {
          return res.status(200).json({
            success: false,
            type: "limit_exceeded",
            title: limitCheck.title || "Edit Tools Limit Reached",
            message: limitCheck.reason,
            notificationType: limitCheck.notificationType || "error",
            currentUsage: limitCheck.currentUsage || 0,
            limit: limitCheck.limit || 0,
            upgradeRequired: limitCheck.upgradeRequired || false
          });
        }
      }

      console.log('PDF file received, size:', req.file.size);

      const sessionId = `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      
      await fs.mkdir(sessionDir, { recursive: true });
      console.log('Session directory created:', sessionDir);

      const originalFilePath = path.join(sessionDir, 'original.pdf');
      await fs.writeFile(originalFilePath, req.file.buffer);

      // Extract PDF structure and render pages to images
      console.log('Starting PDF processing...');
      const pdfUint8Array = new Uint8Array(req.file.buffer);
      const pdfStructure = await this.extractPDFStructure(pdfUint8Array, sessionId);
      
      // Save structure to file
      const structureFile = path.join(sessionDir, 'structure.json');
      await fs.writeFile(structureFile, JSON.stringify(pdfStructure, null, 2));

      // Render each page to image for background
      for (let pageNum = 1; pageNum <= pdfStructure.pages.length; pageNum++) {
        await this.renderPageToImage(pdfUint8Array, pageNum, sessionId);
      }

      // INCREMENT EDIT TOOLS USAGE
      if (req.user && req.user.id) {
        await incrementUsage(req.user.id, "edit-tools");
        console.log("✅ Incremented edit tools usage");
      }

      console.log('PDF processing completed');

      res.json({
        success: true,
        type: "upload_success",
        title: "PDF Uploaded Successfully",
        message: 'PDF uploaded and processed successfully',
        notificationType: "success",
        sessionId,
        totalPages: pdfStructure.pages.length,
        structure: pdfStructure
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(200).json({
        success: false,
        type: "server_error",
        title: "Upload Failed",
        message: error.message,
        notificationType: "error",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // [Keep all other methods exactly the same as your original file]
  // extractPDFStructure, extractTextElements, getFontWeight, getTextColor, 
  // rgbToHex, extractAnnotations, renderPageToImage, serveBackgroundImage,
  // getStructure, updateText, getEdits, exportPDF, embedCanvasAsPage,
  // addOriginalPageAsImage, applyEdits, downloadEdited, serveImage
  // ... all your existing methods remain unchanged

  // Extract PDF structure with precise coordinates
  async extractPDFStructure(pdfBuffer, sessionId) {
    console.log('extractPDFStructure called');
    
    const structure = {
      pages: [],
      metadata: {},
      fonts: {},
      images: {}
    };

    try {
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      console.log('PDF loaded, pages:', pdfDoc.numPages);

      const metadata = await pdfDoc.getMetadata();
      structure.metadata = metadata.info || {};

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        console.log(`Processing page ${pageNum}...`);
        
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        const [textContent, annotations] = await Promise.all([
          page.getTextContent(),
          page.getAnnotations().catch(() => [])
        ]);

        const pageStructure = {
          pageNumber: pageNum,
          width: viewport.width,
          height: viewport.height,
          viewport: {
            width: viewport.width,
            height: viewport.height,
            scale: viewport.scale
          },
          backgroundImage: `/api/tools/pdf-editor/background/${sessionId}/page-${pageNum}.png`,
          elements: {
            text: [],
            images: [],
            annotations: []
          }
        };
        
        // Extract text elements with precise positioning
        const textElements = this.extractTextElements(textContent, viewport, pageNum);
        pageStructure.elements.text = textElements;

        // Extract annotations
        const annotationElements = this.extractAnnotations(annotations, viewport, pageNum);
        pageStructure.elements.annotations = annotationElements;

        structure.pages.push(pageStructure);

        console.log(`Page ${pageNum} processed:`, {
          text: textElements.length,
          annotations: annotationElements.length
        });
      }

      await pdfDoc.destroy();
      return structure;

    } catch (error) {
      console.error('Error extracting PDF structure:', error);
      throw error;
    }
  }

  // Extract text elements with exact positioning - FIXED COORDINATES
  extractTextElements(textContent, viewport, pageNum) {
    const textElements = [];

    textContent.items.forEach((item, index) => {
      const transform = item.transform;
      
      // FIXED: Calculate precise position using PDF coordinate system
      // PDF has origin at bottom-left, DOM has origin at top-left
      const x = transform[4];
      const y = viewport.height - transform[5] - (item.height || 12);
      
      const textElement = {
        id: `text-${pageNum}-${index}`,
        type: 'text',
        content: item.str,
        originalContent: item.str,
        page: pageNum,
        position: {
          x: x,
          y: y,
          width: item.width || 100,
          height: item.height || 12
        },
        style: {
          fontSize: item.height || 12,
          fontFamily: item.fontName || 'Arial, sans-serif',
          fontWeight: this.getFontWeight(item),
          color: this.getTextColor(item),
          textAlign: 'left',
          lineHeight: 1,
          whiteSpace: 'pre'
        },
        transform: item.transform
      };

      textElements.push(textElement);
    });

    return textElements;
  }

  // Get font weight from font name
  getFontWeight(item) {
    if (!item.fontName) return 'normal';
    const fontName = item.fontName.toLowerCase();
    if (fontName.includes('bold') || fontName.includes('black')) return 'bold';
    if (fontName.includes('light') || fontName.includes('thin')) return 'lighter';
    return 'normal';
  }

  // Extract text color
  getTextColor(item) {
    if (item.color && item.color !== 'rgba(0, 0, 0, 1)') {
      return this.rgbToHex(item.color);
    }
    return '#000000';
  }

  // Convert RGB to Hex
  rgbToHex(rgb) {
    if (Array.isArray(rgb)) {
      const [r, g, b] = rgb.map(c => Math.round(c * 255));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return '#000000';
  }

  // Extract annotations
  extractAnnotations(annotations, viewport, pageNum) {
    return annotations.map((annotation, index) => ({
      id: `annotation-${pageNum}-${index}`,
      type: 'annotation',
      content: annotation.contents || '',
      page: pageNum,
      position: {
        x: annotation.rect[0],
        y: viewport.height - annotation.rect[3],
        width: annotation.rect[2] - annotation.rect[0],
        height: annotation.rect[3] - annotation.rect[1]
      },
      annotationType: annotation.subtype
    }));
  }

  // Render page to image for background
  async renderPageToImage(pdfBuffer, pageNum, sessionId) {
    try {
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
      
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Save the image
      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const imagePath = path.join(sessionDir, `page-${pageNum}.png`);
      
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(imagePath, buffer);
      
      await page.cleanup();
      await pdfDoc.destroy();
      
      console.log(`Rendered page ${pageNum} to image`);
      
    } catch (error) {
      console.error(`Error rendering page ${pageNum} to image:`, error);
    }
  }

  // Serve background images
  async serveBackgroundImage(req, res) {
    try {
      const { sessionId, pageNum } = req.params;
      
      const imagePath = path.join(
        __dirname, 
        '../../../uploads/sessions', 
        sessionId, 
        `page-${pageNum}.png`
      );
      
      // Check if image exists
      try {
        await fs.access(imagePath);
      } catch {
        return res.status(404).json({ 
          success: false,
          error: 'Background image not found' 
        });
      }
      
      const imageBuffer = await fs.readFile(imagePath);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(imageBuffer);
      
    } catch (error) {
      console.error('Serve background image error:', error);
      res.status(500).send('Error serving background image');
    }
  }

  // Get PDF structure for specific session
  async getStructure(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Session ID Required",
          message: "Session ID is missing",
          notificationType: "warning"
        });
      }

      const filePath = path.join(
        __dirname,
        '../../../uploads/sessions',
        sessionId,
        'original.pdf'
      );

      const fileBuffer = await fs.readFile(filePath);
      const pdfUint8Array = new Uint8Array(fileBuffer);
      const structure = await this.extractPDFStructure(pdfUint8Array, sessionId);

      res.json({
        success: true,
        type: "structure_loaded",
        title: "PDF Structure Loaded",
        message: "PDF structure retrieved successfully",
        notificationType: "success",
        structure
      });

    } catch (error) {
      console.error('Get structure error:', error);
      res.status(200).json({
        success: false,
        type: "server_error",
        title: "Failed to Load Structure",
        message: error.message,
        notificationType: "error"
      });
    }
  }

  // Update text content
  async updateText(req, res) {
    try {
      const { sessionId, elementId, newContent } = req.body;
      
      if (!sessionId || !elementId) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Missing Information",
          message: "Session ID and element ID are required",
          notificationType: "warning"
        });
      }

      // Save edits to session file
      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const editsFile = path.join(sessionDir, 'edits.json');
      
      let edits = { text: {}, elements: {} };
      try {
        const editsData = await fs.readFile(editsFile, 'utf8');
        edits = JSON.parse(editsData);
      } catch (error) {
        // File doesn't exist yet
      }
      
      edits.text[elementId] = newContent;
      await fs.writeFile(editsFile, JSON.stringify(edits, null, 2));

      res.json({
        success: true,
        type: "text_updated",
        title: "Text Updated",
        message: 'Text updated successfully',
        notificationType: "success"
      });

    } catch (error) {
      console.error('Update text error:', error);
      res.status(200).json({
        success: false,
        type: "server_error",
        title: "Update Failed",
        message: error.message,
        notificationType: "error"
      });
    }
  }

  // Get saved edits
  async getEdits(req, res) {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Session ID Required",
          message: "Session ID is missing",
          notificationType: "warning"
        });
      }

      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const editsFile = path.join(sessionDir, 'edits.json');
      
      let edits = { text: {}, elements: {} };
      try {
        const editsData = await fs.readFile(editsFile, 'utf8');
        edits = JSON.parse(editsData);
      } catch (error) {
        // File doesn't exist yet, return empty edits
      }

      res.json({
        success: true,
        type: "edits_loaded",
        title: "Edits Loaded",
        message: "Edits retrieved successfully",
        notificationType: "success",
        edits
      });

    } catch (error) {
      console.error('Get edits error:', error);
      res.status(200).json({
        success: false,
        type: "server_error",
        title: "Failed to Load Edits",
        message: error.message,
        notificationType: "error"
      });
    }
  }

  // Enhanced exportPDF method for canvas-only export
  async exportPDF(req, res) {
    try {
      const { sessionId, canvasData, exportMode } = req.body;
      
      if (!sessionId) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Session ID Required",
          message: "Session ID is missing",
          notificationType: "warning"
        });
      }

      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const exportFilePath = path.join(sessionDir, 'exported.pdf');

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Load structure to get page dimensions
      const structureFile = path.join(sessionDir, 'structure.json');
      let structure = null;
      try {
        const structureData = await fs.readFile(structureFile, 'utf8');
        structure = JSON.parse(structureData);
      } catch (error) {
        console.log('No structure file found');
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "PDF Structure Not Found",
          message: "PDF structure not found. Please re-upload the PDF.",
          notificationType: "error"
        });
      }

      console.log(`Exporting ${structure.pages.length} pages in ${exportMode || 'canvas-only'} mode`);

      // Process each page
      for (let pageNum = 1; pageNum <= structure.pages.length; pageNum++) {
        const pageIndex = pageNum - 1;
        const pageStructure = structure.pages[pageIndex];
        
        if (!pageStructure) continue;

        // Create a page with the same dimensions as original
        const page = pdfDoc.addPage([pageStructure.width, pageStructure.height]);
        
        // Check if we have canvas data for this page
        const pageCanvasData = canvasData && canvasData[pageNum];
        
        if (pageCanvasData && pageCanvasData.dataURL) {
          // Use ONLY the canvas data (no original PDF background)
          await this.embedCanvasAsPage(page, pageCanvasData.dataURL, pageStructure.width, pageStructure.height);
          console.log(`Page ${pageNum}: Used canvas-only data`);
        } else {
          // Fallback: white background with message
          page.drawRectangle({
            x: 0,
            y: 0,
            width: pageStructure.width,
            height: pageStructure.height,
            color: rgb(1, 1, 1),
          });
          
          // Add a message indicating no canvas data
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          page.drawText('No canvas data available for this page', {
            x: 50,
            y: pageStructure.height / 2,
            size: 12,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });
          
          console.log(`Page ${pageNum}: Used fallback (no canvas data)`);
        }
      }

      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(exportFilePath, pdfBytes);

      console.log('PDF exported successfully with canvas-only rendering');
      
      res.json({
        success: true,
        type: "export_success",
        title: "PDF Exported Successfully",
        message: "PDF has been exported successfully",
        notificationType: "success",
        downloadUrl: `/api/tools/pdf-editor/download/${sessionId}`
      });

    } catch (error) {
      console.error('Export PDF error:', error);
      res.status(200).json({
        success: false,
        type: "server_error",
        title: "Export Failed",
        message: error.message,
        notificationType: "error"
      });
    }
  }

  // Embed canvas as entire page
  async embedCanvasAsPage(page, dataURL, width, height) {
    try {
      if (!dataURL || !dataURL.startsWith('data:image')) {
        console.warn('Invalid canvas data URL');
        return;
      }

      const base64Data = dataURL.split(',')[1];
      if (!base64Data) {
        console.warn('No base64 data in canvas data URL');
        return;
      }

      const imageBuffer = Buffer.from(base64Data, 'base64');
      const pdfDoc = page.doc;
      
      let image;
      if (dataURL.includes('image/png')) {
        image = await pdfDoc.embedPng(imageBuffer);
      } else if (dataURL.includes('image/jpeg') || dataURL.includes('image/jpg')) {
        image = await pdfDoc.embedJpg(imageBuffer);
      } else {
        console.warn('Unsupported image type for canvas');
        return;
      }
      
      // Draw the canvas image as the entire page background
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
      
    } catch (error) {
      console.error('Error embedding canvas as page:', error);
      // Fallback: white background
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(1, 1, 1),
      });
    }
  }

  // Fallback: Use original page as image
  async addOriginalPageAsImage(pdfDoc, page, sessionId, pageNum, pageStructure) {
    try {
      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const backgroundPath = path.join(sessionDir, `page-${pageNum}.png`);
      
      if (await fs.access(backgroundPath).then(() => true).catch(() => false)) {
        const backgroundBuffer = await fs.readFile(backgroundPath);
        const backgroundImage = await pdfDoc.embedPng(backgroundBuffer);
        page.drawImage(backgroundImage, {
          x: 0,
          y: 0,
          width: pageStructure.width,
          height: pageStructure.height,
        });
        console.log(`Used background image for page ${pageNum}`);
      } else {
        console.log(`No background image available for page ${pageNum}`);
        // Draw white background as fallback
        page.drawRectangle({
          x: 0,
          y: 0,
          width: pageStructure.width,
          height: pageStructure.height,
          color: rgb(1, 1, 1),
        });
      }
    } catch (error) {
      console.log('Could not load background image for page', pageNum, error.message);
      // Draw white background as final fallback
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageStructure.width,
        height: pageStructure.height,
        color: rgb(1, 1, 1),
      });
    }
  }

  // Apply edits
  async applyEdits(req, res) {
    try {
      const { sessionId, edits } = req.body;
      
      if (!sessionId) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Session ID Required",
          message: "Session ID is missing",
          notificationType: "warning"
        });
      }

      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const editsFile = path.join(sessionDir, 'edits.json');
      
      await fs.writeFile(editsFile, JSON.stringify(edits, null, 2));

      res.json({
        success: true,
        type: "edits_applied",
        title: "Edits Applied",
        message: 'Edits applied successfully',
        notificationType: "success"
      });

    } catch (error) {
      console.error('Apply edits error:', error);
      res.status(200).json({
        success: false,
        type: "server_error",
        title: "Apply Edits Failed",
        message: error.message,
        notificationType: "error"
      });
    }
  }

  // Download edited PDF
  async downloadEdited(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(200).json({
          success: false,
          type: "validation_error",
          title: "Session ID Required",
          message: "Session ID is missing",
          notificationType: "warning"
        });
      }

      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const exportedFilePath = path.join(sessionDir, 'exported.pdf');

      try {
        await fs.access(exportedFilePath);
      } catch (error) {
        return res.status(200).json({
          success: false,
          type: "not_found",
          title: "PDF Not Found",
          message: 'No edited PDF found. Please export first.',
          notificationType: "warning"
        });
      }

      const fileBuffer = await fs.readFile(exportedFilePath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=edited-document.pdf');
      res.send(fileBuffer);

    } catch (error) {
      console.error('Download error:', error);
      res.status(200).json({
        success: false,
        type: "server_error",
        title: "Download Failed",
        message: error.message,
        notificationType: "error"
      });
    }
  }

  // Serve images
  async serveImage(req, res) {
    try {
      const { sessionId, pageNum, imageId } = req.params;
      
      // Placeholder implementation
      const placeholderSvg = '<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#F3F4F6"/><path d="M30 30H70M70 30V70M70 70H30M30 70V30" stroke="#8D8" stroke-width="2"/><text x="50" y="85" text-anchor="middle" fill="#999" font-size="12">Image</text></svg>';
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(placeholderSvg);

    } catch (error) {
      console.error('Serve image error:', error);
      res.status(500).send('Error serving image');
    }
  }
}

const editController = new EditController();
module.exports = editController;