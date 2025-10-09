import PatientRootLayout from "@/compnent/Patient/layout/rootlayout";
import MedicalRecordsPage from "@/compnent/Patient/medical-records/medicalrecords";

export default function MyAppoinment() {
  return (
    <PatientRootLayout>
      <MedicalRecordsPage />
    </PatientRootLayout>
  )
}