'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ProfileHeader,
  PersonalInfoSection,
  ContactInfoSection,
  MedicalInfoSection,
  FamilyMemberCard,
  AddMemberDialog,
  PatientProfile,
  FamilyMember,
  NewMemberForm
} from '@/compnent/reusable';

export default function PatientProfilePage() {
  const router = useRouter();

  const [profile] = useState<PatientProfile>({
    fullName: 'Ramesh Kumar',
    patientId: 'PT-2024-00142',
    dateOfBirth: '15-06-1985',
    gender: 'Male',
    age: 38,
    phone: '+91 98765 43210',
    email: 'ramesh.kumar@email.com',
    address: '123, Anna Nagar, Chennai - 600040',
    bloodGroup: 'O+',
    height: 175,
    weight: 72,
    bmi: 23.5,
    allergies: 'Penicillin, Peanuts',
    chronicConditions: 'None'
  });

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { id: 1, name: 'Lakshmi Ramesh', relationship: 'Spouse', age: 35 },
    { id: 2, name: 'Arun Ramesh', relationship: 'Son', age: 8 },
    { id: 3, name: 'Priya Ramesh', relationship: 'Daughter', age: 5 }
  ]);

  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [newMember, setNewMember] = useState<NewMemberForm>({
    name: '',
    relationship: '',
    age: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: ''
  });

  const handleEditProfile = () => {
    console.log('Edit profile clicked');
    // router.push('/Patient/profile/edit');
  };

  const handleChangePassword = () => {
    console.log('Change password clicked');
    // router.push('/Patient/change-password');
  };

  const handleAddMember = () => {
    setShowAddMemberDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddMemberDialog(false);
    setNewMember({
      name: '',
      relationship: '',
      age: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: ''
    });
  };

  const handleSaveMember = () => {
    const member: FamilyMember = {
      id: familyMembers.length + 1,
      name: newMember.name,
      relationship: newMember.relationship,
      age: parseInt(newMember.age)
    };
    setFamilyMembers([...familyMembers, member]);
    handleCloseDialog();
  };

  const handleFormChange = (field: keyof NewMemberForm, value: string) => {
    setNewMember({ ...newMember, [field]: value });
  };

  const handleViewMemberProfile = (memberId: number) => {
    console.log('View member profile:', memberId);
    // router.push(`/Patient/family/${memberId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSaveChanges = () => {
    console.log('Save changes clicked');
    // Add API call here to save profile changes
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600">Manage your personal information</p>
        </div>

        {/* Profile Header Section */}
        <ProfileHeader
          fullName={profile.fullName}
          patientId={profile.patientId}
          onEditProfile={handleEditProfile}
          onChangePassword={handleChangePassword}
        />

        {/* Personal Information Section */}
        <PersonalInfoSection
          fullName={profile.fullName}
          dateOfBirth={profile.dateOfBirth}
          gender={profile.gender}
          age={profile.age}
        />

        {/* Contact Information Section */}
        <ContactInfoSection
          phone={profile.phone}
          email={profile.email}
          address={profile.address}
        />

        {/* Medical Information Section */}
        <MedicalInfoSection
          bloodGroup={profile.bloodGroup}
          height={profile.height}
          weight={profile.weight}
          bmi={profile.bmi}
          allergies={profile.allergies}
          chronicConditions={profile.chronicConditions}
        />

        {/* Family Members Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Family Members</h2>
            <button
              onClick={handleAddMember}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Add Member
            </button>
          </div>
          <div className="space-y-4">
            {familyMembers.map((member) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                onViewProfile={handleViewMemberProfile}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleCancel}
            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Add Member Dialog */}
      <AddMemberDialog
        isOpen={showAddMemberDialog}
        formData={newMember}
        onClose={handleCloseDialog}
        onSave={handleSaveMember}
        onChange={handleFormChange}
      />
    </div>
  );
}