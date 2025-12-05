# ADB Setup Guide for Windows

## Problem
`adb` command is not recognized because it's not in your system PATH.

## Solution Options

### Option 1: Use Android Studio's Terminal (Easiest)
Android Studio's built-in terminal has `adb` in its PATH automatically.

1. **In Android Studio:**
   - Open the terminal at the bottom (View → Tool Windows → Terminal)
   - Or click the "Terminal" tab at the bottom
   - Run: `adb devices`
   - This should work immediately

### Option 2: Add ADB to System PATH (Permanent Fix)

1. **Find your Android SDK location:**
   - Open Android Studio
   - Go to `File` → `Settings` → `Appearance & Behavior` → `System Settings` → `Android SDK`
   - Look at "Android SDK Location" (usually: `C:\Users\YourName\AppData\Local\Android\Sdk`)
   - The `adb.exe` is in: `[SDK Location]\platform-tools\`

2. **Add to PATH:**
   - Press `Win + X` → Select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find and select "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\Users\jazib\AppData\Local\Android\Sdk\platform-tools`
     (Replace with your actual SDK path if different)
   - Click "OK" on all dialogs
   - **Restart PowerShell/Terminal** for changes to take effect

3. **Verify:**
   ```powershell
   adb devices
   ```

### Option 3: Use Full Path (Quick Test)

Instead of `adb`, use the full path:

```powershell
# Typical path (adjust if your SDK is elsewhere):
& "C:\Users\jazib\AppData\Local\Android\Sdk\platform-tools\adb.exe" devices
```

To find your exact path:
1. Open Android Studio
2. `File` → `Settings` → `Appearance & Behavior` → `System Settings` → `Android SDK`
3. Copy the "Android SDK Location"
4. Append `\platform-tools\adb.exe` to it

### Option 4: Create a PowerShell Alias (Temporary for Current Session)

```powershell
# Find your SDK path first, then:
$env:Path += ";C:\Users\jazib\AppData\Local\Android\Sdk\platform-tools"
adb devices
```

## Quick Check: Find Your SDK Location

Run this in PowerShell to find common SDK locations:

```powershell
$sdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe",
    "$env:ANDROID_HOME\platform-tools\adb.exe"
)

foreach ($path in $sdkPaths) {
    if (Test-Path $path) {
        Write-Host "Found ADB at: $path" -ForegroundColor Green
        & $path devices
        break
    }
}
```

## Alternative: Use Android Studio's Device Manager

You don't actually need `adb` command line if you're using Android Studio:

1. **View connected devices:**
   - In Android Studio, look at the top toolbar
   - There's a device selector dropdown (shows "No devices" or device name)
   - Click it to see connected devices

2. **Install apps:**
   - Just click the "Run" button (▶️) in Android Studio
   - It will automatically detect and install on connected devices

3. **View logs:**
   - Use Android Studio's "Logcat" tab (bottom panel)
   - No need for `adb logcat`

## Recommended Approach

**For development:** Use Android Studio's built-in terminal (Option 1) - it's the easiest and always works.

**For permanent access:** Add to PATH (Option 2) if you frequently use command line tools.

