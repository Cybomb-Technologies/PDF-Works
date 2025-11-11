import React from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FaqPage = () => {
  const faqs = [
    {
      question: "Is PDF Works free to use?",
      answer:
        "Yes, we offer a generous free plan that includes access to our basic PDF tools with daily usage limits. For unlimited access and advanced features, you can upgrade to our Pro or Business plans.",
    },
    {
      question: "How secure are my files?",
      answer:
        "Security is our top priority. All file transfers are encrypted with TLS 1.2+. Files are stored with AES-256 encryption at rest and are automatically deleted from our servers after a short retention period. You can read more on our Security page.",
    },
    {
      question: "What file formats can I convert to and from?",
      answer:
        "You can convert PDFs to and from a wide range of formats, including Microsoft Word (DOCX), Excel (XLSX), PowerPoint (PPTX), as well as image formats like JPG and PNG. You can also create PDFs from these formats.",
    },
    {
      question:
        "Does the e-signature feature provide legally binding signatures?",
      answer:
        "Yes, our e-signature tool is designed to be compliant with major e-signature laws like the ESIGN Act in the U.S. and eIDAS in the European Union. We provide a full audit trail for all signed documents.",
    },
    {
      question: "What is OCR and how does it work?",
      answer:
        "OCR (Optical Character Recognition) is a technology that converts different types of documents, such as scanned paper documents, PDF files or images captured by a digital camera into editable and searchable data. Our tool can recognize text in multiple languages.",
    },
    {
      question: "Can I use PDF Works on my mobile device?",
      answer:
        "Absolutely! Our web application is fully responsive and works great on all modern mobile browsers. We are also developing dedicated mobile apps for iOS and Android for an even better on-the-go experience.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold gradient-text">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Have questions? We've got answers. If you can't find what you're
          looking for, feel free to contact us.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-effect rounded-2xl p-8"
      >
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-lg font-semibold text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-gray-700">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  );
};

export default FaqPage;
