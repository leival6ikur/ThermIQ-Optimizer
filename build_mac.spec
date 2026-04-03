# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for macOS .app bundle

Usage:
    pyinstaller build_mac.spec
"""

import os
from pathlib import Path

block_cipher = None

# Project root
root_dir = Path(SPECPATH)
backend_dir = root_dir / 'backend'

# Analysis: Find all Python files and dependencies
a = Analysis(
    [str(backend_dir / 'app' / 'main.py')],
    pathex=[str(backend_dir)],
    binaries=[
        # Include Mosquitto binary
        (str(root_dir / 'mosquitto' / 'mac' / 'mosquitto'), 'mosquitto'),
    ],
    datas=[
        # Include config example
        (str(root_dir / 'config' / 'config.yaml.example'), 'config'),
        # Include frontend dist (when built)
        # (str(root_dir / 'frontend' / 'dist'), 'frontend'),
    ],
    hiddenimports=[
        'paho.mqtt.client',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='ThermIQ',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # No console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='ThermIQ',
)

# Create macOS .app bundle
app = BUNDLE(
    coll,
    name='ThermIQ.app',
    icon=None,  # Add icon file here: icon='resources/icon.icns'
    bundle_identifier='net.thermiq.optimizer',
    version='1.0.0',
    info_plist={
        'NSPrincipalClass': 'NSApplication',
        'NSHighResolutionCapable': 'True',
        'LSBackgroundOnly': 'False',
        'CFBundleDisplayName': 'ThermIQ',
        'CFBundleName': 'ThermIQ',
        'CFBundleShortVersionString': '1.0.0',
        'CFBundleVersion': '1.0.0',
        'NSHumanReadableCopyright': 'Copyright © 2026 ThermIQ',
    },
)
