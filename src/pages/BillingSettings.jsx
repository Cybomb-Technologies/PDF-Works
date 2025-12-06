import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  RefreshCw,
  Settings,
  CreditCard,
  History,
  ArrowLeft,
  BatteryCharging,
  Package,
  Zap,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Metatags from "../SEO/metatags";

const API_URL = import.meta.env.VITE_API_URL;

const BillingSettings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [billingHistory, setBillingHistory] = useState([]);
  const [topupHistory, setTopupHistory] = useState([]);
  const [combinedHistory, setCombinedHistory] = useState([]);
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all", "subscription", "topup"

  useEffect(() => {
    fetchBillingData();
  }, []);

  useEffect(() => {
    // Combine and sort histories by date
    const combined = [...billingHistory, ...topupHistory]
      .sort((a, b) => new Date(b.createdAt || b.paidAt || b.purchaseDate) - new Date(a.createdAt || a.paidAt || a.purchaseDate))
      .map(item => ({
        ...item,
        _type: item.planName ? 'subscription' : 'topup',
        displayDate: item.paidAt || item.createdAt || item.purchaseDate
      }));
    
    setCombinedHistory(combined);
  }, [billingHistory, topupHistory]);

  const fetchBillingData = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      
      // Fetch subscription billing history
      const historyRes = await fetch(`${API_URL}/api/payments/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fetch topup history
      const topupRes = await fetch(`${API_URL}/api/payments/topup/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fetch auto-renewal status
      const renewalRes = await fetch(`${API_URL}/api/payments/auto-renewal/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setBillingHistory(historyData.payments || []);
      } else {
        throw new Error("Failed to fetch billing history");
      }

      if (topupRes.ok) {
        const topupData = await topupRes.json();
        setTopupHistory(topupData.payments || []);
      }

      if (renewalRes.ok) {
        const renewalData = await renewalRes.json();
        setAutoRenewal(renewalData.autoRenewal || false);
      } else {
        throw new Error("Failed to fetch auto-renewal status");
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
      toast({
        title: "Error",
        description: "Failed to load billing data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const toggleAutoRenewal = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/payments/auto-renewal/toggle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ autoRenewal: !autoRenewal }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setAutoRenewal(!autoRenewal);
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (transactionId, type = "subscription") => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = type === "subscription" 
        ? `${API_URL}/api/payments/invoice/${transactionId}`
        : `${API_URL}/api/payments/topup/invoice/${transactionId}`;
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = type === "subscription" 
          ? `invoice-${transactionId}.pdf`
          : `topup-invoice-${transactionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: "Invoice downloaded successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to download invoice");
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount, currency) => {
    if (!amount) return "N/A";
    return currency === "INR" ? `₹${amount.toLocaleString("en-IN")}` : `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "success": return "bg-green-500";
      case "failed": return "bg-red-500";
      case "pending": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getPaymentTypeIcon = (type) => {
    if (type === "topup") {
      return <BatteryCharging className="h-4 w-4" />;
    } else {
      return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentTypeLabel = (type, item) => {
    if (type === "topup") {
      return `Top-up: ${item.creditsAllocated?.total || 0} credits`;
    } else {
      return `Subscription: ${item.planName || "Plan"}`;
    }
  };

  const filteredHistory = () => {
    if (activeTab === "all") return combinedHistory;
    if (activeTab === "subscription") return combinedHistory.filter(item => item._type === 'subscription');
    if (activeTab === "topup") return combinedHistory.filter(item => item._type === 'topup');
    return combinedHistory;
  };

  const metaPropsData = {
    title: "Billing & Subscription Settings | PDF Works - Manage Your Plan",
    description:
      "Manage your PDF Works subscription, view billing history, download invoices, and control auto-renewal settings. Update your payment preferences and track your subscription details.",
    keyword:
      "billing settings, subscription management, payment history, invoice download, auto-renewal, plan management, account billing, subscription settings, payment preferences, billing history, download invoice, manage subscription",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in//billing/settings",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Back Button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Current Plan Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Current Plan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Plan Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Plan:</span>
                  <span className="font-medium">
                    {user?.planName || "Free"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing Cycle:</span>
                  <span className="font-medium capitalize">
                    {user?.billingCycle || "Monthly"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-medium ${
                      user?.subscriptionStatus === "active"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {user?.subscriptionStatus || "Inactive"}
                  </span>
                </div>
                {user?.planExpiry && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium">
                      {formatDate(user.planExpiry)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Auto-Renewal</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Automatic Renewal:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={autoRenewal}
                      onChange={toggleAutoRenewal}
                      disabled={loading || user?.plan === "free"}
                    />
                    <div
                      className={`w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                        autoRenewal ? "peer-checked:bg-green-600" : ""
                      } ${loading ? "opacity-50" : ""}`}
                    ></div>
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  {user?.plan === "free"
                    ? "Auto-renewal is not available for free plans"
                    : "Your plan will automatically renew before expiration"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Combined Billing History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <History className="h-6 w-6" />
                Payment History
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                View all your subscription and top-up payments
              </p>
            </div>
            <Button
              onClick={fetchBillingData}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-2 px-4 font-medium text-sm ${
                activeTab === "all"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Payments
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`pb-2 px-4 font-medium text-sm ${
                activeTab === "subscription"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab("topup")}
              className={`pb-2 px-4 font-medium text-sm ${
                activeTab === "topup"
                  ? "border-b-2 border-emerald-600 text-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Top-ups
            </button>
          </div>

          {filteredHistory().length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p>No payment history found</p>
              <p className="text-sm mt-1">
                Your payment history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory().map((payment) => (
                <div
                  key={payment._id || payment.transactionId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(payment.status)}`}
                      ></div>
                      <div className="flex items-center gap-2">
                        {getPaymentTypeIcon(payment._type)}
                        <div>
                          <h3 className="font-semibold">
                            {getPaymentTypeLabel(payment._type, payment)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(payment.displayDate)} • 
                            {payment._type === 'topup' 
                              ? ` ${payment.creditsAllocated?.total || 0} credits`
                              : ` ${payment.billingCycle || ''}`}
                            {payment.paymentMethod && ` • ${payment.paymentMethod}`}
                          </p>
                          {payment._type === 'topup' && payment.topupPackageId?.name && (
                            <p className="text-xs text-gray-400 mt-1">
                              {payment.topupPackageId.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        payment.status === "success"
                          ? "text-green-600"
                          : payment.status === "failed"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {payment.status}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {payment.transactionId?.substring(0, 10)}...
                    </div>
                  </div>

                  {payment.status === "success" && (
                    <Button
                      onClick={() => downloadInvoice(payment.transactionId, payment._type)}
                      variant="outline"
                      size="sm"
                      className="ml-4"
                      disabled={loading}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          {combinedHistory.length > 0 && (
            <div className="mt-8 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {combinedHistory.length}
                </div>
                <div className="text-sm text-blue-600">Total Payments</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">
                  {combinedHistory.filter(p => p._type === 'subscription').length}
                </div>
                <div className="text-sm text-purple-600">Subscriptions</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-700">
                  {combinedHistory.filter(p => p._type === 'topup').length}
                </div>
                <div className="text-sm text-emerald-600">Top-ups</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Manage Subscription
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Upgrade, downgrade, or change your subscription plan
            </p>
            <Button
              onClick={() => navigate("/pricing")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              View Plans
            </Button>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <BatteryCharging className="h-5 w-5" />
              Buy More Credits
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Purchase additional credits without changing your plan
            </p>
            <Button
              onClick={() => navigate("/topup")}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Top-up Credits
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default BillingSettings;