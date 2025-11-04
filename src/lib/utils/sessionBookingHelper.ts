/**
 * Session-Based Booking Helper Functions
 * Handles auto-slot assignment, token generation, and family member bookings
 */

export type SessionType = 'morning' | 'evening';

export interface SessionConfig {
  morning: {
    startTime: string; // e.g., "09:00"
    endTime: string;   // e.g., "13:00"
  };
  evening: {
    startTime: string; // e.g., "14:00"
    endTime: string;   // e.g., "18:00"
  };
}

// Default session configuration
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  morning: {
    startTime: "09:00",
    endTime: "13:00"
  },
  evening: {
    startTime: "14:00",
    endTime: "18:00"
  }
};

/**
 * Get session type based on time string
 */
export function getSessionFromTime(timeStr: string): SessionType {
  const hour = parseInt(timeStr.split(':')[0]);
  return hour < 14 ? 'morning' : 'evening';
}

/**
 * Get available slots for a session
 */
export function getSessionSlots(
  allSlots: string[],
  session: SessionType,
  sessionConfig: SessionConfig = DEFAULT_SESSION_CONFIG
): string[] {
  const sessionTimes = sessionConfig[session];
  
  return allSlots.filter(slot => {
    const slotTime = convertTo24Hour(slot);
    const sessionStart = sessionTimes.startTime;
    const sessionEnd = sessionTimes.endTime;
    
    return slotTime >= sessionStart && slotTime < sessionEnd;
  });
}

/**
 * Convert time string to 24-hour format (HH:MM)
 */
export function convertTo24Hour(timeStr: string): string {
  try {
    // Handle formats like "9:00 AM", "9:00AM", "09:00", etc.
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) return timeStr;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2];
    const meridiem = timeMatch[3]?.toUpperCase();
    
    // Convert to 24-hour format if AM/PM is present
    if (meridiem) {
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  } catch (error) {
    console.error('Error converting time:', timeStr, error);
    return timeStr;
  }
}

/**
 * Parse last token number from appointments
 * Token format: #1, #2, #3, etc.
 */
