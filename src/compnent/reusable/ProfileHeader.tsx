import React from 'react';

interface ProfileHeaderProps {
  fullName: string;
  patientId: string;
  onEditProfile: () => void;
  onChangePassword: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  fullName,
  patientId,
  onEditProfile,
  onChangePassword
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <span className="text-3xl font-bold text-gray-600">
            {getInitials(fullName)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {fullName}
          </h2>
          <p className="text-gray-600 mb-4">Patient ID: {patientId}</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onEditProfile}
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Edit Profile
            </button>
            <button
              onClick={onChangePassword}
              className="border border-teal-500 text-teal-500 hover:bg-teal-50 px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};