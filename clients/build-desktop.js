#!/usr/bin/env node

/**
 * Build desktop app for a specific client
 * Usage: node build-desktop.js <client-id>
 * Example: node build-desktop.js client-a
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = require('./config.json');
const clientId = process.argv[2];

if (!clientId) {
  console.error('Usage: node build-desktop.js <client-id>');
  console.error('Example: node build-desktop.js client-a');
  console.error('\nAvailable clients:');
  config.clients.forEach(c => {
    console.error(`  - ${c.id} (${c.name})`);
  });
  process.exit(1);
}

const client = config.clients.find(c => c.id === clientId);

if (!client) {
  console.error(`Client "${clientId}" not found in config.json`);
  process.exit(1);
}

console.log(`\n🏗️  Building desktop app for: ${client.name}\n`);

const clientDir = path.join(__dirname, clientId);
const distDir = path.join(clientDir, 'dist');

// Ensure directories exist
if (!fs.existsSync(clientDir)) {
  console.error(`Client directory not found. Run: node setup-client.js ${clientId}`);
  process.exit(1);
}

fs.mkdirSync(distDir, { recursive: true });

try {
  // Set environment variable for backend URL
  process.env.NEXT_PUBLIC_BACKEND_URL = client.backendUrl;
  process.env.NEXT_PUBLIC_CLIENT_ID = client.id;
  process.env.NEXT_PUBLIC_APP_NAME = client.appName;

  console.log(`📦 Building Next.js app...`);
  execSync('npm run build', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log(`✅ Next.js build complete\n`);

  console.log(`🦀 Building Tauri desktop app...`);
  console.log(`   Backend: ${client.backendUrl}`);
  console.log(`   App: ${client.appName}\n`);

  execSync('npm run desktop:build', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_BACKEND_URL: client.backendUrl,
      NEXT_PUBLIC_CLIENT_ID: client.id,
      NEXT_PUBLIC_APP_NAME: client.appName
    }
  });
  console.log(`✅ Tauri build complete\n`);

  // Copy desktop outputs to client dist
  const bundleDir = path.resolve(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle');

  if (fs.existsSync(bundleDir)) {
    console.log(`📂 Copying outputs to ${clientId}/dist/\n`);

    const files = fs.readdirSync(bundleDir);
    files.forEach(file => {
      const src = path.join(bundleDir, file);
      const dest = path.join(distDir, file);

      if (fs.lstatSync(src).isDirectory()) {
        copyDir(src, dest);
      } else {
        fs.copyFileSync(src, dest);
      }
      console.log(`✅ Copied: ${file}`);
    });
  }

  console.log(`\n✨ Desktop app build complete!\n`);
  console.log(`📍 Outputs in: clients/${clientId}/dist/\n`);
  console.log(`Files ready for distribution:`);
  fs.readdirSync(distDir).forEach(file => {
    const filePath = path.join(distDir, file);
    const size = getFileSize(filePath);
    console.log(`  - ${file} (${size})`);
  });
  console.log('');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  fs.readdirSync(src).forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function getFileSize(filePath) {
  try {
    if (fs.lstatSync(filePath).isDirectory()) {
      return '(directory)';
    }
    const bytes = fs.statSync(filePath).size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } catch (e) {
    return '(unknown)';
  }
}
