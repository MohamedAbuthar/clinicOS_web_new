'use client'

import DoctorDashboard from "@/compnent/Admin/doctor/doctor";
import AdminLayout from "@/compnent/layout/AdminLayout";

export default function Doctor() {
  return (
    <AdminLayout>
      <DoctorDashboard />
    </AdminLayout>
  )
}