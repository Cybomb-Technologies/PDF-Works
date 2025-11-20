import React from 'react';
import { motion } from 'framer-motion';

const RefundPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto prose prose-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="gradient-text">Refund Policy</h1>
        <p className="text-gray-500">Last updated: October 4, 2025</p>

        <p>
          Thank you for choosing <strong>pdfworks (Cybomb Technologies Pvt Ltd)</strong>. We value your satisfaction and strive to provide a smooth and reliable experience. 
          This Refund Policy explains the conditions under which refunds are issued for our services.
        </p>

        <h2>1. Subscription & Payments</h2>
        <p>
          Our services may include one-time payments or recurring subscription plans. 
          All payments are processed securely through our trusted payment partners.
        </p>

        <h2>2. Eligibility for Refunds</h2>
        <p>
          Refunds may be granted under the following circumstances:
        </p>
        <ul>
          <li>If you were charged by mistake due to a system or billing error.</li>
          <li>If you cancel your subscription within 7 days of purchase and have not used premium features.</li>
          <li>If a paid feature fails to function as described and our support team cannot resolve it within a reasonable time.</li>
        </ul>

        <h2>3. Non-Refundable Situations</h2>
        <p>
          We do not provide refunds under these conditions:
        </p>
        <ul>
          <li>Change of mind after purchase.</li>
          <li>Failure to cancel a recurring subscription before the next billing cycle.</li>
          <li>Violation of our Terms & Conditions or misuse of the service.</li>
        </ul>

        <h2>4. How to Request a Refund</h2>
        <p>
          To request a refund, please contact our support team at 
          <a href="mailto:info@pdfworks.in"> info@pdfworks.in</a> 
          with your order ID, payment proof, and reason for refund. 
          Our team will review your request and respond within 5–7 business days.
        </p>

        <h2>5. Refund Processing Time</h2>
        <p>
          Approved refunds will be processed to your original payment method. 
          Depending on your payment provider, it may take 5–10 business days 
          for the amount to reflect in your account.
        </p>

        <h2>6. Updates to This Policy</h2>
        <p>
          We may update this Refund Policy from time to time to reflect changes 
          in our business or legal requirements. The updated version will be indicated 
          by a new “Last updated” date and will take effect as soon as published.
        </p>

        <p>
          If you have any questions about our Refund Policy, please contact us at 
          <a href="mailto:in@pdfworks.in"> info@pdfworks.in</a>.
        </p>
      </motion.div>
    </div>
  );
};

export default RefundPolicyPage;
