import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { 
  Edit, Folder, Shield, Zap, Settings, RefreshCw, 
  AlertTriangle, FileText, BatteryCharging, PlusCircle, 
  ShoppingBag, Calendar, User, Infinity, CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL;

const ToolUsageOverview = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [error, setError] = useState(null);

  // Fetch tool usage statistics
  const fetchToolUsageStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      const res = await fetch(`${API_URL}/api/tool-usage/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          console.log('📊 Tool Usage Stats:', data.stats);
          setStats(data.stats);
        } else {
          setError(data.error || 'Failed to load usage data');
        }
      } else {
        setError('Failed to fetch usage statistics');
      }
    } catch (error) {
      console.error('Error fetching tool usage stats:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent activities from all tools
  const fetchRecentActivities = async () => {
    try {
      const token = getToken();
      const [editRes, organizeRes, securityRes, optimizeRes, advancedRes, convertRes] = await Promise.all([
        fetch(`${API_URL}/api/tools/edit/history?limit=2`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/tools/organize/history?limit=2`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/tools/security/history?limit=2`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/tools/optimize/history?limit=2`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/tools/advanced/history?limit=2`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/tools/convert/history?limit=2`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ ok: false }))
      ]);

      const activities = [];

      // Helper to add activities safely
      const addActivity = async (response, type, getNameFn) => {
        if (response.ok) {
          try {
            const data = await response.json();
            const items = data.edits || data.organizes || data.securityOps || 
                         data.optimizeOps || data.advancedOps || data.conversions || [];
            
            items.slice(0, 2).forEach(item => {
              activities.push({
                id: item._id || item.id,
                type,
                tool: getNameFn ? getNameFn(item) : type,
                name: item.originalFilename || item.processedFilename || item.name || 'Document',
                date: item.createdAt || item.date,
                status: item.editStatus || item.operationStatus || item.conversionStatus || 'completed'
              });
            });
          } catch (e) {
            console.warn(`Error parsing ${type} history:`, e);
          }
        }
      };

      // Process each tool
      await Promise.all([
        addActivity(editRes, 'edit', (item) => getEditToolName(item.editType)),
        addActivity(organizeRes, 'organize', (item) => getOrganizeToolName(item.operationType)),
        addActivity(securityRes, 'security', (item) => getSecurityToolName(item.operationType)),
        addActivity(optimizeRes, 'optimize', (item) => getOptimizeToolName(item.operationType)),
        addActivity(advancedRes, 'advanced', (item) => getAdvancedToolName(item.operationType)),
        addActivity(convertRes, 'convert', (item) => getConvertToolName(item.conversionType))
      ]);

      // Sort by date and take latest 5
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivities(activities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  // Tool name helper functions (keep your existing ones)
  const getEditToolName = (editType) => {
    const tools = {
      'pdf-edit': 'PDF Editor',
      'image-crop': 'Image Crop',
      'file-rename': 'File Rename',
      'e-signature': 'E-Signature'
    };
    return tools[editType] || 'Edit Tool';
  };

  const getOrganizeToolName = (operationType) => {
    const tools = {
      'merge': 'PDF Merge',
      'split': 'PDF Split',
      'rotate': 'PDF Rotate'
    };
    return tools[operationType] || 'Organize Tool';
  };

  const getSecurityToolName = (operationType) => {
    const tools = {
      'encryption': 'File Encryption',
      'decryption': 'File Decryption',
      '2fa-protection': '2FA Protection',
      '2fa-access': '2FA Access',
      'file-sharing': 'File Sharing'
    };
    return tools[operationType] || 'Security Tool';
  };

  const getOptimizeToolName = (operationType) => {
    const tools = {
      'image-optimization': 'Image Optimization',
      'code-minification': 'Code Minify',
      'cache-cleaning': 'Cache Clean'
    };
    return tools[operationType] || 'Optimize Tool';
  };

  const getAdvancedToolName = (operationType) => {
    const tools = {
      'automation-run': 'Automation',
      'api-call': 'API Connect',
      'analytics-view': 'Analytics'
    };
    return tools[operationType] || 'Advanced Tool';
  };

  const getConvertToolName = (conversionType) => {
    const tools = {
      'pdf-to-doc': 'PDF to DOC',
      'pdf-to-docx': 'PDF to DOCX',
      'pdf-to-ppt': 'PDF to PPT',
      'pdf-to-pptx': 'PDF to PPTX',
      'pdf-to-excel': 'PDF to Excel',
      'pdf-to-xlsx': 'PDF to XLSX',
      'pdf-to-image': 'PDF to Image',
      'pdf-to-jpg': 'PDF to JPG',
      'pdf-to-png': 'PDF to PNG',
      'pdf-to-txt': 'PDF to TXT',
      'pdf-to-html': 'PDF to HTML',
      'image-to-pdf': 'Image to PDF',
      'jpg-to-pdf': 'JPG to PDF',
      'png-to-pdf': 'PNG to PDF',
      'doc-to-pdf': 'DOC to PDF',
      'docx-to-pdf': 'DOCX to PDF',
      'ppt-to-pdf': 'PPT to PDF',
      'pptx-to-pdf': 'PPTX to PDF',
      'excel-to-pdf': 'Excel to PDF',
      'xlsx-to-pdf': 'XLSX to PDF',
      'txt-to-pdf': 'TXT to PDF',
      'html-to-pdf': 'HTML to PDF'
    };
    return tools[conversionType] || 'Convert Tool';
  };

  useEffect(() => {
    if (user) {
      fetchToolUsageStats();
      fetchRecentActivities();
    }
  }, [user]);

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchToolUsageStats(),
      fetchRecentActivities()
    ]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-600" />
            <p className="text-gray-500">Loading usage statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-effect rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Tool Usage Overview
            </h2>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-medium text-red-800">Failed to load data</h3>
              <p className="text-sm text-red-600">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                className="mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tool categories for display
  const toolCategories = [
    {
      label: "Edit Tools",
      key: "editTools",
      icon: Edit,
      color: "from-blue-500 to-cyan-500",
      description: "PDF editing & image tools",
      tools: ["PDF Editor", "Image Crop", "File Rename", "E-Signature"],
      route: "/tools"
    },
    {
      label: "Organize Tools",
      key: "organizeTools",
      icon: Folder,
      color: "from-green-500 to-emerald-500",
      description: "PDF organization tools",
      tools: ["PDF Merge", "PDF Split", "PDF Rotate", "Extract"],
      route: "/tools"
    },
    {
      label: "Security Tools",
      key: "securityTools",
      icon: Shield,
      color: "from-orange-500 to-red-500",
      description: "File security & encryption",
      tools: ["Encrypt", "Decrypt", "2FA Protect", "Share"],
      route: "/tools"
    },
    {
      label: "Optimize Tools",
      key: "optimizeTools",
      icon: Zap,
      color: "from-purple-500 to-pink-500",
      description: "Optimization tools",
      tools: ["Image Optimize", "Code Minify", "Cache Clean", "Compress"],
      route: "/tools"
    },
    {
      label: "Convert Tools",
      key: "conversions",
      icon: FileText,
      color: "from-amber-500 to-orange-500",
      description: "File conversion tools",
      tools: ["PDF to DOCX", "Image to PDF", "DOCX to PDF", "PPT to PDF"],
      route: "/tools"
    },
    {
      label: "Advanced Tools",
      key: "advancedTools",
      icon: Settings,
      color: "from-indigo-500 to-purple-500",
      description: "Advanced operations",
      tools: ["Automation", "API Connect", "Analytics", "Batch Process"],
      route: "/tools"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Tool Usage Overview
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-gray-500" />
              <span className="text-sm text-gray-600">
                Plan: <span className="font-semibold">{stats?.userInfo?.planName || 'Free'}</span>
              </span>
            </div>
            {stats?.resetInfo && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span className="text-sm text-gray-500">
                  Resets: {new Date(stats.resetInfo.resetDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/topup')}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          >
            <PlusCircle className="h-4 w-4" />
            Buy Credits
          </Button>
          
        </div>
      </div>

      {/* ============ SECTION 1: PLAN TOOL USAGE ============ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Plan Tool Usage
          </h3>
          <span className="text-sm text-gray-500">
            Monthly usage vs your plan limits
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {toolCategories.map((tool, index) => {
            const Icon = tool.icon;
            const toolData = stats?.planUsage?.[tool.key] || { used: 0, limit: 0, percentage: 0, isUnlimited: false };
            const isUnlimited = toolData.isUnlimited;
            const percentage = toolData.percentage;
            const isCritical = percentage >= 90;
            const isWarning = percentage >= 75;
            
            return (
              <motion.div
                key={tool.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(tool.route)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{tool.label}</h3>
                    <p className="text-xs text-gray-500">{tool.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {/* Usage Count */}
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">
                      {isUnlimited ? (
                        <span className="flex items-center gap-1">
                          <Infinity className="h-4 w-4" />
                          Unlimited
                        </span>
                      ) : (
                        `${toolData.used} / ${toolData.limit}`
                      )}
                    </p>
                    {(isCritical || isWarning) && !isUnlimited && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    {isUnlimited && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  
                  {/* Usage Percentage Bar - PLAN USAGE ONLY */}
                  {!isUnlimited && toolData.limit > 0 && (
                    <div className="space-y-1 pt-2">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCritical ? "bg-red-500" :
                            isWarning ? "bg-orange-500" :
                            "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-xs ${
                          isCritical ? 'text-red-600' : 
                          isWarning ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {percentage}% used
                        </p>
                        {percentage >= 100 && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                            Limit Reached
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Unlimited Plan Indicator */}
                  {isUnlimited && (
                    <div className="w-full h-2 bg-green-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                  )}
                  
                  {/* Tool Tags */}
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
                  
                  {/* Plan Limit Warning */}
                  {percentage >= 75 && !isUnlimited && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-700 font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {percentage >= 100 ? 'Plan limit reached!' : 'Plan credits running low!'}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full mt-1 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/topup', { state: { tool: tool.label } });
                        }}
                      >
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        Buy {tool.label} Credits
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ============ SECTION 2: ADDITIONAL TOOL CREDITS ============ */}
      {(stats?.topupCredits?.total?.available > 0 || stats?.topupCredits?.total?.remaining > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-emerald-800 text-lg flex items-center gap-2">
              <BatteryCharging className="h-5 w-5 text-emerald-600" />
              Additional Tool Credits
            </h3>
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-700">
                {stats.topupCredits.total.remaining}
              </span>
              <span className="text-sm text-emerald-600 ml-1">credits remaining</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              {Object.entries(stats.topupCredits).map(([key, value]) => {
                if (key === 'total') return null;
                if (!value || (value.available === 0 && value.remaining === 0)) return null;
                
                const toolName = toolCategories.find(t => t.key === key)?.label || 
                               key.replace('Tools', ' Tools').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                
                return (
                  <div key={key} className="bg-white rounded-lg p-3 text-center border border-emerald-100 shadow-sm">
                    <div className="text-sm font-medium text-emerald-700 mb-1">{toolName}</div>
                    <div className="text-xl font-bold text-emerald-900 mb-1">{value.remaining}</div>
                    <div className="text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Available:</span>
                        <span className="font-medium">{value.available}</span>
                      </div>
                      {value.used > 0 && (
                        <div className="flex justify-between mt-0.5">
                          <span>Used:</span>
                          <span className="font-medium text-amber-600">{value.used}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* How Credits Work Explanation */}
            <div className="border-t border-emerald-200 pt-4">
              <p className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                How Additional Credits Work:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-emerald-700">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-xs">1</span>
                  </div>
                  <p>Used <span className="font-semibold">only after</span> your plan limit is reached</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-xs">2</span>
                  </div>
                  <p>Credits <span className="font-semibold">never expire</span> and roll over</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-xs">3</span>
                  </div>
                  <p>Applied <span className="font-semibold">automatically</span> when needed</p>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700"
                  onClick={() => navigate('/topup')}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Buy More Credits
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ToolUsageOverview;