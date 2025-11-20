import React from "react";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, DatabaseZap, KeyRound } from "lucide-react";
import Metatags from "../SEO/metatags";

const SecurityPage = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description:
        "All file transfers between your device and our servers are protected with industry-standard TLS 1.2+ encryption, ensuring your data is secure in transit.",
    },
    {
      icon: ShieldCheck,
      title: "At-Rest Encryption",
      description:
        "Your documents are encrypted using AES-256, one of the strongest block ciphers available, while stored on our servers. This protects your data even in the unlikely event of a physical breach.",
    },
    {
      icon: DatabaseZap,
      title: "Automatic File Deletion",
      description:
        "We respect your privacy. All uploaded and processed files are automatically and permanently deleted from our servers after a 24-hour period to minimize data exposure.",
    },
    {
      icon: KeyRound,
      title: "Secure Authentication",
      description:
        "We enforce strong password policies and provide secure authentication mechanisms to protect your account from unauthorized access. We also plan to support SSO for our business clients.",
    },
  ];

  const metaPropsData = {
    title: "Security Free PDF Tools Data Protection Encryption PDF Works",
    description:
      "PDF Works security features data protection file encryption automatic deletion Free PDF tools online PDF editor converter compressor privacy security",
    keyword:
      "free pdf tools security, pdf works data protection, file encryption automatic deletion, online pdf editor privacy security, secure pdf processing",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/security",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold gradient-text pb-6 pt-4">
            Security at Pdf works
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Your trust is our most important asset. Learn how we protect your
            data.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-effect rounded-2xl p-8"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                <feature.icon className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 glass-effect rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold mb-4">
            Compliance and Best Practices
          </h2>
          <p className="text-gray-700 space-y-4">
            <span>
              We are committed to following security best practices and
              complying with data protection regulations like GDPR and CCPA. Our
              infrastructure is hosted on secure, top-tier cloud providers that
              meet rigorous security standards.
            </span>
            <span>
              We conduct regular security audits and vulnerability scans to
              ensure our platform remains robust against emerging threats. If
              you discover a security vulnerability, we encourage you to report
              it to us via our responsible disclosure program at{" "}
              <a href="mailto:info@pdfworks.in" className="text-purple-600">
                info@pdfworks.in
              </a>
              .
            </span>
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default SecurityPage;
