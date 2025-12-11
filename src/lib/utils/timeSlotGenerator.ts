/**
 * Time Slot Generator Utility
 * Automatically generates time slots based on schedule and slot duration
 */

export interface TimeSlot {
  time: string;
  isBooked: boolean;
}

export interface DoctorSchedule {
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "17:00"
  slotDuration: number; // in minutes, e.g., 20
}

/**
 * Convert time string to minutes since midnight
 * @param timeStr - Time in format "HH:MM" or "HH:MM AM/PM"
 */
function timeToMinutes(timeStr: string): number {
  const cleanTime = timeStr.trim().toUpperCase();
  const [time, period] = cleanTime.split(' ');

  if (!time) return 0;

  const [rawHours, minutes] = time.split(':').map(Number);

  let hours = rawHours;

  // Handle AM/PM format
  if (period) {
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }

  return hours * 60 + (minutes || 0);
}

/**
 * Convert minutes since midnight to time string
 * @param minutes - Minutes since midnight
 * @param use24Hour - Use 24-hour format (default: false for 12-hour format)
 */
function minutesToTime(minutes: number, use24Hour: boolean = false): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (use24Hour) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Generate time slots based on doctor's schedule
 * @param schedule - Doctor's schedule with start time, end time, and slot duration
 * @param bookedSlots - Array of already booked time slots
 * @returns Array of time slots
 */
export function generateTimeSlots(
  schedule: DoctorSchedule,
  bookedSlots: string[] = []
): TimeSlot[] {
  const { startTime, endTime, slotDuration } = schedule;

  if (!startTime || !endTime || !slotDuration || slotDuration <= 0) {
    return [];
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const slots: TimeSlot[] = [];

  let currentMinutes = startMinutes;

  while (currentMinutes + slotDuration <= endMinutes) {
    const timeStr = minutesToTime(currentMinutes);
    const time24 = minutesToTime(currentMinutes, true);

    slots.push({
      time: timeStr,
      isBooked: bookedSlots.includes(timeStr) || bookedSlots.includes(time24)
    });

    currentMinutes += slotDuration;
  }

  return slots;
}

/**
 * Parse schedule string to get start and end times
 * Handles formats like:
 * - "Mon-Fri, 9:00 AM - 5:00 PM"
 * - "9:00 AM - 5:00 PM"
 * - "09:00 - 17:00"
 */
export function parseScheduleString(scheduleStr: string): {
  startTime: string;
  endTime: string;
} | null {
  if (!scheduleStr) return null;

  // Remove day information if present
  const timePartMatch = scheduleStr.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);

  if (!timePartMatch) return null;

  return {
    startTime: timePartMatch[1].trim(),
    endTime: timePartMatch[2].trim()
  };
}

/**
 * Format schedule for display
 */
export function formatScheduleDisplay(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}

/**
 * Check if a time slot is within working hours
 */
export function isWithinWorkingHours(
  timeSlot: string,
  startTime: string,
  endTime: string
): boolean {
  const slotMinutes = timeToMinutes(timeSlot);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  return slotMinutes >= startMinutes && slotMinutes < endMinutes;
}

