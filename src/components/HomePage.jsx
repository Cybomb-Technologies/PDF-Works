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
  title: "PDF Works - Free Online PDF Editor & Tools | 100% Free PDF Solutions",
  description:
    "Completely free online PDF editor, converter, and management tools. Edit, merge, compress, convert PDFs 100% free - no costs, no watermarks, no registration required. Unlimited free PDF tools for everyone.",
  keyword:
    "free pdf editor, free pdf converter, free pdf tools, online pdf editor free, free pdf merger, free pdf compressor, free pdf to word, free word to pdf, free pdf editor online, free pdf software, no watermark pdf editor, free document editor, free pdf editor 2025, completely free pdf tools, unlimited free pdf, free pdf editor no sign up, free online pdf tools, pdf works free",
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
