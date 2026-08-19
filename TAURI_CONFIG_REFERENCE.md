# Tauri Configuration Reference

Complete breakdown of `src-tauri/tauri.conf.json` for DentiChair desktop app.

---

## 📋 Core Application Settings

### productName
```json
"productName": "DentiChair"
```
- **Purpose:** Display name for the application
- **Used in:** Installer, window title, app menus
- **Status:** ✅ Correctly set to "DentiChair"

### version
```json
"version": "0.1.0"
```
- **Purpose:** Application version
- **Format:** Semantic versioning (major.minor.patch)
- **Status:** ✅ Initial release version
- **Update:** Increment for each release

### identifier
```json
"identifier": "com.dentichair.app"
```
- **Purpose:** Unique app identifier across all platforms
- **Format:** Reverse domain notation (com.company.appname)
- **Usage:** Bundle ID (macOS), App ID (Windows), Package name (Linux)
- **Status:** ✅ Valid and unique
- **Important:** Do NOT change after first release (breaks updates)

---

## 🔨 Build Configuration

### beforeBuildCommand
```json
"beforeBuildCommand": "npm run build"
```
- **Purpose:** Command run before building Tauri app
- **Action:** Builds Next.js production bundle
- **Output:** `.next/` directory with optimized code
- **Status:** ✅ Correct for Next.js
- **Note:** Runs only during `npm run desktop:build`

### beforeDevCommand
```json
"beforeDevCommand": "npm run dev"
```
- **Purpose:** Command run before starting dev mode
- **Action:** Starts Next.js dev server
- **Port:** 9002 (specified in package.json)
- **Hot Reload:** Enabled automatically
- **Status:** ✅ Correct for Next.js development
- **Note:** Runs only during `npm run desktop:dev`

### devPath
```json
"devPath": "http://localhost:9002"
```
- **Purpose:** URL of dev server during development
- **Port:** Must match Next.js dev server port
- **Status:** ✅ Matches `npm run dev -p 9002` in package.json
- **Important:** 
  - Dev mode: Loads from this URL
  - Production: Loads from bundled static files

### frontendDist
```json
"frontendDist": "../.next/static"
```
- **Purpose:** Path to production frontend assets
- **Used:** In production builds for app
- **Source:** Output of `npm run build`
- **Status:** ✅ Correct Next.js output directory
- **Path Relative To:** `src-tauri/tauri.conf.json`

---

## 🪟 Window Configuration

### app.windows[]
```json
"windows": [
  {
    "title": "DentiChair",
    "width": 1400,
    "height": 900,
    "minWidth": 800,
    "minHeight": 600,
    "resizable": true,
    "fullscreen": false,
    "focus": true,
    "alwaysOnTop": false,
    "kdeTransparencyHint": false,
    "skipTaskbar": false,
    "hiddenTitle": false,
    "visible": true,
    "decorations": true,
    "transparent": false,
    "maximized": true
  }
]
```

#### Title
- **Value:** "DentiChair"
- **Display:** Window title bar and taskbar
- **Runtime Update:** Can be changed via JavaScript after load
- **Note:** For client-specific branding, use Tauri API to update at runtime

#### Size Settings
| Setting | Value | Purpose |
|---------|-------|---------|
| `width` | 1400 | Initial window width (pixels) |
| `height` | 900 | Initial window height (pixels) |
| `minWidth` | 800 | Minimum allowed width |
| `minHeight` | 600 | Minimum allowed height |

#### Window Behavior
| Setting | Value | Purpose |
|---------|-------|---------|
| `resizable` | true | Allow user to resize window |
| `fullscreen` | false | Don't start in fullscreen |
| `focus` | true | Focus window on launch |
| `alwaysOnTop` | false | Don't keep window on top |
| `maximized` | true | **Start maximized** ✅ |
| `visible` | true | Show window on launch |
| `decorations` | true | Show native window frame |

