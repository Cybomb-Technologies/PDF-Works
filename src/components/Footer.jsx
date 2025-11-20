import React from "react";
import { Link } from "react-router-dom";
import { FileText, Linkedin, Instagram, MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  const sections = {
    Product: [
      { name: "Home", path: "/" },
      { name: "Tools", path: "/tools" },
      { name: "Pricing", path: "/pricing" },
      { name: "FAQ", path: "/faq" },
    ],
    Company: [
      { name: "About Us", path: "/about" },
      { name: "Contact Us", path: "/contact" },
      { name: "Blog", path: "/blog" },
      { name: "Press Release", path: "/press" },
    ],
    Legal: [
      { name: "Security", path: "/security" },
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Terms & Conditions", path: "/terms" },
      { name: "Cookies Policy", path: "/cookies" },
      { name: "Refund Policy", path: "/refund-policy" },
      { name: "Pricing Policy", path: "/pricing-policy" },
    ],
  };

  return (
    <footer className="bg-white/50 backdrop-blur-lg border-t border-purple-200/50 text-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">
                PDF Works
              </span>
            </Link>
            <p className="text-sm text-gray-600">
              The ultimate toolkit for all your PDF needs. Edit, convert, sign,
              and manage documents with ease.
            </p>
            <div className="flex space-x-4">
              <a href="https://x.com/CybombTech" className="text-gray-500 hover:text-purple-600 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="22"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  className="w-5 h-5"
                >
                  <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/cybomb/" className="text-gray-500 hover:text-purple-600 transition-colors">
                <Linkedin size={24} />
              </a>
              <a href="https://www.instagram.com/cybomb_tech/" className="text-gray-500 hover:text-purple-600 transition-colors">
                <Instagram size={24} />
              </a>
            </div>
          </div>

          {Object.entries(sections).map(([title, links]) => (
            <div key={title}>
              <p className="font-semibold text-gray-900 mb-4">{title}</p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Get in Touch Section */}
          <div className="space-y-4">
            <p className="font-semibold text-gray-900 mb-4">Get in Touch</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                Cybomb Technologies Pvt Ltd,
                  <br />
                  Prime Plaza No.54/1, 1st street, 
                  <br />
                  Sripuram colony, St. Thomas Mount,
                  <br />
                  Chennai, Tamil Nadu - 600 016, India
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-purple-600" />
                <a 
                  href="tel:+919715092104" 
                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                >
                  +91 9715092104
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-purple-600" />
                <a 
                  href="mailto:info@pdfworks.in" 
                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                >
                  info@pdfworks.in
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Cybomb Technologies Pvt Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;