import React from 'react';
import { X, Clock, User, Phone, Calendar, MapPin } from 'lucide-react';
import { Doctor } from '../../reusable/types';

interface QueueDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
}

interface QueuePatient {
  id: string;
  tokenNumber: string;
  patientName: string;
  appointmentTime: string;
  phoneNumber: string;
  status: 'waiting' | 'in-progress' | 'completed';
  estimatedWaitTime?: string;
}

const QueueDetailsDialog: React.FC<QueueDetailsDialogProps> = ({
  isOpen,
  onClose,
  doctor,
}) => {
  if (!isOpen || !doctor) return null;

  // Mock queue data - in real app, this would come from API
  const queuePatients: QueuePatient[] = [
    {
      id: '1',
      tokenNumber: '#12',
      patientName: 'John Smith',
      appointmentTime: '2:00 PM',
      phoneNumber: '+1 234-567-8901',
      status: 'in-progress',
    },
    {
      id: '2',
      tokenNumber: '#13',
      patientName: 'Sarah Johnson',
      appointmentTime: '2:10 PM',
      phoneNumber: '+1 234-567-8902',
      status: 'waiting',
      estimatedWaitTime: '5 min',
    },
    {
      id: '3',
      tokenNumber: '#14',
      patientName: 'Mike Wilson',
      appointmentTime: '2:20 PM',
      phoneNumber: '+1 234-567-8903',
      status: 'waiting',
      estimatedWaitTime: '15 min',
    },
    {
      id: '4',
      tokenNumber: '#15',
      patientName: 'Emily Davis',
      appointmentTime: '2:30 PM',
      phoneNumber: '+1 234-567-8904',
      status: 'waiting',
      estimatedWaitTime: '25 min',
    },
    {
      id: '5',
      tokenNumber: '#16',
      patientName: 'Robert Brown',
      appointmentTime: '2:40 PM',
      phoneNumber: '+1 234-567-8905',
      status: 'waiting',
      estimatedWaitTime: '35 min',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-progress':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
            In Progress
          </span>
        );
      case 'waiting':
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
            Waiting
          </span>
        );
      case 'completed':
        return (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur Background */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Queue Details - {doctor.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{doctor.specialty}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Doctor Status Card */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                  <p className="text-sm text-gray-600">{doctor.specialty}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-600">
                  {doctor.currentToken || '–'}
                </div>
                <div className="text-sm text-gray-600">Current Token</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">{doctor.queueLength}</div>
                <div className="text-xs text-gray-600">Patients Waiting</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {doctor.estimatedLastPatient || '–'}
                </div>
                <div className="text-xs text-gray-600">Est. Last Patient</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{doctor.status}</div>
                <div className="text-xs text-gray-600">Status</div>
              </div>
            </div>
          </div>

          {/* Queue List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Queue</h3>
            <div className="space-y-3">
              {queuePatients.map((patient) => (
                <div
                  key={patient.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-cyan-600">
                          {patient.tokenNumber}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{patient.patientName}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {patient.appointmentTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {patient.phoneNumber}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {patient.estimatedWaitTime && (
                        <div className="text-sm text-gray-600">
                          Est. wait: {patient.estimatedWaitTime}
                        </div>
                      )}
                      {getStatusBadge(patient.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Close
            </button>
            <button
              className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-medium"
            >
              Manage Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueDetailsDialog;
