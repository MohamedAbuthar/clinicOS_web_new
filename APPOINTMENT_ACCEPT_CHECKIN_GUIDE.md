# Appointment Accept & Check-In System Guide

## Overview
The Appointments page now includes a complete **Accept/Reject and Check-In workflow** that ensures proper appointment management before patients can be checked in.

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                   APPOINTMENT LIFECYCLE                         │
└─────────────────────────────────────────────────────────────────┘

Step 1: APPOINTMENT CREATED
├─ Status: "scheduled"
├─ Acceptance Status: null (pending)
└─ Actions: [Accept] [Reject]

        ↓ (Admin clicks Accept)

Step 2: APPOINTMENT ACCEPTED
├─ Status: "scheduled"
├─ Acceptance Status: "accepted"
├─ Timestamp: acceptedAt
└─ Actions: [Check In] [Complete] [Cancel] [No Show]

        ↓ (Patient arrives, Admin clicks Check In)

Step 3: PATIENT CHECKED IN
├─ Status: "confirmed"
├─ Acceptance Status: "accepted"
├─ Timestamp: checkedInAt
└─ Actions: [Complete] [Cancel] [No Show]

        ↓ (Doctor completes consultation)

Step 4: APPOINTMENT COMPLETED
├─ Status: "completed"
└─ No actions available

ALTERNATIVE PATH: APPOINTMENT REJECTED
├─ Status: "cancelled"
├─ Acceptance Status: "rejected"
├─ Timestamp: rejectedAt
└─ Display: "Rejected" (no actions)
```

## ✨ New Features

### 1. **Accept/Reject Buttons** 
- Shown for newly created appointments (status: "scheduled")
- Appear BEFORE check-in button
- Thumbs Up icon for Accept
- Thumbs Down icon for Reject

### 2. **Check-In Button** (Conditional Display)
- ✅ **Shows ONLY if:** Appointment is accepted
- ❌ **Does NOT show if:** 
  - Appointment not yet accepted
  - Appointment rejected
  - Already checked in

### 3. **Acceptance Status Badge**
- Shows below appointment status
- Three states:
  - 🟢 **Accepted** - Teal badge
  - 🔴 **Rejected** - Red badge
  - 🟡 **Pending** - Yellow badge

### 4. **Timestamps Recorded**
- `acceptedAt` - When admin accepts appointment
- `rejectedAt` - When admin rejects appointment
- `checkedInAt` - When patient checks in (existing)

## 📊 Visual Layout

### Appointment Row Display:

```
┌────────────────────────────────────────────────────────────────┐
│ Token  Patient         Doctor        Date & Time    Status     │
├────────────────────────────────────────────────────────────────┤
│  101   John Doe        Dr. Smith     Today          Scheduled  │
│        +91 98765       Cardiology    10:00 AM       ⏳ Pending │
│                                                                 │
│        Actions: [👍 Accept] [👎 Reject]                        │
└────────────────────────────────────────────────────────────────┘

After Accept:
┌────────────────────────────────────────────────────────────────┐
│  101   John Doe        Dr. Smith     Today          Scheduled  │
│        +91 98765       Cardiology    10:00 AM       ✓ Accepted │
│                                                                 │
│        Actions: [✓ Check In] [✓ Complete] [✕ Cancel] [👤 No Show]│
└────────────────────────────────────────────────────────────────┘

After Check-In:
┌────────────────────────────────────────────────────────────────┐
│  101   John Doe        Dr. Smith     Today          Confirmed  │
│        +91 98765       Cardiology    10:00 AM       ✓ Accepted │
│                                                     Checked in: 9:55 AM│
│        Actions: [✓ Complete] [✕ Cancel] [👤 No Show]           │
└────────────────────────────────────────────────────────────────┘

If Rejected:
┌────────────────────────────────────────────────────────────────┐
│  101   John Doe        Dr. Smith     Today          Cancelled  │
│        +91 98765       Cardiology    10:00 AM       ✕ Rejected │
│                                                                 │
│        Actions: Rejected                                       │
└────────────────────────────────────────────────────────────────┘
```

## 🎯 Button Logic Flow

### Accept Button:
```javascript
Condition: 
  appointment.status === 'scheduled' 
  && !appointment.acceptanceStatus

Action:
  - Set acceptanceStatus = 'accepted'
  - Set acceptedAt = Timestamp.now()
  - Keep status = 'scheduled'
  - Show success message
  - Refresh appointments

Result:
  - Accept/Reject buttons disappear
  - Check-In button appears
  - Acceptance badge shows "✓ Accepted"
