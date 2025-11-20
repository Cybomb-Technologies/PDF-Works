// src/components/sections/HowItWorks.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Settings, Download } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Files',
      description: 'Drag and drop your files or click to browse',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Settings,
      title: 'Edit & Process',
      description: 'Use our tools to edit, convert, or modify your files',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Download,
      title: 'Download Result',
      description: 'Download your processed files instantly',
      color: 'from-green-500 to-teal-500'
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Simple three-step process to get your files edited
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center relative"
              >
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-3/4 w-full h-0.5 bg-gradient-to-r from-gray-300 to-gray-100 dark:from-gray-600 dark:to-gray-700 z-0"></div>
                )}
                
                <div className="relative z-10">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 font-bold">
                      {index + 1}
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;