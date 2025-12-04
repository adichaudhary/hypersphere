# Solana Tap-to-Pay 🪙

A complete payment system for Solana using NFC, Phantom wallet, and web3.js. Full-stack application with Android merchant app, web payment page, and Node.js backend.

## 🚀 Quick Links (After Deployment)

| Component | URL | Setup |
|-----------|-----|-------|
| **Frontend** | Deploy on Vercel (see below) | 5 min |
| **Backend API** | Deploy on Railway (see below) | 5 min |
| **Payment Page** | `https://your-frontend/i/{payment_intent_id}` | Auto |
| **Health Check** | `https://your-backend/health` | Auto |

## 📱 Architecture

```
                  Solana Network (Devnet/Mainnet)
                 Tap-to-Pay Program + Phantom Wallet
                           ▼
        ┌─────────────────────────────────────┐
        │   Web Frontend (Vercel)              │
        │  • Payment UI                        │
        │  • Phantom Integration               │
        │  • Status Polling                    │
        └──────────────┬──────────────────────┘
                       ▼
        ┌─────────────────────────────────────┐
        │   Backend API (Railway)              │
        │  • Express.js + SQLite               │
        │  • Payment Management                │
        │  • Solana Listener                   │
        │  • Merchant Dashboard                │
        └──────────────┬──────────────────────┘
                       ▼
        ┌─────────────────────────────────────┐
        │   Android Merchant App               │
        │  • NFC Broadcasting                  │
        │  • Payment Polling                   │
        │  • Merchant Dashboard                │
        └─────────────────────────────────────┘
```

## ⚡ Quick Start (Local)

### Single Command
```powershell
cd 'C:\Users\chaud\OneDrive\Desktop\Adi\ttp'
node local-dev-server.js
```
Opens http://localhost:8080 (Frontend) + http://localhost:3001 (Backend)

### Two Terminals

**Terminal 1:**
```powershell
cd 'C:\Users\chaud\OneDrive\Desktop\Adi\ttp\backend'
node src/index.js
```

**Terminal 2:**
```powershell
cd 'C:\Users\chaud\OneDrive\Desktop\Adi\ttp\web'
python -m http.server 8080
# or: npx http-server
```

Then open http://localhost:8080

## 🌍 Deploy to Production (15 minutes)

### Step 1: Push to GitHub
```powershell
cd 'C:\Users\chaud\OneDrive\Desktop\Adi\ttp'
git init
git add -A
git commit -m "Deploy: Tap-to-Pay"
git remote add origin https://github.com/YOUR-USERNAME/tap-to-pay.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend on Railway
1. Go to https://railway.app
2. Click **Create Project** → **Deploy from GitHub**
3. Select your repo
4. Add environment variables:
   - `SOLANA_RPC_URL` = `https://api.devnet.solana.com`
   - `PROGRAM_ID` = `TapToPay111111111111111111111111111111111111`
5. Click **Deploy**
6. Copy the Railway URL (e.g., `https://tap-to-pay-prod.railway.app`)

### Step 3: Deploy Frontend on Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Set **Root Directory** = `web`
4. Add environment variable:
   - `REACT_APP_BACKEND_URL` = `https://tap-to-pay-prod.railway.app` (your Railway URL)
5. Click **Deploy**
6. **Done!** Your frontend URL is now ready

### Step 4: Test
```bash
# Create test payment
curl -X POST https://your-railway-url/payment_intents \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000000, "merchant_id": "test"}'

# Open the payment_url in your browser
```

## 📚 API Endpoints

### Create Payment
```
POST /payment_intents
{ "amount": 1000000, "merchant_id": "merchant-123" }
```

### Get Status
```
GET /payment_intents/{id}/status
```

### Confirm Payment
```
POST /payment_intents/{id}/confirm
{ "tx_signature": "..." }
```

### Get Merchant Payments
```
GET /merchants/{merchant_id}/payments
```

### Health Check
```
GET /health
```

See [backend/README.md](backend/README.md) for full API docs.

## 🔐 Security
- ✅ Input validation
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ CORS enabled
- ✅ Idempotent updates
- ✅ Solana verification

## 🧪 Test Suite
```powershell
cd backend
node examples/run-all-tests.js
```
- 14 Integration tests
- 15 Error tests
- 10+ Performance tests

## 🛠️ Tech Stack
- **Frontend**: Vanilla JS + Solana web3.js
- **Backend**: Node.js + Express + SQLite
- **Android**: Kotlin + NFC API
- **Blockchain**: Solana + Anchor

## 📖 Full Documentation
- [DEPLOY.md](DEPLOY.md) - Deployment details
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - One-click deploy buttons
- [TESTING.md](TESTING.md) - Test suite guide
- [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md) - System design
- [backend/README.md](backend/README.md) - Backend API docs

## 🆘 Troubleshooting
- Frontend won't load? → Check `REACT_APP_BACKEND_URL` env var on Vercel
- Backend 500 error? → Check Railway logs
- CORS issues? → Backend has CORS enabled; check Network tab in browser
- Tests hang? → Run `node local-dev-server.js` in separate terminal first

## 📄 License
MIT
