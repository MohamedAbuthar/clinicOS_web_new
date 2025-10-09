'use client';

import React from 'react';
import { Calendar, Users, Stethoscope, UserX } from 'lucide-react';
import { 
  StatCard, 
  QueueTable, 
  AlertItem,
  Doctor,
  Alert 
} from '../../reusable';

export default function DashboardPage() {
  const doctors: Doctor[] = [
    {
      id: '1',
      name: 'Dr. Priya Sharma',
      specialty: 'General Medicine',
      currentToken: '#12',
      queueLength: 8,
      estimatedLastPatient: '2:30 PM',
      status: 'Active'
    },
    {
      id: '2',
      name: 'Dr. Rajesh Kumar',
      specialty: 'Pediatrics',
      currentToken: '#5',
      queueLength: 15,
      estimatedLastPatient: '4:15 PM',
      status: 'Active'
    },
    {
      id: '3',
      name: 'Dr. Anita Desai',
      specialty: 'Cardiology',
      currentToken: null,
      queueLength: 0,
      estimatedLastPatient: null,
      status: 'Break'
    }
  ];

  const alerts: Alert[] = [
    {
      id: '1',
      message: "Dr. Anita Desai started break",
      timestamp: '5 minutes ago',
      type: 'warning'
    },
    {
      id: '2',
      message: "Walk-in patient added to Dr. Priya Sharma's queue",
      timestamp: '12 minutes ago',
      type: 'info'
    },
    {
      id: '3',
      message: "Dr. Rajesh Kumar marked as active",
      timestamp: '1 hour ago',
      type: 'success'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Quick overview of today clinic operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Appointments Today"
            value={42}
            icon={<Calendar className="w-6 h-6 text-blue-600" />}
            trend={{ value: "12%", label: "vs yesterday" }}
            iconBgColor="bg-blue-50"
          />
          <StatCard
            title="Patients Waiting"
            value={23}
            icon={<Users className="w-6 h-6 text-yellow-600" />}
            iconBgColor="bg-yellow-50"
          />
          <StatCard
            title="Doctors Active"
            value={3}
            icon={<Stethoscope className="w-6 h-6 text-green-600" />}
            iconBgColor="bg-green-50"
          />
          <StatCard
            title="No-shows / Skipped"
            value={2}
            icon={<UserX className="w-6 h-6 text-red-600" />}
            iconBgColor="bg-red-50"
          />
        </div>

        <div className="mb-8">
          <QueueTable doctors={doctors} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}