import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Upload,
  Scissors,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const ImageCrop = () => {
  const [image, setImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [hasSelectedCrop, setHasSelectedCrop] = useState(false);
  const [selectionComplete, setSelectionComplete] = useState(false);
  const [fileSaved, setFileSaved] = useState(false);
  const fileInputRef = useRef(null);
  const imageContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem("token");
  };

  // Function to save cropped image to My Files with authentication
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

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file");
        return;
      }

      setError("");
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(e.target.result);
          setImageDimensions({ width: img.width, height: img.height });
          setCroppedImage(null);
          setDownloadUrl("");
          setShowPreview(false);
          setHasSelectedCrop(false);
          setSelectionComplete(false);
          setCrop({ x: 0, y: 0, width: 0, height: 0 });
          setFileSaved(false);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const getImageDisplayInfo = () => {
    if (
      !imageContainerRef.current ||
      !imageRef.current ||
      !imageDimensions.width
    ) {
      return {
        scaleX: 1,
        scaleY: 1,
        imageRect: { left: 0, top: 0, width: 0, height: 0 },
      };
    }

    const img = imageRef.current;
    const imgRect = img.getBoundingClientRect();
    const containerRect = imageContainerRef.current.getBoundingClientRect();

    return {
      scaleX: imageDimensions.width / imgRect.width,
      scaleY: imageDimensions.height / imgRect.height,
      imageRect: imgRect,
      containerRect: containerRect,
    };
  };

  const isPointInImage = (clientX, clientY) => {
    const { imageRect } = getImageDisplayInfo();
    return (
      clientX >= imageRect.left &&
      clientX <= imageRect.right &&
      clientY >= imageRect.top &&
      clientY <= imageRect.bottom
    );
  };

  const getImageCoordinates = (clientX, clientY) => {
    const { imageRect, scaleX, scaleY } = getImageDisplayInfo();

    const relativeX = clientX - imageRect.left;
    const relativeY = clientY - imageRect.top;

    const originalX = relativeX * scaleX;
    const originalY = relativeY * scaleY;

    return {
      x: Math.max(0, Math.min(originalX, imageDimensions.width)),
      y: Math.max(0, Math.min(originalY, imageDimensions.height)),
    };
  };

  const handleMouseDown = (e) => {
    if (!image) return;

    if (!isPointInImage(e.clientX, e.clientY)) {
      return;
    }

    // If selection is already complete and user clicks again, start new selection
    if (selectionComplete) {
      setSelectionComplete(false);
      setHasSelectedCrop(false);
      setCrop({ x: 0, y: 0, width: 0, height: 0 });
    }

    const startCoords = getImageCoordinates(e.clientX, e.clientY);

    setIsDragging(true);
    setDragStart(startCoords);
    setHasSelectedCrop(true);

    // Start new crop from click position
    setCrop({
      x: startCoords.x,
      y: startCoords.y,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !image || selectionComplete) return;

    if (!isPointInImage(e.clientX, e.clientY)) {
      return;
    }

    const currentCoords = getImageCoordinates(e.clientX, e.clientY);

    const startX = Math.min(dragStart.x, currentCoords.x);
    const startY = Math.min(dragStart.y, currentCoords.y);
    const endX = Math.max(dragStart.x, currentCoords.x);
    const endY = Math.max(dragStart.y, currentCoords.y);

    const width = endX - startX;
    const height = endY - startY;

    const boundedWidth = Math.min(width, imageDimensions.width - startX);
    const boundedHeight = Math.min(height, imageDimensions.height - startY);

    setCrop({
      x: startX,
      y: startY,
      width: Math.max(1, boundedWidth),
      height: Math.max(1, boundedHeight),
    });
  };

  const handleMouseUp = () => {
    if (!isDragging || !image) return;

    setIsDragging(false);

    // Only mark as complete if user actually dragged to create a meaningful selection
    if (crop.width >= 10 && crop.height >= 10) {
      setSelectionComplete(true);
    } else {
      setError("Please select a larger area (minimum 10x10 pixels)");
      setHasSelectedCrop(false);
      setCrop({ x: 0, y: 0, width: 0, height: 0 });
    }
  };

  const handleCrop = async () => {
    if (!image) {
      setError("Please upload an image first");
      return;
    }

    if (!selectionComplete || crop.width < 10 || crop.height < 10) {
      setError(
        "Please select a crop area first by clicking and dragging on the image"
      );
      return;
    }

    setIsProcessing(true);
    setError("");

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = async () => {
      try {
        canvas.width = crop.width;
        canvas.height = crop.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(
          img,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        );

        const croppedDataUrl = canvas.toDataURL("image/png");
        setCroppedImage(croppedDataUrl);
        setDownloadUrl(croppedDataUrl);

        // Convert data URL to blob for saving
        const response = await fetch(croppedDataUrl);
        const blob = await response.blob();

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `cropped-image-${timestamp}.png`;

        // Save to My Files
        try {
          await saveToMyFiles(blob, filename, "image-crop");
        } catch (saveError) {
          // Don't fail the crop operation if saving fails
          console.warn("Failed to save to My Files:", saveError);
        }
      } catch (err) {
        setError("Error cropping image: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      setError("Error loading image");
      setIsProcessing(false);
    };

    img.src = image;
  };

  const handleReset = () => {
    setImage(null);
    setCroppedImage(null);
    setDownloadUrl("");
    setShowPreview(false);
    setError("");
    setImageDimensions({ width: 0, height: 0 });
    setCrop({ x: 0, y: 0, width: 0, height: 0 });
    setHasSelectedCrop(false);
    setSelectionComplete(false);
    setFileSaved(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getDisplayCrop = () => {
    if (!imageDimensions.width || crop.width === 0) return crop;

    const { scaleX, scaleY } = getImageDisplayInfo();

    return {
      x: crop.x / scaleX,
      y: crop.y / scaleY,
      width: crop.width / scaleX,
      height: crop.height / scaleY,
    };
  };

  const getImagePosition = () => {
    if (!imageRef.current) return { left: 0, top: 0, width: 0, height: 0 };

    const img = imageRef.current;
    const container = imageContainerRef.current;
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return {
      left: imgRect.left - containerRect.left,
      top: imgRect.top - containerRect.top,
      width: imgRect.width,
      height: imgRect.height,
    };
  };

  const handleDownload = () => {
    if (!downloadUrl) return;

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = downloadUrl;
    a.download = "cropped-image.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-2xl p-8 max-w-4xl mx-auto"
    >
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mr-4">
          <Scissors className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Image Crop</h2>
          <p className="text-sm text-muted-foreground">
            Click and drag to select crop area, then click Crop Image
          </p>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {downloadUrl ? (
        <div className="text-center mt-8">
          <h3 className="text-lg font-bold mb-4">
            Your cropped image is ready! 🎉
          </h3>

          {/* File Saved Status */}
          {fileSaved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm font-medium">
                ✅ File automatically saved to <strong>My Files</strong> section
              </p>
            </div>
          )}

          {/* Preview Toggle */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
          </div>

          {/* Image Preview */}
          {showPreview && croppedImage && (
            <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
              <h4 className="text-sm font-semibold mb-3 text-center">
                Cropped Image Preview
              </h4>
              <div className="flex justify-center">
                <img
                  src={croppedImage}
                  alt="Cropped Preview"
                  className="max-w-full max-h-96 object-contain border border-gray-200 rounded"
                />
              </div>
            </div>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 transition-all font-semibold"
          >
            <Download className="h-5 w-5 mr-2" />
            Download Image
          </button>

          {/* Start Over Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          {/* File Upload */}
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-400 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors mb-6"
          >
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <p className="font-semibold text-sm">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WebP files
            </p>
            <input
              id="image-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
            />
          </label>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          {image && (
            <>
              {/* Interactive Crop Area */}
              <div className="mb-6">
                <h3 className="font-medium mb-2 text-sm">
                  {selectionComplete
                    ? 'Selection complete! Click "Crop Image" to process'
                    : hasSelectedCrop
                    ? "Drag to adjust your selection, then release to confirm"
                    : "Click and drag on the image to select crop area"}
                </h3>
                <div
                  ref={imageContainerRef}
                  className="relative w-full h-64 border border-gray-300 rounded-lg overflow-hidden cursor-crosshair bg-gray-50 flex items-center justify-center"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    ref={imageRef}
                    src={image}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                  />

                  {/* Image boundary overlay */}
                  <div
                    className="absolute border border-blue-400 pointer-events-none"
                    style={{
                      left: `${getImagePosition().left}px`,
                      top: `${getImagePosition().top}px`,
                      width: `${getImagePosition().width}px`,
                      height: `${getImagePosition().height}px`,
                    }}
                  />

                  {/* Crop overlay - only show when user has started selecting */}
                  {hasSelectedCrop && crop.width > 0 && (
                    <div
                      className={`absolute border-2 border-dashed shadow-lg pointer-events-none ${
                        selectionComplete
                          ? "border-green-500 bg-green-500 bg-opacity-20"
                          : "border-white bg-blue-500 bg-opacity-30"
                      }`}
                      style={{
                        left: `${
                          getDisplayCrop().x + getImagePosition().left
                        }px`,
                        top: `${getDisplayCrop().y + getImagePosition().top}px`,
                        width: `${getDisplayCrop().width}px`,
                        height: `${getDisplayCrop().height}px`,
                      }}
                    >
                      <div
                        className={`absolute -right-1 -bottom-1 w-3 h-3 bg-white border rounded-sm ${
                          selectionComplete
                            ? "border-green-500"
                            : "border-blue-500"
                        }`}
                      />
                      <div
                        className={`absolute -left-1 -top-1 w-3 h-3 bg-white border rounded-sm ${
                          selectionComplete
                            ? "border-green-500"
                            : "border-blue-500"
                        }`}
                      />
                      <div
                        className={`absolute -right-1 -top-1 w-3 h-3 bg-white border rounded-sm ${
                          selectionComplete
                            ? "border-green-500"
                            : "border-blue-500"
                        }`}
                      />
                      <div
                        className={`absolute -left-1 -bottom-1 w-3 h-3 bg-white border rounded-sm ${
                          selectionComplete
                            ? "border-green-500"
                            : "border-blue-500"
                        }`}
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectionComplete
                    ? 'Selection confirmed. Click "Crop Image" to process.'
                    : hasSelectedCrop
                    ? `Selected area: ${Math.round(crop.width)}×${Math.round(
                        crop.height
                      )} pixels - Release mouse to confirm selection`
                    : "Click anywhere on the image and drag to create a selection box"}
                </p>
              </div>

              {/* Crop Info - Only show when user has selected an area */}
              {hasSelectedCrop && crop.width > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Width</p>
                    <p className="font-semibold">{Math.round(crop.width)}px</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Height</p>
                    <p className="font-semibold">{Math.round(crop.height)}px</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Position X</p>
                    <p className="font-semibold">{Math.round(crop.x)}px</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Position Y</p>
                    <p className="font-semibold">{Math.round(crop.y)}px</p>
                  </div>
                </div>
              )}

              {/* Original Image Info */}
              <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-center text-blue-700">
                  Original Image: {imageDimensions.width} ×{" "}
                  {imageDimensions.height} pixels
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleCrop}
                  disabled={
                    isProcessing || !selectionComplete || crop.width < 10
                  }
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all ${
                    isProcessing || !selectionComplete || crop.width < 10
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                  }`}
                >
                  <Scissors className="h-4 w-4" />
                  {isProcessing ? "Processing..." : "Crop Image"}
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ImageCrop;
