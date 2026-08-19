# Environment Variables Reference

Complete guide to all environment variables used in DentiChair.

## 📋 Overview

DentiChair uses environment variables for configuration across all platforms (web, PWA, desktop). Variables prefixed with `NEXT_PUBLIC_` are accessible in the browser.

---

## 🎨 Client & Branding Variables

These variables define client-specific branding shown to users.

### `NEXT_PUBLIC_CLIENT_ID`
**Type:** String  
**Required:** Yes  
**Example:** `client-a`  
**Description:** Unique identifier for this client deployment. Used internally for analytics and logging.

### `NEXT_PUBLIC_CLIENT_NAME`
**Type:** String  
**Required:** Yes  
**Example:** `Dentist A Practice`  
**Description:** Full legal name of the client/practice. Used in emails, documents, and footers.

### `NEXT_PUBLIC_CLIENT_DISPLAY_NAME`
**Type:** String  
**Required:** Yes  
**Example:** `Dentist A`  
**Description:** Short name for UI display (home screen icon text, browser shortcuts). Keep under 20 characters.

### `NEXT_PUBLIC_APP_NAME`
**Type:** String  
**Required:** Yes  
**Example:** `DentiChair - Dentist A`  
**Description:** Full application name shown in browser tabs, headers, and application menus. This is what users see.

---

## 🔌 Backend Configuration

### `NEXT_PUBLIC_BACKEND_URL`
**Type:** URL  
**Required:** Yes  
**Example:** `https://api-a.example.com/api`  
**Description:** Backend API endpoint. Each client typically has their own backend server for data isolation.

**Important:**
- Must be HTTPS in production
- Should point to client's dedicated backend
- Used for all API calls (auth, patient records, appointments, etc.)

---

## 🎨 Theme & Branding

### `NEXT_PUBLIC_PRIMARY_COLOR`
**Type:** Hex Color  
**Required:** No (Default: `#0070f3`)  
**Example:** `#10B981`, `#8B5CF6`  
**Description:** Primary brand color used for buttons, links, and UI elements.

**Tips:**
- Use client's brand color
- Ensure sufficient contrast for accessibility
- Test on both light and dark backgrounds

### `NEXT_PUBLIC_BRAND_COLOR`
**Type:** Hex Color  
**Required:** No (Default: `#0070f3`)  
**Example:** `#FF5733`  
**Description:** Alternative brand color for secondary elements and accents.

---

## 📞 Support & Contact

### `NEXT_PUBLIC_SUPPORT_EMAIL`
**Type:** Email  
**Required:** No  
**Example:** `support@dentist-a.com`  
**Description:** Support email displayed in login/forgot password pages. Should be client-specific.

### `NEXT_PUBLIC_SUPPORT_PHONE`
**Type:** Phone Number  
**Required:** No  
**Example:** `+1-555-0100`  
**Description:** Support phone number displayed in authentication pages.

### `NEXT_PUBLIC_COMPANY_NAME`
**Type:** String  
**Required:** No  
**Example:** `Dentist A Practice`  
**Description:** Company name for copyright and legal text in footers.

---

## ✨ Feature Flags

### `NEXT_PUBLIC_PWA_ENABLED`
**Type:** Boolean (`true` or `false`)  
**Required:** No (Default: `true`)  
**Description:** Enable/disable Progressive Web App features (install prompts, offline support).

**When to disable:**
- Testing web-only version
- Migrating to desktop-only

### `NEXT_PUBLIC_DESKTOP_FEATURES_ENABLED`
**Type:** Boolean (`true` or `false`)  
**Required:** No (Default: `true`)  
**Description:** Enable/disable desktop-specific features (native file dialogs, system integration).

**When to disable:**
- Running in browser only
- Testing mobile-only version

### `NEXT_PUBLIC_OFFLINE_SUPPORT`
**Type:** Boolean (`true` or `false`)  
**Required:** No (Default: `true`)  
**Description:** Enable/disable service worker caching for offline support.

**When to disable:**
- Sensitive data that shouldn't be cached
- Development/testing

---

## 📊 Analytics & Tracking

### `NEXT_PUBLIC_ANALYTICS_ENABLED`
**Type:** Boolean (`true` or `false`)  
**Required:** No (Default: `false`)  
**Description:** Enable/disable analytics tracking and monitoring.

### `NEXT_PUBLIC_ANALYTICS_ID`
**Type:** String  
**Required:** No (if analytics disabled)  
**Example:** `G-XXXXXXXXXX` (Google Analytics)  
**Description:** Analytics provider identifier (Google Analytics ID, Mixpanel project ID, etc.).

---

## 💳 Payment Processing (Optional)

### `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
**Type:** String  
**Required:** Only if using Stripe  
**Example:** `pk_test_51234567890abcdef`  
**Description:** Stripe public key for payment processing. Get from Stripe Dashboard.

**Security:** Always use test keys in development, production keys in production.

### `STRIPE_WEBHOOK_SECRET`
**Type:** String (Server-side only)  
**Required:** Only if using Stripe  
**Example:** `whsec_1234567890abcdef`  
**Description:** Webhook secret for Stripe payment events. NEVER expose to frontend.

---

## 🔐 Authentication & Security

### `JWT_SECRET`
**Type:** String (Server-side only)  
**Required:** Yes (Backend)  
**Example:** Generate with: `openssl rand -base64 32`  
**Description:** Secret key for JWT token generation and validation.

