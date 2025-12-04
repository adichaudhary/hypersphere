# Quick Start Guide

## 1. Install Dependencies

```bash
cd backend
npm install
```

## 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

**For local development:**
```env
SOLANA_RPC_URL=http://localhost:8899
PROGRAM_ID=TapToPay111111111111111111111111111111111111
PORT=3001
BASE_URL=http://localhost:3001
```

**For devnet:**
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=<your-deployed-program-id>
PORT=3001
BASE_URL=https://your-backend-url.com
```

## 3. Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

You should see:
```
✓ Database initialized
✓ Connected to Solana: 1.18.0
🚀 Backend server running on http://localhost:3001
```

## 4. Test the API

In another terminal:

```bash
node examples/test-api.js
```

This will:
1. Check health endpoint
2. Create payment intents
3. Query payment statuses
4. List merchant payments

Expected output:
```
🧪 Testing Tap-to-Pay API

1️⃣  Testing health endpoint...
✓ Health: { status: 'ok' }

2️⃣  Creating payment intent...
✓ Created: { id: '...', amount: 1000000, ... }

... (more tests)

✅ All tests completed successfully!
```

## 5. Using the API

### Create Payment
```bash
curl -X POST http://localhost:3001/payment_intents \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000000,
    "merchant_id": "store-001"
  }'
```

### Check Status
```bash
curl http://localhost:3001/payment_intents/550e8400-e29b-41d4-a716-446655440000/status
```

### Get Merchant Payments
```bash
curl http://localhost:3001/merchants/store-001/payments
```

## 6. Integration with Frontend

Your frontend should:

1. **Create payment intent**:
```javascript
const response = await fetch('http://localhost:3001/payment_intents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 1000000, merchant_id: 'store-001' })
});
const paymentIntent = await response.json();
```

2. **Build and sign transaction**:
```javascript
// Use paymentIntent.id, paymentIntent.nonce, etc.
// to build the Solana instruction
// Call tap_to_pay::pay_invoice
```

3. **Poll for confirmation**:
```javascript
const status = await fetch(
  `http://localhost:3001/payment_intents/${paymentIntent.id}/status`
);
const result = await status.json();
if (result.status === 'paid') {
  console.log('Payment confirmed!', result.tx_signature);
}
```

## File Structure

```
backend/
├── src/
│   ├── index.js              # Express server & endpoints
│   ├── database.js           # SQLite operations
│   ├── solanaListener.js     # Solana integration
│   └── client.js             # SDK for frontend integration
├── examples/
│   └── test-api.js           # Test script
├── data/
│   └── payments.db           # SQLite database (auto-created)
├── package.json
├── .env
├── .env.example
├── .gitignore
├── README.md
├── ARCHITECTURE.md
└── QUICKSTART.md
```

## Troubleshooting

### "Cannot find module @solana/web3.js"
```bash
npm install
```

### "Database locked" error
- Close other connections to `data/payments.db`
- Check that you have write permissions to the `data/` directory

### "Failed to connect to Solana"
- Verify `SOLANA_RPC_URL` is correct
- Check Solana network is running
- Try using public RPC: `https://api.devnet.solana.com`

### Listener not detecting payments
- Ensure program ID is correct in `.env`
- Verify payment intent ID matches what's stored in DB
- Check Solana transaction actually called `pay_invoice`
- Review backend logs for errors

### "CORS error" from frontend
- Backend has CORS enabled by default
- Update frontend URL in backend if needed
- Or configure specific origin in `src/index.js`

## Database

Database file: `backend/data/payments.db`

### View data with SQLite CLI:
```bash
sqlite3 data/payments.db
> SELECT * FROM payment_intents;
> SELECT * FROM merchants;
> .quit
```

### Reset database:
```bash
rm data/payments.db
# Database will be recreated on next server start
```

## Next Steps

1. ✅ Backend is running
2. Deploy Solana program if not already deployed
3. Get program ID and update `.env`
4. Build frontend to call backend endpoints
5. Integrate wallet connection
6. Test full payment flow end-to-end

## Support

For issues:
1. Check logs in terminal
2. Verify `.env` configuration
3. Test endpoints with `curl` or Postman
4. Check database state with SQLite CLI
5. Review `ARCHITECTURE.md` for system overview