```

### Reject Button:
```javascript
Condition: 
  appointment.status === 'scheduled' 
  && !appointment.acceptanceStatus

Action:
  - Set acceptanceStatus = 'rejected'
  - Set rejectedAt = Timestamp.now()
  - Set status = 'cancelled'
  - Show success message
  - Refresh appointments

Result:
  - All action buttons disappear
  - Display "Rejected" text
  - Acceptance badge shows "✕ Rejected"
  - Status shows "Cancelled"
```

### Check-In Button:
```javascript
Condition: 
  appointment.acceptanceStatus === 'accepted' 
  && !appointment.checkedInAt

Action:
  - Set status = 'confirmed'
  - Set checkedInAt = Timestamp.now()
  - Show success message
  - Refresh appointments

Result:
  - Check-In button disappears
  - Show "Checked in: [time]" below status
  - Other action buttons remain available
```

## 🗄️ Database Schema

### Appointment Document Fields:

```javascript
{
  id: "apt_123",
  patientId: "pat_456",
  doctorId: "doc_789",
  appointmentDate: "2025-10-13",
  appointmentTime: "10:00",
  tokenNumber: "101",
  status: "scheduled", // or confirmed/cancelled/completed/no_show
  source: "web", // or assistant/walk_in/phone
  
  // NEW FIELDS:
  acceptanceStatus: "accepted", // pending/accepted/rejected (optional)
  acceptedAt: Timestamp, // when admin accepted (optional)
  rejectedAt: Timestamp, // when admin rejected (optional)
  checkedInAt: Timestamp, // when patient checked in (optional)
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🔧 Implementation Details

### 1. Hook Functions Added:

```typescript
// In useAppointments.ts

acceptAppointment(id: string): Promise<boolean>
  - Updates acceptanceStatus to 'accepted'
  - Records acceptedAt timestamp
  - Returns success/failure

rejectAppointment(id: string): Promise<boolean>
  - Updates acceptanceStatus to 'rejected'
  - Records rejectedAt timestamp
  - Changes status to 'cancelled'
  - Returns success/failure

checkInAppointment(id: string): Promise<boolean>
  - Changes status to 'confirmed'
  - Records checkedInAt timestamp
  - Returns success/failure
```

### 2. Component Logic:

```typescript
// Action handler updated with new cases
handleAppointmentAction(appointmentId, action) {
  switch (action) {
    case 'accept': acceptAppointment(id)
    case 'reject': rejectAppointment(id)
    case 'check-in': checkInAppointment(id)
    case 'complete': completeAppointment(id)
    case 'cancel': cancelAppointment(id)
    case 'no-show': markNoShow(id)
  }
}
```

### 3. Conditional Rendering:

```typescript
// Accept/Reject buttons
{appointment.status === 'scheduled' && !appointment.acceptanceStatus && (
  <>
    <button onClick={() => handleAction(id, 'accept')}>Accept</button>
    <button onClick={() => handleAction(id, 'reject')}>Reject</button>
  </>
)}

// Check-In button (ONLY if accepted)
{appointment.acceptanceStatus === 'accepted' && !appointment.checkedInAt && (
  <button onClick={() => handleAction(id, 'check-in')}>Check In</button>
)}
```

## 📋 Usage Instructions

### For Admin/Receptionist:

**1. New Appointment Arrives:**
- View appointment in table
- Status shows "Scheduled"
- See Accept/Reject buttons

**2. Review & Accept:**
- Click **Accept** (👍 Thumbs Up icon)
- Acceptance badge changes to "✓ Accepted" (teal)
- Check-In button appears
- Success message: "Appointment accepted successfully"

**3. Patient Arrives:**
- Click **Check In** (✓ UserCheck icon)
- Status changes to "Confirmed"
- Timestamp shows: "Checked in: [time]"
- Success message: "Appointment checked in successfully"

**4. Alternative - Reject:**
- Click **Reject** (👎 Thumbs Down icon)
- Acceptance badge changes to "✕ Rejected" (red)
- Status changes to "Cancelled"
- All action buttons disappear
- Success message: "Appointment rejected successfully"

## 🎨 Status Badge Colors

### Appointment Status:
- **Scheduled/Confirmed** → Green
- **Cancelled** → Red
- **Completed** → Blue
- **No Show** → Gray
- **Rescheduled** → Orange

### Acceptance Status:
- **✓ Accepted** → Teal (bg-teal-100 text-teal-700)
- **✕ Rejected** → Red (bg-red-100 text-red-700)
- **⏳ Pending** → Yellow (bg-yellow-100 text-yellow-700)

## 🔍 API Function Signatures

```typescript
// Accept appointment
acceptAppointment(appointmentId: string): Promise<boolean>

// Reject appointment
rejectAppointment(appointmentId: string): Promise<boolean>

// Check-in appointment (only works if accepted)
checkInAppointment(appointmentId: string): Promise<boolean>

// All return:
// - true: Success
// - false: Failed
```

## 📊 State Transitions

```
Initial State:
  status: "scheduled"
  acceptanceStatus: undefined
  
→ Accept Clicked:
  status: "scheduled" (unchanged)
  acceptanceStatus: "accepted"
  acceptedAt: [timestamp]
  
→ Check-In Clicked (only if accepted):
  status: "confirmed"
  acceptanceStatus: "accepted" (unchanged)
  checkedInAt: [timestamp]
  
→ Complete Clicked:
  status: "completed"

Alternative Path:

→ Reject Clicked:
  status: "cancelled"
  acceptanceStatus: "rejected"
  rejectedAt: [timestamp]
  [END - no further actions]
```

## ⚠️ Important Rules

### Check-In Button Visibility:
1. ✅ **Shows when:**
   - `acceptanceStatus === 'accepted'`
   - `!checkedInAt` (not already checked in)

2. ❌ **Hidden when:**
   - Appointment not yet accepted
   - Appointment rejected
   - Already checked in
   - Status is cancelled/completed

### Acceptance Rules:
1. **Accept/Reject buttons only show ONCE**
   - Disappear after either action
   - Cannot be undone without manual database edit

2. **Rejected appointments:**
   - Automatically cancelled
   - No further actions available
   - Cannot be checked in

3. **Accepted appointments:**
   - Enable check-in functionality
   - Normal flow continues

## 🧪 Testing Checklist

### Manual Testing:
- [ ] Create new appointment
- [ ] Verify Accept/Reject buttons appear
- [ ] Click Accept
- [ ] Verify acceptance badge shows "✓ Accepted"
- [ ] Verify Check-In button appears
- [ ] Verify Accept/Reject buttons disappeared
- [ ] Click Check-In
- [ ] Verify status changes to "Confirmed"
- [ ] Verify timestamp shows check-in time
- [ ] Verify Check-In button disappeared
- [ ] Create another appointment
- [ ] Click Reject
- [ ] Verify status changes to "Cancelled"
- [ ] Verify acceptance badge shows "✕ Rejected"
- [ ] Verify Check-In button does NOT appear
- [ ] Verify no action buttons available

### Edge Cases:
- [ ] Multiple appointments same patient
- [ ] Concurrent accept/reject clicks
- [ ] Network errors during acceptance
- [ ] Browser refresh after accept
- [ ] Different admin users accepting

## 🔐 Firestore Security Rules

You may need to update Firestore rules to allow these operations:

```javascript
match /appointments/{appointmentId} {
  allow update: if request.auth != null
    && request.auth.token.role in ['admin', 'assistant']
    && (
      // Allow updating acceptanceStatus
      request.resource.data.acceptanceStatus in ['accepted', 'rejected']
      || 
      // Allow updating checkedInAt
      request.resource.data.checkedInAt is timestamp
    );
}
```

## 🎯 Benefits

✅ **Controlled Workflow** - Appointments must be approved before check-in
✅ **Clear Status** - Visual badges show acceptance state
✅ **Audit Trail** - Timestamps recorded for all actions
✅ **Prevent Errors** - Check-in only available for accepted appointments
✅ **Better Management** - Easy to reject unwanted appointments
✅ **User Friendly** - Intuitive icons and colors

## 🚀 Future Enhancements

Potential improvements:
- 📧 Email notification on accept/reject
- 📱 SMS notification to patient
- 🔄 Undo accept/reject action
- 📝 Rejection reason input
- 📊 Acceptance rate analytics
- ⏰ Auto-reject after timeout
- 🔔 Notify patient of check-in
- 📅 Bulk accept/reject

## 📞 Integration with Queue Management

This feature integrates seamlessly with the Queue Management check-in:

1. **Appointments Page:**
   - Admin accepts appointment
   - Admin checks in patient (creates queue entry)

2. **Queue Management Page:**
   - Shows pending check-ins (accepted appointments)
   - One-click check-in (creates queue entry)

Both paths lead to the same result: patient added to queue with proper timestamps.

---

**Version:** 1.0.0
**Status:** ✅ Production Ready
**Created:** October 2025

