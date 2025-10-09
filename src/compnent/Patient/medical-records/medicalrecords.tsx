'use client';

import React, { useState } from 'react';
import { FileText, Download, Eye, Syringe, Calendar, X } from 'lucide-react';

// TypeScript Interfaces
interface Report {
  id: number;
  title: string;
  doctor: string;
  date: string;
  type: string;
  category: string;
}

interface Prescription {
  id: number;
  doctor: string;
  date: string;
  medications: string[];
  daysRemaining: number;
}

interface Vaccination {
  id: number;
  name: string;
  administered: string;
  nextDue: string;
  status: string;
}

interface ReportContent {
  findings: string;
  recommendations: string;
}

interface PrescriptionContent {
  medications: string[];
  instructions: string;
}

interface ViewDialogData {
  title: string;
  doctor: string;
  date: string;
  content: ReportContent | PrescriptionContent;
  type: 'report' | 'prescription';
}

export default function MedicalRecordsPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'prescriptions' | 'vaccinations'>('reports');
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewDialogData, setViewDialogData] = useState<ViewDialogData | null>(null);

  const reports: Report[] = [
    {
      id: 1,
      title: 'Blood Test Report',
      doctor: 'Dr. Priya Sharma',
      date: '9/28/2025',
      type: 'Lab Report',
      category: 'lab'
    },
    {
      id: 2,
      title: 'X-Ray Chest',
      doctor: 'Dr. Siva Raman',
      date: '9/15/2025',
      type: 'Imaging',
      category: 'imaging'
    },
    {
      id: 3,
      title: 'ECG Report',
      doctor: 'Dr. Rajesh Kumar',
      date: '8/22/2025',
      type: 'Cardiac',
      category: 'cardiac'
    }
  ];

  const prescriptions: Prescription[] = [
    {
      id: 1,
      doctor: 'Dr. Priya Sharma',
      date: '9/28/2025',
      medications: ['Paracetamol 500mg', 'Vitamin D3'],
      daysRemaining: 7
    },
    {
      id: 2,
      doctor: 'Dr. Siva Raman',
      date: '9/15/2025',
      medications: ['Antibiotic Cream', 'Moisturizer'],
      daysRemaining: 14
    }
  ];

  const vaccinations: Vaccination[] = [
    {
      id: 1,
      name: 'COVID-19 Booster',
      administered: '3/15/2025',
      nextDue: '3/15/2026',
      status: 'Completed'
    },
    {
      id: 2,
      name: 'Tetanus Toxoid',
      administered: '1/10/2024',
      nextDue: '1/10/2034',
      status: 'Completed'
    }
  ];

  const tabs = [
    { id: 'reports' as const, label: 'Reports' },
    { id: 'prescriptions' as const, label: 'Prescriptions' },
    { id: 'vaccinations' as const, label: 'Vaccinations' }
  ];

  const handleViewReport = (report: Report) => {
    setViewDialogData({
      title: report.title,
      doctor: report.doctor,
      date: report.date,
      type: 'report',
      content: {
        findings: 'All parameters are within normal range. No abnormalities detected.',
        recommendations: 'Continue with regular health checkups. Maintain a balanced diet and regular exercise.'
      }
    });
    setShowViewDialog(true);
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setViewDialogData({
      title: 'Prescription Details',
      doctor: prescription.doctor,
      date: prescription.date,
      type: 'prescription',
      content: {
        medications: prescription.medications,
        instructions: 'Take medications as prescribed. Complete the full course.'
      }
    });
    setShowViewDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Medical Records</h1>
          <p className="text-gray-500 text-lg">View your medical history and reports</p>
        </div>

        {/* Tabs */}
        <div className="bg-gray-100 rounded-2xl p-2 mb-6 inline-flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div>
          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center">
                      <FileText className="w-7 h-7 text-teal-600" />
                    </div>
                    <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {report.type}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{report.title}</h3>
                  <p className="text-gray-500 mb-1">{report.doctor}</p>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                    <Calendar className="w-4 h-4" />
                    <span>{report.date}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewReport(report)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button className="p-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{prescription.doctor}</h3>
                      <p className="text-gray-500">{prescription.date}</p>
                    </div>
                    <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {prescription.daysRemaining} days
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold text-gray-900 mb-2">Medications:</h4>
                    <ul className="space-y-1">
                      {prescription.medications.map((med, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                          <span className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-2"></span>
                          <span>{med}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewPrescription(prescription)}
                      className="flex items-center gap-2 px-6 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Full
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vaccinations Tab */}
          {activeTab === 'vaccinations' && (
            <div className="space-y-4">
              {vaccinations.map((vaccination) => (
                <div key={vaccination.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center">
                        <Syringe className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{vaccination.name}</h3>
                        <p className="text-gray-500 text-sm mb-1">Administered: {vaccination.administered}</p>
                        <p className="text-gray-500 text-sm">Next Due: {vaccination.nextDue}</p>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm font-medium">
                      {vaccination.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Dialog */}
      {showViewDialog && viewDialogData && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{viewDialogData.title}</h2>
              <button onClick={() => setShowViewDialog(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Doctor Information</h3>
                <p className="text-gray-700">Doctor: {viewDialogData.doctor}</p>
                <p className="text-gray-700">Date: {viewDialogData.date}</p>
              </div>

              {viewDialogData.type === 'report' ? (
                <>
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">Findings</h3>
                    <p className="text-gray-900">
                      {(viewDialogData.content as ReportContent).findings}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">Recommendations</h3>
                    <p className="text-gray-900">
                      {(viewDialogData.content as ReportContent).recommendations}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">Medications</h3>
                    <ul className="space-y-2">
                      {(viewDialogData.content as PrescriptionContent).medications.map((med, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-900">
                          <span className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-2"></span>
                          <span>{med}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">Instructions</h3>
                    <p className="text-gray-900">
                      {(viewDialogData.content as PrescriptionContent).instructions}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowViewDialog(false)}
                className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Close
              </button>
              <button className="flex-1 px-6 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600">
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
