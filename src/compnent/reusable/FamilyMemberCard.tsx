import React from 'react';
import { Users } from 'lucide-react';
import { FamilyMember } from './types';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onViewProfile: (memberId: number) => void;
}

export const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  onViewProfile
}) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-teal-200 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {member.name}
          </h3>
          <p className="text-gray-600">
            {member.relationship} • {member.age} years
          </p>
        </div>
      </div>
      <button
        onClick={() => onViewProfile(member.id)}
        className="text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
      >
        View Profile
      </button>
    </div>
  );
};
