# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Windows portable .exe

Usage:
    pyinstaller build_windows.spec

Note: Must be run on Windows or with Wine/cross-compilation setup
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
        # Include Mosquitto binaries
        (str(root_dir / 'mosquitto' / 'windows' / 'mosquitto.exe'), 'mosquitto'),
        (str(root_dir / 'mosquitto' / 'windows' / '*.dll'), 'mosquitto'),
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
    console=False,  # No console window (change to True for debugging)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Add icon file here: icon='resources/icon.ico'
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
