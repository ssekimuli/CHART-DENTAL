# Multi-Client Deployment Setup

Complete guide to managing multiple client deployments from a single codebase.

## 📋 Overview

This system allows you to:
- ✅ Manage multiple clients with different backends
- ✅ Deploy each client independently to Vercel
- ✅ Build desktop apps for each client
- ✅ Share all code and configuration
- ✅ Automate deployments with GitHub Actions

## 🏗️ Architecture

```
Single Codebase (Main Branch)
│
├── src/                    # Shared React code
├── public/                 # Shared assets
├── next.config.ts         # Shared Next.js config
├── src-tauri/             # Shared Tauri code
│
└── clients/               # Client-specific deployments
    ├── config.json        # Master configuration
    ├── client-a/          # Client A deployment
    │   ├── .env.local     # Backend URL
    │   ├── vercel.json    # Vercel config
    │   └── dist/          # Build outputs
    └── client-b/          # Client B deployment
        ├── .env.local
        ├── vercel.json
        └── dist/
```

## 🚀 Quick Start

### Step 1: Configure Clients

Edit `clients/config.json` and add your clients:

```json
{
  "clients": [
    {
      "id": "client-a",
      "name": "Dentist A Practice",
      "domain": "dentist-a.com",
      "backendUrl": "https://api-a.example.com/api",
      "vercelProject": "chart-dental-a",
      "vercelTeam": "your-team",
      "tauriId": "com.dentist-a.chart",
      "appName": "CHART - Dentist A"
    },
    {
      "id": "client-b",
      "name": "Dentist B Clinic",
      "domain": "dentist-b.com",
      "backendUrl": "https://api-b.example.com/api",
      "vercelProject": "chart-dental-b",
      "vercelTeam": "your-team",
      "tauriId": "com.dentist-b.chart",
      "appName": "CHART - Dentist B"
    }
  ]
}
```

### Step 2: Setup Client Directories

```bash
cd clients
npm install

# Create configuration for client-a
node setup-client.js client-a

# Create configuration for client-b
node setup-client.js client-b
```

This creates:
- `clients/client-a/.env.local`
- `clients/client-a/vercel.json`
- `clients/client-a/src-tauri/tauri.conf.json`
- `clients/client-a/dist/` (output directory)

### Step 3: Verify Configurations

```bash
# Check what was created
cat clients/client-a/.env.local
cat clients/client-a/vercel.json
```

## 🔧 Configuration Files

### clients/config.json
Master configuration file defining all clients.

**Key fields:**
- `id` - Unique identifier (used in CLI commands)
- `name` - Display name for logs
- `domain` - Client's domain (informational)
- `backendUrl` - Backend API URL (required for app to work)
- `vercelProject` - Vercel project ID for deployment
- `tauriId` - Unique identifier for desktop app (e.g., `com.dentist-a.chart`)
- `appName` - Display name in app and desktop installer

### clients/{clientId}/.env.local
Environment file created for each client.

Contains:
- `NEXT_PUBLIC_BACKEND_URL` - Backend API endpoint
- `NEXT_PUBLIC_CLIENT_ID` - Client identifier
- `NEXT_PUBLIC_APP_NAME` - Application name
- Support contact information

### clients/{clientId}/vercel.json
Vercel deployment configuration.

Used when deploying to Vercel:
```bash
cd clients/client-a
vercel deploy --prod
```

### clients/{clientId}/src-tauri/tauri.conf.json
Desktop app configuration for this specific client.

Contains:
- App name and version
- Window size and settings
- Tauri-specific configuration

## 📦 Building & Deploying

### Build for Specific Client

```bash
cd clients
node build-desktop.js client-a
```

This:
1. Builds Next.js web app with client-a's backend URL
2. Builds Tauri desktop app
3. Copies outputs to `clients/client-a/dist/`

### Build for All Clients

```bash
cd clients
node build-all.js
```

Builds desktop apps for all clients in sequence.

### Deploy Web (Vercel)

For each client:

```bash
cd clients/client-a
vercel deploy --prod
```

Or use GitHub Actions (see below).

## 🤖 Automated Deployment (GitHub Actions)

### Prerequisites

Set up these secrets in GitHub:
1. `VERCEL_TOKEN` - Vercel API token
2. `VERCEL_ORG_ID` - Vercel organization ID

### Automatic Deployment

On every push to main:
```
git push origin main
  ↓
GitHub Actions triggers
  ↓
For each client:
  - Build web app
  - Deploy to Vercel
  - Build desktop apps
  - Upload artifacts
```

### Deploy Single Client

Trigger workflow manually in GitHub Actions:
1. Go to Actions → Multi-Client Build & Deploy
2. Click "Run workflow"
3. Enter client ID (e.g., `client-a`)
4. Click "Run workflow"

Only that client will be built.

### Create Release

Tag commits to create releases:
```bash
git tag v0.2.0
git push origin v0.2.0
```

Workflow will:
- Build all clients
- Create GitHub releases with desktop apps
- Tag each release with client ID

## 📁 Directory Structure

After setup, your structure looks like:

