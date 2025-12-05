# Step-by-Step Fix for Vercel Framework Error

## Problem
You're getting: `Invalid request: framework should be equal to one of the allowed values...`

This happens because Vercel is reading a `vercel.json` with an invalid or conflicting framework setting.

## Solution: Step-by-Step

### Step 1: Delete/Rename the Root vercel.json (Temporary)

The root `vercel.json` might be interfering. Let's temporarily disable it:

**Option A: Rename it (safer)**
```bash
# From project root
mv vercel.json vercel.json.backup
```

**Option B: Delete it (if you don't need it)**
```bash
# From project root
rm vercel.json
```

### Step 2: Verify frontend/vercel.json is Correct

Make sure `frontend/vercel.json` looks like this (NO framework field):

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 3: Deploy via Vercel Dashboard

1. **Go to**: https://vercel.com/dashboard
2. **Click**: "Add New..." → "Project"
3. **Import** your Git repository
4. **Configure Project**:
   - **Framework Preset**: Leave as "Other" or "Vite" (Vercel should auto-detect)
   - **Root Directory**: Click "Edit" and set to: `frontend`
   - **Build Command**: Should auto-fill as `npm run build` (verify this)
   - **Output Directory**: Should auto-fill as `dist` (verify this)
   - **Install Command**: Should auto-fill as `npm install` (verify this)
5. **Environment Variables**:
   - Click "Environment Variables"
   - Add:
     - **Name**: `VITE_API_URL`
     - **Value**: Your backend URL (e.g., `https://your-backend.railway.app`)
     - **Environment**: Select "Production", "Preview", and "Development"
6. **Click**: "Deploy"

### Step 4: If Still Getting Error - Manual Override

If you still get the error after Step 3:

1. **In Vercel Dashboard**, go to your project
2. **Settings** → **General**
3. **Scroll down to "Build & Development Settings"**
4. **Override** these settings:
   - **Framework Preset**: Select "Vite" from dropdown
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`
5. **Root Directory**: Set to `frontend`
6. **Save** and **Redeploy**

### Step 5: Alternative - Deploy via CLI (Most Reliable)

If dashboard keeps giving errors, use CLI:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to frontend directory
cd frontend

# 3. Login to Vercel
vercel login

# 4. Deploy (this will create a new project)
vercel

# When prompted:
# - Set up and deploy? → Yes
# - Which scope? → Your account
# - Link to existing project? → No (or Yes if updating)
# - Project name? → Enter name
# - Directory? → ./ (current directory)
# - Override settings? → No

# 5. Set environment variable
vercel env add VITE_API_URL production
# Enter your backend URL when prompted

# 6. Deploy to production
vercel --prod
```

### Step 6: Verify Deployment

After deployment:
1. Visit your Vercel URL (e.g., `https://your-project.vercel.app`)
2. Open browser console (F12)
3. Check for any errors
4. Verify API calls are working

## Why This Works

- **No framework field**: Vercel auto-detects Vite from `vite.config.ts`
- **Root directory set**: Vercel knows to look in `frontend/` folder
- **Clean vercel.json**: Only contains routing rules, no conflicting settings

## If Error Persists

1. **Clear Vercel cache**:
   - Go to project settings
   - Deployments → Clear build cache
   - Redeploy

2. **Check for hidden characters**:
   - Open `frontend/vercel.json` in a text editor
   - Make sure there are no extra spaces or characters
   - Save as UTF-8 encoding

3. **Try without vercel.json**:
   - Temporarily rename `frontend/vercel.json` to `frontend/vercel.json.backup`
   - Deploy without it (Vercel will use defaults)
   - Add it back after successful deployment

## Quick Checklist

- [ ] Root `vercel.json` renamed/deleted
- [ ] `frontend/vercel.json` has NO `framework` field
- [ ] Root Directory set to `frontend` in Vercel
- [ ] Environment variable `VITE_API_URL` is set
- [ ] `vite.config.ts` exists in `frontend/` directory
- [ ] `package.json` has `"build": "vite build"` script

