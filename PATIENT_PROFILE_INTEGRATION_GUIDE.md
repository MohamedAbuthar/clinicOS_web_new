# Patient Profile Integration Guide

## Overview
Complete integration for patient profile viewing and editing with backend API connectivity.

## What's Implemented

### ✅ Frontend Components
1. **Custom Hook**: `usePatientProfile.ts` - Manages profile state and API calls
2. **Profile Component**: `profile-with-edit.tsx` - Full-featured profile page with edit mode
3. **API Integration**: Connected to backend endpoints for read/update operations

### ✅ Features
- 🔍 **View Profile**: Display all patient information
- ✏️ **Edit Mode**: Toggle between view and edit modes
- 💾 **Save Changes**: Update profile data with validation
- 🔄 **Real-time Sync**: Automatically sync with backend
- ✅ **Validation**: Client-side and server-side validation
- 📊 **BMI Calculator**: Auto-calculate BMI from height/weight
- 🎨 **Modern UI**: Clean, responsive design
- 🔐 **Authentication**: Protected routes with token validation

## File Structure

```
src/
├── lib/
│   ├── hooks/
│   │   └── usePatientProfile.ts          # Profile management hook
│   ├── contexts/
│   │   └── PatientAuthContext.tsx        # Authentication context (updated)
│   └── api.ts                            # API client (already has profile methods)
├── compnent/
│   └── Patient/
│       └── patient-Profile/
│           ├── profile.tsx               # Old profile (mock data)
│           └── profile-with-edit.tsx     # New profile (real API)
└── app/
    └── Patient/
        └── profile/
            └── page.tsx                  # Profile page (updated to use new component)
```

## How to Use

### 1. Navigate to Profile
```
http://localhost:3000/Patient/profile
```

### 2. View Profile
- Automatically loads authenticated patient's data
- Shows personal, contact, and medical information
- Displays calculated BMI if height and weight are provided
- Shows age calculated from date of birth

### 3. Edit Profile
1. Click **"Edit Profile"** button
2. Edit any field:
   - Name, email, phone, address
   - Blood group (dropdown)
   - Height, weight (auto-calculates BMI)
   - Allergies, chronic conditions
3. Click **"Save Changes"** to update
4. Click **"Cancel"** to discard changes

### 4. Validation
Automatic validation for:
- Name: Minimum 2 characters
- Email: Valid email format
- Phone: 10-digit number
- Height: 50-300 cm
- Weight: 10-500 kg

## API Endpoints

### Get Profile
```http
GET /api/patient/dashboard/profile
Authorization: Bearer <patientToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "patient-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "address": "123 Main St",
    "bloodGroup": "O+",
    "height": 175,
    "weight": 70,
    "allergies": "None",
    "chronicConditions": "None",
    "isActive": true
  },
  "message": "Patient profile retrieved successfully"
}
```

### Update Profile
```http
PUT /api/patient/dashboard/profile
Authorization: Bearer <patientToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "9876543211",
  "address": "456 New St",
  "bloodGroup": "A+",
  "height": 180,
  "weight": 75,
  "allergies": "Penicillin",
  "chronicConditions": "None"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Updated patient object
  },
  "message": "Patient profile updated successfully"
}
```

## usePatientProfile Hook API

### Usage
```typescript
import { usePatientProfile } from '@/lib/hooks/usePatientProfile';

function MyComponent() {
  const {
    profile,          // Current profile data
    isLoading,        // Loading state
    error,            // Error message
    isEditing,        // Edit mode state
    updateProfile,    // Update function
    refreshProfile,   // Refresh from API
    setIsEditing,     // Toggle edit mode
  } = usePatientProfile();

  // Example: Update profile
  const handleUpdate = async () => {
    try {
      await updateProfile({
        name: 'New Name',
        phone: '1234567890'
      });
      // Success! Profile updated
    } catch (error) {
      // Handle error
    }
  };
}
```

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `profile` | `Patient \| null` | Current patient profile data |
| `isLoading` | `boolean` | True when fetching or updating |
| `error` | `string \| null` | Error message if operation failed |
| `isEditing` | `boolean` | Current edit mode state |
| `updateProfile` | `(updates) => Promise<void>` | Update profile function |
| `refreshProfile` | `() => Promise<void>` | Reload profile from API |
| `setIsEditing` | `(editing) => void` | Toggle edit mode |

## Component Features

### Profile Display
- ✅ Profile header with avatar
- ✅ Personal information (name, DOB, gender, age)
- ✅ Contact information (phone, email, address)
- ✅ Medical information (blood group, height, weight, BMI, allergies, chronic conditions)
- ✅ Calculated fields (BMI, age)
- ✅ Empty state handling

### Edit Mode
- ✅ Inline editing for all editable fields
- ✅ Dropdowns for constrained values (blood group)
- ✅ Number inputs for height/weight
- ✅ Textarea for long text (address, allergies, conditions)
- ✅ Real-time BMI calculation
- ✅ Form validation
- ✅ Save/Cancel buttons

### Error Handling
- ✅ Display validation errors
- ✅ Display API errors
- ✅ Retry mechanism for failed loads
- ✅ Success messages

### Loading States
- ✅ Initial load spinner
- ✅ Save operation loader
- ✅ Disabled state during saves

## Testing

### Manual Test Flow

1. **Start Backend**
   ```bash
   cd ~/Desktop/clinic_os_backend
   npm start
   ```

