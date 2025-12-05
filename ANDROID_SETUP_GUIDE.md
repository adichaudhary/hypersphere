# Complete Setup and Run Guide for HceSender and NfcReader Android Apps

This guide provides step-by-step instructions to set up, build, and run both Android applications for NFC-based Phantom/Solana Pay URL transfer.

## 📋 Prerequisites

### Required Software
1. **Android Studio** (latest stable version recommended)
   - Download from: https://developer.android.com/studio
   - Minimum version: Android Studio Hedgehog (2023.1.1) or later
   - Includes Android SDK, Gradle, and all necessary build tools

2. **Java Development Kit (JDK) 11 or later**
   - Android Studio includes JDK 11 by default
   - Verify: `File` → `Project Structure` → `SDK Location` → Check JDK location

3. **Android SDK**
   - Android SDK Platform 34 (Android 14)
   - Android SDK Build-Tools 34.0.0 or later
   - Install via Android Studio: `Tools` → `SDK Manager`

### Required Hardware
1. **Two Android devices with NFC support**
   - **Phone A (HceSender)**: Must support HCE (Host Card Emulation)
     - Most Android phones from 2014+ support HCE
     - Check: Settings → Connected devices → Connection preferences → NFC
   - **Phone B (NfcReader)**: Any Android device with NFC (most phones from 2012+)
   - **Note**: Android emulators do NOT support real NFC communication

2. **USB cables** for both devices to connect to your computer

## 🏗️ Project Structure

```
hypersphere/
├── HceSender/          # NFC Card Emulator (sends Phantom URL)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/example/hcesender/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   └── PaymentCardService.kt
│   │   │   ├── res/
│   │   │   │   ├── layout/activity_main.xml
│   │   │   │   ├── xml/apdu_service.xml
│   │   │   │   └── values/strings.xml
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   ├── build.gradle
│   └── settings.gradle
│
└── NfcReader/          # NFC Reader (receives URL and opens Phantom)
    ├── app/
    │   ├── src/main/
    │   │   ├── java/com/example/nfcreader/
    │   │   │   └── MainActivity.kt
    │   │   ├── res/
    │   │   │   ├── layout/activity_main.xml
    │   │   │   └── values/strings.xml
    │   │   └── AndroidManifest.xml
    │   └── build.gradle
    ├── build.gradle
    └── settings.gradle
```

## 🔧 Step-by-Step Setup Instructions

### Step 1: Open Projects in Android Studio

**⚠️ IMPORTANT: Open ONLY the individual project folder (HceSender or NfcReader), NOT the entire hypersphere directory!**

#### Option A: Open HceSender Project
1. Launch **Android Studio**
2. Click **"Open"** or **"File" → "Open"**
3. Navigate to: `C:\Users\jazib\Downloads\hypersphere\HceSender`
   - **Make sure you select the `HceSender` folder, NOT the parent `hypersphere` folder**
   - The folder should contain `settings.gradle`, `build.gradle`, and `app/` subfolder
4. Click **"OK"**
5. If prompted to "Trust Project", click **"Trust Project"**
6. Wait for Gradle sync to complete (may take 2-5 minutes on first open)
   - Android Studio will download dependencies automatically
   - Check bottom status bar for "Gradle sync finished"
   - If you see "Gradle wrapper not found", Android Studio will offer to create it - click **"OK"**

#### Option B: Open NfcReader Project
1. In Android Studio, click **"File" → "Open"** (or open a new window)
2. Navigate to: `C:\Users\jazib\Downloads\hypersphere\NfcReader`
   - **Make sure you select the `NfcReader` folder, NOT the parent `hypersphere` folder**
3. Click **"OK"**
4. Wait for Gradle sync to complete

**Note**: You can have both projects open in separate Android Studio windows, or work with them one at a time.

### Step 2: Configure the Phantom/Solana Pay URL

1. Open `HceSender/app/src/main/java/com/example/hcesender/PaymentCardService.kt`
2. Find line 20-21:
   ```kotlin
   val phantomUrl =
       "https://phantom.app/ul/v1/transfer?to=YOUR_SOL_ADDRESS&amount=0.01&network=mainnet-beta"
   ```
3. Replace `YOUR_SOL_ADDRESS` with your actual Solana wallet address
   - Example: `"https://phantom.app/ul/v1/transfer?to=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU&amount=0.01&network=mainnet-beta"`
4. Optionally modify:
   - `amount`: Change `0.01` to your desired SOL amount
   - `network`: Use `mainnet-beta` for mainnet or `devnet` for testing
5. Save the file (`Ctrl+S`)

