import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

interface AddOverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OverrideData) => void;
}

interface OverrideData {
  title: string;
  date: string;
  timeRange: string;
  type: 'special-event' | 'holiday' | 'extended-hours';
  description?: string;
}

const AddOverrideDialog: React.FC<AddOverrideDialogProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<OverrideData>({
    title: '',
    date: '',
    timeRange: '',
    type: 'special-event',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      title: '',
      date: '',
      timeRange: '',
      type: 'special-event',
      description: '',
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      date: '',
      timeRange: '',
      type: 'special-event',
      description: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur Background */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Schedule Holidays</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., Extended Hours, Personal Leave"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="time"
                  value={formData.timeRange.split(' - ')[0] || ''}
                  onChange={(e) => {
                    const endTime = formData.timeRange.split(' - ')[1] || '';
                    setFormData({ ...formData, timeRange: `${e.target.value} - ${endTime}` });
                  }}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                />
              </div>
              <span className="flex items-center text-gray-500">to</span>
              <div className="relative flex-1">
                <input
                  type="time"
                  value={formData.timeRange.split(' - ')[1] || ''}
                  onChange={(e) => {
                    const startTime = formData.timeRange.split(' - ')[0] || '';
                    setFormData({ ...formData, timeRange: `${startTime} - ${e.target.value}` });
                  }}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'special-event' | 'holiday' | 'extended-hours' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="special-event">Special Event</option>
              <option value="holiday">Holiday</option>
              <option value="extended-hours">Extended Hours</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              placeholder="Optional description..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-medium"
            >
              Add Holidays
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOverrideDialog;
