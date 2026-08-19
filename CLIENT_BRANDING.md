# Client-Specific Branding

Each client sees their own branded experience with customized titles, login pages, and UI elements.

## 🎨 What's Customizable Per Client

| Element | Location | How It Works |
|---------|----------|--------------|
| **Page Title** | Browser tab | Changes based on client |
| **App Name** | UI headers | Shows client-specific name |
| **Login Screen** | `/login` | Branded with client name |
| **Primary Color** | UI elements | Customizable per client |
| **Support Info** | Login page footer | Client-specific email/phone |

---

## 🚀 Setup

### 1. Configure Clients in config.json

Edit `clients/config.json` with client details:

```json
{
  "id": "client-a",
  "name": "Dentist A Practice",
  "displayName": "Dentist A",
  "appName": "CHART - Dentist A",
  "backendUrl": "https://api-a.example.com/api",
  "supportEmail": "support@dentist-a.com",
  "supportPhone": "+1-555-0100",
  "theme": {
    "primaryColor": "#0070f3"
  }
}
```

### 2. Setup Client

```bash
cd clients
node setup-client.js client-a
```

Creates `clients/client-a/.env.local` with all branding variables:
```env
NEXT_PUBLIC_CLIENT_NAME=Dentist A Practice
NEXT_PUBLIC_CLIENT_DISPLAY_NAME=Dentist A
NEXT_PUBLIC_APP_NAME=CHART - Dentist A
NEXT_PUBLIC_PRIMARY_COLOR=#0070f3
NEXT_PUBLIC_SUPPORT_EMAIL=support@dentist-a.com
NEXT_PUBLIC_SUPPORT_PHONE=+1-555-0100
```

### 3. Deploy

Each client automatically gets branded:
```bash
# Local dev
cp clients/client-a/.env.local .env.local
npm run dev

# Vercel deployment
cd clients/client-a
vercel deploy --prod
```

---

## 📝 Configuration Fields

### Required
- `id` - Unique client identifier
- `name` - Full client name
- `displayName` - Short name for UI
- `appName` - Full app title (shown in browser tab)
- `backendUrl` - Backend API URL

### Optional
- `supportEmail` - Support email (shown in login)
- `supportPhone` - Support phone (shown in login)
- `theme.primaryColor` - Brand color (default: #0070f3)

---

## 🎯 How Branding Works

### Browser Tab Title
```
Client A: "CHART - Dentist A"
Client B: "CHART - Dentist B"
```

### Login Page

```
[Logo/Icon]
CHART - Dentist A
Dental Practice Management System

[Email input field]
[Password input field]
[Sign In button]

Need help?
Email: support@dentist-a.com
Phone: +1-555-0100
```

### Environment Variables

Automatically loaded from `.env.local`:

```typescript
const config = getClientConfig();
// Returns:
{
  id: 'client-a',
  name: 'Dentist A Practice',
  displayName: 'Dentist A',
  appName: 'CHART - Dentist A',
  backendUrl: 'https://api-a.example.com/api',
  supportEmail: 'support@dentist-a.com',
  supportPhone: '+1-555-0100',
  primaryColor: '#0070f3'
}
```

---

## 💻 Using Client Config in Components

### Get Client Configuration

```typescript
import { getClientConfig, getAppTitle } from '@/lib/client-config';

export function MyComponent() {
  const config = getClientConfig();
  const title = getAppTitle();

  return (
    <div>
      <h1>{config.appName}</h1>
      <p>Support: {config.supportEmail}</p>
    </div>
  );
}
```

### Dynamic Colors

```typescript
<button
  style={{ backgroundColor: config.primaryColor }}
>
  Sign In
</button>
```

---

## 📋 Login Page Component

Use the built-in branded login component:

```typescript
import { ClientBrandedLogin } from '@/components/ClientBrandedLogin';

export default function LoginPage() {
  return <ClientBrandedLogin />;
}
```

Automatically shows:
- Client name and icon
- Support contact info
- Branded colors
- Professional UI

---

## 🎨 Customizing Branding

### Change Client Name
Edit `clients/config.json`:
```json
{
  "id": "client-a",
  "name": "New Name",
  "appName": "CHART - New Name"
}
```

Re-setup:
```bash
node setup-client.js client-a
```

### Change Brand Color
Edit `clients/config.json`:
```json
{
  "theme": {
    "primaryColor": "#FF5733"  // Change to your color
  }
}
```

Re-setup and rebuild:
```bash
node setup-client.js client-a
npm run build
```

### Update Support Contact
Edit `clients/config.json`:
```json
{
  "supportEmail": "newemail@dentist-a.com",
  "supportPhone": "+1-555-9999"
}
```

Re-setup and redeploy.

---

## 📊 Multi-Client Example

Three clients with different branding:

### Client A
```
Title: "CHART - Dentist A"
Color: #0070f3 (blue)
Support: support@dentist-a.com
```

### Client B
```
Title: "CHART - Dentist B"
Color: #10B981 (green)
Support: support@dentist-b.com
```

### Client C
```
Title: "CHART - Dentist C"
Color: #8B5CF6 (purple)
Support: support@dentist-c.com
```

Each sees their own branding, even though they use the same code!

---

## 🔄 Updating Branding

### For One Client
1. Edit `clients/config.json` (one client entry)
2. Run `node setup-client.js <client-id>`
3. Deploy: `cd clients/<client-id> && vercel deploy --prod`

### For All Clients
1. Edit `clients/config.json` (all entries)
2. For each client: `node setup-client.js <client-id>`
3. Deploy all to Vercel

---

## ✅ Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_CLIENT_ID` | Unique ID | `client-a` |
| `NEXT_PUBLIC_CLIENT_NAME` | Full name | `Dentist A Practice` |
| `NEXT_PUBLIC_CLIENT_DISPLAY_NAME` | Short name | `Dentist A` |
| `NEXT_PUBLIC_APP_NAME` | Browser title | `CHART - Dentist A` |
| `NEXT_PUBLIC_PRIMARY_COLOR` | Brand color | `#0070f3` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Support email | `support@dentist-a.com` |
| `NEXT_PUBLIC_SUPPORT_PHONE` | Support phone | `+1-555-0100` |

---

## 📁 Files Involved

| File | Purpose |
|------|---------|
| `clients/config.json` | Master branding config |
| `clients/{id}/.env.local` | Generated per-client env |
| `src/lib/client-config.ts` | Client config utilities |
| `src/components/ClientBrandedLogin.tsx` | Branded login page |
| `src/app/layout.tsx` | Uses client title |

---

## 🎯 Next Steps

1. ✅ Edit `clients/config.json` with your clients
2. ✅ Add `appName`, `supportEmail`, `supportPhone`
3. ✅ Add theme colors (optional)
4. ✅ Run `node setup-client.js` for each
5. ✅ Deploy - each client sees their branding!

---

## 💡 Pro Tips

- **Consistent naming** - Use client names consistently
- **Professional email** - Use proper support emails
- **Brand colors** - Use company colors for recognition
- **Test locally** - Use `.env.local` to test branding before deploying
- **Update config** - Client branding is only updated when you re-setup and redeploy

Each client gets a professional, branded experience! 🎨
