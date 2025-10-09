import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ReportStatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative';
  icon: LucideIcon;
  iconBgColor: string;
}

const ReportStatCard: React.FC<ReportStatCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconBgColor,
}) => {
  const changeColor = changeType === 'positive' ? 'text-green-600' : 'text-red-600';
  const changeSymbol = changeType === 'positive' ? '↑' : '↑';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          <p className={`text-sm font-medium ${changeColor} flex items-center gap-1`}>
            <span>{changeSymbol}</span>
            <span>{change}</span>
          </p>
        </div>
        <div className={`${iconBgColor} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 text-teal-600" />
        </div>
      </div>
    </div>
  );
};

export default ReportStatCard;