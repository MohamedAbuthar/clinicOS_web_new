export interface Doctor {
    id: string;
    name: string;
    specialty: string;
    currentToken: string | null;
    queueLength: number;
    estimatedLastPatient: string | null;
    status: 'Active' | 'Break';
  }
  
  export interface Alert {
    id: string;
    message: string;
    timestamp: string;
    type: 'warning' | 'info' | 'success';
  }
  export interface Patient {
    id: string;
    tokenNumber: string;
    name: string;
    category?: string;
    waitingTime: string;
    status: 'Arrived' | 'Late' | 'Walk-in';
  }
  
  export interface Activity {
    id: string;
    message: string;
    timestamp: string;
    type: 'success' | 'warning' | 'info';
  }
  
  export interface CurrentPatient {
    tokenNumber: string;
    name: string;
    status: string;
  }

  //patient profile types
  export interface PatientProfile {
    fullName: string;
    patientId: string;
    dateOfBirth: string;
    gender: string;
    age: number;
    phone: string;
    email: string;
    address: string;
    bloodGroup: string;
    height: number;
    weight: number;
    bmi: number;
    allergies: string;
    chronicConditions: string;
  }
  
  export interface FamilyMember {
    id: number;
    name: string;
    relationship: string;
    age: number;
  }
  
  export interface NewMemberForm {
    name: string;
    relationship: string;
    age: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email: string;
  }