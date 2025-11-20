import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Shield, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CheckoutPage = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const { planId } = useParams();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to proceed with payment",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    fetchPlanDetails();
  }, [planId, user, navigate]);

  const fetchPlanDetails = async () => {
    try {
      console.log('Fetching plan details for planId:', planId);
      
      const res = await fetch(`${API_URL}/api/pricing/${planId}`);
      const data = await res.json();
      
      console.log('Plan API response:', data);
      
      if (data.success) {
        console.log('Plan data received:', data.plan);
        setPlan(data.plan);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load plan details",
          variant: "destructive",
        });
        navigate('/pricing');
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
      toast({
        title: "Error",
        description: "Failed to load plan details. Please try again.",
        variant: "destructive",
      });
      navigate('/pricing');
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to proceed with payment",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    const token = getToken();
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please login again",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // FIX: Check if plan and plan ID exist with proper validation
    if (!plan) {
      toast({
        title: "Plan Error",
        description: "Plan information is not loaded yet. Please wait.",
        variant: "destructive",
      });
      return;
    }

    // Get the plan ID - try multiple possible fields
    const selectedPlanId = plan._id || plan.id;
    
    if (!selectedPlanId) {
      console.error('Plan object:', plan);
      toast({
        title: "Plan Error",
        description: "Plan ID is missing. Please select a plan again.",
        variant: "destructive",
      });
      navigate('/pricing');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending payment request with:', {
        planId: selectedPlanId,
        billingCycle,
        currency,
      });

      const response = await fetch(`${API_URL}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          billingCycle,
          currency,
        }),
      });

      const data = await response.json();
      console.log('Payment API response:', data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        // Redirect to Cashfree payment page
        console.log('Redirecting to payment link:', data.paymentLink);
        window.location.href = data.paymentLink;
      } else {
        throw new Error(data.message || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || 'Something went wrong. Please try again.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth or fetching plan
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading plan details...</p>
      </div>
    );
  }

  // Calculate price with fallback values
  const calculatePrice = () => {
    if (!plan) return currency === 'INR' ? '₹0' : '$0';

    let price;
    if (billingCycle === 'annual') {
      // Use annual price if available, otherwise calculate from monthly with discount
      price = plan.billingCycles?.annual || (plan.usdPrice * 12 * 0.75);
    } else {
      price = plan.usdPrice || 0;
    }

    // Convert to INR if needed
    if (currency === 'INR') {
      return `₹${Math.round(price * 83.5).toLocaleString('en-IN')}`;
    }
    return `$${price}`;
  };

  const calculateSavings = () => {
    if (billingCycle === 'annual' && plan.usdPrice) {
      const monthlyCost = plan.usdPrice;
      const annualCost = plan.billingCycles?.annual || (plan.usdPrice * 12 * 0.75);
      const savings = (monthlyCost * 12) - annualCost;
      
      if (savings > 0) {
        return currency === 'INR' 
          ? `Save ₹${Math.round(savings * 83.5).toLocaleString('en-IN')}`
          : `Save $${savings.toFixed(2)}`;
      }
    }
    return null;
  };

  const savings = calculateSavings();

  // Get features with fallback
  const features = plan.features || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pricing
          </Button>
          <h1 className="text-2xl font-bold ml-4">Complete Your Purchase</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border"
          >
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{plan.name || 'Plan'}</h3>
                  <p className="text-gray-600 text-sm">{plan.description || ''}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{calculatePrice()}</div>
                  <div className="text-sm text-gray-500">
                    {billingCycle === 'annual' ? 'per year' : 'per month'}
                  </div>
                  {savings && (
                    <div className="text-sm text-green-600 font-semibold">
                      {savings}
                    </div>
                  )}
                </div>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-3">Billing Cycle</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      billingCycle === 'monthly'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      billingCycle === 'annual'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    Annual (Save 25%)
                  </button>
                </div>
              </div>

              {/* Currency Toggle */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-3">Currency</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      currency === 'USD'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    onClick={() => setCurrency('INR')}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      currency === 'INR'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    INR (₹)
                  </button>
                </div>
              </div>

              {/* Features Included */}
              {features.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Features Included:</h4>
                  <ul className="space-y-2">
                    {features.slice(0, 6).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {features.length > 6 && (
                      <li className="text-sm text-gray-500">
                        +{features.length - 6} more features
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>

          {/* Payment Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border"
          >
            <h2 className="text-xl font-bold mb-6">Payment Details</h2>
            
            <div className="space-y-6">
              {/* Security Badge */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-green-800">Secure Payment</div>
                  <div className="text-sm text-green-600">
                    Your payment information is encrypted and secure
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Payment Method
                </label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-gray-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">Credit/Debit Card</div>
                      <div className="text-sm text-gray-600">
                        Pay securely with your card
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{calculatePrice()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">
                    {currency === 'INR' ? '₹0' : '$0'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{calculatePrice()}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {currency === 'INR' ? 'Prices in INR include all applicable taxes' : 'No additional taxes'}
                </div>
              </div>

              {/* Pay Button */}
              <Button
                onClick={handlePayment}
                disabled={loading || !plan}
                className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Pay ${calculatePrice()}`
                )}
              </Button>

              {/* Security Features */}
              <div className="text-center">
                <div className="flex justify-center gap-6 text-sm text-gray-500">
                  <span>256-bit SSL</span>
                  <span>PCI DSS Compliant</span>
                  <span>Secure Encryption</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;