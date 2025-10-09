import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

interface ContactInfoProps {
  phone: string;
  email: string;
  address: string;
}

export const ContactInfoSection: React.FC<ContactInfoProps> = ({
  phone,
  email,
  address
}) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Contact Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-900 font-medium mb-2">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={phone}
              readOnly
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-900 font-medium mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={email}
              readOnly
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-gray-900 font-medium mb-2">
          Address
        </label>
        <div className="relative">
          <div className="absolute top-3 left-0 pl-4 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={address}
            readOnly
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
          />
        </div>
      </div>
    </div>
  );
};