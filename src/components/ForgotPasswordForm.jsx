import React from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
const API_URL1 = import.meta.env.VITE_API_URL;

const API_URL = `${API_URL1}/api/auth`;

const ForgotPasswordForm = ({
  formData,
  setFormData,
  forgotPasswordStep,
  setForgotPasswordStep,
  handleBackToLogin,
}) => {
  const handleForgotPasswordFlow = async (e) => {
    e.preventDefault();
    try {
      switch (forgotPasswordStep) {
        case 1: // Send OTP
          if (!formData.email) {
            toast({
              title: "Email required",
              description: "Please enter your email address",
              variant: "destructive",
            });
            return;
          }

          const otpResponse = await fetch(`${API_URL}/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email }),
          });

          const otpResult = await otpResponse.json();

          if (otpResult.success) {
            setForgotPasswordStep(2);
            toast({
              title: "OTP Sent!",
              description: "Check your email for the verification code",
            });
          } else {
            toast({
              title: "Error",
              description: otpResult.error || "Failed to send OTP",
              variant: "destructive",
            });
          }
          break;

        case 2: // Verify OTP
          if (!formData.otp) {
            toast({
              title: "OTP required",
              description: "Please enter the OTP sent to your email",
              variant: "destructive",
            });
            return;
          }

          // In this step, we just move to the next form since the backend
          // doesn't have a separate verification route. The OTP is verified
          // on the final password reset request.
          setForgotPasswordStep(3);
          toast({
            title: "OTP Entered!",
            description: "Now set your new password.",
          });
          break;

        case 3: // Reset Password
          if (!formData.newPassword || !formData.confirmPassword) {
            toast({
              title: "Password required",
              description: "Please enter and confirm your new password",
              variant: "destructive",
            });
            return;
          }

          if (formData.newPassword !== formData.confirmPassword) {
            toast({
              title: "Passwords mismatch",
              description: "New password and confirm password must match",
              variant: "destructive",
            });
            return;
          }

          const resetResponse = await fetch(`${API_URL}/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              otp: formData.otp, // send 'otp' instead of 'token'
              newPassword: formData.newPassword,
            }),
          });

          const resetResult = await resetResponse.json();

          if (resetResult.success) {
            toast({
              title: "Password Reset!",
              description: "Your password has been reset successfully",
            });
            handleBackToLogin();
          } else {
            toast({
              title: "Reset Failed",
              description: resetResult.error || "Failed to reset password",
              variant: "destructive",
            });
          }
          break;
        default:
          return;
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Server Error",
        description: "Unable to process your request",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleBackToLogin}
          className="flex items-center text-purple-600 hover:text-purple-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Login
        </button>
        <div className="text-sm text-gray-500">
          Step {forgotPasswordStep} of 3
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Reset Your Password
      </h2>

      <form onSubmit={handleForgotPasswordFlow} className="space-y-4">
        {forgotPasswordStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            >
              Send OTP
            </Button>
          </div>
        )}

        {forgotPasswordStep === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-gray-600">We sent a 6-digit code to</p>
              <p className="font-semibold text-purple-600">{formData.email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={formData.otp}
                onChange={(e) =>
                  setFormData({ ...formData, otp: e.target.value })
                }
                maxLength={6}
                className="text-center text-lg font-mono"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            >
              Verify OTP
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setForgotPasswordStep(1)}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Didn't receive code? Resend
              </button>
            </div>
          </div>
        )}

        {forgotPasswordStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            >
              Reset Password
            </Button>
          </div>
        )}
      </form>
    </motion.div>
  );
};

export default ForgotPasswordForm;