### Step 3: Enable Developer Options and USB Debugging

**For both Android devices:**

1. **Enable Developer Options:**
   - Go to `Settings` → `About phone`
   - Find `Build number` (may be under "Software information")
   - Tap `Build number` **7 times** until you see "You are now a developer!"

2. **Enable USB Debugging:**
   - Go to `Settings` → `System` → `Developer options` (or `Settings` → `Developer options`)
   - Toggle **"USB debugging"** ON
   - If prompted, tap **"OK"** to allow USB debugging

3. **Enable NFC:**
   - Go to `Settings` → `Connected devices` → `Connection preferences` → `NFC`
   - Toggle **NFC** ON
   - Ensure **"Android Beam"** or **"NFC"** is enabled

### Step 4: Connect Devices to Computer

1. Connect **Phone A** (for HceSender) via USB cable
2. On the phone, when prompted "Allow USB debugging?", tap **"Allow"** or **"OK"**
3. Verify connection:
   - In Android Studio, open terminal (bottom panel)
   - Run: `adb devices`
   - You should see your device listed (e.g., `ABC123XYZ    device`)

4. Repeat for **Phone B** (for NfcReader) if building both apps

### Step 5: Build and Install HceSender App

1. **In Android Studio with HceSender project open:**
   - Ensure Phone A is connected
   - Click the device selector dropdown (top toolbar, next to play button)
   - Select your connected device (Phone A)

2. **Build the project:**
   - Method 1: Click the green **"Run"** button (▶️) or press `Shift+F10`
   - Method 2: `Build` → `Make Project` (`Ctrl+F9`), then `Run` → `Run 'app'` (`Shift+F10`)
   - Method 3: Terminal command:
     ```powershell
     cd HceSender
     .\gradlew installDebug
     ```

3. **First build will take 3-10 minutes** (downloads dependencies, compiles)
   - Watch the "Build" tab at the bottom for progress
   - Wait for "BUILD SUCCESSFUL" message

4. **App installation:**
   - Android Studio automatically installs the app on your device
   - You'll see "HCE Sender" app icon on Phone A

5. **Verify installation:**
   - Open the app on Phone A
   - You should see: "HCE Sender ready. Tap this phone with the reader phone."

### Step 6: Build and Install NfcReader App

1. **Switch to NfcReader project:**
   - Open NfcReader project in Android Studio (or switch if already open)
   - Ensure Phone B is connected

2. **Select device:**
   - In device selector, choose Phone B

3. **Build and install:**
   - Click **"Run"** button (▶️) or press `Shift+F10`
   - Wait for build to complete
   - App will install automatically on Phone B

4. **Verify installation:**
   - Open "NFC Reader" app on Phone B
   - You should see: "NFC Reader ready. Tap this phone against the HCE Sender."

### Step 7: Test NFC Communication

