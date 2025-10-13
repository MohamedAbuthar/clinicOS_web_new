"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { registerPatient } from "@/lib/firebase/auth";
import { usePatientAuth } from "@/lib/contexts/PatientAuthContext";

export default function RegisterForm() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationOptions, setRegistrationOptions] = useState<{
    bloodGroups: string[];
    genders: { value: string; label: string }[];
  }>({
    bloodGroups: [],
    genders: []
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = usePatientAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    phone: searchParams?.get('phone') || "",
    email: searchParams?.get('email') || "", // Get email from URL
    address: "",
    bloodGroup: "",
    height: "",
    weight: "",
    allergies: "",
    chronicConditions: "",
  });

  // Load registration options on component mount
  useEffect(() => {
    // Set default options (no backend API needed)
    setRegistrationOptions({
      bloodGroups: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
      genders: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' }
      ]
    });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error when user starts typing
  };

  // Validate current step before moving next
  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.dateOfBirth || !formData.gender) {
        alert("Please fill all personal info fields");
        return;
      }
    }
    if (step === 2) {
      if (!formData.phone || !formData.email || !formData.address) {
        alert("Please fill all contact info fields");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Step 3 fields before submitting
    if (!formData.bloodGroup || !formData.height || !formData.weight) {
      setError("Please fill all medical info fields");
      return;
    }

    // Validate email is present
    if (!formData.email) {
      setError("Email is required for registration");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Build patient data - only include fields that have values (no undefined)
      const patientData: any = {
        name: formData.fullName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as 'male' | 'female' | 'other',
        isActive: true,
      };

      // Only add optional fields if they have values
      if (formData.address && formData.address.trim()) {
        patientData.address = formData.address.trim();
      }
      if (formData.bloodGroup) {
        patientData.bloodGroup = formData.bloodGroup;
      }
      if (formData.height && parseFloat(formData.height)) {
        patientData.height = parseFloat(formData.height);
      }
      if (formData.weight && parseFloat(formData.weight)) {
        patientData.weight = parseFloat(formData.weight);
      }
      if (formData.allergies && formData.allergies.trim()) {
        patientData.allergies = formData.allergies.trim();
      }
      if (formData.chronicConditions && formData.chronicConditions.trim()) {
        patientData.chronicConditions = formData.chronicConditions.trim();
      }

      // Use email as password (temporary - in production, should generate or ask for password)
      const response = await registerPatient(
        formData.email,
        formData.email, // Using email as password
        patientData
      );
      
      if (response.success && response.patient) {
        console.log('✅ Registration successful!');
        // Redirect to dashboard for newly registered patients
        router.push('/Patient/dashboard');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific Firebase errors
      if (error.message?.includes('email-already-in-use') || error.message?.includes('already in use')) {
        setError('This email is already registered. Please login instead or use a different email.');
      } else if (error.message?.includes('invalid-email')) {
        setError('Invalid email format. Please check your email address.');
      } else if (error.message?.includes('weak-password')) {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-8">
        {/* Heading */}
        <h2 className="text-3xl font-bold text-center text-teal-600 mb-8">
          Patient Registration
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex justify-between mb-8">
          {["Personal Info", "Contact Info", "Medical Info"].map((label, index) => (
            <div key={index} className="flex-1 text-center">
              <div
                className={`mx-auto w-10 h-10 flex items-center justify-center rounded-full ${
                  step === index + 1
                    ? "bg-teal-600 text-white"
                    : step > index + 1
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              <p className="mt-2 text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <>
              <div>
                <label className="block mb-2 font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select gender</option>
                  {registrationOptions.genders.map((gender) => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-teal-600 text-white px-6 py-3 rounded hover:bg-teal-700 transition"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* Step 2: Contact Info */}
          {step === 2 && (
            <>
              <div>
                <label className="block mb-2 font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
                  readOnly
                  title="Email verified via OTP"
                />
                <p className="text-xs text-gray-500 mt-1">✓ Email verified</p>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-teal-600 text-white px-6 py-3 rounded hover:bg-teal-700 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-teal-600 text-white px-6 py-3 rounded hover:bg-teal-700 transition"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* Step 3: Medical Info */}
          {step === 3 && (
            <>
              <div>
                <label className="block mb-2 font-medium text-gray-700">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select blood group</option>
                  {registrationOptions.bloodGroups.map((bloodGroup) => (
                    <option key={bloodGroup} value={bloodGroup}>
                      {bloodGroup}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Height (cm)</label>
                  <input
                    type="text"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Weight (kg)</label>
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Allergies <span className="text-sm text-gray-500">(Optional)</span>
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Any known allergies..."
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Chronic Conditions <span className="text-sm text-gray-500">(Optional)</span>
                </label>
                <textarea
                  name="chronicConditions"
                  value={formData.chronicConditions}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Any chronic medical conditions..."
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-teal-600 text-white px-6 py-3 rounded hover:bg-teal-700 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-3 rounded transition ${
                    isLoading
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  {isLoading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}