import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto prose prose-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="gradient-text">Privacy Policy</h1>
        <p className="text-gray-500">Last updated: October 4, 2025</p>

        <p>Welcome to Pdfworks (Cybomb Technologies LLP). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at info@pdfworks.in</p>

        <h2>1. What Information Do We Collect?</h2>
        <p>We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website or otherwise when you contact us.</p>
        <p>The personal information that we collect depends on the context of your interactions with us and the website, the choices you make and the products and features you use. The personal information we collect may include the following: Name, Email Address, Password, and Payment Information (if you subscribe to a paid plan).</p>

        <h2>2. How Do We Use Your Information?</h2>
        <p>We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
        <ul>
          <li>To facilitate account creation and logon process.</li>
          <li>To manage user accounts.</li>
          <li>To send administrative information to you.</li>
          <li>To fulfill and manage your orders.</li>
          <li>To post testimonials.</li>
          <li>To request feedback.</li>
        </ul>

        <h2>3. Will Your Information Be Shared With Anyone?</h2>
        <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may process or share your data that we hold based on the following legal basis: Consent, Legitimate Interests, Performance of a Contract, Legal Obligations.</p>

        <h2>4. How Do We Handle Your Files?</h2>
        <p>We do not access, view, or copy your files. All files you upload are processed automatically. For your privacy, all files are permanently deleted from our servers within 24 hours of being uploaded.</p>

        <h2>5. How Do We Keep Your Information Safe?</h2>
        <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>

        <h2>6. Do We Make Updates to This Policy?</h2>
        <p>We may update this privacy policy from time to time. The updated version will be indicated by an updated "Last updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.</p>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicyPage;