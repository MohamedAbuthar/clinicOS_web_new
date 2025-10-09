import React from 'react';

export interface ScheduleOverrideCardProps {
  id: string;
  title: string;
  date: string;
  timeRange?: string;
  type: 'special-event' | 'holiday' | 'extended-hours';
  onEdit?: (id: string) => void;
}

const ScheduleOverrideCard: React.FC<ScheduleOverrideCardProps> = ({
  id,
  title,
  date,
  timeRange,
  type,
  onEdit,
}) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(id);
    }
  };

  const getTypeBadge = () => {
    switch (type) {
      case 'special-event':
        return (
          <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
            Special Event
          </span>
        );
      case 'holiday':
        return (
          <span className="bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full font-medium">
            Holiday
          </span>
        );
      case 'extended-hours':
        return (
          <span className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full font-medium">
            Extended Hours
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {date}
            {timeRange && ` • ${timeRange}`}
          </p>
          {getTypeBadge()}
        </div>

        <button
          onClick={handleEdit}
          className="text-gray-600 hover:text-teal-600 transition-colors px-3 py-1.5 rounded hover:bg-gray-50 text-sm font-medium ml-4"
          aria-label={`Edit ${title}`}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default ScheduleOverrideCard;