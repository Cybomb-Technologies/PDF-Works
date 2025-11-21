// src/components/sections/CTASection.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, MessageCircle } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Edit Your Files?
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join millions of users who trust our platform for their file editing
            needs. Get started with our powerful tools today!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/tools">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Start Editing Now
              </Button>
            </Link>

            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg border-2"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Us
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            • Fast Processing • Professional Results • Secure & Private
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
