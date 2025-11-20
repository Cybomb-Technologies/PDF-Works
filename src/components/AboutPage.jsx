import React from "react";
import { motion } from "framer-motion";
import {
  Target,
  Eye,
  Sparkles,
  Shield,
  Globe,
  Zap,
  Rocket,
  Users,
  FileText,
  Lock,
} from "lucide-react";
import Metatags from "../SEO/metatags";

const AboutPage = () => {
  const stats = [
    { number: "100K+", label: "Early Users", icon: Users },
    { number: "5M+", label: "Documents Processed", icon: FileText },
    { number: "50+", label: "Countries Served", icon: Globe },
    { number: "99.9%", label: "Uptime Reliability", icon: Shield },
  ];

  const features = [
    {
      icon: Shield,
      title: "Enterprise Security",
      description:
        "Bank-level encryption and compliance with global data protection standards from day one",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Next-generation processing engine built with the latest web technologies",
    },
    {
      icon: Globe,
      title: "Global Ready",
      description:
        "Multi-language support and cloud infrastructure designed for worldwide scale",
    },
    {
      icon: Rocket,
      title: "Future Forward",
      description: "AI-powered features and continuous innovation at our core",
    },
  ];

  const milestones = [
    { year: "2025", event: "Company Founded & MVP Launch", status: "current" },
    {
      year: "2026",
      event: "Mobile Apps & Enterprise Features",
      status: "upcoming",
    },
    {
      year: "2027",
      event: "Global Expansion & AI Integration",
      status: "upcoming",
    },
  ];

  const technologies = [
    {
      category: "AI & Machine Learning",
      items: [
        "Smart Document Analysis",
        "Automated Formatting",
        "Content Recognition",
        "Predictive Tools",
      ],
    },
    {
      category: "Security & Privacy",
      items: [
        "End-to-End Encryption",
        "GDPR Compliance",
        "Zero-Knowledge Architecture",
        "Regular Security Audits",
      ],
    },
    {
      category: "Performance",
      items: [
        "Cloud-Native Architecture",
        "Real-time Processing",
        "Scalable Infrastructure",
        "Global CDN",
      ],
    },
  ];

  const useCases = [
    {
      industry: "Education",
      description:
        "Students and educators usepdfworks for research papers, assignments, and academic publications",
      icon: "📚",
    },
    {
      industry: "Business",
      description:
        "Enterprises rely on our platform for contracts, reports, and professional documentation",
      icon: "💼",
    },
    {
      industry: "Creative",
      description:
        "Designers and creators use our tools for portfolios, presentations, and visual content",
      icon: "🎨",
    },
    {
      industry: "Legal",
      description:
        "Legal professionals trust our secure platform for sensitive documents and case files",
      icon: "⚖️",
    },
  ];

  const metaPropsData = {
    title:
      "About PDF Works - Free PDF Tools Company | Our 2025 Story & Mission",
    description:
      "Learn about PDF Works - founded in 2025 to provide 100% free PDF tools with enterprise security. Our story, mission, and commitment to free document solutions for everyone worldwide.",
    keyword:
      "about pdf works, free pdf tools company, pdf works story, our mission, free pdf editor company, document management startup, pdf tools 2025, free online pdf tools, completely free pdf solutions, pdf works team, our technology, company values, free document tools, pdf works mission, about our free tools",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/about",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="max-w-7xl mx-auto space-y-24 px-4">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <h1 className="text-6xl font-bold gradient-text mb-6">
            About PDF Works
          </h1>
          <p className="mt-4 text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Born in 2025 to revolutionize document management. We're building
            the future of PDF tools with cutting-edge technology and
            user-centric design from the ground up.
          </p>
        </motion.section>

        {/* Company Timeline */}
        <section className="py-6">
          <h2 className="text-4xl font-bold text-center mb-16">
            Our Journey Ahead
          </h2>
          <div className="flex flex-col md:flex-row justify-between items-center relative">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`flex flex-col items-center text-center relative z-10 ${
                  index < milestones.length - 1 ? "md:mb-0 mb-8" : ""
                }`}
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                    milestone.status === "current"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <span className="text-lg font-bold">{milestone.year}</span>
                </div>
                <div
                  className={`px-6 py-4 rounded-2xl max-w-xs ${
                    milestone.status === "current"
                      ? "bg-purple-50 border-2 border-purple-200"
                      : "bg-gray-50"
                  }`}
                >
                  <h3 className="font-semibold mb-2">{milestone.event}</h3>
                  <span
                    className={`text-sm px-2 py-1 rounded-full ${
                      milestone.status === "current"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {milestone.status === "current"
                      ? "In Progress"
                      : "Coming Soon"}
                  </span>
                </div>
              </motion.div>
            ))}
            <div className="hidden md:block absolute top-10 left-0 right-0 h-1 bg-gray-200 z-0"></div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center glass-effect p-6 rounded-2xl"
              >
                <IconComponent className="h-8 w-8 mx-auto text-purple-600 mb-3" />
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            );
          })}
        </section>

        {/* Story Section */}
        <section className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium mb-4">
              <Rocket className="h-4 w-4 mr-1" />
              Launch Year 2025
            </div>
            <h2 className="text-4xl font-bold mb-6">Our Beginning</h2>
            <div className="text-gray-700 space-y-6 text-lg leading-relaxed">
              <p>
                pdfworks was founded in 2025 by Cybomb Technologies Pvt Ltd.
                with a bold vision: to create the most intuitive and powerful
                document management platform from scratch. Unlike legacy
                solutions burdened by outdated technology, we built our
                foundation on modern architecture and user-first principles.
              </p>
              <p>
                In our launch year, we've already attracted over 100,000 early
                adopters and processed millions of documents. Our fresh approach
                to PDF tools combines enterprise-grade capabilities with
                consumer-friendly design.
              </p>
              <p>
                As a 2025-born company, we're free from technical debt and
                legacy constraints, allowing us to implement the latest
                advancements in AI, security, and user experience from day one.
              </p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="grid grid-cols-2 gap-4">
              <img
                className="w-full h-64 rounded-2xl object-cover shadow-lg"
                alt="Modern technology interface showing document editing"
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=500&q=80"
              />
              <img
                className="w-full h-64 rounded-2xl object-cover shadow-lg mt-8"
                alt="Team collaboration in modern workspace"
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=500&q=80"
              />
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="py-16">
          <h2 className="text-4xl font-bold text-center mb-4">
            Built with Modern Technology
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Leveraging the latest advancements to deliver unparalleled
            performance and security
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect p-6 rounded-2xl"
              >
                <h3 className="text-xl font-semibold mb-4 text-purple-600">
                  {tech.category}
                </h3>
                <ul className="space-y-3">
                  {tech.items.map((item, itemIndex) => (
                    <li key={item} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Mission & Values */}
        <section className="grid md:grid-cols-3 gap-8 text-center">
          <motion.div
            className="glass-effect p-8 rounded-2xl"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Target className="h-12 w-12 mx-auto text-purple-600 mb-4" />
            <h3 className="text-2xl font-semibold mb-4">Our 2025 Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              To redefine document management for the modern era, making
              powerful PDF tools accessible to everyone while maintaining the
              highest standards of security and usability.
            </p>
          </motion.div>
          <motion.div
            className="glass-effect p-8 rounded-2xl"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Eye className="h-12 w-12 mx-auto text-purple-600 mb-4" />
            <h3 className="text-2xl font-semibold mb-4">Future Vision</h3>
            <p className="text-gray-600 leading-relaxed">
              To become the world's most intelligent document platform by 2027,
              leveraging AI and machine learning to automate complex document
              workflows.
            </p>
          </motion.div>
          <motion.div
            className="glass-effect p-8 rounded-2xl"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Sparkles className="h-12 w-12 mx-auto text-purple-600 mb-4" />
            <h3 className="text-2xl font-semibold mb-4">Our Advantage</h3>
            <p className="text-gray-600 leading-relaxed">
              Built in 2025 with cutting-edge technology, we're unburdened by
              legacy systems and focused entirely on solving today's document
              challenges.
            </p>
          </motion.div>
        </section>

        {/* Use Cases */}
        <section className="py-16">
          <h2 className="text-4xl font-bold text-center mb-4">
            Trusted Across Industries
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            pdfworks serves diverse needs across multiple sectors with tailored
            solutions
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.industry}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect p-6 rounded-2xl text-center"
              >
                <div className="text-4xl mb-4">{useCase.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-purple-600">
                  {useCase.industry}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {useCase.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Technology Features */}
        <section className="py-16">
          <h2 className="text-4xl font-bold text-center mb-4">
            Built for 2025 and Beyond
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            we leverage the latest technologies to deliver unparalleled
            performance and security.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <feature.icon className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutPage;
