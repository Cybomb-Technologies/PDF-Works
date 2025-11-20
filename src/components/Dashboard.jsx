import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Zap, 
  TrendingUp, 
  Download,
  FileCheck,
  Clock,
  CreditCard,
  Calendar,
  Shield,
  BarChart3,
  Crown,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FolderOpen,
  HardDrive,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFiles: 0,
    conversions: 0,
    compressions: 0,
    signatures: 0,
    storageUsed: 0
  });
  const [billingInfo, setBillingInfo] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Get actual files from localStorage
      const files = JSON.parse(localStorage.getItem(`pdfpro_files_${user?.id}`) || '[]');
      
      // Calculate actual storage used (rough estimate - 2MB per file)
      const storageUsedMB = files.length * 2;
      const storageUsedGB = storageUsedMB / 1024;

      // Get actual usage from user data
      const userUsage = user?.usage || {};

      // Fetch actual billing history if user has a paid plan
      let billingData = null;
      if (user?.subscriptionStatus === 'active') {
        billingData = await fetchBillingHistory();
      }

      // Get actual recent activities from localStorage or API
      const activities = JSON.parse(localStorage.getItem(`pdfpro_activities_${user?.id}`) || '[]');

      setStats({
        totalFiles: files.length,
        conversions: userUsage.conversions || 0,
        compressions: userUsage.compressions || 0,
        signatures: userUsage.signatures || 0,
        storageUsed: storageUsedGB
      });

      setBillingInfo(billingData);
      setRecentActivities(activities.slice(0, 5)); // Last 5 activities
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/payments/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.payments.length > 0) {
          return data.payments[0]; // Get latest payment
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching billing history:', error);
      return null;
    }
  };

  const getPlanLimits = () => {
    const plan = user?.planName?.toLowerCase() || 'free';
    
    const limits = {
      free: {
        conversions: 10,
        compressions: 20,
        signatures: 5,
        storage: 1, // GB
        features: ['Basic Conversion', 'File Compression', 'Digital Signature']
      },
      starter: {
        conversions: 50,
        compressions: 100,
        signatures: 25,
        storage: 5, // GB
        features: ['All Free Features', 'Batch Processing', 'Priority Support']
      },
      professional: {
        conversions: 500,
        compressions: 1000,
        signatures: 100,
        storage: 50, // GB
        features: ['All Starter Features', 'Advanced OCR', 'API Access']
      },
      enterprise: {
        conversions: 99999, // Essentially unlimited
        compressions: 99999,
        signatures: 99999,
        storage: 1000, // GB
        features: ['All Professional Features', 'Custom Solutions', 'Dedicated Support']
      }
    };

    return limits[plan] || limits.free;
  };

  const getUsagePercentage = (current, limit) => {
    if (limit >= 99999) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = () => {
    if (!user?.planExpiry) return null;
    const expiry = new Date(user.planExpiry);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStoragePercentage = () => {
    const planLimits = getPlanLimits();
    return Math.min((stats.storageUsed / planLimits.storage) * 100, 100);
  };

  const formatCurrency = (amount, currency) => {
    if (!amount) return 'N/A';
    return currency === 'INR' ? `₹${amount}` : `$${amount}`;
  };

  const planLimits = getPlanLimits();
  const daysUntilExpiry = getDaysUntilExpiry();
  const storagePercentage = getStoragePercentage();

  const statCards = [
    { 
      label: 'Total Files', 
      value: stats.totalFiles, 
      icon: FileText, 
      color: 'from-blue-500 to-cyan-500',
      description: 'Files processed'
    },
    { 
      label: 'Conversions', 
      value: `${stats.conversions} / ${planLimits.conversions === 99999 ? 'Unlimited' : planLimits.conversions}`,
      usage: getUsagePercentage(stats.conversions, planLimits.conversions),
      icon: Zap, 
      color: 'from-purple-500 to-pink-500',
      description: 'PDF conversions used'
    },
    { 
      label: 'Compressions', 
      value: `${stats.compressions} / ${planLimits.compressions === 99999 ? 'Unlimited' : planLimits.compressions}`,
      usage: getUsagePercentage(stats.compressions, planLimits.compressions),
      icon: Download, 
      color: 'from-green-500 to-emerald-500',
      description: 'Files compressed'
    },
    { 
      label: 'Signatures', 
      value: `${stats.signatures} / ${planLimits.signatures === 99999 ? 'Unlimited' : planLimits.signatures}`,
      usage: getUsagePercentage(stats.signatures, planLimits.signatures),
      icon: FileCheck, 
      color: 'from-orange-500 to-red-500',
      description: 'Digital signatures'
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'conversion': return Zap;
      case 'compression': return Download;
      case 'signature': return FileCheck;
      case 'merge': return FileText;
      case 'split': return FileText;
      default: return FileText;
    }
  };

  const getActivityType = (action) => {
    if (action.includes('convert') || action.includes('conversion')) return 'conversion';
    if (action.includes('compress')) return 'compression';
    if (action.includes('signature')) return 'signature';
    if (action.includes('merge')) return 'merge';
    if (action.includes('split')) return 'split';
    return 'other';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold gradient-text">Welcome back, {user?.name || 'User'}! 👋</h1>
            <p className="text-gray-600 text-lg">
              {user?.subscriptionStatus === 'active' 
                ? `You're on the ${user?.planName} plan`
                : 'You\'re on the Free plan - upgrade to unlock more features'
              }
            </p>
          </div>
          
          {user?.subscriptionStatus !== 'active' && (
            <Button 
              onClick={() => navigate('/pricing')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          )}
        </div>

        {/* Plan Status Alert */}
        {user?.subscriptionStatus === 'active' && daysUntilExpiry !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl border ${
              daysUntilExpiry <= 7 
                ? 'bg-orange-50 border-orange-200' 
                : daysUntilExpiry <= 30
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {daysUntilExpiry <= 7 ? (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              ) : daysUntilExpiry <= 30 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <div>
                <p className="font-medium">
                  {daysUntilExpiry <= 7 
                    ? `Your plan expires in ${daysUntilExpiry} days`
                    : daysUntilExpiry <= 30
                    ? `Your plan expires in ${daysUntilExpiry} days`
                    : `Your plan is active - expires in ${daysUntilExpiry} days`
                  }
                </p>
                <p className="text-sm text-gray-600">
                  Next billing: {formatDate(user?.planExpiry)} • {user?.billingCycle === 'annual' ? 'Annual' : 'Monthly'} billing
                  {billingInfo && ` • Last payment: ${formatCurrency(billingInfo.amount, billingInfo.currency)}`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-effect rounded-2xl p-6 hover-lift"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              
              {stat.usage !== undefined && stat.usage > 0 && (
                <div className="space-y-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        stat.usage > 90 ? 'bg-red-500' : 
                        stat.usage > 75 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${stat.usage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    {stat.usage > 90 ? 'Almost full' : 
                     stat.usage > 75 ? 'Getting full' : 'Good capacity'}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-effect rounded-2xl p-6 xl:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Recent Activity
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchUserData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                const activityType = activity.type || getActivityType(activity.action);
                
                return (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-xl hover:bg-purple-50 transition-colors border">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500">
                        {activity.timestamp ? formatDate(activity.timestamp) : 'Recent'}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      activityType === 'conversion' ? 'bg-blue-100 text-blue-800' :
                      activityType === 'compression' ? 'bg-green-100 text-green-800' :
                      activityType === 'signature' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {activityType}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent activities</p>
              <p className="text-sm text-gray-400 mt-1">Your file processing activities will appear here</p>
            </div>
          )}
        </motion.div>

        {/* Subscription & Storage Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          {/* Current Plan */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              Your Plan
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Current Plan</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user?.planName === 'Professional' ? 'bg-purple-100 text-purple-800' :
                  user?.planName === 'Starter' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user?.planName || 'Free'}
                </span>
              </div>

              {user?.billingCycle && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Billing Cycle</span>
                  <span className="text-gray-600 capitalize">{user.billingCycle}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="font-medium">Status</span>
                <span className={`flex items-center gap-1 ${
                  user?.subscriptionStatus === 'active' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {user?.subscriptionStatus === 'active' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {user?.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              {user?.planExpiry && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Expires On</span>
                  <span className="text-gray-600">{formatDate(user.planExpiry)}</span>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Plan Features:</h4>
                <ul className="space-y-2">
                  {planLimits.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/billing/settings')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {user?.subscriptionStatus === 'active' ? 'Manage Billing' : 'Billing Info'}
                </Button>
                {user?.subscriptionStatus !== 'active' && (
                  <Button 
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                    onClick={() => navigate('/pricing')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Storage Usage */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-purple-600" />
              Storage Usage
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Used: {stats.storageUsed.toFixed(2)} GB
                </span>
                <span className="text-gray-600">
                  Total: {planLimits.storage === 99999 ? 'Unlimited' : `${planLimits.storage} GB`}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    storagePercentage > 90 ? 'bg-red-500' : 
                    storagePercentage > 75 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${storagePercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {storagePercentage > 90 ? 'Storage almost full' : 
                 storagePercentage > 75 ? 'Storage getting full' : 
                 'Plenty of space available'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;