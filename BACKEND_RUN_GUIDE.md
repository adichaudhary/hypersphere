# How to Run the Backend

## Quick Start

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create Environment File (Optional)
Create a `.env` file in the `backend` directory if you want to customize settings:

```env
PORT=3001
BASE_URL=http://localhost:3001
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=TapToPay111111111111111111111111111111111111
```

**Note**: The backend will work with default values if you don't create a `.env` file.

### Step 4: Run the Backend

**For Development (with auto-reload):**
```bash
npm run dev
```

**For Production:**
```bash
npm start
```

### Step 5: Verify It's Running
Open your browser and go to:
- **Health Check**: http://localhost:3001/health
- You should see: `{"status":"ok"}`

## Default Configuration

If you don't create a `.env` file, the backend uses these defaults:
- **Port**: `3001`
- **Base URL**: `http://localhost:3001`
- **Solana RPC**: `https://api.devnet.solana.com` (or checks environment)
- **Program ID**: `TapToPay111111111111111111111111111111111111`

## What You'll See

When the backend starts successfully, you should see:
```
✓ Database initialized
✓ Server running on http://localhost:3001
```

## Testing the Backend

### Test Health Endpoint
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok"}
```

### Test Creating a Payment Intent
```bash
curl -X POST http://localhost:3001/payment_intents \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "merchant_id": "test-merchant"}'
```

## Common Issues

### Port Already in Use
If port 3001 is already in use:
1. Change the port in `.env`: `PORT=3002`
2. Or stop the process using port 3001

### Database Errors
The database file is automatically created in `backend/data/payments.db`. Make sure the `data` directory exists or can be created.

### Solana Connection Issues
If you see Solana connection errors:
- Check your internet connection
- Verify the RPC URL is correct
- For devnet, use: `https://api.devnet.solana.com`

## Next Steps

Once the backend is running:
1. **Frontend**: Make sure your frontend's `VITE_API_URL` points to `http://localhost:3001`
2. **Android App**: Update `BACKEND_URL` in the Android app to point to your backend
3. **Test**: Try creating a payment intent and verify it works

## Stopping the Backend

Press `Ctrl + C` in the terminal where the backend is running.

