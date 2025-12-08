import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import { toast } from "../../components/ui/use-toast";
import * as XLSX from "xlsx";
import { 
  Eye, 
  Download, 
  Search, 
  Users as UsersIcon,
  Shield,
  Mail,
  Calendar,
  User,
  X,
  FileText,
  BatteryCharging,
  Database,
  Clock,
  CreditCard,
  Package,
  Activity,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { motion } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL;

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [filters, setFilters] = useState({
    plan: 'all',
    status: 'all',
    role: 'all'
  });

  const exchangeRates = {
    USD: 1,
    INR: 83.5
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("pdfpro_admin_token");
      if (!token) {
        toast({
          title: "Error",
          description: "No admin token found",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(`${API_URL}/api/admin/dashboard/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("pdfpro_admin_token");
        toast({
          title: "Session Expired",
          description: "Please login again",
          variant: "destructive",
        });
        return;
      }

      const data = await res.json();
      if (!data.success || !data.users) {
        toast({
          title: "Error",
          description: "Invalid data received",
          variant: "destructive",
        });
        return;
      }

      setUsers(data.users);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'USD' ? 'INR' : 'USD');
  };

  const formatCurrency = (amount, originalCurrency = 'USD') => {
    if (!amount) return currency === 'INR' ? '₹0' : '$0.00';
    
    let finalAmount = amount;
    
    if (originalCurrency === 'INR' && currency === 'USD') {
      finalAmount = amount / exchangeRates.INR;
    } else if (originalCurrency === 'USD' && currency === 'INR') {
      finalAmount = amount * exchangeRates.INR;
    }

    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(finalAmount);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanColor = (planName) => {
    const planColors = {
      "Free": "text-gray-600 bg-gray-100",
      "Pro": "text-purple-600 bg-purple-100",
      "Professional": "text-purple-600 bg-purple-100",
      "Business": "text-blue-600 bg-blue-100",
      "Enterprise": "text-blue-600 bg-blue-100",
      "Starter": "text-green-600 bg-green-100",
      "Premium": "text-orange-600 bg-orange-100"
    };
    return planColors[planName] || "text-gray-600 bg-gray-100";
  };

  const getPlanGradient = (planName) => {
    const gradients = {
      "Free": "from-gray-400 to-gray-600",
      "Pro": "from-purple-400 to-purple-600",
      "Professional": "from-purple-500 to-purple-700",
      "Business": "from-blue-500 to-blue-700",
      "Enterprise": "from-blue-600 to-blue-800",
      "Starter": "from-green-500 to-green-700",
      "Premium": "from-orange-500 to-orange-700"
    };
    return gradients[planName] || "from-gray-400 to-gray-600";
  };

  const getPlanIcon = (planName) => {
    const icons = {
      "Free": UsersIcon,
      "Pro": Activity,
      "Professional": Activity,
      "Business": Shield,
      "Enterprise": Shield,
      "Starter": Activity,
      "Premium": Shield,
    };
    return icons[planName] || UsersIcon;
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user._id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPlan = filters.plan === 'all' || user.plan === filters.plan;
      const matchesRole = filters.role === 'all' || user.role === filters.role;
      
      // Status filter - active if lastActive within last 7 days
      let matchesStatus = true;
      if (filters.status === 'active') {
        matchesStatus = user.lastActive && new Date(user.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else if (filters.status === 'inactive') {
        matchesStatus = !user.lastActive || new Date(user.lastActive) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      return matchesSearch && matchesPlan && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filters]);

  const exportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        filteredUsers.map((user) => ({
          "User ID": user._id,
          "Name": user.name,
          "Email": user.email,
          "Role": user.role,
          "Current Plan": user.plan,
          "Plan Type": user.planType,
          "Files Count": user.files,
          "Storage Used (Bytes)": user.storageUsed,
          "Storage Used (Formatted)": formatFileSize(user.storageUsed),
          "Subscription Status": user.subscriptionStatus,
          "Topup Purchases": user.topupPurchases || 0,
          "Total Credits Purchased": user.topupCredits || 0,
          "Current Topup Credits": user.currentTopupCredits || 0,
          "Member Since": formatDate(user.createdAt),
          "Last Active": formatDate(user.lastActive),
          "User Status": user.lastActive && new Date(user.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 'Active' : 'Inactive'
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
      XLSX.writeFile(
        workbook,
        `users_export_${new Date().toISOString().split("T")[0]}.xlsx`
      );

      toast({
        title: "Success",
        description: `Exported ${filteredUsers.length} users to Excel`,
        variant: "default",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      plan: 'all',
      status: 'all',
      role: 'all'
    });
  };

  // User Details Modal Component - Enhanced with all details
  const UserDetailsModal = () => {
    if (!isModalOpen || !selectedUser) return null;

    const PlanIcon = getPlanIcon(selectedUser.plan);
    const isActive = selectedUser.lastActive && 
      new Date(selectedUser.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                <p className="text-gray-600">Complete user profile and statistics</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* User Profile Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                  {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPlanColor(selectedUser.plan)}`}>
                      {selectedUser.plan} Plan
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedUser.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedUser.role || 'user'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Files Processed</p>
                    <p className="text-2xl font-bold text-blue-800">{selectedUser.files || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600">Storage Used</p>
                    <p className="text-2xl font-bold text-emerald-800">
                      {formatFileSize(selectedUser.storageUsed)}
                    </p>
                  </div>
                  <Database className="h-8 w-8 text-emerald-500" />
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Current Credits</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {selectedUser.currentTopupCredits || 0}
                    </p>
                  </div>
                  <BatteryCharging className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Detailed Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  User Information
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">User ID:</span>
                    <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {selectedUser._id}
                    </code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {selectedUser.role || 'user'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subscription Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedUser.subscriptionStatus === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedUser.subscriptionStatus || 'active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Plan Details
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Plan:</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getPlanGradient(selectedUser.plan)} flex items-center justify-center`}>
                        <PlanIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPlanColor(selectedUser.plan)}`}>
                        {selectedUser.plan}
                      </span>
                    </div>
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
                      {selectedUser.files || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Topup Information */}
              {selectedUser.topupPurchases !== undefined && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BatteryCharging className="h-5 w-5 text-emerald-600" />
                    Topup Information
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Topup Purchases:</span>
                      <span className="font-medium text-gray-900">
                        {selectedUser.topupPurchases || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Credits Purchased:</span>
                      <span className="font-medium text-gray-900">
                        {selectedUser.topupCredits || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Current Credits:</span>
                      <span className="font-bold text-emerald-700">
                        {selectedUser.currentTopupCredits || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Activity & Storage
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
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
                        width: `${Math.min((selectedUser.storageUsed / (1024 * 1024 * 1024)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {Math.round((selectedUser.storageUsed / (1024 * 1024 * 1024)) * 100)}% of 1GB used
                  </div>
                  <div className="flex justify-between items-center pt-2">
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
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Navigate to user edit page or perform edit action
                  toast({
                    title: "Edit User",
                    description: "Edit functionality can be implemented here",
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit User
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Statistics
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => 
      u.lastActive && new Date(u.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
    payingUsers: users.filter(u => u.plan && u.plan !== 'Free').length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    totalFiles: users.reduce((sum, user) => sum + (user.files || 0), 0),
    totalCredits: users.reduce((sum, user) => sum + (user.currentTopupCredits || 0), 0)
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
          <div className="flex justify-center items-center min-h-[80vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Users Management 👥
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage and monitor all user accounts, plans, and activities
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToExcel}
                  disabled={filteredUsers.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  Export Excel
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, ID, plan, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={filters.plan}
                  onChange={(e) => handleFilterChange('plan', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                >
                  <option value="all">All Plans</option>
                  <option value="Free">Free</option>
                  <option value="Pro">Pro</option>
                  <option value="Business">Business</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Starter">Starter</option>
                  <option value="Premium">Premium</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2">
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>

                <button
                  onClick={clearFilters}
                  className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors whitespace-nowrap"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Paying Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.payingUsers}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.adminUsers}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Credits</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCredits}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                  <BatteryCharging className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  All Users ({filteredUsers.length})
                </h2>
                <div className="text-sm text-gray-500">
                  Showing {Math.min(filteredUsers.length, 20)} of {filteredUsers.length} users
                </div>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchTerm || Object.values(filters).some(f => f !== 'all') 
                    ? "No users found matching your criteria" 
                    : "No users available"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm || Object.values(filters).some(f => f !== 'all') 
                    ? "Try adjusting your search or filters" 
                    : "No users have been registered yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Plan</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Files</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Credits</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.slice(0, 20).map((user) => {
                      const isActive = user.lastActive && 
                        new Date(user.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      return (
                        <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{user.name}</p>
                                <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlanColor(user.plan)}`}>
                              {user.plan}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role || 'user'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-center">
                              <span className="text-sm font-medium text-gray-900">
                                {user.files || 0}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {user.currentTopupCredits > 0 ? (
                              <div className="flex items-center gap-1">
                                <BatteryCharging className="h-3 w-3 text-emerald-600" />
                                <span className="text-sm font-medium text-emerald-700">
                                  {user.currentTopupCredits}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {isActive ? 'Active' : 'Inactive'}
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
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredUsers.length > 20 && (
              <div className="p-4 text-center text-sm text-gray-500">
                Showing first 20 of {filteredUsers.length} users. Use search/filters to find specific users.
              </div>
            )}
          </div>
        </motion.div>

        {/* User Details Modal */}
        <UserDetailsModal />
      </div>
    </AdminLayout>
  );
};

export default UsersManagement;