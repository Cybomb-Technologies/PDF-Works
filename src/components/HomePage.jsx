// src/components/HomePage.jsx
import React from 'react';
import HeroSection from './Homepage/HeroSection';
import ToolsGrid from './Homepage/ToolsGrid';
import FeaturesShowcase from './Homepage/FeaturesShowcase';
import HowItWorks from './Homepage/HowItWorks';
import PartnersSection from './Homepage/PartnersSection';
import TestimonialsSection from './Homepage/TestimonialsSection';
import CTASection from './Homepage/CTASection';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ToolsGrid />
      <FeaturesShowcase />
      <PartnersSection />
      <HowItWorks />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};
 
export default HomePage;
 