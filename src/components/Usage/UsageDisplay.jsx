// src/components/Usage/UsageDisplay.jsx (NEW)
import React from 'react';
import { Zap, Edit, Folder, Shield, Gauge, Star, Calendar } from 'lucide-react';

const UsageDisplay = ({ userLimits }) => {
  const usageItems = [
    {
      icon: Zap,
      label: 'PDF Conversions',
      used: userLimits.usage.conversions,
      limit: userLimits.plan.conversionLimit,
      percentage: userLimits.usagePercentages.conversions,
      color: 'blue'
    },
    {
      icon: Edit,
      label: 'Edit Tools',
      used: userLimits.usage.editTools,
      limit: userLimits.plan.editToolsLimit,
      percentage: userLimits.usagePercentages.editTools,
      color: 'green'
    },
    {
      icon: Folder,
      label: 'Organize Tools',
      used: userLimits.usage.organizeTools,
      limit: userLimits.plan.organizeToolsLimit,
      percentage: userLimits.usagePercentages.organizeTools,
      color: 'purple'
    },
    {
      icon: Shield,
      label: 'Security Tools',
      used: userLimits.usage.securityTools,
      limit: userLimits.plan.securityToolsLimit,
      percentage: userLimits.usagePercentages.securityTools,
      color: 'red'
    },
    {
      icon: Gauge,
      label: 'Optimize Tools',
      used: userLimits.usage.optimizeTools,
      limit: userLimits.plan.optimizeToolsLimit,
      percentage: userLimits.usagePercentages.optimizeTools,
      color: 'orange'
    },
    {
      icon: Star,
      label: 'Advanced Tools',
      used: userLimits.usage.advancedTools,
      limit: userLimits.plan.advancedToolsLimit,
      percentage: userLimits.usagePercentages.advancedTools,
      color: 'yellow'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500'
    };
    return colors[color] || 'bg-gray-500';
  };

  const getTextColor = (color) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      red: 'text-red-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600'
    };
    return colors[color] || 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      {/* Cycle Information */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Billing Cycle</span>
          </div>
          <span className="text-sm text-gray-500">
            {userLimits.cycleInfo?.daysRemaining || 30} days remaining
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Resets on {userLimits.cycleInfo?.cycleEnd?.toLocaleDateString() || 'Next month'}
        </div>
      </div>

      {/* Usage Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {usageItems.map((item, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${getTextColor(item.color)} bg-opacity-10`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{item.label}</div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Used: {item.used}</span>
                  <span>Limit: {item.limit === 0 ? 'Unlimited' : item.limit}</span>
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getColorClasses(item.color)}`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{Math.round(item.percentage)}% used</span>
              <span>
                {item.limit > 0 ? `${item.limit - item.used} remaining` : 'Unlimited'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Storage Usage */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="font-medium text-sm text-gray-900 mb-2">Storage Usage</div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Used: {(userLimits.usage.storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
          <span>Limit: {userLimits.plan.storage} GB</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-indigo-500 transition-all duration-300"
            style={{ 
              width: `${Math.min(100, (userLimits.usage.storageUsedBytes / (userLimits.plan.storage * 1024 * 1024 * 1024)) * 100)}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default UsageDisplay;