import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const PressPage = () => {
  const releases = [
    {
      date: "October 1, 2025",
      title: "PDF Pro Launches Revolutionary AI-Powered Document Analysis",
      summary: "PDF Pro today announced a groundbreaking update to its platform, integrating advanced AI to automatically summarize, categorize, and extract key data from PDF documents, setting a new standard for document intelligence."
    },
    {
      date: "August 15, 2025",
      title: "PDF Pro Surpasses 10 Million Users Worldwide",
      summary: "Celebrating a major milestone, Pdf works now serves over 10 million users, solidifying its position as a leading provider of online document solutions. The company attributes its rapid growth to its user-friendly design and powerful feature set."
    },
    {
      date: "June 5, 2025",
      title: "New Partnership with Dropbox and Google Drive Enhances Cloud Integration",
      summary: "PDF Pro announces seamless integration with Dropbox and Google Drive, allowing users to directly import, edit, and save their documents from their favorite cloud storage providers without leaving the platform."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold gradient-text">Press & Media</h1>
        <p className="mt-4 text-lg text-gray-600">The latest news, announcements, and media resources from Pdf Works.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold">Press Releases</h2>
          {releases.map((release, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className="glass-effect rounded-2xl p-6"
            >
              <p className="text-sm text-gray-500 mb-2">{release.date}</p>
              <h3 className="text-xl font-semibold mb-3">{release.title}</h3>
              <p className="text-gray-600">{release.summary}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-8 space-y-6"
        >
          <h2 className="text-2xl font-bold">Media Kit</h2>
          <p className="text-gray-600">Download our media kit for logos, brand guidelines, and other assets.</p>
          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
            <Download className="mr-2 h-4 w-4" /> Download Media Kit (.zip)
          </Button>
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-2">Media Contact</h3>
            <p className="text-gray-600">For all media inquiries, please contact:</p>
            <p className="font-medium">info@pdfworks.in</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PressPage;