import React, { useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Settings2, BarChart3, AlertTriangle } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
const API_URL = import.meta.env.VITE_API_URL;
import Metatags from "../../SEO/metatags";

// Tools data
const tools = [
  {
    id: "automation",
    name: "Automation Runner",
    description: "Run scripts and workflows automatically",
    icon: Cpu,
    color: "from-teal-500 to-green-500",
  },
  {
    id: "api-connect",
    name: "API Integrator",
    description: "Easily connect third-party APIs",
    icon: Settings2,
    color: "from-indigo-500 to-sky-500",
  },
  {
    id: "analytics",
    name: "Analytics Dashboard",
    description: "Track performance and metrics",
    icon: BarChart3,
    color: "from-yellow-500 to-orange-500",
  },
];

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Enhanced fetch with auth (same as your other tools)
const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  return fetch(url, { ...options, headers });
};

const AdvancedTools = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [headers, setHeaders] = useState("");
  
  const { showNotification } = useNotification();

  const handleToolClick = async (tool) => {
    setLoading(true);
    setError("");
    setResult(null);
    
    try {
      let requestBody = {};

      if (tool.id === "automation") {
        requestBody = { tasks: ["convert", "compress", "merge"] };
      } else if (tool.id === "api-connect") {
        if (!apiUrl.trim()) {
          throw new Error("Please enter an API URL");
        }
        
        let parsedBody = null;
        let parsedHeaders = null;
        
        if (body.trim()) {
          try {
            parsedBody = JSON.parse(body);
          } catch (e) {
            throw new Error("Invalid JSON in body");
          }
        }
        
        if (headers.trim()) {
          try {
            parsedHeaders = JSON.parse(headers);
          } catch (e) {
            throw new Error("Invalid JSON in headers");
          }
        }

        requestBody = {
          url: apiUrl,
          method,
          body: parsedBody,
          headers: parsedHeaders,
        };
      } else if (tool.id === "analytics") {
        requestBody = {}; // Analytics doesn't need body
      }

      // ✅ FIXED: Use unified route like OrganizeTools
      const response = await authFetch(`${API_URL}/api/advanced/${tool.id}`, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      // Handle backend errors with detailed messages
      if (!response.ok || !result.success) {
        // Check for limit exceeded error
        if (result.type === 'limit_exceeded') {
          showNotification({
            type: 'error',
            title: result.title || 'Usage Limit Reached',
            message: result.message || result.reason || 'Advanced tools limit reached',
            duration: 8000,
            currentUsage: result.currentUsage,
            limit: result.limit,
            upgradeRequired: result.upgradeRequired,
            action: result.upgradeRequired ? {
              label: 'Upgrade Plan',
              onClick: () => window.location.href = '/billing',
              external: true
            } : undefined
          });
          
          return;
        } else {
          // Show other detailed errors
          showNotification({
            type: 'error',
            title: result.title || 'Operation Failed',
            message: result.message || result.error || 'Something went wrong',
            duration: 5000
          });
        }
        
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }
      
      setResult(result);

      // Show success notification
      showNotification({
        type: 'success',
        title: `${tool.name} Completed`,
        message: result.message || 'Operation completed successfully',
        duration: 5000
      });

    } catch (err) {
      console.error("Tool execution error:", err);
      
      // Don't show duplicate notifications for limit exceeded
      if (!err.message.includes('Usage Limit Reached') && !err.message.includes('limit_exceeded')) {
        setError(err.message);
        showNotification({
          type: 'error',
          title: 'Operation Failed',
          message: err.message,
          duration: 5000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!getAuthToken();
  };

  const metaPropsData = {
    title: "Free Advanced PDF Tools | Automation, API & Analytics - PDF Works",
    description:
      "Free advanced PDF tools including automation runner, API integrator, and analytics dashboard. Run scripts, connect APIs, and track performance - 100% free with no limitations.",
    keyword:
      "free pdf tools, advanced pdf tools, pdf automation free, free api integrator, pdf analytics free, free automation runner, free pdf scripts, free workflow automation, free pdf analytics, no cost pdf tools, free document automation, free pdf api tools, completely free advanced tools",
    image:
      "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
    url: "https://pdfworks.in/tools/",
  };

  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="w-full bg-transparent">
        <div className="w-full py-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            ⚙️ Advanced Tools
          </h2>

          {/* Authentication Warning */}
          {!isAuthenticated() && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Some features require authentication. Please log in for full access.
              </p>
            </div>
          )}

          {/* API Configuration Section - Only shown for API Connect tool */}
          {tools.find((t) => t.id === "api-connect") && (
            <div className="grid gap-4 md:grid-cols-3 w-full mb-6">
              {/* API URL */}
              <div className="flex flex-col w-full">
                <label className="mb-1 font-medium text-gray-700">
                  API URL:
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  placeholder="https://example.com/api"
                />
              </div>

              {/* HTTP Method */}
              <div className="flex flex-col w-full">
                <label className="mb-1 font-medium text-gray-700">
                  HTTP Method:
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>

              {/* Headers */}
              <div className="flex flex-col w-full">
                <label className="mb-1 font-medium text-gray-700">
                  Headers (JSON, optional):
                </label>
                <textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  placeholder='{"Authorization":"Bearer ..."}'
                  className="border border-gray-300 rounded-md p-2 h-12 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none w-full"
                />
              </div>

              {/* Body - Full width */}
              <div className="md:col-span-3 flex flex-col w-full">
                <label className="mb-1 font-medium text-gray-700">
                  Body (JSON, optional):
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"key":"value"}'
                  className="border border-gray-300 rounded-md p-2 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none w-full"
                />
              </div>
            </div>
          )}

          {/* Tools Cards */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    delay: i * 0.1,
                    type: "spring",
                    stiffness: 100,
                  }}
                  whileHover={{
                    scale: 1.03,
                    y: -8,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleToolClick(tool)}
                  className="p-4 bg-white rounded-xl shadow hover:shadow-lg cursor-pointer w-full border border-gray-100"
                >
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {tool.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Status Messages */}
          <div className="mt-6 space-y-4 w-full">
            {loading && (
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
                />
                Processing your request...
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md font-medium">
                ❌ {error}
              </div>
            )}
            
            {result && (
              <div className="w-full">
                <h4 className="text-green-600 font-semibold mb-2">
                  ✅ Operation Completed:
                </h4>
                <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-auto max-h-64 border border-gray-200 w-full">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedTools;