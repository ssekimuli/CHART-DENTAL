#!/usr/bin/env node

/**
 * Setup a new client deployment
 * Usage: node setup-client.js <client-id>
 * Example: node setup-client.js client-a
 */

const fs = require('fs');
const path = require('path');

const config = require('./config.json');
const clientId = process.argv[2];

if (!clientId) {
  console.error('Usage: node setup-client.js <client-id>');
  console.error('Example: node setup-client.js client-a');
  process.exit(1);
}

const client = config.clients.find(c => c.id === clientId);

if (!client) {
  console.error(`Client "${clientId}" not found in config.json`);
  process.exit(1);
}

console.log(`\n🚀 Setting up deployment for: ${client.name}\n`);

// Create client directory
const clientDir = path.join(__dirname, clientId);
if (!fs.existsSync(clientDir)) {
  fs.mkdirSync(clientDir, { recursive: true });
  console.log(`✅ Created directory: ${clientDir}`);
}

// Create .env.local
// Note: Client branding (name, colors, support info) now comes from API
// Only backend URL is needed in .env since it's set at build time
const envContent = `# ${client.name} Environment Configuration
# API-driven client configuration - most values fetched from backend at runtime

# Backend API URL (REQUIRED)
# Used to fetch client configuration from: GET /client-config
NEXT_PUBLIC_BACKEND_URL=${client.backendUrl}

# Note: The following client configuration is now fetched dynamically from API:
# - Client ID, Name, Display Name
# - App Name (shown in browser tab and desktop app)
# - Theme & Brand Colors
# - Support Email & Phone
# - Feature Flags (PWA, Desktop, Offline)
#
# See API_CLIENT_CONFIG.md for backend implementation details
`;

fs.writeFileSync(path.join(clientDir, '.env.local'), envContent);
console.log(`✅ Created: ${clientId}/.env.local`);

// Create vercel.json
const vercelConfig = {
  projectId: client.vercelProject,
  orgId: client.vercelTeam,
  buildCommand: 'npm run build',
  devCommand: 'npm run dev',
  outputDirectory: '.next',
  public: false,
  env: {
    NEXT_PUBLIC_BACKEND_URL: client.backendUrl,
    NEXT_PUBLIC_CLIENT_ID: client.id,
    NEXT_PUBLIC_CLIENT_NAME: client.name,
    NEXT_PUBLIC_CLIENT_DISPLAY_NAME: client.displayName,
    NEXT_PUBLIC_APP_NAME: client.appName,
    NEXT_PUBLIC_PRIMARY_COLOR: client.theme?.primaryColor || '#0070f3',
    NEXT_PUBLIC_SUPPORT_EMAIL: client.supportEmail || '',
    NEXT_PUBLIC_SUPPORT_PHONE: client.supportPhone || ''
  }
};

fs.writeFileSync(
  path.join(clientDir, 'vercel.json'),
  JSON.stringify(vercelConfig, null, 2)
);
console.log(`✅ Created: ${clientId}/vercel.json`);

// Create tauri.conf.json template (for client-specific Tauri config)
const tauriConfig = {
  productName: client.appName,
  version: client.version,
  identifier: client.tauriId || 'com.dentichair.app',
  build: {
    beforeBuildCommand: 'npm run build',
    beforeDevCommand: 'npm run dev',
    devPath: 'http://localhost:9002',
    frontendDist: '../.next/static'
  },
  app: {
    windows: [
      {
        title: client.appName,
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        resizable: true,
        maximized: true
      }
    ]
  },
  bundle: {
    active: true,
    targets: 'all',
    identifier: client.tauriId,
    icon: ['icons/32x32.png', 'icons/128x128.png', 'icons/icon.icns', 'icons/icon.ico']
  }
};

const tauriDir = path.join(clientDir, 'src-tauri');
fs.mkdirSync(tauriDir, { recursive: true });

fs.writeFileSync(
  path.join(tauriDir, 'tauri.conf.json'),
  JSON.stringify(tauriConfig, null, 2)
);
console.log(`✅ Created: ${clientId}/src-tauri/tauri.conf.json`);

// Create dist directory for outputs
const distDir = path.join(clientDir, 'dist');
fs.mkdirSync(distDir, { recursive: true });
console.log(`✅ Created: ${clientId}/dist/`);

// Create README for client
const clientReadme = `# ${client.name} Deployment

Client ID: \`${client.id}\`

## Configuration

- **Domain:** ${client.domain}
- **Backend:** ${client.backendUrl}
- **Vercel Project:** ${client.vercelProject}
- **App Name:** ${client.appName}

## Files

- \`.env.local\` - Backend URL only (branding from API)
- \`vercel.json\` - Vercel deployment configuration
- \`src-tauri/tauri.conf.json\` - Desktop app configuration
- \`dist/\` - Build outputs (web and desktop)

## Client Configuration

Most client configuration (branding, colors, support info) is **fetched dynamically from API**:

\`\`\`
GET /client-config → Returns client branding & config
\`\`\`

This allows updating client branding without redeploying.

See \`API_CLIENT_CONFIG.md\` for backend implementation.

## Deploy

### Web (Vercel)
\`\`\`bash
cd clients/${clientId}
vercel deploy --prod
\`\`\`

### Desktop
\`\`\`bash
cd clients/${clientId}
npm run desktop:build
# Outputs in: dist/
\`\`\`

## Customization

Only these files need customization:
- \`.env.local\` - Backend URL (if different)
- \`vercel.json\` - Vercel-specific settings (rarely needed)
- \`src-tauri/tauri.conf.json\` - Desktop app name only

**Branding changes:** Update in database/backend API, not in config files.

---

Generated from template. All clients share the same \`src/\` and \`public/\` code.

Client configuration is fetched from API at runtime for true multi-tenant support.
`;

fs.writeFileSync(
  path.join(clientDir, 'README.md'),
  clientReadme
);
console.log(`✅ Created: ${clientId}/README.md`);

console.log(`\n✨ Client setup complete!\n`);
console.log(`Next steps:`);
console.log(`1. Review ${clientDir}/.env.local`);
console.log(`2. Deploy: vercel deploy --prod`);
console.log(`3. Build desktop: npm run desktop:build\n`);
