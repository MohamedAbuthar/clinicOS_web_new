import React from 'react';
import { Clock, X, GripVertical } from 'lucide-react';
import { Patient } from './types';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';

export interface QueueItemProps {
  patient: Patient;
  index: number;
  onSkip: () => void;
  isSelected?: boolean;
}

export const QueueItem: React.FC<QueueItemProps> = ({ 
  patient, 
  index, 
  onSkip, 
  isSelected = false 
}) => {
  return (
    <div 
      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
        isSelected 
          ? 'border-teal-500 bg-teal-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <button className="text-gray-400 hover:text-gray-600 cursor-grab">
        <GripVertical className="w-5 h-5" />
      </button>
      
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-600">{index}</span>
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-lg font-semibold text-teal-600">{patient.tokenNumber}</span>
          <span className="text-sm font-medium text-gray-900">{patient.name}</span>
          {patient.category && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {patient.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Waiting: {patient.waitingTime}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={patient.status} />
        <Button 
          variant="secondary" 
          onClick={onSkip}
          icon={<X className="w-3 h-3" />}
        >
          Skip
        </Button>
      </div>
    </div>
  );
};