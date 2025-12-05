import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BatteryCharging,
  Zap,
  Bolt,
  Crown,
  Package,
  Sparkles,
  Gem,
  Check,
  ShoppingCart,
  ArrowRight,
  TrendingUp,
  DollarSign,
  CreditCard,
  Shield,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Users,
  Target,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TopupPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState("USD");
  const [topupPackages, setTopupPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState(null);
  const [expandedPackage, setExpandedPackage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [userPlanDetails, setUserPlanDetails] = useState(null);
  const [planCheckComplete, setPlanCheckComplete] = useState(false);

  const exchangeRate = 83.5;

  const iconMap = {
    Zap: Zap,
    Battery: BatteryCharging,
    BatteryCharging: BatteryCharging,
    Bolt: Bolt,
    Sparkles: Sparkles,
    Gem: Gem,
    Package: Package,
    Crown: Crown,
  };

  const categories = [
    { id: "all", name: "All Packages", icon: Package },
    { id: "popular", name: "Most Popular", icon: Star },
    { id: "conversion", name: "Conversion Focus", icon: TrendingUp },
    { id: "tools", name: "Tools Focus", icon: Target },
    { id: "value", name: "Best Value", icon: DollarSign },
  ];

  useEffect(() => {
    if (user) {
      checkEligibility();
      fetchTopupPackages();
      fetchUserCredits();
      fetchUserPlanDetails();
    } else {
      setLoading(false);
      setEligibilityLoading(false);
    }
  }, [user]);

  // Get detailed user info including plan details
  const fetchUserPlanDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found for plan details");
        return;
      }

      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUserPlanDetails(data.user);
          console.log("User plan details:", data.user);
        }
      }
    } catch (error) {
      console.error("Error fetching user plan details:", error);
    } finally {
      setPlanCheckComplete(true);
    }
  };

  // Check if user is eligible for top-ups
  const checkEligibility = async () => {
    setEligibilityLoading(true);
    
    if (!user) {
      setIsEligible(false);
      setEligibilityLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsEligible(false);
        setEligibilityLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/auth/topup/eligibility`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Eligibility response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("Eligibility data:", data);
        setIsEligible(data.eligible);
        
        if (!data.eligible) {
          toast({
            title: "Upgrade Required",
            description: data.message || "You need an active paid subscription to purchase top-up credits.",
            variant: "destructive",
            duration: 5000,
          });
        }
      } else {
        console.log("Eligibility check failed:", res.status);
        setIsEligible(false);
      }
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setIsEligible(false);
    } finally {
      setEligibilityLoading(false);
    }
  };

  const fetchTopupPackages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/topup`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch packages: ${res.status}`);
      }
      
      const data = await res.json();

      if (data.success) {
        setTopupPackages(data.packages || []);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load top-up packages",
          variant: "destructive",
        });
        setTopupPackages([]);
      }
    } catch (error) {
      console.error("Error fetching topup packages:", error);
      toast({
        title: "Error",
        description: "Failed to load top-up packages. Please try again later.",
        variant: "destructive",
      });
      setTopupPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found");
        return;
      }

      const res = await fetch(`${API_URL}/api/payments/topup/credits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUserCredits(data.credits || data);
        }
      } else if (res.status === 404) {
        console.log("Credits endpoint not found");
        setUserCredits(null);
      }
    } catch (error) {
      console.error("Error fetching user credits:", error);
      setUserCredits(null);
    }
  };

  const formatPrice = (usdPrice) => {
    if (!usdPrice && usdPrice !== 0) return "N/A";
    
    if (currency === "INR") {
      const inrPrice = Math.round(usdPrice * exchangeRate);
      return `₹${inrPrice.toLocaleString("en-IN")}`;
    }
    return `$${usdPrice.toFixed(2)}`;
  };

  const handlePurchase = async (pkg) => {
    // Check eligibility first
    if (!isEligible) {
      toast({
        title: "Upgrade Required",
        description: "You need an active paid subscription to purchase top-up credits.",
        variant: "destructive",
      });
      navigate("/pricing");
      return;
    }

    console.log("🔄 Purchase initiated for package:", pkg);
    console.log("🌐 API_URL:", API_URL);
    console.log("👤 User logged in:", !!user);
    console.log("🔑 Token exists:", !!localStorage.getItem("token"));

    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to purchase top-up credits",
        variant: "destructive",
      });
      navigate("/login", { state: { from: "/topup" } });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication error",
          description: "Please login again",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      setPurchaseLoading(true);
      
      // Prepare request body
      const requestBody = {
        topupPackageId: pkg.id || pkg._id,
        currency: currency,
      };

      console.log("📤 Sending request to:", `${API_URL}/api/payments/topup/create-order`);
      console.log("📝 Request body:", requestBody);

      // Make the payment request
      const response = await fetch(`${API_URL}/api/payments/topup/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response status text:", response.statusText);

      // Get response text first
      const responseText = await response.text();
      console.log("📥 Raw response text:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse JSON:", parseError);
        throw new Error("Invalid response from server");
      }

      console.log("📊 Parsed response:", data);

      if (!response.ok) {
        console.error("❌ HTTP Error:", response.status);
        
        let errorMessage = data.message || `HTTP error: ${response.status}`;
        
        if (response.status === 401) {
          errorMessage = "Session expired. Please login again.";
          localStorage.removeItem("token");
          navigate("/login");
        } else if (response.status === 404) {
          errorMessage = "Payment endpoint not found.";
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
        
        throw new Error(errorMessage);
      }

      if (data.success) {
        console.log("✅ API response success:", data);
        
        // Use the paymentLink from response (same as subscription)
        let paymentLink = data.paymentLink;
        
        // Fallback: Use paymentSessionId URL
        if (!paymentLink && data.paymentSessionId) {
          paymentLink = `https://sandbox.cashfree.com/pg/orders/sessions/${data.paymentSessionId}`;
          console.log("🔗 Using payment session URL");
        }
        
        // Last resort: construct from orderId
        if (!paymentLink && data.orderId) {
          paymentLink = `https://sandbox.cashfree.com/pg/orders/${data.orderId}/payments`;
          console.log("🔗 Constructed payment link from orderId");
        }
        
        if (paymentLink) {
          console.log("🔗 Final payment link:", paymentLink);
          
          toast({
            title: "Redirecting to payment",
            description: "You will be redirected to complete your payment",
            duration: 2000,
          });
          
          // Use window.location.href (same as subscription flow)
          setTimeout(() => {
            window.location.href = paymentLink;
          }, 1500);
          
        } else {
          console.error("❌ Could not generate payment link from:", data);
          throw new Error("Could not generate payment link. Please contact support.");
        }
        
      } else {
        console.error("❌ API returned success:false", data);
        throw new Error(data.message || "Failed to create payment order");
      }
    } catch (error) {
      console.error("❌ Topup purchase error:", error);
      
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  const calculateValueScore = (pkg) => {
    if (!pkg.totalCredits || !pkg.price) return "0.0";
    return (pkg.totalCredits / Math.max(pkg.price, 1)).toFixed(1);
  };

  const filterPackages = () => {
    if (selectedCategory === "all") return topupPackages;
    
    return topupPackages.filter(pkg => {
      if (!pkg) return false;
      
      switch (selectedCategory) {
        case "popular":
          return pkg.popular;
        case "conversion":
          return pkg.credits?.conversion > 50;
        case "tools":
          const toolCredits = (pkg.credits?.editTools || 0) + 
                            (pkg.credits?.organizeTools || 0) + 
                            (pkg.credits?.securityTools || 0) + 
                            (pkg.credits?.optimizeTools || 0) +
                            (pkg.credits?.advancedTools || 0) + 
                            (pkg.credits?.convertTools || 0);
          return toolCredits > 50;
        case "value":
          return calculateValueScore(pkg) > 15;
        default:
          return true;
      }
    });
  };

  const filteredPackages = filterPackages();

  const benefits = [
    {
      icon: Clock,
      title: "Never Expire",
      description: "Top-up credits never expire, use them anytime",
    },
    {
      icon: Shield,
      title: "Instant Activation",
      description: "Credits added immediately after payment",
    },
    {
      icon: DollarSign,
      title: "Cost Effective",
      description: "More affordable than upgrading your plan",
    },
    {
      icon: Users,
      title: "Flexible Usage",
      description: "Use credits for any tool you need",
    },
    {
      icon: CreditCard,
      title: "No Commitment",
      description: "One-time purchase, no subscription",
    },
    {
      icon: TrendingUp,
      title: "Boost Capacity",
      description: "Extend your monthly limits instantly",
    },
  ];

  const faqs = [
    {
      question: "How do top-up credits work?",
      answer: "Top-up credits are purchased separately from your subscription and are added to your account immediately. They're used automatically when you exceed your monthly subscription limits.",
    },
    {
      question: "Do top-up credits expire?",
      answer: "No! Top-up credits never expire. They remain in your account until you use them, even if you change or cancel your subscription.",
    },
    {
      question: "When are credits deducted?",
      answer: "Credits are deducted automatically when you use a tool. Your subscription credits are used first, then top-up credits are used if needed.",
    },
    {
      question: "Can I buy credits for specific tools?",
      answer: "Yes! Each package includes credits for specific tool types. Choose a package that matches your usage pattern.",
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept all major credit/debit cards, UPI, net banking (in India), and international payment methods.",
    },
    {
      question: "Can I get a refund?",
      answer: "Yes, unused credits can be refunded within 7 days of purchase. Contact our support team for assistance.",
    },
  ];

  const featureComparison = [
    {
      feature: "Top-up Credits",
      description: "One-time purchase, never expire",
      topup: true,
      upgrade: false,
    },
    {
      feature: "Plan Upgrade",
      description: "Recurring subscription",
      topup: false,
      upgrade: true,
    },
    {
      feature: "Instant Activation",
      description: "Credits added immediately",
      topup: true,
      upgrade: true,
    },
    {
      feature: "No Commitment",
      description: "Pay only when you need",
      topup: true,
      upgrade: false,
    },
    {
      feature: "Higher Monthly Limits",
      description: "Increase all your limits",
      topup: false,
      upgrade: true,
    },
    {
      feature: "Premium Features Access",
      description: "Access advanced tools",
      topup: false,
      upgrade: true,
    },
  ];

  // Get user's plan information
  const getUserPlanInfo = () => {
    if (!user && !userPlanDetails) return { planName: "Unknown", isFree: true };
    
    // Try multiple sources for plan info
    const planName = 
      userPlanDetails?.planName || 
      user?.planName || 
      userPlanDetails?.plan || 
      user?.plan || 
      "Free";
    
    // Check if it's a free plan (case-insensitive)
    const isFree = typeof planName === 'string' && 
                   planName.toLowerCase().includes('free');
    
    return { planName, isFree };
  };

  const { planName, isFree } = getUserPlanInfo();

  // Loading state
  if (eligibilityLoading || (loading && user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BatteryCharging className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-gray-600 mb-6">
            Please login to view and purchase top-up credits.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/login", { state: { from: "/topup" } })}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              Login
            </Button>
            
            <Button
              onClick={() => navigate("/signup", { state: { from: "/topup" } })}
              variant="outline"
              className="w-full"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Debug info for testing
  const showDebug = import.meta.env.DEV;
  
  // Check eligibility - show loading if still checking
  if (!planCheckComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-gray-600">Checking your subscription status...</p>
      </div>
    );
  }

  // Show debug info in development
  if (showDebug) {
    console.log("User object:", user);
    console.log("User plan details:", userPlanDetails);
    console.log("Plan name:", planName);
    console.log("Is free:", isFree);
    console.log("Is eligible:", isEligible);
  }

  // Not eligible - show appropriate message
  if (!isEligible) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">
            {isFree ? "Upgrade Required" : "Subscription Issue"}
          </h1>
          
          <div className="mb-6">
            <div className="inline-block bg-gray-100 px-4 py-2 rounded-lg mb-4">
              <span className="text-sm text-gray-600">Your current plan:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {typeof planName === 'string' ? planName : "Unknown Plan"}
              </span>
            </div>
            
            <p className="text-gray-600">
              {isFree ? (
                "Top-up credits are only available for active paid subscription plans. Upgrade to a Starter, Professional, or Enterprise plan to purchase extra credits."
              ) : (
                "Your subscription may be inactive or expired. Please check your account status or contact support."
              )}
            </p>
          </div>
          
          <div className="space-y-3">
            {isFree ? (
              <Button
                onClick={() => navigate("/pricing")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                View Paid Plans
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                Go to Dashboard
              </Button>
            )}
            
            <Button
              onClick={() => navigate("/tools")}
              variant="outline"
              className="w-full"
            >
              Continue Using Tools
            </Button>
            
            {showDebug && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-left">
                <h4 className="text-sm font-semibold mb-2">Debug Info:</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify({
                    userHasPlan: !!user?.plan,
                    userPlanName: user?.planName,
                    userPlan: user?.plan,
                    userPlanDetails,
                    isEligible,
                    isFree,
                  }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Eligible user - show full top-up page
  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
              <BatteryCharging className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
          Top-up Credits ⚡
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Never run out of credits! Purchase additional credits anytime without changing your subscription plan.
        </p>

        {/* User Plan Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2 rounded-full border border-emerald-200"
        >
          <span className="text-sm text-gray-600">Your current plan:</span>
          <span className="font-semibold text-emerald-700">
            {typeof planName === 'string' ? planName : "Paid Plan"}
          </span>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
            Eligible for Top-ups
          </span>
        </motion.div>

        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border">
            <span className={`font-semibold ${currency === "USD" ? "text-gray-900" : "text-gray-500"}`}>
              USD
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={currency === "INR"}
                onChange={() => setCurrency(currency === "INR" ? "USD" : "INR")}
              />
              <div className="w-12 h-6 bg-emerald-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
            <span className={`font-semibold ${currency === "INR" ? "text-gray-900" : "text-gray-500"}`}>
              INR
            </span>
          </div>
        </div>

        {userCredits && user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-2xl p-6 max-w-md mx-auto"
          >
            <h3 className="font-bold text-gray-900 mb-3">Your Current Credits</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 p-3 rounded-lg">
                <div className="text-xs text-emerald-600">Total Available</div>
                <div className="text-xl font-bold text-emerald-700">
                  {userCredits.available?.total || 
                   Object.values(userCredits.available || {}).reduce((a, b) => a + b, 0)}
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-600">Used This Month</div>
                <div className="text-xl font-bold text-blue-700">
                  {Object.values(userCredits.usage || {}).reduce((a, b) => a + b, 0)}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate("/dashboard")}
            >
              View Detailed Breakdown
            </Button>
          </motion.div>
        )}

        {showDebug && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Debug Info:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({
                userPlan: user?.plan,
                userPlanName: user?.planName,
                userPlanDetails: userPlanDetails,
                isEligible,
                eligibilityLoading,
                planCheckComplete,
              }, null, 2)}
            </pre>
          </div>
        )}
      </motion.div>

      {/* Benefits Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-bold text-center">Why Top-up Credits?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white rounded-2xl p-6 shadow-sm border hover-lift"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                <benefit.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Packages Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Choose Your Package</h2>
            <p className="text-gray-600">Select the perfect credit package for your needs</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white border-emerald-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-emerald-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {filteredPackages.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {topupPackages.length === 0 ? "No Packages Available" : "No Packages Found"}
            </h3>
            <p className="text-gray-500">
              {topupPackages.length === 0 
                ? "Top-up packages are not currently available. Please check back later."
                : "Try selecting a different category"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg, index) => {
              if (!pkg) return null;
              
              const IconComponent = iconMap[pkg.icon] || Package;
              const totalCredits = pkg.totalCredits || 0;
              const valueScore = calculateValueScore(pkg);
              const isExpanded = expandedPackage === pkg.id;
              
              return (
                <motion.div
                  key={pkg.id || pkg._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`bg-white rounded-2xl p-6 shadow-lg border-2 hover-lift flex flex-col ${
                    pkg.popular ? "border-emerald-500 ring-2 ring-emerald-100" : "border-gray-200"
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                        ⭐ Most Popular
                      </span>
                    </div>
                  )}

                  {pkg.badgeText && !pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {pkg.badgeText}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pkg.color || "from-blue-500 to-cyan-600"} flex items-center justify-center`}>
                      <IconComponent className="h-7 w-7 text-white" />
                    </div>
                    {valueScore > 15 && (
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                        Best Value
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name || "Unnamed Package"}</h3>
                  <p className="text-gray-600 text-sm mb-4">{pkg.description || "No description available"}</p>

                  <div className="mb-4">
                    <div className="flex items-baseline mb-1">
                      <span className="text-3xl font-bold text-gray-900">{formatPrice(pkg.price)}</span>
                      <span className="text-gray-500 ml-2 text-sm">one-time</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{totalCredits} total credits</span>
                      <span className="font-medium">{valueScore} credits/$</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Credits Included:</span>
                      <button
                        onClick={() => setExpandedPackage(isExpanded ? null : pkg.id)}
                        className="text-emerald-600 text-sm hover:text-emerald-700"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 inline ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 inline ml-1" />
                        )}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {pkg.credits?.conversion > 0 && (
                        <div className="flex items-center text-sm">
                          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 text-xs">
                            {pkg.credits.conversion}
                          </div>
                          <span className="text-gray-600">Conversions</span>
                        </div>
                      )}
                      {pkg.credits?.editTools > 0 && (
                        <div className="flex items-center text-sm">
                          <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2 text-xs">
                            {pkg.credits.editTools}
                          </div>
                          <span className="text-gray-600">Edit Tools</span>
                        </div>
                      )}
                      {pkg.credits?.organizeTools > 0 && (
                        <div className="flex items-center text-sm">
                          <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-2 text-xs">
                            {pkg.credits.organizeTools}
                          </div>
                          <span className="text-gray-600">Organize</span>
                        </div>
                      )}
                      {pkg.credits?.securityTools > 0 && (
                        <div className="flex items-center text-sm">
                          <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-2 text-xs">
                            {pkg.credits.securityTools}
                          </div>
                          <span className="text-gray-600">Security</span>
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-3 pt-3 border-t"
                      >
                        {pkg.credits?.optimizeTools > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Optimize Tools:</span>
                            <span className="font-medium">{pkg.credits.optimizeTools} credits</span>
                          </div>
                        )}
                        {pkg.credits?.advancedTools > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Advanced Tools:</span>
                            <span className="font-medium">{pkg.credits.advancedTools} credits</span>
                          </div>
                        )}
                        {pkg.credits?.convertTools > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Convert Tools:</span>
                            <span className="font-medium">{pkg.credits.convertTools} credits</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold pt-3 border-t">
                          <span>Total Credits:</span>
                          <span className="text-emerald-600">{totalCredits}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-auto">
                    <Button
                      onClick={() => handlePurchase(pkg)}
                      disabled={purchaseLoading}
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                    >
                      {purchaseLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Purchase Now
                        </>
                      )}
                    </Button>
                    <p className="text-center text-xs text-gray-500 mt-2">
                      Instant activation • Never expires
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Comparison Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-effect rounded-2xl p-6"
      >
        <h2 className="text-2xl font-bold text-center mb-6">Top-up vs Upgrade</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mr-4">
                <BatteryCharging className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Top-up Credits</h3>
                <p className="text-gray-600 text-sm">Perfect for temporary needs</p>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">One-time purchase</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Credits never expire</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Instant activation</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">More cost-effective for occasional use</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mr-4">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Plan Upgrade</h3>
                <p className="text-gray-600 text-sm">Better for consistent needs</p>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Recurring subscription</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Higher monthly limits</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Access to premium features</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Better for heavy, consistent usage</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Not sure which is right for you?{" "}
            <Button variant="link" onClick={() => navigate("/pricing")} className="text-emerald-600">
              Compare all subscription plans <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </p>
        </div>
      </motion.div>

      {/* Feature Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-effect rounded-2xl p-6"
      >
        <h2 className="text-2xl font-bold text-center mb-6">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg overflow-hidden shadow-sm border">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                <th className="p-3 font-semibold text-left">Feature</th>
                <th className="p-3 font-semibold text-center">Description</th>
                <th className="p-3 font-semibold text-center">Top-up</th>
                <th className="p-3 font-semibold text-center">Upgrade</th>
              </tr>
            </thead>
            <tbody>
              {featureComparison.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="p-3 font-medium text-gray-900 border-r">{item.feature}</td>
                  <td className="p-3 text-gray-600 border-r text-center text-sm">{item.description}</td>
                  <td className="p-3 text-center border-r">
                    {item.topup ? (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-red-400 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.upgrade ? (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-red-400 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-effect rounded-2xl p-6"
      >
        <h2 className="text-2xl font-bold text-center mb-6">Top-up FAQ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {faqs.slice(0, 3).map((faq, index) => (
              <div key={index} className="border-b pb-4">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-600" />
                  {faq.question}
                </h3>
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {faqs.slice(3).map((faq, index) => (
              <div key={index} className="border-b pb-4">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-600" />
                  {faq.question}
                </h3>
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl text-white p-8">
          <h2 className="text-2xl font-bold mb-3">Ready to Never Run Out Again?</h2>
          <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
            Purchase top-up credits today and continue working without interruptions. Perfect for when you're close to your limits or have an important project.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-3 font-semibold rounded-full text-lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Choose Your Package Above
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-emerald-600 px-6 py-3 font-semibold rounded-full"
            >
              Check Your Credits
            </Button>
          </div>
          <p className="text-emerald-200 text-xs mt-4">
            All prices in {currency}. Secure payment • Instant activation • 24/7 support
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// Add the missing X icon component
const X = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default TopupPage;