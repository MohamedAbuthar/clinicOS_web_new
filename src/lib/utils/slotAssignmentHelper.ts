/**
 * Slot Assignment Helper
 * Dynamically assigns appointments to time slots based on doctor's slot duration
 */

import { generateTimeSlots } from './timeSlotGenerator';

/**
 * Convert time string to 24-hour format (HH:MM)
 */
function convertTo24Hour(timeStr: string): string {
  if (!timeStr) return '';
  
  // If already in 24-hour format (HH:MM), return as is
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  
  // Parse 12-hour format (e.g., "9:00 AM", "9:20 AM")
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  return timeStr;
}

/**
 * Convert 24-hour time to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to 24-hour format (HH:MM)
 */
function minutesTo24Hour(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get next available slot based on doctor's slot duration
 * This ensures appointments are assigned sequentially (9:00 AM, 9:20 AM, 9:40 AM, etc.)
 * based on the slot duration, not hourly intervals
 */
export function getNextAvailableSlot(
  doctorData: {
    availableSlots?: string[];
    startTime?: string;
    endTime?: string;
    consultationDuration?: number;
    morningStartTime?: string;
    morningEndTime?: string;
    eveningStartTime?: string;
    eveningEndTime?: string;
  },
  appointmentDate: string,
  session: 'morning' | 'evening',
  bookedSlots: string[]
): string | null {
  if (!doctorData) {
    return null;
  }

  // Get session time range
  const sessionStartTime = session === 'morning' 
    ? (doctorData.morningStartTime || doctorData.startTime || '09:00')
    : (doctorData.eveningStartTime || doctorData.startTime || '14:00');
  
  const sessionEndTime = session === 'morning'
    ? (doctorData.morningEndTime || doctorData.endTime || '13:00')
    : (doctorData.eveningEndTime || doctorData.endTime || '18:00');

  const slotDuration = doctorData.consultationDuration || 20; // Default to 20 minutes

  // Generate slots for this session based on slot duration
  const sessionSlots = generateTimeSlots({
    startTime: sessionStartTime,
    endTime: sessionEndTime,
    slotDuration: slotDuration
  });

  // Convert booked slots to 24-hour format for comparison
  const bookedSlots24 = bookedSlots
    .map(slot => convertTo24Hour(slot))
    .filter(slot => slot); // Remove invalid conversions

  // Convert generated slots to 24-hour format and filter out booked ones
  const availableSlots24: string[] = [];
  
  for (const slot of sessionSlots) {
    const slot24 = convertTo24Hour(slot.time);
    
    // Check if this slot is already booked
    const isBooked = bookedSlots24.some(booked => {
      // Compare times in minutes for exact match
      const bookedMinutes = timeToMinutes(booked);
      const slotMinutes = timeToMinutes(slot24);
      return bookedMinutes === slotMinutes;
    });

    if (!isBooked) {
      availableSlots24.push(slot24);
    }
  }

  // Return the first available slot (next sequential slot)
  if (availableSlots24.length > 0) {
    return availableSlots24[0]; // Return in 24-hour format (HH:MM)
  }

  return null;
}

/**
 * Get session from slot time
 */
export function getSessionFromSlotTime(
  slotTime: string,
  doctorData: {
    morningStartTime?: string;
    morningEndTime?: string;
    eveningStartTime?: string;
    eveningEndTime?: string;
  }
): 'morning' | 'evening' {
  const slot24 = convertTo24Hour(slotTime);
  const slotMinutes = timeToMinutes(slot24);
  
  const morningStart = timeToMinutes(doctorData.morningStartTime || '09:00');
  const morningEnd = timeToMinutes(doctorData.morningEndTime || '13:00');
  const eveningStart = timeToMinutes(doctorData.eveningStartTime || '14:00');
  const eveningEnd = timeToMinutes(doctorData.eveningEndTime || '18:00');
  
  if (slotMinutes >= morningStart && slotMinutes < morningEnd) {
    return 'morning';
  } else if (slotMinutes >= eveningStart && slotMinutes < eveningEnd) {
    return 'evening';
  }
  
  // Default to morning if unclear
  return slotMinutes < 14 * 60 ? 'morning' : 'evening';
}

/**
 * Get all available slots for a session
 */
export function getAllAvailableSlotsForSession(
  doctorData: {
    availableSlots?: string[];
    startTime?: string;
    endTime?: string;
    consultationDuration?: number;
    morningStartTime?: string;
    morningEndTime?: string;
    eveningStartTime?: string;
    eveningEndTime?: string;
  },
  session: 'morning' | 'evening',
  bookedSlots: string[]
): string[] {
  if (!doctorData) {
    return [];
  }

  // Get session time range
  const sessionStartTime = session === 'morning' 
    ? (doctorData.morningStartTime || doctorData.startTime || '09:00')
    : (doctorData.eveningStartTime || doctorData.startTime || '14:00');
  
  const sessionEndTime = session === 'morning'
    ? (doctorData.morningEndTime || doctorData.endTime || '13:00')
    : (doctorData.eveningEndTime || doctorData.endTime || '18:00');

  const slotDuration = doctorData.consultationDuration || 20;

  // Generate slots for this session
  const sessionSlots = generateTimeSlots({
    startTime: sessionStartTime,
    endTime: sessionEndTime,
    slotDuration: slotDuration
  });

  // Convert booked slots to 24-hour format
  const bookedSlots24 = bookedSlots
    .map(slot => convertTo24Hour(slot))
    .filter(slot => slot);

  // Filter out booked slots
  const availableSlots: string[] = [];
  
  for (const slot of sessionSlots) {
    const slot24 = convertTo24Hour(slot.time);
    const slotMinutes = timeToMinutes(slot24);
    
    const isBooked = bookedSlots24.some(booked => {
      const bookedMinutes = timeToMinutes(booked);
      return bookedMinutes === slotMinutes;
    });

    if (!isBooked) {
      availableSlots.push(slot24); // Return in 24-hour format
    }
  }

  return availableSlots;
}

