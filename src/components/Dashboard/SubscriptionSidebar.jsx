import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Crown, HardDrive, CreditCard, CheckCircle, XCircle, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const SubscriptionSidebar = ({ user, planLimits, stats, navigate, getUsagePercentage }) => {
  const { getToken } = useAuth();
  const [actualPlanData, setActualPlanData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch actual plan data from API
  const fetchActualPlanData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${API_URL}/api/pricing/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.plans) {
          // Find the user's current plan from the plans list
          const userPlan = data.plans.find(plan => 
            plan.planId === user?.planName?.toLowerCase() || 
            plan.name === user?.planName ||
            plan.planId === user?.plan
          ) || data.plans.find(plan => plan.planId === "free");
          
          // console.log('✅ Fetched actual plan data:', userPlan);
          setActualPlanData(userPlan);
          return userPlan;
        }
      }
      
      console.warn('⚠️ Using fallback plan data');
      return planLimits; // Fallback to props
    } catch (error) {
      console.error('❌ Error fetching plan data:', error);
      return planLimits; // Fallback to props
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchActualPlanData();
    }
  }, [user]);

  const refreshPlanData = async () => {
    await fetchActualPlanData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStoragePercentage = () => {
    const storageLimit = actualPlanData?.storage || planLimits?.storage || 1;
    return Math.min((stats.storageUsed / storageLimit) * 100, 100);
  };

  const storagePercentage = getStoragePercentage();

  // Use actual plan data or fallback to props
  const currentPlanData = actualPlanData || planLimits;

  // Generate dynamic features list based on plan data
  const generatePlanFeatures = () => {
    if (!currentPlanData) return [];

    const features = [];

    // Core conversion feature
    if (currentPlanData.conversionLimit > 0) {
      features.push(`${currentPlanData.conversionLimit} PDF conversions per month`);
    } else if (currentPlanData.conversionLimit === 0) {
      features.push("Unlimited PDF conversions");
    }

    // Tool-specific limits
    if (currentPlanData.editToolsLimit > 0) {
      features.push(`${currentPlanData.editToolsLimit} Edit tools usage`);
    } else if (currentPlanData.editToolsLimit === 0) {
      features.push("Unlimited Edit tools");
    }

    if (currentPlanData.organizeToolsLimit > 0) {
      features.push(`${currentPlanData.organizeToolsLimit} Organize tools usage`);
    } else if (currentPlanData.organizeToolsLimit === 0) {
      features.push("Unlimited Organize tools");
    }

    if (currentPlanData.securityToolsLimit > 0) {
      features.push(`${currentPlanData.securityToolsLimit} Security tools usage`);
    } else if (currentPlanData.securityToolsLimit === 0) {
      features.push("Unlimited Security tools");
    }

    if (currentPlanData.optimizeToolsLimit > 0) {
      features.push(`${currentPlanData.optimizeToolsLimit} Optimize tools usage`);
    } else if (currentPlanData.optimizeToolsLimit === 0) {
      features.push("Unlimited Optimize tools");
    }

    if (currentPlanData.advancedToolsLimit > 0) {
      features.push(`${currentPlanData.advancedToolsLimit} Advanced tools usage`);
    } else if (currentPlanData.advancedToolsLimit === 0) {
      features.push("Unlimited Advanced tools");
    }

    // File size and storage
    if (currentPlanData.maxFileSize > 0) {
      features.push(`${currentPlanData.maxFileSize}MB max file size`);
    } else if (currentPlanData.maxFileSize === 0) {
      features.push("No file size limits");
    }

    if (currentPlanData.storage > 0) {
      features.push(`${currentPlanData.storage}GB cloud storage`);
    } else if (currentPlanData.storage === 0) {
      features.push("Unlimited cloud storage");
    }

    // Support
    if (currentPlanData.supportType) {
      features.push(`${currentPlanData.supportType} support`);
    }

    // Advanced features
    if (currentPlanData.hasBatchProcessing) {
      features.push("Batch file processing");
    }

    if (currentPlanData.hasOCR) {
      features.push("OCR text recognition");
    }

    if (currentPlanData.hasDigitalSignatures) {
      features.push("Digital signatures");
    }

    if (currentPlanData.hasAPIAccess) {
      features.push("API access");
    }

    if (currentPlanData.hasTeamCollaboration) {
      features.push("Team collaboration tools");
    }

    if (!currentPlanData.hasWatermarks) {
      features.push("No watermarks on outputs");
    }

    // Add any additional features from the plan
    if (currentPlanData.features && Array.isArray(currentPlanData.features)) {
      features.push(...currentPlanData.features);
    }

    return features.slice(0, 8); // Limit to 8 features for display
  };

  const planFeatures = generatePlanFeatures();

  // Get plan pricing information
  const getPlanPricing = () => {
    if (!currentPlanData) return null;

    if (currentPlanData.planId === "free") {
      return "Free Forever";
    }

    if (currentPlanData.planId === "enterprise") {
      return "Custom Pricing";
    }

    const monthlyPrice = currentPlanData.billingCycles?.monthly || currentPlanData.usdPrice;
    const annualPrice = currentPlanData.billingCycles?.annual || (monthlyPrice * 12 * 0.75);

    if (user?.billingCycle === "annual") {
      return `$${annualPrice}/year ($${(annualPrice / 12).toFixed(2)}/mo)`;
    }

    return `$${monthlyPrice}/month`;
  };

  const planPricing = getPlanPricing();

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-6"
      >
        {/* <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        </div> */}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-6"
    >
      {/* Current Plan */}
      <div className="glass-effect rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            Your Plan
          </h2>
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={refreshPlanData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button> */}
        </div>

        <div className="space-y-4">
          {/* Plan Name and Pricing */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Current Plan</span>
            <div className="text-right">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentPlanData?.planId === "professional"
                    ? "bg-purple-100 text-purple-800"
                    : currentPlanData?.planId === "starter"
                    ? "bg-blue-100 text-blue-800"
                    : currentPlanData?.planId === "enterprise"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {currentPlanData?.name || user?.planName || "Free"}
              </span>
              {planPricing && (
                <p className="text-xs text-gray-500 mt-1">{planPricing}</p>
              )}
            </div>
          </div>

          {/* Billing Cycle */}
          {user?.billingCycle && (
            <div className="flex justify-between items-center">
              <span className="font-medium">Billing Cycle</span>
              <span className="text-gray-600 capitalize">
                {user.billingCycle}
                {user.billingCycle === "annual" && (
                  <span className="text-green-600 text-xs ml-1">(25% off)</span>
                )}
              </span>
            </div>
          )}

          {/* Subscription Status */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Status</span>
            <span
              className={`flex items-center gap-1 ${
                user?.subscriptionStatus === "active"
                  ? "text-green-600"
                  : "text-gray-600"
              }`}
            >
              {user?.subscriptionStatus === "active" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {user?.subscriptionStatus === "active"
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          {/* Plan Expiry */}
          {user?.planExpiry && (
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {user.subscriptionStatus === "active" ? "Renews On" : "Expired On"}
              </span>
              <span className="text-gray-600">
                {formatDate(user.planExpiry)}
              </span>
            </div>
          )}

          {/* Plan Limits Summary */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Plan Limits:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">
                <strong>{currentPlanData?.conversionLimit === 0 ? 'Unlimited' : currentPlanData?.conversionLimit}</strong> conversions
              </div>
              <div className="text-gray-600">
                <strong>{currentPlanData?.maxFileSize === 0 ? 'No limit' : `${currentPlanData?.maxFileSize}MB`}</strong> file size
              </div>
              <div className="text-gray-600">
                <strong>{currentPlanData?.editToolsLimit === 0 ? 'Unlimited' : currentPlanData?.editToolsLimit}</strong> edits
              </div>
              <div className="text-gray-600">
                <strong>{currentPlanData?.organizeToolsLimit === 0 ? 'Unlimited' : currentPlanData?.organizeToolsLimit}</strong> organize
              </div>
              <div className="text-gray-600">
                <strong>{currentPlanData?.securityToolsLimit === 0 ? 'Unlimited' : currentPlanData?.securityToolsLimit}</strong> security
              </div>
              <div className="text-gray-600">
                <strong>{currentPlanData?.optimizeToolsLimit === 0 ? 'Unlimited' : currentPlanData?.optimizeToolsLimit}</strong> optimize
              </div>
            </div>
          </div>

          {/* Plan Features */}
          {planFeatures.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Plan Features:</h4>
              <ul className="space-y-2 max-h-40 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none]">
                {/* Hide scrollbar for Webkit browsers */}
                <style jsx>{`
                  ul::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {planFeatures.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/billing/settings")}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {user?.subscriptionStatus === "active"
                ? "Manage Billing"
                : "Billing Info"}
            </Button>
            {user?.subscriptionStatus !== "active" && (
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                onClick={() => navigate("/pricing")}
              >
                <Zap className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Storage Usage */}
      <div className="glass-effect rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-purple-600" />
          Storage Usage
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Used: {stats.storageUsed.toFixed(2)} GB
            </span>
            <span className="text-gray-600">
              Total:{" "}
              {currentPlanData?.storage === 0 || currentPlanData?.storage === 99999
                ? "Unlimited"
                : `${currentPlanData?.storage} GB`}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                storagePercentage > 90
                  ? "bg-red-500"
                  : storagePercentage > 75
                  ? "bg-orange-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            {storagePercentage > 90
              ? "Storage almost full"
              : storagePercentage > 75
              ? "Storage getting full"
              : "Plenty of space available"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SubscriptionSidebar;