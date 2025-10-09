import React from 'react';
import { Alert } from './types';

export interface AlertItemProps {
  alert: Alert;
}

export const AlertItem: React.FC<AlertItemProps> = ({ alert }) => {
  const typeColors = {
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200'
  };

  const dotColors = {
    warning: 'bg-yellow-400',
    info: 'bg-blue-400',
    success: 'bg-green-400'
  };

  return (
    <div className={`p-4 rounded-lg border ${typeColors[alert.type]}`}>
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 ${dotColors[alert.type]}`}></div>
        <div className="flex-1">
          <p className="text-sm text-gray-900">{alert.message}</p>
          <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
        </div>
      </div>
    </div>
  );
};