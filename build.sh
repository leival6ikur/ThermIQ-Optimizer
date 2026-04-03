#!/bin/bash
# Build script for macOS .app bundle

set -e

echo "🔨 Building ThermIQ for macOS..."
echo ""

# Check if in correct directory
if [ ! -f "build_mac.spec" ]; then
    echo "❌ Error: Must run from ThermIQ root directory"
    exit 1
fi

# Activate virtual environment
cd backend
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found"
    echo "   Run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

source venv/bin/activate
cd ..

echo "1️⃣  Cleaning previous builds..."
rm -rf build/ dist/ *.app

echo "2️⃣  Running PyInstaller..."
pyinstaller build_mac.spec

if [ -d "dist/ThermIQ.app" ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📦 Application bundle: dist/ThermIQ.app"
    echo "   Size: $(du -sh dist/ThermIQ.app | cut -f1)"
    echo ""
    echo "🧪 To test:"
    echo "   open dist/ThermIQ.app"
    echo ""
    echo "📤 To distribute:"
    echo "   - Compress: tar -czf ThermIQ-mac.tar.gz -C dist ThermIQ.app"
    echo "   - Or create DMG: (instructions in docs/PACKAGING.md)"
else
    echo "❌ Build failed - check output above"
    exit 1
fi
