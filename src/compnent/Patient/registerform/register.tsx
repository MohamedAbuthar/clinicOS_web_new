"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { patientRegistrationApi } from "@/lib/api";
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
    email: "",
    address: "",
    bloodGroup: "",
    height: "",
    weight: "",
    allergies: "",
    chronicConditions: "",
  });

  // Load registration options on component mount
  useEffect(() => {
    const loadRegistrationOptions = async () => {
      try {
        const response = await patientRegistrationApi.getRegistrationOptions();
        if (response.success && response.data) {
          setRegistrationOptions(response.data);
        }
      } catch (error) {
        console.error('Error loading registration options:', error);
        // Set default options if API fails
        setRegistrationOptions({
          bloodGroups: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
          genders: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' }
          ]
        });
      }
    };

    loadRegistrationOptions();
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

    setIsLoading(true);
    setError("");

    try {
      const registrationData = {
        name: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as 'male' | 'female' | 'other',
        address: formData.address || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        height: parseFloat(formData.height) || undefined,
        weight: parseFloat(formData.weight) || undefined,
        allergies: formData.allergies || undefined,
        chronicConditions: formData.chronicConditions || undefined,
      };

      const response = await patientRegistrationApi.registerPatient(registrationData);
      
      if (response.success && response.data) {
        // Store the token and patient data
        localStorage.setItem('patientToken', response.data.token);
        localStorage.setItem('patientData', JSON.stringify(response.data.patient));
        
        // Redirect to dashboard
        router.push('/Patient/dashboard');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
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
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
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