2. **Start Frontend**
   ```bash
   cd ~/Downloads/clinic_os_web_new-main
   npm run dev
   ```

3. **Login as Patient**
   - Go to http://localhost:3000/Auth-patientLogin
   - Email: `john.doe@example.com`
   - OTP: `123456`

4. **Navigate to Profile**
   - Go to http://localhost:3000/Patient/profile
   - Should see your profile data

5. **Test Viewing**
   - ✅ All fields display correctly
   - ✅ BMI calculated if height/weight exist
   - ✅ Age calculated from DOB

6. **Test Editing**
   - Click "Edit Profile"
   - Change name to "Test Patient Updated"
   - Change email to "test.updated@example.com"
   - Change height to 180
   - Change weight to 75
   - Click "Save Changes"
   - ✅ Should see success message
   - ✅ BMI should update automatically
   - ✅ Changes should persist on page refresh

7. **Test Validation**
   - Click "Edit Profile"
   - Clear name field
   - Click "Save Changes"
   - ✅ Should show validation error
   - Enter invalid email
   - Click "Save Changes"
   - ✅ Should show email format error

8. **Test Cancel**
   - Click "Edit Profile"
   - Change some fields
   - Click "Cancel"
   - ✅ Should revert to original values
   - ✅ Should exit edit mode

### Test with cURL

```bash
# 1. Get profile
curl http://localhost:4000/api/patient/dashboard/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 2. Update profile
curl -X PUT http://localhost:4000/api/patient/dashboard/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Updated Name",
    "phone": "9876543211",
    "height": 180,
    "weight": 75
  }'
```

## Validation Rules

### Client-Side (Frontend)
- Name: Minimum 2 characters
- Email: Valid email format (regex)
- Phone: 10 digits
- Height: 50-300 cm
- Weight: 10-500 kg

### Server-Side (Backend)
```javascript
updatePatient: Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
  email: Joi.string().email().allow('').optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  address: Joi.string().max(500).allow('').optional(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow('').optional(),
  height: Joi.number().positive().max(300).optional(),
  weight: Joi.number().positive().max(500).optional(),
  allergies: Joi.string().max(1000).allow('').optional(),
  chronicConditions: Joi.string().max(1000).allow('').optional()
})
```

## Architecture

### Data Flow

```
┌────────────────────────┐
│   Profile Component    │
│  (profile-with-edit)   │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  usePatientProfile     │
│  (Custom Hook)         │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  patientDashboardApi   │
│  (API Client)          │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Backend API           │
│  /patient/dashboard    │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  PatientDashboard      │
│  Controller            │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  UserService           │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  PatientRepository     │
│  (Database)            │
└────────────────────────┘
```

### State Management

```
┌─────────────────────────┐
│  PatientAuthContext     │ ← Global auth state
│  - patient              │
│  - token                │
│  - isAuthenticated      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  usePatientProfile      │ ← Profile-specific state
│  - profile (local copy) │
│  - isLoading            │
│  - error                │
│  - isEditing            │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Profile Component      │ ← UI state
│  - formData             │
│  - successMessage       │
│  - errorMessage         │
└─────────────────────────┘
```

## Troubleshooting

### Issue: Profile not loading
**Solution:**
1. Check if logged in: `localStorage.getItem('patientToken')`
2. Check backend is running
3. Check console for errors
4. Try refreshing profile manually

### Issue: Updates not saving
**Solution:**
1. Check validation errors
2. Check network tab for API errors
3. Verify token is valid
4. Check backend logs

### Issue: BMI not calculating
**Solution:**
- Both height and weight must be provided
- Height must be in cm
- Weight must be in kg

### Issue: Changes don't persist after refresh
**Solution:**
- Changes should call `refreshPatient()` to update auth context
- Clear browser cache if seeing old data

## Security

### Authentication
- ✅ All profile endpoints require authentication
- ✅ Token validated on every request
- ✅ Patient can only access their own profile

### Validation
- ✅ Client-side validation for UX
- ✅ Server-side validation for security
- ✅ SQL injection protection (parameterized queries)

### Authorization
- ✅ Patient ID extracted from JWT token
- ✅ Cannot update other patient's profiles
- ✅ Cannot change immutable fields (ID, creation date)

## Next Steps

### Recommended Enhancements
1. **Profile Picture**: Add avatar upload functionality
2. **Family Members**: Implement family member management
3. **Emergency Contacts**: Dedicated section for emergency contacts
4. **Medical History**: Link to medical records
5. **Password Change**: Add password update functionality
6. **Delete Account**: Account deletion with confirmation
7. **Activity Log**: Show profile update history
8. **Email Verification**: Verify email changes
9. **Phone Verification**: OTP for phone number changes

### Performance
1. **Caching**: Cache profile data with TTL
2. **Optimistic Updates**: Update UI before API response
3. **Debouncing**: Debounce form inputs
4. **Lazy Loading**: Load sections on demand

## Summary

✅ **Profile Viewing**: Complete
✅ **Profile Editing**: Complete
✅ **API Integration**: Complete
✅ **Validation**: Complete
✅ **Error Handling**: Complete
✅ **Loading States**: Complete
✅ **Authentication**: Complete
✅ **Responsive Design**: Complete

**Status**: Ready for use! 🎉

---

Need help? Check the code comments or test with the provided cURL commands.

