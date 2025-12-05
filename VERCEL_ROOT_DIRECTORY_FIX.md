# Fix: Vercel Can't Find package.json

## The Problem
Vercel is looking for `package.json` in the wrong directory. It's trying to run `npm install` from the root instead of the `frontend` directory.

## Solution: Set Root Directory Correctly

### Method 1: Vercel Dashboard (Recommended)

1. **Go to your project** in Vercel Dashboard: https://vercel.com/dashboard
2. **Click on your project** → **Settings**
3. **Go to "General"** tab
4. **Scroll down to "Root Directory"**
5. **Click "Edit"**
6. **Enter**: `frontend`
7. **Click "Save"**
8. **Go to "Deployments"** tab
9. **Click the three dots** on your latest deployment → **Redeploy**

### Method 2: Delete and Re-import Project

If Method 1 doesn't work:

1. **Delete the current project** in Vercel Dashboard:
   - Go to project → Settings → Danger Zone → Delete Project

2. **Create a new project**:
   - Click "Add New..." → "Project"
   - Import your repository

3. **IMPORTANT - Configure BEFORE deploying**:
   - **Root Directory**: Click "Edit" → Enter: `frontend`
   - **Framework Preset**: Select "Vite" (or leave as "Other")
   - **Build Command**: Should show `npm run build` (verify)
   - **Output Directory**: Should show `dist` (verify)
   - **Install Command**: Should show `npm install` (verify)

4. **Add Environment Variable**:
   - Name: `VITE_API_URL`
   - Value: Your backend URL

5. **Click "Deploy"**

### Method 3: Use Vercel CLI from frontend directory

This is the most reliable method:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Make sure you're in the right place (should see package.json)
ls package.json

# 3. Deploy from here
vercel

# When prompted:
# - Set up and deploy? → Yes
# - Which scope? → Your account
# - Link to existing project? → No (or Yes if updating existing)
# - Project name? → Enter name
# - Directory? → ./ (current directory - THIS IS CRITICAL)
# - Override settings? → No

# 4. Set environment variable
vercel env add VITE_API_URL production
# Enter your backend URL

# 5. Deploy to production
vercel --prod
```

### Method 4: Add vercel.json to Root with Root Directory Setting

Create/update root `vercel.json` to point to frontend:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install"
}
```

But this is less clean. Method 3 (CLI from frontend) is better.

## Why This Happens

Vercel needs to know where your `package.json` is. If Root Directory isn't set to `frontend`, it looks in the root directory and fails.

## Verification

After setting Root Directory, verify:
1. Vercel should find `frontend/package.json`
2. Build logs should show: `Running "install" command: npm install` from the frontend directory
3. Build should succeed

## Quick Fix Checklist

- [ ] Root Directory set to `frontend` in Vercel Settings
- [ ] OR deploying via CLI from `frontend/` directory
- [ ] `frontend/package.json` exists
- [ ] `frontend/vite.config.ts` exists
- [ ] Environment variable `VITE_API_URL` is set

