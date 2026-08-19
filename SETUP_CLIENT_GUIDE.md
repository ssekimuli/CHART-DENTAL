# Setup Client Guide

Complete guide to using `clients/setup-client.js` for multi-client deployments.

---

## 🎯 Overview

The `setup-client.js` script automates client deployment setup by:
1. Creating client-specific directories
2. Generating `.env.local` with backend URL
3. Creating Vercel deployment config
4. Creating Tauri desktop app config
5. Generating client README

---

## 🚀 Usage

### Basic Setup
```bash
cd clients
node setup-client.js client-a
```

### With Multiple Clients
```bash
node setup-client.js client-a
node setup-client.js client-b
node setup-client.js client-c
```

### Output
```
✅ Created directory: clients/client-a
✅ Created: client-a/.env.local
✅ Created: client-a/vercel.json
✅ Created: client-a/src-tauri/tauri.conf.json
✅ Created: client-a/dist/

✨ Client setup complete!

Next steps:
1. Review clients/client-a/.env.local
2. Deploy: vercel deploy --prod
3. Build desktop: npm run desktop:build
```

---

## 📁 Files Created

### 1. `.env.local` - Environment Variables

**Purpose:** Backend URL for this client  
**Contents:**
```env
NEXT_PUBLIC_BACKEND_URL=https://api-a.example.com/api
# Other variables come from API
```

**Why minimal?** Client branding is fetched from API at runtime, not stored in environment variables.

### 2. `vercel.json` - Vercel Deployment Config

**Purpose:** Tells Vercel how to deploy  
**Contents:**
```json
{
  "projectId": "dentichair-client-a",
  "orgId": "your-vercel-team",
  "buildCommand": "npm run build",
  "env": {
    "NEXT_PUBLIC_BACKEND_URL": "https://api-a.example.com/api"
  }
}
```

**Usage:**
```bash
cd clients/client-a
vercel deploy --prod
```

### 3. `src-tauri/tauri.conf.json` - Desktop App Config

**Purpose:** Configures Tauri desktop app for this client  
**Contents:**
```json
{
  "productName": "DentiChair - Dentist A",
  "identifier": "com.dentist-a.dentichair",
  "version": "0.1.0"
}
```

### 4. `README.md` - Client Documentation

**Purpose:** Quick reference for deploying this client  
**Includes:** Domain, backend URL, deployment steps

### 5. `dist/` - Output Directory

**Purpose:** Holds built web and desktop files  
**Contents after build:**
```
dist/
├── chart-dental.exe (Windows)
├── chart-dental.dmg (macOS)
└── chart-dental.deb (Linux)
```

---

## 🔄 Workflow

### Step 1: Define Client in config.json
```json
{
  "id": "client-a",
  "name": "Dentist A Practice",
  "appName": "DentiChair - Dentist A",
  "backendUrl": "https://api-a.example.com/api",
  "tauriId": "com.dentist-a.dentichair"
}
```

### Step 2: Run Setup Script
```bash
node setup-client.js client-a
```

Creates all necessary files with values from config.json

### Step 3: Deploy Web
```bash
cd clients/client-a
vercel deploy --prod
```

Web app deployed at client's domain

### Step 4: Build Desktop
```bash
npm run desktop:build
```

Builds Windows .exe, macOS .dmg, Linux .deb

### Step 5: Distribute
- Share desktop installers with users
- Direct users to web domain for browser access

---

## 📊 File Structure After Setup

```
clients/
├── config.json
├── setup-client.js
├── client-a/
│   ├── .env.local             ← Backend URL
│   ├── vercel.json            ← Vercel config
│   ├── src-tauri/
│   │   └── tauri.conf.json    ← Desktop config
│   ├── dist/                  ← Build outputs
│   └── README.md              ← Client docs
├── client-b/
│   └── ... (same structure)
└── client-c/
    └── ... (same structure)
```

---

## 🔌 API-Driven Configuration

