import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText, 
  RefreshCw, 
  Search, 
  Filter, 
  Download,
  Eye,
  Calendar,
  CreditCard,
  IndianRupee,
  X,
  User,
  Mail,
  Clock,
  Shield,
  Receipt,
  Package,
  Calendar as CalendarIcon
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout/AdminLayout.jsx";

const API_URL = import.meta.env.VITE_API_URL;

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    successRate: 0,
    revenueByPlan: [],
    recentPayments: []
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    plan: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [currency, setCurrency] = useState('USD');
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const navigate = useNavigate();

  const exchangeRates = {
    USD: 1,
    INR: 83.5
  };

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

  const fetchAvailablePlans = async () => {
    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/dashboard/plans`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailablePlans(data.plans);
        } else {
          setAvailablePlans(['Free', 'Pro', 'Business', 'Enterprise']);
        }
      } else {
        setAvailablePlans(['Free', 'Pro', 'Business', 'Enterprise']);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      setAvailablePlans(['Free', 'Pro', 'Business', 'Enterprise']);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/admin/dashboard/payment-stats`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("pdfpro_admin_token");
        navigate("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch payment statistics");
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || "Failed to fetch payment statistics");
      }
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load payment statistics",
        variant: "destructive",
      });
    }
  };

  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) return;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters
      });

      const response = await fetch(
        `${API_URL}/api/admin/dashboard/payments?${queryParams}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("pdfpro_admin_token");
        navigate("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();
      
      if (data.success) {
        setPayments(data.payments);
        setTotalPages(data.stats.totalPages);
        setCurrentPage(data.stats.currentPage);
      } else {
        throw new Error(data.error || "Failed to fetch payments");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async (paymentId) => {
    try {
      setDetailsLoading(true);
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/admin/dashboard/payments/${paymentId}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payment details");
      }

      const data = await response.json();
      
      if (data.success) {
        setPaymentDetails(data.payment);
      } else {
        throw new Error(data.error || "Failed to fetch payment details");
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load payment details",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDetails = async (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
    await fetchPaymentDetails(payment._id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
    setPaymentDetails(null);
  };

  useEffect(() => {
    fetchPaymentStats();
    fetchPayments(1);
    fetchAvailablePlans();
  }, [navigate]);

  const refreshData = () => {
    fetchPaymentStats();
    fetchPayments(currentPage);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchPayments(1);
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      plan: 'all',
      startDate: '',
      endDate: '',
      search: ''
    });
    setCurrentPage(1);
    fetchPayments(1);
  };

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'USD' ? 'INR' : 'USD');
  };

  const convertCurrency = (amount) => {
    return amount * exchangeRates[currency];
  };

  const formatCurrency = (amount, originalCurrency = 'USD') => {
    let finalAmount = amount;
    
    if (originalCurrency === 'USD' && currency === 'INR') {
      finalAmount = convertCurrency(amount);
    } else if (originalCurrency === 'INR' && currency === 'USD') {
      finalAmount = amount / exchangeRates.INR;
    }

    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(finalAmount);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'failed': return 'destructive';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      description: "All time revenue"
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(stats.monthlyRevenue),
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500",
      description: `Last 30 days ${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth}%`
    },
    {
      label: "Total Transactions",
      value: stats.totalTransactions.toLocaleString(),
      icon: CreditCard,
      color: "from-purple-500 to-pink-500",
      description: "All transactions"
    },
    {
      label: "Success Rate",
      value: `${Math.round(stats.successRate)}%`,
      icon: FileText,
      color: "from-orange-500 to-red-500",
      description: `${stats.successfulTransactions} successful`
    }
  ];

  // Payment Details Modal Component
  const PaymentDetailsModal = () => {
    if (!isModalOpen) return null;

    const payment = paymentDetails || selectedPayment;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
              <p className="text-gray-600">Complete transaction information</p>
            </div>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {detailsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : payment ? (
            <div className="p-6 space-y-6">
              {/* Transaction Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Transaction Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Transaction ID:</span>
                      <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {payment.transactionId}
                      </code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(payment.amount, payment.currency || 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Billing Cycle:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {payment.billingCycle || 'One-time'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Date:</span>
                      <span className="text-gray-900">
                        {formatDate(payment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Plan Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Plan Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Plan Name:</span>
                      <span className="font-medium text-gray-900">
                        {payment.planName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Plan ID:</span>
                      <span className="font-mono text-sm text-gray-600">
                        {payment.planId?.planId || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Original Price:</span>
                      <span className="text-gray-900">
                        {payment.planId?.price ? formatCurrency(payment.planId.price, 'USD') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Auto Renewal:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.autoRenewal ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.autoRenewal ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {payment.renewalStatus && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Renewal Status:</span>
                        <span className="text-gray-900 capitalize">
                          {payment.renewalStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-700">Name:</span>
                      </div>
                      <p className="text-gray-900 ml-6">
                        {payment.userId?.name || 'Unknown User'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-700">Email:</span>
                      </div>
                      <p className="text-gray-900 ml-6">
                        {payment.userId?.email || 'No email'}
                      </p>
                    </div>
                    {payment.userId?.createdAt && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Member Since:</span>
                        </div>
                        <p className="text-gray-900 ml-6">
                          {formatDateShort(payment.userId.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Additional Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-700">Created:</span>
                      </div>
                      <p className="text-gray-900 ml-6">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-700">Last Updated:</span>
                      </div>
                      <p className="text-gray-900 ml-6">
                        {formatDate(payment.updatedAt || payment.createdAt)}
                      </p>
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
                    // Add functionality for editing payment if needed
                    toast({
                      title: "Edit Payment",
                      description: "Edit functionality can be implemented here",
                    });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Payment
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Payment Not Found</h3>
              <p className="text-gray-500">Unable to load payment details</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  if (loading && payments.length === 0) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl font-bold gradient-text">Payment Management 💰</h1>
            <p className="text-gray-600">Loading payment data...</p>
          </motion.div>
          <div className="flex justify-center items-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold gradient-text">Payment Management 💰</h1>
              <p className="text-gray-600">
                Monitor transactions, revenue, and subscription payments
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Currency Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Currency:</span>
                <button
                  onClick={toggleCurrency}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  {currency === 'INR' ? (
                    <>
                      <IndianRupee className="h-4 w-4" />
                      <span>INR</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4" />
                      <span>USD</span>
                    </>
                  )}
                </button>
              </div>
              
              <button
                onClick={refreshData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-2xl p-4 hover-lift"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Revenue by Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold mb-4">Revenue by Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.revenueByPlan.map((plan, index) => (
              <div key={plan._id} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {formatCurrency(plan.revenue)}
                </div>
                <div className="text-sm font-medium text-gray-700 capitalize">
                  {plan._id || 'Unknown'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {plan.count} payments
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-effect rounded-2xl p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions, users..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Plan Filter - Dynamically populated */}
            <div className="flex items-center gap-2">
              <select
                value={filters.plan}
                onChange={(e) => handleFilterChange('plan', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Plans</option>
                {availablePlans.map(plan => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </motion.div>

        {/* Payments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-effect rounded-2xl p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">All Payments ({payments.length})</h2>
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payments Found</h3>
              <p className="text-gray-500">
                {Object.values(filters).some(filter => filter && filter !== 'all') 
                  ? "Try adjusting your filter criteria."
                  : "No payments have been processed yet."
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Plan</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Billing Cycle</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => (
                      <motion.tr
                        key={payment._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-gray-600">
                              {payment.transactionId?.slice(0, 8)}...
                            </code>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {payment.userId?.name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {payment.userId?.email || 'No email'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">
                            {payment.planName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900">
                            {formatCurrency(payment.amount, payment.currency || 'USD')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600 capitalize">
                            {payment.billingCycle}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {formatDate(payment.createdAt)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button 
                            onClick={() => handleViewDetails(payment)}
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
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => fetchPayments(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => fetchPayments(page)}
                        className={`px-3 py-1 border rounded-lg ${
                          currentPage === page
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => fetchPayments(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Payment Details Modal */}
      <PaymentDetailsModal />
    </AdminLayout>
  );
};

export default PaymentManagement;