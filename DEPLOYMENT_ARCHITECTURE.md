# Deployment Architecture

Complete visual and technical architecture for multi-client deployment.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE CODEBASE (GitHub)                    │
│  src/ | public/ | next.config.ts | src-tauri/ | package.json   │
│                                                                 │
│  Everything shared - only config differs per client             │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
                    ▼         ▼         ▼
        ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
        │   CLIENT A       │ │   CLIENT B       │ │   CLIENT C       │
        │ (Dentist A)      │ │ (Dentist B)      │ │ (Dentist C)      │
        └──────────────────┘ └──────────────────┘ └──────────────────┘
            │                      │                      │
    ┌───────┴────────┐    ┌────────┴────────┐   ┌────────┴────────┐
    │                │    │                 │   │                 │
    ▼                ▼    ▼                 ▼   ▼                 ▼
  WEB              DESKTOP  WEB            DESKTOP WEB            DESKTOP
  Vercel           .exe     Vercel         .exe   Vercel         .exe
  .dmg             .dmg     .dmg           .dmg   .dmg           .dmg
  .deb             .deb     .deb           .deb   .deb           .deb
    │                │        │             │       │             │
    └────────┬───────┘        └─────┬───────┘       └─────┬────────┘
             │                      │                     │
             ▼                      ▼                     ▼
      BACKEND A API          BACKEND B API         BACKEND C API
      api-a.example.com      api-b.example.com    api-c.example.com
```

---

## 📊 Deployment Flow

### Web App Deployment (Vercel)

```
┌─────────────────────────┐
│  Push to main branch    │
│  git push origin main   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  GitHub Actions runs    │
│  multi-client-deploy.yml│
└────────────┬────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐
│Client A││Client B││Client C│
└────┬───┘└────┬───┘└────┬───┘
     │         │        │
     ▼         ▼        ▼
 WEB BUILD  WEB BUILD  WEB BUILD
 (Next.js)  (Next.js)  (Next.js)
     │         │        │
     ▼         ▼        ▼
   VERCEL    VERCEL    VERCEL
   DEPLOY    DEPLOY    DEPLOY
     │         │        │
     ▼         ▼        ▼
dentist-a.com dentist-b.com dentist-c.com
```

### Desktop App Deployment

```
┌─────────────────────────────┐
│  Build & Push to GitHub     │
│  git tag v0.2.0             │
│  git push origin v0.2.0     │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  GitHub Actions triggers    │
│  on tag push                │
└────────────┬────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐
│Client A││Client B││Client C│
└────┬───┘└────┬───┘└────┬───┘
     │         │        │
     ▼         ▼        ▼
BUILD TAURI BUILD TAURI BUILD TAURI
(Windows)  (Windows)  (Windows)
(macOS)    (macOS)    (macOS)
(Linux)    (Linux)    (Linux)
     │         │        │
     ▼         ▼        ▼
GITHUB RELEASES
├── chart-dental-a v0.2.0
│   ├── chart-dental.exe
│   ├── chart-dental.dmg
│   └── chart-dental.deb
├── chart-dental-b v0.2.0
│   ├── chart-dental.exe
│   ├── chart-dental.dmg
│   └── chart-dental.deb
└── chart-dental-c v0.2.0
    ├── chart-dental.exe
    ├── chart-dental.dmg
    └── chart-dental.deb
```

---

## 🔄 Environment & Configuration Flow

```
┌──────────────────────┐
│  clients/config.json │ (Master configuration)
└──────────┬───────────┘
           │
    ┌──────┼──────┐
    │      │      │
    ▼      ▼      ▼
  client-a  client-b  client-c
    │        │         │
    ▼        ▼         ▼
.env.local .env.local .env.local
│          │         │
├─BACKEND_URL=api-a └─BACKEND_URL=api-b └─BACKEND_URL=api-c
├─CLIENT_ID=client-a └─CLIENT_ID=client-b └─CLIENT_ID=client-c
└─APP_NAME=CHART A      └─APP_NAME=CHART B    └─APP_NAME=CHART C
```

---

## 💻 Client A Detailed Flow

### Configuration Phase
```
clients/config.json
│
└─ "id": "client-a"
   "name": "Dentist A Practice"
   "backendUrl": "https://api-a.example.com/api"
   "vercelProject": "chart-dental-a"
   "tauriId": "com.dentist-a.chart"
   "appName": "CHART - Dentist A"
```

### Setup Phase
```
$ node setup-client.js client-a

Creates:
├─ clients/client-a/.env.local
│  ├─ NEXT_PUBLIC_BACKEND_URL=https://api-a.example.com/api
│  ├─ NEXT_PUBLIC_CLIENT_ID=client-a
│  └─ NEXT_PUBLIC_APP_NAME=CHART - Dentist A
│
├─ clients/client-a/vercel.json
│  └─ projectId: "chart-dental-a"
│
├─ clients/client-a/src-tauri/tauri.conf.json
│  ├─ productName: "CHART - Dentist A"
│  ├─ identifier: "com.dentist-a.chart"
│  └─ version: "0.1.0"
│
└─ clients/client-a/dist/
   └─ (output directory)
