# Queue Management Check-In System Guide

## Overview
The Queue Management system now includes a **Patient Check-In** feature that allows you to check in patients when they arrive at the clinic. This automatically adds them to the queue based on their check-in order.

## Features Added

### 1. **Pending Check-ins Section**
- Displays all appointments scheduled for today that haven't been checked in yet
- Shows patient name, token number, and appointment time
- Auto-refreshes every 30 seconds to show new appointments
- Can be collapsed/expanded for better screen space management

### 2. **Check-In Functionality**
- One-click check-in button for each pending appointment
- Automatically creates a queue entry when patient checks in
- Updates appointment status to "confirmed"
- Adds patient to the waiting queue in order of check-in
- Records the exact time of check-in (arrivedAt timestamp)

### 3. **Automatic Queue Management**
- Patients are added to queue automatically upon check-in
- Queue position is assigned based on check-in order
- First to check in = first in queue (within their appointment slot)
- Real-time updates to queue display

## How It Works

### Check-In Flow:
1. **Patient Arrives** → Receptionist sees their appointment in "Pending Check-ins"
2. **Click "Check In"** → System creates queue entry and marks appointment as confirmed
3. **Auto-Added to Queue** → Patient appears in "Waiting Queue" section
4. **Queue Position Assigned** → Position based on check-in order
5. **Doctor Calls Next** → Patient is called when it's their turn

### Database Changes:
When a patient is checked in:
- **Queue Collection**: New document created with:
  - `appointmentId`: Link to original appointment
  - `patientId`: Patient reference
  - `doctorId`: Doctor reference
  - `tokenNumber`: Display token
  - `position`: Queue position (auto-incremented)
  - `status`: Set to "waiting"
  - `arrivedAt`: Check-in timestamp
  
- **Appointment Document**: Updated with:
  - `status`: Changed from "scheduled" to "confirmed"
  - `checkedInAt`: Timestamp of check-in
  - `updatedAt`: Updated timestamp

## UI Components

### Pending Check-ins Card (Yellow Theme)
```
┌─────────────────────────────────────────────────────┐
│ 👤 Pending Check-ins (3)                         ✕  │
├─────────────────────────────────────────────────────┤
│  ┌─────┐                                            │
│  │ 101 │  John Doe                      [Check In]  │
│  │Token│  Appointment: 10:00 AM                     │
│  └─────┘                                            │
├─────────────────────────────────────────────────────┤
│  ┌─────┐                                            │
│  │ 102 │  Jane Smith                    [Check In]  │
│  │Token│  Appointment: 10:30 AM                     │
│  └─────┘                                            │
└─────────────────────────────────────────────────────┘
```

### After Check-In → Waiting Queue
```
┌─────────────────────────────────────────────────────┐
│ Waiting Queue (2)                                   │
├─────────────────────────────────────────────────────┤
│  ☰ ┌─────┐                                          │
│     │ 101 │  John Doe                    [Arrived]  │
│     │Token│  Waiting: 5 min              [Skip]     │
│     └─────┘                                         │
├─────────────────────────────────────────────────────┤
│  ☰ ┌─────┐                                          │
│     │ 102 │  Jane Smith                  [Arrived]  │
│     │Token│  Waiting: 2 min              [Skip]     │
│     └─────┘                                         │
└─────────────────────────────────────────────────────┘
```

## API Functions Added

### `useQueue` Hook Updates

#### 1. `checkInPatient(appointmentId, patientId, doctorId, tokenNumber)`
Creates queue entry when patient checks in.

**Parameters:**
- `appointmentId`: The appointment ID to check in
- `patientId`: Patient reference ID
- `doctorId`: Doctor reference ID
- `tokenNumber`: Token number for display

**Returns:** `Promise<boolean>` - Success/failure status

**Example:**
```typescript
const success = await checkInPatient(
  'apt_123',
  'patient_456',
  'doctor_789',
  '101'
);
```

