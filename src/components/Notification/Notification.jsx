// src/components/Notification/Notification.jsx (ENHANCED)
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, ArrowUpRight, AlertCircle } from 'lucide-react';

const Notification = ({ notification, onClose }) => {
  const { 
    type, 
    title, 
    message, 
    autoClose = true, 
    duration = 5000,
    action,
    currentUsage,
    limit,
    upgradeRequired 
  } = notification;

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'limit_exceeded':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'limit_exceeded':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const handleAction = () => {
    if (action?.onClick) {
      action.onClick();
    }
    if (action?.closeOnClick !== false) {
      onClose();
    }
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${getStyles()} shadow-lg animate-in slide-in-from-right-full duration-300 max-w-sm`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-semibold text-sm mb-1">{title}</div>
        )}
        <div className="text-sm opacity-90 mb-2">{message}</div>
        
        {/* Usage Progress Bar for Limit Notifications */}
        {(currentUsage !== undefined && limit !== undefined) && (
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Used: {currentUsage}/{limit}</span>
              <span>{Math.round((currentUsage / limit) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  type === 'limit_exceeded' ? 'bg-red-500' : 
                  type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ 
                  width: `${Math.min(100, (currentUsage / limit) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {action && (
          <button
            onClick={handleAction}
            className={`text-xs font-medium px-3 py-1 rounded transition-colors ${
              type === 'limit_exceeded' || upgradeRequired
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {action.label}
            {action.external && <ArrowUpRight className="h-3 w-3 ml-1 inline" />}
          </button>
        )}

        {/* Upgrade Prompt */}
        {upgradeRequired && (
          <div className="mt-2 text-xs">
            <span className="opacity-75">Upgrade your plan for higher limits</span>
          </div>
        )}
      </div>
      <button 
        onClick={onClose}
        className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Notification;