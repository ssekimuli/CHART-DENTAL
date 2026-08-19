# Authentication Pages Setup

Complete guide to using client-branded authentication pages for DentiChair.

## 📋 Available Components

| Component | Purpose | Path |
|-----------|---------|------|
| ClientBrandedLogin | Sign in page | `src/components/ClientBrandedLogin.tsx` |
| ClientBrandedForgotPassword | Forgot password | `src/components/ClientBrandedForgotPassword.tsx` |
| ClientBrandedResetPassword | Reset password (from email) | `src/components/ClientBrandedResetPassword.tsx` |

All components automatically show client-specific branding (name, color, support info).

---

## 🚀 Usage

### Login Page

```typescript
// app/login/page.tsx
import { ClientBrandedLogin } from '@/components/ClientBrandedLogin';

export default function LoginPage() {
  return <ClientBrandedLogin />;
}
```

**Features:**
- Client-branded header
- Email/password inputs
- Support contact info
- Link to forgot password page

### Forgot Password Page

```typescript
// app/forgot-password/page.tsx
import { ClientBrandedForgotPassword } from '@/components/ClientBrandedForgotPassword';

export default function ForgotPasswordPage() {
  return <ClientBrandedForgotPassword />;
}
```

**Features:**
- Email input
- Sends reset link to user's email
- Success message with verification email
- Shows support contact info
- Link back to login

### Reset Password Page

```typescript
// app/reset-password/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { ClientBrandedResetPassword } from '@/components/ClientBrandedResetPassword';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return <ClientBrandedResetPassword token={token} />;
}
```

**Features:**
- New password input
- Password confirmation
- Show/hide password toggle
- Password requirements
- Success message with link to login
- Support contact info

---

## 🔌 Backend Integration

Each component calls your backend API endpoints. Update the URLs to match your Laravel backend:

### Forgot Password Endpoint

**Component sends:**
```
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Backend should return:**
```json
{
  "message": "Password reset link sent to your email"
}
```

**Or on error:**
```json
{
  "message": "Email not found"
}
```

### Reset Password Endpoint

**Component sends:**
```
POST /auth/reset-password
Content-Type: application/json

{
  "token": "abc123xyz789",
  "password": "newpassword",
  "password_confirmation": "newpassword"
}
```

**Backend should return:**
```json
{
  "message": "Password reset successful"
}
```

---

## 🎨 Client Branding Applied

Each authentication page automatically includes:

### From Config
```json
{
  "appName": "DentiChair - Dentist A",
  "displayName": "Dentist A",
  "supportEmail": "support@dentist-a.com",
  "supportPhone": "+1-555-0100",
  "theme": {
    "primaryColor": "#0070f3"
  }
}
```

### Page Elements
- **Logo**: `public/assets/icon.png` (shared)
- **Title**: Client-specific app name
- **Color**: Client-specific primary color
- **Support**: Client-specific email/phone
- **Footer**: Client-specific company name

### Different for Each Client

**Client A sees:**
```
Title: "DentiChair - Dentist A"
Support Email: support@dentist-a.com
Color: #0070f3
```

**Client B sees:**
```
Title: "DentiChair - Dentist B"
Support Email: support@dentist-b.com
Color: #10B981 (if configured)
```

---

## 📱 Responsive Design

All components are fully responsive:

| Device | Behavior |
|--------|----------|
| Mobile | Full-width form, centered |
| Tablet | Optimized width, readable |
| Desktop | Max-width container, centered |

---

## 🔐 Security Features

### Password Reset
- ✅ Token-based reset (not user ID)
- ✅ 24-hour token expiration
- ✅ One-time use tokens
- ✅ Secure password requirements

### Form Validation
- ✅ Email format validation
- ✅ Password strength requirements (8+ chars)
- ✅ Password confirmation match
- ✅ Loading states prevent double-submit

### Best Practices
- Never store reset tokens in logs
- Hash tokens before storing in database
- Use HTTPS only in production
- Implement rate limiting on endpoints

---

## 🛠️ Customization

### Change Button Color

The components automatically use `config.primaryColor`. To change:

Edit `clients/config.json`:
```json
{
  "theme": {
    "primaryColor": "#FF5733"  // Your color
  }
}
```

### Change Password Requirements

Edit `ClientBrandedResetPassword.tsx`:
```typescript
if (password.length < 12) {  // Change from 8
  setError('Password must be at least 12 characters');
}
```

### Add Custom Fields

Extend the components by adding fields before submitting:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // Add custom validation
  if (customField !== 'expected') {
    setError('Custom field is invalid');
    return;
  }

  // Include in request
  body: JSON.stringify({
    email,
    customField,  // Add this
  }),
}
```

