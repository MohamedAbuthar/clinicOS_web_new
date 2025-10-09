import React from 'react';
import { StatusBadge } from './StatusBadge';

export interface DoctorStatus {
  status: 'Active' | 'Break';
  avgConsultTime: string;
  patientsServed: number;
  estimatedComplete: string;
}

export interface DoctorStatusCardProps {
  doctorStatus: DoctorStatus;
}

export const DoctorStatusCard: React.FC<DoctorStatusCardProps> = ({ doctorStatus }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Doctor Status</h3>
        <StatusBadge status={doctorStatus.status} />
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Average Consult Time</p>
          <p className="text-2xl font-bold text-gray-900">{doctorStatus.avgConsultTime}</p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-1">Patients Served Today</p>
          <p className="text-2xl font-bold text-gray-900">{doctorStatus.patientsServed}</p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-1">Est. Queue Complete</p>
          <p className="text-lg font-semibold text-teal-600">{doctorStatus.estimatedComplete}</p>
        </div>
      </div>
    </div>
  );
};