# Tap-to-Pay Backend

A Node.js Express backend server for Solana tap-to-pay payments.

## Setup

### Prerequisites
- Node.js 16+ and npm
- Solana devnet/localnet running (or use public RPC)

### Installation

```bash
cd backend
npm install
```

### Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=3001
BASE_URL=http://localhost:3001

# Solana
SOLANA_RPC_URL=http://localhost:8899
PROGRAM_ID=TapToPay111111111111111111111111111111111111
```

### Running the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:3001` by default.

## API Endpoints

### 1. Create Payment Intent
```
POST /payment_intents
Content-Type: application/json

{
  "amount": 1000000,
  "merchant_id": "merchant-001"
}

Response (201):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 1000000,
  "merchant_id": "merchant-001",
  "nonce": "a1b2c3d4...",
  "payment_url": "http://localhost:3001/pay/550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. Get Payment Status
```
GET /payment_intents/{payment_intent_id}/status

Response (200):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "tx_signature": null,
  "amount": 1000000,
  "merchant_id": "merchant-001",
  "created_at": "2025-12-03T10:30:00.000Z",
  "updated_at": "2025-12-03T10:30:00.000Z"
}
```

### 3. Get Merchant Payments (Dashboard)
```
GET /merchants/{merchant_id}/payments

Response (200):
{
  "merchant_id": "merchant-001",
  "total_count": 5,
  "payments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 1000000,
      "status": "paid",
      "created_at": "2025-12-03T10:30:00.000Z",
      "updated_at": "2025-12-03T10:31:00.000Z",
      "tx_signature": "4Kx9Y7Z8a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z"
    }
  ]
}
```

### 4. Get Payment Page (for frontend integration)
```
GET /pay/{payment_intent_id}

Response (200):
{
  "paymentIntentId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 1000000,
  "nonce": "a1b2c3d4...",
  "merchant_id": "merchant-001",
  "programId": "TapToPay111111111111111111111111111111111111"
}
```

### 5. Health Check
```
GET /health

Response (200):
{
  "status": "ok"
}
```

## Database

The backend uses SQLite3 for storing payment intents and merchant information.

- **Database file**: `backend/data/payments.db` (created automatically)
- **Tables**:
  - `payment_intents` - Stores payment intent records
  - `merchants` - Stores merchant information

## Solana Integration

### Payment Flow

1. **Create Payment Intent**: Frontend calls `POST /payment_intents` with amount and merchant ID
2. **Backend Setup Watcher**: Server starts watching the PaymentIntent PDA on Solana
3. **User Pays**: User signs and confirms the Solana transaction via the frontend
4. **Solana Listener**: Backend detects the status change on the PDA (status = 1 = paid)
5. **DB Update**: Backend updates the database with `status = "paid"` and `tx_signature`
6. **Cleanup**: Watcher stops after confirmation or after 24 hours

### PDA Derivation

Payment Intent PDAs are derived using:
- Seeds: `[b"payment_intent", payment_intent_id]`
- Program: The specified `PROGRAM_ID`

## Development Tips

- Check logs to see Solana listener activity
- Database file is auto-created in `data/` directory
- Watchers auto-cleanup after 24 hours to prevent memory leaks
- Use `/health` endpoint to verify server is running

## Error Handling

All endpoints return appropriate HTTP status codes:
- `201` - Payment intent created successfully
- `200` - Successful GET request
- `400` - Bad request (validation error)
- `404` - Not found (invalid payment intent or merchant)
- `500` - Server error
