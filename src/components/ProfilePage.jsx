// src/components/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Shield, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const ProfilePage = () => {
  const { user, updateUser, getToken } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFormData({
            name: data.user.name || "",
            email: data.user.email || "",
            role: data.user.role || "user",
          });
        }
      } else {
        throw new Error("Failed to fetch profile data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local user state
        updateUser({
          name: formData.name.trim(),
          email: formData.email,
          role: formData.role,
        });

        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const cancelEdit = () => {
    // Reset form data to current user data
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "user",
    });
    setIsEditing(false);
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
      });
    }
  }, [user]);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">Profile</h1>
          <p className="text-gray-600 text-lg">
            Manage your account information and preferences
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-2xl p-6 shadow-lg"
        >
          {/* Header with Edit Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Personal Information
            </h2>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={updateProfile}
                  disabled={loading}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={cancelEdit}
                  variant="outline"
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                <User className="h-4 w-4 mr-2" />
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-900">
                    {user?.name || "Not provided"}
                  </p>
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Address
              </Label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-900">{user?.email || "Not provided"}</p>
              </div>
              <p className="text-xs text-gray-500">
                Email address cannot be changed
              </p>
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <Label
                htmlFor="role"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Account Role
              </Label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <span className="capitalize text-gray-900">
                    {user?.role || "user"}
                  </span>
                  {user?.role === "admin" && (
                    <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      Administrator
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Role is determined by your account permissions
              </p>
            </div>

            {/* Plan Information */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Subscription Plan
              </h3>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">
                    {user?.planName || "Free Plan"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {user?.subscriptionStatus === "active"
                      ? "Active subscription"
                      : "Inactive subscription"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/pricing")}
                >
                  Manage Plan
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
