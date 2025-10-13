import { Suspense } from "react";
import RegisterForm from "@/compnent/Patient/registerform/register";

export default function PatientRegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}