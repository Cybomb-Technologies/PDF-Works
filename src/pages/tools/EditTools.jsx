import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Scissors, Edit3, PenTool, X } from "lucide-react";
import PDFEditor from "./Edit-tools/TextEditor";
import ImageCrop from "./Edit-tools/ImageCrop";
import FileRename from "./Edit-tools/FileRename";
import ESignature from "./Edit-tools/ESignature";
import Metatags from "../../SEO/metatags";

const tools = [
  {
    id: "pdf-editor",
    name: "PDF Editor",
    description: "Edit, annotate and draw on PDF files",
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
    component: PDFEditor,
  },
  {
    id: "image-crop",
    name: "Image Crop",
    description: "Crop and resize your images instantly",
    icon: Scissors,
    color: "from-emerald-500 to-green-500",
    component: ImageCrop,
  },
  {
    id: "file-rename",
    name: "File Rename",
    description: "Batch rename your files smartly",
    icon: Edit3,
    color: "from-purple-500 to-indigo-500",
    component: FileRename,
  },
  // {
  //   id: "esignature",
  //   name: "E-Signature",
  //   description: "Create digital signatures easily",
  //   icon: PenTool,
  //   color: "from-orange-500 to-red-500",
  //   component: ESignature,
  // },
];

const EditTools = () => {
  const [activeTool, setActiveTool] = useState(null);

  const handleToolClick = (tool) => {
    setActiveTool(tool);
  };

  const closePopup = () => {
    setActiveTool(null);
  };

  const ActiveComponent = activeTool ? activeTool.component : null;

  const metaPropsData = {
    title:
      "Free PDF Editor & Editing Tools | Annotate, Crop, Rename Files - PDF Works",
    description:
      "100% free PDF editing tools. Edit PDF files, annotate documents, crop images, rename files instantly. No registration required, completely free online editing tools with no watermarks.",
    keyword:
      "free pdf editor, edit pdf free, pdf annotation free, free image crop, crop images online free, free file rename, batch rename free, free editing tools, free document editor, no cost editing, free online editor, completely free editor, free pdf annotate, free image editor, free file tools",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/tools/",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="w-full flex justify-start">
        {/* --- Tool Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => handleToolClick(tool)}
                className="glass-effect rounded-2xl p-6 cursor-pointer transition-all group flex flex-col h-full"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{tool.name}</h3>
                <p className="text-sm text-muted-foreground flex-grow">
                  {tool.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* --- Popup Modal --- */}
        <AnimatePresence>
          {activeTool && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 w-[95%] max-w-7xl h-[90vh] overflow-auto"
              >
                {/* Close Button */}
                <button
                  onClick={closePopup}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 z-10"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  {activeTool.name}
                </h2>

                {/* Dynamic Component */}
                {ActiveComponent && <ActiveComponent />}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default EditTools;