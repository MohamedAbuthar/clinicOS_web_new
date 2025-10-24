# 📧 Assistant Password Email Feature

## Overview
When you add a new assistant in the Admin Portal, the system automatically sends their login credentials (email and password) to their email address. This feature works similarly to the OTP email system already in place.

## ✨ Features
- **Automatic Email Sending**: Password is automatically emailed when assistant is created
- **Professional Email Template**: Beautiful HTML email with branding
- **Retry Logic**: Automatically retries up to 2 times if email fails
- **User Feedback**: Clear success/error messages for admin
- **Secure**: Uses Gmail SMTP with app-specific passwords

---

## 🚀 How It Works

### 1. **When Admin Adds Assistant**
```
Admin fills form → Creates assistant → System sends email with credentials
```

### 2. **Email Contains**
- Welcome message
- Login email
- Login password
- Security reminder
- Professional branding

### 3. **Flow Diagram**
```
┌─────────────────┐
│  Admin Portal   │
│  Add Assistant  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Assistant│
│   in Firestore  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Send Password  │
│   via Email     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Assistant     │
│  Receives Email │
└─────────────────┘
```

---

## 📁 Files Created/Modified

### **New Files Created:**

1. **API Route** - `/src/app/api/assistant/send-password/route.ts`
   - Handles sending password emails via Gmail SMTP
   - Uses nodemailer with HTML email template
   - Error handling and validation

2. **Service File** - `/src/lib/services/assistantPasswordService.ts`
   - Frontend service to call the API
   - Includes retry logic (up to 2 retries)
   - Type-safe interface

### **Modified Files:**

3. **Assistant Component** - `/src/compnent/Admin/Assistant/assistant.tsx`
   - Updated `handleAddSubmit` to send email after creating assistant
   - Added import for password email service
   - Enhanced success/error messages
   - Added visual indicator that password will be emailed

---

## ⚙️ Setup Instructions

### Prerequisites
You must have Gmail SMTP configured in your `.env.local` file. This is the same setup used for OTP emails.

### Step 1: Environment Variables
Create or update `.env.local` in your project root:

```env
SMTP_EMAIL=your-email@gmail.com
SMTP_APP_PASSWORD=your-app-specific-password
```

### Step 2: Get Gmail App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification** → **App Passwords**
3. Generate a new app password for "Mail"
4. Copy the 16-character password (spaces will be removed automatically)
5. Add it to `.env.local`

### Step 3: Restart Development Server
```bash
npm run dev
# or
pnpm dev
```

---

## 📝 Usage

### Adding an Assistant

1. **Navigate to Admin Portal**
   ```
   Admin → Assistants → Add Assistant
   ```

2. **Fill in the Form**
   - Full Name ✅
   - Email ✅
   - Phone ✅
   - Password ✅ (Will be sent to email)
   - Role
   - Assigned Doctors (optional)

3. **Click "Add Assistant"**
   - System creates assistant
   - Automatically sends email with credentials
   - Shows success message

### Success Messages

**Email Sent Successfully:**
```
✅ "Assistant created successfully! Login credentials sent to their email."
```

**Email Failed (Assistant still created):**
```
⚠️ "Assistant created successfully, but failed to send email. Please share credentials manually."
```

---

## 📧 Email Template Preview

### Subject Line
```
Welcome to ClinicOS - Your Login Credentials
```

### Email Content
```
🏥 Welcome to ClinicOS!

Hello [Assistant Name],

You have been added as an Assistant to the ClinicOS Admin Portal.

Your Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: assistant@example.com
Password: SecurePass123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Important: Please keep this password secure and change it after your first login.

Best regards,
ClinicOS Team
```

---

## 🔧 Code Examples

### Sending Password Email (Manual)
If you need to manually send credentials:

```typescript
import { sendPasswordEmailWithRetry } from '@/lib/services/assistantPasswordService';

// Send with retry logic
const result = await sendPasswordEmailWithRetry(
  'assistant@example.com',
  'SecurePassword123',
  'John Doe'
);

if (result.success) {
  console.log('Email sent successfully');
} else {
  console.error('Failed:', result.message);
}
```

### Basic Send (No Retry)
```typescript
import { sendPasswordEmail } from '@/lib/services/assistantPasswordService';

const result = await sendPasswordEmail(
  'assistant@example.com',
  'SecurePassword123',
  'John Doe'
);
```

---

## 🛠️ Troubleshooting

### Email Not Sending

**1. Check Environment Variables**
```bash
# Verify .env.local exists and has correct values
cat .env.local | grep SMTP
```

**2. Check Gmail Settings**
- 2-Step Verification is enabled
- App Password is correctly generated
- Less secure app access is NOT needed (we use app passwords)

**3. Check Console Logs**
Open browser console (F12) and look for:
```
📧 Sending login credentials via email...
✅ Login credentials sent to assistant@example.com
```

**4. Common Errors**

| Error | Solution |
|-------|----------|
| "SMTP credentials not configured" | Add `SMTP_EMAIL` and `SMTP_APP_PASSWORD` to `.env.local` |
| "Invalid email format" | Check email address is valid |
| "Failed to send email: Invalid login" | Regenerate Gmail app password |
| "Connection timeout" | Check internet connection |

### Still Not Working?

1. **Restart Dev Server**: Always restart after changing `.env.local`
   ```bash
   # Stop server (Ctrl+C) then restart
   npm run dev
   ```

2. **Test with Different Email**: Try sending to a different email address

3. **Check Spam Folder**: Email might be in spam/junk folder

4. **Verify API Route**: Test the API directly:
   ```bash
   curl -X POST http://localhost:3000/api/assistant/send-password \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPass123",
       "name": "Test User"
     }'
   ```

---

## 🔒 Security Considerations

### ✅ Best Practices Implemented
- Password sent over HTTPS (in production)
- Email sent via secure SMTP (port 465)
- Encourages password change on first login
- Credentials stored securely in environment variables

### ⚠️ Recommendations
1. **Use Strong Passwords**: Generate complex passwords for assistants
2. **Encourage Password Change**: Remind assistants to change password after first login
3. **Monitor Email Logs**: Check for failed email attempts
4. **Rotate App Passwords**: Periodically regenerate Gmail app passwords

---

## 📊 Testing Checklist

- [ ] Environment variables configured
- [ ] Can create assistant successfully
- [ ] Email received in inbox
- [ ] Email contains correct credentials
- [ ] Can login with emailed credentials
- [ ] Error handling works (try with invalid email)
- [ ] Success message displays correctly
- [ ] Retry logic works (temporarily disable internet)

---

## 🚀 Production Deployment

### Vercel / Netlify
Add environment variables in dashboard:
```
SMTP_EMAIL=your-email@gmail.com
SMTP_APP_PASSWORD=your-app-password
```

### Firebase Hosting
If using Firebase Functions:
```bash
firebase functions:config:set smtp.email="your-email@gmail.com"
firebase functions:config:set smtp.password="your-app-password"
```

---

## 📞 Support

If you encounter issues:
1. Check this documentation
2. Review console logs
3. Verify Gmail SMTP settings
4. Test with the OTP email (same SMTP setup)

---

## 📝 Change Log

### v1.0.0 (Initial Release)
- ✅ Created API endpoint for password emails
- ✅ Added retry logic service
- ✅ Integrated with assistant creation flow
- ✅ Added professional email template
- ✅ Added user feedback messages
- ✅ Added visual indicator in form

---

**Built with ❤️ for ClinicOS**

*Last updated: October 24, 2025*

