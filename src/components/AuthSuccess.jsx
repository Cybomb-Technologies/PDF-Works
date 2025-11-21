import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginBackend } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");

    if (token && userId) {
      // Store token
      localStorage.setItem("token", token);

      // Fetch user data
      fetchUserData(token);
    } else {
      toast({
        title: "Authentication Failed",
        description: "Unable to complete Google sign-in",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [searchParams, navigate, loginBackend]);

  const fetchUserData = async (token) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.success) {
          loginBackend(userData.user, token);
          toast({
            title: "Welcome! 🎉",
            description: "Google sign-in successful",
          });
          navigate("/");
        }
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Authentication Error",
        description: "Please try signing in again",
        variant: "destructive",
      });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthSuccess;