1. **On Phone A (HceSender):**
   - Open the "HCE Sender" app
   - Keep the app open (or minimize, but don't force close)
   - Ensure screen is unlocked (HCE works better with unlocked screen)

2. **On Phone B (NfcReader):**
   - Open the "NFC Reader" app
   - Keep the app in foreground (visible on screen)

3. **Tap the phones together:**
   - Hold Phone B (reader) against the **back** of Phone A (sender)
   - Keep them close (within 1-2 cm / 0.5-1 inch)
   - Hold for 1-2 seconds

4. **Expected result:**
   - Phone B should display: "Received URL: [your Phantom URL]"
   - Phone B should automatically open the URL (launches Phantom app or browser)
   - If Phantom is installed, it should open with the payment pre-filled

## 🔍 Troubleshooting

### Issue: "Gradle sync failed" or "Plugin was not found"
**Solution:**
- **Make sure you opened the correct folder**: Open `HceSender` or `NfcReader` folder, NOT the parent `hypersphere` folder
- Check internet connection (Gradle downloads dependencies from Google and Maven repositories)
- In Android Studio: `File` → `Invalidate Caches` → `Invalidate and Restart`
- Ensure JDK 11+ is configured: `File` → `Project Structure` → `SDK Location`
- If you see "Plugin [id: 'com.android.application'] was not found":
  - Verify `settings.gradle` contains `pluginManagement` block with `google()` repository
  - Try: `File` → `Sync Project with Gradle Files`
  - If still failing, check that Android SDK is installed: `Tools` → `SDK Manager` → Install Android SDK Platform 34

### Issue: "Device not detected" or "No devices found"
**Solution:**
- Verify USB debugging is enabled on device
- Try different USB cable or USB port
- Run `adb devices` in terminal to check connection
- On device, check "USB debugging" notification and allow it
- Try: `adb kill-server` then `adb start-server`

### Issue: "NFC is not available on this device"
**Solution:**
- Verify device has NFC hardware (check device specifications)
- Enable NFC in device settings
- Some devices require NFC to be enabled in quick settings panel

### Issue: "HCE not working" or "No response from tag"
**Solution:**
- Ensure HceSender app is running (not force-closed)
- Unlock the screen on Phone A (HCE may not work with locked screen)
- Try tapping from different angles/positions
- Ensure both devices have NFC enabled
- Check Android logs: `adb logcat | grep -i "PaymentCardService\|NfcReader"`
- Some devices require HCE to be set as default payment app:
  - Settings → NFC → Contactless payments → Default payment app → Select "HCE Sender"

### Issue: "URL not opening" or "Invalid URL"
**Solution:**
- Check PaymentCardService.kt - ensure URL is properly formatted
- Verify URL doesn't have extra spaces or characters
- Check logcat for the actual URL being sent: `adb logcat | grep "Parsed URL"`

### Issue: "Build failed" or compilation errors
**Solution:**
- Ensure all files are saved
- Clean project: `Build` → `Clean Project`
- Rebuild: `Build` → `Rebuild Project`
- Check for syntax errors in Kotlin files (red underlines)
- Verify Gradle sync completed successfully

### Issue: "App crashes on launch"
**Solution:**
- Check logcat for crash logs: `adb logcat | grep -i "fatal\|exception"`
- Verify all required permissions are in AndroidManifest.xml
- Ensure device meets minimum SDK requirements (Android 5.0+)

## 📱 Alternative: Building APKs Manually

If you prefer to build APK files and install manually:

### Build HceSender APK:
```powershell
cd HceSender
.\gradlew assembleDebug
```
APK location: `HceSender\app\build\outputs\apk\debug\app-debug.apk`

### Build NfcReader APK:
```powershell
cd NfcReader
.\gradlew assembleDebug
```
APK location: `NfcReader\app\build\outputs\apk\debug\app-debug.apk`

### Install APK manually:
```powershell
adb install app-debug.apk
```

Or transfer APK to device and install via file manager (enable "Install from unknown sources" in settings).

## 🧪 Testing Checklist

- [ ] Both projects open successfully in Android Studio
- [ ] Gradle sync completes without errors
- [ ] HceSender builds and installs on Phone A
- [ ] NfcReader builds and installs on Phone B
- [ ] Both apps launch without crashing
- [ ] NFC is enabled on both devices
- [ ] USB debugging is enabled on both devices
- [ ] Devices are detected by `adb devices`
- [ ] HceSender shows "ready" message
- [ ] NfcReader shows "ready" message
- [ ] Tapping phones together triggers NFC communication
- [ ] URL is received and displayed on NfcReader
- [ ] URL opens in Phantom app or browser

## 📝 Additional Notes

1. **HCE Service Registration**: The HCE service is registered in AndroidManifest.xml and will automatically start when the app is installed. You don't need to manually start it.

2. **AID Filter**: The AID (Application Identifier) `F0010203040506` in `apdu_service.xml` is a custom identifier. The reader sends a SELECT APDU that triggers the HCE service to respond.

3. **URL Format**: The Phantom URL format is:
   ```
   https://phantom.app/ul/v1/transfer?to=ADDRESS&amount=AMOUNT&network=NETWORK
   ```

4. **Network Options**:
   - `mainnet-beta`: Main Solana network (real SOL)
   - `devnet`: Development network (test SOL)

5. **Security**: For production use, consider:
   - Validating URLs before sending
   - Adding error handling
   - Implementing proper APDU command parsing
   - Adding authentication/encryption if needed

## 🚀 Quick Start Commands Summary

```powershell
# Navigate to project
cd C:\Users\jazib\Downloads\hypersphere

# Build HceSender
cd HceSender
.\gradlew assembleDebug
.\gradlew installDebug

# Build NfcReader
cd ..\NfcReader
.\gradlew assembleDebug
.\gradlew installDebug

# Check connected devices
adb devices

# View logs
adb logcat | grep -i "hce\|nfc"
```

## 📞 Support

If you encounter issues not covered here:
1. Check Android Studio's "Build" and "Logcat" tabs for error messages
2. Verify all prerequisites are met
3. Ensure device compatibility (NFC and HCE support)
4. Check that both apps have necessary permissions

---

**Last Updated**: Based on Android Studio 2023.1.1+ and Android SDK 34

