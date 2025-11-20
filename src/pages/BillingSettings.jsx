import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Settings, CreditCard, History, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const BillingSettings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [billingHistory, setBillingHistory] = useState([]);
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const [historyRes, renewalRes] = await Promise.all([
        fetch(`${API_URL}/api/payments/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${API_URL}/api/payments/auto-renewal/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setBillingHistory(historyData.payments || []);
      } else {
        throw new Error('Failed to fetch billing history');
      }

      if (renewalRes.ok) {
        const renewalData = await renewalRes.json();
        setAutoRenewal(renewalData.autoRenewal || false);
      } else {
        throw new Error('Failed to fetch auto-renewal status');
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/payments/auto-renewal/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ autoRenewal: !autoRenewal })
      });

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

  const downloadInvoice = async (transactionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/payments/invoice/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${transactionId}.pdf`;
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
        throw new Error(errorData.message || 'Failed to download invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount, currency) => {
    if (!amount) return 'N/A';
    return currency === 'INR' ? `₹${amount}` : `$${amount}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
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
                <span className="font-medium">{user?.planName || 'Free'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing Cycle:</span>
                <span className="font-medium capitalize">{user?.billingCycle || 'Monthly'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  user?.subscriptionStatus === 'active' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {user?.subscriptionStatus || 'Inactive'}
                </span>
              </div>
              {user?.planExpiry && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires:</span>
                  <span className="font-medium">{formatDate(user.planExpiry)}</span>
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
                    disabled={loading || user?.plan === 'free'}
                  />
                  <div className={`w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    autoRenewal ? 'peer-checked:bg-green-600' : ''
                  } ${loading ? 'opacity-50' : ''}`}></div>
                </label>
              </div>
              <p className="text-sm text-gray-500">
                {user?.plan === 'free' 
                  ? 'Auto-renewal is not available for free plans'
                  : 'Your plan will automatically renew before expiration'
                }
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Billing History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Billing History
          </h2>
          <Button
            onClick={fetchBillingData}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {billingHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p>No billing history found</p>
            <p className="text-sm mt-1">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {billingHistory.map((payment) => (
              <div key={payment._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      payment.status === 'success' ? 'bg-green-500' : 
                      payment.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <h3 className="font-semibold">{payment.planName}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(payment.createdAt)} • {payment.billingCycle}
                        {payment.paymentMethod && ` • ${payment.paymentMethod}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-semibold ${
                    payment.status === 'success' ? 'text-green-600' : 
                    payment.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {formatCurrency(payment.amount, payment.currency)}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">{payment.status}</div>
                </div>

                {payment.status === 'success' && (
                  <Button
                    onClick={() => downloadInvoice(payment.transactionId)}
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
      </motion.div>
    </div>
  );
};

export default BillingSettings;