'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Eye, Syringe, Calendar, X } from 'lucide-react';
import { getPatientMedicalRecords, getPatientPrescriptions, getPatientVaccinations } from '@/lib/firebase/firestore';
import { MedicalReport, Prescription, Vaccination, PrescriptionMedication } from '@/lib/api';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';

// TypeScript Interfaces
interface Report {
  id: number;
  title: string;
  doctor: string;
  date: string;
  type: string;
  category: string;
}

interface PrescriptionData {
  id: string;
  patientId: string;
  doctorId: string;
  prescriptionDate: string;
  diagnosis: string;
  doctorName: string;
  medications: PrescriptionMedication[];
  notes: string;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
  updatedAt: string;
}

interface VaccinationData {
  id: string;
  patientId: string;
  vaccineName: string;
  vaccineType: string;
  vaccinationDate: string;
  batchNumber?: string;
  administeredBy?: string;
  nextDueDate: string;
  status: 'completed' | 'pending' | 'overdue';
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  const router = useRouter();
  const { isAuthenticated } = usePatientAuth();
  
  const [activeTab, setActiveTab] = useState<'reports' | 'prescriptions' | 'vaccinations'>('reports');
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewDialogData, setViewDialogData] = useState<ViewDialogData | null>(null);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/Auth-patientLogin');
    }
  }, [isAuthenticated, router]);

  // Load medical records on component mount
  useEffect(() => {
    const loadMedicalRecords = async () => {
      if (isAuthenticated) {
        try {
          setIsLoading(true);
          setError('');
          
          // Load all medical records in parallel
          const [reportsResponse, prescriptionsResponse, vaccinationsResponse] = await Promise.all([
            getPatientMedicalRecords(),
            getPatientPrescriptions(),
            getPatientVaccinations()
          ]);

          if (reportsResponse.success && reportsResponse.data) {
            setReports(reportsResponse.data as unknown as MedicalReport[]);
          }

          if (prescriptionsResponse.success && prescriptionsResponse.data) {
            setPrescriptions(prescriptionsResponse.data as unknown as PrescriptionData[]);
          }

          if (vaccinationsResponse.success && vaccinationsResponse.data) {
            setVaccinations(vaccinationsResponse.data as unknown as VaccinationData[]);
          }
        } catch (error: unknown) {
          setError(error instanceof Error ? error.message : 'Failed to load medical records');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadMedicalRecords();
  }, [isAuthenticated]);


  const tabs = [
    { id: 'reports' as const, label: 'Reports' },
    { id: 'prescriptions' as const, label: 'Prescriptions' },
    { id: 'vaccinations' as const, label: 'Vaccinations' }
  ];

  const handleViewReport = (report: MedicalReport) => {
    setViewDialogData({
      title: report.title,
      doctor: report.doctorName,
      date: new Date(report.reportDate).toLocaleDateString(),
      type: 'report',
      content: {
        findings: report.findings || 'No specific findings recorded.',
        recommendations: report.recommendations || 'Follow up as needed.'
      }
    });
    setShowViewDialog(true);
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setViewDialogData({
      title: 'Prescription Details',
      doctor: prescription.doctorName,
      date: new Date(prescription.prescriptionDate).toLocaleDateString(),
      type: 'prescription',
      content: {
        medications: prescription.medications.map(med => `${med.name} ${med.dosage} - ${med.instructions || ''}`),
        instructions: prescription.notes || 'Take medications as prescribed. Complete the full course.'
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading medical records...</p>
          </div>
        )}

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
        {!isLoading && (
          <div>
            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">No medical reports found.</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center">
                          <FileText className="w-7 h-7 text-teal-600" />
                        </div>
                        <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {report.reportType}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2">{report.title}</h3>
                      <p className="text-gray-500 mb-1">{report.doctorName}</p>
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(report.reportDate).toLocaleDateString()}</span>
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
                  ))
                )}
              </div>
            )}

            {/* Prescriptions Tab */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-4">
                {prescriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No prescriptions found.</p>
                  </div>
                ) : (
                  prescriptions.map((prescription) => (
                    <div key={prescription.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{prescription.doctorName}</h3>
                          <p className="text-gray-500">{new Date(prescription.prescriptionDate).toLocaleDateString()}</p>
                        </div>
                        <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {prescription.status}
                        </span>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-bold text-gray-900 mb-2">Medications:</h4>
                        <ul className="space-y-1">
                          {prescription.medications.map((med, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                              <span className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-2"></span>
                              <span>{med.name} {med.dosage}</span>
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
                  ))
                )}
              </div>
            )}

            {/* Vaccinations Tab */}
            {activeTab === 'vaccinations' && (
              <div className="space-y-4">
                {vaccinations.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No vaccination records found.</p>
                  </div>
                ) : (
                  vaccinations.map((vaccination) => (
                    <div key={vaccination.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center">
                            <Syringe className="w-6 h-6 text-teal-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{vaccination.vaccineName}</h3>
                            <p className="text-gray-500 text-sm mb-1">Administered: {new Date(vaccination.vaccinationDate).toLocaleDateString()}</p>
                            <p className="text-gray-500 text-sm">Next Due: {vaccination.nextDueDate ? new Date(vaccination.nextDueDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm font-medium">
                          {vaccination.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
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
