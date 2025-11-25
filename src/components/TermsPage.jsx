import React from "react";
import { motion } from "framer-motion";
import Metatags from "../SEO/metatags";

const metaPropsData = {
  title: "Terms & Conditions - Free PDF Tools Usage Policy | PDF Works",
  description:
    "Read PDF Works terms and conditions outlining our usage policy, user agreement, and legal terms for our free online PDF editor, converter, and compressor tools.",
  keyword:
    "free pdf tools terms conditions, pdf works usage policy, user agreement online pdf editor, legal terms service agreement",
  image:
    "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
  url: "https://pdfworks.in/terms",
};

const TermsPage = () => {
  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-lg max-w-none"
        >
          <h1 className="gradient-text text-3xl font-bold mb-2">
            Terms & Conditions{" "}
          </h1>
          <p className="text-gray-500 text-lg mb-8">
            Effective Date: 21-02-2025
          </p>

          <p className="text-gray-700 mb-6">
            Welcome to PDF Works ("we," "our," or "us"). By accessing or using
            our website (the "Website"), you agree to comply with and be bound
            by the following Terms and Conditions. If you do not agree with
            these terms, please refrain from using our website.
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700">
                By accessing, browsing, or using our website, you acknowledge
                that you have read, understood, and agreed to be bound by these
                Terms and Conditions, along with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Website Usage
              </h2>
              <p className="text-gray-700 mb-4">
                You agree to use our website for lawful purposes only and not
                to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Distribute harmful software (e.g., viruses, malware)</li>
                <li>Engage in fraudulent or misleading activities</li>
                <li>Attempt to gain unauthorized access to our systems</li>
              </ul>
              <p className="text-gray-700 mt-4">
                We reserve the right to terminate access if you violate these
                terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Intellectual Property Rights
              </h2>
              <p className="text-gray-700 mb-4">
                All content on our website, including text, graphics, logos,
                images, videos, and software, is owned by or licensed to PDF
                Works and is protected by copyright, trademark, and other
                intellectual property laws.
              </p>
              <p className="text-gray-700 mb-4">You may not:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  Copy, modify, distribute, or reproduce any content without
                  permission
                </li>
                <li>Use our content for commercial purposes without consent</li>
              </ul>
              <p className="text-gray-700 mt-4 font-semibold">Exceptions:</p>
              <p className="text-gray-700">
                You may share website links or brief excerpts for non-commercial
                purposes with proper attribution.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. User Accounts (If Applicable)
              </h2>
              <p className="text-gray-700 mb-4">
                To access certain features, you may need to create an account.
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  Maintaining the confidentiality of your account credentials
                </li>
                <li>
                  Ensuring all information provided is accurate and up to date
                </li>
                <li>Notifying us immediately of unauthorized account access</li>
              </ul>
              <p className="text-gray-700 mt-4">
                We reserve the right to suspend or terminate accounts violating
                these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Payments and Refunds (If Applicable)
              </h2>
              <p className="text-gray-700 mb-4">
                If you purchase any products or services from PDF Works, the
                following conditions apply:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  <strong>Pricing:</strong> All prices are listed in your local
                  currency and are subject to change without notice.
                </li>
                <li>
                  <strong>Payments:</strong> We accept payments via secure
                  third-party processors
                </li>
                <li>
                  <strong>Refunds:</strong> Please refer to our Refund Policy
                  for detailed terms
                </li>
              </ul>
              <p className="text-gray-700 mt-4">
                Failure to complete payment may result in order cancellation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Third-Party Links and Services
              </h2>
              <p className="text-gray-700 mb-4">
                Our website may contain links to third-party websites or
                services. These links are provided for convenience only. We do
                not endorse or control third-party sites and are not responsible
                for their content or practices.
              </p>
              <p className="text-gray-700 font-semibold">
                Use third-party websites at your own risk
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Limitation of Liability
              </h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, PDF Works shall not be
                liable for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  Any indirect, incidental, or consequential damages arising
                  from website use
                </li>
                <li>Loss of data, profits, or business opportunities</li>
                <li>Errors, bugs, interruptions, or website unavailability</li>
              </ul>
              <p className="text-gray-700 mt-4 font-semibold">
                Your use of the website is at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Disclaimer of Warranties
              </h2>
              <p className="text-gray-700 mb-4">
                PDF Works provides the website and its content on an "as-is" and
                "as-available" basis, without warranties of any kind, either
                express or implied, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Accuracy, reliability, or completeness of content</li>
                <li>Availability or functionality of the website</li>
                <li>Non-infringement of third-party rights</li>
              </ul>
              <p className="text-gray-700 mt-4">
                We do not guarantee uninterrupted or error-free website access.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Indemnification
              </h2>
              <p className="text-gray-700">
                You agree to indemnify, defend, and hold harmless PDF Works, its
                affiliates, and employees from any claims, liabilities, damages,
                costs, and expenses arising from:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-2">
                <li>Your use of the website</li>
                <li>Violation of these Terms and Conditions</li>
                <li>Infringement of any third-party rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Privacy Policy
              </h2>
              <p className="text-gray-700">
                By using our website, you agree to the terms outlined in our
                Privacy Policy regarding the collection, use, and protection of
                personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Termination of Access
              </h2>
              <p className="text-gray-700">
                We reserve the right to terminate or restrict access to our
                website at our discretion, without notice, if we believe you
                have violated these Terms and Conditions or engaged in unlawful
                activity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Governing Law and Jurisdiction
              </h2>
              <p className="text-gray-700">
                These Terms and Conditions are governed by the laws of India,
                without regard to conflict of law principles. Any disputes shall
                be resolved in the courts of India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                13. Changes to Terms and Conditions
              </h2>
              <p className="text-gray-700">
                We may update these Terms and Conditions from time to time.
                Changes will be posted with a revised Effective Date. Continued
                website use after updates signifies your acceptance of the new
                terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                14. Contact Us
              </h2>
              <p className="text-gray-700 mb-4">
                For questions, concerns, or disputes regarding these Terms and
                Conditions, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">📧 Email: info@pdfworks.in</p>
                {/* <p className="text-gray-700">🌐 Website: www.pdfworks.com</p> */}
              </div>
              <p className="text-gray-700 mt-4 font-semibold">
                By using our website, you agree to these Terms and Conditions.
                If you do not agree, please refrain from using our website and
                services.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default TermsPage;
