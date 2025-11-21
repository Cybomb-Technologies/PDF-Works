import React from "react";
import { Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import Metatags from "../SEO/metatags";
import { useAuth } from "@/contexts/AuthContext";

const SignUpForm = () => {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const navigate = useNavigate();
  const { loginBackend } = useAuth();

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
        context: "signup",
      });

      // Render button directly without One Tap
      const buttonContainer = document.getElementById("googleSignUpButton");
      if (buttonContainer) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signup_with",
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

      const API_URL = `${import.meta.env.VITE_API_URL}/api/auth/google`;

      const backendResponse = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token: response.credential }),
      });

      if (!backendResponse.ok) {
        throw new Error(`HTTP error! status: ${backendResponse.status}`);
      }

      const result = await backendResponse.json();
      console.log("Backend response:", result);

      if (result.success) {
        if (result.token) {
          localStorage.setItem("token", result.token);
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

          toast({
            title: "Welcome! 🎉",
            description: "Account created successfully with Google",
          });

          // Navigate to home page
          navigate("/");
          return; // Important: return early to prevent duplicate navigation
        }
      } else {
        toast({
          title: "Google Sign-Up Error",
          description: result.error || "Registration failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Google auth error:", error);
      toast({
        title: "Connection Error",
        description:
          "Unable to connect to server. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple validation
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    // Clear errors
    setErrors({});

    try {
      const API_URL = `${import.meta.env.VITE_API_URL}/api/auth/register`;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Use the actual error message from backend instead of generic HTTP error
        throw new Error(
          result.error || `HTTP error! status: ${response.status}`
        );
      }

      if (result.success) {
        toast({
          title: "Account created! 🎉",
          description:
            result.message ||
            "Registration successful. Please login with your credentials.",
        });

        navigate("/login");
      } else {
        toast({
          title: "Error",
          description: result.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Registration Failed",
        description:
          error.message || "Unable to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const metaPropsData = {
    title: "Sign Up Free PDF Tools Account PDF Works",
    description:
      "Create your PDF Works account access free PDF tools online PDF editor converter compressor Sign up manage your PDF files documents",
    keyword:
      "free pdf tools sign up, pdf works account create account, online pdf editor register, free pdf converter account, pdf tools user registration",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/signup",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
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
            Create Account
          </h1>

          <p className="text-center text-gray-600 mb-6">
            Join us to start managing your PDF files
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
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
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
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
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
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
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
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

          {/* Google Sign Up Section */}
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
              <div id="googleSignUpButton" className="w-full"></div>
            </div>

            {googleLoading && (
              <div className="flex justify-center mt-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Processing...
                </span>
              </div>
            )}
          </div>

          {/* Already have an account link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default SignUpForm;
