import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  TrendingUp, 
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
  BatteryCharging,
  BarChart,
  CheckCircle,
  XCircle,
  AlertCircle,
  Battery
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
    recentPayments: [],
    totalCreditsSold: 0,
    avgCreditsPerPurchase: 0,
    topupRevenue: 0,
    subscriptionRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    plan: 'all',
    startDate: '',
    endDate: '',
    search: '',
    paymentType: 'all'
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
        const paymentStats = data.stats || {};
        
        console.log("📊 Payment Stats Received:", {
          creditsSold: paymentStats.totalCreditsSold,
          avgCredits: paymentStats.avgCreditsPerPurchase,
          allKeys: Object.keys(paymentStats)
        });
        
        setStats({
          totalRevenue: paymentStats.totalRevenue || 0,
          monthlyRevenue: paymentStats.monthlyRevenue || 0,
          subscriptionRevenue: paymentStats.subscriptionRevenue || 0,
          topupRevenue: paymentStats.topupRevenue || 0,
          totalTransactions: paymentStats.totalTransactions || 0,
          successfulTransactions: paymentStats.successfulTransactions || 0,
          successRate: paymentStats.successRate || 0,
          totalCreditsSold: paymentStats.totalCreditsSold || 0,
          avgCreditsPerPurchase: paymentStats.avgCreditsPerPurchase || 0,
          revenueByPlan: paymentStats.subscriptionRevenueByPlan || [],
          recentPayments: [],
          revenueGrowth: 0,
          failedTransactions: 0
        });
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
        setPayments(data.payments || []);
        setTotalPages(data.stats?.totalPages || 1);
        setCurrentPage(data.stats?.currentPage || 1);
        
        setStats(prev => ({
          ...prev,
          totalRevenue: data.stats?.totalRevenue || prev.totalRevenue,
          monthlyRevenue: data.stats?.monthlyRevenue || prev.monthlyRevenue,
          totalTransactions: data.stats?.totalPayments || prev.totalTransactions
        }));
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
      search: '',
      paymentType: 'all'
    });
    setCurrentPage(1);
    fetchPayments(1);
  };

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'USD' ? 'INR' : 'USD');
  };

  const formatCurrency = (amount, originalCurrency = 'INR') => {
    if (!amount) return '$0.00';
    
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
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = async () => {
    try {
      setExportLoading(true);
      const token = getAdminToken();
      if (!token) return;

      const queryParams = new URLSearchParams({
        page: '1',
        limit: '10000',
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

      if (!response.ok) {
        throw new Error("Failed to fetch payments for export");
      }

      const data = await response.json();
      
      if (!data.success || !data.payments || data.payments.length === 0) {
        toast({
          title: "No Data",
          description: "No payments data to export for the selected filters",
          variant: "destructive",
        });
        return;
      }

      const exportPayments = data.payments;

      const headers = [
        'Transaction ID',
        'Payment Type',
        'User Name',
        'User Email',
        'Plan/Package',
        'Credits',
        'Amount',
        'Currency',
        'Billing Cycle',
        'Status',
        'Payment Date',
        'User Plan',
        'Auto Renewal',
        'Created Date'
      ];

      const rows = exportPayments.map(payment => [
        payment.transactionId || payment._id || '',
        payment.paymentType || 'subscription',
        payment.user?.name || payment.userId?.name || '',
        payment.user?.email || payment.userId?.email || payment.userSnapshot?.email || '',
        payment.paymentType === 'topup' 
          ? payment.topupPackage?.name || payment.package?.name || 'Topup Credits'
          : payment.planName || payment.displayPlan || '',
        payment.paymentType === 'topup' ? (payment.credits || payment.creditsAllocated?.total || 0) : '',
        payment.amount || 0,
        payment.currency || 'INR',
        payment.billingCycle || (payment.paymentType === 'topup' ? 'one-time' : 'monthly'),
        payment.status || '',
        formatDate(payment.createdAt),
        payment.user?.plan || payment.userId?.planName || '',
        payment.autoRenewal ? 'Yes' : 'No',
        new Date(payment.createdAt).toISOString()
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') || cellStr.includes('\r')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      let filename = `payments_${new Date().toISOString().split('T')[0]}`;
      if (filters.startDate && filters.endDate) {
        filename = `payments_${filters.startDate}_to_${filters.endDate}`;
      } else if (filters.startDate) {
        filename = `payments_from_${filters.startDate}`;
      } else if (filters.endDate) {
        filename = `payments_until_${filters.endDate}`;
      }
      
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${exportPayments.length} payments to CSV`,
        variant: "default",
      });

    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export payments data",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue, 'USD'),
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      description: "All time revenue"
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(stats.monthlyRevenue, 'USD'),
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500",
      description: "Last 30 days"
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
      icon: BarChart,
      color: "from-orange-500 to-red-500",
      description: `${stats.successfulTransactions} successful`
    },
    {
      label: "Credits Sold",
      value: stats.totalCreditsSold.toLocaleString(),
      icon: BatteryCharging,
      color: "from-emerald-500 to-green-500",
      description: "Total topup credits"
    }
  ];

  const PaymentDetailsModal = () => {
    if (!isModalOpen) return null;

    const payment = paymentDetails || selectedPayment;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {payment?.paymentType === 'topup' ? (
                <BatteryCharging className="h-6 w-6 text-emerald-600" />
              ) : (
                <CreditCard className="h-6 w-6 text-blue-600" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {payment?.paymentType === 'topup' ? 'Topup ' : ''}Payment Details
                </h2>
                <p className="text-gray-600">Complete transaction information</p>
              </div>
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
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Transaction Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Transaction ID:</span>
                      <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {payment.transactionId || payment._id}
                      </code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(payment.amount, payment.currency || 'INR')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Type:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {payment.paymentType}
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

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {payment.paymentType === 'topup' ? 'Package Details' : 'Plan Details'}
                  </h3>
                  <div className="space-y-3">
                    {payment.paymentType === 'topup' ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Package:</span>
                          <span className="font-medium text-gray-900">
                            {payment.topupPackage?.name || payment.package?.name || 'Topup Credits'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Credits:</span>
                          <div className="flex items-center gap-2">
                            <Battery className="h-4 w-4 text-emerald-600" />
                            <span className="font-bold text-emerald-700">
                              {payment.credits || payment.creditsAllocated?.total || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Billing Cycle:</span>
                          <span className="font-medium text-gray-900 capitalize">
                            {payment.billingCycle || 'one-time'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Plan Name:</span>
                          <span className="font-medium text-gray-900">
                            {payment.planName || payment.displayPlan || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Billing Cycle:</span>
                          <span className="font-medium text-gray-900 capitalize">
                            {payment.billingCycle || 'monthly'}
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
                      </>
                    )}
                  </div>
                </div>
              </div>

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
                        {payment.user?.name || payment.userId?.name || 'Unknown User'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-700">Email:</span>
                      </div>
                      <p className="text-gray-900 ml-6">
                        {payment.user?.email || payment.userId?.email || payment.userSnapshot?.email || 'No email'}
                      </p>
                    </div>
                    {payment.user?.plan && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Current Plan:</span>
                        </div>
                        <p className="text-gray-900 ml-6 capitalize">
                          {payment.user.plan}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
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
                        <span className="font-medium text-gray-700">Currency:</span>
                      </div>
                      <p className="text-gray-900 ml-6 font-medium">
                        {payment.currency || 'INR'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
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
      <div className="space-y-6 max-w-full overflow-hidden">
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
                Monitor all transactions, revenue, and subscription payments
              </p>
            </div>
            <div className="flex items-center gap-3">
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
                onClick={exportToCSV}
                disabled={payments.length === 0 || exportLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {exportLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {exportLoading ? 'Exporting...' : 'Export CSV'}
              </button>
              
              
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 mb-1 truncate">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-gray-900 truncate">
                      {stat.value}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">{stat.description}</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0 ml-2`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Revenue Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
        >
          <h2 className="text-xl font-bold mb-4">Revenue Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-600 mb-2 truncate">Subscription Revenue</p>
              <p className="text-2xl font-bold text-blue-700 truncate">
                {formatCurrency(stats.subscriptionRevenue, 'USD')}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <CreditCard className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm text-blue-600 truncate">Recurring payments</span>
              </div>
            </div>
            
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm font-medium text-emerald-600 mb-2 truncate">Topup Revenue</p>
              <p className="text-2xl font-bold text-emerald-700 truncate">
                {formatCurrency(stats.topupRevenue, 'USD')}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <BatteryCharging className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-emerald-600 truncate">Credit purchases</span>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-600 mb-2 truncate">Credits Sold</p>
              <p className="text-2xl font-bold text-purple-700 truncate">
                {stats.totalCreditsSold.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Battery className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span className="text-sm text-purple-600 truncate">Total credits</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Revenue by Plan */}
        {stats.revenueByPlan.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Revenue by Plan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.revenueByPlan.map((plan, index) => (
                <div key={plan._id || index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1 truncate">
                    {formatCurrency(plan.revenue, 'USD')}
                  </div>
                  <div className="text-sm font-medium text-gray-700 capitalize truncate">
                    {plan._id || 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {plan.count} payments
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
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

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={filters.paymentType}
                    onChange={(e) => handleFilterChange('paymentType', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  >
                    <option value="all">All Types</option>
                    <option value="subscription">Subscription</option>
                    <option value="topup">Topup</option>
                  </select>
                </div>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <select
                  value={filters.plan}
                  onChange={(e) => handleFilterChange('plan', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                >
                  <option value="all">All Plans</option>
                  {availablePlans.map(plan => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  />
                  <span className="text-gray-500 hidden sm:inline">to</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1"
                >
                  Apply
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex-1"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payments Table - NO HORIZONTAL SCROLL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
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
              <div className="overflow-hidden">
                <div className="w-full">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Plan/Package</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment, index) => (
                        <tr key={payment._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {payment.paymentType === 'topup' ? (
                                <>
                                  <BatteryCharging className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                  <span className="text-xs text-emerald-700 hidden sm:inline">Topup</span>
                                </>
                              ) : (
                                <>
                                  <CreditCard className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <span className="text-xs text-blue-700 hidden sm:inline">Subscription</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="max-w-[100px]">
                              <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded truncate block">
                                {payment.transactionId?.slice(0, 8)}...
                              </code>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="max-w-[120px]">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {payment.user?.name || payment.userId?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {payment.user?.email?.split('@')[0] || payment.userId?.email?.split('@')[0] || '...'}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="max-w-[100px]">
                              {payment.paymentType === 'topup' ? (
                                <>
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {payment.topupPackage?.name || payment.package?.name || 'Topup'}
                                  </p>
                                  {payment.credits > 0 && (
                                    <p className="text-xs text-emerald-600">
                                      {payment.credits} credits
                                    </p>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {payment.planName || payment.displayPlan || 'Plan'}
                                  </p>
                                  <p className="text-xs text-blue-600 capitalize truncate">
                                    {payment.billingCycle || 'monthly'}
                                  </p>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-900 text-sm">
                              {formatCurrency(payment.amount, payment.currency || 'INR')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-gray-600">
                              {new Date(payment.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button 
                              onClick={() => handleViewDetails(payment)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs"
                            >
                              <Eye className="h-3 w-3 flex-shrink-0" />
                              <span className="hidden sm:inline">View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 p-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      fetchPayments(newPage);
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page);
                          fetchPayments(page);
                        }}
                        className={`px-3 py-1 border rounded-lg text-sm ${
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
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      fetchPayments(newPage);
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      <PaymentDetailsModal />
    </AdminLayout>
  );
};

export default PaymentManagement;