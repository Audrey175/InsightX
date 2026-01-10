import React from 'react';
// FIXED: Use 'import type' for LucideIcon
import type { LucideIcon } from 'lucide-react'; 

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  trendUp: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp 
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
        </div>
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span 
          className={`text-sm font-medium ${
            trendUp ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trend}
        </span>
        <span className="text-sm text-gray-400 ml-2">vs last month</span>
      </div>
    </div>
  );
};

export default StatCard;