# PWA Icon Generation

The PWA requires icon files in PNG format at these sizes:
- `pwa-icon-192.png` (192x192)
- `pwa-icon-512.png` (512x512)

## Option 1: Generate from SVG (Recommended)

Use the thumbnail SVG to generate PNG icons:

### Using ImageMagick (Command Line)
```bash
# Install ImageMagick
brew install imagemagick  # macOS
# sudo apt install imagemagick  # Linux

# Generate 192x192 icon
convert -background none -resize 192x192 thumbnail.svg pwa-icon-192.png

# Generate 512x512 icon
convert -background none -resize 512x512 thumbnail.svg pwa-icon-512.png
```

### Using Inkscape (GUI or Command Line)
```bash
# Export to PNG
inkscape thumbnail.svg --export-filename=pwa-icon-192.png --export-width=192 --export-height=192
inkscape thumbnail.svg --export-filename=pwa-icon-512.png --export-width=512 --export-height=512
```

### Using Online Tools
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `thumbnail.svg`
3. Set dimensions to 192x192 → Download as `pwa-icon-192.png`
4. Repeat for 512x512 → Download as `pwa-icon-512.png`

## Option 2: Use Favicon Generator

1. Go to https://realfavicongenerator.net/
2. Upload `logo_v3.svg`
3. Download the generated package
4. Extract and copy the required PNG files

## Option 3: Design Tool Export

If using Figma, Sketch, or Adobe Illustrator:
1. Open `logo_v3.svg`
2. Export as PNG at @1x, @2x scales
3. Save as appropriate dimensions

## Temporary Placeholder

Until you generate proper icons, the app will use the SVG favicon as fallback.
The PWA functionality will still work, but the app icon may not look optimal when installed.

## Testing Icons

After generating icons:
1. Clear browser cache
2. Reload the app
3. Open DevTools → Application → Manifest
4. Verify icons appear correctly
5. Try installing the PWA to test the icon appearance
