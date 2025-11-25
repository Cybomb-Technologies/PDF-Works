import React, { useState, useEffect } from "react";
import { Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Metatags from "../SEO/metatags";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser, getToken } = useAuth();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your payment...");

  const orderId = searchParams.get("order_id");

  useEffect(() => {
    verifyPayment();
  }, [orderId]);

  const verifyPayment = async () => {
    if (!orderId) {
      setStatus("error");
      setMessage("No order ID found");
      return;
    }

    const token = getToken();
    if (!token) {
      setStatus("error");
      setMessage("Please login to verify payment");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage("Payment completed successfully! Your plan has been upgraded and your current usage has been preserved.");

        // Update user context with new plan
        if (updateUser) {
          updateUser({
            plan: data.planId,
            planName: data.planName,
            billingCycle: data.billingCycle,
            subscriptionStatus: "active",
          });
        }
      } else {
        setStatus("error");
        setMessage(data.message || "Payment verification failed");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setStatus("error");
      setMessage("Failed to verify payment");
    }
  };

  const getIcon = () => {
    switch (status) {
      case "success":
        return <Check className="h-16 w-16 text-green-500" />;
      case "error":
        return <X className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-blue-500 animate-spin" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case "success":
        return "Payment Successful!";
      case "error":
        return "Payment Failed";
      default:
        return "Processing Payment";
    }
  };

  const metaPropsData = {
    title: "Payment Result | PDF Works - Payment Verification",
    description:
      "Payment verification in progress. Your PDF Works subscription status is being confirmed. You'll be redirected to your dashboard shortly.",
    keyword:
      "payment result, payment verification, subscription status, payment confirmation, transaction status, payment processing, order verification",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm border text-center">
            <div className="flex justify-center mb-6">{getIcon()}</div>

            <h1 className="text-2xl font-bold mb-4">{getTitle()}</h1>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="space-y-3">
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </Button>

              {status === "success" && (
                <Button
                  onClick={() => navigate("/tools")}
                  variant="outline"
                  className="w-full"
                >
                  Start Using Tools
                </Button>
              )}

              {status === "error" && (
                <Button
                  onClick={() => navigate("/pricing")}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentResult;