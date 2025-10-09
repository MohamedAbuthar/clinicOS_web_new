import React from 'react';

interface PersonalInfoProps {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  age: number;
}

export const PersonalInfoSection: React.FC<PersonalInfoProps> = ({
  fullName,
  dateOfBirth,
  gender,
  age
}) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Personal Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-900 font-medium mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
          />
        </div>
        <div>
          <label className="block text-gray-900 font-medium mb-2">
            Date of Birth
          </label>
          <input
            type="text"
            value={dateOfBirth}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
          />
        </div>
        <div>
          <label className="block text-gray-900 font-medium mb-2">
            Gender
          </label>
          <input
            type="text"
            value={gender}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
          />
        </div>
        <div>
          <label className="block text-gray-900 font-medium mb-2">Age</label>
          <input
            type="text"
            value={`${age} years`}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-400"
          />
        </div>
      </div>
    </div>
  );
};
