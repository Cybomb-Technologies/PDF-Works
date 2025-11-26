// src/components/AdminPage/AdminPage.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  DollarSign,
  Activity,
  RefreshCw,
  Mail,
  Calendar,
  Eye,
  Filter,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  UserCheck,
  Download,
  Shield,
  Zap,
  Settings,
  Database,
  Clock,
  ArrowRight,
  X,
  MapPin,
  Phone,
  CreditCard,
  User,
  File,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const AdminPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFiles: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    activeUsers: 0,
    filesByCategory: {},
    totalRevenue: 0,
    previousMonthRevenue: 0,
  });

  const [users, setUsers] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const navigate = useNavigate();

  const getAdminToken = () => {
    const token = localStorage.getItem("pdfpro_admin_token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in as admin",
        variant: "destructive",
      });
      navigate("/admin/login");
      return null;
    }
    return token;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) return;

      // console.log("🔍 Fetching admin dashboard data...");

      const [statsRes, usersRes, filesRes, paymentStatsRes] = await Promise.all(
        [
          fetch(`${API_URL}/api/admin/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/admin/dashboard/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/admin/dashboard/files?limit=8`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/admin/dashboard/payment-stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]
      );

      if (
        statsRes.status === 401 ||
        usersRes.status === 401 ||
        filesRes.status === 401 ||
        paymentStatsRes.status === 401
      ) {
        localStorage.removeItem("pdfpro_admin_token");
        navigate("/admin/login");
        return;
      }

      if (!statsRes.ok || !usersRes.ok || !filesRes.ok || !paymentStatsRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [statsData, usersData, filesData, paymentStatsData] =
        await Promise.all([
          statsRes.json(),
          usersRes.json(),
          filesRes.json(),
          paymentStatsRes.json(),
        ]);

      // console.log("📊 Admin dashboard data:", { statsData, usersData, filesData, paymentStatsData });

      if (
        !statsData.success ||
        !usersData.success ||
        !filesData.success ||
        !paymentStatsData.success
      ) {
        throw new Error("Invalid data received from server");
      }

      // Process statistics
      const usersByPlan = statsData.stats.usersByPlan || {};

      // Create dynamic plan distribution
      const dynamicPlanDistribution = Object.entries(usersByPlan)
        .filter(([planName]) => planName && planName !== "undefined")
        .map(([planName, count]) => ({
          name: planName,
          value: count,
          color: getPlanColor(planName),
          gradient: getPlanGradient(planName),
          icon: getPlanIcon(planName),
        }))
        .sort((a, b) => b.value - a.value);

      // Use payment stats for revenue data
      const paymentStats = paymentStatsData.stats || {};

      setStats({
        totalUsers: statsData.stats.totalUsers || 0,
        totalFiles: statsData.stats.totalFiles || 0,
        monthlyRevenue: paymentStats.monthlyRevenue || 0,
        revenueGrowth: paymentStats.revenueGrowth || 0,
        totalRevenue: paymentStats.totalRevenue || 0,
        previousMonthRevenue: paymentStats.previousMonthRevenue || 0,
        activeUsers: statsData.stats.activeUsers || 0,
        filesByCategory: statsData.stats.filesByTool || {},
      });

      setUsers(usersData.users || []);
      setRecentFiles(filesData.files || []);
      setPlanDistribution(dynamicPlanDistribution);
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      toast({
        title: "Dashboard Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for plan styling
  const getPlanColor = (planName) => {
    const planColors = {
      Free: "text-gray-600 bg-gray-100",
      Pro: "text-purple-600 bg-purple-100",
      Professional: "text-purple-600 bg-purple-100",
      Business: "text-blue-600 bg-blue-100",
      Enterprise: "text-blue-600 bg-blue-100",
      Starter: "text-green-600 bg-green-100",
      Premium: "text-orange-600 bg-orange-100",
    };
    return planColors[planName] || "text-gray-600 bg-gray-100";
  };

  const getPlanGradient = (planName) => {
    const gradients = {
      Free: "from-gray-400 to-gray-600",
      Pro: "from-purple-400 to-purple-600",
      Professional: "from-purple-500 to-purple-700",
      Business: "from-blue-500 to-blue-700",
      Enterprise: "from-blue-600 to-blue-800",
      Starter: "from-green-500 to-green-700",
      Premium: "from-orange-500 to-orange-700",
    };
    return gradients[planName] || "from-gray-400 to-gray-600";
  };

  const getPlanIcon = (planName) => {
    const icons = {
      Free: Users,
      Pro: Zap,
      Professional: Zap,
      Business: Shield,
      Enterprise: Shield,
      Starter: Activity,
      Premium: Settings,
    };
    return icons[planName] || Users;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      convert: Download,
      organize: Settings,
      optimize: Zap,
      edit: FileText,
      security: Shield,
      advanced: Database,
    };
    return icons[category] || FileText;
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const refreshData = () => {
    fetchDashboardData();
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Filter files by category
  const filteredFiles =
    selectedCategory === "all"
      ? recentFiles
      : recentFiles.filter((file) => file.toolCategory === selectedCategory);

  // Get unique categories for filter
  const categories = [
    "all",
    ...new Set(recentFiles.map((file) => file.toolCategory).filter(Boolean)),
  ];

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      description: "Registered users",
    },
    {
      label: "Total Files",
      value: stats.totalFiles.toLocaleString(),
      icon: FileText,
      color: "from-purple-500 to-pink-500",
      description: "Across all tools",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(stats.monthlyRevenue),
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      description: (
        <div className="flex items-center gap-1">
          {stats.revenueGrowth >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span
            className={
              stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"
            }
          >
            {stats.revenueGrowth >= 0 ? "+" : ""}
            {stats.revenueGrowth.toFixed(1)}%
          </span>
          <span className="text-gray-500 ml-1">from last month</span>
        </div>
      ),
    },
    {
      label: "Active Users",
      value: stats.activeUsers,
      icon: Activity,
      color: "from-orange-500 to-red-500",
      description: "Users with activity",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "from-indigo-500 to-purple-500",
      description: "All time revenue",
    },
  ];

  // User Details Modal Component
  const UserDetailsModal = () => {
    if (!isUserModalOpen || !selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <p className="text-gray-600">Complete user information</p>
            </div>
            <button
              onClick={closeUserModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* User Profile */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                {selectedUser.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedUser.name}
                </h3>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {selectedUser.email}
                </p>
              </div>
            </div>

            {/* User Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">User ID:</span>
                    <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {selectedUser._id?.slice(-8)}
                    </code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {selectedUser.role || "user"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subscription Status:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedUser.subscriptionStatus === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedUser.subscriptionStatus || "active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Plan Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Plan:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getPlanColor(
                        selectedUser.plan
                      )}`}
                    >
                      {selectedUser.plan}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Plan Type:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {selectedUser.planType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Files Count:</span>
                    <span className="font-medium text-gray-900">
                      {selectedUser.files}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage & Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  Storage Usage
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Storage Used:</span>
                    <span className="font-medium text-gray-900">
                      {formatFileSize(selectedUser.storageUsed)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{
                        width: `${Math.min(
                          (selectedUser.storageUsed / (1024 * 1024 * 1024)) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {Math.round(
                      (selectedUser.storageUsed / (1024 * 1024 * 1024)) * 100
                    )}
                    % of 1GB used
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Activity
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium text-gray-900">
                      {formatDateShort(selectedUser.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Active:</span>
                    <span className="font-medium text-gray-900">
                      {formatDateShort(selectedUser.lastActive)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedUser.lastActive &&
                        new Date(selectedUser.lastActive) >
                          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedUser.lastActive &&
                      new Date(selectedUser.lastActive) >
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={closeUserModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigate(`/admin/users/${selectedUser._id}`);
                  closeUserModal();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Full Profile
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-bold gradient-text">
            Admin Dashboard 👑
          </h1>
          <p className="text-gray-600">Loading dashboard data...</p>
        </motion.div>
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold gradient-text">
              Admin Dashboard 👑
            </h1>
            <p className="text-gray-600">
              Manage users, files, and monitor platform activity
            </p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    {stat.label}
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </h3>
                  <div className="text-xs text-gray-500">
                    {typeof stat.description === "string"
                      ? stat.description
                      : stat.description}
                  </div>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Plan Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Plan Distribution
          </h2>
          <span className="text-sm text-gray-500">
            {stats.totalUsers} Total Users
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planDistribution.length > 0 ? (
            planDistribution.map((plan, index) => {
              const PlanIcon = plan.icon;
              const percentage =
                stats.totalUsers > 0
                  ? Math.round((plan.value / stats.totalUsers) * 100)
                  : 0;

              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-md`}
                    >
                      <PlanIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                      <p className="text-sm text-gray-500">
                        {plan.value} users
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {percentage}%
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${plan.gradient}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-8 col-span-3">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No plan data available</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Revenue Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
      >
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-green-600" />
          Revenue Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div>
              <p className="text-sm font-medium text-green-700">
                Current Month
              </p>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(stats.monthlyRevenue)}
              </p>
            </div>
            {stats.revenueGrowth >= 0 ? (
              <div className="flex items-center gap-1 bg-green-100 px-3 py-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  +{stats.revenueGrowth.toFixed(1)}%
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-red-100 px-3 py-2 rounded-full">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-700">
                  {stats.revenueGrowth.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm font-medium text-blue-600 mb-2">
              Previous Month
            </p>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(stats.previousMonthRevenue)}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-600">Last 30 days</span>
            </div>
          </div>

          <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-sm font-medium text-purple-600 mb-2">
              All Time Revenue
            </p>
            <p className="text-2xl font-bold text-purple-700">
              {formatCurrency(stats.totalRevenue)}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-purple-600">Total earnings</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Files by Category */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            Files by Category
          </h2>
          <span className="text-sm text-gray-500">
            {stats.totalFiles} Total Files
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(stats.filesByCategory).map(
            ([category, count], index) => {
              const CategoryIcon = getCategoryIcon(category);
              const percentage =
                stats.totalFiles > 0
                  ? Math.round((count / stats.totalFiles) * 100)
                  : 0;

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                        <CategoryIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <span className="font-semibold text-gray-900 capitalize">
                        {category}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-indigo-600">
                      {count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {percentage}% of total
                    </span>
                    <span className="text-sm text-gray-500">{count} files</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </motion.div>
              );
            }
          )}
        </div>
      </motion.div>

      {/* All Users - List View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              All Users ({users.length})
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {stats.activeUsers} Active Users
              </span>
              <button
                onClick={() => navigate("/admin/users")}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                View All
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Users Found
              </h3>
              <p className="text-gray-500">
                No users have been registered yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      User
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Plan
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Files
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Storage
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Joined
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 10).map((user, index) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlanColor(
                            user.plan
                          )}`}
                        >
                          {user.plan}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-center">
                          <span className="text-sm font-medium text-gray-900">
                            {user.files}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {formatFileSize(user.storageUsed)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {formatDateShort(user.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {users.length > 10 && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    Showing 10 of {users.length} users
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Files - List View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Recent Files ({filteredFiles.length})
          </h2>
          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all"
                      ? "All Categories"
                      : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* View More Button */}
            <button
              onClick={() => navigate("/admin/user-recent-files")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Eye className="h-4 w-4" />
              View All Files
            </button>
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No Files Found
            </h3>
            <p className="text-gray-500">
              No files found for the selected category.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    File Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Size
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    User
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file, index) => (
                  <motion.tr
                    key={file._id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <File className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-xs">
                            {file.displayName ||
                              file.filename ||
                              "Unknown File"}
                          </p>
                          <p className="text-sm text-gray-500">
                            ID: {file._id?.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full capitalize">
                        {file.toolCategory || file.source}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {file.size ? formatFileSize(file.size) : "Unknown size"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {file.userName || "Unknown user"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(file.uploadedAt)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* User Details Modal */}
      <UserDetailsModal />
    </div>
  );
};

export default AdminPage;
