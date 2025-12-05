# Quick Fix for Vercel Deployment Error

## The Problem
You're getting: `Invalid request: framework should be equal to one of the allowed values...`

## The Solution

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**: https://vercel.com/new
2. **Import your repository**
3. **IMPORTANT**: Set **Root Directory** to `frontend`
   - Click "Edit" next to Root Directory
   - Enter: `frontend`
4. **Vercel will auto-detect Vite** (no need to set framework manually)
5. **Set Environment Variable**:
   - Name: `VITE_API_URL`
   - Value: Your backend URL (e.g., `https://your-backend.railway.app`)
6. **Deploy**

### Option 2: Use Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **When prompted**:
   - Set up and deploy? → **Yes**
   - Which scope? → Select your account
   - Link to existing project? → **No** (first time) or **Yes** (updates)
   - Project name? → Enter name or press Enter
   - **Directory?** → `./` (current directory - this is important!)
   - Override settings? → **No**

5. **Set environment variable**:
   ```bash
   vercel env add VITE_API_URL production
   ```
   Enter your backend URL when prompted.

6. **Deploy to production**:
   ```bash
   vercel --prod
   ```

## Why This Works

- Vercel **auto-detects** Vite when it sees `vite.config.ts` in the directory
- You don't need to specify `framework: "vite"` in vercel.json
- The `vercel.json` file I created now only has the routing rewrite rules
- Setting Root Directory to `frontend` ensures Vercel looks in the right place

## If You Still Get Errors

1. **Delete the root `vercel.json`** (it's for a different project):
   ```bash
   # From project root
   rm vercel.json
   ```

2. **Make sure you're deploying from the `frontend` directory** or set Root Directory to `frontend` in Vercel dashboard

3. **Check that `vite.config.ts` exists** in the `frontend` directory

4. **Verify `package.json` has build script**:
   ```json
   "scripts": {
     "build": "vite build"
   }
   ```

## Quick Test

After deployment, your frontend should be at:
- `https://your-project-name.vercel.app`

Test it by visiting the URL and checking the browser console for any API connection errors.

