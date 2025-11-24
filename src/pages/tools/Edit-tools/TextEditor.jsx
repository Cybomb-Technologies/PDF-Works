import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  Upload,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Type,
  Image as ImageIcon,
  Edit,
  MousePointer,
  RefreshCcw,
  PenTool,
  Square,
  Circle,
  Triangle,
  Minus,
  X,
  Move,
  Bold,
  Italic,
  Underline,
  Highlighter,
  Strikethrough,
  Search,
  Replace,
  Palette,
  Copy,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import Metatags from "../../../SEO/metatags";
import { useNotification } from "@/contexts/NotificationContext";

const API_URL = import.meta.env.VITE_API_URL;

// Import all available fonts from your lib/fonts directory
const AVAILABLE_FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS",
  "Lucida Sans",
  "Palatino",
  "Garamond",
  "Bookman",
  "Avant Garde",
  "Brush Script MT",
  "Copperplate",
];

// Font pre-loader component
const FontPreloader = () => {
  useEffect(() => {
    const loadFonts = async () => {
      const loadPromises = AVAILABLE_FONTS.map((fontFamily) => {
        return new Promise((resolve) => {
          const div = document.createElement("div");
          div.innerHTML = "Font Load Test";
          div.style.position = "absolute";
          div.style.left = "-9999px";
          div.style.top = "-9999px";
          div.style.fontFamily = fontFamily;
          div.style.fontSize = "16px";
          div.style.opacity = "0";
          document.body.appendChild(div);

          setTimeout(() => {
            document.body.removeChild(div);
            resolve();
          }, 100);
        });
      });

      await Promise.all(loadPromises);
    };

    loadFonts();
  }, []);

  return null;
};

