// src/components/sections/MobileAppSection.jsx
import React from "react";
import { motion } from "framer-motion";
import { Smartphone, Star, Shield, Zap } from "lucide-react";

const MobileAppSection = () => {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for mobile with instant processing",
    },
    {
      icon: Shield,
      title: "Offline Access",
      description: "Use basic tools even without internet connection",
    },
    {
      icon: Smartphone,
      title: "Easy Export",
      description: "Save files directly to your device or cloud storage",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-blue-900">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-left"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
                <Smartphone className="w-4 h-4 mr-2" />
                Now Available on Mobile
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                Take PDF Works
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  With You Everywhere
                </span>
              </h2>

              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                All the powerful PDF tools you love, now optimized for your
                Android device. Edit, convert, and manage files on the go with
                our dedicated mobile app.
              </p>

              {/* App Features */}
              <div className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center mr-4">
                      <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* App Store Rating */}
              <div className="flex items-center mb-8">
                <div className="flex items-center mr-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  4.8/5 on Google Play
                </span>
              </div>

              {/* Download Button */}
              <motion.a
                href="https://play.google.com/store/apps/details?id=com.cybomb.pdf_works"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-semibold transition-colors shadow-lg"
              >
                {/* Play Store Icon */}
                <svg
                  className="w-6 h-6 mr-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM3.61 22.186l10.303-5.966-2.301-2.301-8.002 8.267z" />
                </svg>
                <div className="text-left">
                  <div className="text-sm">Get it on</div>
                  <div className="text-lg">Google Play</div>
                </div>
              </motion.a>
            </motion.div>

            {/* App Preview Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative mx-auto max-w-sm">
                {/* Phone Mockup */}
                <div className="relative bg-gray-900 rounded-[3rem] p-4 shadow-2xl">
                  {/* Phone Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>

                  {/* Screen Content */}
                  <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19] relative">
                    {/* App Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                      <h3 className="text-xl font-bold">PDF Works</h3>
                      <p className="text-blue-100 text-sm">
                        All PDF Tools in One App
                      </p>
                    </div>

                    {/* App Content */}
                    <div className="p-4 space-y-3">
                      {[
                        "Merge PDF",
                        "Convert to PDF",
                        "Compress PDF",
                        "Edit PDF",
                      ].map((tool, index) => (
                        <div
                          key={tool}
                          className="flex items-center p-3 bg-gray-50 rounded-xl"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                            {/* Play Store Icon for app tools */}
                            <svg
                              className="w-4 h-4 text-white"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM3.61 22.186l10.303-5.966-2.301-2.301-8.002 8.267z" />
                            </svg>
                          </div>
                          <span className="text-gray-700 font-medium">
                            {tool}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Navigation */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 p-3">
                      <div className="flex justify-around">
                        {["Home", "Tools", "History", "Profile"].map((item) => (
                          <div key={item} className="text-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mb-1"></div>
                            <span className="text-xs text-gray-600">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileAppSection;
