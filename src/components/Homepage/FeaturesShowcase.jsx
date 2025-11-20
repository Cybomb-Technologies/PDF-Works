// src/components/sections/FeaturesShowcase.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Cloud, Zap, Globe, Smartphone, Users } from 'lucide-react';

const FeaturesShowcase = () => {
  const features = [
    {
      icon: Cloud,
      title: 'Cloud-Based',
      description: 'No installation required. Access all tools directly from your browser.',
      color: 'text-blue-500'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your files are automatically deleted after processing. We never store your data.',
      color: 'text-green-500'
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Optimized algorithms ensure quick file processing and conversion.',
      color: 'text-yellow-500'
    },
    {
      icon: Globe,
      title: 'Works Everywhere',
      description: 'Compatible with all modern browsers and operating systems.',
      color: 'text-purple-500'
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Fully responsive design works perfectly on all devices.',
      color: 'text-pink-500'
    },
    {
      icon: Users,
      title: 'Free for Everyone',
      description: 'All tools are completely free to use with no hidden costs.',
      color: 'text-indigo-500'
    }
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Our File Editor?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience the best online file editing platform with powerful features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-600 flex items-center justify-center mx-auto mb-6 ${feature.color}`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;