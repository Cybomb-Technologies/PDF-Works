// src/components/sections/FAQPreviewSection.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, ArrowRight } from "lucide-react";

const FAQPreviewSection = () => {
  const previewFaqs = [
    {
      question: "Is PDF Works free to use?",
      answer:
        "Yes, we offer a generous free plan that includes access to our basic PDF tools with daily usage limits. For unlimited access and advanced features, you can upgrade to our Pro or Business plans.",
    },
    {
      question: "How secure are my files?",
      answer:
        "Security is our top priority. All file transfers are encrypted with TLS 1.2+. Files are stored with AES-256 encryption at rest and are automatically deleted from our servers after a short retention period.",
    },
    {
      question: "What file formats can I convert to and from?",
      answer:
        "You can convert PDFs to and from a wide range of formats, including Microsoft Word (DOCX), Excel (XLSX), PowerPoint (PPTX), as well as image formats like JPG and PNG.",
    },
    {
      question: "Can I use PDF Works on my mobile device?",
      answer:
        "Absolutely! Our web application is fully responsive and works great on all modern mobile browsers. We are also developing dedicated mobile apps for iOS and Android for an even better on-the-go experience.",
    },
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Get quick answers to common questions about our PDF tools
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <Accordion type="single" collapsible className="w-full">
              {previewFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`preview-item-${index}`}>
                  <AccordionTrigger className="text-lg font-semibold text-left hover:text-blue-600 transition-colors">
                    <div className="flex items-start">
                      <HelpCircle className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                      {faq.question}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 dark:text-gray-300 pl-8">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link to="/faq">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center">
                  View All Frequently Asked Questions
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQPreviewSection;
