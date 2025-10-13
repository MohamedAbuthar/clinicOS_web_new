# Check-in to Queue Flow Guide

## Overview
This document explains how patients move from appointments to the queue system in the clinic.

## Complete Flow

### Step 1: Appointment Creation
1. Navigate to **Admin → Appointments**
2. Click "New Appointment" to create an appointment
3. Appointment is created with status: `scheduled` or `confirmed`

### Step 2: Mark Appointment as Completed
1. In the **Appointments** page, find the appointment
2. Click the green **checkmark icon** (Complete) for the appointment
3. Appointment status changes to: `completed`
4. Now the **Check-in button** (UserCheck icon) appears

### Step 3: Check-in Patient
1. In the **Appointments** page, click the **Check-in button** (UserCheck icon)
2. This sets the `checkedInAt` timestamp on the appointment
3. A success message appears: "Appointment checked in and added to queue successfully"
4. The appointment now shows "Checked in: [time]" under the status

**Important:** At this stage, the patient is NOT yet in the waiting queue. They are in a "pending check-in" state.

### Step 4: View Checked-in Patients
1. Navigate to **Admin → Queue Management**
2. Select the appropriate **Doctor** from the dropdown
3. You'll see a **"Checked-in Patients"** section at the top (with teal border)
4. This section shows all patients who have checked in but are NOT yet in the queue
5. Patients are ordered by check-in time (earliest first)

### Step 5: Add to Queue
1. In the **Queue Management** page, in the "Checked-in Patients" section
2. Click **"Add to Queue"** button for a patient
3. This creates a queue entry with status: `waiting`
4. The patient is removed from "Checked-in Patients" section
5. The patient now appears in the **"Waiting Queue"** section below

### Step 6: Queue Management
Once in the waiting queue:
- **Current Patient**: Shows the patient currently being seen
- **Waiting Queue**: Shows patients waiting to be seen
- **Call Next Patient**: Moves the first waiting patient to current
- **Complete**: Marks current patient as completed
- **Skip**: Temporarily skips a patient in the queue

## Data Flow

```
Appointment Created (scheduled)
    ↓
Mark as Complete (completed status)
    ↓
Check-in (sets checkedInAt timestamp)
    ↓
Appears in "Checked-in Patients" section (Queue Management)
    ↓
Add to Queue (creates queue entry)
    ↓
Appears in "Waiting Queue" (Queue Management)
    ↓
Call Next Patient (status: current)
    ↓
Complete (status: completed)
```

## Key Database Fields

### Appointments Collection
- `status`: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
- `checkedInAt`: Timestamp when patient checked in (set by Check-in button)
- `tokenNumber`: Patient's token number

### Queue Collection
- `appointmentId`: Reference to the appointment
- `patientId`: Reference to the patient
- `doctorId`: Reference to the doctor
- `tokenNumber`: Patient's token number
- `position`: Position in queue (auto-calculated)
- `status`: 'waiting' | 'current' | 'completed' | 'skipped' | 'cancelled'
- `arrivedAt`: Timestamp when added to queue

## UI Components

### Appointments Page (`/Admin/appointment`)
- Shows all appointments
- **Complete button** (green checkmark): Marks appointment as completed
- **Check-in button** (UserCheck icon): Sets checkedInAt timestamp
  - Only visible for completed appointments
  - Only visible if not already checked in
- **Cancel button** (red X): Cancels appointment
- **No Show button** (UserX icon): Marks as no-show

### Queue Management Page (`/Admin/queue-management`)
- **Doctor Selector**: Select which doctor's queue to view
- **Checked-in Patients Section** (teal border):
  - Shows patients with checkedInAt timestamp
  - Shows patients NOT yet in queue
  - Ordered by check-in time
  - **Add to Queue** button: Moves patient to waiting queue
- **Current Patient Card**: Shows patient currently being seen
- **Waiting Queue**: Shows patients waiting to be seen
  - Can drag to reorder
  - **Skip** button: Temporarily skip patient

## Important Notes

1. **Two-Step Process**: Check-in and Add to Queue are separate steps
   - This allows staff to see who has arrived before adding them to the queue
   - Useful for managing patient flow and priorities

2. **Automatic Refresh**: Queue data refreshes every 10 seconds automatically

3. **Token Numbers**: Each appointment gets a unique token number for easy identification

4. **Real-time Updates**: Changes in one page will reflect in the other after refresh

## Troubleshooting

### Checked-in Patients Not Showing in Queue Management
- Verify the correct doctor is selected
- Check that the appointment date matches today's date
- Ensure the appointment has status='completed' and has checkedInAt timestamp
- Make sure the patient hasn't already been added to the queue

### Patient Not Appearing in Waiting Queue
- Verify you clicked "Add to Queue" in the Queue Management page
- Check browser console for any errors
- Try refreshing the page

### Check-in Button Not Visible
- Ensure appointment status is 'completed' (click Complete button first)
- Verify patient hasn't already been checked in (look for "Checked in:" text)

## Console Logs for Debugging

The system includes detailed console logging:

**useQueue.ts - getPendingCheckIns:**
- "Getting pending check-ins for doctor: [id], date: [date]"
- "Found completed appointments: [count]"
- "Appointment [token] - hasCheckedIn: [true/false]"
- "Checked-in appointments: [count]"
- "Appointments already in queue: [ids]"
- "Pending check-ins (not in queue yet): [count]"

**useAppointments.ts - checkInAppointment:**
- "Check-in started for appointment: [id]"
- "Appointment updated with checkedInAt timestamp"
- "Check-in completed successfully"

## Summary

The system provides a clear workflow:
1. **Appointments Page**: Handle appointment scheduling and check-in
2. **Queue Management Page**: Handle queue operations and patient flow
3. **Separation of Concerns**: Check-in and queue management are intentionally separate for better control

This design allows clinic staff to:
- See who has arrived at the clinic
- Manage patient priorities before adding to queue
- Handle queue operations efficiently
- Track patient flow in real-time

