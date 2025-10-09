import AppointmentsPage from "@/compnent/Admin/appoinment/appoinment";
import PatientRootLayout from "@/compnent/Patient/layout/rootlayout";

export default function MyAppoinment() {
  return (
    <PatientRootLayout>
      <AppointmentsPage />
    </PatientRootLayout>
  )
}