import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Calendar, Activity, Stethoscope, UserPlus, ClipboardList, BarChart3, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/Admin/dashboard' },
    { icon: Calendar, label: 'Appointments', path: '/Admin/appoinment' },
    { icon: Activity, label: 'Queues', path: '/Admin/queue-management' },
    { icon: Stethoscope, label: 'Doctors', path: '/Admin/doctor' },
    { icon: UserPlus, label: 'Assistants', path: '/Admin/assistants' },
    { icon: ClipboardList, label: 'Schedule', path: '/Admin/schedule' },
    { icon: BarChart3, label: 'Reports', path: '/Admin/reports' },
    { icon: Settings, label: 'Settings', path: '/Admin/settings' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    // Add your logout logic here
    // For example: clearing tokens, redirecting to login, etc.
    console.log('Logout clicked');
    router.push('/login');
  };

  return (
    <div className="w-70 h-screen bg-white flex flex-col shadow-lg">
      {/* Header */}
      <div className="px-5 py-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center">
            <Activity className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ClinicOS</h1>
            <p className="text-gray-500 text-xs">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <li key={item.label}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-teal-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                  <span className="text-base font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 bg-teal-50 rounded-2xl p-3.5">
          <div className="w-11 h-11 bg-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-base">AD</span>
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 font-semibold text-sm">Admin User</h3>
            <p className="text-gray-500 text-xs">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-teal-100 rounded-lg transition-colors duration-200"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-600" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}