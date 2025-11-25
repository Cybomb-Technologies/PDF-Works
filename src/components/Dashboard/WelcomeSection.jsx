import React from 'react';
import { motion } from "framer-motion";
import { Crown, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WelcomeSection = ({ user, navigate, billingInfo, formatDate, formatCurrency }) => {
  const getDaysUntilExpiry = () => {
    if (!user?.planExpiry) return null;
    const expiry = new Date(user.planExpiry);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">
            Welcome back, {user?.name || "User"}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            {user?.subscriptionStatus === "active"
              ? `You're on the ${user?.planName} plan`
              : "You're on the Free plan - upgrade to unlock more features"}
          </p>
        </div>

        {user?.subscriptionStatus !== "active" && (
          <Button
            onClick={() => navigate("/pricing")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        )}
      </div>

      {/* Plan Status Alert */}
      {user?.subscriptionStatus === "active" && daysUntilExpiry !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl border ${
            daysUntilExpiry <= 7
              ? "bg-orange-50 border-orange-200"
              : daysUntilExpiry <= 30
              ? "bg-yellow-50 border-yellow-200"
              : "bg-green-50 border-green-200"
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
                  : `Your plan is active - expires in ${daysUntilExpiry} days`}
              </p>
              <p className="text-sm text-gray-600">
                Next billing: {formatDate(user?.planExpiry)} •{" "}
                {user?.billingCycle === "annual" ? "Annual" : "Monthly"} billing
                {billingInfo &&
                  ` • Last payment: ${formatCurrency(
                    billingInfo.amount,
                    billingInfo.currency
                  )}`}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default WelcomeSection;