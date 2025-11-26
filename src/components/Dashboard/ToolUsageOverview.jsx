import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Edit,
  Folder,
  Shield,
  Zap,
  Settings,
  RefreshCw,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const ToolUsageOverview = ({
  stats,
  planLimits,
  getUsagePercentage,
  toolUsage,
  user,
}) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [currentPlanLimits, setCurrentPlanLimits] = useState(null);

  // Fetch pricing plans from API
  const fetchPricingPlans = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pricing`);
      const data = await res.json();

      if (data.success) {
        setPricingPlans(data.plans);
        // Find the user's current plan
        const userPlan = data.plans.find(
          (plan) =>
            plan.planId === user?.plan?.toLowerCase() ||
            plan.id === user?.plan?.toLowerCase()
        );

        if (userPlan) {
          // console.log('✅ Found user plan limits:', userPlan);
          // Ensure convertToolsLimit exists with default value
          const planWithConvertLimit = {
            ...userPlan,
            convertToolsLimit:
              userPlan.convertToolsLimit ||
              getDefaultConvertLimit(userPlan.planId),
          };
          setCurrentPlanLimits(planWithConvertLimit);
        } else {
          // Fallback to free plan if user plan not found
          const freePlan = data.plans.find((plan) => plan.planId === "free");
          const freePlanWithConvertLimit = freePlan
            ? {
                ...freePlan,
                convertToolsLimit:
                  freePlan.convertToolsLimit || getDefaultConvertLimit("free"),
              }
            : null;
          // console.log(
          //   "⚠️ Using free plan as fallback:",
          //   freePlanWithConvertLimit
          // );
          setCurrentPlanLimits(freePlanWithConvertLimit);
        }
      }
    } catch (error) {
      console.error("Error fetching pricing plans:", error);
      // Fallback to props if API fails
      setCurrentPlanLimits(planLimits);
    }
  };

  // Get default convert tools limit based on plan
  const getDefaultConvertLimit = (planId) => {
    const defaultLimits = {
      free: 5,
      starter: 25,
      professional: 200,
      enterprise: 0, // 0 means unlimited
    };
    return defaultLimits[planId] || 5;
  };

  // Fetch recent activities from all tools
  const fetchRecentActivities = async () => {
    try {
      const token = getToken();
      const [
        editRes,
        organizeRes,
        securityRes,
        optimizeRes,
        advancedRes,
        convertRes,
      ] = await Promise.all([
        fetch(`${API_URL}/api/tools/edit/history?limit=3`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/tools/organize/history?limit=3`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/tools/security/history?limit=3`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/tools/optimize/history?limit=3`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/tools/advanced/history?limit=3`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/tools/convert/history?limit=3`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const activities = [];

      // Process each tool's recent activities (your existing code)
      if (editRes.ok) {
        const data = await editRes.json();
        data.edits?.slice(0, 3).forEach((edit) => {
          activities.push({
            id: edit._id,
            type: "edit",
            tool: getEditToolName(edit.editType),
            name: edit.originalFilename,
            date: edit.createdAt,
            status: edit.editStatus,
          });
        });
      }

      if (organizeRes.ok) {
        const data = await organizeRes.json();
        data.organizes?.slice(0, 3).forEach((org) => {
          activities.push({
            id: org._id,
            type: "organize",
            tool: getOrganizeToolName(org.operationType),
            name: org.processedFilename,
            date: org.createdAt,
            status: org.operationStatus,
          });
        });
      }

      if (securityRes.ok) {
        const data = await securityRes.json();
        data.securityOps?.slice(0, 3).forEach((sec) => {
          activities.push({
            id: sec._id,
            type: "security",
            tool: getSecurityToolName(sec.operationType),
            name: sec.processedFilename,
            date: sec.createdAt,
            status: sec.operationStatus,
          });
        });
      }

      if (optimizeRes.ok) {
        const data = await optimizeRes.json();
        data.optimizeOps?.slice(0, 3).forEach((opt) => {
          activities.push({
            id: opt._id,
            type: "optimize",
            tool: getOptimizeToolName(opt.operationType),
            name: opt.processedFilename,
            date: opt.createdAt,
            status: opt.operationStatus,
          });
        });
      }

      if (advancedRes.ok) {
        const data = await advancedRes.json();
        data.advancedOps?.slice(0, 3).forEach((adv) => {
          activities.push({
            id: adv._id,
            type: "advanced",
            tool: getAdvancedToolName(adv.operationType),
            name: adv.processedName,
            date: adv.createdAt,
            status: adv.operationStatus,
          });
        });
      }

      if (convertRes.ok) {
        const data = await convertRes.json();
        data.conversions?.slice(0, 3).forEach((conv) => {
          activities.push({
            id: conv._id,
            type: "convert",
            tool: getConvertToolName(conv.conversionType),
            name: conv.originalFilename,
            date: conv.createdAt,
            status: conv.conversionStatus,
          });
        });
      }

      // Sort by date and take latest 5
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent activities:", error);
    }
  };

  // Helper functions to get tool display names (your existing code)
  const getEditToolName = (editType) => {
    const tools = {
      "pdf-edit": "PDF Editor",
      "image-crop": "Image Crop",
      "file-rename": "File Rename",
      "e-signature": "E-Signature",
    };
    return tools[editType] || "Edit Tool";
  };

  const getOrganizeToolName = (operationType) => {
    const tools = {
      merge: "PDF Merge",
      split: "PDF Split",
      rotate: "PDF Rotate",
    };
    return tools[operationType] || "Organize Tool";
  };

  const getSecurityToolName = (operationType) => {
    const tools = {
      encryption: "File Encryption",
      decryption: "File Decryption",
      "2fa-protection": "2FA Protection",
      "2fa-access": "2FA Access",
      "file-sharing": "File Sharing",
    };
    return tools[operationType] || "Security Tool";
  };

  const getOptimizeToolName = (operationType) => {
    const tools = {
      "image-optimization": "Image Optimization",
      "code-minification": "Code Minify",
      "cache-cleaning": "Cache Clean",
    };
    return tools[operationType] || "Optimize Tool";
  };

  const getAdvancedToolName = (operationType) => {
    const tools = {
      "automation-run": "Automation",
      "api-call": "API Connect",
      "analytics-view": "Analytics",
    };
    return tools[operationType] || "Advanced Tool";
  };

  const getConvertToolName = (conversionType) => {
    const tools = {
      "pdf-to-doc": "PDF to DOC",
      "pdf-to-docx": "PDF to DOCX",
      "pdf-to-ppt": "PDF to PPT",
      "pdf-to-pptx": "PDF to PPTX",
      "pdf-to-excel": "PDF to Excel",
      "pdf-to-xlsx": "PDF to XLSX",
      "pdf-to-image": "PDF to Image",
      "pdf-to-jpg": "PDF to JPG",
      "pdf-to-png": "PDF to PNG",
      "pdf-to-txt": "PDF to TXT",
      "pdf-to-html": "PDF to HTML",
      "image-to-pdf": "Image to PDF",
      "jpg-to-pdf": "JPG to PDF",
      "png-to-pdf": "PNG to PDF",
      "doc-to-pdf": "DOC to PDF",
      "docx-to-pdf": "DOCX to PDF",
      "ppt-to-pdf": "PPT to PDF",
      "pptx-to-pdf": "PPTX to PDF",
      "excel-to-pdf": "Excel to PDF",
      "xlsx-to-pdf": "XLSX to PDF",
      "txt-to-pdf": "TXT to PDF",
      "html-to-pdf": "HTML to PDF",
    };
    return tools[conversionType] || "Convert Tool";
  };

  useEffect(() => {
    if (user) {
      fetchPricingPlans();
      fetchRecentActivities();
    }
  }, [user]);

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchPricingPlans(), fetchRecentActivities()]);
    setLoading(false);
  };

  // Use dynamically fetched plan limits with safe defaults
  const safePlanLimits = currentPlanLimits || planLimits;

  // Ensure all limits have safe values
  const getSafeLimit = (limit) => {
    if (limit === undefined || limit === null) return 99999; // Default to unlimited
    return limit;
  };

  const toolCategories = [
    {
      label: "Edit Tools",
      value: `${stats.editToolsUsed} / ${
        getSafeLimit(safePlanLimits?.editToolsLimit) === 0 ||
        getSafeLimit(safePlanLimits?.editToolsLimit) === 99999
          ? "Unlimited"
          : getSafeLimit(safePlanLimits?.editToolsLimit)
      }`,
      usage: getUsagePercentage(
        stats.editToolsUsed,
        getSafeLimit(safePlanLimits?.editToolsLimit)
      ),
      icon: Edit,
      color: "from-blue-500 to-cyan-500",
      description: "PDF editing tools used",
      tools: ["PDF Editor", "Image Crop", "File Rename", "E-Signature"],
      route: "/tools/edit",
      usageCount: stats.editToolsUsed,
      limit: getSafeLimit(safePlanLimits?.editToolsLimit),
    },
    {
      label: "Organize Tools",
      value: `${stats.organizeToolsUsed} / ${
        getSafeLimit(safePlanLimits?.organizeToolsLimit) === 0 ||
        getSafeLimit(safePlanLimits?.organizeToolsLimit) === 99999
          ? "Unlimited"
          : getSafeLimit(safePlanLimits?.organizeToolsLimit)
      }`,
      usage: getUsagePercentage(
        stats.organizeToolsUsed,
        getSafeLimit(safePlanLimits?.organizeToolsLimit)
      ),
      icon: Folder,
      color: "from-green-500 to-emerald-500",
      description: "Organization tools used",
      tools: ["PDF Merge", "PDF Split", "PDF Rotate", "Extract"],
      route: "/tools/organize",
      usageCount: stats.organizeToolsUsed,
      limit: getSafeLimit(safePlanLimits?.organizeToolsLimit),
    },
    {
      label: "Security Tools",
      value: `${stats.securityToolsUsed} / ${
        getSafeLimit(safePlanLimits?.securityToolsLimit) === 0 ||
        getSafeLimit(safePlanLimits?.securityToolsLimit) === 99999
          ? "Unlimited"
          : getSafeLimit(safePlanLimits?.securityToolsLimit)
      }`,
      usage: getUsagePercentage(
        stats.securityToolsUsed,
        getSafeLimit(safePlanLimits?.securityToolsLimit)
      ),
      icon: Shield,
      color: "from-orange-500 to-red-500",
      description: "Security tools used",
      tools: ["Encrypt", "Decrypt", "2FA Protect", "Share"],
      route: "/tools/security",
      usageCount: stats.securityToolsUsed,
      limit: getSafeLimit(safePlanLimits?.securityToolsLimit),
    },
    {
      label: "Optimize Tools",
      value: `${stats.optimizeToolsUsed} / ${
        getSafeLimit(safePlanLimits?.optimizeToolsLimit) === 0 ||
        getSafeLimit(safePlanLimits?.optimizeToolsLimit) === 99999
          ? "Unlimited"
          : getSafeLimit(safePlanLimits?.optimizeToolsLimit)
      }`,
      usage: getUsagePercentage(
        stats.optimizeToolsUsed,
        getSafeLimit(safePlanLimits?.optimizeToolsLimit)
      ),
      icon: Zap,
      color: "from-purple-500 to-pink-500",
      description: "Optimization tools used",
      tools: ["Image Optimize", "Code Minify", "Cache Clean", "Compress"],
      route: "/tools/optimize",
      usageCount: stats.optimizeToolsUsed,
      limit: getSafeLimit(safePlanLimits?.optimizeToolsLimit),
    },
    {
      label: "Convert Tools",
      value: `${stats.convertToolsUsed || 0} / ${
        getSafeLimit(safePlanLimits?.convertToolsLimit) === 0 ||
        getSafeLimit(safePlanLimits?.convertToolsLimit) === 99999
          ? "Unlimited"
          : getSafeLimit(safePlanLimits?.convertToolsLimit)
      }`,
      usage: getUsagePercentage(
        stats.convertToolsUsed || 0,
        getSafeLimit(safePlanLimits?.convertToolsLimit)
      ),
      icon: FileText,
      color: "from-amber-500 to-orange-500",
      description: "Conversion tools used",
      tools: ["PDF to DOCX", "Image to PDF", "DOCX to PDF", "PPT to PDF"],
      route: "/tools/convert",
      usageCount: stats.convertToolsUsed || 0,
      limit: getSafeLimit(safePlanLimits?.convertToolsLimit),
    },
    {
      label: "Advanced Tools",
      value: `${stats.advancedToolsUsed} / ${
        getSafeLimit(safePlanLimits?.advancedToolsLimit) === 0 ||
        getSafeLimit(safePlanLimits?.advancedToolsLimit) === 99999
          ? "Unlimited"
          : getSafeLimit(safePlanLimits?.advancedToolsLimit)
      }`,
      usage: getUsagePercentage(
        stats.advancedToolsUsed,
        getSafeLimit(safePlanLimits?.advancedToolsLimit)
      ),
      icon: Settings,
      color: "from-indigo-500 to-purple-500",
      description: "Advanced tools used",
      tools: ["Automation", "API Connect", "Analytics", "Batch Process"],
      route: "/tools/advanced",
      usageCount: stats.advancedToolsUsed,
      limit: getSafeLimit(safePlanLimits?.advancedToolsLimit),
    },
  ];

  const getUsageStatus = (usage, limit) => {
    if (limit === 0 || limit === 99999)
      return { status: "unlimited", color: "text-green-600" };
    const percentage = (usage / limit) * 100;
    if (percentage >= 90) return { status: "critical", color: "text-red-600" };
    if (percentage >= 75)
      return { status: "warning", color: "text-orange-600" };
    return { status: "good", color: "text-green-600" };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Tool Usage Overview
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Current Plan:{" "}
            <span className="font-semibold">
              {safePlanLimits?.name || user?.planName}
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Tool Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {toolCategories.map((tool, index) => {
          const Icon = tool.icon;
          const usageStatus = getUsageStatus(tool.usageCount, tool.limit);

          return (
            <motion.div
              key={tool.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => (window.location.href = tool.route)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {tool.label}
                  </h3>
                  <p className="text-xs text-gray-500">{tool.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900">
                    {tool.value}
                  </p>
                  {usageStatus.status === "critical" && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                {tool.limit > 0 && tool.limit !== 99999 && tool.usage > 0 && (
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          tool.usage > 90
                            ? "bg-red-500"
                            : tool.usage > 75
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${tool.usage}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs ${usageStatus.color} text-right`}>
                      {Math.round(tool.usage)}% used
                    </p>
                  </div>
                )}

                {tool.limit === 0 || tool.limit === 99999 ? (
                  <div className="w-full h-2 bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-1 mt-2">
                  {tool.tools.slice(0, 2).map((toolName, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {toolName}
                    </span>
                  ))}
                  {tool.tools.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                      +{tool.tools.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ToolUsageOverview;
