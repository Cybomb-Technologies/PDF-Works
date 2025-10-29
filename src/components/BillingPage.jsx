import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, FileText, Zap, Crown, Building2, Download, Lock, Users, Star, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const BillingPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('annual');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [currency, setCurrency] = useState('USD'); // 'USD' or 'INR'

  // Currency conversion rates (you might want to fetch this from an API)
  const exchangeRate = 83.5; // 1 USD = 83.5 INR

  const formatPrice = (usdPrice, isCustom = false) => {
    if (isCustom) return 'Custom';
    
    if (currency === 'INR') {
      const inrPrice = Math.round(usdPrice * exchangeRate);
      return `₹${inrPrice.toLocaleString('en-IN')}`;
    }
    return `$${usdPrice}`;
  };

  const formatPeriod = (usdPrice, period, isCustom = false) => {
    if (isCustom) return 'Tailored to your needs';
    
    if (currency === 'INR') {
      const inrPrice = Math.round(usdPrice * exchangeRate);
      const annualPrice = Math.round(usdPrice * 12 * exchangeRate);
      
      if (billingCycle === 'annual') {
        return `Billed annually (₹${annualPrice.toLocaleString('en-IN')})`;
      }
      return `Billed monthly`;
    }
    
    if (billingCycle === 'annual') {
      const annualPrice = usdPrice * 12;
      return `Billed annually ($${annualPrice})`;
    }
    return `Billed monthly`;
  };

  const pricingPlans = [
    {
      id: 'free',
      name: 'Free',
      price: formatPrice(0),
      period: 'forever',
      icon: Zap,
      color: 'from-green-500 to-emerald-600',
      description: 'Perfect for getting started with basic PDF needs',
      features: [
        '10 PDF conversions per month',
        '5 MB max file size',
        'Basic PDF to Word conversion',
        'Community support',
        '1 GB cloud storage',
        'Standard processing speed',
        'Watermarked outputs',
        'Single file conversion only'
      ],
      ctaText: 'Get Started Free',
      popular: false,
      limit: 10,
      usdPrice: 0
    },
    {
      id: 'starter',
      name: 'Starter',
      price: formatPrice(billingCycle === 'annual' ? 9 : 12),
      period: formatPeriod(billingCycle === 'annual' ? 9 : 12, billingCycle),
      icon: FileText,
      color: 'from-blue-500 to-cyan-600',
      description: 'Perfect for individual users and students',
      features: [
        '50 PDF conversions per month',
        '10 MB max file size',
        'PDF to Word, Excel, PPT',
        'Email support',
        '5 GB cloud storage',
        'Faster processing',
        'No watermarks',
        'Batch convert up to 5 files',
        'Basic editing tools'
      ],
      ctaText: 'Start 14-Day Trial',
      popular: false,
      limit: 50,
      usdPrice: billingCycle === 'annual' ? 9 : 12
    },
    {
      id: 'professional',
      name: 'Professional',
      price: formatPrice(billingCycle === 'annual' ? 29 : 39),
      period: formatPeriod(billingCycle === 'annual' ? 29 : 39, billingCycle),
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      popular: true,
      description: 'Ideal for freelancers and small teams',
      features: [
        '500 PDF conversions per month',
        '100 MB max file size',
        'All format conversions',
        'Priority email & chat support',
        '100 GB cloud storage',
        'OCR text recognition',
        'PDF forms & digital signatures',
        'Batch convert up to 50 files',
        'Advanced editing tools',
        'Custom branding',
        'Priority processing'
      ],
      ctaText: 'Start Free Trial',
      limit: 500,
      usdPrice: billingCycle === 'annual' ? 29 : 39
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: formatPrice(0, true),
      period: 'Tailored to your needs',
      icon: Building2,
      color: 'from-indigo-600 to-purple-600',
      description: 'For large organizations with advanced PDF needs',
      features: [
        'Unlimited PDF conversions',
        'No file size limits',
        'All advanced PDF tools',
        '24/7 priority support',
        '1 TB+ cloud storage',
        'Advanced OCR & AI features',
        'Workflow automation',
        'Team collaboration tools',
        'SSO & SAML integration',
        'API access',
        'Dedicated account manager',
        'SLA guarantee',
        'Custom workflows'
      ],
      ctaText: 'Contact Sales',
      limit: 'Unlimited',
      usdPrice: 0
    }
  ];

  const featureComparison = [
    {
      feature: 'Monthly PDF Conversions',
      free: '10 files',
      starter: '50 files',
      professional: '500 files',
      enterprise: 'Unlimited'
    },
    {
      feature: 'Max File Size',
      free: '5 MB',
      starter: '10 MB',
      professional: '100 MB',
      enterprise: 'Unlimited'
    },
    {
      feature: 'Cloud Storage',
      free: '1 GB',
      starter: '5 GB',
      professional: '100 GB',
      enterprise: '1 TB+'
    },
    {
      feature: 'Batch Processing',
      free: false,
      starter: '5 files',
      professional: '50 files',
      enterprise: 'Unlimited'
    },
    {
      feature: 'OCR Text Recognition',
      free: false,
      starter: false,
      professional: true,
      enterprise: 'Advanced OCR'
    },
    {
      feature: 'Digital Signatures',
      free: false,
      starter: false,
      professional: true,
      enterprise: true
    },
    {
      feature: 'API Access',
      free: false,
      starter: false,
      professional: false,
      enterprise: true
    },
    {
      feature: 'Support',
      free: 'Community',
      starter: 'Email',
      professional: 'Priority',
      enterprise: '24/7 Dedicated'
    },
    {
      feature: 'Watermarks',
      free: true,
      starter: false,
      professional: false,
      enterprise: false
    },
    {
      feature: 'Team Collaboration',
      free: false,
      starter: false,
      professional: false,
      enterprise: true
    }
  ];

  const faqs = [
    {
      question: 'What can I do with the free plan?',
      answer: 'The free plan includes 10 PDF conversions per month with 5MB file size limit. You can convert PDFs to Word format with standard processing speed. Perfect for occasional personal use.'
    },
    {
      question: 'What file formats do you support for conversion?',
      answer: 'We support all major formats including PDF to Word, Excel, PowerPoint, Images (JPG, PNG), HTML, and vice versa. Free plan supports PDF to Word only. Higher plans unlock all formats.'
    },
    {
      question: 'How secure are my PDF files?',
      answer: 'Your files are encrypted in transit and at rest. We automatically delete all processed files from our servers within 24 hours. Enterprise plans offer extended retention options.'
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time. When you cancel, you\'ll continue to have access to your plan features until the end of your billing period. You can always revert to our free plan.'
    },
    {
      question: `Do you offer discounts for annual billing?`,
      answer: `Yes, we offer a 25% discount when you choose annual billing instead of monthly payments across all paid plans. The free plan remains completely free forever.`
    },
    {
      question: 'What happens if I exceed my monthly conversion limit?',
      answer: 'If you exceed your monthly limit, you can upgrade to a higher plan or wait until your limits reset the following month. We\'ll notify you when you\'re approaching your limit.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'Yes, we offer a 14-day free trial for both Starter and Professional plans with full access to all features. No credit card required to start your trial.'
    },
    {
      question: 'Can I upgrade from free to paid plan?',
      answer: 'Absolutely! You can upgrade anytime. When you upgrade, your conversion limits reset immediately and you get access to all the new features of your chosen plan.'
    },
    {
      question: `Do you support Indian Rupee (INR) payments?`,
      answer: `Yes! You can view prices in INR and pay in Indian Rupees. We support all major Indian payment methods including UPI, Net Banking, and credit/debit cards.`
    }
  ];

  const handleUpgrade = (planId) => {
    if (planId === user?.plan) {
      toast({
        title: "Already subscribed",
        description: `You're currently on the ${planId} plan`,
      });
      return;
    }

    // Special handling for free plan
    if (planId === 'free') {
      updateUser({ plan: 'free' });
      toast({
        title: "Plan updated!",
        description: "You've switched to the free plan",
      });
      return;
    }

    // For paid plans and enterprise, navigate to checkout
    navigate(`/checkout/${planId}`, { 
      state: { 
        billingCycle,
        currency,
        exchangeRate
      }
    });
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const getCurrentUsage = () => {
    const plan = pricingPlans.find(p => p.id === user?.plan);
    const used = user?.usage?.conversions || 0;
    const limit = plan?.limit || 10;
    const percentage = (used / limit) * 100;
    
    return { used, limit, percentage, planName: plan?.name };
  };

  const { used, limit, percentage, planName } = getCurrentUsage();

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl"
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <FileText className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          PDF Pro Pricing
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Start free, upgrade as you grow. No credit card required to begin.
        </p>

        {/* Currency Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
          {/* Billing Toggle */}
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border">
            <span className={`font-semibold ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={billingCycle === 'annual'}
                onChange={() => setBillingCycle(billingCycle === 'annual' ? 'monthly' : 'annual')}
              />
              <div className="w-12 h-6 bg-blue-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className={`font-semibold flex items-center gap-2 ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
              <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                Save 25%
              </span>
            </span>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border">
            <Globe className="h-4 w-4 text-gray-600" />
            <span className={`font-semibold ${currency === 'USD' ? 'text-gray-900' : 'text-gray-500'}`}>
              USD
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={currency === 'INR'}
                onChange={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}
              />
              <div className="w-12 h-6 bg-blue-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className={`font-semibold ${currency === 'INR' ? 'text-gray-900' : 'text-gray-500'}`}>
              INR
            </span>
          </div>
        </div>

        {/* Exchange Rate Notice */}
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {currency === 'INR' ? (
              <>Exchange rate: 1 USD ≈ ₹{exchangeRate}. Prices in INR include all applicable taxes.</>
            ) : (
              <>All prices in USD. Switch to INR for local currency pricing.</>
            )}
          </p>
        </div>
      </motion.div>

      {/* Pricing Plans - Now 4 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {pricingPlans.map((plan, index) => {
          const Icon = plan.icon;
          const isCurrentPlan = user?.plan === plan.id;
          const isFreePlan = plan.id === 'free';
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-effect rounded-2xl p-6 flex flex-col hover-lift relative ${
                plan.popular ? 'ring-2 ring-purple-500 shadow-lg scale-105' : ''
              } ${isFreePlan ? 'border-2 border-green-200' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {isFreePlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Free Forever
                  </span>
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                {!isFreePlan && plan.id !== 'enterprise' && (
                  <span className="text-gray-500 text-lg ml-1">
                    {currency === 'INR' ? '/mo' : '/mo'}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4">{plan.period}</p>
              <p className="text-gray-700 text-sm mb-4">{plan.description}</p>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-700">
                  {typeof plan.limit === 'number' ? `${plan.limit} conversions/month` : 'Unlimited conversions'}
                </div>
                {plan.id !== 'free' && plan.id !== 'enterprise' && currency === 'INR' && (
                  <div className="text-xs text-gray-500 mt-1">
                    ≈ {formatPrice(plan.usdPrice / (billingCycle === 'annual' ? 12 : 1))}/conversion
                  </div>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className={`h-4 w-4 ${isFreePlan && i > 4 ? 'text-gray-400' : 'text-green-600'} flex-shrink-0 mt-0.5`} />
                    <span className={`text-xs ${isFreePlan && i > 4 ? 'text-gray-500' : 'text-gray-700'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrentPlan}
                className={`w-full ${
                  isCurrentPlan
                    ? 'bg-gray-300 cursor-not-allowed'
                    : isFreePlan
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    : `bg-gradient-to-r ${plan.color} hover:opacity-90`
                }`}
              >
                {isCurrentPlan ? 'Current Plan' : plan.ctaText}
              </Button>

              {plan.id !== 'free' && plan.id !== 'enterprise' && (
                <div className="text-center mt-3">
                  <p className="text-xs text-gray-500">
                    {billingCycle === 'annual' ? (
                      currency === 'INR' ? (
                        `Equivalent to ${formatPrice(plan.usdPrice / 12)}/month`
                      ) : (
                        `Equivalent to $${(plan.usdPrice / 12).toFixed(2)}/month`
                      )
                    ) : (
                      'Cancel anytime'
                    )}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-effect rounded-2xl p-6"
      >
        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Compare All Features
        </h2>
        <div className="overflow-x-auto">
          <div className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm border">
            <div className="grid grid-cols-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="p-3 font-semibold text-left text-sm">PDF Features</div>
              <div className="p-3 font-semibold text-center text-sm">Free</div>
              <div className="p-3 font-semibold text-center text-sm">Starter</div>
              <div className="p-3 font-semibold text-center text-sm">Professional</div>
              <div className="p-3 font-semibold text-center text-sm">Enterprise</div>
            </div>
            
            {featureComparison.map((item, index) => (
              <div key={index} className={`grid grid-cols-5 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="p-3 font-medium text-gray-900 border-r text-sm">{item.feature}</div>
                <div className="p-3 text-center border-r text-sm">
                  {typeof item.free === 'boolean' ? 
                    (item.free ? 
                      <Check className="h-4 w-4 text-green-600 mx-auto" /> : 
                      <span className="text-gray-400">—</span>
                    ) : 
                    <span className="text-gray-700">{item.free}</span>
                  }
                </div>
                <div className="p-3 text-center border-r text-sm">
                  {typeof item.starter === 'boolean' ? 
                    (item.starter ? 
                      <Check className="h-4 w-4 text-green-600 mx-auto" /> : 
                      <span className="text-gray-400">—</span>
                    ) : 
                    <span className="text-gray-700">{item.starter}</span>
                  }
                </div>
                <div className="p-3 text-center border-r text-sm">
                  {typeof item.professional === 'boolean' ? 
                    (item.professional ? 
                      <Check className="h-4 w-4 text-green-600 mx-auto" /> : 
                      <span className="text-gray-400">—</span>
                    ) : 
                    <span className="text-gray-700">{item.professional}</span>
                  }
                </div>
                <div className="p-3 text-center text-sm">
                  {typeof item.enterprise === 'boolean' ? 
                    (item.enterprise ? 
                      <Check className="h-4 w-4 text-green-600 mx-auto" /> : 
                      <span className="text-gray-400">—</span>
                    ) : 
                    <span className="text-gray-700">{item.enterprise}</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Usage Progress */}
      {user && user.plan !== 'enterprise' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-effect rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold mb-4">Your Monthly Usage</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">PDF Conversions</span>
                <span className="font-semibold">{used} / {limit} used</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    percentage >= 90 ? 'bg-red-500' : 
                    percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {percentage >= 90 
                  ? 'You\'ve reached your limit. Upgrade to continue converting.' 
                  : percentage >= 75
                  ? 'You\'re approaching your limit. Consider upgrading for more conversions.'
                  : `You're on the ${planName} plan.`
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-effect rounded-2xl p-6"
      >
        <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3 max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors bg-white"
            >
              <div
                className="p-4 flex justify-between items-center hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => toggleFaq(index)}
              >
                <h3 className="font-semibold text-gray-900 text-sm">{faq.question}</h3>
                <span className={`transform transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
              {expandedFaq === index && (
                <div className="p-4 pt-0 text-gray-700 text-sm border-t">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Final CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center py-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl text-white"
      >
        <div className="flex justify-center mb-4">
          <Download className="h-10 w-10 text-white opacity-90" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Ready to Transform Your PDF Workflow?</h2>
        <p className="text-blue-100 text-sm mb-4 max-w-2xl mx-auto">
          Start with our free plan today. No credit card required. Upgrade anytime.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => handleUpgrade('free')}
            className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2 font-semibold rounded-full"
          >
            Start Free Plan
          </Button>
          <Button 
            onClick={() => handleUpgrade('professional')}
            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 py-2 font-semibold rounded-full"
          >
            Try Professional Free
          </Button>
        </div>
        <p className="text-blue-200 text-xs mt-3">
          {currency === 'INR' ? 'Prices in INR include taxes • ' : ''}
          14-day free trial on paid plans • No commitment
        </p>
      </motion.div>
    </div>
  );
};

export default BillingPage;