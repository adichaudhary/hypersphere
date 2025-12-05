# Quick Test Guide

## Fastest Way to Test (Without Full Deployment)

### Step 1: Start Backend

```bash
cd backend
npm start
```

### Step 2: Test Payment Intent Creation

**Windows (PowerShell):**
```powershell
cd backend
.\test-payment-flow.ps1
```

**Mac/Linux:**
```bash
cd backend
bash test-payment-flow.sh
```

**Or manually:**
```bash
curl -X POST http://localhost:3001/payment_intents \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10.00,
    "merchant_id": "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U",
    "currency": "USDC"
  }'
```

### Step 3: Check Status

```bash
curl http://localhost:3001/payment_intents/{PAYMENT_ID}/status
```

You should see:
- `on_chain: false` initially (account not created yet)
- `pda: "..."` (PDA address for the account)

## What This Tests

✅ Backend API is working  
✅ Payment intent creation  
✅ PDA derivation  
✅ Status endpoint  
✅ Database storage  

## Next: Full On-Chain Testing

To test the **full on-chain functionality**, you need to:

1. **Deploy the Solana program** (see TESTING_GUIDE.md Step 1)
2. **Create accounts on-chain** (see TESTING_GUIDE.md Step 4)
3. **Process payments** (see TESTING_GUIDE.md Step 6)

## Quick Status Check

After creating a payment intent, you can always check:

```bash
# Get payment intent ID from creation response, then:
curl http://localhost:3001/payment_intents/{ID}/status | jq
```

This will show:
- Current status (pending/paid)
- Whether account exists on-chain
- PDA address
- Transaction signature (if paid)

## Troubleshooting

**Backend not starting?**
- Check if port 3001 is available
- Make sure dependencies are installed: `npm install`

**Payment intent creation fails?**
- Check backend logs
- Verify database is initialized
- Check CORS settings if calling from browser

**Status shows `on_chain: false`?**
- This is normal! Account needs to be created on-chain separately
- See TESTING_GUIDE.md for full on-chain setup

