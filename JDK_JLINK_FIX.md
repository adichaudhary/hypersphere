# Fix for JDK/jlink Build Error

## Quick Fix Steps

### Step 1: Clean Gradle Cache
Run these commands in PowerShell:

```powershell
# Clean the transforms cache (where the error is occurring)
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches\transforms-3" -ErrorAction SilentlyContinue

# Clean the build cache
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches\build-cache-*" -ErrorAction SilentlyContinue
```

### Step 2: Clean Project Build
In Android Studio:
1. **Build** → **Clean Project**
2. **Build** → **Rebuild Project**

### Step 3: Invalidate Caches
1. **File** → **Invalidate Caches...**
2. Check all boxes
3. Click **Invalidate and Restart**

### Step 4: Try Building Again
After Android Studio restarts, try building again.

## Alternative: Configure JDK in Android Studio

If the above doesn't work, configure Android Studio to use a specific JDK:

1. **File** → **Settings** (or `Ctrl+Alt+S`)
2. **Build, Execution, Deployment** → **Build Tools** → **Gradle**
3. Under "Gradle JDK", try:
   - **JDK 17** (recommended)
   - Or download a new JDK 17 from the dropdown
4. Click **Apply** and **OK**
5. **File** → **Sync Project with Gradle Files**

## If Still Failing: Use JDK 17 Explicitly

Add this to `gradle.properties` in your project:

```properties
org.gradle.java.home=C:/Program Files/Android/Android Studio/jbr
```

Or if you have JDK 17 installed elsewhere:
```properties
org.gradle.java.home=C:/Program Files/Java/jdk-17
```

Then sync and rebuild.

