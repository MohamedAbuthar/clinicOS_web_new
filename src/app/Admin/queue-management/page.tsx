import AdminLayout from "@/compnent/layout/AdminLayout";
import QueueManagementPage from "@/compnent/Admin/queue-management/queue-management";

export default function QueueManagement() {
  return (
    <AdminLayout>
      <QueueManagementPage />
    </AdminLayout>
  )
}