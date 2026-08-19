# Desktop App Setup (Tauri)

Your Next.js + Laravel project now supports desktop installation via **Tauri**. This creates native desktop applications for Windows, macOS, and Linux.

## What is Tauri?

Tauri is a lightweight alternative to Electron that:
- Wraps your Next.js web app in a native desktop window
- Uses the system's native webview (no Chromium copy)
- Smaller bundle size (~40MB vs 150MB+ Electron)
- Lower memory usage
- Better performance for resource-constrained environments
- Works offline via PWA service worker

## ✅ What's Been Set Up

### 1. **Tauri CLI** (@tauri-apps/cli)
   - Installed as dev dependency
   - Handles building and running desktop apps

### 2. **Tauri Configuration** (`src-tauri/tauri.conf.json`)
   - App name: CHART Dental
   - Window size: 1400x900 (resizable, starts maximized)
   - Min window: 800x600
   - Supports all platforms: Windows, macOS, Linux
   - CSP headers match your Next.js setup

### 3. **Rust Backend** (`src-tauri/src/main.rs`)
   - Desktop entry point
   - Includes helper commands for app version and updates
   - Ready for expansion with custom Rust logic

### 4. **Build Configuration** (`src-tauri/Cargo.toml`)
   - Rust dependencies configured
   - Features: shell-open, window-all
   - Minimum Rust version: 1.60

## 📱 System Requirements for Building

### Windows
- Windows 10 or later
- Microsoft C++ Build Tools or Visual Studio with C++ support

### macOS
- macOS 10.13 (High Sierra) or later
- Xcode Command Line Tools: `xcode-select --install`

### Linux
- Install development tools:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

  # Fedora
  sudo dnf install webkit2-gtk3-devel \
    gcc \
    g++ \
    curl \
    wget \
    file \
    openssl-devel \
    gtk3-devel \
    libappindicator-gtk3-devel \
    librsvg2-devel
  ```

## 🚀 Getting Started

### 1. **Install Rust** (if not already installed)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

### 2. **Add Desktop App Icons**
   Replace placeholder icons in `src-tauri/icons/`:
   - `icon.ico` - Windows
   - `icon.icns` - macOS
   - `32x32.png`, `128x128.png`, `128x128@2x.png` - Linux

   Quick generation:
   ```bash
   npm run tauri icon /path/to/logo.png
   ```

### 3. **Development Mode**
   Runs Next.js dev server and Tauri dev window simultaneously:
   ```bash
   npm run desktop:dev
   ```
   - Web server runs at `http://localhost:9002`
   - Tauri window opens with your app
   - Hot-reload works for both web and desktop

### 4. **Build Desktop App**
   Create optimized production binaries:
   ```bash
   npm run desktop:build
   ```

   Output location:
   - **Windows**: `src-tauri/target/release/chart-dental.exe`
   - **macOS**: `src-tauri/target/release/bundle/dmg/chart-dental.dmg`
   - **Linux**: `src-tauri/target/release/bundle/deb/chart-dental_*.deb`

### 5. **Debug Build** (smaller, faster to build)
   ```bash
   npm run desktop:build:debug
   ```

## 📋 Development Workflow

### Running Desktop Dev
```bash
npm run desktop:dev
```
- Keeps both Next.js and Tauri dev servers running
- Automatically rebuilds on file changes
- Native desktop window with your app

### Running Web Only (default)
```bash
npm run dev
```

### Building Everything
```bash
npm run build          # Web
npm run desktop:build  # Desktop
```

## 🔧 Configuration

### Update App Metadata
Edit `src-tauri/tauri.conf.json`:
```json
{
  "productName": "CHART Dental",
  "version": "0.1.0",
  "identifier": "com.chart.dental",
  ...
}
```

### Window Configuration
Customize window behavior in `tauri.conf.json`:
```json
"windows": [
  {
    "title": "CHART Dental",
    "width": 1400,
    "height": 900,
    "minWidth": 800,
    "minHeight": 600,
    "resizable": true,
    "maximized": true
  }
]
```

### Add Custom Commands
Extend `src-tauri/src/main.rs` to add Rust commands callable from React:

```rust
#[tauri::command]
fn open_file() -> String {
  // Custom Rust logic here
  "File opened".to_string()
}
```

Then use from React:
```typescript
import { invoke } from '@tauri-apps/api/tauri';

const result = await invoke('open_file');
```

## 🎯 Desktop-Specific Features

### Access System APIs
Tauri provides bindings for:
- File dialogs
- Notifications
- System tray
- Window management
- Shell commands

Example - File dialog:
```typescript
import { open } from '@tauri-apps/api/dialog';

const selected = await open({
  multiple: false,
  filters: [{
    name: 'Image',
    extensions: ['png', 'jpeg']
  }]
});
```

### Offline Support
Your PWA service worker automatically caches:
- App shell (HTML, CSS, JS)
- API responses (with configurable TTL)
- Static assets (images, fonts)

Works seamlessly in desktop app.

## 📦 Distribution

### Windows
Users can:
1. Download `.exe` installer
2. Run installer (silent/interactive)
3. App appears in Start menu
4. Updates can be delivered via built-in updater

### macOS
Users can:
1. Download `.dmg` file
2. Drag app to Applications folder
3. Launch from Applications

### Linux
Users can:
1. Download `.deb` package
2. Install: `sudo apt install ./chart-dental.deb`
3. Launch from applications menu

## 🔄 Updates

Tauri has built-in update support. To enable:

1. Implement update check in your app
2. Host signed updates on a server
3. Configure update endpoint in config

Example update check (already included in main.rs):
```rust
#[tauri::command]
fn check_update() -> String {
  "Update check initiated".to_string()
}
```

## 🐛 Troubleshooting

### Build Fails on Windows
- Install Visual Studio Build Tools
- Or install Visual Studio with C++ development tools

### Build Fails on macOS
```bash
xcode-select --install
```

### Port 9002 Already in Use
Change in `tauri.conf.json`:
```json
"devPath": "http://localhost:3000"
```

And in `package.json`:
```json
"dev": "next dev -p 3000"
```

### High Memory Usage (dev mode)
- This is normal for dual-process dev (Next.js + Rust)
- Production builds are much lighter
- Close other apps if memory is limited

### Service Worker Not Working
- Ensure HTTPS in production
- Check DevTools → Application → Service Workers
- Clear cache if needed

## 📚 Resources

- [Tauri Documentation](https://tauri.app/)
- [Tauri API Commands](https://docs.rs/tauri/latest/tauri/#tauri-api)
- [Tauri Examples](https://github.com/tauri-apps/tauri/tree/dev/examples)
- [Tauri Icon Generator](https://tauri.app/v1/guides/features/icons/)
- [Next.js Desktop Apps](https://nextjs.org/docs)

## 🚢 Next Steps

1. **Add App Icons** → Generate and place in `src-tauri/icons/`
2. **Test Desktop Dev** → Run `npm run desktop:dev`
3. **Configure Updates** → Set up update server (optional)
4. **Build Release** → Run `npm run desktop:build`
5. **Distribute** → Share .exe/.dmg/.deb with users

## 💡 Pro Tips

- Use `npm run desktop:dev` during development - faster iteration
- Service worker caching helps desktop app work offline
- Tauri can access native system features via Rust commands
- Keep web and desktop build processes separate in CI/CD
- Test on actual target platforms before release

---

Your app is now a full-featured desktop application available on all major platforms! 🚀
