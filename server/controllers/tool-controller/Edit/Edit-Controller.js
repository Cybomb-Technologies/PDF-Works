// controllers/tool-controller/Edit/Edit-Controller.js
const path = require('path');
const fs = require('fs').promises;
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
const { createCanvas } = require('canvas');

// Configure PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, '../../../node_modules/pdfjs-dist/build/pdf.worker.js');

class EditController {
  constructor() {
    console.log('EditController initialized');
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

  // Upload PDF and extract structure
  async uploadPDF(req, res) {
    console.log('uploadPDF method called');
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          error: 'Only PDF files are allowed'
        });
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

      console.log('PDF processing completed');

      res.json({
        success: true,
        sessionId,
        totalPages: pdfStructure.pages.length,
        structure: pdfStructure,
        message: 'PDF uploaded and processed successfully'
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

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
        return res.status(404).json({ error: 'Background image not found' });
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
        return res.status(400).json({
          success: false,
          error: 'Session ID missing'
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
        structure
      });

    } catch (error) {
      console.error('Get structure error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update text content
  async updateText(req, res) {
    try {
      const { sessionId, elementId, newContent } = req.body;
      
      if (!sessionId || !elementId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID and element ID are required'
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
        message: 'Text updated successfully'
      });

    } catch (error) {
      console.error('Update text error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get saved edits
  async getEdits(req, res) {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID missing'
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
        edits
      });

    } catch (error) {
      console.error('Get edits error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Export to PDF with canvas rendering
  async exportPDF(req, res) {
    try {
      const { sessionId, canvasData } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID missing'
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
        return res.status(400).json({
          success: false,
          error: 'PDF structure not found'
        });
      }

      console.log(`Exporting ${structure.pages.length} pages with canvas data`);

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
          // Embed the canvas image as the entire page
          await this.embedCanvasAsPage(page, pageCanvasData.dataURL, pageStructure.width, pageStructure.height);
          console.log(`Page ${pageNum}: Used canvas data`);
        } else {
          // Fallback: use original PDF page as image
          await this.addOriginalPageAsImage(pdfDoc, page, sessionId, pageNum, pageStructure);
          console.log(`Page ${pageNum}: Used original page as fallback`);
        }
      }

      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(exportFilePath, pdfBytes);

      console.log('PDF exported successfully with canvas rendering');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=edited-document.pdf');
      res.send(Buffer.from(pdfBytes));

    } catch (error) {
      console.error('Export PDF error:', error);
      res.status(500).json({
        success: false,
        error: error.message
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
        return res.status(400).json({
          success: false,
          error: 'Session ID missing'
        });
      }

      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const editsFile = path.join(sessionDir, 'edits.json');
      
      await fs.writeFile(editsFile, JSON.stringify(edits, null, 2));

      res.json({
        success: true,
        message: 'Edits applied successfully'
      });

    } catch (error) {
      console.error('Apply edits error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Download edited PDF
  async downloadEdited(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID missing'
        });
      }

      const sessionDir = path.join(__dirname, '../../../uploads/sessions', sessionId);
      const exportedFilePath = path.join(sessionDir, 'exported.pdf');

      try {
        await fs.access(exportedFilePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: 'No edited PDF found. Please export first.'
        });
      }

      const fileBuffer = await fs.readFile(exportedFilePath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=edited-document.pdf');
      res.send(fileBuffer);

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        error: error.message
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