export function parseTokenNumber(token: string): number {
  const match = token.match(/#(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Generate next token number
 */
export function generateNextToken(lastToken: string | number): string {
  if (typeof lastToken === 'number') {
    return `#${lastToken + 1}`;
  }
  const lastNum = parseTokenNumber(lastToken);
  return `#${lastNum + 1}`;
}

/**
 * Get the next available token for a session
 */
export function getNextTokenForSession(
  existingAppointments: any[],
  session: SessionType,
  appointmentDate: string
): string {
  // Filter appointments for the same date and session
  const sessionAppointments = existingAppointments.filter(apt => {
    const aptDate = apt.appointmentDate;
    const aptTime = apt.appointmentTime;
    const aptSession = getSessionFromTime(aptTime);
    
    return aptDate === appointmentDate && aptSession === session;
  });
  
  // Find the highest token number
  let maxTokenNum = 0;
  sessionAppointments.forEach(apt => {
    const tokenNum = parseTokenNumber(apt.tokenNumber || '');
    if (tokenNum > maxTokenNum) {
      maxTokenNum = tokenNum;
    }
  });
  
  return generateNextToken(maxTokenNum);
}

/**
 * Get the next available token for ALL appointments (not session-specific)
 * This ensures continuous numbering across all appointments for a doctor and date
 */
export function getNextTokenForAllAppointments(
  existingAppointments: any[],
  appointmentDate: string
): string {
  // Filter appointments for the same date
  const dateAppointments = existingAppointments.filter(apt => {
    return apt.appointmentDate === appointmentDate;
  });
  
  // Find the highest token number
  let maxTokenNum = 0;
  dateAppointments.forEach(apt => {
    if (apt.tokenNumber) {
      const tokenMatch = apt.tokenNumber.match(/#(\d+)/);
      if (tokenMatch) {
        const tokenNum = parseInt(tokenMatch[1]);
        if (tokenNum > maxTokenNum) {
          maxTokenNum = tokenNum;
        }
      }
    }
  });
  
  return `#${maxTokenNum + 1}`;
}

/**
 * Auto-assign slot based on token number
 * Maps token numbers to sequential slots in the session
 */
export function assignSlotByToken(
  tokenNumber: string,
  sessionSlots: string[],
  bookedSlots: string[]
): string | null {
  const tokenNum = parseTokenNumber(tokenNumber);
  
  if (tokenNum <= 0 || sessionSlots.length === 0) {
    return null;
  }
  
  // Filter out already booked slots
  const availableSlots = sessionSlots.filter(slot => !bookedSlots.includes(slot));
  
  if (availableSlots.length === 0) {
    return null; // No slots available
  }
  
  // Token #1 gets first slot, #2 gets second slot, etc.
  const slotIndex = tokenNum - 1;
  
  // If token number exceeds available slots, return first available
  if (slotIndex >= availableSlots.length) {
    return availableSlots[0];
  }
  
  return availableSlots[slotIndex];
}

/**
 * Calculate session capacity (total slots available)
 */
export function getSessionCapacity(
  allSlots: string[],
  session: SessionType,
  appointmentDate: string,
  existingAppointments: any[],
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): {
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
} {
  const sessionSlots = getSessionSlots(allSlots, session, config);
  
  const bookedSlotsForSession = existingAppointments.filter(apt => {
    const aptDate = apt.appointmentDate;
    const aptTime = apt.appointmentTime;
    const aptSession = getSessionFromTime(aptTime);
    
    return aptDate === appointmentDate && aptSession === session;
  });
  
  return {
    totalSlots: sessionSlots.length,
    bookedSlots: bookedSlotsForSession.length,
    availableSlots: sessionSlots.length - bookedSlotsForSession.length
  };
}

/**
 * Format session display text
 */
export function formatSessionText(session: SessionType): string {
  return session === 'morning' ? '🌅 Morning Session' : '🌆 Evening Session';
}

/**
 * Get session time range text
 */
export function getSessionTimeRange(
  session: SessionType,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): string {
  const times = config[session];
  return `${formatTime(times.startTime)} - ${formatTime(times.endTime)}`;
}

/**
 * Format time for display (converts 24h to 12h format)
 */
function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Validate if booking can be made for a session
 */
export function canBookSession(
  date: Date,
  session: SessionType,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): {
  canBook: boolean;
  reason?: string;
} {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  
  // Can't book past dates
  if (selectedDateStart < todayStart) {
    return {
      canBook: false,
      reason: 'Cannot book appointments for past dates'
    };
  }
  
  // If booking for today, check if session time has passed
  if (selectedDateStart.getTime() === todayStart.getTime()) {
    const sessionTimes = config[session];
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    
    // Check if session has already ended
    if (sessionTimes.endTime <= currentTime) {
      return {
        canBook: false,
        reason: 'This session has already ended'
      };
    }
    
    // Allow booking if session hasn't ended yet (even if it's in progress)
    // The system will assign available time slots within the session
  }
  
  return { canBook: true };
}

/**
 * Get available sessions based on current time
 * Only shows sessions that can actually be booked (considering 2-hour advance booking rule)
 */
export function getAvailableSessionsForDate(
  date: Date,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): SessionType[] {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  
  // If booking for future dates, show both sessions
  if (selectedDateStart.getTime() > todayStart.getTime()) {
    return ['morning', 'evening'];
  }
  
  // If booking for today, check which sessions can actually be booked
  if (selectedDateStart.getTime() === todayStart.getTime()) {
    const availableSessions: SessionType[] = [];
    
    // Check morning session
    const morningCheck = canBookSession(date, 'morning', config);
    if (morningCheck.canBook) {
      availableSessions.push('morning');
    }
    
    // Check evening session
    const eveningCheck = canBookSession(date, 'evening', config);
    if (eveningCheck.canBook) {
      availableSessions.push('evening');
    }
    
    return availableSessions;
  }
  
  // Past dates - no sessions available
  return [];
}

