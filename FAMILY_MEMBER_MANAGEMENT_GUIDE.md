# Family Member Management Guide

## Overview
Complete CRUD (Create, Read, Update, Delete) implementation for managing family members in the patient profile.

## ✅ What's Implemented

### Backend
1. **Family Member Controller** (`patientFamilyController.ts`)
   - Get all family members
   - Add new family member
   - Get specific family member
   - Update family member
   - Delete family member

2. **API Routes** (`/api/patient/family`)
   - GET `/` - List all family members
   - POST `/` - Add new member
   - GET `/:memberId` - Get member details
   - PUT `/:memberId` - Update member
   - DELETE `/:memberId` - Remove member

3. **Security**
   - All endpoints require patient authentication
   - Family ID-based access control
   - Cannot delete yourself
   - Validates family membership

### Frontend
1. **Custom Hook** (`useFamilyMembers.ts`)
   - State management for family members
   - CRUD operations
   - Error handling
   - Auto-refresh on auth

2. **UI Components**
   - Family members list with cards
   - Add member modal
   - Edit member modal
   - Delete confirmation modal
   - Empty state handling

3. **Features**
   - ✅ View all family members
   - ✅ Add new family member
   - ✅ Edit member details
   - ✅ Delete member with confirmation
   - ✅ Real-time updates
   - ✅ Form validation
   - ✅ Success/error messages
   - ✅ Loading states

## How It Works

### Data Structure
```typescript
interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  allergies?: string;
  chronicConditions?: string;
  familyId?: string;  // Links family members
  isActive: boolean;
}
```

### Family Linking
- Each patient has a `familyId` field
- When adding first family member, a UUID is generated as `familyId`
- Primary patient gets the family ID
- All family members share the same `familyId`
- Family members are stored as separate patient records

## Usage Guide

### 1. View Family Members
Navigate to: `http://localhost:3000/Patient/profile`

The family members section automatically loads below your profile information.

**Empty State:**
- Shows message "No family members added yet"
- Click "Add Member" button to add first member

**With Members:**
- Shows list of all family members
- Each card displays:
  - Name
  - Age (calculated from DOB)
  - Gender
  - Phone (if provided)
  - Blood group (if provided)
- Edit and Delete buttons on each card

### 2. Add Family Member

**Steps:**
1. Click **"Add Member"** button
2. Fill in required fields:
   - Full Name *
   - Date of Birth *
   - Gender *
3. Optional fields:
   - Phone Number
   - Email
   - Blood Group
   - Height & Weight
   - Allergies
   - Chronic Conditions
4. Click **"Add Member"**

**Validation:**
- Name: Minimum 2 characters (required)
- Date of Birth: Required, cannot be future date
- Gender: Required

**Success:**
- Member added to list immediately
- Success message displayed
- Modal closes automatically

### 3. Edit Family Member

**Steps:**
1. Click **Edit icon** (pencil) on member card
2. Modal opens with current information
3. Modify any field
4. Click **"Update Member"**

**Validation:**
- Same as add member validation

**Success:**
- Member updated in list immediately
- Success message displayed
- Modal closes automatically

### 4. Delete Family Member

**Steps:**
1. Click **Delete icon** (trash) on member card
2. Confirmation modal appears
3. Review member name
4. Click **"Remove"** to confirm or **"Cancel"** to abort

**Protection:**
- Cannot delete yourself (primary patient)
- Requires explicit confirmation
- Shows warning message

**Success:**
- Member removed from list immediately
- Success message displayed
- Modal closes automatically

## API Endpoints

### Get Family Members
```http
GET /api/patient/family
Authorization: Bearer <patientToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "member-uuid",
      "name": "Jane Doe",
      "dateOfBirth": "1995-05-15",
      "gender": "female",
      "phone": "9876543210",
      "bloodGroup": "A+",
      ...
    }
  ],
  "message": "Family members retrieved successfully"
}
```

### Add Family Member
```http
POST /api/patient/family
Authorization: Bearer <patientToken>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Jane Doe",
  "dateOfBirth": "1995-05-15",
  "gender": "female",
  "phone": "9876543210",
  "email": "jane@example.com",
  "bloodGroup": "A+",
  "height": 165,
  "weight": 60,
  "allergies": "None",
  "chronicConditions": "None"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-member-uuid",
    "name": "Jane Doe",
    ...
  },
  "message": "Family member added successfully"
}
```

### Update Family Member
```http
PUT /api/patient/family/:memberId
Authorization: Bearer <patientToken>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Jane Smith",
  "phone": "9876543211",
  "bloodGroup": "O+"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "member-uuid",
    "name": "Jane Smith",
    ...
  },
  "message": "Family member updated successfully"
}
```

### Delete Family Member
```http
DELETE /api/patient/family/:memberId
Authorization: Bearer <patientToken>
```

**Response:**
```json
{
  "success": true,
  "message": "Family member deleted successfully"
}
```

## useFamilyMembers Hook API

