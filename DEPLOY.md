# Tap-to-Pay Deployment Guide

## Quick Deployment (5 minutes)

### Backend (Node.js + SQLite) → Railway
1. Go to https://railway.app
2. Create new project → Connect GitHub repo (or upload this folder)
3. Select `railway.json` as config
4. Railway auto-deploys; copy the public URL (e.g., `https://tap-to-pay-prod.railway.app`)
5. Set env var `SOLANA_RPC_URL` = `https://api.devnet.solana.com` (optional, already default)
6. **Backend URL**: `https://tap-to-pay-prod.railway.app`

### Frontend (Static HTML/JS) → Vercel
1. Go to https://vercel.com/new
2. Import this repo (or upload `web/` folder)
3. Set Output Directory to `web`
4. In Environment Variables, add:
   - `REACT_APP_BACKEND_URL` = `https://tap-to-pay-prod.railway.app` (use your Railway URL from step 4 above)
5. Vercel auto-deploys; copy the deployment URL (e.g., `https://tap-to-pay.vercel.app`)
6. **Frontend URL**: `https://tap-to-pay.vercel.app`

### Testing
To create a test payment:
```bash
curl -X POST https://tap-to-pay-prod.railway.app/payment_intents \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000000, "merchant_id": "test-merchant"}'
```

Response (example):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 1000000,
  "merchant_id": "test-merchant",
  "payment_url": "https://tap-to-pay.vercel.app/pay/550e8400-e29b-41d4-a716-446655440000",
  "nonce": "abc123...",
  "status": "pending"
}
```

Then open the `payment_url` in a browser, connect Phantom wallet (devnet), and complete payment.

### Android App
- Modify `android/app/src/main/java/com/solana/taptopay/network/PaymentApiClient.kt` to point to:
  - `BACKEND_BASE_URL = "https://tap-to-pay-prod.railway.app"`
- Build APK:
  ```bash
  cd android
  ./gradlew assembleDebug
  # APK output: app/build/outputs/apk/debug/app-debug.apk
  ```

## Deployed URLs (after setup)
- **Frontend**: https://tap-to-pay.vercel.app
- **Backend API**: https://tap-to-pay-prod.railway.app
- **Payment Page**: https://tap-to-pay.vercel.app/i/{payment_intent_id}

## Environment Variables Required

### Backend (Railway)
- `SOLANA_RPC_URL` = `https://api.devnet.solana.com` (default)
- `PROGRAM_ID` = `TapToPay111111111111111111111111111111111111` (or your program)
- `PORT` = `3000` (Railway auto-assigns)
- `BASE_URL` = auto-detected from Railway domain

### Frontend (Vercel)
- `REACT_APP_BACKEND_URL` = Backend URL from Railway

## Manual Local Deploy (for testing)

### Start Backend Locally
```bash
cd backend
npm install
SOLANA_RPC_URL=https://api.devnet.solana.com node src/index.js
# Server runs on http://localhost:3001
```

### Serve Frontend Locally
```bash
cd web
# Python 3:
python -m http.server 8080
# Or Node:
npx http-server
# Open http://localhost:8080/i/{payment_intent_id}
```

## Support
- Backend docs: `backend/README.md`
- Test suite: `backend/examples/run-all-tests.js`
- Architecture: `backend/ARCHITECTURE.md`