**Security:**
- Generate strong random key
- Change for each deployment
- Never commit to version control
- Keep secure in production

### `JWT_EXPIRATION`
**Type:** Number (hours)  
**Required:** No (Default: `24`)  
**Example:** `24`, `168` (1 week)  
**Description:** Token expiration time in hours.

---

## 📧 Email Configuration

### `EMAIL_PROVIDER`
**Type:** String  
**Required:** No (Default: `smtp`)  
**Options:** `smtp`, `sendgrid`, `mailgun`  
**Description:** Email service provider choice.

### SMTP Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@dentist-a.com
```

For Gmail:
- Use App Password (not regular password)
- Enable 2-factor authentication
- Generate app-specific password

### SendGrid
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

### Mailgun
```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxxxxxxxxxxxx
```

---

## 🗄️ Database & Cache (Optional)

### `DATABASE_URL`
**Type:** URL  
**Required:** No (if using database)  
**Example:** `postgresql://user:password@localhost:5432/dentichair`  
**Description:** Database connection string.

### `REDIS_URL`
**Type:** URL  
**Required:** No (if using Redis)  
**Example:** `redis://localhost:6379`  
**Description:** Redis connection for caching and sessions.

---

## 🌍 Application Environment

### `NODE_ENV`
**Type:** String  
**Required:** Yes  
**Options:** `development`, `production`, `staging`  
**Description:** Node.js environment. Controls optimization and logging levels.

**Effects:**
- `development`: Fast reload, detailed errors, no optimization
- `production`: Optimized, minimal logging, performance tuned
- `staging`: Production-like with extra logging for testing

### `NEXT_PUBLIC_APP_URL`
**Type:** URL  
**Required:** No  
**Example:** `https://dentist-a.com`  
**Description:** Application URL used for email links, redirects, and CORS.

---

## 🔍 Debugging & Logging

### `DEBUG`
**Type:** Boolean (`true` or `false`)  
**Required:** No (Default: `false`)  
**Description:** Enable detailed debug logging.

### `LOG_LEVEL`
**Type:** String  
**Required:** No (Default: `info`)  
**Options:** `debug`, `info`, `warn`, `error`  
**Description:** Minimum log level to output.

---

## 🎯 AI & LLM Configuration

### `GEMINI_API_KEY`
**Type:** String (Server-side)  
**Required:** Only if using GenKit AI  
**Example:** Your Google Gemini API key  
**Description:** API key for Google Gemini AI integration.

**Get from:** Google AI Studio (https://makersuite.google.com/app/apikey)

---

## 📋 Multi-Client Setup

### For Default/Development
Use `.env` file with these values:
```env
NEXT_PUBLIC_CLIENT_ID=default
NEXT_PUBLIC_APP_NAME=DentiChair
NEXT_PUBLIC_BACKEND_URL=https://stagingapi.poslycloud.com/api
```

### For Client A
Auto-generated in `clients/client-a/.env.local`:
```env
NEXT_PUBLIC_CLIENT_ID=client-a
NEXT_PUBLIC_APP_NAME=DentiChair - Dentist A
NEXT_PUBLIC_BACKEND_URL=https://api-a.example.com/api
NEXT_PUBLIC_SUPPORT_EMAIL=support@dentist-a.com
```

### For Production (Vercel)
Set in Vercel Project Settings → Environment Variables:
- Separate variables for each client project
- Use production backends
- Use production API keys

---

## 🔄 Variable Precedence

Variables are loaded in this order (later overrides earlier):

1. `.env` (committed to git)
2. `.env.local` (client-specific, not committed)
3. Vercel Environment Variables (production)
4. Command-line env vars (runtime overrides)

### Example
```bash
# Override at runtime
NEXT_PUBLIC_BACKEND_URL=https://custom-api.com npm run dev

# Or in .env.local
echo "NEXT_PUBLIC_BACKEND_URL=https://custom-api.com" > .env.local
npm run dev
```

---

## ✅ Checklist for New Client

When setting up a new client:

- [ ] Set `NEXT_PUBLIC_CLIENT_ID` (unique, lowercase)
- [ ] Set `NEXT_PUBLIC_APP_NAME` (customer-facing)
- [ ] Set `NEXT_PUBLIC_BACKEND_URL` (client's API)
- [ ] Set `NEXT_PUBLIC_SUPPORT_EMAIL` (client's support)
- [ ] Set `NEXT_PUBLIC_SUPPORT_PHONE` (optional)
- [ ] Set `NEXT_PUBLIC_PRIMARY_COLOR` (brand color)
- [ ] Configure email service (SMTP/SendGrid/Mailgun)
- [ ] Set JWT_SECRET (production only)
- [ ] Test with `npm run dev`
- [ ] Deploy to Vercel

---

## 🚀 Next Steps

1. Copy `.env.example` to `.env.local`
2. Update with your values
3. For clients, use: `cd clients && node setup-client.js <id>`
4. Run `npm run dev` to test
5. Deploy to Vercel with Environment Variables

---

## 📚 Related Files

- `.env` - Base environment variables
- `.env.local` - Local overrides (not committed)
- `.env.example` - Template with all options
- `clients/{id}/.env.local` - Auto-generated per client
- `DEPLOYMENT_ARCHITECTURE.md` - Overall architecture
- `MULTI_CLIENT_SETUP.md` - Multi-client configuration

All environment variables loaded and working! 🚀