```
CHART-DENTAL/
├── src/                           # Shared code
├── public/                        # Shared assets
├── src-tauri/                     # Shared Tauri
├── next.config.ts                 # Shared config
├── package.json                   # Dependencies
│
├── clients/                       # Multi-client system
│   ├── config.json               # Master config
│   ├── setup-client.js           # Setup script
│   ├── build-desktop.js          # Build script
│   ├── build-all.js              # Build all script
│   │
│   ├── client-a/                 # Client A
│   │   ├── .env.local            # Backend URL
│   │   ├── vercel.json           # Vercel config
│   │   ├── src-tauri/
│   │   │   └── tauri.conf.json   # Desktop config
│   │   └── dist/                 # Build outputs
│   │       ├── chart-dental.exe
│   │       ├── chart-dental.dmg
│   │       └── chart-dental.deb
│   │
│   └── client-b/                 # Client B
│       ├── .env.local
│       ├── vercel.json
│       └── dist/
│
├── .github/
│   └── workflows/
│       └── multi-client-deploy.yml  # CI/CD
```

## 💻 Local Development

### Develop for Specific Client

```bash
# Set environment for client-a
export NEXT_PUBLIC_BACKEND_URL=https://api-a.example.com/api
export NEXT_PUBLIC_CLIENT_ID=client-a
export NEXT_PUBLIC_APP_NAME="CHART - Dentist A"

# Run dev server
npm run dev
```

Or use `.env.local`:

```bash
# Copy client config
cp clients/client-a/.env.local .env.local

# Run dev server
npm run dev
```

### Test Desktop Locally

```bash
# Same environment setup as above
export NEXT_PUBLIC_BACKEND_URL=https://api-a.example.com/api

# Run desktop dev
npm run desktop:dev
```

## 🎯 Common Tasks

### Add New Client

1. **Add to config.json:**
   ```json
   {
     "id": "client-c",
     "name": "Dentist C Clinic",
     "domain": "dentist-c.com",
     "backendUrl": "https://api-c.example.com/api",
     "vercelProject": "chart-dental-c",
     "vercelTeam": "your-team",
     "tauriId": "com.dentist-c.chart",
     "appName": "CHART - Dentist C"
   }
   ```

2. **Setup deployment:**
   ```bash
   cd clients
   node setup-client.js client-c
   ```

3. **Deploy:**
   ```bash
   cd clients/client-c
   vercel deploy --prod
   ```

### Update All Clients

If you make changes to shared code (src/, public/, src-tauri/):

```bash
# Deploy web for all
for client in client-a client-b client-c; do
  cd clients/$client
  vercel deploy --prod
  cd ../..
done

# Build desktop for all
cd clients
node build-all.js
```

### Change Client Backend URL

Edit `clients/config.json` and update the client's `backendUrl`:

```json
{
  "id": "client-a",
  "backendUrl": "https://api-a-new.example.com/api"  // ← Change this
}
```

Then re-run setup:
```bash
cd clients
node setup-client.js client-a
```

### View Build Outputs

```bash
# Desktop apps for client-a
ls -la clients/client-a/dist/

# Expected files:
# - chart-dental.exe (Windows)
# - chart-dental.dmg (macOS)
# - chart-dental.deb (Linux)
```

## 🔄 Deployment Workflow

### Development
```
Edit code in src/
  ↓
Test: npm run dev
  ↓
Commit: git commit -m "..."
```

### Testing
```
Set env for specific client: export NEXT_PUBLIC_BACKEND_URL=...
  ↓
Build locally: npm run build
  ↓
Test app
```

### Production Release
```
Tag commit: git tag v0.2.0
  ↓
Push: git push origin v0.2.0
  ↓
GitHub Actions:
  - Builds all clients
  - Deploys to Vercel
  - Builds desktop apps
  - Creates GitHub releases
  ↓
Users download from releases or visit web app
```

## 🐛 Troubleshooting

### Client not configured
```
Error: Client "client-x" not found in config.json
```
Make sure client exists in `clients/config.json`

### Build fails
```
npm run build failing for specific client
```
Check that `NEXT_PUBLIC_BACKEND_URL` is set correctly in `.env.local`

### Vercel deployment fails
Check:
1. Vercel project ID is correct in config
2. VERCEL_TOKEN secret is set in GitHub
3. Vercel project is connected to GitHub

### Desktop app won't run
Check:
1. Backend URL is reachable from client's network
2. CORS is configured in Laravel backend
3. App was built with correct backend URL

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `clients/config.json` | Master client configuration |
| `clients/setup-client.js` | Initialize new client deployment |
| `clients/build-desktop.js` | Build desktop app for one client |
| `clients/build-all.js` | Build desktop apps for all clients |
| `.github/workflows/multi-client-deploy.yml` | CI/CD pipeline |
| `clients/{id}/.env.local` | Client-specific environment |
| `clients/{id}/vercel.json` | Vercel deployment config |
| `clients/{id}/src-tauri/tauri.conf.json` | Desktop app config |

## 🚀 Next Steps

1. ✅ Configure clients in `clients/config.json`
2. ✅ Run `node setup-client.js` for each client
3. ✅ Test locally with `npm run dev`
4. ✅ Deploy web: `vercel deploy --prod`
5. ✅ Build desktop: `node build-desktop.js`
6. ✅ Distribute to users

---

Your multi-client deployment system is ready! 🎉
