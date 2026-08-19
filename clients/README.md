# Multi-Client Deployment System

Manage multiple client deployments from a single codebase.

## 📁 Structure

```
clients/
├── config.json              # Master client configuration
├── templates/               # Deployment templates
│   ├── vercel.json
│   ├── tauri.conf.template.json
│   └── .env.template
├── client-a/                # Client A deployment
│   ├── .env.local
│   ├── vercel.json
│   ├── src-tauri/
│   └── dist/                # Built outputs
├── client-b/                # Client B deployment
│   └── ...
└── scripts/
    ├── setup-client.sh      # Create new client
    ├── deploy-client.sh     # Deploy specific client
    └── build-all.sh         # Build for all clients
```

## ⚡ Quick Start

### 1. Configure Your Clients

Edit `clients/config.json`:

```json
{
  "clients": [
    {
      "id": "client-a",
      "name": "Dentist A",
      "domain": "dentist-a.com",
      "backendUrl": "https://api-a.example.com/api",
      "vercelProject": "chart-dental-a",
      "vercelTeam": "your-team"
    },
    {
      "id": "client-b",
      "name": "Dentist B",
      "domain": "dentist-b.com",
      "backendUrl": "https://api-b.example.com/api",
      "vercelProject": "chart-dental-b",
      "vercelTeam": "your-team"
    }
  ]
}
```

### 2. Create Client Deployments

```bash
cd clients
npm install
node setup-client.js client-a
node setup-client.js client-b
```

This creates:
- `client-a/.env.local` with backend URL
- `client-a/vercel.json` with Vercel config
- `client-a/src-tauri/tauri.conf.json` with app name
- Desktop build directory

### 3. Deploy

```bash
# Deploy specific client
node deploy-client.js client-a

# Deploy all clients
node build-all.js
```

### 4. Build Desktop Apps

```bash
# Build for specific client
node build-desktop.js client-a

# Build for all clients
node build-all.js --desktop
```

---

## 📋 Files in This Directory

See individual files for detailed documentation:

- `config.json` - Client definitions
- `setup-client.js` - Initialize new client
- `deploy-client.js` - Deploy to Vercel
- `build-desktop.js` - Build desktop app
- `build-all.js` - Build everything
- `templates/` - Configuration templates
