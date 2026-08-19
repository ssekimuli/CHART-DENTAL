# Quick Start: Desktop App

Get your desktop app running in 5 minutes.

## Prerequisites

### Windows
- Windows 10 or later
- Microsoft C++ Build Tools (install if you don't have it)
  - Download: https://visualstudio.microsoft.com/downloads/
  - Select "Desktop development with C++"

### macOS
```bash
xcode-select --install
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

## Step 1: Install Rust (One Time)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Restart your terminal after installation.

## Step 2: Run Desktop Dev

```bash
npm run desktop:dev
```

This will:
1. Start your Next.js dev server (port 9002)
2. Build the Tauri backend
3. Open a native desktop window with your app
4. Enable hot-reload on file changes

**Wait 2-3 minutes** for first build (Rust compilation).

## Step 3: Test Features

In the running desktop app:
- ✅ Navigate around your app
- ✅ Check console in DevTools (Cmd+I on macOS, Ctrl+I on Windows/Linux)
- ✅ Try offline: DevTools → Network → Offline

## Step 4: Build for Distribution

When ready to release:

```bash
npm run desktop:build
```

**Output files:**
- **Windows**: `src-tauri/target/release/chart-dental.exe`
- **macOS**: `src-tauri/target/release/bundle/dmg/chart-dental.dmg`
- **Linux**: `src-tauri/target/release/bundle/deb/chart-dental_*.deb`

Share these with users!

---

## 📦 Adding App Icons (Required Before Release)

Replace placeholder icons in `src-tauri/icons/`:

Quick generation using Tauri's built-in tool:
```bash
npm run tauri icon /path/to/your/logo.png
```

Or manual generation:
```bash
# If you have ImageMagick installed
convert logo.png -define icon:auto-resize=256,128,64,48,32,16 src-tauri/icons/icon.ico
```

Required files:
- `icon.ico` - Windows
- `icon.icns` - macOS  
- `32x32.png`, `128x128.png`, `128x128@2x.png` - Linux

See `src-tauri/icons/README.md` for detailed requirements.

---

## 🐛 Common Issues

### "Error: failed to run custom build command for `tauri-build`"
**Solution**: Install C++ build tools (see Prerequisites above)

### "Port 9002 already in use"
**Solution**: Change port in `tauri.conf.json`:
```json
"devPath": "http://localhost:3000"
```
And update `package.json`:
```json
"dev": "next dev -p 3000"
```

### Build takes forever
**This is normal.** First build can take 3-5 minutes as Rust compiles dependencies. Subsequent builds are faster.

### High memory usage during dev
**This is normal.** Dual process (Next.js + Rust) uses more memory. Close other apps if needed.

---

## 📚 Next Steps

1. **Add icons** → Generate and place in `src-tauri/icons/`
2. **Test desktop app** → Run `npm run desktop:dev`
3. **Build release** → Run `npm run desktop:build`
4. **Distribute** → Share `.exe` / `.dmg` / `.deb` files

---

## 🎯 Full Documentation

- **Desktop Setup Details**: `DESKTOP_APP_SETUP.md`
- **PWA Setup**: `PWA_SETUP.md`
- **Multi-Platform Guide**: `MULTI_PLATFORM_GUIDE.md`

---

## ⚡ TL;DR Commands

```bash
# Development (one time setup)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Development (every session)
npm run desktop:dev

# Production build
npm run desktop:build

# Faster debug build
npm run desktop:build:debug
```

---

You're all set! Your desktop app is ready to go. 🚀

Questions? Check the full docs at `DESKTOP_APP_SETUP.md`.
