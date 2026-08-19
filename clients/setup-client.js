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
const envContent = `# ${client.name} Environment Configuration
NEXT_PUBLIC_BACKEND_URL=${client.backendUrl}
NEXT_PUBLIC_CLIENT_ID=${client.id}
NEXT_PUBLIC_APP_NAME=${client.appName}
NEXT_PUBLIC_SUPPORT_EMAIL=${client.supportEmail}
NEXT_PUBLIC_SUPPORT_PHONE=${client.supportPhone}
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
    NEXT_PUBLIC_APP_NAME: client.appName
  }
};

fs.writeFileSync(
  path.join(clientDir, 'vercel.json'),
  JSON.stringify(vercelConfig, null, 2)
);
console.log(`✅ Created: ${clientId}/vercel.json`);

// Create tauri.conf.json template
const tauriConfig = {
  productName: client.appName,
  version: client.version,
  identifier: client.tauriId,
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

- \`.env.local\` - Environment variables (backend URL, etc.)
- \`vercel.json\` - Vercel deployment configuration
- \`src-tauri/tauri.conf.json\` - Desktop app configuration
- \`dist/\` - Build outputs (web and desktop)

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

Edit these files to customize for this client:
- \`.env.local\` - Change backend URL
- \`vercel.json\` - Vercel-specific settings
- \`src-tauri/tauri.conf.json\` - Desktop app name/icon

---

Generated from template. All clients share the same \`src/\` and \`public/\` code.
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
