import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PatientStatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary';
}

export const PatientStatsCard: React.FC<PatientStatsCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'default' 
}) => {
  const bgColor = variant === 'primary' ? 'bg-teal-50 border-teal-100' : 'bg-white border-gray-200';
  
  return (
    <div className={`${bgColor} rounded-xl p-6 border`}>
      <div className="flex justify-between items-start mb-4">
        <div className="text-gray-600 text-sm">{title}</div>
        <div className="bg-teal-500 p-2 rounded-lg">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-gray-600">{subtitle}</div>
    </div>
  );
};