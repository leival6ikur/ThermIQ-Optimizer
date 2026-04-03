# Mosquitto Binaries for Bundling

This directory contains portable Mosquitto MQTT broker binaries for Mac and Windows.

## Directory Structure

```
mosquitto/
├── mac/
│   ├── mosquitto           # Mac executable
│   └── lib/                # Required dylibs
└── windows/
    ├── mosquitto.exe       # Windows executable
    ├── mosquitto_passwd.exe
    └── *.dll               # Required DLLs
```

## Obtaining Binaries

### For Mac (Current Development Platform)

We can copy from the Homebrew installation:

```bash
# Copy mosquitto binary
cp /opt/homebrew/opt/mosquitto/sbin/mosquitto mosquitto/mac/

# Copy required libraries
mkdir -p mosquitto/mac/lib
cp /opt/homebrew/opt/mosquitto/lib/*.dylib mosquitto/mac/lib/

# Make executable
chmod +x mosquitto/mac/mosquitto
```

### For Windows

Download portable Mosquitto from:
https://mosquitto.org/download/

1. Download Windows 64-bit version (no installer needed)
2. Extract mosquitto.exe and all .dll files
3. Place in mosquitto/windows/

Required files:
- mosquitto.exe
- mosquitto_passwd.exe
- pthreadVC2.dll
- libssl-1_1-x64.dll
- libcrypto-1_1-x64.dll

## Verification

### Mac
```bash
./mosquitto/mac/mosquitto -h
```

### Windows
```cmd
mosquitto\windows\mosquitto.exe -h
```

## Licensing

Mosquitto is licensed under the Eclipse Public License (EPL) and Eclipse Distribution License (EDL).

When distributing, ensure compliance with EPL/EDL terms:
- Include NOTICE file
- Provide source code access or written offer
- Maintain copyright notices

See: https://mosquitto.org/documentation/

## Alternative: Build from Source

For custom builds or specific versions:

```bash
# Mac
git clone https://github.com/eclipse/mosquitto.git
cd mosquitto
make
# Binary will be in src/mosquitto

# Cross-compile for Windows using mingw-w64
```

## Size Considerations

- Mac binary: ~2-3 MB (with libraries)
- Windows binary: ~1-2 MB (with DLLs)

Total overhead for cross-platform support: ~5 MB

## Configuration

The broker_manager.py automatically generates configuration files at runtime.
No pre-configured files needed in this directory.
