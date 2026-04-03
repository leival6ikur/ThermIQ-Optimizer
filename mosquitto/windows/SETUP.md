# Windows Mosquitto Setup

## Download Mosquitto for Windows

1. Visit: https://mosquitto.org/download/
2. Download: **Windows 64-bit** (mosquitto-X.X.X-install-windows-x64.exe)
3. Run the installer
4. Copy these files from installation directory (C:\Program Files\mosquitto\) to this folder:

Required files:
- mosquitto.exe
- mosquitto_passwd.exe
- pthreadVC2.dll
- libssl-*.dll (or libssl-1_1-x64.dll)
- libcrypto-*.dll (or libcrypto-1_1-x64.dll)

## Alternative: Pre-built Portable

If you have access to a Windows machine:

1. Install Mosquitto using the installer
2. Navigate to C:\Program Files\mosquitto\
3. Copy all .exe and .dll files
4. Transfer to this directory

## Verification

Once files are copied:

```cmd
mosquitto.exe --version
```

Should output Mosquitto version information.

## For macOS Development

You can skip Windows binaries during Mac development.
The application will use the bundled Mac binary on macOS.

Windows binaries are only needed when building the Windows .exe package.

## Size

Total size of Windows mosquitto files: ~1-2 MB
