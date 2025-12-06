import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Save, Plus, Trash2, Edit, Zap, FileText, Crown, Building2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import AdminLayout from "@/components/AdminLayout/AdminLayout";

const API_URL = import.meta.env.VITE_API_URL;

const PricingManagement = () => {
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Default plan structure with all features including convertToolsLimit
  const defaultPlan = {
    name: "",
    planId: "",
    price: 0,
    period: "monthly",
    features: [],
    popular: false,
    description: "",
    limit: 0,
    ctaText: "Get Started",
    icon: "FileText",
    color: "from-blue-500 to-cyan-600",
    billingCycles: {
      monthly: 0,
      annual: 0
    },
    currency: "USD",
    conversionLimit: 0,
    // Tool-specific limits
    editToolsLimit: 0,
    organizeToolsLimit: 0,
    securityToolsLimit: 0,
    optimizeToolsLimit: 0,
    advancedToolsLimit: 0,
    convertToolsLimit: 0, // ✅ ADDED
    maxFileSize: 0,
    storage: 0,
    supportType: "Community",
    // Feature toggles
    hasWatermarks: false,
    hasBatchProcessing: false,
    hasOCR: false,
    hasDigitalSignatures: false,
    hasAPIAccess: false,
    hasTeamCollaboration: false,
    order: 0
  };

  const [newPlan, setNewPlan] = useState(defaultPlan);
  const [newFeature, setNewFeature] = useState("");

  // Icon mapping
  const iconMap = {
    Zap: Zap,
    FileText: FileText,
    Crown: Crown,
    Building2: Building2
  };

  // Support types
  const supportTypes = [
    { value: "Community", label: "Community Support" },
    { value: "Email", label: "Email Support" },
    { value: "Priority", label: "Priority Support" },
    { value: "24/7 Dedicated", label: "24/7 Dedicated Support" }
  ];

  // Color options
  const colorOptions = [
    { value: "from-green-500 to-emerald-600", label: "Green", preview: "bg-gradient-to-r from-green-500 to-emerald-600" },
    { value: "from-blue-500 to-cyan-600", label: "Blue", preview: "bg-gradient-to-r from-blue-500 to-cyan-600" },
    { value: "from-purple-500 to-pink-500", label: "Purple", preview: "bg-gradient-to-r from-purple-500 to-pink-500" },
    { value: "from-indigo-600 to-purple-600", label: "Indigo", preview: "bg-gradient-to-r from-indigo-600 to-purple-600" },
    { value: "from-orange-500 to-red-500", label: "Orange", preview: "bg-gradient-to-r from-orange-500 to-red-500" },
    { value: "from-yellow-500 to-orange-500", label: "Yellow", preview: "bg-gradient-to-r from-yellow-500 to-orange-500" }
  ];

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem("pdfpro_admin_token");
      const res = await fetch(`${API_URL}/api/pricing/admin/all`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPricingPlans(data.plans || []);
      } else {
        console.error('Failed to fetch pricing plans');
        toast({
          title: "Error",
          description: "Failed to fetch pricing plans",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching pricing plans:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pricing plans",
        variant: "destructive",
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSavePlan = async (plan) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("pdfpro_admin_token");
      const url = plan._id ? `${API_URL}/api/pricing/${plan._id}` : `${API_URL}/api/pricing`;
      const method = plan._id ? "PUT" : "POST";

      // Prepare the plan data for API
      const planData = {
        name: plan.name,
        planId: plan.planId || plan.name.toLowerCase().replace(/\s+/g, '-'),
        price: parseFloat(plan.price),
        period: plan.period,
        features: plan.features,
        popular: plan.popular,
        description: plan.description,
        limit: parseInt(plan.limit) || 0,
        ctaText: plan.ctaText,
        icon: plan.icon,
        color: plan.color,
        billingCycles: {
          monthly: parseFloat(plan.billingCycles?.monthly || plan.price),
          annual: parseFloat(plan.billingCycles?.annual || (plan.price * 12 * 0.75))
        },
        currency: plan.currency || "USD",
        conversionLimit: parseInt(plan.conversionLimit) || 0,
        // Tool-specific limits
        editToolsLimit: parseInt(plan.editToolsLimit) || 0,
        organizeToolsLimit: parseInt(plan.organizeToolsLimit) || 0,
        securityToolsLimit: parseInt(plan.securityToolsLimit) || 0,
        optimizeToolsLimit: parseInt(plan.optimizeToolsLimit) || 0,
        advancedToolsLimit: parseInt(plan.advancedToolsLimit) || 0,
        convertToolsLimit: parseInt(plan.convertToolsLimit) || 0, // ✅ ADDED
        maxFileSize: parseInt(plan.maxFileSize) || 0,
        storage: parseInt(plan.storage) || 0,
        supportType: plan.supportType || "Community",
        // Feature toggles
        hasWatermarks: plan.hasWatermarks || false,
        hasBatchProcessing: plan.hasBatchProcessing || false,
        hasOCR: plan.hasOCR || false,
        hasDigitalSignatures: plan.hasDigitalSignatures || false,
        hasAPIAccess: plan.hasAPIAccess || false,
        hasTeamCollaboration: plan.hasTeamCollaboration || false,
        order: parseInt(plan.order) || 0
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(planData),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: `Plan ${plan._id ? "updated" : "created"} successfully`,
        });
        fetchPricingPlans();
        setEditingPlan(null);
        setNewPlan(defaultPlan);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save plan");
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save pricing plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm("Are you sure you want to delete this plan? This will affect users on this plan.")) return;

    try {
      const token = localStorage.getItem("pdfpro_admin_token");
      const res = await fetch(`${API_URL}/api/pricing/${planId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Plan deleted successfully",
        });
        fetchPricingPlans();
      } else {
        throw new Error("Failed to delete plan");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        title: "Error",
        description: "Failed to delete pricing plan",
        variant: "destructive",
      });
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      const planToUpdate = editingPlan ? { ...editingPlan } : { ...newPlan };
      planToUpdate.features = [...planToUpdate.features, newFeature.trim()];
      
      if (editingPlan) {
        setEditingPlan(planToUpdate);
      } else {
        setNewPlan(planToUpdate);
      }
      setNewFeature("");
    }
  };

  const removeFeature = (index) => {
    const planToUpdate = editingPlan ? { ...editingPlan } : { ...newPlan };
    planToUpdate.features = planToUpdate.features.filter((_, i) => i !== index);
    
    if (editingPlan) {
      setEditingPlan(planToUpdate);
    } else {
      setNewPlan(planToUpdate);
    }
  };

  const startEdit = (plan) => {
    setEditingPlan({ ...plan });
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setNewPlan(defaultPlan);
  };

  const initializeDefaultPlans = async () => {
    if (!confirm("This will reset all pricing plans to default. Continue?")) return;
    
    try {
      const token = localStorage.getItem("pdfpro_admin_token");
      const res = await fetch(`${API_URL}/api/pricing/initialize/defaults`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Default plans initialized successfully",
        });
        fetchPricingPlans();
      } else {
        throw new Error("Failed to initialize default plans");
      }
    } catch (error) {
      console.error("Error initializing default plans:", error);
      toast({
        title: "Error",
        description: "Failed to initialize default plans",
        variant: "destructive",
      });
    }
  };

  if (fetchLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Pricing Management 💰</h1>
              <p className="text-gray-600">
                Configure pricing plans that will appear on the billing page
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={initializeDefaultPlans}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </motion.div>

        {/* Add/Edit Plan Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border"
        >
          <h2 className="text-xl font-bold mb-4">
            {editingPlan ? "Edit Plan" : "Add New Plan"}
          </h2>
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Name *
              </label>
              <input
                type="text"
                value={editingPlan ? editingPlan.name : newPlan.name}
                onChange={(e) => editingPlan 
                  ? setEditingPlan({ ...editingPlan, name: e.target.value })
                  : setNewPlan({ ...newPlan, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Professional"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan ID *
              </label>
              <input
                type="text"
                value={editingPlan ? editingPlan.planId : newPlan.planId}
                onChange={(e) => editingPlan 
                  ? setEditingPlan({ ...editingPlan, planId: e.target.value.toLowerCase().replace(/\s+/g, '-') })
                  : setNewPlan({ ...newPlan, planId: e.target.value.toLowerCase().replace(/\s+/g, '-') })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., professional"
                required
              />
              <small className="text-gray-500">Unique identifier (auto-generated from name)</small>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Price ($) *
              </label>
              <input
                type="number"
                value={editingPlan ? editingPlan.price : newPlan.price}
                onChange={(e) => {
                  const price = parseFloat(e.target.value) || 0;
                  if (editingPlan) {
                    setEditingPlan({ 
                      ...editingPlan, 
                      price,
                      billingCycles: {
                        monthly: price,
                        annual: price * 12 * 0.75
                      }
                    });
                  } else {
                    setNewPlan({ 
                      ...newPlan, 
                      price,
                      billingCycles: {
                        monthly: price,
                        annual: price * 12 * 0.75
                      }
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
              <small className="text-gray-500">
                Annual: ${((editingPlan ? editingPlan.price : newPlan.price) * 12 * 0.75).toFixed(2)} (25% off)
              </small>
            </div>
          </div>

          {/* Core Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conversion Limit *
              </label>
              <input
                type="number"
                value={editingPlan ? editingPlan.conversionLimit : newPlan.conversionLimit}
                onChange={(e) => editingPlan 
                  ? setEditingPlan({ ...editingPlan, conversionLimit: parseInt(e.target.value) || 0 })
                  : setNewPlan({ ...newPlan, conversionLimit: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 500"
                min="0"
                required
              />
              <small className="text-gray-500">PDF conversions per month</small>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max File Size (MB) *
              </label>
              <input
                type="number"
                value={editingPlan ? editingPlan.maxFileSize : newPlan.maxFileSize}
                onChange={(e) => editingPlan 
                  ? setEditingPlan({ ...editingPlan, maxFileSize: parseInt(e.target.value) || 0 })
                  : setNewPlan({ ...newPlan, maxFileSize: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 100"
                min="0"
                required
              />
              <small className="text-gray-500">Maximum file size allowed</small>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage (GB) *
              </label>
              <input
                type="number"
                value={editingPlan ? editingPlan.storage : newPlan.storage}
                onChange={(e) => editingPlan 
                  ? setEditingPlan({ ...editingPlan, storage: parseInt(e.target.value) || 0 })
                  : setNewPlan({ ...newPlan, storage: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 100"
                min="0"
                required
              />
              <small className="text-gray-500">Cloud storage allocation</small>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={editingPlan ? editingPlan.order : newPlan.order}
                onChange={(e) => editingPlan 
                  ? setEditingPlan({ ...editingPlan, order: parseInt(e.target.value) || 0 })
                  : setNewPlan({ ...newPlan, order: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
              <small className="text-gray-500">Order in pricing display</small>
            </div>
          </div>

          {/* Tool-specific Limits */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tool Usage Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Edit Tools Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edit Tools Limit *
                </label>
                <input
                  type="number"
                  value={editingPlan ? editingPlan.editToolsLimit : newPlan.editToolsLimit}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, editToolsLimit: parseInt(e.target.value) || 0 })
                    : setNewPlan({ ...newPlan, editToolsLimit: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 25"
                  min="0"
                  required
                />
                <small className="text-gray-500">PDF editing tools usage</small>
              </div>

              {/* Organize Tools Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organize Tools Limit *
                </label>
                <input
                  type="number"
                  value={editingPlan ? editingPlan.organizeToolsLimit : newPlan.organizeToolsLimit}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, organizeToolsLimit: parseInt(e.target.value) || 0 })
                    : setNewPlan({ ...newPlan, organizeToolsLimit: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 25"
                  min="0"
                  required
                />
                <small className="text-gray-500">PDF organization tools usage</small>
              </div>

              {/* Security Tools Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Tools Limit *
                </label>
                <input
                  type="number"
                  value={editingPlan ? editingPlan.securityToolsLimit : newPlan.securityToolsLimit}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, securityToolsLimit: parseInt(e.target.value) || 0 })
                    : setNewPlan({ ...newPlan, securityToolsLimit: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 15"
                  min="0"
                  required
                />
                <small className="text-gray-500">Security & protection tools usage</small>
              </div>

              {/* Optimize Tools Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optimize Tools Limit *
                </label>
                <input
                  type="number"
                  value={editingPlan ? editingPlan.optimizeToolsLimit : newPlan.optimizeToolsLimit}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, optimizeToolsLimit: parseInt(e.target.value) || 0 })
                    : setNewPlan({ ...newPlan, optimizeToolsLimit: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 15"
                  min="0"
                  required
                />
                <small className="text-gray-500">PDF optimization tools usage</small>
              </div>

              {/* Advanced Tools Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advanced Tools Limit *
                </label>
                <input
                  type="number"
                  value={editingPlan ? editingPlan.advancedToolsLimit : newPlan.advancedToolsLimit}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, advancedToolsLimit: parseInt(e.target.value) || 0 })
                    : setNewPlan({ ...newPlan, advancedToolsLimit: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 5"
                  min="0"
                  required
                />
                <small className="text-gray-500">Advanced PDF tools usage</small>
              </div>

              {/* Convert Tools Limit - ✅ ADDED */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Convert Tools Limit *
                </label>
                <input
                  type="number"
                  value={editingPlan ? editingPlan.convertToolsLimit : newPlan.convertToolsLimit}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, convertToolsLimit: parseInt(e.target.value) || 0 })
                    : setNewPlan({ ...newPlan, convertToolsLimit: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 25"
                  min="0"
                  required
                />
                <small className="text-gray-500">PDF conversion tools usage</small>
              </div>
            </div>
          </div>

          {/* Visual Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <select
                value={editingPlan ? editingPlan.icon : newPlan.icon}
                onChange={(e) => editingPlan 
                  ? setEditingPlan({ ...editingPlan, icon: e.target.value })
                  : setNewPlan({ ...newPlan, icon: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Zap">⚡ Zap (Free)</option>
                <option value="FileText">📄 FileText (Starter)</option>
                <option value="Crown">👑 Crown (Professional)</option>
                <option value="Building2">🏢 Building2 (Enterprise)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Gradient</label>
              <select
                value={editingPlan ? editingPlan.color : newPlan.color}
                onChange={(e) => editingPlan 
                  ? setEditingPlan({ ...editingPlan, color: e.target.value })
                  : setNewPlan({ ...newPlan, color: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {colorOptions.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
              <div className={`mt-2 w-full h-2 rounded ${colorOptions.find(c => c.value === (editingPlan ? editingPlan.color : newPlan.color))?.preview}`}></div>
            </div>
          </div>

          {/* Support & Advanced Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Type</label>
              <select
                value={editingPlan ? editingPlan.supportType : newPlan.supportType}
                onChange={(e) => editingPlan 
                  ? setEditingPlan({ ...editingPlan, supportType: e.target.value })
                  : setNewPlan({ ...newPlan, supportType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {supportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingPlan ? editingPlan.popular : newPlan.popular}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, popular: e.target.checked })
                    : setNewPlan({ ...newPlan, popular: e.target.checked })
                  }
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Mark as popular plan
                </label>
              </div>
            </div>
          </div>

          {/* Advanced Feature Toggles */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Advanced Features</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingPlan ? editingPlan.hasWatermarks : newPlan.hasWatermarks}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, hasWatermarks: e.target.checked })
                    : setNewPlan({ ...newPlan, hasWatermarks: e.target.checked })
                  }
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Watermarks
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingPlan ? editingPlan.hasBatchProcessing : newPlan.hasBatchProcessing}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, hasBatchProcessing: e.target.checked })
                    : setNewPlan({ ...newPlan, hasBatchProcessing: e.target.checked })
                  }
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Batch Processing
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingPlan ? editingPlan.hasOCR : newPlan.hasOCR}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, hasOCR: e.target.checked })
                    : setNewPlan({ ...newPlan, hasOCR: e.target.checked })
                  }
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  OCR Text Recognition
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingPlan ? editingPlan.hasDigitalSignatures : newPlan.hasDigitalSignatures}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, hasDigitalSignatures: e.target.checked })
                    : setNewPlan({ ...newPlan, hasDigitalSignatures: e.target.checked })
                  }
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Digital Signatures
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingPlan ? editingPlan.hasAPIAccess : newPlan.hasAPIAccess}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, hasAPIAccess: e.target.checked })
                    : setNewPlan({ ...newPlan, hasAPIAccess: e.target.checked })
                  }
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  API Access
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingPlan ? editingPlan.hasTeamCollaboration : newPlan.hasTeamCollaboration}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, hasTeamCollaboration: e.target.checked })
                    : setNewPlan({ ...newPlan, hasTeamCollaboration: e.target.checked })
                  }
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Team Collaboration
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              value={editingPlan ? editingPlan.description : newPlan.description}
              onChange={(e) => editingPlan 
                ? setEditingPlan({ ...editingPlan, description: e.target.value })
                : setNewPlan({ ...newPlan, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="2"
              placeholder="Plan description that appears on billing page..."
              required
            />
          </div>

          {/* Features List */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Features List *</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Add a feature (e.g., 100 PDF conversions per month)"
              />
              <button
                onClick={addFeature}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(editingPlan ? editingPlan.features : newPlan.features).map((feature, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm">{feature}</span>
                  <button
                    onClick={() => removeFeature(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Button Text *</label>
            <input
              type="text"
              value={editingPlan ? editingPlan.ctaText : newPlan.ctaText}
              onChange={(e) => editingPlan 
                ? setEditingPlan({ ...editingPlan, ctaText: e.target.value })
                : setNewPlan({ ...newPlan, ctaText: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Get Started Free"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => editingPlan ? handleSavePlan(editingPlan) : handleSavePlan(newPlan)}
              disabled={loading || !(editingPlan ? editingPlan.name : newPlan.name) || !(editingPlan ? editingPlan.features.length : newPlan.features.length)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : (editingPlan ? "Update Plan" : "Create Plan")}
            </button>
            
            {(editingPlan || newPlan.name) && (
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </motion.div>

        {/* Existing Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border"
        >
          <h2 className="text-xl font-bold mb-4">Current Pricing Plans ({pricingPlans.length})</h2>
          
          {pricingPlans.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <FileText className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pricing Plans Found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first pricing plan or reset to defaults.</p>
              <button
                onClick={initializeDefaultPlans}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Initialize Default Plans
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {pricingPlans.map((plan, index) => {
                const IconComponent = iconMap[plan.icon] || FileText;
                return (
                  <motion.div
                    key={plan._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-2xl p-6 ${plan.popular ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mr-3`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-500">ID: {plan.planId}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600">/{plan.period}</span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                      <div>
                        <strong>{plan.conversionLimit}</strong> conversions
                      </div>
                      <div>
                        <strong>{plan.maxFileSize}MB</strong> max size
                      </div>
                      <div>
                        <strong>{plan.storage}GB</strong> storage
                      </div>
                      <div>
                        <strong>{plan.supportType}</strong> support
                      </div>
                      <div>
                        <strong>{plan.editToolsLimit}</strong> edits
                      </div>
                      <div>
                        <strong>{plan.organizeToolsLimit}</strong> organize
                      </div>
                      <div>
                        <strong>{plan.securityToolsLimit}</strong> security
                      </div>
                      <div>
                        <strong>{plan.optimizeToolsLimit}</strong> optimize
                      </div>
                      <div>
                        <strong>{plan.advancedToolsLimit}</strong> advanced
                      </div>
                      <div>
                        <strong>{plan.convertToolsLimit}</strong> convert {/* ✅ ADDED */}
                      </div>
                    </div>

                    {/* Advanced Features Summary */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Features:</h4>
                      <div className="flex flex-wrap gap-1">
                        {plan.hasOCR && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">OCR</span>}
                        {plan.hasDigitalSignatures && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Signatures</span>}
                        {plan.hasBatchProcessing && <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Batch</span>}
                        {plan.hasAPIAccess && <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">API</span>}
                        {plan.hasTeamCollaboration && <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">Team</span>}
                        {plan.hasWatermarks && <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded">Watermarks</span>}
                      </div>
                    </div>
                    
                    <ul className="space-y-1 mb-6">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-700">
                          <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-sm text-gray-500">
                          +{plan.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(plan)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan._id)}
                        className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        disabled={plan.planId === 'free'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default PricingManagement;