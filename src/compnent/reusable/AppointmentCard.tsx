import React from 'react';
import { Calendar, Clock, User } from 'lucide-react';

export interface Appointment {
  id: number | string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  token: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onViewDetails: (appointment: Appointment) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onViewDetails
}) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-teal-200 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-teal-100 p-3 rounded-full flex-shrink-0">
            <User className="w-6 h-6 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {appointment.doctor?.startsWith('Dr.') ? appointment.doctor : `Dr. ${appointment.doctor}`}
            </h3>
            <p className="text-gray-600 mb-2 font-medium">{appointment.specialty}</p>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>{appointment.date}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>{appointment.time}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
          <div className="bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-lg flex flex-col items-end">
            <span className="text-xs text-teal-600 font-semibold uppercase tracking-wider">Token</span>
            <span className="text-xl font-bold text-teal-700 leading-none">#{appointment.token?.replace('#', '')}</span>
          </div>
          <button
            onClick={() => onViewDetails(appointment)}
            className="text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};