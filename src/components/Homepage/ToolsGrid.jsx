// src/components/sections/ToolsGrid.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Add this import
import { 
  FileText, Image, Merge, Minimize2, 
  Lock, Edit3, Eye, FileType 
} from 'lucide-react';

const ToolsGrid = () => {
  const tools = [
    {
      icon: FileText,
      title: 'PDF Tools',
      description: 'Edit, merge, split, and compress PDF files',
      color: 'from-red-500 to-pink-500',
      tools: ['Edit PDF', 'Merge PDF', 'Split PDF', 'Compress PDF'],
      link: '/tools'
    },
    {
      icon: Image,
      title: 'Image Tools',
      description: 'Convert, resize, and edit images online',
      color: 'from-green-500 to-teal-500',
      tools: ['Convert Image', 'Resize Image', 'Crop Image', 'Compress Image'],
      link: '/tools'
    },
    {
      icon: FileType,
      title: 'Convert Files',
      description: 'Convert between different file formats',
      color: 'from-blue-500 to-cyan-500',
      tools: ['PDF to Word', 'PDF to JPG', 'Word to PDF', 'Excel to PDF'],
      link: '/tools'
    },
    {
      icon: Lock,
      title: 'Security Tools',
      description: 'Protect and secure your documents',
      color: 'from-purple-500 to-indigo-500',
      tools: ['Protect PDF', 'Remove Password', 'Digital Sign', 'Watermark'],
      link: '/tools'
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Online File Tools
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to work with files, completely free and online
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Link to={tool.link}>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:scale-105 border border-gray-200 dark:border-gray-700">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <tool.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {tool.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {tool.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {tool.tools.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/tools">
            <Button variant="outline" className="border-2 px-8 py-3">
              View All Tools
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ToolsGrid;