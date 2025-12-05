# Deploying Frontend to Vercel

This guide will walk you through deploying the React + Vite frontend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com (free account works)
2. **GitHub/GitLab/Bitbucket Account**: Your code should be in a Git repository
3. **Backend URL**: Your backend should be deployed (e.g., on Railway) and have a public URL

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Prepare Your Repository
1. Make sure your code is pushed to GitHub/GitLab/Bitbucket
2. Ensure the `frontend` directory contains all your frontend code

### Step 2: Import Project to Vercel
1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your repository (hypersphere)
4. Click **"Import"**

### Step 3: Configure Project Settings
Vercel should auto-detect it's a Vite project, but verify these settings:

- **Framework Preset**: `Vite` (should auto-detect)
- **Root Directory**: `frontend` (click "Edit" and set this)
- **Build Command**: `npm run build` (should auto-fill)
- **Output Directory**: `dist` (should auto-fill)
- **Install Command**: `npm install` (should auto-fill)

### Step 4: Set Environment Variables
Click **"Environment Variables"** and add:

```
VITE_API_URL=https://your-backend-url.railway.app
```

Replace `https://your-backend-url.railway.app` with your actual backend URL.

**Important**: 
- For Vite, environment variables must start with `VITE_` to be accessible in the frontend
- The frontend code uses `import.meta.env.VITE_API_URL`

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-2 minutes)
3. Your site will be live at: `https://your-project-name.vercel.app`

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 4: Deploy
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (first time) or Yes (if updating)
- **Project name?** → Enter a name or press Enter for default
- **Directory?** → `./` (current directory)
- **Override settings?** → No (unless you need to change something)

### Step 5: Set Environment Variables
```bash
vercel env add VITE_API_URL
```
Enter your backend URL when prompted.

### Step 6: Deploy to Production
```bash
vercel --prod
```

## Build Configuration

The `vercel.json` file in the `frontend` directory is already configured:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This configuration:
- Builds the project using `npm run build`
- Outputs to the `dist` directory
- Sets up SPA routing (all routes redirect to `index.html`)

## Environment Variables

### Required
- `VITE_API_URL` - Your backend API URL (e.g., `https://your-backend.railway.app`)

### Optional
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version

## Updating Your Deployment

### Via Dashboard
1. Push changes to your Git repository
2. Vercel will automatically detect and deploy the changes

### Via CLI
```bash
cd frontend
vercel --prod
```

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click **"Domains"**
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node.js version is compatible (Vercel uses Node 18+ by default)
- Check build logs in Vercel dashboard

### API Calls Fail
- Verify `VITE_API_URL` environment variable is set correctly
- Check that your backend CORS settings allow requests from your Vercel domain
- Test the backend URL directly in a browser

### Routing Issues
- The `vercel.json` rewrite rules should handle SPA routing
- If pages don't load, check that the rewrite rule is correct

### Environment Variables Not Working
- Remember: Vite requires `VITE_` prefix for environment variables
- Rebuild after adding new environment variables
- Check that variables are set for the correct environment (Production, Preview, Development)

## Example URLs

After deployment, your frontend will be available at:
- **Production**: `https://your-project-name.vercel.app`
- **Preview**: `https://your-project-name-git-branch.vercel.app` (for each branch)

## Next Steps

1. **Test the deployment**: Visit your Vercel URL and test all features
2. **Update backend CORS**: Make sure your backend allows requests from your Vercel domain
3. **Set up monitoring**: Use Vercel Analytics to monitor your deployment
4. **Configure CI/CD**: Vercel automatically deploys on every push to your main branch

## Quick Reference

```bash
# Deploy to production
cd frontend
vercel --prod

# View deployment logs
vercel logs

# List all deployments
vercel ls

# Remove deployment
vercel remove
```


