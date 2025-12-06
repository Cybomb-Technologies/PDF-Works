import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, File, Check, Loader2, Download, Share2, Mail, MessageCircle, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload from '@/components/FileUpload';

const FileUploadModal = ({ tool, onClose }) => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const { user, updateUser } = useAuth();

  const handleFileUploaded = (uploadedFile) => {
    setFiles(prev => [...prev, uploadedFile]);
  };

  const handleProcess = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one file",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      const existingFiles = JSON.parse(localStorage.getItem(`pdfpro_files_${user.id}`) || '[]');
      
      const newFiles = files.map(file => ({
        id: Date.now() + Math.random(),
        name: `${tool.id}_${file.name}`,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        processedWith: tool.name
      }));

      localStorage.setItem(`pdfpro_files_${user.id}`, JSON.stringify([...existingFiles, ...newFiles]));

      const usageKey = tool.id === 'compress' ? 'compressions' : 
                       tool.id.includes('convert') ? 'conversions' : 
                       tool.id === 'sign' ? 'signatures' : 'conversions';

      if (user) {
        updateUser({
          usage: {
            ...user.usage,
            [usageKey]: (user.usage?.[usageKey] || 0) + files.length
          }
        });
      }

      setProcessing(false);
      setProcessed(true);
      toast({
        title: "Success! ✨",
        description: `Your files have been processed with ${tool.name}.`,
      });
    }, 2000);
  };

  const handleShare = (platform) => {
    const text = encodeURIComponent(`Check out this file I processed withpdfworks!`);
    const url = encodeURIComponent(window.location.href);
    let shareUrl = '';

    switch (platform) {
      case 'gmail':
        shareUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=Processed File&body=${text}%0A${url}`;
        break;
      case 'mail':
        shareUrl = `mailto:?subject=Processed File&body=${text}%0A${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      default:
        return;
    }
    window.open(shareUrl, '_blank');
  };

  const renderInitialState = () => (
    <>
      <FileUpload onFileUploaded={handleFileUploaded} multiple={tool.id === 'merge'} />
      {files.length > 0 && (
        <div className="mt-6 space-y-2 max-h-48 overflow-y-auto">
          <h3 className="font-semibold text-foreground">Selected Files:</h3>
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
              <File className="h-5 w-5 text-primary" />
              <span className="flex-1 text-sm font-medium truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 flex gap-3">
        <Button
          onClick={handleProcess}
          disabled={processing || files.length === 0}
          className="flex-1 bg-primary"
        >
          {processing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
          ) : (
            <>
              {React.createElement(tool.icon, { className: "h-4 w-4 mr-2" })}
              {tool.name}
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </>
  );

  const renderProcessedState = () => (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto"
      >
        <Check className="h-12 w-12 text-green-500" />
      </motion.div>
      <h3 className="text-2xl font-bold mt-6">Processing Complete!</h3>
      <p className="text-muted-foreground mt-2 mb-6">Your file is ready. What would you like to do next?</p>
      <div className="space-y-4">
        <Button className="w-full bg-primary" onClick={() => toast({ title: "Download started!" })}>
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Or share via</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleShare('gmail')}><Mail className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => handleShare('whatsapp')}><MessageCircle className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => handleShare('telegram')}><Send className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => handleShare('linkedin')}><Linkedin className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-effect rounded-2xl p-8 max-w-2xl w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                {React.createElement(tool.icon, { className: "h-6 w-6 text-white" })}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{tool.name}</h2>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {processed ? renderProcessedState() : renderInitialState()}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// A placeholder Send icon if not available in lucide-react
const Send = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export default FileUploadModal; 