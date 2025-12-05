import React, { useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const FileUpload = ({ onFileUploaded, multiple = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      if (multiple) {
        selectedFiles.forEach((file) => onFileUploaded(file));
      } else {
        onFileUploaded(selectedFiles[0]);
      }
    } 
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      if (multiple) {
        droppedFiles.forEach((file) => onFileUploaded(file));
      } else {
        onFileUploaded(droppedFiles[0]);
      }
    }
  };

  const showCloudImportToast = (service) => {
    toast({
      title: `Import from ${service}`,
      description:
        "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 hover:bg-secondary/50"
        }`}
      >
        <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h3 className="text-lg font-semibold mb-2">
          Drop your file{multiple && "s"} here
        </h3>
        <p className="text-muted-foreground mb-4">or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
          multiple={multiple}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="bg-primary"
        >
          <FileText className="mr-2 h-4 w-4" />
          Select File{multiple && "s"}
        </Button>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground mb-2">Or import from</p>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => showCloudImportToast("Google Drive")}
          >
            Google Drive
          </Button>
          <Button
            variant="outline"
            onClick={() => showCloudImportToast("Dropbox")}
          >
            Dropbox
          </Button>
          <Button
            variant="outline"
            onClick={() => showCloudImportToast("LinkedIn")}
          >
            LinkedIn
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
