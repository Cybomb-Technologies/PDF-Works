import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Metatags from "../SEO/metatags";

const API_URL = import.meta.env.VITE_API_URL;

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUserPlan } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const orderId = searchParams.get("order_id");

      if (!orderId) {
        toast({
          title: "Invalid redirect",
          description: "Missing payment information",
          variant: "destructive",
        });
        navigate("/pricing");
        return;
      }

      try {
        console.log("Verifying payment for order:", orderId);

        // Verify payment with backend
        const response = await fetch(
          `${API_URL}/api/subscription/verify-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user?.token}`,
            },
            body: JSON.stringify({ orderId }),
          }
        );

        const data = await response.json();

        if (data.success) {
          setSuccess(true);
          // Update user plan in context
          if (data.user) {
            updateUserPlan(data.user.plan);
          }
          toast({
            title: "Success!",
            description: "Your subscription has been activated successfully and your usage progress has been preserved.",
          });
        } else {
          throw new Error(data.message || "Payment verification failed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        toast({
          title: "Verification Failed",
          description:
            error.message ||
            "Failed to verify payment. Please contact support if the issue persists.",
          variant: "destructive",
        });
        navigate("/pricing");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      verifyPayment();
    } else {
      setLoading(false);
      navigate("/login");
    }
  }, [searchParams, user, navigate, updateUserPlan]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Verifying your payment...</p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a few moments
          </p>
        </div>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Payment Failed
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't verify your payment. Please try again.
          </p>
          <Button onClick={() => navigate("/pricing")}>Back to Pricing</Button>
        </div>
      </div>
    );
  }

  const metaPropsData = {
    title:
      "Subscription Activated Successfully | PDF Works - Premium Features Unlocked",
    description:
      "Your PDF Works premium subscription is now active! Access all premium PDF tools and features. Start editing, converting, and managing your documents with enhanced capabilities.",
    keyword:
      "subscription activated, premium features unlocked, pdf works premium, subscription success, payment verified, premium tools access, plan activated, subscription confirmed",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg"
        >
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Premium! 🎉
          </h1>

          <p className="text-gray-600 mb-6">
            Your subscription has been activated successfully. You now have access to all premium features, and your current usage progress has been preserved.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <FileText className="h-5 w-5" />
              <span className="font-semibold">Premium Features Unlocked</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/tools")}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Start Using Tools
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Need help? Contact our support team at support@pdfworks.in
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default SubscriptionSuccess;