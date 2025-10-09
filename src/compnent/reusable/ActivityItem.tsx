import React from 'react';
import { Activity } from './types';

export interface ActivityItemProps {
  activity: Activity;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const dotColors = {
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    info: 'bg-blue-500'
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-2 ${dotColors[activity.type]}`}></div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{activity.message}</p>
        <p className="text-xs text-gray-500 mt-0.5">{activity.timestamp}</p>
      </div>
    </div>
  );
};
