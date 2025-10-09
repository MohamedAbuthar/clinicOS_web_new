import React from 'react';

interface MedicalInfoProps {
  bloodGroup: string;
  height: number;
  weight: number;
  bmi: number;
  allergies: string;
  chronicConditions: string;
}

export const MedicalInfoSection: React.FC<MedicalInfoProps> = ({
  bloodGroup,
  height,
  weight,
  bmi,
  allergies,
  chronicConditions
}) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Medical Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-900 font-medium mb-2">
            Blood Group
          </label>
          <input
            type="text"
            value={bloodGroup}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
          />
        </div>
        <div>
          <label className="block text-gray-900 font-medium mb-2">
            Height (cm)
          </label>
          <input
            type="text"
            value={height}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
          />
        </div>
        <div>
          <label className="block text-gray-900 font-medium mb-2">
            Weight (kg)
          </label>
          <input
            type="text"
            value={weight}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
          />
        </div>
        <div>
          <label className="block text-gray-900 font-medium mb-2">BMI</label>
          <input
            type="text"
            value={bmi}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-400"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-gray-900 font-medium mb-2">
            Known Allergies
          </label>
          <input
            type="text"
            value={allergies}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
          />
        </div>
        <div>
          <label className="block text-gray-900 font-medium mb-2">
            Chronic Conditions
          </label>
          <input
            type="text"
            value={chronicConditions}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
          />
        </div>
      </div>
    </div>
  );
};