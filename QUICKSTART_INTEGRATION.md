# Quick Start: Payment Integration Testing

## Prerequisites

Ensure you have:
- Node.js installed (v16+)
- Backend dependencies installed: `cd backend && npm install`
- Frontend dependencies installed: `cd frontend && npm install`

## Start the System

### Windows (PowerShell)

Run the quick start script:
```powershell
.\start-all.ps1
```

This will open two PowerShell windows:
1. Backend server (http://localhost:3001)
2. Frontend dashboard (http://localhost:5173)

### Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Test the Integration

### Method 1: Test Payment via API (Quickest)

Open a new terminal and run:

```powershell
# Create a payment
curl -X POST http://localhost:3001/payment_intents `
  -H "Content-Type: application/json" `
  -d '{\"amount\": 25.50, \"merchant_id\": \"4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U\", \"currency\": \"USDC\"}'
```

Copy the `id` from the response, then confirm it:

```powershell
# Replace PAYMENT_ID with the actual ID from above
curl -X POST http://localhost:3001/payment_intents/PAYMENT_ID/confirm `
  -H "Content-Type: application/json" `
  -d '{\"tx_signature\": \"5Ty2K8oK9VnqYAXB7YXsNh9gSqYZ3hRw5KLp9pLm3vRw\"}'
```

**View the payment:**
1. Open http://localhost:5173 in your browser
2. Go to "Payments" page - you should see your payment!
3. Go to "Overview" page - metrics should update with your payment

### Method 2: Test with Android App

1. Open the HceSender Android project in Android Studio
2. Run the app on an emulator or device
3. **If using emulator**: The app is already configured for `http://10.0.2.2:3001`
4. **If using physical device**: 
   - Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Update `BACKEND_URL` in `MainActivity.kt` to `http://YOUR_IP:3001`
5. Tap the screen in the app to simulate a payment
6. Check the frontend dashboard - payment should appear within 10 seconds!

### Method 3: Create Multiple Test Payments

Run this PowerShell script to create multiple test payments:

```powershell
# Create 5 test payments
$merchantId = "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U"

for ($i = 1; $i -le 5; $i++) {
    $amount = Get-Random -Minimum 5 -Maximum 100
    
    # Create payment intent
    $createResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/payment_intents" `
        -ContentType "application/json" `
        -Body (@{
            amount = $amount
            merchant_id = $merchantId
            currency = "USDC"
        } | ConvertTo-Json)
    
    Write-Host "Created payment $i : $amount USDC (ID: $($createResponse.id))"
    
    # Confirm payment
    $txSig = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 88 | ForEach-Object {[char]$_})
    
    $confirmResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/payment_intents/$($createResponse.id)/confirm" `
        -ContentType "application/json" `
        -Body (@{
            tx_signature = $txSig
        } | ConvertTo-Json)
    
    Write-Host "  ✓ Confirmed with signature: $txSig"
    Start-Sleep -Milliseconds 500
}

Write-Host "`n✓ Created 5 test payments! Check the dashboard at http://localhost:5173"
```

## Verify Everything Works

### 1. Check Backend Health
```bash
curl http://localhost:3001/health
```
Should return: `{"status":"ok"}`

### 2. Check Payments API
```bash
curl http://localhost:3001/merchants/4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U/payments
```
Should return JSON with your payments

### 3. Check Frontend
Open http://localhost:5173 in browser:
- Overview page should show metrics
- Payments page should list all transactions
- Data should auto-refresh every 10 seconds

## What You Should See

### Frontend Overview Page
- **Total Sales Today**: Sum of all today's payments
- **Total Transactions**: Count of all payments
- **Average Order Value**: Average payment amount
- **Recent Transactions Table**: Latest 8 payments

### Frontend Payments Page
- **Payments Table**: All payments with:
  - Time (formatted)
  - Amount in USDC
  - Chain (Solana/USDC)
  - Transaction signature (shortened)
  - Status (Confirmed/Pending)
- **Filters**: By date, chain, tip, amount
- **Auto-refresh**: Every 10 seconds

## Troubleshooting

### "Failed to load payments"
- Ensure backend is running on port 3001
- Check browser console for errors
- Verify CORS is enabled in backend

### Android app can't connect
- **Emulator**: Must use `10.0.2.2` not `localhost`
- **Device**: Update IP address in MainActivity.kt
- Check firewall isn't blocking port 3001

### Payments not appearing
- Wait 10 seconds for auto-refresh
- Check backend logs for API calls
- Verify merchant ID matches: `4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U`

### Database issues
- Backend database location: `backend/data/payments.db`
- If corrupted, delete it and restart backend (will recreate)

## Next Steps

Once the integration is working:
1. Test with real Android NFC terminal
2. Integrate real Solana blockchain transactions
3. Add WebSocket for real-time updates
4. Customize merchant ID and branding
5. Deploy to production

## Support

For issues or questions, check:
- `INTEGRATION_SETUP.md` - Detailed architecture
- `backend/README.md` - Backend API docs
- `backend/QUICKSTART.md` - Backend setup
- Backend logs in terminal for debugging