#### Advanced Settings
| Setting | Value | Purpose |
|---------|-------|---------|
| `kdeTransparencyHint` | false | KDE Linux specific |
| `skipTaskbar` | false | Show in taskbar |
| `hiddenTitle` | false | Show window title |
| `transparent` | false | No transparency effects |

**Status:** ✅ All settings optimal for professional dental app

---

## 🔒 Security Configuration

### app.security
```json
"security": {
  "csp": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net; font-src 'self' https://js.stripe.com https://fonts.googleapis.com https://fonts.gstatic.com; frame-src https://js.stripe.com https://hooks.stripe.com; connect-src 'self' https://api.stripe.com https://q.stripe.com https://dentalapi.poslycloud.com https://stagingapi.poslycloud.com; img-src 'self' data: https:;"
}
```

#### Content Security Policy (CSP)
Restricts what resources the app can load:

**Allowed Sources:**

| Directive | Allowed |
|-----------|---------|
| `default-src` | 'self' (app origin only) |
| `script-src` | 'self', inline scripts, Stripe, CDN |
| `font-src` | 'self', Google Fonts, Stripe |
| `frame-src` | Stripe payment frames |
| `connect-src` | APIs: Stripe, DentiChair, Staging |
| `img-src` | 'self', data URIs, https |

#### Important Entries
```
https://js.stripe.com                    ✅ Stripe payments
https://api.stripe.com                   ✅ Stripe API
https://dentalapi.poslycloud.com         ✅ Production backend
https://stagingapi.poslycloud.com        ✅ Staging backend
```

**Status:** ✅ Configured for Stripe + DentiChair backends

#### Updating CSP
If you add new external services:
```json
"connect-src": "'self' https://new-service.com"
```

---

## 📦 Bundle Configuration

### bundle.active & targets
```json
"active": true,
"targets": "all"
```
- **active:** Bundling enabled
- **targets:** Build for all platforms (Windows, macOS, Linux)
- **Status:** ✅ Ready for multi-platform releases

### bundle.identifier
```json
"identifier": "com.dentichair.app"
```
- **Purpose:** Same as app identifier
- **Must Match:** Top-level `identifier` field
- **Status:** ✅ Matches

### bundle.icon
```json
"icon": [
  "icons/32x32.png",
  "icons/128x128.png",
  "icons/128x128@2x.png",
  "icons/icon.icns",
  "icons/icon.ico"
]
```

**Icon Files Required:**

| File | Purpose | Size |
|------|---------|------|
| `32x32.png` | Linux taskbar | 32×32 |
| `128x128.png` | Linux app | 128×128 |
| `128x128@2x.png` | Linux high-DPI | 256×256 |
| `icon.icns` | macOS app | 512×512+ |
| `icon.ico` | Windows app | 256×256+ |

**Status:** ⚠️ Icons needed before build
```bash
cd clients && node generate-icons.js
```

### bundle.resources
```json
"resources": []
```
- **Purpose:** Extra files to bundle with app
- **Current:** Empty (not needed)
- **Status:** ✅ OK

### bundle.copyright
```json
"copyright": "© 2024 DentiChair. All rights reserved."
```
- **Display:** Installer and about dialogs
- **Status:** ✅ Correctly set

### bundle.category
```json
"category": "Utilities"
```
- **Purpose:** App category in OS menus
- **Options:** Utilities, Office, Development, Education, etc.
- **Status:** ✅ Appropriate for dental software

### bundle.shortDescription
```json
"shortDescription": "Professional Dental Practice Management"
```
- **Display:** Installer summary
- **Length:** Keep under 80 characters
- **Status:** ✅ Clear and concise

### bundle.longDescription
```json
"longDescription": "DentiChair is a comprehensive dental practice management system..."
```
- **Display:** Installer details, app store
- **Status:** ✅ Professional description

---

## 💿 Platform-Specific Configuration

### Windows Settings
```json
"windows": {
  "certificateThumbprint": null,
  "digestAlgorithm": "sha256",
  "signingIdentity": null,
  "sign": "./gen/signing",
  "publisher": "DentiChair"
}
```

