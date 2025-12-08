import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Metatags from "../SEO/metatags";

// Import Dashboard Components
import WelcomeSection from "./Dashboard/WelcomeSection";
import StatsGrid from "./Dashboard/StatsGrid";
import RecentActivity from "./Dashboard/RecentActivity";
import SubscriptionSidebar from "./Dashboard/SubscriptionSidebar";
import ToolUsageOverview from "./Dashboard/ToolUsageOverview";

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFiles: 0,
    conversions: 0,
    compressions: 0,
    signatures: 0,
    storageUsed: 0,
    // Tool-specific usage - will be fetched from backend
    editToolsUsed: 0,
    organizeToolsUsed: 0,
    securityToolsUsed: 0,
    optimizeToolsUsed: 0,
    advancedToolsUsed: 0,
  });
  const [billingInfo, setBillingInfo] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toolUsage, setToolUsage] = useState([]);
  const [planLimits, setPlanLimits] = useState(null);

  const metaPropsData = {
    title: "Dashboard | PDF Works - Free Online PDF Editor & Tools",
    description:
      "Manage your free PDF workspace with our online PDF editor. Convert, compress, merge, sign PDFs for free. Track your usage and access all free PDF tools in one dashboard.",
    keyword:
      "free pdf editor, online pdf tools, pdf converter free, compress pdf free, digital signature pdf, free pdf dashboard, pdf workspace, free pdf manager, online pdf editor free, pdf tools dashboard",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/dashboard",
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Fetch actual plan data from database
  const fetchPlanLimits = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/pricing/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.plan) {
          // console.log('✅ Fetched actual plan limits:', data.plan);
          return data.plan;
        }
      }

      // Fallback to hardcoded if API fails
      console.warn("⚠️ Using fallback plan limits");
      return getHardcodedPlanLimits(user?.planName?.toLowerCase() || "free");
    } catch (error) {
      console.error("❌ Error fetching plan limits:", error);
      return getHardcodedPlanLimits(user?.planName?.toLowerCase() || "free");
    }
  };

  // Hardcoded fallback
  const getHardcodedPlanLimits = (plan) => {
    const limits = {
      free: {
        name: "Free",
        planId: "free",
        conversions: 10,
        compressions: 20,
        signatures: 5,
        storage: 1,
        editToolsLimit: 5,
        organizeToolsLimit: 5,
        securityToolsLimit: 3,
        optimizeToolsLimit: 3,
        advancedToolsLimit: 0,
        maxFileSize: 5,
        supportType: "Community",
        features: ["Basic Conversion", "File Compression", "Digital Signature"],
      },
      starter: {
        name: "Starter",
        planId: "starter",
        conversions: 50,
        compressions: 100,
        signatures: 25,
        storage: 5,
        editToolsLimit: 25,
        organizeToolsLimit: 25,
        securityToolsLimit: 15,
        optimizeToolsLimit: 15,
        advancedToolsLimit: 5,
        maxFileSize: 10,
        supportType: "Email",
        features: ["All Free Features", "Batch Processing", "Priority Support"],
      },
      professional: {
        name: "Professional",
        planId: "professional",
        conversions: 500,
        compressions: 1000,
        signatures: 100,
        storage: 50,
        editToolsLimit: 200,
        organizeToolsLimit: 200,
        securityToolsLimit: 100,
        optimizeToolsLimit: 100,
        advancedToolsLimit: 50,
        maxFileSize: 100,
        supportType: "Priority",
        features: ["All Starter Features", "Advanced OCR", "API Access"],
      },
      enterprise: {
        name: "Enterprise",
        planId: "enterprise",
        conversions: 99999,
        compressions: 99999,
        signatures: 99999,
        storage: 1000,
        editToolsLimit: 99999,
        organizeToolsLimit: 99999,
        securityToolsLimit: 99999,
        optimizeToolsLimit: 99999,
        advancedToolsLimit: 99999,
        maxFileSize: 0,
        supportType: "24/7 Dedicated",
        features: [
          "All Professional Features",
          "Custom Solutions",
          "Dedicated Support",
        ],
      },
    };

    return limits[plan] || limits.free;
  };

  const fetchUserData = async () => {
    try {
      // Fetch actual plan limits from database FIRST
      const planLimitsData = await fetchPlanLimits();
      setPlanLimits(planLimitsData);

      // Get actual files from localStorage
      const files = JSON.parse(
        localStorage.getItem(`pdfpro_files_${user?.id}`) || "[]"
      );

      // Calculate actual storage used (rough estimate - 2MB per file)
      const storageUsedMB = files.length * 2;
      const storageUsedGB = storageUsedMB / 1024;

      // Get actual usage from user data
      const userUsage = user?.usage || {};

      // Fetch actual billing history if user has a paid plan
      let billingData = null;
      if (user?.subscriptionStatus === "active") {
        billingData = await fetchBillingHistory();
      }

      // Get actual recent activities from localStorage or API
      const activities = JSON.parse(
        localStorage.getItem(`pdfpro_activities_${user?.id}`) || "[]"
      );

      // Fetch tool usage from backend
      const toolUsageData = await fetchToolUsage();

      setStats({
        totalFiles: files.length,
        conversions: userUsage.conversions || 0,
        compressions: userUsage.compressions || 0,
        signatures: userUsage.signatures || 0,
        storageUsed: storageUsedGB,
        // Tool-specific usage from backend
        editToolsUsed: userUsage.editTools || 0,
        organizeToolsUsed: userUsage.organizeTools || 0,
        securityToolsUsed: userUsage.securityTools || 0,
        optimizeToolsUsed: userUsage.optimizeTools || 0,
        advancedToolsUsed: userUsage.advancedTools || 0,
         convertToolsUsed: data.toolUsage?.conversions || 0,
      });

      setBillingInfo(billingData);
      setRecentActivities(activities.slice(0, 5));
      setToolUsage(toolUsageData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/payments/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.payments.length > 0) {
          return data.payments[0];
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching billing history:", error);
      return null;
    }
  };

  const fetchToolUsage = async () => {
    try {
      const token = getToken();

      // Fetch usage data from all tool categories
      const [
        editHistory,
        organizeHistory,
        securityHistory,
        optimizeHistory,
        advancedHistory,
      ] = await Promise.all([
        fetch(`${API_URL}/api/tools/edit/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => (res.ok ? res.json() : { edits: [] })),

        fetch(`${API_URL}/api/tools/organize/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => (res.ok ? res.json() : { organizes: [] })),

        fetch(`${API_URL}/api/tools/security/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => (res.ok ? res.json() : { securityOps: [] })),

        fetch(`${API_URL}/api/tools/optimize/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => (res.ok ? res.json() : { optimizeOps: [] })),

        fetch(`${API_URL}/api/tools/advanced/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => (res.ok ? res.json() : { advancedOps: [] })),
      ]);

      return {
        editTools: editHistory.edits?.length || 0,
        organizeTools: organizeHistory.organizes?.length || 0,
        securityTools: securityHistory.securityOps?.length || 0,
        optimizeTools: optimizeHistory.optimizeOps?.length || 0,
        advancedTools: advancedHistory.advancedOps?.length || 0,
      };
    } catch (error) {
      console.error("Error fetching tool usage:", error);
      return {
        editTools: 0,
        organizeTools: 0,
        securityTools: 0,
        optimizeTools: 0,
        advancedTools: 0,
      };
    }
  };

  const getUsagePercentage = (current, limit) => {
    if (limit >= 99999) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  // Force refresh function
  const forceRefreshDashboard = async () => {
    setLoading(true);
    // console.log("🔄 Force refreshing dashboard data...");
    await fetchUserData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Use actual plan limits or fallback
  const actualPlanLimits =
    planLimits ||
    getHardcodedPlanLimits(user?.planName?.toLowerCase() || "free");

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="space-y-6">

        <WelcomeSection
         
          navigate={navigate}
          billingInfo={billingInfo}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
        />

        <ToolUsageOverview
          stats={stats}
          planLimits={actualPlanLimits}
          getUsagePercentage={getUsagePercentage}
          toolUsage={toolUsage}
          user={user}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RecentActivity
            recentActivities={recentActivities}
            fetchUserData={fetchUserData}
            formatDate={formatDate}
          />

          <SubscriptionSidebar
            user={user}
            planLimits={actualPlanLimits}
            stats={stats}
            navigate={navigate}
            getUsagePercentage={getUsagePercentage}
          />
        </div>
      </div>
    </>
  );
};

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (amount, currency) => {
  if (!amount) return "N/A";
  return currency === "INR" ? `₹${amount}` : `$${amount}`;
};

export default Dashboard;
