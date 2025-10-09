import React from 'react';

export interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    label: string;
  };
  iconBgColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend,
  iconBgColor = 'bg-blue-50'
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-semibold text-gray-900">{value}</h3>
          {trend && (
            <p className="text-sm text-green-600 mt-2">
              ↑ {trend.value} {trend.label}
            </p>
          )}
        </div>
        <div className={`${iconBgColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};