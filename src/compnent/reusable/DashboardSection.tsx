import React, { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({ 
  title, 
  action, 
  children 
}) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {action && action}
      </div>
      {children}
    </div>
  );
};