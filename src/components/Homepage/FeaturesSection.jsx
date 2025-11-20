// src/components/sections/FeaturesSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Merge, Minimize2, FileType, Edit3, Eye, Lock 
} from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    { name: 'Merge & Split', icon: Merge, description: 'Combine or extract PDF pages effortlessly.' },
    { name: 'Compress', icon: Minimize2, description: 'Reduce file size while maintaining quality.' },
    { name: 'Convert', icon: FileType, description: 'Switch between PDF and other formats like Word, JPG.' },
    { name: 'Edit & Sign', icon: Edit3, description: 'Add text, images, and legally binding signatures.' },
    { name: 'OCR', icon: Eye, description: 'Turn scanned documents into searchable text.' },
    { name: 'Protect', icon: Lock, description: 'Secure your files with passwords and permissions.' },
  ];

  return (
    <section className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold">Powerful Tools for Every Task</h2>
        <p className="mt-4 text-lg text-muted-foreground">From simple edits to complex workflows, we've got you covered.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="glass-effect rounded-2xl p-6 text-center hover-lift"
          >
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center mx-auto mb-4">
              <feature.icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;