import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Check,
  FileText,
  Zap,
  Crown,
  Building2,
  Download,
  Star,
  Globe,
  X,
  ChevronDown,
  ChevronUp,
  BatteryCharging,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Metatags from "../SEO/metatags";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const BillingPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("annual");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [currency, setCurrency] = useState("USD");
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState(null);

  // Currency conversion rates
  const exchangeRate = 83.5;

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/pricing`);
      const data = await res.json();

      if (data.success) {
        setPricingPlans(data.plans);
      } else {
        toast({
          title: "Error",
          description: "Failed to load pricing plans",
          variant: "destructive",
        });
        setPricingPlans([]);
      }
    } catch (error) {
      console.error("Error fetching pricing plans:", error);
      toast({
        title: "Error",
        description: "Failed to load pricing plans",
        variant: "destructive",
      });
      setPricingPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (usdPrice, isCustom = false) => {
    if (isCustom) return "Custom";

    if (currency === "INR") {
      const inrPrice = Math.round(usdPrice * exchangeRate);
      return `₹${inrPrice.toLocaleString("en-IN")}`;
    }
    return `$${usdPrice}`;
  };

  const formatPeriod = (plan, isCustom = false) => {
    if (isCustom || plan.id === "enterprise") return "Tailored to your needs";

    const monthlyPrice =
      billingCycle === "annual"
        ? plan.billingCycles?.annual / 12 || plan.usdPrice * 0.75
        : plan.usdPrice;

    if (currency === "INR") {
      const inrMonthlyPrice = Math.round(monthlyPrice * exchangeRate);
      const annualPrice = Math.round(
        (plan.billingCycles?.annual || plan.usdPrice * 12 * 0.75) * exchangeRate
      );

      if (billingCycle === "annual") {
        return `Billed annually (₹${annualPrice.toLocaleString("en-IN")})`;
      }
      return `Billed monthly`;
    }

    if (billingCycle === "annual") {
      const annualPrice =
        plan.billingCycles?.annual || plan.usdPrice * 12 * 0.75;
      return `Billed annually ($${annualPrice})`;
    }
    return `Billed monthly`;
  };

  const getPlanPrice = (plan) => {
    if (plan.id === "enterprise") return formatPrice(0, true);

    const monthlyPrice =
      billingCycle === "annual"
        ? plan.billingCycles?.annual / 12 || plan.usdPrice * 0.75
        : plan.usdPrice;

    return formatPrice(monthlyPrice);
  };

  // Icon mapping
  const iconMap = {
    Zap: Zap,
    FileText: FileText,
    Crown: Crown,
    Building2: Building2,
  };

  // Generate ALL features list for each plan DYNAMICALLY
  const generateDetailedFeatures = (plan) => {
    const features = [];

    // Core conversion feature
    features.push({
      text: `${
        plan.conversionLimit > 0 ? plan.conversionLimit : "Unlimited"
      } PDF conversions per month`,
      available: true,
      highlight: true,
      icon: "📄",
    });

    // All tool features - always show them
    features.push({
      text: `${
        plan.editToolsLimit > 0 ? plan.editToolsLimit : "Unlimited"
      } Edit tools usage`,
      available: true,
      highlight: true,
      icon: "📝",
    });

    features.push({
      text: `${
        plan.organizeToolsLimit > 0 ? plan.organizeToolsLimit : "Unlimited"
      } Organize tools usage`,
      available: true,
      highlight: true,
      icon: "📑",
    });

    features.push({
      text: `${
        plan.securityToolsLimit > 0 ? plan.securityToolsLimit : "Unlimited"
      } Security tools usage`,
      available: true,
      highlight: true,
      icon: "🔒",
    });

    features.push({
      text: `${
        plan.optimizeToolsLimit > 0 ? plan.optimizeToolsLimit : "Unlimited"
      } Optimize tools usage`,
      available: true,
      highlight: true,
      icon: "⚡",
    });

    features.push({
      text: `${
        plan.advancedToolsLimit > 0 ? plan.advancedToolsLimit : "Unlimited"
      } Advanced tools usage`,
      available: plan.advancedToolsLimit >= 0,
      highlight: true,
      icon: "🚀",
    });

    // File size and storage
    features.push({
      text: `${
        plan.maxFileSize > 0 ? `${plan.maxFileSize}MB` : "No"
      } file size limits`,
      available: true,
      highlight: false,
      icon: "💾",
    });

    features.push({
      text: `${
        plan.storage > 0 ? `${plan.storage}GB` : "Unlimited"
      } cloud storage`,
      available: true,
      highlight: false,
      icon: "☁️",
    });

    // Support
    features.push({
      text: `${plan.supportType} support`,
      available: true,
      highlight: false,
      icon: "💬",
    });

    // Advanced features
    if (plan.hasBatchProcessing) {
      features.push({
        text: "Batch file processing",
        available: plan.hasBatchProcessing,
        highlight: false,
        icon: "🔄",
      });
    }

    if (plan.hasOCR) {
      features.push({
        text: "OCR text recognition",
        available: plan.hasOCR,
        highlight: false,
        icon: "👁️",
      });
    }

    if (plan.hasDigitalSignatures) {
      features.push({
        text: "Digital signatures",
        available: plan.hasDigitalSignatures,
        highlight: false,
        icon: "✍️",
      });
    }

    if (plan.hasAPIAccess) {
      features.push({
        text: "API access",
        available: plan.hasAPIAccess,
        highlight: false,
        icon: "🔌",
      });
    }

    if (plan.hasTeamCollaboration) {
      features.push({
        text: "Team collaboration tools",
        available: plan.hasTeamCollaboration,
        highlight: false,
        icon: "👥",
      });
    }

    if (!plan.hasWatermarks) {
      features.push({
        text: "No watermarks on outputs",
        available: !plan.hasWatermarks,
        highlight: false,
        icon: "🚫",
      });
    }

    return features;
  };

  // Generate feature comparison from dynamic plans
  const generateFeatureComparison = () => {
    if (pricingPlans.length === 0) return [];

    const freePlan =
      pricingPlans.find((p) => p.id === "free") || pricingPlans[0];
    const starterPlan =
      pricingPlans.find((p) => p.id === "starter") || pricingPlans[1];
    const professionalPlan =
      pricingPlans.find((p) => p.id === "professional") || pricingPlans[2];
    const enterprisePlan =
      pricingPlans.find((p) => p.id === "enterprise") || pricingPlans[3];

    const comparison = [
      {
        feature: "Monthly PDF Conversions",
        free:
          freePlan?.conversionLimit > 0
            ? `${freePlan.conversionLimit} files`
            : "Unlimited",
        starter:
          starterPlan?.conversionLimit > 0
            ? `${starterPlan.conversionLimit} files`
            : "Unlimited",
        professional:
          professionalPlan?.conversionLimit > 0
            ? `${professionalPlan.conversionLimit} files`
            : "Unlimited",
        enterprise:
          enterprisePlan?.conversionLimit > 0
            ? `${enterprisePlan.conversionLimit} files`
            : "Unlimited",
      },
      {
        feature: "Edit Tools Usage",
        free:
          freePlan?.editToolsLimit > 0
            ? `${freePlan.editToolsLimit} uses`
            : "Unlimited",
        starter:
          starterPlan?.editToolsLimit > 0
            ? `${starterPlan.editToolsLimit} uses`
            : "Unlimited",
        professional:
          professionalPlan?.editToolsLimit > 0
            ? `${professionalPlan.editToolsLimit} uses`
            : "Unlimited",
        enterprise:
          enterprisePlan?.editToolsLimit > 0
            ? `${enterprisePlan.editToolsLimit} uses`
            : "Unlimited",
      },
      {
        feature: "Organize Tools Usage",
        free:
          freePlan?.organizeToolsLimit > 0
            ? `${freePlan.organizeToolsLimit} uses`
            : "Unlimited",
        starter:
          starterPlan?.organizeToolsLimit > 0
            ? `${starterPlan.organizeToolsLimit} uses`
            : "Unlimited",
        professional:
          professionalPlan?.organizeToolsLimit > 0
            ? `${professionalPlan.organizeToolsLimit} uses`
            : "Unlimited",
        enterprise:
          enterprisePlan?.organizeToolsLimit > 0
            ? `${enterprisePlan.organizeToolsLimit} uses`
            : "Unlimited",
      },
      {
        feature: "Security Tools Usage",
        free:
          freePlan?.securityToolsLimit > 0
            ? `${freePlan.securityToolsLimit} uses`
            : "Unlimited",
        starter:
          starterPlan?.securityToolsLimit > 0
            ? `${starterPlan.securityToolsLimit} uses`
            : "Unlimited",
        professional:
          professionalPlan?.securityToolsLimit > 0
            ? `${professionalPlan.securityToolsLimit} uses`
            : "Unlimited",
        enterprise:
          enterprisePlan?.securityToolsLimit > 0
            ? `${enterprisePlan.securityToolsLimit} uses`
            : "Unlimited",
      },
      {
        feature: "Optimize Tools Usage",
        free:
          freePlan?.optimizeToolsLimit > 0
            ? `${freePlan.optimizeToolsLimit} uses`
            : "Unlimited",
        starter:
          starterPlan?.optimizeToolsLimit > 0
            ? `${starterPlan.optimizeToolsLimit} uses`
            : "Unlimited",
        professional:
          professionalPlan?.optimizeToolsLimit > 0
            ? `${professionalPlan.optimizeToolsLimit} uses`
            : "Unlimited",
        enterprise:
          enterprisePlan?.optimizeToolsLimit > 0
            ? `${enterprisePlan.optimizeToolsLimit} uses`
            : "Unlimited",
      },
      {
        feature: "Advanced Tools Usage",
        free:
          freePlan?.advancedToolsLimit > 0
            ? `${freePlan.advancedToolsLimit} uses`
            : "Unlimited",
        starter:
          starterPlan?.advancedToolsLimit > 0
            ? `${starterPlan.advancedToolsLimit} uses`
            : "Unlimited",
        professional:
          professionalPlan?.advancedToolsLimit > 0
            ? `${professionalPlan.advancedToolsLimit} uses`
            : "Unlimited",
        enterprise:
          enterprisePlan?.advancedToolsLimit > 0
            ? `${enterprisePlan.advancedToolsLimit} uses`
            : "Unlimited",
      },
      {
        feature: "Max File Size",
        free:
          freePlan?.maxFileSize > 0
            ? `${freePlan.maxFileSize} MB`
            : "Unlimited",
        starter:
          starterPlan?.maxFileSize > 0
            ? `${starterPlan.maxFileSize} MB`
            : "Unlimited",
        professional:
          professionalPlan?.maxFileSize > 0
            ? `${professionalPlan.maxFileSize} MB`
            : "Unlimited",
        enterprise:
          enterprisePlan?.maxFileSize > 0
            ? `${enterprisePlan.maxFileSize} MB`
            : "Unlimited",
      },
      {
        feature: "Cloud Storage",
        free: freePlan?.storage > 0 ? `${freePlan.storage} GB` : "Unlimited",
        starter:
          starterPlan?.storage > 0 ? `${starterPlan.storage} GB` : "Unlimited",
        professional:
          professionalPlan?.storage > 0
            ? `${professionalPlan.storage} GB`
            : "Unlimited",
        enterprise:
          enterprisePlan?.storage > 0
            ? `${enterprisePlan.storage} GB`
            : "Unlimited",
      },
    ];

    // Add advanced features dynamically
    const advancedFeatures = [
      { key: "hasBatchProcessing", label: "Batch Processing" },
      { key: "hasOCR", label: "OCR Text Recognition" },
      { key: "hasDigitalSignatures", label: "Digital Signatures" },
      { key: "hasAPIAccess", label: "API Access" },
      { key: "hasTeamCollaboration", label: "Team Collaboration" },
      { key: "hasWatermarks", label: "Watermarks", invert: true },
    ];

    advancedFeatures.forEach((feature) => {
      comparison.push({
        feature: feature.label,
        free: feature.invert
          ? !freePlan?.[feature.key]
          : freePlan?.[feature.key],
        starter: feature.invert
          ? !starterPlan?.[feature.key]
          : starterPlan?.[feature.key],
        professional: feature.invert
          ? !professionalPlan?.[feature.key]
          : professionalPlan?.[feature.key],
        enterprise: feature.invert
          ? !enterprisePlan?.[feature.key]
          : enterprisePlan?.[feature.key],
      });
    });

    // Add support type
    comparison.push({
      feature: "Support Type",
      free: freePlan?.supportType || "Community",
      starter: starterPlan?.supportType || "Email",
      professional: professionalPlan?.supportType || "Priority",
      enterprise: enterprisePlan?.supportType || "24/7 Dedicated",
    });

    return comparison;
  };

  const featureComparison = generateFeatureComparison();

  const faqs = [
    {
      question: "What can I do with the free plan?",
      answer:
        "The free plan includes basic PDF conversions with limited features. Perfect for occasional personal use.",
    },
    {
      question: "What file formats do you support for conversion?",
      answer:
        "We support all major formats including PDF to Word, Excel, PowerPoint, Images (JPG, PNG), HTML, and vice versa. Higher plans unlock more advanced features.",
    },
    {
      question: "How secure are my PDF files?",
      answer:
        "Your files are encrypted in transit and at rest. We automatically delete all processed files from our servers within 24 hours. Enterprise plans offer extended retention options.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes, you can cancel your subscription at any time. When you cancel, you'll continue to have access to your plan features until the end of your billing period.",
    },
    {
      question: `Do you offer discounts for annual billing?`,
      answer: `Yes, we offer significant discounts when you choose annual billing instead of monthly payments across all paid plans.`,
    },
    {
      question: "What happens if I exceed my monthly conversion limit?",
      answer:
        "If you exceed your monthly limit, you can upgrade to a higher plan or wait until your limits reset the following month. We'll notify you when you're approaching your limit.",
    },
    {
      question: "Is there a free trial available?",
      answer:
        "Yes, we offer free trials for our paid plans with full access to all features. No credit card required to start your trial.",
    },
    {
      question: "Can I upgrade from free to paid plan?",
      answer:
        "Absolutely! You can upgrade anytime. When you upgrade, your conversion limits reset immediately and you get access to all the new features of your chosen plan.",
    },
    {
      question: `Do you support Indian Rupee (INR) payments?`,
      answer: `Yes! You can view prices in INR and pay in Indian Rupees. We support all major Indian payment methods including UPI, Net Banking, and credit/debit cards.`,
    },
  ];

  const handleUpgrade = (planId) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to upgrade your plan",
        variant: "destructive",
      });
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    // Prevent upgrading to same plan
    if (planId === user?.plan) {
      toast({
        title: "Already subscribed",
        description: `You're already on the ${planId} plan`,
      });
      return;
    }

    // Free plan selection (no payment)
    if (planId === "free") {
      updateUserPlanToFree();
      return;
    }

    // For paid plans → Redirect to Checkout.jsx
    navigate(`/checkout/${planId}`);
  };

  const updateUserPlanToFree = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/auth/plan/free`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        updateUser({
          plan: "free",
          planName: "Free",
          subscriptionStatus: "active",
        });
        toast({
          title: "Plan updated",
          description: "You are now on the Free plan",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update plan",
        variant: "destructive",
      });
    }
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const togglePlanFeatures = (planId) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  const getCurrentUsage = () => {
    const plan = pricingPlans.find((p) => p.id === user?.plan);
    const used = user?.usage?.conversions || 0;
    const limit = plan?.conversionLimit || 10;
    const percentage = (used / limit) * 100;

    return { used, limit, percentage, planName: plan?.name };
  };

  const { used, limit, percentage, planName } = getCurrentUsage();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (pricingPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">
          No Pricing Plans Available
        </h2>
        <p className="text-gray-500 mb-4">
          Please check back later or contact support.
        </p>
        <Button
          onClick={fetchPricingPlans}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Retry
        </Button>
      </div>
    );
  }

  const metaPropsData = {
    title: "Free PDF Tools Pricing | Upgrade to Premium Plans - PDF Works",
    description:
      "Start with 100% free PDF tools forever. Compare pricing plans with free, starter, professional & enterprise options. No credit card required for free plan. Unlimited PDF conversions with free tier.",
    keyword:
      "free pdf tools pricing, pdf works pricing, free pdf converter pricing, pdf tools cost, free pdf editor pricing, pdf conversion pricing, free forever pdf tools, pdf tools subscription, pdf works plans, free pdf tools no credit card, pdf tools free trial, upgrade pdf tools, pdf tools comparison, free vs premium pdf tools",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/pricing",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="space-y-12 max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r py-3 from-blue-600 to-purple-600 bg-clip-text text-transparent">
            PDF Works Pricing
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Start free, upgrade as you grow. No credit card required to begin.
          </p>

          {/* Currency Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
            {/* Billing Toggle */}
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border">
              <span
                className={`font-semibold ${
                  billingCycle === "monthly" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Monthly
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={billingCycle === "annual"}
                  onChange={() =>
                    setBillingCycle(
                      billingCycle === "annual" ? "monthly" : "annual"
                    )
                  }
                />
                <div className="w-12 h-6 bg-blue-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span
                className={`font-semibold flex items-center gap-2 ${
                  billingCycle === "annual" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                Annual
                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                  Save 25%
                </span>
              </span>
            </div>

            {/* Currency Toggle */}
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border">
              <Globe className="h-4 w-4 text-gray-600" />
              <span
                className={`font-semibold ${
                  currency === "USD" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                USD
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={currency === "INR"}
                  onChange={() =>
                    setCurrency(currency === "INR" ? "USD" : "INR")
                  }
                />
                <div className="w-12 h-6 bg-blue-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span
                className={`font-semibold ${
                  currency === "INR" ? "text-gray-900" : "text-gray-500"
                }`}
              >
                INR
              </span>
            </div>
          </div>

          {/* Exchange Rate Notice */}
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {currency === "INR" ? (
                <>
                  Exchange rate: 1 USD ≈ ₹{exchangeRate}. Prices in INR include
                  all applicable taxes.
                </>
              ) : (
                <>
                  All prices in USD. Switch to INR for local currency pricing.
                </>
              )}
            </p>
          </div>
        </motion.div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {pricingPlans.map((plan, index) => {
            const Icon = iconMap[plan.icon] || FileText;
            const isCurrentPlan = user?.plan === plan.id;
            const isFreePlan = plan.id === "free";
            const isEnterprise = plan.id === "enterprise";
            const detailedFeatures = generateDetailedFeatures(plan);
            const isExpanded = expandedPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass-effect rounded-2xl p-6 flex flex-col hover-lift relative ${
                  plan.popular
                    ? "ring-2 ring-purple-500 shadow-lg scale-105"
                    : ""
                } ${isFreePlan ? "border-2 border-green-200" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                {isFreePlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Free Forever
                    </span>
                  </div>
                )}

                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {getPlanPrice(plan)}
                  </span>
                  {!isFreePlan && !isEnterprise && (
                    <span className="text-gray-500 text-lg ml-1">
                      {currency === "INR" ? "/mo" : "/mo"}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  {formatPeriod(plan, isEnterprise)}
                </p>
                <p className="text-gray-700 text-sm mb-4">{plan.description}</p>

                {/* Tool Limits Summary */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    {plan.conversionLimit > 0
                      ? `${plan.conversionLimit} conversions/month`
                      : "Unlimited conversions"}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                    <div>
                      📝{" "}
                      {plan.editToolsLimit > 0
                        ? `${plan.editToolsLimit} edits`
                        : "Unlimited edits"}
                    </div>
                    <div>
                      📑{" "}
                      {plan.organizeToolsLimit > 0
                        ? `${plan.organizeToolsLimit} organize`
                        : "Unlimited organize"}
                    </div>
                    <div>
                      🔒{" "}
                      {plan.securityToolsLimit > 0
                        ? `${plan.securityToolsLimit} security`
                        : "Unlimited security"}
                    </div>
                    <div>
                      ⚡{" "}
                      {plan.optimizeToolsLimit > 0
                        ? `${plan.optimizeToolsLimit} optimize`
                        : "Unlimited optimize"}
                    </div>
                    {plan.advancedToolsLimit > 0 && (
                      <div>🚀 {plan.advancedToolsLimit} advanced</div>
                    )}
                  </div>
                  {!isFreePlan && !isEnterprise && currency === "INR" && (
                    <div className="text-xs text-gray-500 mt-1">
                      ≈{" "}
                      {formatPrice(
                        plan.usdPrice / (billingCycle === "annual" ? 12 : 1)
                      )}
                      /conversion
                    </div>
                  )}
                </div>

                {/* Expandable Detailed Features List */}
                <div className="mb-6">
                  <button
                    onClick={() => togglePlanFeatures(plan.id)}
                    className="flex items-center justify-between w-full mb-3 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>View All Features</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  <div
                    className={`space-y-3 transition-all duration-300 ${
                      isExpanded
                        ? "max-h-[500px] opacity-100"
                        : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                  >
                    {detailedFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 list-none">
                        {feature.available ? (
                          <Check
                            className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                              feature.highlight
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          />
                        ) : (
                          <X className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
                        )}
                        <span
                          className={`text-xs flex items-center gap-2 ${
                            feature.available
                              ? feature.highlight
                                ? "text-gray-800 font-medium"
                                : "text-gray-600"
                              : "text-gray-400 line-through"
                          }`}
                        >
                          <span className="text-sm">{feature.icon}</span>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </div>

                  {/* Always show first 3 features */}
                  <ul className="space-y-3">
                    {detailedFeatures.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {feature.available ? (
                          <Check
                            className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                              feature.highlight
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          />
                        ) : (
                          <X className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
                        )}
                        <span
                          className={`text-xs flex items-center gap-2 ${
                            feature.available
                              ? feature.highlight
                                ? "text-gray-800 font-medium"
                                : "text-gray-600"
                              : "text-gray-400 line-through"
                          }`}
                        >
                          <span className="text-sm">{feature.icon}</span>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrentPlan}
                  className={`w-full ${
                    isCurrentPlan
                      ? "bg-gray-300 cursor-not-allowed"
                      : isFreePlan
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      : `bg-gradient-to-r ${plan.color} hover:opacity-90`
                  }`}
                >
                  {isCurrentPlan ? "Current Plan" : plan.ctaText}
                </Button>

                {!isFreePlan && !isEnterprise && (
                  <div className="text-center mt-3">
                    <p className="text-xs text-gray-500">
                      {billingCycle === "annual"
                        ? currency === "INR"
                          ? `Equivalent to ${formatPrice(
                              plan.usdPrice / 12
                            )}/month`
                          : `Equivalent to $${(plan.usdPrice / 12).toFixed(
                              2
                            )}/month`
                        : "Cancel anytime"}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Rest of the component remains the same... */}
        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-effect rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Compare All Features
          </h2>
          <div className="overflow-x-auto">
            <div className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm border">
              <div className="grid grid-cols-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="p-3 font-semibold text-left text-sm">
                  PDF Features
                </div>
                <div className="p-3 font-semibold text-center text-sm">
                  Free
                </div>
                <div className="p-3 font-semibold text-center text-sm">
                  Starter
                </div>
                <div className="p-3 font-semibold text-center text-sm">
                  Professional
                </div>
                <div className="p-3 font-semibold text-center text-sm">
                  Enterprise
                </div>
              </div>

              {featureComparison.map((item, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-5 ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <div className="p-3 font-medium text-gray-900 border-r text-sm">
                    {item.feature}
                  </div>
                  <div className="p-3 text-center border-r text-sm">
                    {typeof item.free === "boolean" ? (
                      item.free ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-red-400 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-700">{item.free}</span>
                    )}
                  </div>
                  <div className="p-3 text-center border-r text-sm">
                    {typeof item.starter === "boolean" ? (
                      item.starter ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-red-400 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-700">{item.starter}</span>
                    )}
                  </div>
                  <div className="p-3 text-center border-r text-sm">
                    {typeof item.professional === "boolean" ? (
                      item.professional ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-red-400 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-700">{item.professional}</span>
                    )}
                  </div>
                  <div className="p-3 text-center text-sm">
                    {typeof item.enterprise === "boolean" ? (
                      item.enterprise ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-red-400 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-700">{item.enterprise}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Usage Progress */}
        {user && user.plan !== "enterprise" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-effect rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-4">Your Monthly Usage</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">PDF Conversions</span>
                  <span className="font-semibold">
                    {used} / {limit} used
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      percentage >= 90
                        ? "bg-red-500"
                        : percentage >= 75
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {percentage >= 90
                    ? "You ve reached your limit. Upgrade to continue converting."
                    : percentage >= 75
                    ? "Youre approaching your limit. Consider upgrading for more conversions."
                    : `You're on the ${planName} plan.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-effect rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors bg-white"
              >
                <div
                  className="p-4 flex justify-between items-center hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => toggleFaq(index)}
                >
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {faq.question}
                  </h3>
                  <span
                    className={`transform transition-transform ${
                      expandedFaq === index ? "rotate-180" : ""
                    }`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
                {expandedFaq === index && (
                  <div className="p-4 pt-0 text-gray-700 text-sm border-t">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center py-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl text-white"
        >
          <div className="flex justify-center mb-4">
            <Download className="h-10 w-10 text-white opacity-90" />
          </div>
          <h2 className="text-2xl font-bold mb-3">
            Ready to Transform Your PDF Workflow?
          </h2>
          <p className="text-blue-100 text-sm mb-4 max-w-2xl mx-auto">
            Start with our free plan today. No credit card required. Upgrade
            anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => handleUpgrade("free")}
              className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2 font-semibold rounded-full"
            >
              Start Free Plan
            </Button>
            <Button
              onClick={() => handleUpgrade("professional")}
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 py-2 font-semibold rounded-full"
            >
              Try Professional Free
            </Button>
          </div>
          <p className="text-blue-200 text-xs mt-3">
            {currency === "INR" ? "Prices in INR include taxes • " : ""}14-day
            free trial on paid plans • No commitment
          </p>
        </motion.div>
        {/* Top-up CTA Section */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.7 }}
  className="text-center py-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl text-white"
>
  <div className="flex justify-center mb-4">
    <BatteryCharging className="h-10 w-10 text-white opacity-90" />
  </div>
  <h2 className="text-2xl font-bold mb-3">Need Extra Credits?</h2>
  <p className="text-emerald-100 text-sm mb-4 max-w-2xl mx-auto">
    Never run out of credits! Purchase additional credits anytime without changing your subscription plan.
  </p>
  <div className="flex flex-col sm:flex-row gap-3 justify-center">
    <Button
      onClick={() => navigate("/topup")}
      className="bg-white text-emerald-600 hover:bg-emerald-50 px-6 py-2 font-semibold rounded-full"
    >
      View Top-up Packages
    </Button>
    <Button
      onClick={() => navigate("/dashboard")}
      className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-emerald-600 px-6 py-2 font-semibold rounded-full"
    >
      Check Your Credits
    </Button>
  </div>
  <p className="text-emerald-200 text-xs mt-3">
    Top-up credits never expire • Use anytime • Instant activation
  </p>
</motion.div>
      </div>
    </>
  );
};

export default BillingPage;
