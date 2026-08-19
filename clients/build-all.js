#!/usr/bin/env node

/**
 * Build desktop apps for all clients
 * Usage: node build-all.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = require('./config.json');

console.log(`\n🚀 Building desktop apps for all clients\n`);
console.log(`Clients: ${config.clients.length}`);
config.clients.forEach(c => {
  console.log(`  - ${c.id}: ${c.name}`);
});
console.log('');

let failed = [];
let succeeded = [];

config.clients.forEach((client, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${index + 1}/${config.clients.length}] Building: ${client.name}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    execSync(`node build-desktop.js ${client.id}`, {
      cwd: __dirname,
      stdio: 'inherit'
    });
    succeeded.push(client.id);
  } catch (error) {
    console.error(`\n❌ Failed to build: ${client.id}\n`);
    failed.push(client.id);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`BUILD SUMMARY`);
console.log(`${'='.repeat(60)}\n`);

if (succeeded.length > 0) {
  console.log(`✅ Succeeded (${succeeded.length}):`);
  succeeded.forEach(id => {
    const client = config.clients.find(c => c.id === id);
    console.log(`   - ${client.name}`);
    console.log(`     📍 clients/${id}/dist/`);
  });
}

if (failed.length > 0) {
  console.log(`\n❌ Failed (${failed.length}):`);
  failed.forEach(id => {
    const client = config.clients.find(c => c.id === id);
    console.log(`   - ${client.name}`);
  });
}

console.log(`\n${'='.repeat(60)}\n`);

if (failed.length > 0) {
  process.exit(1);
}
