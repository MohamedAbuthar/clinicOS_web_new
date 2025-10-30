import React, { useState, useEffect } from 'react';
import { X, Clock, ToggleLeft, ToggleRight } from 'lucide-react';

interface EditScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ScheduleData) => void;
  initialData?: ScheduleData;
}

interface ScheduleData {
  day: string;
  timeRange?: string;
  slotDuration?: string;
  status: 'active' | 'off';
}

const EditScheduleDialog: React.FC<EditScheduleDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<ScheduleData>({
    day: '',
    timeRange: '',
    slotDuration: '',
    status: 'active',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleClose = () => {
    onClose();
  };

  const toggleStatus = () => {
    setFormData({
      ...formData,
      status: formData.status === 'active' ? 'off' : 'active',
    });
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
          <h2 className="text-xl font-semibold text-gray-900">
            Edit {formData.day} Schedule
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Schedule Status</h3>
              <p className="text-xs text-gray-600">
                {formData.status === 'active' ? 'Schedule is active' : 'Schedule is off'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleStatus}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {formData.status === 'active' ? (
                <ToggleRight className="w-8 h-8 text-teal-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>

          {formData.status === 'active' && (
            <>
              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Range *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="time"
                      value={formData.timeRange?.split(' - ')[0] || ''}
                      onChange={(e) => {
                        const endTime = formData.timeRange?.split(' - ')[1] || '';
                        setFormData({ ...formData, timeRange: `${e.target.value} - ${endTime}` });
                      }}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                      required
                    />
                  </div>
                  <span className="flex items-center text-gray-500">to</span>
                  <div className="relative flex-1">
                    <input
                      type="time"
                      value={formData.timeRange?.split(' - ')[1] || ''}
                      onChange={(e) => {
                        const startTime = formData.timeRange?.split(' - ')[0] || '';
                        setFormData({ ...formData, timeRange: `${startTime} - ${e.target.value}` });
                      }}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Slot Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slot Duration *
                </label>
                <select
                  value={formData.slotDuration || ''}
                  onChange={(e) => setFormData({ ...formData, slotDuration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">Select duration</option>
                  <option value="5 min slots">5 min slots</option>
                  <option value="10 min slots">10 min slots</option>
                  <option value="15 min slots">15 min slots</option>
                  <option value="20 min slots">20 min slots</option>
                  <option value="30 min slots">30 min slots</option>
                  <option value="45 min slots">45 min slots</option>
                  <option value="60 min slots">60 min slots</option>
                </select>
              </div>
            </>
          )}

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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditScheduleDialog;
