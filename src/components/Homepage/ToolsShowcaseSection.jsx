// src/components/sections/ToolsShowcaseSection.jsx
import React from "react";
import { motion } from "framer-motion";
import {
  Merge,
  Split,
  RotateCcw,
  FileText,
  Image,
  Edit3,
  Lock,
  Shield,
  Crop,
  Users,
  Minimize2,
  Code,
  RefreshCw,
  Download,
  Upload,
  Key,
  Eye,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const ToolsShowcaseSection = () => {
  const categories = [
    {
      id: "organize",
      name: "Organize",
      icon: Merge,
      tools: [
        {
          icon: Merge,
          title: "Merge PDFs",
          description: "Combine multiple PDFs into one",
          color: "from-blue-500 to-cyan-500",
        },
        {
          icon: Split,
          title: "Split PDF",
          description: "Extract pages or split by range",
          color: "from-purple-500 to-pink-500",
        },
        {
          icon: RotateCcw,
          title: "Rotate Pages",
          description: "Rotate and reorder PDF pages",
          color: "from-green-500 to-teal-500",
        },
      ],
    },
    {
      id: "convert",
      name: "Convert",
      icon: Download,
      tools: [
        {
          icon: Download,
          title: "Convert to PDF",
          description: "Word, Excel, PPT, Images → PDF",
          color: "from-orange-500 to-red-500",
        },
        {
          icon: Upload,
          title: "PDF to Image",
          description: "Convert PDF pages to JPG/PNG",
          color: "from-indigo-500 to-purple-500",
        },
        {
          icon: FileText,
          title: "Image to PDF",
          description: "Create PDF from images",
          color: "from-emerald-500 to-green-500",
        },
      ],
    },
    {
      id: "edit",
      name: "Edit",
      icon: Edit3,
      tools: [
        {
          icon: Edit3,
          title: "PDF Editor",
          description: "Edit, annotate and draw on PDF files",
          color: "from-blue-600 to-blue-400",
        },
        {
          icon: Crop,
          title: "Image Crop",
          description: "Crop and resize your images instantly",
          color: "from-green-600 to-green-400",
        },
        {
          icon: Eye,
          title: "File Rename",
          description: "Batch rename your files smartly",
          color: "from-purple-600 to-purple-400",
        },
      ],
    },
    {
      id: "security",
      name: "Security",
      icon: Lock,
      tools: [
        {
          icon: Lock,
          title: "File Encryption",
          description: "Secure your files with AES encryption",
          color: "from-red-600 to-red-400",
        },
        {
          icon: Shield,
          title: "ZFA Protected PDF",
          description: "Protect PDFs with authenticator app",
          color: "from-orange-600 to-orange-400",
        },
        {
          icon: Users,
          title: "Share with Access Control",
          description: "Share files with specific users",
          color: "from-indigo-600 to-indigo-400",
        },
      ],
    },
    {
      id: "optimize",
      name: "Optimize",
      icon: Zap,
      tools: [
        {
          icon: Minimize2,
          title: "Image Optimizer",
          description: "Compress images without losing quality",
          color: "from-pink-500 to-rose-500",
        },
        {
          icon: Code,
          title: "Code Minifier",
          description: "Minify JS, CSS, and HTML for faster loads",
          color: "from-amber-500 to-yellow-500",
        },
        {
          icon: RefreshCw,
          title: "Cache Cleaner",
          description: "Clean and refresh system or browser cache",
          color: "from-sky-500 to-blue-500",
        },
      ],
    },
  ];

  return (
    // <section className="py-20 bg-gray-50 dark:bg-gray-800">
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            All PDF Tools in One Place
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose from our comprehensive suite of PDF tools organized by
            category
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {categories.map((category, categoryIndex) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.15 }}
              className="bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Category Header */}
              <div className="flex items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-600">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-4">
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {category.name}
                </h3>
              </div>

              {/* Tools List */}
              <div className="space-y-4">
                {category.tools.map((tool, toolIndex) => (
                  <motion.div
                    key={tool.title}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: categoryIndex * 0.1 + toolIndex * 0.1,
                    }}
                    className="flex items-start p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-r ${tool.color} flex items-center justify-center mr-4 flex-shrink-0`}
                    >
                      <tool.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {tool.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {tool.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              The Ultimate Toolkit for All Your PDF Works
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Everything you need to work with PDFs, completely free and online
            </p>
            <Link to="/tools">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Start Using Tools Now
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ToolsShowcaseSection;