---

## 📧 Email Templates

Your backend should send emails like:

### Password Reset Email

```
Subject: Reset your DentiChair password

Hello User,

We received a request to reset your password for DentiChair - Dentist A.

Click the link below to create a new password:
https://dentist-a.com/reset-password?token=abc123xyz789

This link will expire in 24 hours.

If you didn't request this, you can safely ignore this email.

Support: support@dentist-a.com
© 2024 Dentist A. All rights reserved.
```

---

## 🔄 Flow Diagram

```
User visits login page
        ↓
Clicks "Forgot Password"
        ↓
Enters email
        ↓
Backend sends reset email
        ↓
Component shows success
        ↓
User clicks email link
        ↓
Visits /reset-password?token=...
        ↓
Enters new password
        ↓
Backend updates password
        ↓
Component shows success
        ↓
User can now login
```

---

## 🐛 Error Handling

Components handle these errors gracefully:

| Error | Shown To User |
|-------|---------------|
| Email not found | "Email not found or no account" |
| Invalid token | "Invalid or expired reset link" |
| Passwords don't match | "Passwords do not match" |
| Network error | "An error occurred. Please try again" |
| Invalid password | "Password must be at least 8 characters" |

---

## ✅ Testing Checklist

- [ ] Login page loads with client branding
- [ ] Forgot password form submits email
- [ ] Success message shows after submission
- [ ] Reset password page accepts token from URL
- [ ] Password reset submits to backend
- [ ] Passwords match validation works
- [ ] Show/hide password toggle works
- [ ] Support email/phone displays correctly
- [ ] Client colors apply to buttons
- [ ] Responsive on mobile/tablet/desktop
- [ ] Success messages show correctly

---

## 📚 Integration Example

### Full Auth Flow Setup

```typescript
// app/auth/login/page.tsx
import { ClientBrandedLogin } from '@/components/ClientBrandedLogin';
export default function LoginPage() {
  return <ClientBrandedLogin />;
}

// app/auth/forgot-password/page.tsx
import { ClientBrandedForgotPassword } from '@/components/ClientBrandedForgotPassword';
export default function ForgotPasswordPage() {
  return <ClientBrandedForgotPassword />;
}

// app/auth/reset-password/page.tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { ClientBrandedResetPassword } from '@/components/ClientBrandedResetPassword';
export default function ResetPasswordPage() {
  const token = useSearchParams().get('token');
  return <ClientBrandedResetPassword token={token} />;
}
```

---

## 🚀 Next Steps

1. ✅ Create the three page routes above
2. ✅ Update backend endpoints:
   - `POST /auth/forgot-password`
   - `POST /auth/reset-password`
3. ✅ Configure email templates
4. ✅ Set up email service (SMTP, SendGrid, etc.)
5. ✅ Test the complete flow locally
6. ✅ Deploy to Vercel/production

---

## 💡 Pro Tips

- **Test locally**: Use a test email service (like Mailtrap)
- **Token security**: Use random tokens, not sequential IDs
- **Email HTML**: Style emails to match your brand
- **Rate limiting**: Prevent password reset abuse
- **Logging**: Log reset attempts for security audits
- **Branding**: Use client colors in email templates too

---

All authentication pages are ready to deploy! 🔐
