import React from 'react';
import { Clock, Edit } from 'lucide-react';

export interface ScheduleRowProps {
  day: string;
  timeRange?: string;
  slotDuration?: string;
  status: 'active' | 'off';
  onEdit?: (day: string) => void;
}

const ScheduleRow: React.FC<ScheduleRowProps> = ({
  day,
  timeRange,
  slotDuration,
  status,
  onEdit,
}) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(day);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-base font-medium text-gray-900 min-w-[100px]">
            {day}
          </span>

          {status === 'active' ? (
            <>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{timeRange}</span>
              </div>

              <span className="bg-teal-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                {slotDuration}
              </span>

              <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                Active
              </span>
            </>
          ) : (
            <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
              Off Day
            </span>
          )}
        </div>

        <button
          onClick={handleEdit}
          className="flex items-center gap-1 text-gray-600 hover:text-teal-600 transition-colors px-3 py-1.5 rounded hover:bg-gray-50"
          aria-label={`Edit ${day} schedule`}
        >
          <Edit className="w-4 h-4" />
          <span className="text-sm">Edit</span>
        </button>
      </div>
    </div>
  );
};

export default ScheduleRow;