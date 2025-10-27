'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, X, Edit2, User, Mail, Phone, MapPin, Calendar, Activity, Plus, Trash2, UserPlus } from 'lucide-react';
import { usePatientProfile } from '@/lib/hooks/usePatientProfile';
import { useFamilyMembers } from '@/lib/hooks/useFamilyMembers';
import { usePatientAuth } from '@/lib/contexts/PatientAuthContext';
import { Patient } from '@/lib/api';
import { toast } from 'sonner';

export default function PatientProfileWithEdit() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, patient } = usePatientAuth();
  const { profile, isLoading, error, isEditing, updateProfile, refreshProfile, setIsEditing } = usePatientProfile();
  const { familyMembers, isLoading: familyLoading, error: familyError, addMember, updateMember, deleteMember } = useFamilyMembers();
  
  // Form state
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Family member modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Patient | null>(null);
  const [memberFormData, setMemberFormData] = useState<Partial<Patient>>({});
  const [isSavingMember, setIsSavingMember] = useState(false);

  // Show errors from hooks as toast
  useEffect(() => {
    if (familyError) {
      toast.error(`❌ ${familyError}`);
    }
  }, [familyError]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/Auth-patientLogin');
    }
  }, [isAuthenticated, authLoading, router]);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        bloodGroup: profile.bloodGroup,
        height: profile.height,
        weight: profile.weight,
        allergies: profile.allergies,
        chronicConditions: profile.chronicConditions,
      });
    }
  }, [profile]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        bloodGroup: profile.bloodGroup,
        height: profile.height,
        weight: profile.weight,
        allergies: profile.allergies,
        chronicConditions: profile.chronicConditions,
      });
    }
  };

  const handleInputChange = (field: keyof Patient, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      // Validation
      if (!formData.name || formData.name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters');
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Invalid email format');
      }

      if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/[^\d]/g, ''))) {
        throw new Error('Phone number must be 10 digits');
      }

      if (formData.height && (formData.height < 50 || formData.height > 300)) {
        throw new Error('Height must be between 50 and 300 cm');
      }

      if (formData.weight && (formData.weight < 10 || formData.weight > 500)) {
        throw new Error('Weight must be between 10 and 500 kg');
      }

      // Filter out undefined values before updating
      const cleanFormData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      // Update profile
      await updateProfile(cleanFormData);
      toast.success('✅ Profile updated successfully!');
    } catch (err: any) {
      toast.error(`❌ ${err.message || 'Failed to update profile'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate BMI
  const calculateBMI = () => {
    if (formData.height && formData.weight) {
      const heightInMeters = formData.height / 100;
      const bmi = formData.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-500" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => refreshProfile()}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Family member handlers
  const handleAddMemberClick = () => {
    setMemberFormData({
      name: '',
      phone: '',
      email: '',
      dateOfBirth: '',
      gender: 'male',
      bloodGroup: '',
      height: undefined,
      weight: undefined,
      allergies: '',
      chronicConditions: '',
    });
    setShowAddMemberModal(true);
    setErrorMessage('');
  };

  const handleEditMemberClick = (member: Patient) => {
    setSelectedMember(member);
    setMemberFormData({
      name: member.name,
      phone: member.phone,
      email: member.email,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      bloodGroup: member.bloodGroup,
      height: member.height,
      weight: member.weight,
      allergies: member.allergies,
      chronicConditions: member.chronicConditions,
    });
    setShowEditMemberModal(true);
    setErrorMessage('');
  };

  const handleDeleteMemberClick = (member: Patient) => {
    setSelectedMember(member);
    setShowDeleteMemberModal(true);
  };

  const handleMemberInputChange = (field: keyof Patient, value: string | number) => {
    setMemberFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveMember = async () => {
    try {
      setIsSavingMember(true);

      console.log('💾 Starting to save family member...');
      console.log('   Patient ID:', patient?.id);
      console.log('   Patient FamilyId:', patient?.familyId);
      console.log('   Member Data:', { 
        name: memberFormData.name, 
        dateOfBirth: memberFormData.dateOfBirth,
        gender: memberFormData.gender 
      });

      // Validation
      if (!memberFormData.name || memberFormData.name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters');
      }

      if (!memberFormData.dateOfBirth) {
        throw new Error('Date of birth is required');
      }

      if (!memberFormData.gender) {
        throw new Error('Gender is required');
      }

      // Filter out undefined values before adding
      const cleanMemberData = Object.fromEntries(
        Object.entries(memberFormData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      console.log('✅ Validation passed, calling addMember...');
      await addMember(cleanMemberData);
      
      console.log('✅ Family member added, closing modal...');
      setShowAddMemberModal(false);
      toast.success('✅ Family member added successfully!');
      
      // Clear form data
      setMemberFormData({
        name: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        gender: 'male',
        bloodGroup: '',
        height: undefined,
        weight: undefined,
        allergies: '',
        chronicConditions: '',
      });
    } catch (err: any) {
      console.error('❌ Error saving family member:', err);
      toast.error(`❌ ${err.message || 'Failed to add family member'}`);
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    try {
      setIsSavingMember(true);

      // Validation
      if (!memberFormData.name || memberFormData.name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters');
      }

      // Filter out undefined values before updating
      const cleanMemberData = Object.fromEntries(
        Object.entries(memberFormData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      await updateMember(selectedMember.id, cleanMemberData);
      setShowEditMemberModal(false);
      setSelectedMember(null);
      toast.success('✅ Family member updated successfully!');
    } catch (err: any) {
      toast.error(`❌ ${err.message || 'Failed to update family member'}`);
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleConfirmDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      setIsSavingMember(true);

      await deleteMember(selectedMember.id);
      setShowDeleteMemberModal(false);
      setSelectedMember(null);
      toast.success('✅ Family member removed successfully!');
    } catch (err: any) {
      toast.error(`❌ ${err.message || 'Failed to remove family member'}`);
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleCloseMemberModal = () => {
    setShowAddMemberModal(false);
    setShowEditMemberModal(false);
    setShowDeleteMemberModal(false);
    setSelectedMember(null);
    setMemberFormData({});
  };


  const calculateMemberAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const bmi = calculateBMI();
  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                My Profile
              </h1>
              <p className="text-gray-600">Manage your personal and medical information</p>
            </div>
            {!isEditing && (
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>


        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          {/* Profile Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-gray-500">Patient ID: {profile.id}</p>
                {age && (
                  <p className="text-gray-500">{age} years old • {profile.gender}</p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-gray-900">{profile.name}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">
                    {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <p className="text-gray-900 capitalize">{profile.gender}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="10-digit phone number"
                  />
                ) : (
                  <p className="text-gray-900">{profile.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="your.email@example.com"
                  />
                ) : (
                  <p className="text-gray-900">{profile.email || 'Not provided'}</p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Address
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="Enter your address"
                  />
                ) : (
                  <p className="text-gray-900">{profile.address || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              <Activity className="h-5 w-5 inline mr-2" />
              Medical Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Blood Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Group
                </label>
                {isEditing ? (
                  <select
                    value={formData.bloodGroup || ''}
                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select blood group</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{profile.bloodGroup || 'Not provided'}</p>
                )}
              </div>

              {/* Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.height || ''}
                    onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="Height in cm"
                    min="50"
                    max="300"
                  />
                ) : (
                  <p className="text-gray-900">{profile.height ? `${profile.height} cm` : 'Not provided'}</p>
                )}
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="Weight in kg"
                    min="10"
                    max="500"
                  />
                ) : (
                  <p className="text-gray-900">{profile.weight ? `${profile.weight} kg` : 'Not provided'}</p>
                )}
              </div>

              {/* BMI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BMI
                </label>
                <p className="text-gray-900">
                  {bmi ? (
                    <>
                      {bmi}
                      <span className="text-sm text-gray-500 ml-2">
                        ({parseFloat(bmi) < 18.5 ? 'Underweight' : 
                          parseFloat(bmi) < 25 ? 'Normal' : 
                          parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'})
                      </span>
                    </>
                  ) : (
                    'Not calculated'
                  )}
                </p>
              </div>

              {/* Allergies */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.allergies || ''}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="List any allergies (e.g., Penicillin, Peanuts)"
                  />
                ) : (
                  <p className="text-gray-900">{profile.allergies || 'None'}</p>
                )}
              </div>

              {/* Chronic Conditions */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chronic Conditions
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.chronicConditions || ''}
                    onChange={(e) => handleInputChange('chronicConditions', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="List any chronic conditions (e.g., Diabetes, Hypertension)"
                  />
                ) : (
                  <p className="text-gray-900">{profile.chronicConditions || 'None'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Family Members Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <UserPlus className="h-5 w-5 inline mr-2" />
                Family Members
              </h3>
              <button
                onClick={handleAddMemberClick}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Member
              </button>
            </div>


            {familyLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-500" />
                <p className="text-gray-500 text-sm">Loading family members...</p>
              </div>
            ) : familyError ? (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 font-medium">Error loading family members</p>
                  <p className="text-red-500 text-sm mt-1">{familyError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
                  >
                    Try refreshing the page
                  </button>
                </div>
              </div>
            ) : familyMembers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No family members added yet</p>
                <p className="text-gray-500 text-sm mb-4">Click &quot;Add Member&quot; to add your first family member</p>
                <button
                  onClick={handleAddMemberClick}
                  className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Member
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {familyMembers.map((member) => {
                  const memberAge = member.dateOfBirth ? calculateMemberAge(member.dateOfBirth) : null;
                  return (
                    <div
                      key={member.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{member.name}</h4>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              {memberAge !== null && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Age:</span> {memberAge} years
                                </p>
                              )}
                              <p className="text-gray-600 capitalize">
                                <span className="font-medium">Gender:</span> {member.gender}
                              </p>
                              {member.phone && (
                                <p className="text-gray-600">
                                  <Phone className="h-3 w-3 inline mr-1" />
                                  {member.phone}
                                </p>
                              )}
                              {member.bloodGroup && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Blood:</span> {member.bloodGroup}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditMemberClick(member)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit member"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMemberClick(member)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end gap-4">
            <button
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4 inline mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}

        {/* Add Family Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Add Family Member</h3>
                  <button
                    onClick={handleCloseMemberModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={memberFormData.name || ''}
                      onChange={(e) => handleMemberInputChange('name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      placeholder="Enter full name"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={memberFormData.dateOfBirth || ''}
                      onChange={(e) => handleMemberInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      value={memberFormData.gender || 'male'}
                      onChange={(e) => handleMemberInputChange('gender', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={memberFormData.phone || ''}
                      onChange={(e) => handleMemberInputChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      placeholder="10-digit phone number"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={memberFormData.email || ''}
                      onChange={(e) => handleMemberInputChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      placeholder="email@example.com"
                    />
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <select
                      value={memberFormData.bloodGroup || ''}
                      onChange={(e) => handleMemberInputChange('bloodGroup', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select blood group</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  {/* Height & Weight */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        value={memberFormData.height || ''}
                        onChange={(e) => handleMemberInputChange('height', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        placeholder="Height"
                        min="50"
                        max="300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={memberFormData.weight || ''}
                        onChange={(e) => handleMemberInputChange('weight', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        placeholder="Weight"
                        min="10"
                        max="500"
                      />
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies
                    </label>
                    <textarea
                      value={memberFormData.allergies || ''}
                      onChange={(e) => handleMemberInputChange('allergies', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      placeholder="List any allergies"
                    />
                  </div>

                  {/* Chronic Conditions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chronic Conditions
                    </label>
                    <textarea
                      value={memberFormData.chronicConditions || ''}
                      onChange={(e) => handleMemberInputChange('chronicConditions', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      placeholder="List any chronic conditions"
                    />
                  </div>
                </div>


                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleCloseMemberModal}
                    disabled={isSavingMember}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMember}
                    disabled={isSavingMember}
                    className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingMember ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Add Member
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Family Member Modal */}
        {showEditMemberModal && selectedMember && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Edit Family Member</h3>
                  <button
                    onClick={handleCloseMemberModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={memberFormData.name || ''}
                      onChange={(e) => handleMemberInputChange('name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={memberFormData.dateOfBirth || ''}
                      onChange={(e) => handleMemberInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      value={memberFormData.gender || 'male'}
                      onChange={(e) => handleMemberInputChange('gender', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={memberFormData.phone || ''}
                      onChange={(e) => handleMemberInputChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={memberFormData.email || ''}
                      onChange={(e) => handleMemberInputChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <select
                      value={memberFormData.bloodGroup || ''}
                      onChange={(e) => handleMemberInputChange('bloodGroup', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select blood group</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  {/* Height & Weight */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        value={memberFormData.height || ''}
                        onChange={(e) => handleMemberInputChange('height', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        min="50"
                        max="300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={memberFormData.weight || ''}
                        onChange={(e) => handleMemberInputChange('weight', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        min="10"
                        max="500"
                      />
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies
                    </label>
                    <textarea
                      value={memberFormData.allergies || ''}
                      onChange={(e) => handleMemberInputChange('allergies', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Chronic Conditions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chronic Conditions
                    </label>
                    <textarea
                      value={memberFormData.chronicConditions || ''}
                      onChange={(e) => handleMemberInputChange('chronicConditions', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>


                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleCloseMemberModal}
                    disabled={isSavingMember}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateMember}
                    disabled={isSavingMember}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingMember ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Update Member
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteMemberModal && selectedMember && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Remove Family Member?
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to remove <strong>{selectedMember.name}</strong> from your family members? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseMemberModal}
                    disabled={isSavingMember}
                    className="flex-1 px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeleteMember}
                    disabled={isSavingMember}
                    className="flex-1 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSavingMember ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

