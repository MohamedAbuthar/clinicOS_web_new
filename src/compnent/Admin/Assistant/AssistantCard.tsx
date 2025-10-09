import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export interface AssistantCardProps {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive';
  assignedDoctors: string[];
  initials: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const AssistantCard: React.FC<AssistantCardProps> = ({
  id,
  name,
  email,
  phone,
  role,
  status,
  assignedDoctors,
  initials,
  onEdit,
  onDelete,
}) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const getRoleBadgeColor = (roleType: string): string => {
    const colors: Record<string, string> = {
      'Front Desk': 'bg-teal-500',
      'Queue Manager': 'bg-purple-500',
      'Admin': 'bg-blue-500',
    };
    return colors[roleType] || 'bg-gray-500';
  };

  const getStatusBadgeColor = (statusType: string): string => {
    return statusType === 'active' ? 'bg-green-500' : 'bg-gray-400';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
            {initials}
          </div>

          {/* Info Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
              <span
                className={`${getRoleBadgeColor(role)} text-white text-xs px-2 py-1 rounded`}
              >
                {role}
              </span>
              <span
                className={`${getStatusBadgeColor(status)} text-white text-xs px-2 py-1 rounded capitalize`}
              >
                {status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {email}
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {phone}
              </span>
            </div>

            {assignedDoctors.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Assigned Doctors:</p>
                <div className="flex flex-wrap gap-2">
                  {assignedDoctors.map((doctor, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full"
                    >
                      {doctor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleEdit}
            className="flex items-center gap-1 text-gray-600 hover:text-teal-600 transition-colors px-3 py-1.5 rounded hover:bg-gray-50"
            aria-label="Edit assistant"
          >
            <Pencil className="w-4 h-4" />
            <span className="text-sm">Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 transition-colors p-1.5 rounded hover:bg-red-50"
            aria-label="Delete assistant"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantCard;