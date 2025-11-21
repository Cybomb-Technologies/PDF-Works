import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Palette, Image as ImageIcon, Trash2, Download, Upload, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import FileUpload from '@/components/FileUpload';

const EditPdfPage = () => {
  const [file, setFile] = useState(null);
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState('#000000');
  const [text, setText] = useState("This is a sample paragraph. You can click on the controls to see how they would affect the text. The actual PDF is not being modified in this demo.");
  const [heading, setHeading] = useState("Sample PDF Document");

  const showToast = (title, description, variant) => {
    toast({
      title: title || "🚧 Feature in Action!",
      description: description || "This is a visual demonstration. Full PDF editing functionality is being developed!",
      variant: variant || "default",
    });
  };

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    showToast("File Uploaded!", `${uploadedFile.name} is ready for editing.`);
  };

  const handleDownload = () => {
    showToast("Download Started!", "Your edited PDF is being prepared for download.");
  };

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">Test PDF Editor ✍️</h1>
          <p className="text-muted-foreground mb-8">Upload your PDF to start editing.</p>
          <FileUpload onFileUploaded={handleFileUploaded} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 mb-6"
      >
        <h1 className="text-4xl font-bold gradient-text">PDF Editor ✍️</h1>
        <p className="text-muted-foreground">Visually edit your document. Click on elements to modify them.</p>
      </motion.div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 glass-effect rounded-2xl p-6 self-start"
        >
          <h2 className="text-xl font-bold mb-4">Editing Tools</h2>
          <div className="space-y-6">
            {/* Text Tools */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Type className="h-5 w-5 text-primary" /> Text Properties</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => showToast()}><Bold className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => showToast()}><Italic className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => showToast()}><Underline className="h-4 w-4" /></Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => showToast()}><AlignLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => showToast()}><AlignCenter className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => showToast()}><AlignRight className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Font Size: {fontSize}px</label>
                  <Slider defaultValue={[fontSize]} max={72} min={8} step={1} onValueChange={(val) => { setFontSize(val[0]); }} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Font Color</label>
                  <div className="flex items-center gap-2">
                    <Input type="color" value={fontColor} onChange={(e) => { setFontColor(e.target.value); }} className="w-12 h-10 p-1 bg-secondary" />
                    <Input type="text" value={fontColor} readOnly className="flex-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* Image Tools */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" /> Image Tools</h3>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => showToast()}>Add Image</Button>
                <Button variant="destructive" onClick={() => showToast()}>Remove Image</Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* PDF Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 glass-effect rounded-2xl p-6 flex flex-col items-center justify-center"
        >
          <div className="w-full h-[70vh] bg-background rounded-lg shadow-inner border border-border p-8 overflow-auto">
            <input 
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="text-2xl font-bold mb-4 bg-transparent w-full focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
              style={{ color: fontColor, fontSize: `${fontSize + 8}px` }}
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mb-4 bg-transparent w-full h-40 resize-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
              style={{ color: fontColor, fontSize: `${fontSize}px` }}
            />
            <div className="w-48 h-32 bg-secondary flex items-center justify-center mt-6">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <Button className="mt-6 bg-primary" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Save & Download PDF
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default EditPdfPage;