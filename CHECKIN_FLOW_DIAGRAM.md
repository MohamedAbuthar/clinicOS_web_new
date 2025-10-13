# Patient Check-In Flow Diagram

## 📊 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PATIENT CHECK-IN SYSTEM                          │
└─────────────────────────────────────────────────────────────────────┘

                              ▼
                    
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: PATIENT BOOKS APPOINTMENT                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Patient → Book Appointment Page → Select Doctor & Time            │
│                                                                     │
│  Database: appointments collection                                 │
│  {                                                                  │
│    patientId: "pat_123",                                           │
│    doctorId: "doc_456",                                            │
│    appointmentDate: "2025-10-13",                                  │
│    appointmentTime: "10:00",                                       │
│    tokenNumber: "101",                                             │
│    status: "scheduled" ← Initial status                            │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘

                              ▼

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: PATIENT ARRIVES AT CLINIC                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Patient walks into clinic                                         │
│  Approaches reception desk                                         │
│  Provides appointment details or token number                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

                              ▼

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: RECEPTIONIST OPENS QUEUE MANAGEMENT                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Admin Dashboard → Queue Management                                │
│  Select Doctor from dropdown                                       │
│                                                                     │
│  UI Display:                                                       │
│  ┌────────────────────────────────────────────────────────┐       │
│  │ 👤 Pending Check-ins (3)                            ✕  │       │
│  ├────────────────────────────────────────────────────────┤       │
│  │  101  John Doe          10:00 AM     [Check In]       │       │
│  │  102  Jane Smith        10:30 AM     [Check In]       │       │
│  │  103  Bob Wilson        11:00 AM     [Check In]       │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                     │
│  System automatically fetches:                                     │
│  - All appointments for today                                      │
│  - For selected doctor                                             │
│  - With status = "scheduled"                                       │
│  - Not yet in queue                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

                              ▼

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: RECEPTIONIST CLICKS "CHECK IN"                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Click "Check In" button for Token 101 (John Doe)                  │
│                                                                     │
│  Frontend calls:                                                   │
│  checkInPatient(                                                   │
│    appointmentId: "apt_abc123",                                    │
│    patientId: "pat_123",                                           │
│    doctorId: "doc_456",                                            │
│    tokenNumber: "101"                                              │
│  )                                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

                              ▼

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: SYSTEM PROCESSES CHECK-IN                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  A. Calculate Queue Position:                                      │
│     - Query existing queue for doctor                              │
│     - Find max position (e.g., position = 2)                       │
│     - New position = 3                                             │
│                                                                     │
│  B. Create Queue Entry:                                            │
│     Database: queue collection                                     │
│     {                                                               │
│       appointmentId: "apt_abc123",                                 │
│       patientId: "pat_123",                                        │
│       doctorId: "doc_456",                                         │
│       tokenNumber: "101",                                          │
│       position: 3,                                                 │
│       status: "waiting",                                           │
│       arrivedAt: 2025-10-13T09:55:00Z,                            │
│       createdAt: 2025-10-13T09:55:00Z,                            │
│       updatedAt: 2025-10-13T09:55:00Z                             │
│     }                                                               │
│                                                                     │
│  C. Update Appointment:                                            │
│     Database: appointments collection                              │
│     {                                                               │
│       // ... existing fields                                       │
│       status: "confirmed", ← Changed from "scheduled"              │
│       checkedInAt: 2025-10-13T09:55:00Z, ← New field              │
│       updatedAt: 2025-10-13T09:55:00Z                             │
│     }                                                               │
│                                                                     │
│  D. Update Activity Log:                                           │
│     Display: "Patient 101 checked in and added to queue"          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

                              ▼

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6: UI UPDATES AUTOMATICALLY                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  A. Success Message Appears:                                       │
│     ┌──────────────────────────────────────────────────┐          │
│     │ ✓ Patient 101 checked in successfully           │          │
│     └──────────────────────────────────────────────────┘          │
│                                                                     │
│  B. Pending Check-ins Updates:                                     │
│     ┌────────────────────────────────────────────────────────┐   │
│     │ 👤 Pending Check-ins (2) ← Count decreased         ✕  │   │
│     ├────────────────────────────────────────────────────────┤   │
│     │  102  Jane Smith        10:30 AM     [Check In]       │   │
│     │  103  Bob Wilson        11:00 AM     [Check In]       │   │
│     └────────────────────────────────────────────────────────┘   │
│     Note: John Doe (101) removed from pending                     │
│                                                                     │
│  C. Waiting Queue Updates:                                         │
│     ┌────────────────────────────────────────────────────────┐   │
│     │ Waiting Queue (3)                                      │   │
│     ├────────────────────────────────────────────────────────┤   │
│     │ ☰  099  Mary Johnson    Waiting: 15 min  [Arrived]    │   │
│     │ ☰  100  Alice Brown     Waiting: 10 min  [Arrived]    │   │
│     │ ☰  101  John Doe        Waiting: 0 min   [Arrived]    │   │
│     └────────────────────────────────────────────────────────┘   │
│     Note: John Doe (101) now appears in queue                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

                              ▼

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 7: DOCTOR MANAGES QUEUE                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  When ready for next patient:                                      │
│  1. Click "Complete" for current patient                           │
│  2. System automatically calls next patient (099)                  │
│  3. Patient moves from "Waiting" to "Current"                      │
│  4. Process continues...                                            │
│                                                                     │
│  UI Display:                                                       │
│  ┌────────────────────────────────────────────────────────┐       │
│  │ Current Patient                              [Arrived] │       │
│  │                                                         │       │
│  │   099                                                   │       │
│  │   Mary Johnson                      [Complete]         │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐       │
│  │ Waiting Queue (2)                                      │       │
│  ├────────────────────────────────────────────────────────┤       │
│  │ ☰  100  Alice Brown     Waiting: 12 min  [Arrived]    │       │
│  │ ☰  101  John Doe        Waiting: 2 min   [Arrived]    │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

                              ▼

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 8: PATIENT'S TURN (TOKEN 101)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  After previous patients are done:                                 │
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐       │
│  │ Current Patient                              [Arrived] │       │
│  │                                                         │       │
│  │   101                                                   │       │
│  │   John Doe                          [Complete]         │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                     │
│  Database Update (when complete):                                  │
│  queue entry → status: "completed"                                 │
│  appointment → status: "completed"                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Auto-Refresh Mechanism

```
Every 30 seconds:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  getPendingCheckIns(doctorId, today) ─────┐               │
│                                             │               │
│  ┌──────────────────────────────────────┐  │               │
│  │ 1. Query appointments collection      │ ◄─┘              │
│  │    - doctorId = selected              │                 │
│  │    - appointmentDate = today          │                 │
│  │    - status = "scheduled"             │                 │
│  │    - sort by appointmentTime          │                 │
│  └──────────────────────────────────────┘                  │
│                 │                                           │
│                 ▼                                           │
│  ┌──────────────────────────────────────┐                  │
│  │ 2. Query queue collection            │                  │
│  │    - doctorId = selected              │                  │
│  │    - get all appointmentIds           │                  │
│  └──────────────────────────────────────┘                  │
│                 │                                           │
│                 ▼                                           │
│  ┌──────────────────────────────────────┐                  │
│  │ 3. Filter out already queued         │                  │
│  │    appointments.filter(apt =>         │                  │
│  │      !queueIds.includes(apt.id)       │                  │
│  │    )                                  │                  │
│  └──────────────────────────────────────┘                  │
│                 │                                           │
│                 ▼                                           │
│  ┌──────────────────────────────────────┐                  │
│  │ 4. Update UI with pending list       │                  │
│  │    setPendingCheckIns(filtered)       │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Decision Points

### 1. Queue Position Assignment
```
┌─────────────────────────────────────────┐
│ Check-in for Token 104                  │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Query current queue:                    │
│ - Token 101 (position 1, waiting)      │
│ - Token 102 (position 2, waiting)      │
│ - Token 103 (position 3, waiting)      │
│ Max position = 3                        │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Assign new position:                    │
│ Token 104 → position = 4                │
└─────────────────────────────────────────┘
```

### 2. Status Transitions
```
Appointment Status Flow:
┌───────────┐   Check In   ┌───────────┐   Call Next   ┌───────────┐
│           │ ───────────> │           │ ────────────> │           │
│ scheduled │              │ confirmed │               │   N/A     │
│           │              │           │               │           │
└───────────┘              └───────────┘               └───────────┘

Queue Status Flow:
┌───────────┐   Call Next   ┌───────────┐   Complete   ┌───────────┐
│           │ ────────────> │           │ ───────────> │           │
│  waiting  │               │  current  │              │ completed │
│           │               │           │              │           │
└───────────┘               └───────────┘              └───────────┘
      │                                                       ▲
      │                      Skip                             │
      └───────────────────────────────────────────────────────┘
```

### 3. Error Handling
```
Check-in Process:
┌─────────────────────────────────────────┐
│ Click "Check In" button                 │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Validate:                               │
│ ✓ Doctor selected?                      │
│ ✓ Appointment exists?                   │
│ ✓ Not already in queue?                 │
└─────────────────────────────────────────┘
              │
         ┌────┴────┐
         │         │
    ✓ YES     ✗ NO
         │         │
         ▼         ▼
┌────────────┐ ┌────────────┐
│ Process    │ │ Show Error │
│ Check-in   │ │ Message    │
└────────────┘ └────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Try: Create queue + Update appointment  │
│                                         │
│ Catch: Show error message               │
│        Log to console                   │
│        Rollback if needed               │
└─────────────────────────────────────────┘
```

## 📱 User Experience Flow

```
Receptionist View:
┌─────────────────────────────────────────────────────────────┐
│                      QUEUE MANAGEMENT                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Select Doctor ▼] Dr. Smith                               │
│                                                             │
│  ╔═══════════════════════════════════════════════════╗    │
│  ║ 👤 Pending Check-ins (3)                       ✕  ║    │
│  ╠═══════════════════════════════════════════════════╣    │
│  ║                                                    ║    │
│  ║  ┌────┐                                           ║    │
│  ║  │101 │ John Doe - 10:00 AM    [Check In] ◄─────╋─── Click here
│  ║  └────┘                                           ║    │
│  ║                                                    ║    │
│  ║  ┌────┐                                           ║    │
│  ║  │102 │ Jane Smith - 10:30 AM  [Check In]        ║    │
│  ║  └────┘                                           ║    │
│  ║                                                    ║    │
│  ╚═══════════════════════════════════════════════════╝    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Current Patient                          [Arrived] │   │
│  │  100 - Mary Johnson              [Complete]        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Waiting Queue (2)                                  │   │
│  │  ☰ 099 - Bob Wilson      5 min   [Arrived] [Skip] │   │
│  │  ☰ 098 - Alice Brown     8 min   [Arrived] [Skip] │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

