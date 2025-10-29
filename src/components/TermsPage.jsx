import React from 'react';
import { motion } from 'framer-motion';

const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto prose prose-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="gradient-text">Terms and Conditions</h1>
        <p className="text-gray-500">Last updated: October 4, 2025</p>

        <h2>1. Agreement to Terms</h2>
        <p>By using our services, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the services. We may modify the Terms at any time, in our sole discretion. If we do so, we'll let you know either by posting the modified Terms on the Site or through other communications.</p>

        <h2>2. Use of Services</h2>
        <p>You may use the services only if you are 13 years or older and are not barred from using the services under applicable law. You agree not to use the services for any purpose that is illegal or prohibited by these Terms.</p>
        <p>You are responsible for safeguarding your account, so use a strong password and limit its use to this account. We cannot and will not be liable for any loss or damage arising from your failure to comply with the above.</p>

        <h2>3. Content and Files</h2>
        <p>You are solely responsible for the content of the files you submit. You agree not to upload any files that infringe on any copyright, patent, trademark, or other proprietary rights of any party. We do not claim ownership of any of your files. You are granting us a temporary license to use your files for the purpose of providing the service.</p>
        <p>All files are automatically deleted from our servers after 24 hours.</p>

        <h2>4. Subscriptions</h2>
        <p>If you purchase a subscription, you will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set either on a monthly or annual basis, depending on the type of subscription plan you select when purchasing a subscription.</p>
        <p>At the end of each Billing Cycle, your subscription will automatically renew under the exact same conditions unless you cancel it or Pdfworks cancels it. You may cancel your subscription renewal either through your online account management page or by contacting customer support.</p>

        <h2>5. Termination</h2>
        <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>

        <h2>6. Limitation of Liability</h2>
        <p>In no event shall Pdfworks, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>
      </motion.div>
    </div>
  );
};

export default TermsPage;