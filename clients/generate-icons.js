#!/usr/bin/env node

/**
 * Generate icons from public/assets/icon.png for all clients
 * Creates PWA icons in public/icons/ and desktop icons in src-tauri/icons/
 *
 * Prerequisites: ImageMagick (convert command)
 *
 * Usage:
 *   node generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceIcon = path.join(__dirname, '..', 'public', 'assets', 'icon.png');

console.log(`\n🎨 Generating icons from: ${sourceIcon}\n`);

// Check if source icon exists
if (!fs.existsSync(sourceIcon)) {
  console.error(`❌ Source icon not found: ${sourceIcon}`);
  console.error('Make sure public/assets/icon.png exists');
  process.exit(1);
}

// Check if ImageMagick is installed
try {
  execSync('convert --version', { stdio: 'ignore' });
} catch (e) {
  console.error('❌ ImageMagick not installed');
  console.error('Install from: https://imagemagick.org/script/download.php');
  console.error('Or use: brew install imagemagick (macOS)');
  console.error('Or use: sudo apt-get install imagemagick (Linux)');
  process.exit(1);
}

// PWA Icons (public/icons/)
const pwaIconDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(pwaIconDir, { recursive: true });

console.log('📱 Creating PWA icons...');

const pwaIcons = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 192, name: 'icon-192x192-maskable.png' },
  { size: 512, name: 'icon-512x512-maskable.png' }
];

pwaIcons.forEach(icon => {
  const output = path.join(pwaIconDir, icon.name);
  try {
    execSync(`convert "${sourceIcon}" -resize ${icon.size}x${icon.size} "${output}"`, {
      stdio: 'inherit'
    });
    console.log(`✅ ${icon.name}`);
  } catch (e) {
    console.error(`❌ Failed to create ${icon.name}`);
  }
});

// Desktop Icons (src-tauri/icons/)
const desktopIconDir = path.join(__dirname, '..', 'src-tauri', 'icons');
fs.mkdirSync(desktopIconDir, { recursive: true });

console.log('\n🖥️  Creating Desktop icons...');

const desktopIcons = [
  { size: 32, name: '32x32.png' },
  { size: 128, name: '128x128.png' },
  { size: 256, name: '128x128@2x.png' }
];

desktopIcons.forEach(icon => {
  const output = path.join(desktopIconDir, icon.name);
  try {
    execSync(`convert "${sourceIcon}" -resize ${icon.size}x${icon.size} "${output}"`, {
      stdio: 'inherit'
    });
    console.log(`✅ ${icon.name}`);
  } catch (e) {
    console.error(`❌ Failed to create ${icon.name}`);
  }
});

// Windows ICO
console.log('\n🪟 Creating Windows ICO...');
try {
  const icoOutput = path.join(desktopIconDir, 'icon.ico');
  execSync(`convert "${sourceIcon}" -define icon:auto-resize=256,128,64,48,32,16 "${icoOutput}"`, {
    stdio: 'inherit'
  });
  console.log('✅ icon.ico');
} catch (e) {
  console.error('❌ Failed to create icon.ico');
  console.error('You can create it manually at: https://icoconvert.com/');
}

// macOS ICNS
console.log('\n🍎 Creating macOS ICNS...');
try {
  const icnsOutput = path.join(desktopIconDir, 'icon.icns');
  execSync(`convert "${sourceIcon}" -resize 512x512 "${icnsOutput}"`, {
    stdio: 'inherit'
  });
  console.log('✅ icon.icns (basic)');
  console.log('   Note: For production, create proper ICNS at: https://cloudconvert.com/');
} catch (e) {
  console.error('❌ Failed to create icon.icns');
  console.error('Create it manually at: https://cloudconvert.com/png-to-icns');
}

console.log(`\n✨ Icon generation complete!\n`);
console.log('📍 PWA Icons: public/icons/');
console.log('📍 Desktop Icons: src-tauri/icons/');
console.log('\n✅ All clients will use these icons\n');
