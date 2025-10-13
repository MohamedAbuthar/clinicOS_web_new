# Check-in to Queue Debug Guide

## How It Should Work

1. **Appointments Page**: Click check-in button on a **completed** appointment
2. **Check-in Process**: 
   - Adds `checkedInAt` timestamp to appointment
   - Creates queue entry with status `'waiting'`
3. **Queue Management Page**: Shows patient in "Waiting Queue"

## Debugging Steps

### Step 1: Check Browser Console

Open your browser's Developer Console (F12) and look for these logs:

**When clicking Check-in on Appointments page:**
```
Check-in started for appointment: [appointment-id]
Appointment data: {...}
Appointment updated with checkedInAt timestamp
Current queue items: [number]
Already in queue: false/true
Max position found: [number]
Creating queue entry: {...}
Queue entry created with ID: [queue-id]
Check-in completed successfully
```

**On Queue Management page:**
```
Auto-selecting first doctor: {...}
Fetched queue data: [...]
Current Patient: null or {...}
Waiting Queue: [...]
Queue Stats: {...}
```

### Step 2: Check Firestore Database

Go to Firebase Console → Firestore Database

#### Check `appointments` collection:
- Find your checked-in appointment
- Verify it has `checkedInAt` timestamp field
- Note the `doctorId` field value

#### Check `queue` collection:
- Look for entries with matching `appointmentId`
- Verify `status` is `'waiting'`
- Verify `doctorId` matches the appointment's doctor
- Check `position` field has a number

### Step 3: Verify Doctor Selection

On Queue Management page:
- Make sure a doctor is selected in the dropdown at the top
- The dropdown should show: "Mohamed Abutharrr... - thiujyhtgrf" or similar
- **IMPORTANT**: The selected doctor must match the doctor assigned to the appointment!

### Step 4: Manual Refresh

On Queue Management page:
- Click the "Refresh Queue" button under "Quick Actions"
- Check the console for new logs
- The page auto-refreshes every 10 seconds

## Common Issues and Solutions

### Issue 1: Doctor Mismatch
**Problem**: Appointment has `doctorId: "abc123"` but you selected a different doctor in Queue Management

**Solution**: 
- Check the doctor assigned to the appointment
- Select that same doctor in the Queue Management dropdown

### Issue 2: Queue Entry Not Created
**Problem**: Console shows "Check-in completed" but no queue entry in Firestore

**Solution**:
- Check if console says "Already in queue: true"
- If yes, the entry already exists - look for it in the queue collection
- If no, check for any error messages in console

### Issue 3: Data Not Showing
**Problem**: Queue entry exists in Firestore but not showing on page

**Solution**:
- Check doctor selection matches
- Look at console logs for "Fetched queue data"
- Click "Refresh Queue" button
- Check if there are any Firebase permission errors in console

## Expected Console Output (Success Case)

### On Check-in:
```
Check-in started for appointment: abc123
Appointment data: {patientId: "p1", doctorId: "d1", tokenNumber: "#0hE", ...}
Appointment updated with checkedInAt timestamp
Current queue items: 0
Already in queue: false
Max position found: 0
Creating queue entry: {appointmentId: "abc123", patientId: "p1", doctorId: "d1", tokenNumber: "#0hE", position: 1, status: "waiting", ...}
Queue entry created with ID: queue123
Check-in completed successfully
```

### On Queue Management Page:
```
Auto-selecting first doctor: {id: "d1", user: {name: "Mohamed Abutharrr..."}, ...}
Fetched queue data: [{id: "queue123", status: "waiting", tokenNumber: "#0hE", position: 1, ...}]
Current Patient: null
Waiting Queue: [{id: "queue123", status: "waiting", tokenNumber: "#0hE", position: 1, ...}]
Queue Stats: {total: 1, waiting: 1, completed: 0, avgWaitTime: "15 min"}
```

## Testing Steps

1. **Clear old data** (if needed):
   - Go to Firestore Database
   - Delete all documents in `queue` collection
   - Start fresh

2. **Create a test flow**:
   ```
   a. Go to Appointments page
   b. Find a COMPLETED appointment
   c. Open browser console (F12)
   d. Click the check-in icon (user icon with checkmark)
   e. Watch console logs
   f. Look for "Queue entry created with ID: ..."
   ```

3. **Verify in Queue Management**:
   ```
   a. Go to Queue Management page
   b. Open browser console (F12)
   c. Select the correct doctor from dropdown
   d. Watch console logs
   e. Look for "Fetched queue data: [...]"
   f. Patient should appear in "Waiting Queue (1)"
   ```

4. **If still not working**:
   - Take a screenshot of browser console
   - Check Firestore Database screenshots
   - Verify doctor IDs match between appointment and queue

## Quick Test

Run this in the browser console on Queue Management page:

```javascript
// This will force a refresh
window.location.reload();
```

Then immediately check the console logs to see what's being fetched.

