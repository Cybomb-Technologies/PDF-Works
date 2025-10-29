import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const BlogPage = () => {
  const posts = [
    {
      id: 1,
      title: "5 Time-Saving PDF Tricks You Need to Know",
      category: "Productivity",
      date: "October 3, 2025",
      excerpt: "Unlock the full potential of your documents with these five simple yet powerful PDF tricks that will boost your productivity.",
      image: "A person efficiently working on a laptop in a modern cafe"
    },
    {
      id: 2,
      title: "The Ultimate Guide to Digital Signatures",
      category: "Security",
      date: "September 28, 2025",
      excerpt: "Learn everything about e-signatures, from their legal standing to how you can use them to streamline your workflows securely.",
      image: "A hand signing a digital document on a tablet"
    },
    {
      id: 3,
      title: "Why OCR is a Game-Changer for Your Business",
      category: "Technology",
      date: "September 15, 2025",
      excerpt: "Discover how Optical Character Recognition (OCR) can transform your scanned documents into valuable, searchable data.",
      image: "A magnifying glass over a scanned document, highlighting text"
    },
    {
      id: 4,
      title: "PDF Pro's New Feature: Batch Processing",
      category: "Announcements",
      date: "September 1, 2025",
      excerpt: "We're excited to announce our new batch processing feature, allowing you to convert, compress, or watermark hundreds of files at once.",
      image: "A grid of document icons being processed simultaneously"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold gradient-text">From the Blog</h1>
        <p className="mt-4 text-lg text-gray-600">Tips, tutorials, and updates from thepdfworks (Cybomb Technologies LLP.) team.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-effect rounded-2xl overflow-hidden hover-lift"
          >
            <div className="h-56 w-full">
              <img className="w-full h-full object-cover" alt={post.title} src="https://images.unsplash.com/photo-1595872018818-97555653a011" />
            </div>
            <div className="p-6">
              <p className="text-sm text-purple-600 font-semibold mb-2">{post.category}</p>
              <h2 className="text-2xl font-bold mb-3">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{post.date}</p>
                <Link to="#">
                  <Button variant="ghost" className="group">
                    Read More <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;