### What's Generated (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=https://api-a.example.com/api
```

### What's Fetched from API (at runtime)
```
GET /client-config → {
  "appName": "DentiChair - Dentist A",
  "supportEmail": "support@dentist-a.com",
  "theme": { "primaryColor": "#0070f3" },
  "features": { "pwa": true, "desktop": true }
}
```

### Why This Approach?
✅ Update branding without redeploying  
✅ Single .env for all clients  
✅ True multi-tenant architecture  
✅ Dynamic configuration changes  

---

## 📝 Customization

After setup, you can customize per-client files:

### Change Backend URL
Edit `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=https://new-backend.com/api
```

### Change Desktop App Name
Edit `src-tauri/tauri.conf.json`:
```json
{
  "productName": "DentiChair - New Name"
}
```

### Change Vercel Settings
Edit `vercel.json`:
```json
{
  "projectId": "new-vercel-project"
}
```

---

## 🎯 Example: Adding Client C

### 1. Update config.json
```json
{
  "id": "client-c",
  "name": "Dentist C Clinic",
  "appName": "DentiChair - Dentist C",
  "domain": "dentist-c.com",
  "backendUrl": "https://api-c.example.com/api",
  "vercelProject": "dentichair-client-c",
  "tauriId": "com.dentist-c.dentichair"
}
```

### 2. Run Setup
```bash
node setup-client.js client-c
```

### 3. Deploy Web
```bash
cd clients/client-c
vercel deploy --prod
```

### 4. Build Desktop
```bash
npm run desktop:build
```

Done! ✨

---

## ✅ Checklist for New Client

- [ ] Add client to `clients/config.json`
- [ ] Run `node setup-client.js <client-id>`
- [ ] Review generated `.env.local`
- [ ] Review generated `vercel.json`
- [ ] Review generated `src-tauri/tauri.conf.json`
- [ ] Deploy to Vercel: `cd clients/<id> && vercel deploy --prod`
- [ ] Build desktop: `npm run desktop:build`
- [ ] Share `.exe`/`.dmg`/`.deb` with users
- [ ] Share web domain with users

---

## 🐛 Troubleshooting

### Client not found in config.json
```
Error: Client "client-x" not found in config.json
```
**Fix:** Make sure client exists in `clients/config.json`

### Permission denied
```
Error: EACCES: permission denied
```
**Fix:** Ensure Node.js is installed and you have write permissions

### Files already exist
**Info:** Script overwrites existing files from config.json  
**Safe:** Run script again to regenerate files from updated config

### Vercel deploy fails
1. Check `vercel.json` has correct `projectId`
2. Verify Vercel token in environment
3. Ensure `VERCEL_TOKEN` secret is set in CI/CD

---

## 📊 What Gets Set Where

### config.json (Source of Truth)
```json
{
  "id": "client-a",
  "name": "Dentist A Practice",
  "displayName": "Dentist A",
  "appName": "DentiChair - Dentist A",
  "backendUrl": "https://api-a.example.com/api",
  "vercelProject": "dentichair-client-a",
  "tauriId": "com.dentist-a.dentichair",
  "supportEmail": "support@dentist-a.com"
}
```

### .env.local (Generated)
```env
NEXT_PUBLIC_BACKEND_URL=https://api-a.example.com/api
```

### vercel.json (Generated)
```json
{
  "projectId": "dentichair-client-a",
  "env": {
    "NEXT_PUBLIC_BACKEND_URL": "https://api-a.example.com/api"
  }
}
```

### tauri.conf.json (Generated)
```json
{
  "productName": "DentiChair - Dentist A",
  "identifier": "com.dentist-a.dentichair"
}
```

### API Response (Fetched at Runtime)
```json
{
  "appName": "DentiChair - Dentist A",
  "supportEmail": "support@dentist-a.com",
  "displayName": "Dentist A"
}
```

---

## 🔄 Update Flow

### Update Client Name
1. Edit `clients/config.json` → update `appName`
2. Run `node setup-client.js client-a` → regenerates configs
3. Re-deploy to Vercel
4. Desktop app updates automatically on next launch

### Add New Client
1. Add entry to `clients/config.json`
2. Run `node setup-client.js new-client`
3. Deploy immediately (no other changes needed)

---

## 📚 Related Documentation

- `API_CLIENT_CONFIG.md` - Backend implementation
- `MULTI_CLIENT_SETUP.md` - System overview
- `API_MIGRATION_COMPLETE.md` - Migration details
- `clients/config.json` - Client definitions

---

## 💡 Key Points

✅ **Idempotent** - Safe to run multiple times  
✅ **Automated** - No manual file creation needed  
✅ **Flexible** - Customize generated files after creation  
✅ **Scalable** - Add unlimited clients with one command  
✅ **API-First** - Branding from API, not hardcoded  

**One command to set up a complete multi-tenant deployment!** 🚀
