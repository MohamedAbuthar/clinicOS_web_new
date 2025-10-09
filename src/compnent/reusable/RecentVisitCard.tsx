import React from 'react';

export interface RecentVisit {
  id: number | string;
  doctor: string;
  reason: string;
  date: string;
}

interface RecentVisitCardProps {
  visit: RecentVisit;
  onViewReport: (visit: RecentVisit) => void;
}

export const RecentVisitCard: React.FC<RecentVisitCardProps> = ({ 
  visit, 
  onViewReport 
}) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-teal-200 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {visit.doctor}
          </h3>
          <p className="text-gray-600">{visit.reason}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 whitespace-nowrap">{visit.date}</span>
          <button
            onClick={() => onViewReport(visit)}
            className="text-teal-500 font-medium hover:text-teal-600 transition-colors whitespace-nowrap"
          >
            View Report
          </button>
        </div>
      </div>
    </div>
  );
};