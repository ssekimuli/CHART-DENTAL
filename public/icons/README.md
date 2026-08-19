# PWA Icons

Place your PWA icons in this directory. The following files are required:

## App Icons
- `icon-192x192.png` - 192x192 standard icon
- `icon-512x512.png` - 512x512 standard icon
- `icon-192x192-maskable.png` - 192x192 maskable icon (for adaptive icons on Android)
- `icon-512x512-maskable.png` - 512x512 maskable icon

## Screenshots (Optional)
- `screenshot-1.png` - 540x720 narrow form factor (mobile)
- `screenshot-2.png` - 1280x720 wide form factor (tablet/desktop)

## Dashboard Shortcut Icon (Optional)
- `dashboard-96x96.png` - 96x96 icon for app shortcuts

## Icon Requirements
- Format: PNG with transparency
- For maskable icons: Design should work when cropped to a circle (safe zone ~80% of icon)
- Background should be transparent or include your brand color

## Generating Icons
You can use online tools or libraries:
- https://www.favicon-generator.org/
- https://maskable.app/ (for maskable icons)
- ImageMagick or similar CLI tools

Example using ImageMagick:
```bash
convert logo.png -resize 192x192 icon-192x192.png
```