| Setting | Value | Purpose |
|---------|-------|---------|
| `publisher` | DentiChair | Shown in installer |
| `digestAlgorithm` | sha256 | Secure signing algorithm |
| `certificateThumbprint` | null | For code signing (optional) |
| `signingIdentity` | null | For code signing (optional) |

**Status:** ✅ Ready for unsigned dev builds
**For Production:** Add code signing certificate

### macOS Settings
```json
"macOS": {
  "frameworks": [],
  "minimumSystemVersion": "10.13",
  "useBootstrapper": true,
  "exceptionDomain": "com.dentichair.app"
}
```

| Setting | Value | Purpose |
|---------|-------|---------|
| `minimumSystemVersion` | 10.13 | High Sierra compatibility |
| `useBootstrapper` | true | For app updates |
| `exceptionDomain` | com.dentichair.app | App sandbox exceptions |
| `frameworks` | [] | No extra frameworks needed |

**Status:** ✅ Compatible with modern macOS

### Linux Settings
```json
"deb": {
  "depends": [],
  "useBootstrapper": true
}
```

| Setting | Purpose |
|---------|---------|
| `useBootstrapper` | Enable auto-updates |
| `depends` | Extra dependencies (none needed) |

**Status:** ✅ Ready for Debian/Ubuntu

---

## 🚀 Build & Run Commands

### Development
```bash
npm run desktop:dev
```
- Runs: `beforeDevCommand` → Starts dev server
- Connects to: http://localhost:9002
- Hot reload: Enabled
- Watch mode: Active

### Production Build
```bash
npm run desktop:build
```
- Runs: `beforeBuildCommand` → Builds Next.js
- Outputs:
  - Windows: `.exe` installer
  - macOS: `.dmg` bundle
  - Linux: `.deb` package

### Debug Build
```bash
npm run desktop:build:debug
```
- Faster than production
- Smaller output
- Debugging symbols included

---

## ✅ Configuration Checklist

- [x] `productName`: DentiChair
- [x] `version`: 0.1.0
- [x] `identifier`: com.dentichair.app (valid & unique)
- [x] Build commands: Correct for Next.js
- [x] Dev path: localhost:9002
- [x] Frontend dist: ../.next/static
- [x] Window size: 1400×900 (resizable)
- [x] Min window size: 800×600
- [x] CSP headers: Stripe + DentiChair APIs
- [x] Icons: Path specified, files needed
- [x] All platforms: Windows, macOS, Linux
- [x] Publisher: DentiChair
- [x] Copyright: © 2024 DentiChair

---

## 🔄 Common Updates

### Update Version
```json
"version": "0.2.0"
```
Update both here AND in `Cargo.toml`

### Update Copyright Year
```json
"copyright": "© 2025 DentiChair. All rights reserved."
```

### Add New API Domain
```json
"connect-src": "'self' https://new-api.com"
```

### Change Window Size
```json
"width": 1600,
"height": 1000
```

---

## 📝 Notes

1. **Icons Required Before Build**
   - Run `cd clients && node generate-icons.js`
   - Generates icons from `public/assets/icon.png`

2. **CSP Security Policy**
   - Restricts external resources
   - Add new domains only when needed
   - Stripe is already configured

3. **Dev vs Production**
   - Dev: Loads from localhost:9002
   - Production: Loads from bundled files

4. **Identifier Stability**
   - Never change after first release
   - Breaks auto-update mechanism
   - Creates duplicate apps on user machines

5. **Multi-Platform Building**
   - Requires platform-specific tools
   - Windows: Only on Windows
   - macOS: Only on macOS or with cross-compilation
   - Linux: On any platform

---

## 🎯 Summary

✅ **tauri.conf.json is properly configured for DentiChair**

- Correct app identity (com.dentichair.app)
- Optimized for Next.js
- Security configured for APIs
- All platforms supported
- Ready for icon generation and builds

**Ready to:** Generate icons → Build desktop app → Distribute to users 🚀
