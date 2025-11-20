import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Merge,
  FileType,
  Edit3,
  Lock,
  Minimize2,
  Eye,
} from "lucide-react";
import FileUploadModal from "@/components/FileUploadModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import OrganizeTools from "@/pages/tools/OrganizeTools";
import ConvertTools from "@/pages/tools/ConvertTools";
import EditTools from "@/pages/tools/EditTools";
import SecurityTools from "@/pages/tools/SecurityTools";
import OptimizeTools from "@/pages/tools/OptimizeTools";
import AdvancedTools from "@/pages/tools/AdvancedTools";
import Metatags from "../SEO/metatags";

const ToolsPage = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = [
    { id: "all", name: "All Tools", icon: Zap },
    { id: "organize", name: "Organize", icon: Merge },
    { id: "convert", name: "Convert", icon: FileType },
    { id: "edit", name: "Edit", icon: Edit3 },
    { id: "security", name: "Security", icon: Lock },
    { id: "optimize", name: "Optimize", icon: Minimize2 },
    { id: "advanced", name: "Advanced", icon: Eye },
  ];

  const handleToolClick = (tool) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (tool.id === "edit") {
      navigate("/tools/edit");
    } else {
      setSelectedTool(tool);
      setShowUploadModal(true);
    }
  };

  const renderCategory = () => {
    switch (activeCategory) {
      case "organize":
        return <OrganizeTools handleToolClick={handleToolClick} />;
      case "convert":
        return <ConvertTools handleToolClick={handleToolClick} />;
      case "edit":
        return <EditTools handleToolClick={handleToolClick} />;
      case "security":
        return <SecurityTools handleToolClick={handleToolClick} />;
      case "optimize":
        return <OptimizeTools handleToolClick={handleToolClick} />;
      case "advanced":
        return <AdvancedTools handleToolClick={handleToolClick} />;
      default:
        // "All Tools" tab — render all components together
        return (
          <>
            <OrganizeTools handleToolClick={handleToolClick} />
            <ConvertTools handleToolClick={handleToolClick} />
            <EditTools handleToolClick={handleToolClick} />
            <SecurityTools handleToolClick={handleToolClick} />
            <OptimizeTools handleToolClick={handleToolClick} />
            <AdvancedTools handleToolClick={handleToolClick} />
          </>
        );
    }
  };

  const metaPropsData = {
    title: "Free PDF Tools Online PDF Editor Converter Compressor PDF Works",
    description:
      "Free online PDF tools editor converter compressor merger splitter organizer Free PDF tools online PDF editor converter compressor security optimize advanced tools",
    keyword:
      "free pdf tools, online pdf editor, pdf converter, pdf compressor, pdf merger, pdf splitter, pdf organizer, pdf security, pdf optimize, free pdf editor tools",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/tools",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold gradient-text">PDF Tools 🛠️</h1>
          <p className="text-muted-foreground">
            Choose a tool to get started with your PDF
          </p>
        </motion.div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                {cat.name}
              </Button>
            );
          })}
        </div>

        {renderCategory()}

        {showUploadModal && (
          <FileUploadModal
            tool={selectedTool}
            onClose={() => {
              setShowUploadModal(false);
              setSelectedTool(null);
            }}
          />
        )}
      </div>
    </>
  );
};

export default ToolsPage;
