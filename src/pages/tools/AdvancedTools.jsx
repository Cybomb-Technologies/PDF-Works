import React, { useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Settings2, BarChart3, Download, Save } from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL;

// Tools data - code
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

// Enhanced fetch with auth
const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
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
  const [operationSaved, setOperationSaved] = useState(false);
  const [advancedId, setAdvancedId] = useState(null);

  const handleToolClick = async (tool) => {
    setLoading(true);
    setError("");
    setResult(null);
    setOperationSaved(false);
    setAdvancedId(null);
    
    try {
      let response;
      if (tool.id === "automation") {
        response = await authFetch(`${API_URL}/api/tools/advanced/automation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: ["convert", "compress", "merge"] }),
        });
      } else if (tool.id === "api-connect") {
        if (!apiUrl.trim()) throw new Error("Please enter an API URL");
        
        let parsedBody = null;
        let parsedHeaders = null;
        
        if (body.trim()) {
          try {
            parsedBody = JSON.parse(body);
          } catch (e) {
            throw new Error("Invalid JSON in Body");
          }
        }
        
        if (headers.trim()) {
          try {
            parsedHeaders = JSON.parse(headers);
          } catch (e) {
            throw new Error("Invalid JSON in Headers");
          }
        }

        response = await authFetch(`${API_URL}/api/tools/advanced/api-connect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: apiUrl,
            method,
            body: parsedBody,
            headers: parsedHeaders,
          }),
        });
      } else if (tool.id === "analytics") {
        response = await authFetch(`${API_URL}/api/tools/advanced/analytics`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || "Something went wrong");
      }

      setResult(data);
      
      // Check if operation was saved to database
      if (data.advancedId) {
        setOperationSaved(true);
        setAdvancedId(data.advancedId);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-transparent">
      <div className="w-full py-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          ⚙️ Advanced Tools
        </h2>

        {/* Operation Saved Status */}
        {operationSaved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <Save className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                Operation saved to your advanced history {advancedId && `(ID: ${advancedId})`}
              </span>
            </div>
          </div>
        )}

        {tools.find((t) => t.id === "api-connect") && (
          <div className="grid gap-4 md:grid-cols-3 w-full">
            {/* API URL */}
            <div className="flex flex-col w-full">
              <label className="mb-1 font-medium text-gray-700">API URL:</label>
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
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
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
        <div className="grid gap-6 mt-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                whileHover={{
                  scale: 1.03,
                  y: -8,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleToolClick(tool)}
                className="p-4 bg-white rounded-xl shadow hover:shadow-lg cursor-pointer w-full"
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
              <h4 className="text-green-600 font-semibold mb-2">✅ Result:</h4>
              <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-auto max-h-64 border border-gray-200 w-full">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedTools;