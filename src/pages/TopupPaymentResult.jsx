import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Clock,
  BatteryCharging,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TopupPaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser, refreshUser } = useAuth();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your payment...");
  const [creditsAdded, setCreditsAdded] = useState(null);
  const [currentCredits, setCurrentCredits] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  const orderId = searchParams.get("order_id");

  useEffect(() => {
    verifyPayment();
  }, [orderId]);

  const verifyPayment = async () => {
    if (!orderId) {
      setStatus("error");
      setMessage("No order ID found in URL");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("error");
      setMessage("Please login to verify payment");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/payments/topup/verify`, {
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
        setMessage(
          data.message || "Payment completed successfully! Credits have been added to your account."
        );

        if (data.creditsAdded) {
          setCreditsAdded(data.creditsAdded);
        }

        if (data.currentCredits) {
          setCurrentCredits(data.currentCredits);
          // Update user context if needed

        }

        if (data.orderAmount) {
          setOrderDetails({
            amount: data.orderAmount,
            currency: data.orderCurrency || "USD",
          });
        }



        // Auto-redirect after 5 seconds
        setTimeout(async () => {
          await refreshUser();                             // ⬅ fetch fresh DB values
          window.dispatchEvent(new Event("user-updated")); // ⬅ notify UI
          navigate("/dashboard", { replace: true });       // ⬅ correct navigation
        }, 1200);

      } else {
        setStatus("error");
        setMessage(data.message || "Payment verification failed");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setStatus("error");
      setMessage("Failed to verify payment. Please check your internet connection.");
    }
  };

  const getIcon = () => {
    switch (status) {
      case "success":
        return (
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Check className="h-10 w-10 text-white" />
          </div>
        );
      case "error":
        return (
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
            <X className="h-10 w-10 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
            <Clock className="h-10 w-10 text-white animate-spin" />
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (status) {
      case "success":
        return "Payment Successful! 🎉";
      case "error":
        return "Payment Failed";
      default:
        return "Processing Payment";
    }
  };

  const getActionButtons = () => {
    switch (status) {
      case "success":
        return (
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/tools")}
              variant="outline"
              className="w-full"
            >
              Start Using Tools
            </Button>
            <Button
              onClick={() => navigate("/topup")}
              variant="ghost"
              className="w-full"
            >
              Buy More Credits
            </Button>
          </div>
        );
      case "error":
        return (
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/topup")}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Try Again
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => navigate("/support")}
              variant="ghost"
              className="w-full"
            >
              Contact Support
            </Button>
          </div>
        );
      default:
        return (
          <Button disabled className="w-full">
            <Clock className="h-4 w-4 animate-spin mr-2" />
            Verifying...
          </Button>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl p-8 shadow-lg border">
          <div className="flex justify-center mb-6">{getIcon()}</div>

          <h1 className="text-2xl font-bold text-center mb-4">{getTitle()}</h1>
          <p className="text-gray-600 text-center mb-6">{message}</p>

          {status === "success" && creditsAdded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-center mb-3">
                  <BatteryCharging className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-700">
                    Credits Added Successfully!
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Credits:</span>
                    <span className="font-bold">{creditsAdded.total || 0}</span>
                  </div>

                  {creditsAdded.conversion > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">PDF Conversions:</span>
                      <span className="font-medium">{creditsAdded.conversion}</span>
                    </div>
                  )}

                  {creditsAdded.editTools > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Edit Tools:</span>
                      <span className="font-medium">{creditsAdded.editTools}</span>
                    </div>
                  )}

                  {orderDetails && (
                    <div className="pt-2 border-t mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="font-bold">
                          {orderDetails.currency === "INR" ? "₹" : "$"}
                          {orderDetails.amount}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Order ID:</span>
                        <span className="font-mono">{orderId?.substring(0, 12)}...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {status === "success" && currentCredits && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">
                    Your Total Available Credits:
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {currentCredits.total || 0}
                  </span>
                </div>
                <p className="text-xs text-blue-600">
                  These credits never expire and will be used automatically when you run out of subscription credits.
                </p>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700">
                  If you were charged but didn't receive credits, please contact our support team with your Order ID:{" "}
                  <code className="bg-red-100 px-2 py-1 rounded text-xs">
                    {orderId}
                  </code>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">{getActionButtons()}</div>

          {status === "loading" && (
            <p className="text-center text-xs text-gray-500 mt-4">
              This may take a few moments...
            </p>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <CreditCard className="h-4 w-4 mr-2" />
              <span>Secure payment processed by Cashfree</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TopupPaymentResult;