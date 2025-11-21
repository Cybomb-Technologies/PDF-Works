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

const API_URL1 = import.meta.env.VITE_API_URL;

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  // Load Google SDK - SIMPLIFIED VERSION
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

  // Initialize Google Sign-In when component mounts
  React.useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id:
          "69147878779-uti783ij0hrf5p7upa962jmigv3mesj1.apps.googleusercontent.com",
        callback: handleGoogleResponse,
        context: "signin",
      });

      // Render button directly without One Tap
      const buttonContainer = document.getElementById("googleSignInButton");
      if (buttonContainer) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "continue_with",
          type: "standard",
        });
      }
    };

    // Wait for Google SDK to load
    const checkGoogleSDK = setInterval(() => {
      if (window.google) {
        initializeGoogleSignIn();
        clearInterval(checkGoogleSDK);
      }
    }, 100);

    return () => clearInterval(checkGoogleSDK);
  }, []);

  // Handle Google OAuth Response - UPDATED VERSION
  const handleGoogleResponse = async (response) => {
    try {
      setGoogleLoading(true);
      console.log("Google response received:", response);

      if (!response.credential) {
        throw new Error("No credential received from Google");
      }

      const API_URL = `${API_URL1}/api/auth/google`;

      const backendResponse = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token: response.credential }),
      });

      console.log("Backend response status:", backendResponse.status);

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error("Backend error response:", errorText);
        throw new Error(`HTTP error! status: ${backendResponse.status}`);
      }

      const result = await backendResponse.json();
      console.log("Backend success response:", result);

      if (result.success) {
        // Store token and user data
        if (result.token) {
          localStorage.setItem("token", result.token);
          console.log("JWT token stored");
        }

        const userData = result.user;
        if (userData && result.token) {
          // Create complete user object with token
          const completeUser = {
            ...userData,
            token: result.token,
          };
          localStorage.setItem("pdfpro_user", JSON.stringify(completeUser));

          // Update AuthContext
          loginBackend(userData, result.token);
        }

        toast({
          title: "Welcome! 🎉",
          description: "Google sign-in successful",
        });

        // Navigate to home page
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

  // Manual Google Sign-In trigger (fallback)
  const handleManualGoogleSignIn = () => {
    if (!window.google) {
      toast({
        title: "Google Sign-In Not Ready",
        description:
          "Please wait for Google Sign-In to load, or refresh the page.",
        variant: "destructive",
      });
      return;
    }

    // Trigger Google Sign-In programmatically
    window.google.accounts.id.prompt();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const API_URL = `${API_URL1}/api/auth`;
      const url = isLogin ? `${API_URL}/login` : `${API_URL}/register`;

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

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
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

      const result = await response.json();

      if (!response.ok) {
        // Use the actual error message from backend instead of generic HTTP error
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

          const userData = result.admin || result.user;
          if (userData && result.token) {
            loginBackend(userData, result.token);
          }

          toast({
            title: "Welcome back! 🎉",
            description: result.message || "Login successful",
          });

          // Navigate to files page
          navigate("/");
        } else {
          // Handle registration success - switch to login mode
          toast({
            title: "Account created! 🎉",
            description:
              result.message ||
              "Registration successful. Please login with your credentials.",
          });

          // Clear form data and switch to login mode
          setFormData({
            ...formData,
            password: "", // Clear password but keep email
            name: "", // Clear name
          });
          setIsLogin(true); // Switch to login form
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
      password: "", // Clear password when switching
      name: !isLogin ? "" : formData.name, // Clear name only when switching to login
    });
  };

  const renderSignUpForm = () => {
    return (
      <>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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

          {/* Google Sign In Button Container */}
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
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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

          {/* Google Sign In Button Container */}
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
          >
            Don't have an account? Sign up
          </button>
        </div>
      </>
    );
  };

  const metaPropsData = {
    title: "Login Free PDF Tools Account PDF Works",
    description:
      "Login to your PDF Works account access free PDF tools online PDF editor converter compressor Sign in manage your PDF files documents",
    keyword:
      "free pdf tools login, pdf works account sign in, online pdf editor account, free pdf converter login, pdf tools user account",
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
            {forgotPassword ? "Reset Password" : isLogin ? "Login" : "Sign Up"}{" "}
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
            {forgotPassword
              ? "Reset Password"
              : isLogin
              ? "Welcome Back!"
              : "Create Account"}
          </h1>

          <p className="text-center text-gray-600 mb-6">
            {forgotPassword
              ? "Reset your password in simple steps"
              : isLogin
              ? "Sign in to access your files"
              : "Join us to start managing your PDF files"}
          </p>

          {forgotPassword ? (
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
