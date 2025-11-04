import React from 'react';
import { motion } from 'framer-motion';

const PricingPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto prose prose-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="gradient-text pb-6 pt-6">Pricing Policy</h1>
        <p className="text-gray-500">Last updated: October 4, 2025</p>

        <p>Welcome to Pdfworks (Cybomb Technologies Pvt Ltd). This Pricing Policy explains how our pricing, billing, renewals, and refunds work for all our services and subscription plans. By using our services, you agree to the terms outlined in this policy.</p>

        <h2>1. Pricing Structure</h2>
        <p>We offer flexible subscription plans to meet different user needs, including Free, Basic, Pro, and Enterprise options. Prices are displayed in both INR (Indian Rupees) and USD (US Dollars) to accommodate our global user base.</p>
        <p>You can choose between monthly and yearly billing cycles. Yearly subscriptions offer significant savings compared to monthly billing. All prices may vary based on applicable taxes (including GST for Indian customers) or promotional offers.</p>

        <h2>2. Subscription & Renewal</h2>
        <p>Subscriptions automatically renew at the end of each billing cycle unless cancelled at least 24 hours before the renewal date. We send renewal reminders via email 7 days before automatic renewal to keep you informed.</p>
        <p>You can cancel your subscription at any time from your account settings. Cancellation will stop future billing but will not generate refunds for the current billing period.</p>

        <h2>3. Payment Methods</h2>
        <p>We accept various payment methods to make your subscription process convenient for users worldwide:</p>
        <ul>
          <li><strong>For Indian Customers:</strong></li>
          <li>Credit and Debit Cards (Visa, MasterCard, American Express)</li>
          <li>UPI Payments</li>
          <li>Net Banking</li>
          <li>Razorpay Payments</li>
          <li><strong>For International Customers:</strong></li>
          <li>Credit and Debit Cards (Visa, MasterCard, American Express)</li>
          <li>PayPal</li>
          <li>Stripe Payments</li>
        </ul>
        <p>All transactions are securely processed through PCI-compliant payment gateways. We do not store your payment card details on our servers.</p>

        <h2>4. Refund & Cancellation Policy</h2>
        <p>Refunds are available within 7 days of purchase for eligible plans that haven't been actively used. To be eligible for a refund, you must not have utilized the paid features or consumed credits from the subscription.</p>
        <p>No refunds will be issued after services have been utilized or credits have been consumed. Cancellation of subscription is immediate and stops all future billing cycles.</p>

        <h2>5. Discounts, Coupons & Offers</h2>
        <p>We occasionally offer promotional discounts and coupon codes. These are valid only during the specified promotional periods and cannot be combined with other ongoing offers unless explicitly stated.</p>
        <p>All discount codes are non-transferable and subject to the specific terms and conditions outlined during the promotional period. We reserve the right to modify or withdraw offers at any time without prior notice.</p>

        <h2>6. Price Changes</h2>
        <p>We reserve the right to modify subscription prices at any time. When we make price changes, we provide at least 30 days prior notice to existing subscribers via email.</p>
        <p>Current subscribers will maintain their existing pricing until the end of their current billing cycle before any new prices take effect for subsequent renewals.</p>

        <h2>7. Currency & Exchange Rates</h2>
        <p>For international customers paying in USD, the exchange rates are determined by your payment provider or bank at the time of transaction. We display approximate USD equivalents for INR prices, but the final amount charged may vary slightly based on current exchange rates and any bank processing fees.</p>

        <h2>8. Security & Billing Protection</h2>
        <p>All payments are processed through secure, PCI-compliant gateways with end-to-end encryption. We employ the same level of security for your billing information as we do for your document data.</p>
        <p>Your payment details are protected with industry-standard security measures, and we never store complete card information on our servers.</p>

        <h2>9. Contact Information</h2>
        <p>For any billing or pricing-related questions, subscription management issues, or clarification about our pricing policy, please contact our support team:</p>
        <ul>
          <li>Email : info@pdfworks.in</li>
          <li>Phone : +91 9715092104</li>
        </ul>
        <p>We typically respond to billing inquiries within 2-4 hours during business days and are committed to resolving any issues promptly and fairly.</p>
      </motion.div>
    </div>
  );
};

export default PricingPolicyPage;