# Patient Authentication Fixes

## Problem
The patient booking was failing with error: `"Patient access token required"` (401 Unauthorized)

## Root Cause
The mock patient token in `PatientAuthContext` was missing the `type: 'patient'` field that the backend requires for authentication. Additionally, the context was using hardcoded authentication state instead of properly managing real tokens.

## Changes Made

### 1. Frontend: Patient Auth Context (`src/lib/contexts/PatientAuthContext.tsx`)

#### Removed Mock Token Approach
- **Before:** Context initialized with hardcoded mock data and fake JWT token
- **After:** Context starts unauthenticated and requires real login

#### Fixed Authentication State
- **Before:** `isAuthenticated = true` (hardcoded)
- **After:** `isAuthenticated = !!token && !!patient` (based on actual state)

#### Proper Token Initialization
- Context now properly loads token from `localStorage`
- Validates token by calling the backend API
- Clears invalid tokens automatically
- No longer uses fake/mock tokens

### 2. Backend: Already Correct

The backend was already correctly configured:
- Patient authentication middleware expects tokens with `type: 'patient'`
- Patient registration automatically generates valid tokens
- Patient OTP login generates valid tokens with proper structure
- All tokens include: `{ patientId, email, type: 'patient' }`

## How to Use

### For New Patients (First Time)

1. **Register** at `/Patient/register`:
   - Fill in all required fields
   - On success, you'll get a token automatically
   - Token is stored in `localStorage.patientToken`

2. **Book Appointment** at `/Patient/book-appointment`:
   - Select doctor, date, time
   - Fill in reason for visit
   - Click "Confirm Booking"

### For Returning Patients

1. **Login** at `/Auth-patientLogin`:
   - Enter your email
   - Click "Send OTP"
   - **Development:** Use OTP `123456` for any email
   - **Production:** Check your email for the OTP
   - Enter OTP and click "Verify"
   - Token is stored in `localStorage.patientToken`

2. **Book Appointment** as above

## Testing Guide

### Quick Test Setup

1. **Start Backend:**
   ```bash
   cd /Users/mohamedabuthar/Desktop/clinic_os_backend
   npm start
   ```

2. **Setup Test Data:**
   ```bash
   psql -d clinicos -f setup-test-patient.sql
   ```

3. **Start Frontend:**
   ```bash
   cd /Users/mohamedabuthar/Downloads/clinic_os_web_new-main
   npm run dev
   ```

4. **Test Patient Login:**
   - Go to http://localhost:3000/Auth-patientLogin
   - Email: `john.doe@example.com`
   - Click "Send OTP"
   - Enter OTP: `123456`
   - Click "Verify"

5. **Test Booking:**
   - Go to http://localhost:3000/Patient/book-appointment
   - Select "Dr. Priya Sharma"
   - Select any future date
   - Select an available time slot
   - Enter reason: "Regular checkup"
   - Click "Confirm Booking"

### Verify Token in Browser Console

```javascript
// Check if patient is logged in
console.log('Patient Token:', localStorage.getItem('patientToken'));
console.log('Patient Data:', localStorage.getItem('patientData'));

// Decode token to see payload (for debugging)
const token = localStorage.getItem('patientToken');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token Payload:', payload);
  // Should show: { patientId, email, type: 'patient', iat, exp }
}
```

## Token Flow Diagram

```
┌─────────────────┐
│  Patient Login  │
│  or Register    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Backend generates JWT token    │
│  with type: 'patient'           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Token stored in localStorage   │
│  as 'patientToken'              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  API calls automatically use    │
│  patientToken from localStorage │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Backend verifies token and     │
│  allows appointment booking     │
└─────────────────────────────────┘
```

## Important Notes

### Token Structure
Patient tokens MUST include:
```json
{
  "patientId": "uuid",
  "email": "patient@example.com",
  "type": "patient",  // ← REQUIRED
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Token Storage
- Patient tokens: `localStorage.patientToken`
- Admin tokens: `localStorage.token`
- API automatically prioritizes patientToken for patient endpoints

### Development OTP
In development mode (`NODE_ENV=development`):
- Any email will receive OTP
- Use `123456` as the OTP code
- OTP is also logged to backend console

### Production OTP
In production:
- OTP is sent via email service
- OTP is 6 digits, randomly generated
- OTP expires after a set time (implement in email service)

## Troubleshooting

### "Patient access token required"
**Cause:** Not logged in or token expired

**Solution:**
1. Clear storage: 
   ```javascript
   localStorage.removeItem('patientToken');
   localStorage.removeItem('patientData');
   ```
2. Log in again

### "Invalid patient token"
**Cause:** Token doesn't have `type: 'patient'` or is malformed

**Solution:**
1. Check token structure in console
2. If using old token, log in again to get new token
3. Verify backend is generating tokens correctly

### Can't see available doctors
**Cause:** No doctors in database or doctors are inactive

**Solution:**
1. Run `setup-test-patient.sql` to create test doctors
2. Or check admin panel to ensure doctors are active

### Selected time slot not available
**Cause:** Slot was booked between checking and booking

**Solution:** Select a different time slot

## API Endpoints Summary

### Public (No Auth Required)
- `GET /api/patient/appointments/doctors` - List available doctors
- `GET /api/patient/appointments/doctors/:id/slots` - Get time slots
- `POST /api/patient/auth/send-otp` - Request OTP
- `POST /api/patient/auth/verify-otp` - Verify OTP and login
- `POST /api/patient/register` - Register new patient

### Authenticated (Requires Patient Token)
- `POST /api/patient/appointments/book` - Book appointment
- `GET /api/patient/appointments/my-appointments` - List my appointments
- `GET /api/patient/appointments/:id` - Get appointment details
- `PUT /api/patient/appointments/:id/cancel` - Cancel appointment
- `PUT /api/patient/appointments/:id/reschedule` - Reschedule appointment
- `GET /api/patient/dashboard` - Get patient dashboard
- `GET /api/patient/auth/me` - Get current patient profile

## Files Changed

1. `/src/lib/contexts/PatientAuthContext.tsx`
   - Removed mock token generation
   - Fixed authentication state management
   - Proper token validation on init

2. `/PATIENT_AUTH_FIXES.md` (this file)
   - Documentation of changes and usage

3. `/backend/PATIENT_BOOKING_GUIDE.md`
   - Complete API documentation

4. `/backend/setup-test-patient.sql`
   - Test data setup script

## Next Steps

1. **Test the flow** using the steps above
2. **Implement proper OTP email service** for production
3. **Add token refresh logic** before expiration
4. **Implement rate limiting** on OTP requests
5. **Add OTP expiration** (currently only checks format)
6. **Store OTPs in database** or Redis instead of just logging

## References

- Backend Patient Auth Controller: `/backend/src/controllers/patientAuthController.ts`
- Backend Patient Appointment Controller: `/backend/src/controllers/patientAppointmentController.ts`
- Backend User Middleware: `/backend/src/middlewares/user.ts`
- Frontend API Client: `/src/lib/api.ts`
- Frontend Patient Context: `/src/lib/contexts/PatientAuthContext.tsx`

