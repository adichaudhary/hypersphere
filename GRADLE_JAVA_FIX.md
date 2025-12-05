# Quick Fix: Gradle and Java Compatibility Issue

## Problem
You're getting an error because:
- Your system has **Java 21.0.8**
- Gradle 8.0 doesn't support Java 21 (max is Java 19)

## Solution Options

### Option 1: Use Gradle 8.5 (Recommended - Already Configured)
I've already updated both projects to use Gradle 8.5, which supports Java 21.

**Steps:**
1. **Close Android Studio completely**
2. **Delete Gradle cache** (optional but recommended):
   ```powershell
   Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches\8.0
   ```
3. **Reopen Android Studio**
4. **Open the HceSender project** (File → Open → select `HceSender` folder)
5. **Wait for Gradle sync** - it will download Gradle 8.5 automatically

### Option 2: Configure Android Studio to Use JDK 17 (Alternative)

If Option 1 doesn't work, configure Android Studio to use JDK 17:

1. **In Android Studio:**
   - Go to `File` → `Settings` (or `Android Studio` → `Preferences` on Mac)
   - Navigate to: `Build, Execution, Deployment` → `Build Tools` → `Gradle`
   - Under "Gradle JDK", select **JDK 17** (or download it if not available)
   - Click `Apply` and `OK`

2. **Or set project-specific JDK:**
   - Go to `File` → `Project Structure` (or `Ctrl+Alt+Shift+S`)
   - Under `SDK Location`, set "JDK location" to JDK 17
   - Click `OK`

3. **Sync project:**
   - Click `File` → `Sync Project with Gradle Files`
   - Or click the "Sync Now" banner if it appears

## Verify the Fix

After applying the fix:

1. **Check Gradle version:**
   - Open terminal in Android Studio (bottom panel)
   - Run: `.\gradlew --version`
   - Should show: `Gradle 8.5`

2. **Check Java version:**
   - Run: `.\gradlew --version`
   - Should show Java version (should be 17 or 21, both work with Gradle 8.5)

3. **Sync project:**
   - Click `File` → `Sync Project with Gradle Files`
   - Should complete without errors

## If Still Having Issues

1. **Invalidate caches:**
   - `File` → `Invalidate Caches...`
   - Check all boxes
   - Click `Invalidate and Restart`

2. **Clean build:**
   - `Build` → `Clean Project`
   - Then `Build` → `Rebuild Project`

3. **Check Gradle wrapper:**
   - Ensure `HceSender/gradle/wrapper/gradle-wrapper.properties` exists
   - Should contain: `distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip`

## Important: Which Folder to Open?

**Open ONLY the `HceSender` folder** (or `NfcReader` folder), NOT the entire `hypersphere` directory.

- ✅ Correct: `C:\Users\jazib\Downloads\hypersphere\HceSender`
- ❌ Wrong: `C:\Users\jazib\Downloads\hypersphere`

Each Android app is a separate project and should be opened independently in Android Studio.

