import React from 'react';
import { Eye } from 'lucide-react';
import { Doctor } from './types';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';

export interface QueueTableProps {
  doctors: Doctor[];
  onViewQueue?: (doctor: Doctor) => void;
}

export const QueueTable: React.FC<QueueTableProps> = ({ doctors, onViewQueue }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Live Queue Status</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time doctor availability and queue metrics</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Token
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Queue Length
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Est. Last Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {doctors.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                    <div className="text-sm text-gray-500">{doctor.specialty}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xl font-semibold text-cyan-600">
                    {doctor.currentToken || '–'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{doctor.queueLength}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{doctor.estimatedLastPatient || '–'}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={doctor.status} />
                </td>
                <td className="px-6 py-4">
                  <Button 
                    icon={<Eye className="w-4 h-4" />}
                    onClick={() => onViewQueue?.(doctor)}
                  >
                    View Queue
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};