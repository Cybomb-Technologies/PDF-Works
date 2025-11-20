import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FileText, DollarSign, Activity } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
const API_URL = import.meta.env.VITE_API_URL;

const AdminPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFiles: 0,
    revenue: 0,
    activeUsers: 0,
  });

  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("pdfpro_admin_token");
        if (!token) {
          toast({
            title: "Error",
            description: "No admin token found",
            variant: "destructive",
          });
          return;
        }

        const res = await fetch(`${API_URL}/api/auth/users`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          toast({
            title: "Unauthorized",
            description: "You are not allowed to access this data",
            variant: "destructive",
          });
          return;
        }

        const data = await res.json();

        if (!data.success || !data.users) {
          toast({
            title: "Error",
            description: "Invalid data received",
            variant: "destructive",
          });
          return;
        }

        let totalFiles = 0;
        let revenue = 0;
        let activeUsers = 0;

        const mappedUsers = data.users.map((user, index) => {
          const plan =
            index % 3 === 0 ? "pro" : index % 3 === 1 ? "business" : "free";
          const files = Math.floor(Math.random() * 10);

          totalFiles += files;
          if (plan === "pro") revenue += 12;
          if (plan === "business") revenue += 49;
          if (files > 0) activeUsers++;

          return {
            id: user._id, // use _id from backend
            name: user.name,
            email: user.email,
            role: user.role || "user",
            plan,
            createdAt: user.createdAt || new Date().toISOString(),
            files,
          };
        });

        setUsers(mappedUsers);
        setStats({
          totalUsers: mappedUsers.length,
          totalFiles,
          revenue,
          activeUsers,
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    };

    fetchUsers();
  }, []);

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Total Files",
      value: stats.totalFiles,
      icon: FileText,
      color: "from-purple-500 to-pink-500",
    },
    {
      label: "Monthly Revenue",
      value: `$${stats.revenue}`,
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Active Users",
      value: stats.activeUsers,
      icon: Activity,
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold gradient-text">Admin Dashboard 👑</h1>
        <p className="text-gray-600">
          Manage users and monitor platform activity
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-effect rounded-2xl p-6 hover-lift"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </h3>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-effect rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold mb-4">All Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Email
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Plan
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Role
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-purple-50"
                >
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.plan === "free"
                          ? "bg-gray-100 text-gray-700"
                          : user.plan === "pro"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPage;
