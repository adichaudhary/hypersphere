<!-- Quick Deploy Buttons -->

## Deploy in 1 Click

### Backend (Node.js)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/your-username/tap-to-pay&envs=SOLANA_RPC_URL,PROGRAM_ID&SOLANA_RPC_URL=https://api.devnet.solana.com&PROGRAM_ID=TapToPay111111111111111111111111111111111111)

### Frontend (Static HTML/JS)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/tap-to-pay&projectName=tap-to-pay-frontend&rootDirectory=web&env=REACT_APP_BACKEND_URL&envDescription=Backend%20API%20URL&envDefault=https://tap-to-pay-prod.railway.app)

## Manual Deploy Instructions

### Prerequisites
- GitHub account with public repo
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)

### Step 1: Push to GitHub
```powershell
cd 'C:\Users\chaud\OneDrive\Desktop\Adi\ttp'
# If not already a git repo:
git init
git config user.email "you@example.com"
git config user.name "Your Name"
git add -A
git commit -m "Initial commit: Tap-to-Pay"
git remote add origin https://github.com/YOUR-USERNAME/tap-to-pay.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend on Railway
1. Visit https://railway.app
2. Click **Create project** → **Deploy from GitHub**
3. Select your `tap-to-pay` repo
4. Railway auto-detects Node.js; uses `Procfile`
5. In **Variables**, add:
   - `SOLANA_RPC_URL` = `https://api.devnet.solana.com`
   - `PROGRAM_ID` = `TapToPay111111111111111111111111111111111111`
   - `PORT` = `3000` (Railway will auto-assign)
6. Click **Deploy**
7. After deployment, copy your Railway URL (e.g., `https://tap-to-pay-prod.railway.app`)

### Step 3: Deploy Frontend on Vercel
1. Visit https://vercel.com/new
2. Click **Import Project** → paste GitHub repo URL
3. Set **Root Directory** to `web`
4. In **Environment Variables**:
   - `REACT_APP_BACKEND_URL` = `https://tap-to-pay-prod.railway.app` (your Railway URL from step 2)
5. Click **Deploy**
6. After deployment, copy your Vercel URL (e.g., `https://tap-to-pay.vercel.app`)

### Step 4: Test
Open your Vercel frontend URL:
```
https://tap-to-pay.vercel.app
```

Create a test payment via backend API:
```bash
curl -X POST https://tap-to-pay-prod.railway.app/payment_intents \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000000, "merchant_id": "test"}'
```

Copy the returned `payment_url` and open it in your Vercel frontend.

### Step 5: Deploy Android App (Optional)
1. Update `PaymentApiClient.kt`:
   ```kotlin
   companion object {
       private const val BACKEND_BASE_URL = "https://tap-to-pay-prod.railway.app"
   }
   ```
2. Build APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
3. Install on device:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

## Deployed URLs
After deployment, you'll have:
- **Frontend**: https://tap-to-pay.vercel.app
- **Backend**: https://tap-to-pay-prod.railway.app (or your Railway URL)
- **Payment Page**: https://tap-to-pay.vercel.app/i/{payment_intent_id}

## Troubleshooting

### Frontend shows "Failed to load payment"
- Check browser console (F12 → Console tab)
- Ensure `REACT_APP_BACKEND_URL` env var is set on Vercel
- Verify backend is running on Railway (check Railway logs)

### Backend returns 500 errors
- Check Railway logs for errors
- Ensure `SOLANA_RPC_URL` is set and reachable
- Verify database file is writable (SQLite will create `data/payments.db`)

### CORS errors
- Backend already has `CORS` enabled for all origins
- If still issues, check browser Network tab to see actual response

### Health check fails
- Open your Railway URL + `/health`: `https://tap-to-pay-prod.railway.app/health`
- Should return `{"status": "ok"}`
- If not, check Railway logs

## Support
- Full docs: `DEPLOY.md` and `backend/README.md`
- Issues: Check `backend/ARCHITECTURE.md` and `TESTING.md`