### Usage
```typescript
import { useFamilyMembers } from '@/lib/hooks/useFamilyMembers';

function MyComponent() {
  const {
    familyMembers,    // Array of family members
    isLoading,        // Loading state
    error,            // Error message
    addMember,        // Add function
    updateMember,     // Update function
    deleteMember,     // Delete function
    refreshMembers,   // Refresh from API
    getMember,        // Get by ID
  } = useFamilyMembers();

  // Example: Add member
  const handleAdd = async () => {
    try {
      await addMember({
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male'
      });
      // Success! Member added
    } catch (error) {
      // Handle error
    }
  };
}
```

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `familyMembers` | `Patient[]` | Array of family members |
| `isLoading` | `boolean` | True during API operations |
| `error` | `string \| null` | Error message if operation failed |
| `addMember` | `(data) => Promise<void>` | Add new family member |
| `updateMember` | `(id, updates) => Promise<void>` | Update family member |
| `deleteMember` | `(id) => Promise<void>` | Delete family member |
| `refreshMembers` | `() => Promise<void>` | Reload from API |
| `getMember` | `(id) => Patient \| undefined` | Get member by ID |

## Testing

### Manual Test Flow

1. **Start Services**
   ```bash
   # Backend
   cd ~/Desktop/clinic_os_backend
   npm start

   # Frontend
   cd ~/Downloads/clinic_os_web_new-main
   npm run dev
   ```

2. **Login**
   - Go to http://localhost:3000/Auth-patientLogin
   - Email: `john.doe@example.com`
   - OTP: `123456`

3. **Navigate to Profile**
   - Go to http://localhost:3000/Patient/profile
   - Scroll to "Family Members" section

4. **Test Add Member**
   - Click "Add Member"
   - Fill form:
     - Name: "Jane Doe"
     - DOB: "1995-05-15"
     - Gender: "Female"
     - Phone: "9876543210"
     - Blood: "A+"
   - Click "Add Member"
   - ✅ Member should appear in list
   - ✅ Success message shown

5. **Test Edit Member**
   - Click Edit icon on Jane's card
   - Change name to "Jane Smith"
   - Change blood to "O+"
   - Click "Update Member"
   - ✅ Card updates immediately
   - ✅ Success message shown

6. **Test Delete Member**
   - Click Delete icon on Jane's card
   - Read confirmation message
   - Click "Remove"
   - ✅ Card disappears immediately
   - ✅ Success message shown

7. **Test Validation**
   - Click "Add Member"
   - Leave name empty
   - Click "Add Member"
   - ✅ Shows validation error
   - Enter 1 character in name
   - ✅ Shows "minimum 2 characters" error

8. **Test Page Refresh**
   - Add a family member
   - Refresh page (F5)
   - ✅ Family member still appears

### Test with cURL

```bash
# 1. Get family members
curl http://localhost:4000/api/patient/family \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Add family member
curl -X POST http://localhost:4000/api/patient/family \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Jane Doe",
    "dateOfBirth": "1995-05-15",
    "gender": "female",
    "phone": "9876543210",
    "bloodGroup": "A+"
  }'

# 3. Update family member
curl -X PUT http://localhost:4000/api/patient/family/MEMBER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Jane Smith",
    "bloodGroup": "O+"
  }'

# 4. Delete family member
curl -X DELETE http://localhost:4000/api/patient/family/MEMBER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Architecture

### Data Flow
```
┌─────────────────────────┐
│  Profile Component      │
│  (UI)                   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  useFamilyMembers Hook  │
│  (State Management)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  patientFamilyApi       │
│  (API Client)           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Backend API            │
│  /patient/family        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  PatientFamilyController│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  UserService            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  PatientRepository      │
│  (Database)             │
└─────────────────────────┘
```

### Security Flow
```
┌─────────────────────────┐
│  Patient Request        │
│  with Token             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  authenticatePatient    │
│  Token Middleware       │
│  - Verifies JWT         │
│  - Extracts patientId   │
│  - Checks type='patient'│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  PatientFamily          │
│  Controller             │
│  - Get patient's        │
│    familyId             │
│  - Verify membership    │
│  - Perform operation    │
└─────────────────────────┘
```

## Files Created/Modified

### Backend
- ✅ `src/controllers/patientFamilyController.ts` - New
- ✅ `src/routes/patientFamilyRoutes.ts` - New
- ✅ `src/app.ts` - Updated (added routes)

### Frontend
- ✅ `src/lib/hooks/useFamilyMembers.ts` - New
- ✅ `src/lib/api.ts` - Updated (added patientFamilyApi)
- ✅ `src/compnent/Patient/patient-Profile/profile-with-edit.tsx` - Updated (added family UI)

## Troubleshooting

### Issue: Family members not loading
**Solution:**
1. Check if logged in
2. Check backend is running
3. Check console for errors
4. Try refreshing: Click profile, then refresh

### Issue: Cannot add member
**Solution:**
1. Check all required fields filled
2. Check date format (YYYY-MM-DD)
3. Check console for API errors
4. Verify token is valid

### Issue: Cannot delete member
**Solution:**
- You cannot delete yourself (primary patient)
- Check if member exists
- Verify you have permission

### Issue: Changes don't persist
**Solution:**
1. Check network tab for successful API calls
2. Clear browser cache
3. Ensure backend database is running
4. Check backend logs for errors

## Summary

✅ **Create**: Complete - Add family members with full details
✅ **Read**: Complete - View all family members
✅ **Update**: Complete - Edit member information
✅ **Delete**: Complete - Remove members with confirmation
✅ **Validation**: Complete - Client and server-side
✅ **Security**: Complete - Token-based, family-scoped access
✅ **UI/UX**: Complete - Modern, responsive, intuitive

**Status**: Ready for use! 🎉

---

For more details, see:
- Profile Integration Guide: `PATIENT_PROFILE_INTEGRATION_GUIDE.md`
- Patient Auth Guide: `PATIENT_AUTH_FIXES.md`

