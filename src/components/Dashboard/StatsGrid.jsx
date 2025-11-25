import React from 'react';
import { motion } from "framer-motion";
import { FileText, Zap, Download, FileCheck } from "lucide-react";

const StatsGrid = ({ stats, planLimits, getUsagePercentage }) => {
  const statCards = [
    {
      label: "Total Files",
      value: stats.totalFiles,
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
      description: "Files processed",
    },
    {
      label: "Conversions",
      value: `${stats.conversions} / ${
        planLimits.conversions === 99999 ? "Unlimited" : planLimits.conversions
      }`,
      usage: getUsagePercentage(stats.conversions, planLimits.conversions),
      icon: Zap,
      color: "from-purple-500 to-pink-500",
      description: "PDF conversions used",
    },
    {
      label: "Compressions",
      value: `${stats.compressions} / ${
        planLimits.compressions === 99999
          ? "Unlimited"
          : planLimits.compressions
      }`,
      usage: getUsagePercentage(stats.compressions, planLimits.compressions),
      icon: Download,
      color: "from-green-500 to-emerald-500",
      description: "Files compressed",
    },
    {
      label: "Signatures",
      value: `${stats.signatures} / ${
        planLimits.signatures === 99999 ? "Unlimited" : planLimits.signatures
      }`,
      usage: getUsagePercentage(stats.signatures, planLimits.signatures),
      icon: FileCheck,
      color: "from-orange-500 to-red-500",
      description: "Digital signatures",
    },
  ];

  return (
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
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>

            {stat.usage !== undefined && stat.usage > 0 && (
              <div className="space-y-2">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stat.usage > 90
                        ? "bg-red-500"
                        : stat.usage > 75
                        ? "bg-orange-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${stat.usage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-right">
                  {stat.usage > 90
                    ? "Almost full"
                    : stat.usage > 75
                    ? "Getting full"
                    : "Good capacity"}
                </p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatsGrid;