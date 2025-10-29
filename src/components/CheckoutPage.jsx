import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, Shield, Lock, CreditCard, Building2, Crown, FileText, Zap, Mail, Phone, Users, Database, Clock, Star, Globe, Download, Upload, Settings, Key, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const CheckoutPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  
  const { billingCycle = 'annual', currency = 'USD', exchangeRate = 83.5 } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  const planDetails = {
    free: {
      name: 'Free',
      icon: Zap,
      color: 'from-green-500 to-emerald-600',
      description: 'Perfect for getting started with basic PDF needs',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        { icon: Download, text: '10 PDF conversions per month', available: true },
        { icon: Database, text: '5 MB max file size', available: true },
        { icon: FileText, text: 'Basic PDF to Word conversion', available: true },
        { icon: Users, text: 'Community support', available: true },
        { icon: Database, text: '1 GB cloud storage', available: true },
        { icon: Clock, text: 'Standard processing speed', available: true },
        { icon: Settings, text: 'Watermarked outputs', available: true },
        { icon: Upload, text: 'Single file conversion only', available: true },
        { icon: Key, text: 'Basic security features', available: true },
        { icon: Globe, text: 'Web-based interface only', available: true }
      ],
      limitations: [
        'No batch processing',
        'Limited file formats',
        'No priority support',
        'Watermarks on output files'
      ],
      isFree: true
    },
    starter: {
      name: 'Starter',
      icon: FileText,
      color: 'from-blue-500 to-cyan-600',
      description: 'Perfect for individual users and students',
      monthlyPrice: 12,
      annualPrice: 9,
      features: [
        { icon: Download, text: '50 PDF conversions per month', available: true },
        { icon: Database, text: '10 MB max file size', available: true },
        { icon: FileText, text: 'PDF to Word, Excel, PPT', available: true },
        { icon: Users, text: 'Email support', available: true },
        { icon: Database, text: '5 GB cloud storage', available: true },
        { icon: Clock, text: 'Faster processing', available: true },
        { icon: Settings, text: 'No watermarks', available: true },
        { icon: Upload, text: 'Batch convert up to 5 files', available: true },
        { icon: Key, text: 'Basic editing tools', available: true },
        { icon: Star, text: '14-day free trial', available: true },
        { icon: Shield, text: 'Enhanced security', available: true }
      ],
      limitations: [
        'No OCR capabilities',
        'Limited batch processing',
        'No API access',
        'Standard support only'
      ],
      isFree: false
    },
    professional: {
      name: 'Professional',
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      description: 'Ideal for freelancers and small teams',
      monthlyPrice: 39,
      annualPrice: 29,
      features: [
        { icon: Download, text: '500 PDF conversions per month', available: true },
        { icon: Database, text: '100 MB max file size', available: true },
        { icon: FileText, text: 'All format conversions', available: true },
        { icon: Users, text: 'Priority email & chat support', available: true },
        { icon: Database, text: '100 GB cloud storage', available: true },
        { icon: Clock, text: 'OCR text recognition', available: true },
        { icon: Settings, text: 'PDF forms & digital signatures', available: true },
        { icon: Upload, text: 'Batch convert up to 50 files', available: true },
        { icon: Key, text: 'Advanced editing tools', available: true },
        { icon: Star, text: 'Custom branding', available: true },
        { icon: Shield, text: 'Priority processing', available: true },
        { icon: Globe, text: '14-day free trial', available: true },
        { icon: Server, text: 'Advanced security features', available: true }
      ],
      limitations: [
        'No team collaboration',
        'No dedicated account manager',
        'Limited API access'
      ],
      isFree: false
    },
    enterprise: {
      name: 'Enterprise',
      icon: Building2,
      color: 'from-indigo-600 to-purple-600',
      description: 'For large organizations with advanced PDF needs',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        { icon: Download, text: 'Unlimited PDF conversions', available: true },
        { icon: Database, text: 'No file size limits', available: true },
        { icon: FileText, text: 'All advanced PDF tools', available: true },
        { icon: Users, text: '24/7 priority support', available: true },
        { icon: Database, text: '1 TB+ cloud storage', available: true },
        { icon: Clock, text: 'Advanced OCR & AI features', available: true },
        { icon: Settings, text: 'Workflow automation', available: true },
        { icon: Upload, text: 'Team collaboration tools', available: true },
        { icon: Key, text: 'SSO & SAML integration', available: true },
        { icon: Star, text: 'API access', available: true },
        { icon: Shield, text: 'Dedicated account manager', available: true },
        { icon: Globe, text: 'SLA guarantee', available: true },
        { icon: Server, text: 'Custom workflows', available: true },
        { icon: Users, text: 'Unlimited team members', available: true },
        { icon: Database, text: 'Custom storage solutions', available: true }
      ],
      limitations: [
        'Custom pricing based on requirements',
        'Minimum contract period may apply'
      ],
      isFree: false,
      isEnterprise: true
    }
  };

  const plan = planDetails[planId];

  const formatPrice = (usdPrice) => {
    if (currency === 'INR') {
      const inrPrice = Math.round(usdPrice * exchangeRate);
      return `₹${inrPrice.toLocaleString('en-IN')}`;
    }
    return `$${usdPrice}`;
  };

  const getCurrentPrice = () => {
    if (planId === 'enterprise') return 'Custom Pricing';
    if (planId === 'free') return 'Free Forever';
    
    const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    return formatPrice(price);
  };

  const getBillingDescription = () => {
    if (planId === 'enterprise') return 'Tailored to your needs';
    if (planId === 'free') return 'No credit card required';
    
    if (billingCycle === 'annual') {
      const annualPrice = plan.annualPrice * 12;
      return `Billed annually (${formatPrice(annualPrice)}) - Save 25%`;
    }
    return 'Billed monthly - Cancel anytime';
  };

  const handleGetStarted = () => {
    if (user) {
      // User is logged in, redirect to tools page
      navigate('/tools');
    } else {
      // User is not logged in, redirect to login page
      navigate('/login', { state: { from: `/checkout/${planId}` } });
    }
  };

  const handlePayment = async () => {
    if (planId === 'enterprise') {
      // For enterprise, show success message without payment
      toast({
        title: "Request Received! 📧",
        description: "Our team will contact you within 24 hours to discuss your enterprise needs.",
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      return;
    }

    if (planId === 'free') {
      // For free plan, activate immediately and redirect
      updateUser({ plan: 'free' });
      toast({
        title: "Welcome to PDF Pro! 🎉",
        description: "Your free plan has been activated. Start using our tools now!",
      });
      navigate('/tools');
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing for paid plans
    setTimeout(() => {
      updateUser({ plan: planId });
      setIsProcessing(false);
      toast({
        title: "Welcome to PDF Pro! 🎉",
        description: `You've successfully subscribed to the ${plan.name} plan`,
      });
      navigate('/tools');
    }, 2000);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const handleContactChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const Icon = plan.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pricing
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {planId === 'enterprise' ? 'Enterprise Plan' : `${plan.name} Plan`}
            </h1>
            <p className="text-gray-600">
              {planId === 'enterprise' ? 'Get custom pricing for your organization' : 'Complete your subscription'}
            </p>
          </div>
          <div className="w-24"></div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Plan Features - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Plan Overview */}
            <div className="glass-effect rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{plan.name} Plan</h2>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{getCurrentPrice()}</div>
                  <p className="text-sm text-gray-600">{getBillingDescription()}</p>
                </div>
                <div className="flex items-center justify-end">
                  <Button
                    onClick={handleGetStarted}
                    className={`bg-gradient-to-r ${plan.color} hover:opacity-90 px-6 py-3 font-semibold`}
                  >
                    {user ? 'Start Using Tools' : 'Login to Get Started'}
                  </Button>
                </div>
              </div>
            </div>

            {/* All Features */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900">All Features Included</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {plan.features.map((feature, index) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0`}>
                        <FeatureIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{feature.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Limitations (if any) */}
            {plan.limitations && plan.limitations.length > 0 && (
              <div className="glass-effect rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Limitations</h3>
                <div className="space-y-2">
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      {limitation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plan Comparison */}
            <div className="glass-effect rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Why Choose {plan.name}?</h3>
              <div className="space-y-3">
                {planId === 'free' && (
                  <>
                    <p className="text-gray-700">Perfect for students, casual users, and anyone getting started with PDF processing. Experience our basic features without any commitment.</p>
                    <p className="text-gray-700">Upgrade anytime to unlock more powerful features and higher limits.</p>
                  </>
                )}
                {planId === 'starter' && (
                  <>
                    <p className="text-gray-700">Ideal for individual professionals, students, and small projects. Get access to essential PDF tools with reasonable limits.</p>
                    <p className="text-gray-700">Perfect for freelancers who need reliable PDF processing without enterprise-level features.</p>
                  </>
                )}
                {planId === 'professional' && (
                  <>
                    <p className="text-gray-700">Designed for serious professionals, small teams, and businesses that rely on PDF processing daily.</p>
                    <p className="text-gray-700">Includes advanced features like OCR, batch processing, and priority support to boost your productivity.</p>
                  </>
                )}
                {planId === 'enterprise' && (
                  <>
                    <p className="text-gray-700">Built for large organizations with demanding PDF processing requirements and advanced workflow needs.</p>
                    <p className="text-gray-700">Includes custom solutions, dedicated support, and enterprise-grade security for mission-critical operations.</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Payment/Contact Section - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {planId === 'enterprise' ? (
              /* Enterprise Contact Form */
              <div className="glass-effect rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Contact Our Sales Team</h2>
                <p className="text-gray-600 mb-6">
                  Tell us about your requirements and we'll prepare a custom solution for your organization.
                </p>
                
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={contactForm.name}
                      onChange={handleContactChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={contactForm.email}
                      onChange={handleContactChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your work email"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={contactForm.phone}
                      onChange={handleContactChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={contactForm.company}
                      onChange={handleContactChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your company name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Requirements
                    </label>
                    <textarea
                      name="message"
                      rows="4"
                      value={contactForm.message}
                      onChange={handleContactChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell us about your PDF processing needs, team size, and any specific requirements..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className={`w-full py-3 text-lg font-semibold ${
                      isProcessing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : `bg-gradient-to-r ${plan.color} hover:opacity-90`
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </div>
                    ) : (
                      'Contact Sales Team'
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Email us directly:</span>
                  </div>
                  <a href="mailto: info@pdfworks.in" className="text-blue-600 hover:underline text-sm">
                    info@pdfworks.in
                  </a>
                  
                  <div className="flex items-center gap-3 mt-3 mb-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Call us:</span>
                  </div>
                  <a href="tel:+919715092104" className="text-blue-600 hover:underline text-sm">
                    +91 9715092104
                  </a>
                </div>
              </div>
            ) : (
              /* Regular Payment Section */
              <>
                {/* Payment Method */}
                <div className="glass-effect rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">
                    {planId === 'free' ? 'Activate Plan' : 'Payment Method'}
                  </h2>
                  
                  {planId !== 'free' && (
                    <div className="space-y-3 mb-6">
                      <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                        <input
                          type="radio"
                          name="payment"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="text-blue-600"
                        />
                        <CreditCard className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">Credit/Debit Card</span>
                      </label>

                      {currency === 'INR' && (
                        <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                          <input
                            type="radio"
                            name="payment"
                            value="upi"
                            checked={paymentMethod === 'upi'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="text-blue-600"
                          />
                          <Building2 className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">UPI Payment</span>
                        </label>
                      )}

                      <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                        <input
                          type="radio"
                          name="payment"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="text-blue-600"
                        />
                        <Building2 className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">PayPal</span>
                      </label>
                    </div>
                  )}

                  {/* Payment Form */}
                  {planId !== 'free' && paymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {planId !== 'free' && paymentMethod === 'upi' && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">You'll be redirected to your UPI app to complete the payment</p>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        Pay with UPI
                      </Button>
                    </div>
                  )}

                  {planId !== 'free' && paymentMethod === 'paypal' && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">You'll be redirected to PayPal to complete your payment</p>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Pay with PayPal
                      </Button>
                    </div>
                  )}
                </div>

                {/* Security & Final CTA */}
                <div className="glass-effect rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-gray-900">Secure {planId === 'free' ? 'Activation' : 'Payment'}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {planId === 'free' 
                      ? 'Your account will be activated immediately with access to all free features.'
                      : 'Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.'
                    }
                  </p>

                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className={`w-full py-3 text-lg font-semibold ${
                      isProcessing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : `bg-gradient-to-r ${plan.color} hover:opacity-90`
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : planId === 'free' ? (
                      'Activate Free Plan'
                    ) : (
                      `Start ${plan.name} Plan Trial`
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-3">
                    By completing your {planId === 'free' ? 'activation' : 'purchase'}, you agree to our{' '}
                    <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600">
                    <Lock className="h-4 w-4" />
                    <span>256-bit SSL secured</span>
                  </div>

                  {planId !== 'free' && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 text-center">
                        <strong>14-day free trial</strong> - No charges until your trial ends
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;