const PDFEditor = () => {
  const [status, setStatus] = useState("upload");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [activeTool, setActiveTool] = useState("select");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfStructure, setPdfStructure] = useState({
    pages: [],
    metadata: {},
    fonts: {},
    images: {},
  });
  const [selectedElement, setSelectedElement] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [edits, setEdits] = useState({});
  const [userElements, setUserElements] = useState({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [signature, setSignature] = useState("");
  const [showSignaturePopup, setShowSignaturePopup] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signaturePaths, setSignaturePaths] = useState([]);
  const [fileSaved, setFileSaved] = useState(false);

  // New state variables for enhanced features
  const [textFormat, setTextFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontSize: 16,
    fontFamily: "Arial",
    color: "#000000",
    highlight: "transparent",
  });
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [annotationColor, setAnnotationColor] = useState("#FF0000");
  const [shapeColor, setShapeColor] = useState("#000000");
  const [editHistory, setEditHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const fileInputRef = useRef();
  const canvasRef = useRef();
  const containerRef = useRef();
  const drawingCanvasRef = useRef();
  const signatureCanvasRef = useRef();
  const findInputRef = useRef();

  const { showNotification } = useNotification();

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem("token");
  };

  // Save to Edit model function with proper error handling
  const saveToEditModel = async (fileBlob, filename, editType, originalName, metadata = {}) => {
    try {
      const token = getToken();
      if (!token) {
        if (showNotification) {
          showNotification({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to save files',
            duration: 5000
          });
        }
        return { success: false, error: "Please log in to save files" };
      }

      const formData = new FormData();
      formData.append("file", fileBlob, filename);
      formData.append("originalName", originalName);
      
      if (metadata) {
        Object.keys(metadata).forEach(key => {
          formData.append(key, typeof metadata[key] === 'object' ? JSON.stringify(metadata[key]) : metadata[key]);
        });
      }

      let endpoint = "";
      switch (editType) {
        case "pdf-edit":
          endpoint = "/save-pdf-edit";
          break;
        case "image-crop":
          endpoint = "/save-image-crop";
          break;
        case "file-rename":
          endpoint = "/save-file-rename";
          break;
        default:
          return { success: false, error: "Invalid edit type" };
      }

      const response = await fetch(`${API_URL}/api/tools/pdf-editor${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // First parse the response
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid server response');
      }

      console.log('Save image crop response:', result);

      // Handle limit exceeded response
      if (result.type === 'limit_exceeded') {
        return {
          success: false,
          type: 'limit_exceeded',
          title: result.title,
          message: result.message || result.reason,
          currentUsage: result.currentUsage,
          limit: result.limit,
          upgradeRequired: result.upgradeRequired
        };
      }

      if (!response.ok) {
        throw new Error(result.error || `Failed to save: ${response.status}`);
      }

      return result;

    } catch (error) {
      console.error("Save to Edit model error:", error);
      return { success: false, error: error.message };
    }
  };

  // Function to save cropped image to My Files with authentication (from code 1)
  const saveToMyFiles = async (fileBlob, filename, toolUsed) => {
    try {
      // Get token from localStorage
      const token = getToken();

      if (!token) {
        return { success: false, error: "Please log in to save files" };
      }

      // Convert blob to base64 for sending to backend
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          const base64data = reader.result;

          try {
            const saveResponse = await fetch(
              `${API_URL}/api/files/save-converted`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  originalName: filename,
                  fileBuffer: base64data,
                  mimetype: fileBlob.type,
                  toolUsed: toolUsed,
                }),
              }
            );

            if (!saveResponse.ok) {
              if (saveResponse.status === 401) {
                localStorage.removeItem("token");
                resolve({
                  success: false,
                  error: "Session expired. Please log in again.",
                });
                return;
              }
              throw new Error(`Failed to save file: ${saveResponse.status}`);
            }

            const saveResult = await saveResponse.json();

            if (saveResult.success) {
              setFileSaved(true);
              resolve(saveResult);
            } else {
              resolve({ success: false, error: saveResult.error });
            }
          } catch (error) {
            resolve({ success: false, error: error.message });
          }
        };

        reader.onerror = () => {
          resolve({ success: false, error: "File reading failed" });
        };

        reader.readAsDataURL(fileBlob);
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // File upload handler
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      if (showNotification) {
        showNotification({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Please select a PDF file.',
          duration: 5000
        });
      }
      return;
    }

    setIsProcessing(true);
    setStatus("processing");
    setLoadingProgress(0);

    if (showNotification) {
      showNotification({
        type: 'info',
        title: 'Uploading PDF',
        message: 'Processing your PDF file...',
        duration: 0,
        autoClose: false
      });
    }

    try {
      const formData = new FormData();
      formData.append("pdfFile", file);

      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Get token for authentication
      const token = getToken();
      
      // Prepare headers with authorization if token exists
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/tools/pdf-editor/upload`, {
        method: "POST",
        headers: headers,
        body: formData,
      });

      clearInterval(progressInterval);

      // First, try to parse the response as JSON
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid server response');
      }

      console.log('Upload response:', responseData);

      // Handle different response types
      if (responseData.type === 'limit_exceeded') {
        // This is a limit exceeded response
        if (showNotification) {
          showNotification({
            type: 'error',
            title: responseData.title || 'Usage Limit Reached',
            message: responseData.message || responseData.reason,
            duration: 8000,
            currentUsage: responseData.currentUsage,
            limit: responseData.limit,
            upgradeRequired: responseData.upgradeRequired,
            action: responseData.upgradeRequired ? {
              label: 'Upgrade Plan',
              onClick: () => window.open('/pricing', '_blank'),
              external: true
            } : null
          });
        }
        return;
      }

      if (!response.ok) {
        // Handle authentication error
        if (response.status === 401) {
          if (showNotification) {
            showNotification({
              type: 'error',
              title: 'Authentication Required',
              message: 'Please log in to use PDF Editor features',
              duration: 5000
            });
          }
          return;
        }
        
        // Handle other errors
        throw new Error(responseData.error || `Upload failed: ${response.status}`);
      }

      // Success case
      if (responseData.success) {
        setSessionId(responseData.sessionId);
        setTotalPages(responseData.totalPages);
        setPdfStructure(responseData.structure);
        setCurrentPage(1);
        setLoadingProgress(100);

        // Load saved edits for this session
        loadSavedEdits(responseData.sessionId);

        setTimeout(() => {
          setStatus("editor");
          renderCurrentPage();
          
          if (showNotification) {
            showNotification({
              type: 'success',
              title: 'PDF Ready for Editing! 🎉',
              message: 'Your PDF has been processed and is ready for editing',
              duration: 5000
            });
          }
        }, 500);
      } else {
        throw new Error(responseData.error || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      
      // Only show notification if it's not a limit exceeded error (already handled above)
      if (!err.message.includes('Usage Limit Reached') && !err.message.includes('limit_exceeded')) {
        if (showNotification) {
          showNotification({
            type: 'error',
            title: 'Upload Failed',
            message: "Error processing PDF: " + err.message,
            duration: 5000
          });
        }
      }
      
      setStatus("upload");
    } finally {
      setIsProcessing(false);
      setLoadingProgress(0);
    }
  };

  // Load saved edits from session
  const loadSavedEdits = async (sessionId) => {
    try {
      const token = getToken();
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/api/tools/pdf-editor/get-edits`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ sessionId }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.edits) {
          setEdits(result.edits.text || {});
          setUserElements(result.edits.elements || {});
        }
      }
    } catch (error) {
      console.error("Error loading saved edits:", error);
    }
  };

  // Save current state to history
  const saveToHistory = () => {
    const currentState = {
      edits: { ...edits },
      userElements: { ...userElements },
      timestamp: Date.now(),
    };

    setEditHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex((prev) => prev + 1);
  };

  // Undo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousState = editHistory[historyIndex - 1];
      setEdits(previousState.edits);
      setUserElements(previousState.userElements);
      setHistoryIndex((prev) => prev - 1);
      renderCurrentPage();
      
      if (showNotification) {
        showNotification({
          type: 'info',
          title: 'Undo',
          message: 'Previous action undone',
          duration: 2000
        });
      }
    }
  };

  // Redo functionality
  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      const nextState = editHistory[historyIndex + 1];
      setEdits(nextState.edits);
      setUserElements(nextState.userElements);
      setHistoryIndex((prev) => prev + 1);
      renderCurrentPage();
      
      if (showNotification) {
        showNotification({
          type: 'info',
          title: 'Redo',
          message: 'Action redone',
          duration: 2000
        });
      }
    }
  };

  // Render current page with all elements
  const renderCurrentPage = () => {
    if (!canvasRef.current || !pdfStructure.pages[currentPage - 1]) return;

    const pageStructure = pdfStructure.pages[currentPage - 1];
    const canvas = canvasRef.current;

    // Clear canvas
    canvas.innerHTML = "";

    // Set canvas dimensions exactly as the PDF page
    canvas.style.width = `${pageStructure.width}px`;
    canvas.style.height = `${pageStructure.height}px`;
    canvas.style.position = "relative";
    canvas.style.background = "white";
    canvas.style.overflow = "hidden";
    canvas.style.boxSizing = "border-box";

    // Add background image
    const backgroundImg = document.createElement("img");
    backgroundImg.src = `${API_URL}/api/tools/pdf-editor/background/${sessionId}/page-${currentPage}.png`;
    backgroundImg.style.position = "absolute";
    backgroundImg.style.top = "0";
    backgroundImg.style.left = "0";
    backgroundImg.style.width = "100%";
    backgroundImg.style.height = "100%";
    backgroundImg.style.pointerEvents = "none";
    backgroundImg.style.zIndex = "1";
    backgroundImg.style.objectFit = "contain";
    canvas.appendChild(backgroundImg);

    // Add editable text overlays
    if (pageStructure.elements && pageStructure.elements.text) {
      pageStructure.elements.text.forEach((textElement, index) => {
        const textDiv = createTextOverlay(textElement);
        canvas.appendChild(textDiv);
      });
    }

    // Add user-created elements
    const pageElements = userElements[currentPage] || [];
    pageElements.forEach((element, index) => {
      const elementDiv = createUserElement(element);
      canvas.appendChild(elementDiv);
    });

    // Initialize drawing canvas with exact dimensions
    initDrawingCanvas();
  };

  // Enhanced text overlay creation with formatting support
  const createTextOverlay = (textElement) => {
    const div = document.createElement("div");
    div.id = textElement.id;
    div.className = "text-overlay editable";
    div.setAttribute("data-type", "text");
    div.setAttribute("data-original", textElement.originalContent);

    const pos = textElement.position;
    div.style.position = "absolute";
    div.style.left = `${pos.x}px`;
    div.style.top = `${pos.y}px`;
    div.style.width = `${pos.width}px`;
    div.style.height = `${pos.height}px`;
    div.style.zIndex = "10";
    div.style.background = "transparent";
    div.style.border = "none";
    div.style.boxSizing = "border-box";

    const style = textElement.style;
    div.style.fontSize = `${style.fontSize}px`;
    div.style.fontFamily = style.fontFamily;
    div.style.fontWeight = style.fontWeight;
    div.style.color = style.color;
    div.style.textAlign = style.textAlign;
    div.style.lineHeight = style.lineHeight;
    div.style.whiteSpace = style.whiteSpace;
    div.style.pointerEvents = "auto";
    div.style.cursor = "text";
    div.style.padding = "0";
    div.style.margin = "0";

    // Apply text decorations if they exist in edits
    const elementEdits = edits[textElement.id];
    if (elementEdits && typeof elementEdits === "object") {
      div.textContent = elementEdits.content || textElement.content;
      if (elementEdits.bold) div.style.fontWeight = "bold";
      if (elementEdits.italic) div.style.fontStyle = "italic";
      if (elementEdits.underline) div.style.textDecoration = "underline";
      if (elementEdits.strikethrough) div.style.textDecoration = "line-through";
      if (elementEdits.highlight) div.style.background = elementEdits.highlight;
      if (elementEdits.color) div.style.color = elementEdits.color;
      if (elementEdits.fontFamily)
        div.style.fontFamily = elementEdits.fontFamily;
      if (elementEdits.fontSize)
        div.style.fontSize = `${elementEdits.fontSize}px`;
    } else {
      div.textContent = elementEdits || textElement.content;
    }

    div.contentEditable = true;
    div.style.outline = "none";

    div.addEventListener("focus", (e) => {
      setSelectedElement(textElement);
      div.style.background = "rgba(255, 255, 0, 0.2)";
      div.style.border = "1px dashed #666";

      // Update text format state based on current element
      updateTextFormatState(textElement, div);
    });

    div.addEventListener("blur", () => {
      saveTextEdit(textElement.id, getTextEditData(div));
      div.style.background = "transparent";
      div.style.border = "none";
    });

    div.addEventListener("input", () => {
      handleTextEdit(textElement.id, getTextEditData(div));
    });

    div.addEventListener("click", (e) => {
      e.stopPropagation();
      setSelectedElement(textElement);
      updateTextFormatState(textElement, div);
    });

    return div;
  };

  // Get comprehensive text edit data
  const getTextEditData = (element) => {
    const computedStyle = window.getComputedStyle(element);
    return {
      content: element.textContent,
      bold:
        computedStyle.fontWeight === "bold" ||
        computedStyle.fontWeight === "700",
      italic: computedStyle.fontStyle === "italic",
      underline: computedStyle.textDecoration.includes("underline"),
      strikethrough: computedStyle.textDecoration.includes("line-through"),
      highlight: computedStyle.backgroundColor,
      color: computedStyle.color,
      fontFamily: computedStyle.fontFamily,
      fontSize: parseInt(computedStyle.fontSize),
    };
  };

  // Update text format state based on selected element
  const updateTextFormatState = (textElement, element) => {
    const computedStyle = window.getComputedStyle(element);
    setTextFormat({
      bold:
        computedStyle.fontWeight === "bold" ||
        computedStyle.fontWeight === "700",
      italic: computedStyle.fontStyle === "italic",
      underline: computedStyle.textDecoration.includes("underline"),
      fontSize: parseInt(computedStyle.fontSize),
      fontFamily: computedStyle.fontFamily.split(",")[0].replace(/['"]/g, ""),
      color: computedStyle.color,
      highlight:
        computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
          ? computedStyle.backgroundColor
          : "transparent",
    });
  };

  // Apply text formatting to selected element
  const applyTextFormatting = (format) => {
    if (!selectedElement) return;

    const element = document.getElementById(selectedElement.id);
    if (!element) return;

    Object.keys(format).forEach((key) => {
      switch (key) {
        case "bold":
          element.style.fontWeight = format.bold ? "bold" : "normal";
          break;
        case "italic":
          element.style.fontStyle = format.italic ? "italic" : "normal";
          break;
        case "underline":
          element.style.textDecoration = format.underline
            ? "underline"
            : "none";
          break;
        case "fontSize":
          element.style.fontSize = `${format.fontSize}px`;
          break;
        case "fontFamily":
          element.style.fontFamily = format.fontFamily;
          break;
        case "color":
          element.style.color = format.color;
          break;
        case "highlight":
          element.style.background = format.highlight;
          break;
      }
    });

    // Update text format state
    setTextFormat((prev) => ({ ...prev, ...format }));

    // Save the changes
    handleTextEdit(selectedElement.id, getTextEditData(element));
    
    if (showNotification) {
      showNotification({
        type: 'success',
        title: 'Format Applied',
        message: 'Text formatting updated',
        duration: 2000
      });
    }
  };

  // Create user-added elements (shapes, images, signatures)
  const createUserElement = (element) => {
    const div = document.createElement("div");
    div.id = element.id;
    div.className = `user-element ${element.type}`;
    div.setAttribute("data-type", element.type);

    div.style.position = "absolute";
    div.style.left = `${element.x}px`;
    div.style.top = `${element.y}px`;
    div.style.zIndex = "15";
    div.style.pointerEvents = "auto";
    div.style.cursor = "move";
    div.style.boxSizing = "border-box";

    switch (element.type) {
      case "rectangle":
        div.style.width = `${element.width}px`;
        div.style.height = `${element.height}px`;
        div.style.border = `2px solid ${element.color || shapeColor}`;
        div.style.background = element.fill || "transparent";
        break;

      case "circle":
        div.style.width = `${element.width}px`;
        div.style.height = `${element.width}px`;
        div.style.border = `2px solid ${element.color || shapeColor}`;
        div.style.borderRadius = "50%";
        div.style.background = element.fill || "transparent";
        break;

      case "line":
        div.style.width = `${element.width}px`;
        div.style.height = "2px";
        div.style.background = element.color || shapeColor;
        div.style.transform = `rotate(${element.rotation || 0}deg)`;
        break;

      case "signature":
        div.style.width = `${element.width}px`;
        div.style.height = `${element.height}px`;
        if (element.src) {
          div.style.background = `url(${element.src}) no-repeat center center`;
          div.style.backgroundSize = "contain";
        }
        div.style.border = "1px dashed #ccc";
        break;

      case "image":
        div.style.width = `${element.width}px`;
        div.style.height = `${element.height}px`;
        if (element.src) {
          div.style.background = `url(${element.src}) no-repeat center center`;
          div.style.backgroundSize = "contain";
        }
        div.style.border = "1px dashed #ccc";
        break;

      case "text":
        div.style.fontSize = `${element.fontSize || 16}px`;
        div.style.color = element.color || "#000";
        div.style.background = element.highlight || "transparent";
        div.style.padding = "4px";
        div.style.border = "1px dashed #ccc";
        div.style.minWidth = "50px";
        div.style.minHeight = "20px";
        div.style.fontFamily = element.fontFamily || "Arial, sans-serif";
        div.style.fontWeight = element.bold ? "bold" : "normal";
        div.style.fontStyle = element.italic ? "italic" : "normal";
        div.style.textDecoration = element.underline ? "underline" : "none";
        div.textContent = element.text || "Click to edit";
        break;

      case "highlight":
        div.style.width = `${element.width}px`;
        div.style.height = `${element.height}px`;
        div.style.background = element.color || "rgba(255, 255, 0, 0.3)";
        div.style.pointerEvents = "none";
        div.style.zIndex = "5";
        break;

      case "strikeout":
        div.style.width = `${element.width}px`;
        div.style.height = "2px";
        div.style.background = element.color || "#ff0000";
        div.style.top = `${element.y + element.height / 2}px`;
        div.style.pointerEvents = "none";
        div.style.zIndex = "5";
        break;

      case "underline":
        div.style.width = `${element.width}px`;
        div.style.height = "2px";
        div.style.background = element.color || "#0000ff";
        div.style.top = `${element.y + element.height - 2}px`;
        div.style.pointerEvents = "none";
        div.style.zIndex = "5";
        break;
    }

    // Make element draggable
    div.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      setSelectedElement(element);
      startDrag(element, e);
    });

    // Make text elements editable
    if (element.type === "text") {
      div.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        div.contentEditable = true;
        div.focus();
      });

      div.addEventListener("blur", () => {
        div.contentEditable = false;
        updateElementContent(element.id, div.textContent);
      });
    }

    // Add resize handles for resizable elements
    if (
      ["rectangle", "circle", "image", "signature", "text"].includes(
        element.type
      )
    ) {
      addResizeHandles(div, element);
    }

    return div;
  };

  // Initialize drawing canvas
  const initDrawingCanvas = () => {
    if (!canvasRef.current || !drawingCanvasRef.current) return;

    const canvas = canvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const pageStructure = pdfStructure.pages[currentPage - 1];

    if (!pageStructure) return;

    drawingCanvas.width = pageStructure.width;
    drawingCanvas.height = pageStructure.height;

    drawingCanvas.style.position = "absolute";
    drawingCanvas.style.top = "0";
    drawingCanvas.style.left = "0";
    drawingCanvas.style.width = "100%";
    drawingCanvas.style.height = "100%";
    drawingCanvas.style.zIndex = "20";
    drawingCanvas.style.pointerEvents = [
      "draw",
      "highlight",
      "strikeout",
      "underline",
    ].includes(activeTool)
      ? "auto"
      : "none";
    drawingCanvas.style.cursor = [
      "draw",
      "highlight",
      "strikeout",
      "underline",
    ].includes(activeTool)
      ? "crosshair"
      : "default";

    const ctx = drawingCanvas.getContext("2d");
    ctx.strokeStyle = annotationColor;
    ctx.lineWidth = activeTool === "draw" ? 2 : 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  // Add resize handles to elements
  const addResizeHandles = (elementDiv, element) => {
    const handles = ["nw", "ne", "sw", "se"];

    handles.forEach((handle) => {
      const handleDiv = document.createElement("div");
      handleDiv.className = `resize-handle resize-${handle}`;
      handleDiv.style.position = "absolute";
      handleDiv.style.width = "8px";
      handleDiv.style.height = "8px";
      handleDiv.style.background = "#000";
      handleDiv.style.border = "1px solid #fff";
      handleDiv.style.zIndex = "20";
      handleDiv.style.cursor = `${handle}-resize`;

      switch (handle) {
        case "nw":
          handleDiv.style.top = "-4px";
          handleDiv.style.left = "-4px";
          break;
        case "ne":
          handleDiv.style.top = "-4px";
          handleDiv.style.right = "-4px";
          break;
        case "sw":
          handleDiv.style.bottom = "-4px";
          handleDiv.style.left = "-4px";
          break;
        case "se":
          handleDiv.style.bottom = "-4px";
          handleDiv.style.right = "-4px";
          break;
      }

      handleDiv.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        e.preventDefault();
        startResize(element, handle, e);
      });

      elementDiv.appendChild(handleDiv);
    });
  };

  // Start dragging element
  const startDrag = (element, e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - element.x;
    const offsetY = e.clientY - rect.top - element.y;

    const handleMouseMove = (moveEvent) => {
      const newX = moveEvent.clientX - rect.left - offsetX;
      const newY = moveEvent.clientY - rect.top - offsetY;

      updateElementPosition(element.id, newX, newY);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      saveToHistory();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Start resizing element
  const startResize = (element, handle, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;
    const startXPos = element.x;
    const startYPos = element.y;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startXPos;
      let newY = startYPos;

      if (handle.includes("e")) newWidth = Math.max(20, startWidth + deltaX);
      if (handle.includes("w")) {
        newWidth = Math.max(20, startWidth - deltaX);
        newX = startXPos + deltaX;
      }
      if (handle.includes("s")) newHeight = Math.max(20, startHeight + deltaY);
      if (handle.includes("n")) {
        newHeight = Math.max(20, startHeight - deltaY);
        newY = startYPos + deltaY;
      }

      updateElementSizeAndPosition(element.id, newWidth, newHeight, newX, newY);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      saveToHistory();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Update element position
  const updateElementPosition = (elementId, x, y) => {
    setUserElements((prev) => {
      const newElements = { ...prev };
      const pageElements = newElements[currentPage] || [];
      newElements[currentPage] = pageElements.map((el) =>
        el.id === elementId ? { ...el, x, y } : el
      );
      return newElements;
    });
  };

  // Update element size and position
  const updateElementSizeAndPosition = (elementId, width, height, x, y) => {
    setUserElements((prev) => {
      const newElements = { ...prev };
      const pageElements = newElements[currentPage] || [];
      newElements[currentPage] = pageElements.map((el) =>
        el.id === elementId ? { ...el, width, height, x, y } : el
      );
      return newElements;
    });
  };

  // Update element content
  const updateElementContent = (elementId, text) => {
    setUserElements((prev) => {
      const newElements = { ...prev };
      const pageElements = newElements[currentPage] || [];
      newElements[currentPage] = pageElements.map((el) =>
        el.id === elementId ? { ...el, text } : el
      );
      return newElements;
    });
    saveToHistory();
  };

  // Handle canvas click for adding elements at click position
  const handleCanvasClick = (e) => {
    if (activeTool === "select") return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Don't add element if clicking on existing element or resize handle
    if (
      e.target !== canvas &&
      e.target !== drawingCanvasRef.current &&
      !e.target.classList.contains("resize-handle")
    ) {
      return;
    }

    switch (activeTool) {
      case "text":
        addElementAtPosition("text", x, y, {
          text: "New Text",
          fontSize: textFormat.fontSize,
          width: 100,
          height: 30,
          fontFamily: textFormat.fontFamily,
          color: textFormat.color,
          bold: textFormat.bold,
          italic: textFormat.italic,
          underline: textFormat.underline,
        });
        break;
      case "rectangle":
        addElementAtPosition("rectangle", x, y, {
          width: 150,
          height: 100,
          color: shapeColor,
        });
        break;
      case "circle":
        addElementAtPosition("circle", x, y, {
          width: 100,
          height: 100,
          color: shapeColor,
        });
        break;
      case "line":
        addElementAtPosition("line", x, y, {
          width: 150,
          height: 2,
          color: shapeColor,
        });
        break;
      case "highlight":
        addElementAtPosition("highlight", x, y, {
          width: 100,
          height: 20,
          color: annotationColor,
        });
        break;
      case "strikeout":
        addElementAtPosition("strikeout", x, y, {
          width: 100,
          height: 2,
          color: annotationColor,
        });
        break;
      case "underline":
        addElementAtPosition("underline", x, y, {
          width: 100,
          height: 2,
          color: annotationColor,
        });
        break;
    }

    // Reset to select tool after placing element (except for drawing tools)
    if (!["draw", "highlight", "strikeout", "underline"].includes(activeTool)) {
      setActiveTool("select");
    }
    saveToHistory();
  };

  // Add element at specific position
  const addElementAtPosition = (type, x, y, options = {}) => {
    const newElement = {
      id: `${type}-${Date.now()}`,
      type,
      x: x - (options.width || 100) / 2,
      y: y - (options.height || 100) / 2,
      width: options.width || 100,
      height: options.height || 100,
      ...options,
    };

    setUserElements((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newElement],
    }));

    setSelectedElement(newElement);

    // Re-render to show the new element with drag handles
    setTimeout(() => {
      renderCurrentPage();
    }, 0);
    
    if (showNotification) {
      showNotification({
        type: 'success',
        title: 'Element Added',
        message: `${type} added to page ${currentPage}`,
        duration: 2000
      });
    }
  };

  // Handle text editing
  const handleTextEdit = (elementId, newContent) => {
    setEdits((prev) => ({
      ...prev,
      [elementId]: newContent,
    }));
  };

  // Save text edits to backend
  const saveTextEdit = async (elementId, newContent) => {
    try {
      const token = getToken();
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/api/tools/pdf-editor/update-text`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            sessionId,
            elementId,
            newContent,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save text edit");
      }
    } catch (error) {
      console.error("Error saving text edit:", error);
    }
  };

  // Add new element
  const addElement = (type, options = {}) => {
    // Set active tool to the element type so user can click to place it
    setActiveTool(type);
  };

  // Find and replace functionality
  const handleFind = () => {
    if (!findText.trim()) return;

    const results = [];
    const textElements = document.querySelectorAll(".text-overlay.editable");

    textElements.forEach((element) => {
      const text = element.textContent || "";
      if (text.toLowerCase().includes(findText.toLowerCase())) {
        results.push({
          element,
          text: text,
        });
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);

    if (results.length > 0) {
      highlightSearchResult(results[0].element);
      if (showNotification) {
        showNotification({
          type: 'success',
          title: 'Search Results',
          message: `Found ${results.length} matches`,
          duration: 3000
        });
      }
    } else {
      if (showNotification) {
        showNotification({
          type: 'warning',
          title: 'No Results',
          message: 'No matches found for your search',
          duration: 3000
        });
      }
    }
  };

  const handleReplace = () => {
    if (searchResults.length === 0 || currentSearchIndex === -1) return;

    const currentResult = searchResults[currentSearchIndex];
    const element = currentResult.element;

    // Replace text
    const newText = (element.textContent || "").replace(
      new RegExp(findText, "gi"),
      replaceText
    );

    element.textContent = newText;

    // Save the edit
    const elementId = element.id;
    handleTextEdit(elementId, getTextEditData(element));

    // Move to next result
    handleNextResult();
    
    if (showNotification) {
      showNotification({
        type: 'success',
        title: 'Text Replaced',
        message: 'Text replaced successfully',
        duration: 2000
      });
    }
  };

  const handleReplaceAll = () => {
    if (searchResults.length === 0) return;

    searchResults.forEach((result) => {
      const element = result.element;
      const newText = (element.textContent || "").replace(
        new RegExp(findText, "gi"),
        replaceText
      );

      element.textContent = newText;

      // Save the edit
      const elementId = element.id;
      handleTextEdit(elementId, getTextEditData(element));
    });

    setSearchResults([]);
    setCurrentSearchIndex(-1);
    
    if (showNotification) {
      showNotification({
        type: 'success',
        title: 'All Replaced',
        message: 'All occurrences replaced successfully',
        duration: 3000
      });
    }
  };

  const handleNextResult = () => {
    if (searchResults.length === 0) return;

    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    highlightSearchResult(searchResults[nextIndex].element);
  };

  const handlePreviousResult = () => {
    if (searchResults.length === 0) return;

    const prevIndex =
      (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    highlightSearchResult(searchResults[prevIndex].element);
  };

  const highlightSearchResult = (element) => {
    // Remove previous highlights
    document.querySelectorAll(".search-highlight").forEach((el) => {
      el.classList.remove("search-highlight");
      el.style.background = "";
    });

    // Highlight current result
    element.classList.add("search-highlight");
    element.style.background = "rgba(255, 255, 0, 0.5)";
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Duplicate selected element
  const duplicateElement = () => {
    if (!selectedElement) return;

    const newElement = {
      ...selectedElement,
      id: `${selectedElement.type}-${Date.now()}`,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
    };

    setUserElements((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newElement],
    }));

    setSelectedElement(newElement);
    saveToHistory();

    setTimeout(() => {
      renderCurrentPage();
    }, 0);
    
    if (showNotification) {
      showNotification({
        type: 'success',
        title: 'Element Duplicated',
        message: 'Element duplicated successfully',
        duration: 2000
      });
    }
  };

  // Enhanced canvas capture with DOM rendering
  const captureAllPagesAsCanvas = async () => {
    const canvasData = {};
    const originalPage = currentPage;

    // Create a temporary canvas for high-quality rendering
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });

    // High DPI for better quality
    const scaleFactor = 2;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      setCurrentPage(pageNum);

      // Wait for page to render completely
      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvasContainer = canvasRef.current;
      if (!canvasContainer) continue;

      const pageStructure = pdfStructure.pages[pageNum - 1];
      if (!pageStructure) continue;

      // Set high-resolution canvas
      tempCanvas.width = pageStructure.width * scaleFactor;
      tempCanvas.height = pageStructure.height * scaleFactor;

      // Clear with white background
      tempCtx.fillStyle = "white";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Scale context for high DPI
      tempCtx.save();
      tempCtx.scale(scaleFactor, scaleFactor);

      try {
        // Capture the entire canvas DOM including all edits
        await captureCanvasDOM(tempCtx, canvasContainer, pageStructure);
      } catch (error) {
        console.error(`Error capturing page ${pageNum}:`, error);
        // Fallback: draw white page
        tempCtx.fillStyle = "white";
        tempCtx.fillRect(0, 0, pageStructure.width, pageStructure.height);
      }

      tempCtx.restore();

      // Store as high-quality PNG
      canvasData[pageNum] = {
        dataURL: tempCanvas.toDataURL("image/png", 1.0), // Maximum quality
        width: pageStructure.width,
        height: pageStructure.height,
      };

      console.log(`Captured page ${pageNum} with canvas DOM`);
    }

    setCurrentPage(originalPage);
    return canvasData;
  };

  // Capture canvas DOM including all edits
  const captureCanvasDOM = async (ctx, container, pageStructure) => {
    // Get all elements in the container
    const elements = Array.from(container.children);

    // Sort by z-index to render in correct order
    elements.sort((a, b) => {
      const aZ = parseInt(window.getComputedStyle(a).zIndex) || 0;
      const bZ = parseInt(window.getComputedStyle(b).zIndex) || 0;
      return aZ - bZ;
    });

    // Render each element
    for (const element of elements) {
      await renderElementToCanvas(ctx, element, container);
    }
  };

  // Render individual element to canvas
  const renderElementToCanvas = async (ctx, element, container) => {
    const rect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const x = rect.left - containerRect.left;
    const y = rect.top - containerRect.top;
    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) return;

    ctx.save();

    try {
      const computedStyle = window.getComputedStyle(element);

      // Handle different element types
      if (element.classList.contains("text-overlay")) {
        await renderTextElement(
          ctx,
          element,
          x,
          y,
          width,
          height,
          computedStyle
        );
      } else if (element.classList.contains("user-element")) {
        await renderUserElement(
          ctx,
          element,
          x,
          y,
          width,
          height,
          computedStyle
        );
      } else if (element.tagName === "IMG") {
        // Handle background images
        await renderImageElement(ctx, element, x, y, width, height);
      }
    } catch (error) {
      console.error("Error rendering element:", error, element);
    }

    ctx.restore();
  };

  // Render text elements with enhanced font handling
  const renderTextElement = async (
    ctx,
    element,
    x,
    y,
    width,
    height,
    computedStyle
  ) => {
    let textContent = element.textContent || "";
    if (!textContent.trim()) return;

    // Set up text styling
    ctx.font = getCanvasFont(computedStyle);
    ctx.fillStyle = computedStyle.color || "#000000";
    ctx.textAlign = getCanvasTextAlign(computedStyle.textAlign);
    ctx.textBaseline = "top";

    // Handle text transformations
    if (computedStyle.textTransform === "uppercase") {
      textContent = textContent.toUpperCase();
    } else if (computedStyle.textTransform === "lowercase") {
      textContent = textContent.toLowerCase();
    } else if (computedStyle.textTransform === "capitalize") {
      textContent = textContent.replace(/\b\w/g, (l) => l.toUpperCase());
    }

    // Handle line breaks and text wrapping
    const lines = textContent.split("\n");
    const lineHeight =
      parseInt(computedStyle.lineHeight) || parseInt(computedStyle.fontSize);
    const fontSize = parseInt(computedStyle.fontSize);

    // Apply background if any
    if (
      computedStyle.backgroundColor &&
      computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
    ) {
      ctx.fillStyle = computedStyle.backgroundColor;
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = computedStyle.color || "#000000";
    }

    // Draw each line
    lines.forEach((line, index) => {
      if (line.trim()) {
        // Basic text wrapping (simplified)
        const words = line.split(" ");
        let currentLine = "";
        let lineY = y + index * lineHeight;

        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine + words[i] + " ";
          const metrics = ctx.measureText(testLine);

          if (metrics.width > width && i > 0) {
            // Draw current line and start new one
            ctx.fillText(currentLine, x, lineY);
            currentLine = words[i] + " ";
            lineY += lineHeight;
          } else {
            currentLine = testLine;
          }
        }

        // Draw remaining text
        if (currentLine) {
          ctx.fillText(currentLine.trim(), x, lineY);
        }
      }
    });
  };

  // Render user-added elements
  const renderUserElement = async (
    ctx,
    element,
    x,
    y,
    width,
    height,
    computedStyle
  ) => {
    const type = element.getAttribute("data-type");

    switch (type) {
      case "text":
        const textContent = element.textContent || "Text";
        ctx.font = getCanvasFont(computedStyle);
        ctx.fillStyle = computedStyle.color || "#000000";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        // Apply background
        if (
          computedStyle.backgroundColor &&
          computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
        ) {
          ctx.fillStyle = computedStyle.backgroundColor;
          ctx.fillRect(x, y, width, height);
          ctx.fillStyle = computedStyle.color || "#000000";
        }

        ctx.fillText(textContent, x, y);
        break;

      case "rectangle":
        ctx.strokeStyle = computedStyle.borderColor || "#000000";
        ctx.lineWidth = parseInt(computedStyle.borderWidth) || 2;
        ctx.strokeRect(x, y, width, height);

        if (
          computedStyle.backgroundColor &&
          computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
        ) {
          ctx.fillStyle = computedStyle.backgroundColor;
          ctx.fillRect(x, y, width, height);
        }
        break;

      case "circle":
        ctx.strokeStyle = computedStyle.borderColor || "#000000";
        ctx.lineWidth = parseInt(computedStyle.borderWidth) || 2;
        ctx.beginPath();
        ctx.arc(
          x + width / 2,
          y + height / 2,
          Math.min(width, height) / 2,
          0,
          2 * Math.PI
        );
        ctx.stroke();

        if (
          computedStyle.backgroundColor &&
          computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
        ) {
          ctx.fillStyle = computedStyle.backgroundColor;
          ctx.fill();
        }
        break;

      case "line":
        ctx.strokeStyle = computedStyle.backgroundColor || "#000000";
        ctx.lineWidth = parseInt(computedStyle.height) || 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.stroke();
        break;

      case "highlight":
      case "strikeout":
      case "underline":
        ctx.fillStyle =
          computedStyle.backgroundColor || "rgba(255, 255, 0, 0.3)";
        ctx.fillRect(x, y, width, height);
        break;

      case "signature":
      case "image":
        // Handle images and signatures
        await renderElementImage(ctx, element, x, y, width, height);
        break;
    }
  };

  // Helper function to get canvas font string
  const getCanvasFont = (computedStyle) => {
    const fontWeight = computedStyle.fontWeight || "normal";
    const fontSize = computedStyle.fontSize || "16px";
    const fontFamily = computedStyle.fontFamily || "Arial, sans-serif";

    return `${
      computedStyle.fontStyle || "normal"
    } ${fontWeight} ${fontSize} ${fontFamily}`;
  };

  // Helper function to get canvas text alignment
  const getCanvasTextAlign = (cssTextAlign) => {
    const alignMap = {
      left: "left",
      right: "right",
      center: "center",
      justify: "left",
    };
    return alignMap[cssTextAlign] || "left";
  };

  // Render image elements
  const renderImageElement = (ctx, element, x, y, width, height) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, x, y, width, height);
        resolve();
      };
      img.onerror = () => {
        console.log("Image failed to load");
        resolve();
      };
      img.src = element.src;
    });
  };

  // Render element background images
  const renderElementImage = (ctx, element, x, y, width, height) => {
    return new Promise((resolve) => {
      const bgImage = window.getComputedStyle(element).backgroundImage;
      if (bgImage && bgImage !== "none") {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, x, y, width, height);
          resolve();
        };
        img.onerror = () => {
          console.log("Element background image failed to load");
          resolve();
        };

        const urlMatch = bgImage.match(/url\(["']?(.*?)["']?\)/);
        if (urlMatch) {
          img.src = urlMatch[1];
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  };

  // Enhanced export with Edit model saving
  const handleExport = async () => {
    try {
      setIsProcessing(true);

      if (showNotification) {
        showNotification({
          type: 'info',
          title: 'Exporting PDF',
          message: 'Processing your edited PDF...',
          duration: 0,
          autoClose: false
        });
      }

      console.log("Starting canvas-only export...");

      // Capture all pages as canvas data
      const canvasData = await captureAllPagesAsCanvas();

      console.log("Canvas data captured, sending to server...");

      // Export with canvas data only (no original PDF merging)
      const response = await fetch(`${API_URL}/api/tools/pdf-editor/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          sessionId,
          canvasData,
          exportMode: "canvas-only",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      const blob = await response.blob();
      
      // Save to Edit model
      const saveResult = await saveToEditModel(
        blob, 
        `edited-document-${sessionId}.pdf`, 
        "pdf-edit",
        "original-document.pdf",
        { sessionId, totalPages }
      );

      if (saveResult.success) {
        setFileSaved(true);
        if (showNotification) {
          showNotification({
            type: 'success',
            title: 'PDF Exported Successfully! 🎉',
            message: 'PDF exported and saved to your edit history!',
            duration: 5000
          });
        }
      } else if (saveResult.type === 'limit_exceeded') {
        // Limit error already handled in saveToEditModel
        return;
      } else {
        // Fallback to My Files save
        const myFilesResult = await saveToMyFiles(
          blob,
          `edited-document-${sessionId}.pdf`,
          "PDF Editor"
        );
        
        if (myFilesResult.success) {
          setFileSaved(true);
          if (showNotification) {
            showNotification({
              type: 'success',
              title: 'PDF Exported Successfully! 🎉',
              message: 'PDF exported and saved to My Files!',
              duration: 5000
            });
          }
        } else {
          if (showNotification) {
            showNotification({
              type: 'warning',
              title: 'Export Completed',
              message: 'PDF exported but failed to save to history: ' + myFilesResult.error,
              duration: 5000
            });
          }
        }
      }

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited-document-${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Export error:", error);
      if (showNotification) {
        showNotification({
          type: 'error',
          title: 'Export Failed',
          message: "Error exporting PDF: " + error.message,
          duration: 5000
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply all edits and save to backend
  const handleApplyEdits = async () => {
    try {
      setIsProcessing(true);

      if (showNotification) {
        showNotification({
          type: 'info',
          title: 'Saving Edits',
          message: 'Applying your changes...',
          duration: 0,
          autoClose: false
        });
      }

      // Collect all current text edits from the DOM
      const textOverlays = document.querySelectorAll(".text-overlay.editable");
      const currentEdits = { ...edits };

      textOverlays.forEach((overlay) => {
        const elementId = overlay.id;
        const currentContent = getTextEditData(overlay);
        const originalContent = overlay.getAttribute("data-original");

        if (
          elementId &&
          JSON.stringify(currentContent) !==
            JSON.stringify({ content: originalContent })
        ) {
          currentEdits[elementId] = currentContent;
        }
      });

      // Update state with current edits
      setEdits(currentEdits);

      const token = getToken();
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/api/tools/pdf-editor/apply-edits`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            sessionId,
            edits: {
              text: currentEdits,
              elements: userElements,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to apply edits");
      }

      const result = await response.json();

      if (result.success) {
        if (showNotification) {
          showNotification({
            type: 'success',
            title: 'Edits Saved! ✅',
            message: 'All edits applied and saved successfully!',
            duration: 3000
          });
        }
        console.log("Edits saved:", {
          textEdits: Object.keys(currentEdits).length,
          userElements: Object.keys(userElements).length,
        });
      } else {
        throw new Error(result.error || "Failed to apply edits");
      }
    } catch (error) {
      console.error("Apply edits error:", error);
      if (showNotification) {
        showNotification({
          type: 'error',
          title: 'Save Failed',
          message: "Error applying edits: " + error.message,
          duration: 5000
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Signature drawing functions
  const startSignatureDrawing = (e) => {
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawingSignature(true);
    setSignaturePaths((prev) => [...prev, [{ x, y }]]);

    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const drawSignature = (e) => {
    if (!isDrawingSignature) return;

    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSignaturePaths((prev) => {
      const newPaths = [...prev];
      newPaths[newPaths.length - 1].push({ x, y });
      return newPaths;
    });

    const ctx = canvas.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopSignatureDrawing = () => {
    setIsDrawingSignature(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignaturePaths([]);
    
    if (showNotification) {
      showNotification({
        type: 'info',
        title: 'Signature Cleared',
        message: 'Signature drawing area cleared',
        duration: 2000
      });
    }
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    const dataURL = canvas.toDataURL();

    addElementAtPosition("signature", 200, 150, {
      src: dataURL,
      width: 200,
      height: 100,
    });

    setShowSignaturePopup(false);
    clearSignature();
    saveToHistory();
    
    if (showNotification) {
      showNotification({
        type: 'success',
        title: 'Signature Added',
        message: 'Signature added to document',
        duration: 3000
      });
    }
  };

  // Add signature from text
  const addTextSignature = () => {
    if (!signature.trim()) {
      if (showNotification) {
        showNotification({
          type: 'error',
          title: 'Signature Required',
          message: 'Please enter your signature',
          duration: 3000
        });
      }
      return;
    }

    addElementAtPosition("text", 200, 150, {
      text: signature,
      fontSize: 24,
      fontFamily: "cursive",
      width: signature.length * 15,
      height: 30,
    });
    setSignature("");
    saveToHistory();
    
    if (showNotification) {
      showNotification({
        type: 'success',
        title: 'Text Signature Added',
        message: 'Text signature added to document',
        duration: 3000
      });
    }
  };

  // Add image
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      addElementAtPosition("image", 200, 150, {
        src: e.target.result,
        width: 150,
        height: 150,
      });
      saveToHistory();
      
      if (showNotification) {
        showNotification({
          type: 'success',
          title: 'Image Added',
          message: 'Image added to document',
          duration: 3000
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Drawing functions
  const startDrawing = (e) => {
    if (!["draw", "highlight", "strikeout", "underline"].includes(activeTool))
      return;

    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentPath([{ x, y }]);

    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = annotationColor;

    if (activeTool === "highlight") {
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 20;
    } else {
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = activeTool === "draw" ? 2 : 3;
    }
  };

  const draw = (e) => {
    if (
      !isDrawing ||
      !["draw", "highlight", "strikeout", "underline"].includes(activeTool)
    )
      return;

    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPath((prev) => [...prev, { x, y }]);

    const ctx = canvas.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);

    // Save drawing as permanent element
    if (currentPath.length > 1) {
      const canvas = drawingCanvasRef.current;
      const dataURL = canvas.toDataURL();

      addElementAtPosition("image", 200, 150, {
        src: dataURL,
        width: 200,
        height: 150,
      });

      // Clear drawing canvas
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;
    }

    saveToHistory();
  };

  // Reset editor
  const handleReset = () => {
    setStatus("upload");
    setCurrentPage(1);
    setTotalPages(0);
    setPdfStructure({ pages: [], metadata: {}, fonts: {}, images: {} });
    setSessionId(null);
    setSelectedElement(null);
    setEdits({});
    setUserElements({});
    setEditHistory([]);
    setHistoryIndex(-1);
    setFileSaved(false);

    if (canvasRef.current) {
      canvasRef.current.innerHTML = "";
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    if (showNotification) {
      showNotification({
        type: 'info',
        title: 'Editor Reset',
        message: 'Ready to upload a new PDF',
        duration: 3000
      });
    }
  };

  // Navigation
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Zoom
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.3));

  // Re-render when page changes or tools change
  useEffect(() => {
    if (status === "editor") {
      renderCurrentPage();
    }
  }, [currentPage, status, userElements]);

  // Update drawing canvas when tool changes
  useEffect(() => {
    if (drawingCanvasRef.current) {
      drawingCanvasRef.current.style.pointerEvents = [
        "draw",
        "highlight",
        "strikeout",
        "underline",
      ].includes(activeTool)
        ? "auto"
        : "none";
      drawingCanvasRef.current.style.cursor = [
        "draw",
        "highlight",
        "strikeout",
        "underline",
      ].includes(activeTool)
        ? "crosshair"
        : "default";
      initDrawingCanvas();
    }
  }, [activeTool, annotationColor]);

  // Focus find input when find/replace dialog opens
  useEffect(() => {
    if (showFindReplace && findInputRef.current) {
      findInputRef.current.focus();
    }
  }, [showFindReplace]);

  const metaPropsData = {
    title:
      "Free PDF Editor Online | Edit PDF Text, Images & Annotations - PDF Works",
    description:
      "100% free online PDF editor. Edit PDF text, add images, draw annotations, insert signatures, highlight text, and more. No registration required, completely free PDF editing tool with advanced features.",
    keyword:
      "free pdf editor, edit pdf online free, free pdf editor online, free pdf text editor, free pdf annotation tool, free pdf drawing tool, free pdf signature, free pdf highlight, free pdf markup, no cost pdf editor, free online pdf editing, completely free pdf editor, free document editor, free pdf tools, free pdf editor with signature",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/tools/",
  };

  const isLoggedIn = !!getToken();

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen bg-gray-50">
        <FontPreloader />

        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PDF Editor</h1>
                <p className="text-gray-600">Edit PDFs with advanced tools</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {sessionId && (
                  <span className="bg-gray-100 px-3 py-1 rounded">
                    Session: {sessionId?.substring(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Find & Replace Popup */}
        {showFindReplace && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Find & Replace</h3>
                <button
                  onClick={() => setShowFindReplace(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Find
                  </label>
                  <input
                    ref={findInputRef}
                    type="text"
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter text to find"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Replace With
                  </label>
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter replacement text"
                  />
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    {searchResults.length > 0
                      ? `${currentSearchIndex + 1} of ${
                          searchResults.length
                        } results`
                      : "No results found"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePreviousResult}
                      disabled={searchResults.length === 0}
                      className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNextResult}
                      disabled={searchResults.length === 0}
                      className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleFind}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Find
                  </button>
                  <button
                    onClick={handleReplace}
                    disabled={searchResults.length === 0}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Replace
                  </button>
                  <button
                    onClick={handleReplaceAll}
                    disabled={searchResults.length === 0}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Replace All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signature Popup */}
        {showSignaturePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Draw Your Signature</h3>
                <button
                  onClick={() => setShowSignaturePopup(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg mb-4">
                <canvas
                  ref={signatureCanvasRef}
                  width={350}
                  height={200}
                  onMouseDown={startSignatureDrawing}
                  onMouseMove={drawSignature}
                  onMouseUp={stopSignatureDrawing}
                  onMouseLeave={stopSignatureDrawing}
                  className="w-full h-50 cursor-crosshair bg-white"
                />
              </div>

              <div className="flex justify-between gap-2">
                <button
                  onClick={clearSignature}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Clear
                </button>
                <button
                  onClick={saveSignature}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Signature
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  Or use text signature:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Enter your signature"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={addTextSignature}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Add Text
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Saved Status */}
        {fileSaved && (
          <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
            <p className="text-green-700 text-sm font-medium">
              ✅ File automatically saved to{' '}
              <strong>{isLoggedIn ? 'Edit History' : 'My Files'}</strong>
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {status === "upload" && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <Upload className="w-16 h-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Upload PDF to Edit
              </h2>
              <p className="text-gray-500 mb-6 text-center">
                Upload a PDF file to start editing with advanced tools
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="w-5 h-5" />
                {isProcessing ? "Processing..." : "Choose PDF File"}
              </button>
            </div>
          )}

          {status === "processing" && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <RefreshCcw className="w-16 h-16 text-blue-600 mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Processing PDF...
              </h2>
              <p className="text-gray-500 mb-4 text-center">
                Preparing PDF for editing
              </p>
              <div className="w-full max-w-md bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{loadingProgress}%</p>
            </div>
          )}

          {status === "editor" && (
            <div className="flex flex-col h-[calc(100vh-200px)]">
              {/* Enhanced Top Toolbar */}
              <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    New PDF
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage <= 1}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage >= totalPages}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Undo/Redo */}
                  <div className="flex items-center gap-1 border-l border-gray-300 pl-4">
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                      title="Undo"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={historyIndex >= editHistory.length - 1}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                      title="Redo"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Find & Replace */}
                  <button
                    onClick={() => setShowFindReplace(true)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Find & Replace
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={zoomOut}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600">
                      {Math.round(scale * 100)}%
                    </span>
                    <button
                      onClick={zoomIn}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleApplyEdits}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Save Edits
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Formatting Toolbar */}
              {selectedElement && selectedElement.type === "text" && (
                <div className="flex items-center gap-4 p-3 bg-white border-b border-gray-200">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        applyTextFormatting({ bold: !textFormat.bold })
                      }
                      className={`p-2 rounded ${
                        textFormat.bold
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        applyTextFormatting({ italic: !textFormat.italic })
                      }
                      className={`p-2 rounded ${
                        textFormat.italic
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        applyTextFormatting({ underline: !textFormat.underline })
                      }
                      className={`p-2 rounded ${
                        textFormat.underline
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      title="Underline"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={textFormat.fontFamily}
                      onChange={(e) =>
                        applyTextFormatting({ fontFamily: e.target.value })
                      }
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {AVAILABLE_FONTS.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>

                    <select
                      value={textFormat.fontSize}
                      onChange={(e) =>
                        applyTextFormatting({
                          fontSize: parseInt(e.target.value),
                        })
                      }
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(
                        (size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Palette className="w-4 h-4 text-gray-600" />
                      <input
                        type="color"
                        value={textFormat.color}
                        onChange={(e) =>
                          applyTextFormatting({ color: e.target.value })
                        }
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        title="Text Color"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <Highlighter className="w-4 h-4 text-gray-600" />
                      <input
                        type="color"
                        value={
                          textFormat.highlight === "transparent"
                            ? "#ffffff"
                            : textFormat.highlight
                        }
                        onChange={(e) =>
                          applyTextFormatting({ highlight: e.target.value })
                        }
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        title="Highlight Color"
                      />
                    </div>
                  </div>

                  <button
                    onClick={duplicateElement}
                    className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Duplicate Element"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                </div>
              )}

              {/* Main Editor Area */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Tools */}
                <div className="w-16 bg-gray-50 border-r border-gray-200 p-2 flex flex-col items-center gap-2">
                  <button
                    onClick={() => setActiveTool("select")}
                    className={`p-3 rounded-lg ${
                      activeTool === "select"
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Select"
                  >
                    <MousePointer className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setActiveTool("text")}
                    className={`p-3 rounded-lg ${
                      activeTool === "text"
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Text"
                  >
                    <Type className="w-5 h-5" />
                  </button>

                  {/* Annotation Tools */}
                  <div className="border-t border-gray-300 my-2 w-full"></div>

                  <button
                    onClick={() => setActiveTool("draw")}
                    className={`p-3 rounded-lg ${
                      activeTool === "draw"
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Draw"
                  >
                    <PenTool className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setActiveTool("highlight")}
                    className={`p-3 rounded-lg ${
                      activeTool === "highlight"
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Highlight"
                  >
                    <Highlighter className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setActiveTool("underline")}
                    className={`p-3 rounded-lg ${
                      activeTool === "underline"
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Underline"
                  >
                    <Underline className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setActiveTool("strikeout")}
                    className={`p-3 rounded-lg ${
                      activeTool === "strikeout"
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Strikeout"
                  >
                    <Strikethrough className="w-5 h-5" />
                  </button>

                  <div className="border-t border-gray-300 my-2 w-full"></div>

                  <button
                    onClick={() => setShowSignaturePopup(true)}
                    className="p-3 text-gray-600 hover:bg-gray-200 rounded-lg"
                    title="Signature"
                  >
                    <Move className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => addElement("rectangle")}
                    className="p-3 text-gray-600 hover:bg-gray-200 rounded-lg"
                    title="Rectangle"
                  >
                    <Square className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => addElement("circle")}
                    className="p-3 text-gray-600 hover:bg-gray-200 rounded-lg"
                    title="Circle"
                  >
                    <Circle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => addElement("line")}
                    className="p-3 text-gray-600 hover:bg-gray-200 rounded-lg"
                    title="Line"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <div className="border-t border-gray-300 my-2 w-full"></div>

                  <button
                    onClick={() =>
                      document.getElementById("image-upload")?.click()
                    }
                    className="p-3 text-gray-600 hover:bg-gray-200 rounded-lg"
                    title="Add Image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-gray-100 overflow-auto p-8 relative">
                  <div
                    ref={containerRef}
                    className="bg-white shadow-lg mx-auto relative"
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: "center top",
                    }}
                  >
                    <div
                      ref={canvasRef}
                      className="pdf-canvas relative"
                      style={{
                        background: "white",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        cursor: activeTool !== "select" ? "crosshair" : "default",
                      }}
                      onClick={handleCanvasClick}
                    />
                    <canvas
                      ref={drawingCanvasRef}
                      className="absolute top-0 left-0"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                  </div>
                </div>

                {/* Right Sidebar - Colors and Properties */}
                <div className="w-80 bg-white border-l border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-700 mb-4">Properties</h3>

                  {/* Active Tool Info */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Active Tool:</strong> {activeTool}
                    </p>
                    {activeTool !== "select" && (
                      <p className="text-xs text-blue-600 mt-1">
                        Click on the document to place the {activeTool}
                      </p>
                    )}
                  </div>

                  {/* Color Palettes */}
                  <div className="space-y-4">
                    {/* Annotation Colors */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">
                        Annotation Color
                      </h4>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          "#FF0000",
                          "#00FF00",
                          "#0000FF",
                          "#FFFF00",
                          "#FF00FF",
                          "#00FFFF",
                          "#000000",
                          "#FFFFFF",
                          "#FFA500",
                          "#800080",
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => setAnnotationColor(color)}
                            className={`w-8 h-8 rounded border-2 ${
                              annotationColor === color
                                ? "border-gray-800"
                                : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={annotationColor}
                        onChange={(e) => setAnnotationColor(e.target.value)}
                        className="w-full mt-2 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>

                    {/* Shape Colors */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">
                        Shape Color
                      </h4>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          "#000000",
                          "#FF0000",
                          "#00FF00",
                          "#0000FF",
                          "#FFFF00",
                          "#FF00FF",
                          "#00FFFF",
                          "#FFA500",
                          "#800080",
                          "#A52A2A",
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => setShapeColor(color)}
                            className={`w-8 h-8 rounded border-2 ${
                              shapeColor === color
                                ? "border-gray-800"
                                : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={shapeColor}
                        onChange={(e) => setShapeColor(e.target.value)}
                        className="w-full mt-2 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">
                      Quick Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addElement("rectangle")}
                        className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        Rectangle
                      </button>
                      <button
                        onClick={() => addElement("circle")}
                        className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        Circle
                      </button>
                      <button
                        onClick={() => addElement("line")}
                        className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        Line
                      </button>
                      <button
                        onClick={() => addElement("text")}
                        className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        Text Box
                      </button>
                    </div>
                  </div>

                  {/* Edit Instructions */}
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 text-sm mb-2">
                      Editing Tools:
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Click on text to edit</li>
                      <li>• Click on empty space to add elements</li>
                      <li>• Drag elements to move them</li>
                      <li>• Use corners to resize elements</li>
                      <li>• Double-click text boxes to edit</li>
                      <li>• Use Ctrl+Z/Ctrl+Y for undo/redo</li>
                      <li>• Save edits before exporting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PDFEditor;