// src/components/HomePage.jsx
import React from "react";
import HeroSection from "./Homepage/HeroSection";
import ToolsGrid from "./Homepage/ToolsGrid";
import FeaturesShowcase from "./Homepage/FeaturesShowcase";
import HowItWorks from "./Homepage/HowItWorks";
import PartnersSection from "./Homepage/PartnersSection";
import TestimonialsSection from "./Homepage/TestimonialsSection";
import CTASection from "./Homepage/CTASection";
import ToolsShowcaseSection from "./Homepage/ToolsShowcaseSection";
import FAQPreviewSection from "./Homepage/FAQPreviewSection";
import MobileAppSection from "./Homepage/MobileAppSection";

import Metatags from "../SEO/metatags";

const metaPropsData = {
  title:
    "Free Online PDF Editor - Convert Word to PDF, Merge & Compress PDFs for Free",
  description:
    "Use our free online PDF editor to convert Word to PDF, merge files, and compress PDFs online. Best PDF converter with free tools for all your document needs - no watermarks.",
  keyword:
    "free pdf editor, best pdf converter, convert word to pdf, free online pdf editor, free pdf merger, compress pdf online, convert pdf to word online for free",
  image:
    "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
  url: "https://pdfworks.in",
};

const HomePage = () => {
  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen">
        <HeroSection />
        <ToolsGrid />
        <FeaturesShowcase />
        <ToolsShowcaseSection />
        <PartnersSection />
        <HowItWorks />
        <MobileAppSection />
        <FAQPreviewSection />
        <TestimonialsSection />
        <CTASection />
      </div>
    </>
  );
};

export default HomePage;
