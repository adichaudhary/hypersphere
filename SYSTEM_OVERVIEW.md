# Tap to Pay System - Overview

## What This System Does

A complete **Android NFC payment terminal** that processes USDC payments and displays them in a web dashboard.

## System Components

### 1. **Android Terminal (HceSender)**
- NFC-enabled payment terminal
- Sends payment data when customer taps
- Communicates with backend API
- Shows payment success animation

### 2. **Backend API (Node.js/Express)**
- Stores payment transactions in SQLite database
- REST API for creating and confirming payments
- Real-time payment tracking
- Located in: `backend/`

### 3. **Frontend Dashboard (React/Vite)**
- Real-time payment visualization
- Overview page with metrics
- Payments page with full transaction history
- Auto-refreshes every 10 seconds
- CSV export functionality
- Located in: `frontend/`

## How It Works

```
Customer → Android Terminal → Backend API → Database
                                    ↓
                            Frontend Dashboard
```

1. Customer taps phone on Android terminal
2. Android app sends payment to backend
3. Backend stores payment in database
4. Frontend fetches and displays payments
5. Merchant sees transaction in dashboard

## Quick Start

### Start Backend
```powershell
cd backend
npm start
```

### Start Frontend
```powershell
cd frontend
npm run dev
```

### Test Payment
```powershell
.\test-payment.ps1 -Amount 25.00
```

### View Dashboard
```
http://localhost:5173
```

## Key Features

✅ **Real Payments**: Process actual USDC transactions  
✅ **Live Dashboard**: See payments update in real-time  
✅ **Payment History**: Full transaction log with filters  
✅ **Export Data**: Download payments as CSV  
✅ **Mobile Terminal**: Android NFC payment app  
✅ **Auto-refresh**: Dashboard updates every 10 seconds  

## API Endpoints

### Create Payment
```http
POST http://localhost:3001/payment_intents
Content-Type: application/json

{
  "amount": 10.50,
  "merchant_id": "merchant_wallet_address",
  "currency": "USDC"
}
```

### Confirm Payment
```http
POST http://localhost:3001/payment_intents/:id/confirm
Content-Type: application/json

{
  "tx_signature": "solana_transaction_signature"
}
```

### Get Merchant Payments
```http
GET http://localhost:3001/merchants/:id/payments
```

## Database

**Location**: `backend/data/payments.db` (SQLite)

**Tables**:
- `payment_intents` - All payment transactions
- `merchants` - Merchant information

## Configuration

**Backend** (`backend/.env`):
```env
PORT=3001
SOLANA_RPC_URL=http://localhost:8899
SOL_USD_RATE=180
```

**Frontend** (`frontend/src/utils/api.ts`):
```typescript
const API_BASE_URL = 'http://localhost:3001';
```

## File Structure

```
ttp/
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── index.js     # Main API server
│   │   ├── database.js  # SQLite database
│   │   └── ...
│   └── data/
│       └── payments.db  # Payment database
├── frontend/            # React dashboard
│   └── src/
│       ├── components/
│       │   └── pages/
│       │       ├── Overview.tsx
│       │       └── Payments.tsx
│       └── utils/
│           └── api.ts   # API client
├── HceSender/           # Android NFC terminal
│   └── app/
│       └── src/main/java/
└── test-payment.ps1     # Test script
```

## Testing

### Test Backend
```powershell
cd backend
npm start
# In another terminal:
curl http://localhost:3001/health
```

### Test Frontend
```powershell
cd frontend
npm run dev
# Open: http://localhost:5173
```

### Test Complete Flow
```powershell
# Create test payment
.\test-payment.ps1 -Amount 50

# View in dashboard
start http://localhost:5173/payments
```

## Deployment

### Backend
- Deploy to any Node.js host (Heroku, Railway, etc.)
- Set environment variables
- Ensure SQLite or switch to PostgreSQL

### Frontend
- Build: `npm run build`
- Deploy static files to Vercel, Netlify, etc.
- Update API URL in production

### Android
- Build APK in Android Studio
- Install on NFC-enabled device
- Configure backend URL in MainActivity

## Support

For issues or questions, check:
- `backend/README.md` - Backend documentation
- `QUICKSTART_INTEGRATION.md` - Setup guide
- `TESTING.md` - Testing guide

## System is Production-Ready

✅ Database persistence  
✅ Error handling  
✅ Real-time updates  
✅ Mobile terminal  
✅ Web dashboard  
✅ Export functionality  
✅ Clean codebase  


