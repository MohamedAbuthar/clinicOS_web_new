# Staff Login Guide - ClinicOS Admin Portal

## Overview
The ClinicOS Admin Portal now supports multiple user roles: **Administrators**, **Doctors**, and **Assistants**. All staff members can login to the admin portal and access the same data and features.

## User Roles

### 🔧 Administrator
- **Access**: Full system access
- **Features**: All admin features, user management, system settings
- **Default**: Can create other users

### 👨‍⚕️ Doctor  
- **Access**: Full admin portal access
- **Features**: View all appointments, manage queues, access patient data
- **Use Case**: Doctors can manage their own schedules and patient queues

### 👩‍💼 Assistant
- **Access**: Full admin portal access  
- **Features**: View all appointments, manage queues, assist with patient management
- **Use Case**: Reception staff can manage appointments and queues

## How to Create Staff Users

### Method 1: Using the Admin Portal (Recommended)

1. **Login as Admin**: Go to `/auth-login` and login with admin credentials
2. **Go to Settings**: Navigate to Admin → Settings
3. **Create Test Users**: Click "Create Test Users" button
4. **Check Console**: View the browser console for created user credentials

### Method 2: Manual Signup

1. **Go to Login Page**: Navigate to `/auth-login`
2. **Switch to Signup**: Click the "Sign Up" tab
3. **Fill Form**: 
   - Full Name
   - Email
   - Phone Number
   - **Role** (select from dropdown: Administrator, Doctor, or Assistant)
   - Password
4. **Create Account**: Click "Create Account"
5. **Login**: Use the new credentials to login

## Test User Credentials

After creating test users, you can use these credentials:

```
ADMIN: admin@clinic.com / admin123
DOCTOR: doctor1@clinic.com / doctor123  
DOCTOR: doctor2@clinic.com / doctor123
ASSISTANT: assistant1@clinic.com / assistant123
ASSISTANT: assistant2@clinic.com / assistant123
```

## Features Available to All Staff

### ✅ What All Staff Can Access:
- **Dashboard**: Overview of appointments and statistics
- **Appointments**: View and manage all appointments
- **Queue Management**: Manage patient queues with drag & drop
- **Doctors**: View doctor information and schedules
- **Assistants**: View assistant information
- **Schedule**: View and manage schedules
- **Reports**: Access system reports
- **Settings**: System settings and user management

### 🔄 Real-time Data:
- All staff see the same real-time data
- Changes made by one staff member are immediately visible to others
- Queue changes sync across all logged-in users

## User Interface Updates

### Dynamic User Display:
- **Sidebar**: Shows actual user name and role
- **Header**: Displays current user name and role
- **Avatar**: Shows first letter of user's name
- **Date**: Shows current date dynamically

### Role-based Styling:
- User role is displayed in the sidebar and header
- Avatar shows user's initial
- All UI elements adapt to show the logged-in user's information

## Security & Authentication

### Authentication Flow:
1. User enters email/password
2. System checks if user exists in Firebase Auth
3. System fetches user profile from Firestore
4. System verifies user has valid role (admin/doctor/assistant)
5. User is granted access to admin portal

### Role Verification:
- Only users with roles: `admin`, `doctor`, or `assistant` can access the portal
- Other roles (like `patient`) are automatically redirected
- Invalid users are logged out immediately

## Troubleshooting

### Common Issues:

**"User is not authorized"**
- Check if user has correct role in Firestore
- Ensure role is one of: admin, doctor, assistant

**"User profile not found"**
- User exists in Firebase Auth but not in Firestore
- Create user profile in Firestore with correct role

**Login fails**
- Check email/password combination
- Ensure user account is active
- Check browser console for detailed error messages

### Getting Help:
1. Check browser console for error messages
2. Verify user exists in Firebase Auth
3. Verify user profile exists in Firestore with correct role
4. Try creating new test users using the Settings page

## Next Steps

1. **Create Test Users**: Use the Settings page to create sample users
2. **Test Different Roles**: Login with different user types to verify access
3. **Train Staff**: Show staff how to use the admin portal
4. **Customize**: Modify user roles or add new features as needed

---

**Note**: All staff members have the same level of access to ensure smooth collaboration and data consistency across the clinic.
