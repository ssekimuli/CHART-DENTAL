# Shared Icon Setup

All clients use a single icon from `public/assets/icon.png` for both PWA and desktop apps.

## 🎨 How It Works

```
public/assets/icon.png (source)
        ↓
   Generate icons
        ↓
    ┌───┴────┐
    ↓        ↓
PWA Icons   Desktop Icons
public/     src-tauri/
icons/      icons/
```

All clients use the same icons → Consistent branding across all deployments.

---

## 🚀 Setup

### 1. Place Your Icon

Put your icon at:
```
public/assets/icon.png
```

**Requirements:**
- PNG format
- Minimum 512x512 pixels (or higher)
- Transparent or solid background
- Square format (1:1 ratio)

### 2. Generate All Icon Sizes

Run the icon generator:
```bash
cd clients
node generate-icons.js
```

This creates:
- **PWA icons** in `public/icons/`
  - `icon-192x192.png`
  - `icon-512x512.png`
  - `icon-192x192-maskable.png` (Android adaptive)
  - `icon-512x512-maskable.png` (Android adaptive)

- **Desktop icons** in `src-tauri/icons/`
  - `32x32.png` (Linux)
  - `128x128.png` (Linux)
  - `128x128@2x.png` (Linux high-DPI)
  - `icon.ico` (Windows)
  - `icon.icns` (macOS)

### 3. Deploy

Now when you build for any client, they automatically get the same icon:
```bash
npm run build          # Web/PWA
npm run desktop:build  # Desktop
```

---

## 📋 Icon Requirements

| Use Case | Format | Size | Details |
|----------|--------|------|---------|
| PWA Icon | PNG | 512x512+ | Transparent background |
| Desktop | PNG | 512x512+ | Can be square or with alpha |
| Favicon | PNG | 256x256+ | From `assets/dental-hygiene.png` |

---

## 🖼️ Using Your Existing Icon

If you already have an icon at `public/assets/dental-hygiene.png`:

### Option A: Copy It
```bash
cp public/assets/dental-hygiene.png public/assets/icon.png
node clients/generate-icons.js
```

### Option B: Update Source Reference
Edit `public/assets/icon.png` to point to your preferred icon.

---

## 🎯 Icon Customization

### Update Icon for All Clients
```bash
# 1. Replace source icon
cp your-logo.png public/assets/icon.png

# 2. Regenerate all sizes
cd clients
node generate-icons.js

# 3. Rebuild all clients
npm run build
npm run desktop:build
```

All clients automatically use the new icon.

---

## ✅ Verification

After generating icons, check:

```bash
# PWA icons
ls -la public/icons/
# Should show: icon-192x192.png, icon-512x512.png, etc.

# Desktop icons
ls -la src-tauri/icons/
# Should show: icon.ico, icon.icns, 32x32.png, etc.
```

---

## 🔄 For Multiple Clients

All clients in `clients/config.json` now reference:
```json
"icon": "public/assets/icon.png"
```

When you deploy any client:
- **Web:** Uses icons from `public/icons/`
- **PWA:** Uses manifest with icons
- **Desktop:** Uses icons from `src-tauri/icons/`

**All from the same source icon!**

---

## 🛠️ Troubleshooting

### generate-icons.js fails
```
❌ ImageMagick not installed
```

**Solution:** Install ImageMagick
- **macOS:** `brew install imagemagick`
- **Linux:** `sudo apt-get install imagemagick`
- **Windows:** Download from https://imagemagick.org/

### Icon looks blurry
- Source icon is too small (<512x512)
- Use a high-resolution source (1024x1024+)

### Colors look wrong
- Transparency not preserved
- Make sure source has transparent background
- Check color profile of PNG

### Android app looks weird
- Maskable icons need safe area (80% center)
- Use https://maskable.app/ to test

---

## 📚 Next Steps

1. ✅ Place icon at `public/assets/icon.png`
2. ✅ Run `node clients/generate-icons.js`
3. ✅ Verify icons were created
4. ✅ Build and deploy: `npm run build`
5. ✅ All clients get the same icon!

---

## 💡 Tips

- **Keep original:** Backup your source icon
- **High-res:** Use 1024x1024 or higher for best results
- **Update:** Every client gets new icon when you update source
- **Consistent:** Same icon across web, PWA, and desktop
- **Branding:** Use your company logo for instant recognition

---

All clients now share the same professional icon! 🎨