#### 2. `getPendingCheckIns(doctorId, date)`
Fetches appointments scheduled for check-in.

**Parameters:**
- `doctorId`: Doctor ID to filter appointments
- `date`: Date in YYYY-MM-DD format (e.g., "2025-10-13")

**Returns:** `Promise<any[]>` - Array of pending appointments

**Example:**
```typescript
const today = new Date().toISOString().split('T')[0];
const pending = await getPendingCheckIns('doctor_789', today);
```

## Usage Instructions

### For Receptionists/Assistants:

1. **Open Queue Management Page**
   - Navigate to Admin → Queue Management
   - Select the doctor from dropdown

2. **View Pending Check-ins**
   - Yellow section at top shows appointments waiting to check in
   - Sorted by appointment time

3. **Check In a Patient**
   - When patient arrives, click "Check In" button next to their name
   - Patient automatically moves to waiting queue
   - Success message confirms check-in

4. **Manage Queue**
   - View all checked-in patients in "Waiting Queue" section
   - Drag to reorder if needed
   - Call next patient when doctor is ready

### For Doctors:

1. **View Your Queue**
   - See all checked-in patients waiting for you
   - Current patient displayed prominently
   - Queue ordered by check-in time

2. **Complete Consultation**
   - Click "Complete" when done with current patient
   - Next patient automatically called

## Benefits

✅ **Organized Queue**: Patients added to queue only when physically present
✅ **First Come, First Served**: Check-in order determines queue position
✅ **No-Show Prevention**: Only checked-in patients appear in queue
✅ **Real-time Updates**: Queue updates instantly when patient checks in
✅ **Audit Trail**: Check-in time recorded for analytics
✅ **Better Wait Time**: More accurate wait time estimates

## Configuration

### Auto-Refresh Interval
The pending check-ins refresh automatically every 30 seconds. To change this:

```typescript
// In queue-management.tsx, line ~469
const interval = setInterval(fetchPendingCheckIns, 30000); // 30 seconds
```

Change `30000` to your desired interval in milliseconds.

### Queue Position Logic
Queue positions are auto-incremented based on check-in order:
- Position 1: First patient to check in
- Position 2: Second patient to check in
- And so on...

Positions can be manually adjusted by dragging queue items.

## Firestore Data Structure

### Queue Collection
```javascript
{
  appointmentId: "apt_abc123",
  patientId: "patient_xyz456",
  doctorId: "doctor_def789",
  tokenNumber: "101",
  position: 1,
  status: "waiting", // waiting | current | completed | skipped
  arrivedAt: Timestamp,
  calledAt: Timestamp | null,
  completedAt: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Appointment Updates
```javascript
{
  // ... existing fields
  status: "confirmed", // changed from "scheduled"
  checkedInAt: Timestamp,
  updatedAt: Timestamp
}
```

## Troubleshooting

### Issue: Pending check-ins not showing
**Solution:** 
- Verify doctor is selected in dropdown
- Check that appointments exist for today with status "scheduled"
- Ensure appointment date matches today's date (YYYY-MM-DD format)

### Issue: Check-in button not working
**Solution:**
- Check browser console for errors
- Verify Firebase permissions for 'queue' and 'appointments' collections
- Ensure all required parameters (appointmentId, patientId, doctorId, tokenNumber) are present

### Issue: Patient not appearing in queue after check-in
**Solution:**
- Check if queue entry was created in Firestore
- Verify `status` field is set to "waiting"
- Ensure `doctorId` matches selected doctor

## Future Enhancements

Potential features to add:
- 📱 SMS notification to patient when checked in
- ⏰ Expected wait time display
- 📊 Check-in analytics and reports
- 🔔 Alert for late arrivals
- 📍 Check-in via QR code
- 🎫 Print queue ticket

## Support

For questions or issues, please refer to:
- Main README.md
- Firestore rules documentation
- Queue Management component source code

---

**Created:** October 2025
**Version:** 1.0.0
**Status:** Production Ready ✅

