/**
 * Generate PWA icons from SVG logo
 *
 * This script attempts to generate PNG icons from the logo SVG.
 * It tries multiple methods in order of preference.
 *
 * Usage: node scripts/generate-pwa-icons.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const logoPath = path.join(publicDir, 'thumbnail.svg');

const sizes = [
  { size: 192, filename: 'pwa-icon-192.png' },
  { size: 512, filename: 'pwa-icon-512.png' }
];

console.log('🎨 Generating PWA icons from SVG...\n');

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.error('❌ Thumbnail file not found:', logoPath);
  console.log('\nPlease ensure thumbnail.svg exists in the public directory.');
  process.exit(1);
}

// Method 1: Try ImageMagick
function tryImageMagick() {
  try {
    execSync('convert -version', { stdio: 'ignore' });
    console.log('✓ Using ImageMagick (convert)');

    for (const { size, filename } of sizes) {
      const outPath = path.join(publicDir, filename);
      execSync(
        `convert -background none -resize ${size}x${size} "${logoPath}" "${outPath}"`,
        { stdio: 'inherit' }
      );
      console.log(`  ✓ Generated ${filename}`);
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Method 2: Try Inkscape
function tryInkscape() {
  try {
    execSync('inkscape --version', { stdio: 'ignore' });
    console.log('✓ Using Inkscape');

    for (const { size, filename } of sizes) {
      const outPath = path.join(publicDir, filename);
      execSync(
        `inkscape "${logoPath}" --export-filename="${outPath}" --export-width=${size} --export-height=${size}`,
        { stdio: 'inherit' }
      );
      console.log(`  ✓ Generated ${filename}`);
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Method 3: Try rsvg-convert (librsvg)
function tryRsvg() {
  try {
    execSync('rsvg-convert --version', { stdio: 'ignore' });
    console.log('✓ Using rsvg-convert (librsvg)');

    for (const { size, filename } of sizes) {
      const outPath = path.join(publicDir, filename);
      execSync(
        `rsvg-convert -w ${size} -h ${size} "${logoPath}" -o "${outPath}"`,
        { stdio: 'inherit' }
      );
      console.log(`  ✓ Generated ${filename}`);
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Try methods in order
const success = tryImageMagick() || tryInkscape() || tryRsvg();

if (success) {
  console.log('\n✅ PWA icons generated successfully!');
  console.log('\nGenerated files:');
  for (const { filename } of sizes) {
    console.log(`  - public/${filename}`);
  }
} else {
  console.log('\n⚠️  No suitable SVG converter found.');
  console.log('\nPlease install one of the following:');
  console.log('  • ImageMagick:  brew install imagemagick');
  console.log('  • Inkscape:     brew install inkscape');
  console.log('  • librsvg:      brew install librsvg');
  console.log('\nOr generate icons manually - see public/PWA_ICONS_README.md');
  process.exit(1);
}
