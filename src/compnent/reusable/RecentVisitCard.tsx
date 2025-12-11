import React from 'react';
import { Calendar, Clock, Loader2, FileText, User } from 'lucide-react';

export interface RecentVisit {
  id: number | string;
  doctor: string;
  specialty?: string;
  reason: string;
  date: string;
  time?: string;
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
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-teal-200 transition-colors bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-full flex-shrink-0">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {visit.doctor?.startsWith('Dr.') ? visit.doctor : `Dr. ${visit.doctor}`}
            </h3>
            <p className="text-gray-600 mb-2 font-medium">{visit.specialty || 'General'}</p>
            <p className="text-sm text-gray-500 mb-3 line-clamp-1">
              Reason: {visit.reason}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{visit.date}</span>
              </div>
              {visit.time && (
                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{visit.time}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
          <button
            onClick={() => onViewReport(visit)}
            className="flex items-center gap-2 text-teal-600 font-medium hover:text-teal-700 hover:bg-teal-50 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            View Report
          </button>
        </div>
      </div>
    </div>
  );
};