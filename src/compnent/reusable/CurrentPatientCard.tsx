import React from 'react';
import { CheckCircle } from 'lucide-react';
import { CurrentPatient } from './types';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';

export interface CurrentPatientCardProps {
  patient: CurrentPatient;
  onComplete: () => void;
}

export const CurrentPatientCard: React.FC<CurrentPatientCardProps> = ({ 
  patient, 
  onComplete 
}) => {
  return (
    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-teal-100 mb-2">CURRENT PATIENT</p>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold">{patient.tokenNumber}</span>
            <div>
              <p className="text-xl font-semibold">{patient.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={patient.status} />
                <span className="text-xs text-teal-100">In Consultation</span>
              </div>
            </div>
          </div>
        </div>
        <Button 
          variant="primary" 
          onClick={onComplete}
          icon={<CheckCircle className="w-4 h-4" />}
        >
          Complete
        </Button>
      </div>
    </div>
  );
};
