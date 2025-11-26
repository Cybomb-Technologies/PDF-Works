import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ForgotPasswordForm from "./ForgotPasswordForm";
import Metatags from "../SEO/metatags";
import OTPVerification from "./OTPVerification";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { loginBackend } = useAuth();
  const navigate = useNavigate();

  // Get API URL from environment
  const API_URL = import.meta.env.VITE_API_URL;

  // Load Google SDK
  React.useEffect(() => {
    const loadGoogleSDK = () => {
      if (window.google) return;

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    loadGoogleSDK();
  }, []);

  // Initialize Google Sign-In
  React.useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id:
          "69147878779-uti783ij0hrf5p7upa962jmigv3mesj1.apps.googleusercontent.com",
        callback: handleGoogleResponse,
        context: "signin",
      });

      const buttonContainer = document.getElementById("googleSignInButton");
      if (buttonContainer) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "continue_with",
          type: "standard",
          logo_alignment: "center",
        });
      }
    };

    const checkGoogleSDK = setInterval(() => {
      if (window.google) {
        initializeGoogleSignIn();
        clearInterval(checkGoogleSDK);
      }
    }, 100);

    return () => clearInterval(checkGoogleSDK);
  }, []);

  // Handle Google OAuth Response
  const handleGoogleResponse = async (response) => {
    try {
      setGoogleLoading(true);

      if (!response.credential) {
        throw new Error("No credential received from Google");
      }

      const backendResponse = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: response.credential }),
      });

      if (!backendResponse.ok) {
        throw new Error(`HTTP error! status: ${backendResponse.status}`);
      }

      const result = await backendResponse.json();

      if (result.success) {
        if (result.token) {
          localStorage.setItem("token", result.token);
        }

        const userData = result.user;
        if (userData && result.token) {
          const completeUser = {
            ...userData,
            token: result.token,
          };
          localStorage.setItem("pdfpro_user", JSON.stringify(completeUser));
          loginBackend(userData, result.token);
        }

        toast({
          title: "Welcome! 🎉",
          description: "Google sign-in successful",
        });

        navigate("/");
      } else {
        throw new Error(result.error || "Authentication failed");
      }
    } catch (error) {
      console.error("Google auth error:", error);
      toast({
        title: "Google Sign-In Failed",
        description:
          error.message || "Unable to sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = isLogin
        ? `${API_URL}/api/auth/login`
        : `${API_URL}/api/auth/register`;

      // Validation
      if (
        !isLogin &&
        (!formData.name || !formData.email || !formData.password)
      ) {
        toast({
          title: "Missing information",
          description: "Please fill in all fields",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // console.log("Sending request to:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isLogin
            ? {
                email: formData.email,
                password: formData.password,
              }
            : {
                name: formData.name,
                email: formData.email,
                password: formData.password,
              }
        ),
      });

      // console.log("Response status:", response.status);

      const result = await response.json();
      // console.log("Response data:", result);

      // Don't throw error for verification required cases
      if (!response.ok && !result.requiresVerification) {
        throw new Error(
          result.error || `HTTP error! status: ${response.status}`
        );
      }

      if (result.success) {
        if (isLogin) {
          // Handle login success
          if (result.token) {
            localStorage.setItem("token", result.token);
          }

          const userData = result.user;
          if (userData && result.token) {
            loginBackend(userData, result.token);
          }

          toast({
            title: "Welcome back! 🎉",
            description: result.message || "Login successful",
          });

          navigate("/");
        } else {
          // Handle registration success
          toast({
            title: "Account created! 🎉",
            description:
              result.message ||
              "Registration successful. Please verify your email.",
          });

          if (result.requiresVerification) {
            setPendingEmail(formData.email);
            setShowOTPVerification(true);
          } else {
            setFormData({
              ...formData,
              password: "",
              name: "",
            });
            setIsLogin(true);
          }
        }
      } else {
        // Handle cases where success is false but verification is required
        if (result.requiresVerification) {
          setPendingEmail(formData.email);
          setShowOTPVerification(true);
          toast({
            title: "Email Verification Required",
            description: result.message || "Please verify your email to login.",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Something went wrong",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Authentication Failed",
        description:
          error.message ||
          "Unable to connect to server. Please check if the backend is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification success
  const handleVerificationSuccess = (token, userData) => {
    if (token) {
      localStorage.setItem("token", token);
    }

    if (userData && token) {
      loginBackend(userData, token);
    }

    setTimeout(() => {
      navigate("/");
    }, 1000);
  };

  // Handle back to login from OTP verification
  const handleBackFromOTP = () => {
    setShowOTPVerification(false);
    setPendingEmail("");
  };

  const handleBackToLogin = () => {
    setForgotPassword(false);
    setForgotPasswordStep(1);
    setFormData({
      email: "",
      password: "",
      name: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      ...formData,
      password: "",
      name: !isLogin ? "" : formData.name,
    });
  };

  const renderSignUpForm = () => {
    return (
      <>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              {/* <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /> */}
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              {/* <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /> */}
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              {/* <Lock className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /> */}
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-10"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Account...
              </div>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        {/* Google Sign In Section */}
        <div className="mt-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="w-full">
            <div id="googleSignInButton" className="w-full"></div>
          </div>

          {googleLoading && (
            <div className="flex justify-center mt-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-sm text-gray-600">Processing...</span>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleToggleMode}
            className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
            disabled={isLoading}
          >
            Already have an account? Sign in
          </button>
        </div>
      </>
    );
  };

  const renderLoginForm = () => {
    return (
      <>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              {/* <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /> */}
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              {/* <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /> */}
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-10"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => setForgotPassword(true)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              Forgot your password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Logging in...
              </div>
            ) : (
              "Login"
            )}
          </Button>
        </form>

        {/* Google Sign In Section */}
        <div className="mt-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="w-full flex justify-center">
            <div id="googleSignInButton" className="w-full"></div>
          </div>

          {googleLoading && (
            <div className="flex justify-center mt-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-sm text-gray-600">Processing...</span>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleToggleMode}
            className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </>
    );
  };

  const metaPropsData = {
    title: "Login to PDF Works - Access Your Free & Premium Account",
    description:
      "Sign in to your PDF Works account to access free PDF editing tools. Use our online PDF editor, converter, and compressor to manage and process your documents securely.",
    keyword:
      "pdf works login, free pdf tools account, online pdf editor sign in, pdf converter login, secure document management",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/login",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Helmet>
          <title>
            {showOTPVerification
              ? "Verify Email"
              : forgotPassword
              ? "Reset Password"
              : isLogin
              ? "Login"
              : "Sign Up"}{" "}
            - pdfworks
          </title>
        </Helmet>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-effect rounded-2xl p-8 max-w-md w-full shadow-lg bg-white/70 backdrop-blur-lg border border-white/30"
        >
          <Link to="/" className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
              <FileText className="h-10 w-10 text-white" />
            </div>
          </Link>

          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {showOTPVerification
              ? "Verify Email"
              : forgotPassword
              ? "Reset Password"
              : isLogin
              ? "Welcome Back!"
              : "Create Account"}
          </h1>

          <p className="text-center text-gray-600 mb-6">
            {showOTPVerification
              ? "Enter the OTP sent to your email"
              : forgotPassword
              ? "Reset your password in simple steps"
              : isLogin
              ? "Sign in to access your files"
              : "Join us to start managing your PDF files"}
          </p>

          {showOTPVerification ? (
            <OTPVerification
              email={pendingEmail}
              onVerificationSuccess={handleVerificationSuccess}
              onBackToLogin={handleBackFromOTP}
            />
          ) : forgotPassword ? (
            <ForgotPasswordForm
              formData={formData}
              setFormData={setFormData}
              forgotPasswordStep={forgotPasswordStep}
              setForgotPasswordStep={setForgotPasswordStep}
              handleBackToLogin={handleBackToLogin}
            />
          ) : isLogin ? (
            renderLoginForm()
          ) : (
            renderSignUpForm()
          )}
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;