After Check-in:
┌─────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────┐    │
│  │ ✓ Patient 101 checked in successfully             │ ◄── Success message
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ╔═══════════════════════════════════════════════════╗    │
│  ║ 👤 Pending Check-ins (2) ◄─── Count decreased     ║    │
│  ╠═══════════════════════════════════════════════════╣    │
│  ║  ┌────┐                                           ║    │
│  ║  │102 │ Jane Smith - 10:30 AM  [Check In]        ║    │
│  ║  └────┘                                           ║    │
│  ╚═══════════════════════════════════════════════════╝    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Waiting Queue (3) ◄─── Count increased            │   │
│  │  ☰ 101 - John Doe        0 min   [Arrived] [Skip] │ ◄─ Added!
│  │  ☰ 099 - Bob Wilson      7 min   [Arrived] [Skip] │   │
│  │  ☰ 098 - Alice Brown    10 min   [Arrived] [Skip] │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎬 Animation Sequence

```
Check-in Button Click:
┌──────────────┐
│  Check In    │  ← Default state
└──────────────┘

      ↓ (click)

┌──────────────┐
│ ⟳ Check In   │  ← Loading state (spinner)
└──────────────┘

      ↓ (processing... 500ms-2s)

┌──────────────┐
│  ✓ Checked   │  ← Brief success state (200ms)
└──────────────┘

      ↓ (disappears from pending list)

Card fades out and slides up
Queue updates with new entry fading in
```

---

**Visual Guide Version:** 1.0
**Last Updated:** October 13, 2025

