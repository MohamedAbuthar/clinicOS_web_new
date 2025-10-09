import React from 'react';

// Expanded status types to support both dashboard and queue management
export type StatusType = 
  | 'Active' 
  | 'Break' 
  | 'Arrived' 
  | 'Late' 
  | 'Walk-in';

export interface StatusBadgeProps {
  status: StatusType | string; // Allow string for flexibility
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  // Style mappings for all status types
  const styles: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Break: 'bg-orange-100 text-orange-700',
    Arrived: 'bg-green-100 text-green-700',
    Late: 'bg-yellow-100 text-yellow-700',
    'Walk-in': 'bg-cyan-100 text-cyan-700'
  };

  // Default style if status not found
  const defaultStyle = 'bg-gray-100 text-gray-700';

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || defaultStyle}`}>
      {status}
    </span>
  );
};