import PatientRootLayout from "@/compnent/Patient/layout/rootlayout";
import PatientProfileWithEdit from "@/compnent/Patient/patient-Profile/profile-with-edit";

export default function Profile() {
  return(
  <PatientRootLayout>
    <PatientProfileWithEdit />
  </PatientRootLayout>
  )         
}