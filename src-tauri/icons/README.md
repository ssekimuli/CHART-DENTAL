# Tauri Desktop App Icons

Replace these placeholder icons with your app icons:

## Required Icons

- **icon.ico** - Windows application icon (256x256+ recommended)
- **icon.icns** - macOS application icon (512x512+ recommended)
- **32x32.png** - Linux taskbar icon
- **128x128.png** - Linux application icon
- **128x128@2x.png** - Linux high-DPI icon

## Icon Creation Tools

- **ImageMagick**: Convert images to different sizes
  ```bash
  convert logo.png -resize 256x256 icon.ico
  ```

- **Tauri Icon Generator**: Create all required sizes at once
  ```bash
  npm run tauri icon /path/to/logo.png
  ```

- **Online Tools**:
  - https://icoconvert.com/ (for .ico)
  - https://cloudconvert.com/ (for .icns)
  - Figma or Adobe XD for professional design

## Icon Guidelines

- **Transparency**: Use transparent backgrounds for best results
- **Safe Area**: Keep important content in center 80% of image
- **Colors**: Test on both light and dark backgrounds
- **Resolution**: Use high-resolution source (1024x1024+)

## Quick Generation (Using ImageMagick)

```bash
# Convert PNG to all required formats
convert logo.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
convert logo.png -resize 512x512 icon.icns
convert logo.png -resize 32x32 32x32.png
convert logo.png -resize 128x128 128x128.png
convert logo.png -resize 256x256 128x128@2x.png
```

You can use your existing `public/assets/dental-hygiene.png` as a starting point.
