import React from 'react';

export interface DoctorPerformanceCardProps {
  doctorName: string;
  patientsServed: number;
  avgConsultTime: string;
  onTimeRate: string;
}

const DoctorPerformanceCard: React.FC<DoctorPerformanceCardProps> = ({
  doctorName,
  patientsServed,
  avgConsultTime,
  onTimeRate,
}) => {
  const onTimeRateValue = parseFloat(onTimeRate);
  const rateColor = onTimeRateValue >= 90 ? 'text-green-600' : 'text-yellow-600';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <h3 className="text-xl font-bold text-gray-900 mb-1">{doctorName}</h3>
      <p className="text-sm text-gray-600 mb-6">Weekly Performance</p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Patients Served</span>
          <span className="text-lg font-semibold text-gray-900">{patientsServed}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Avg Consult Time</span>
          <span className="text-lg font-semibold text-gray-900">{avgConsultTime}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">On-Time Rate</span>
          <span className={`text-lg font-semibold ${rateColor}`}>{onTimeRate}</span>
        </div>
      </div>
    </div>
  );
};

export default DoctorPerformanceCard;