```

### Build Phase (Web)
```
$ cd clients/client-a && vercel deploy --prod

Process:
1. Reads .env.local (backend URL)
2. Builds Next.js app
3. Deploys to Vercel project
4. Site live at dentist-a.com

Result:
Web app available at:
https://dentist-a.com
```

### Build Phase (Desktop)
```
$ node build-desktop.js client-a

Process:
1. Load config for client-a
2. Set env vars:
   - NEXT_PUBLIC_BACKEND_URL=https://api-a.example.com/api
   - NEXT_PUBLIC_APP_NAME=CHART - Dentist A
3. Build Next.js
4. Build Tauri desktop app
5. Copy outputs to clients/client-a/dist/

Result:
clients/client-a/dist/
├─ chart-dental.exe (Windows installer)
├─ chart-dental.dmg (macOS installer)
└─ chart-dental.deb (Linux package)
```

### Distribution Phase
```
Users get apps from:

Web:     https://dentist-a.com
PWA:     Install from browser
Desktop: https://your-domain.com/download/client-a
         → chart-dental.exe
         → chart-dental.dmg
         → chart-dental.deb

All connect to:
https://api-a.example.com/api
```

---

## 🔐 Security & Data Isolation

```
┌─────────────────────────────────────────┐
│         Client A Data                   │
│  ├─ Web: dentist-a.com                 │
│  ├─ Desktop: chart-dental-a.exe        │
│  └─ Backend: api-a.example.com/api     │
│                                         │
│  (Client A data never touches other    │
│   clients' backends or web servers)    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Client B Data                   │
│  ├─ Web: dentist-b.com                 │
│  ├─ Desktop: chart-dental-b.exe        │
│  └─ Backend: api-b.example.com/api     │
│                                         │
│  (Completely separate from Client A)   │
└─────────────────────────────────────────┘
```

Each client is completely isolated:
- Different web domain
- Different backend server
- Different desktop app
- Different data

---

## 📈 Scaling: Adding New Client

```
1. Edit clients/config.json
   └─ Add entry for client-d

2. Run setup
   $ node setup-client.js client-d
   
3. Deploy web
   $ cd clients/client-d && vercel deploy --prod
   
4. Build desktop
   $ node build-desktop.js client-d
   
5. Done!
```

Scales to any number of clients.

---

## 🔄 Update Cycle

### Shared Code Update (for all clients)

```
Edit src/ or public/ or src-tauri/
  │
  ├─ Commit: git commit -m "feature: add..."
  │
  └─ Tag: git tag v0.2.0
     └─ Push: git push origin v0.2.0
        │
        ▼
     GitHub Actions
        │
        ├─ Build all clients
        ├─ Deploy all web apps
        ├─ Build all desktop apps
        │
        └─ Result:
           - All clients updated
           - New desktop releases
           - Users can upgrade
```

### Single Client Update (custom config)

```
Edit clients/client-a/.env.local
  │
  ├─ Rebuild: npm run build && npm run desktop:build
  │
  └─ Deploy: vercel deploy --prod (from clients/client-a)
     │
     └─ Result:
        - Only client-a updated
        - Other clients unchanged
```

---

## 📞 API Communication

### Web/PWA App → Backend
```
Browser
  │
  └─ GET /api/patients
     │ (Uses NEXT_PUBLIC_BACKEND_URL from .env.local)
     │
     └─ https://api-a.example.com/api/patients
        │
        └─ Backend A API
           └─ Returns data
```

### Desktop App → Backend
```
Tauri Native Window (runs same Next.js web app)
  │
  └─ GET /api/patients
     │ (Uses same NEXT_PUBLIC_BACKEND_URL)
     │
     └─ https://api-a.example.com/api/patients
        │
        └─ Backend A API
           └─ Returns data
```

Both use the same environment variable set at build time.

---

## 🎯 Directory Access Pattern

```
Shared Code (all clients read)
src/
public/
next.config.ts
src-tauri/

Client-Specific (each client independent)
clients/client-a/
├── .env.local (backend URL)
├── vercel.json (deploy config)
├── src-tauri/tauri.conf.json (app name)
└── dist/ (outputs)

clients/client-b/
└── (same structure, different values)
```

---

## ✅ Summary

| Component | Shared? | Per-Client |
|-----------|---------|-----------|
| React code | ✅ Same | ✅ Same |
| Next.js config | ✅ Same | ✅ Same |
| Tauri code | ✅ Same | ✅ Same |
| Backend URL | ❌ | ✅ Different |
| Web domain | ❌ | ✅ Different |
| Desktop app | ❌ (name) | ✅ Different |
| Data | ❌ (isolated) | ✅ Different |

One codebase → Infinite deployments with complete data isolation! 🚀
