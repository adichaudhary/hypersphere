# Android Terminal → Backend → Frontend Integration

This document explains how payment data flows from the Android terminal through the backend to the frontend dashboard.

## System Architecture

```
Android Terminal (HceSender)
    ↓ HTTP POST
Backend API (Node.js/Express)
    ↓ REST API
Frontend Dashboard (React/Vite)
```

## Setup Instructions

### 1. Backend Setup

Start the backend server:

```bash
cd backend
npm install
npm start
```

The backend will run on `http://localhost:3001`

### 2. Frontend Setup

Start the frontend development server:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Android App Configuration

The Android app (`HceSender`) is configured to send payment data to the backend at:
- **Local Development**: `http://10.0.2.2:3001` (Android emulator accessing localhost)
- **Physical Device**: Update `BACKEND_URL` in `MainActivity.kt` to your computer's local IP

## Payment Flow

### Step 1: Customer Taps Android Terminal

When a customer taps their NFC device on the Android terminal:

1. `PaymentCardService.kt` receives the NFC signal
2. Broadcasts `ACTION_NFC_SCANNED` to the MainActivity
3. `MainActivity.triggerPaymentSuccess()` is called

### Step 2: Android Sends Payment to Backend

The Android app makes two API calls:

**a) Create Payment Intent**
```http
POST http://localhost:3001/payment_intents
Content-Type: application/json

{
  "amount": 0.01,
  "merchant_id": "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U",
  "currency": "USDC"
}
```

**b) Confirm Payment**
```http
POST http://localhost:3001/payment_intents/{id}/confirm
Content-Type: application/json

{
  "tx_signature": "3Kx9...7mNp"
}
```

### Step 3: Backend Stores Payment

The backend (`backend/src/index.js`):
1. Creates a payment intent in the SQLite database
2. Stores the transaction signature
3. Updates payment status to "paid"

### Step 4: Frontend Displays Payment

The frontend automatically:
1. Fetches all payments via `GET /merchants/{id}/payments`
2. Updates the dashboard every 10 seconds
3. Displays payments in:
   - **Overview** page: Recent transactions table
   - **Payments** page: Full transaction history with filters

## Key Files Modified

### Android App
- `HceSender/app/src/main/java/com/example/hcesender/MainActivity.kt`
  - Added `sendPaymentToBackend()` function
  - Added HTTP request handling
  - Added mock transaction signature generation

- `HceSender/app/src/main/AndroidManifest.xml`
  - Added `INTERNET` permission

### Frontend
- `frontend/src/utils/api.ts` - NEW
  - API client functions
  - Data formatting utilities

- `frontend/src/components/pages/Payments.tsx`
  - Replaced dummy data with real API calls
  - Added auto-refresh (10 seconds)
  - Added loading/error states

- `frontend/src/components/pages/Overview.tsx`
  - Integrated real payment data
  - Dynamic metrics calculation
  - Real-time transaction list

### Backend
No changes needed - already had the necessary endpoints!

## Testing the Integration

### Option 1: Using Android App
1. Start backend server
2. Start frontend server
3. Run Android app in emulator
4. Tap the screen to simulate a payment
5. Watch the payment appear in the frontend dashboard

### Option 2: Using API Directly

Create a test payment:
```bash
curl -X POST http://localhost:3001/payment_intents \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10.50,
    "merchant_id": "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U",
    "currency": "USDC"
  }'
```

Then confirm it (use the `id` from the response):
```bash
curl -X POST http://localhost:3001/payment_intents/{PAYMENT_ID}/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "tx_signature": "5Ty2K8oK9VnqYAXB7YXsNh9gSqYZ3hRw5KLp9pLm"
  }'
```

## Configuration

### Merchant ID
The merchant wallet address is hardcoded in three places:
- Android: `MainActivity.kt` and `PaymentCardService.kt`
- Frontend: `Payments.tsx` and `Overview.tsx`

Current value: `4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U`

To change it, update all three locations.

### Backend URL
- **Android Emulator**: `http://10.0.2.2:3001`
- **Physical Android Device**: `http://YOUR_COMPUTER_IP:3001`
- **Frontend**: `http://localhost:3001` (configured in `api.ts`)

## Troubleshooting

### Payments Not Showing in Frontend
1. Check backend is running: `curl http://localhost:3001/health`
2. Check frontend console for errors
3. Verify merchant ID matches in all places

### Android Can't Connect to Backend
1. **Emulator**: Use `10.0.2.2` instead of `localhost`
2. **Physical Device**: Use your computer's local IP address
3. Ensure backend is listening on `0.0.0.0` not just `localhost`
4. Check firewall settings

### Payment Data Missing
1. Check backend logs for API calls
2. Verify SQLite database: `backend/data/payments.db`
3. Check browser Network tab for API responses

## Future Enhancements

- [ ] Real Solana transaction integration (currently using mock signatures)
- [ ] Tip functionality
- [ ] Multi-chain support (Ethereum, Base)
- [ ] WebSocket for real-time updates (instead of polling)
- [ ] Payment notifications
- [ ] Export functionality
- [ ] Advanced filtering and search

