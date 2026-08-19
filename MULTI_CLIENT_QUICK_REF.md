# Multi-Client Quick Reference

TL;DR version of the multi-client system.

## 🎯 What Is It?

One codebase → Multiple client deployments with different backends.

```
Client A → Backend A
Client B → Backend B
Client C → Backend C
(all from same code)
```

## ⚡ 5-Minute Setup

### 1. Configure Clients
Edit `clients/config.json`:
```json
{
  "clients": [
    {
      "id": "client-a",
      "name": "Dentist A",
      "backendUrl": "https://api-a.example.com/api",
      "vercelProject": "chart-dental-a"
    }
  ]
}
```

### 2. Setup Client
```bash
cd clients
node setup-client.js client-a
```

### 3. Build & Deploy
```bash
# Web to Vercel
cd clients/client-a
vercel deploy --prod

# Desktop apps
cd ../..
npm run build
npm run desktop:build
```

Done! 🚀

---

## 📚 Common Commands

| Task | Command |
|------|---------|
| Configure new client | `clients/config.json` (edit) |
| Setup client deployment | `cd clients && node setup-client.js <id>` |
| Build desktop for client | `cd clients && node build-desktop.js <id>` |
| Build desktop for all | `cd clients && node build-all.js` |
| Deploy web to Vercel | `cd clients/<id> && vercel deploy --prod` |
| Local dev (client-a) | `cp clients/client-a/.env.local . && npm run dev` |
| Local desktop dev | `cp clients/client-a/.env.local . && npm run desktop:dev` |

---

## 📁 Key Files

```
clients/
├── config.json              # Master configuration
├── setup-client.js          # Create new client
├── build-desktop.js         # Build for one client
├── build-all.js             # Build for all clients
├── client-a/
│   ├── .env.local          # Backend URL
│   ├── vercel.json         # Vercel config
│   └── dist/               # Build outputs
└── client-b/
    └── ...
```

---

## 🔄 How It Works

```
1. Edit clients/config.json
   ↓
2. Run node setup-client.js <id>
   ↓ Creates:
   - .env.local (backend URL)
   - vercel.json (deployment config)
   - dist/ (output folder)
   ↓
3. Deploy:
   - Web: vercel deploy --prod
   - Desktop: npm run desktop:build
   ↓
4. Users download from clients/<id>/dist/
```

---

## 📦 After Setup

### Directories Created
```
clients/
├── config.json           # ← You edit this
├── client-a/
│   ├── .env.local       # Backend: api-a.example.com/api
│   ├── vercel.json      # Vercel deployment config
│   ├── src-tauri/
│   │   └── tauri.conf.json  # Desktop app name
│   └── dist/
│       ├── chart-dental.exe
│       ├── chart-dental.dmg
│       └── chart-dental.deb
└── client-b/
    └── ...
```

### Each Client Gets
- Own `.env.local` (backend URL)
- Own `vercel.json` (Vercel config)
- Own `dist/` (web + desktop builds)
- Own desktop app with their name

---

## 🚀 Deploy Workflow

### Local Testing
```bash
# Copy client config
cp clients/client-a/.env.local .env.local

# Run dev server
npm run dev

# Or desktop
npm run desktop:dev
```

### Production Deploy
```bash
# Build web
npm run build

# Deploy to Vercel
cd clients/client-a && vercel deploy --prod

# Build desktop apps
npm run desktop:build

# Outputs in: clients/client-a/dist/
```

---

## 📞 Support

Full documentation: `MULTI_CLIENT_SETUP.md`

---

## ❓ FAQ

**Q: Where do clients download their apps?**  
A: Desktop from `clients/<id>/dist/`, Web from their Vercel domain

**Q: How are backends different?**  
A: In `clients/config.json` - set `backendUrl` per client

**Q: Same code for all clients?**  
A: Yes! Only `.env.local` and config files differ

**Q: How to add new client?**  
A: Add to `config.json`, then run `node setup-client.js <id>`

**Q: Can I customize per client?**  
A: Edit `.env.local`, `vercel.json`, or `tauri.conf.json` after setup

---

Made with ❤️ for multi-client deployments
