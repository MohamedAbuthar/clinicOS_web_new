import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface DoctorOption {
  id: string;
  name: string;
}

interface AddOverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OverrideData) => void;
  showDoctorSelection?: boolean;
  doctors?: DoctorOption[];
  selectedDoctorId?: string;
  loading?: boolean;
}

interface OverrideData {
  title: string;
  date: string;
  session: 'morning' | 'evening' | 'both';
  type: 'special-event' | 'holiday' | 'extended-hours';
  description?: string;
  doctorId?: string;
}

const AddOverrideDialog: React.FC<AddOverrideDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  showDoctorSelection = false,
  doctors = [],
  selectedDoctorId = '',
  loading = false,
}) => {
  const [formData, setFormData] = useState<OverrideData>({
    title: '',
    date: '',
    session: 'both',
    type: 'special-event',
    description: '',
    doctorId: selectedDoctorId,
  });

  // Update doctorId when selectedDoctorId prop changes or dialog opens
  useEffect(() => {
    if (isOpen && selectedDoctorId) {
      setFormData(prev => ({ ...prev, doctorId: selectedDoctorId }));
    }
  }, [selectedDoctorId, isOpen]);

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    // Don't close here, wait for parent to close on success
    // onClose(); 
  };

  const handleClose = () => {
    setFormData({
      title: '',
      date: '',
      session: 'both',
      type: 'special-event',
      description: '',
      doctorId: selectedDoctorId,
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
          {/* Doctor Selection - Only for Admin */}
          {showDoctorSelection && doctors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Doctor *
              </label>
              <div className="relative">
                <select
                  value={formData.doctorId || ''}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

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
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Select Session */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Session *
            </label>
            <select
              value={formData.session}
              onChange={(e) => setFormData({ ...formData, session: e.target.value as 'morning' | 'evening' | 'both' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="both">Both</option>
              <option value="morning">Morning Session</option>
              <option value="evening">Evening Session</option>
            </select>
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
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Holidays'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOverrideDialog;
