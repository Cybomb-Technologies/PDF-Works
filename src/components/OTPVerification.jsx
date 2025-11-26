// components/OTPVerification.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const OTPVerification = ({
  email,
  onVerificationSuccess,
  onBackToLogin,
  isResend = false,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationMessage, setVerificationMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    if (pasteData.length === 6 && !isNaN(pasteData)) {
      const otpArray = pasteData.split("");
      setOtp(otpArray);
      // Focus the last input
      document.getElementById(`otp-5`).focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setVerificationMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otpValue,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setVerificationMessage("Email verified successfully! Redirecting...");
        toast({
          title: "Success! 🎉",
          description: "Email verified successfully",
        });

        // Call success callback with token and user data
        if (onVerificationSuccess) {
          onVerificationSuccess(result.token, result.user);
        }
      } else {
        setVerificationMessage("");
        toast({
          title: "Verification Failed",
          description: result.error || "Invalid OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setVerificationMessage("");
      toast({
        title: "Verification Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    setVerificationMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setCountdown(60); // 60 seconds countdown
        toast({
          title: "OTP Sent",
          description: "New OTP has been sent to your email",
        });
      } else {
        toast({
          title: "Failed to Resend",
          description: result.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast({
        title: "Network Error",
        description: "Failed to resend OTP. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
        <p className="text-gray-600 mt-2">
          We've sent a 6-digit verification code to
        </p>
        <p className="font-semibold text-purple-600">{email}</p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="otp">Enter Verification Code</Label>
          <div className="flex justify-center space-x-2" onPaste={handlePaste}>
            {otp.map((data, index) => (
              <Input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={data}
                onChange={(e) => handleOtpChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={(e) => e.target.select()}
                className="w-12 h-12 text-center text-lg font-semibold"
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>
        </div>

        {verificationMessage && (
          <div className="text-center">
            <p className="text-green-600 font-medium">{verificationMessage}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
          disabled={isLoading || otp.join("").length !== 6}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verifying...
            </div>
          ) : (
            "Verify Email"
          )}
        </Button>
      </form>

      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-gray-600">Didn't receive the code?</span>
          <Button
            variant="link"
            onClick={handleResendOTP}
            disabled={resendLoading || countdown > 0}
            className="p-0 h-auto font-semibold text-purple-600"
          >
            {resendLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-1"></div>
                Sending...
              </div>
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              <div className="flex items-center">
                <RotateCcw className="h-4 w-4 mr-1" />
                Resend OTP
              </div>
            )}
          </Button>
        </div>

        {!isResend && onBackToLogin && (
          <Button
            variant="outline"
            onClick={onBackToLogin}
            disabled={isLoading}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        )}
      </div>
    </div>
  );
};

export default OTPVerification;
