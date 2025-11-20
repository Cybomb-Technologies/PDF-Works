import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, PenTool, Eye, EyeOff, RotateCcw } from "lucide-react";
import Metatags from "../../../SEO/metatags";
const API_URL = import.meta.env.VITE_API_URL;

const ESignature = () => {
  const [name, setName] = useState("");
  const [style, setStyle] = useState("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleCreateSignature = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/edit/esignature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          style,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.statusText} - ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err) {
      console.error("Processing failed:", err);
      setError("Failed to create signature. " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setName("");
    setStyle("standard");
    setDownloadUrl(null);
    setError(null);
    setShowPreview(false);
  };

  const metaPropsData = {
    title:
      "Free E-Signature Generator | Create Digital Signatures Online - PDF Works",
    description:
      "100% free online e-signature generator. Create professional digital signatures instantly with multiple styles. No registration required, completely free signature creation tool for documents and PDFs.",
    keyword:
      "free e-signature, digital signature free, create signature online free, free signature generator, electronic signature free, free online signature, free digital signature maker, free signature creator, no cost e-signature, free document signing, completely free signature tool, free professional signature, free signature styles, free pdf signature",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/tools/",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-2xl p-8 max-w-4xl mx-auto"
      >
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mr-4">
            <PenTool className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">E-Signature</h2>
            <p className="text-sm text-muted-foreground">
              Create digital signatures easily
            </p>
          </div>
        </div>

        {downloadUrl ? (
          <div className="text-center mt-8">
            <h3 className="text-lg font-bold mb-4">
              Your signature is ready! 🎉
            </h3>

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

            {/* Signature Preview */}
            {showPreview && (
              <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
                <h4 className="text-sm font-semibold mb-3 text-center">
                  Signature Preview
                </h4>
                <div className="flex justify-center">
                  <img
                    src={downloadUrl}
                    alt="Signature Preview"
                    className="max-w-full max-h-32"
                  />
                </div>
              </div>
            )}

            {/* Download Button */}
            <a
              href={downloadUrl}
              download="signature.png"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 transition-all font-semibold"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Signature
            </a>

            {/* Start Over Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              >
                Create Another Signature
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="space-y-6">
              {/* Signature Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    htmlFor="signature-name"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="signature-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 text-gray-900 bg-white"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    htmlFor="signature-style"
                  >
                    Signature Style
                  </label>
                  <select
                    id="signature-style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 text-gray-900 bg-white"
                  >
                    <option value="standard">Standard</option>
                    <option value="cursive">Cursive</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
              </div>

              {/* Style Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 border rounded-lg">
                  <div className="font-medium">Standard</div>
                  <div className="text-muted-foreground">
                    Clean and professional look
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium">Cursive</div>
                  <div className="text-muted-foreground">
                    Elegant handwritten style
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium">Formal</div>
                  <div className="text-muted-foreground">
                    Bold and official appearance
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleCreateSignature}
                  disabled={isProcessing || !name.trim()}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all ${
                    isProcessing || !name.trim()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  }`}
                >
                  <PenTool className="h-4 w-4" />
                  {isProcessing ? "Creating..." : "Create Signature"}
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default ESignature;
