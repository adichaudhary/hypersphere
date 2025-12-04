# Circle Integration Guide

Integrate Solana tap-to-pay with Circle for merchant account management and reporting.

## Setup

### 1. Get Circle API Key

1. Go to [Circle Developer Dashboard](https://console.circle.com)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key for sandbox or production
5. Copy the API key

### 2. Configure Environment

Add to `.env`:
```env
CIRCLE_API_URL=https://api.sandbox.circle.com/v1
CIRCLE_API_KEY=your_api_key_here
SOL_USD_RATE=180
```

### 3. Install Dependencies

```bash
npm install axios
```

## API Endpoints

### Link Merchant to Circle

```
POST /merchants/:id/circle/link
Content-Type: application/json

{
  "name": "Merchant Name",
  "email": "merchant@example.com"
}

Response (201):
{
  "merchantId": "merchant-001",
  "circleWalletId": "wid_xxx...",
  "circleAddress": "0x...",
  "linked": true
}
```

### Get Merchant Dashboard Report

```
GET /merchants/:id/dashboard/report

Response (200):
{
  "merchantId": "merchant-001",
  "merchantName": "Merchant Name",
  "linked": true,
  "circleWalletId": "wid_xxx...",
  "currentBalance": 1500.50,
  "totalVolume": 5000.00,
  "totalVolumeUsd": 900000.00,
  "transactionCount": 125,
  "transactions": [
    {
      "id": "payment-uuid-1",
      "amount": 1000000,
      "status": "paid",
      "timestamp": "2025-12-03T10:30:00Z",
      "txSignature": "4Kx9Y7..."
    }
  ],
  "circleTransactions": [
    {
      "id": "circle-tx-1",
      "amount": "5000.00",
      "currency": "USD",
      "timestamp": "2025-12-03T10:32:00Z",
      "status": "confirmed"
    }
  ],
  "generatedAt": "2025-12-03T11:00:00Z"
}
```

## Data Flow

### 1. Merchant Linking

```
Merchant Signs Up
       ↓
POST /merchants/:id/circle/link
       ↓
Create Circle Wallet
       ↓
Store circle_wallet_id in DB
       ↓
Ready to receive payments
```

### 2. Payment Confirmation & Sweep

```
User Pays (Solana)
       ↓
Payment Confirmed (status=paid)
       ↓
handlePaymentConfirmed() triggered
       ↓
Verify USDC on Solana (optional)
       ↓
Log in database
       ↓
(Future: Auto-sweep to Circle)
```

### 3. Dashboard Reporting

```
Merchant Requests Dashboard
       ↓
GET /merchants/:id/dashboard/report
       ↓
Fetch from Circle API:
  - Account balance
  - Transaction history
       ↓
Fetch from local DB:
  - All payment intents
  - Calculate volume
       ↓
Calculate fiat equivalent
       ↓
Return aggregated report
```

## Database Schema

### Merchants (Updated)
```sql
CREATE TABLE merchants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  circle_wallet_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Circle Transactions (New)
```sql
CREATE TABLE circle_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  circle_transfer_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(merchant_id) REFERENCES merchants(id)
);
```

## Feature Overview

### Circle Client (`src/circle.js`)

- `createMerchantAccount()` - Create wallet for merchant
- `getWalletBalance()` - Check current balance
- `createTransfer()` - Sweep USDC to Circle
- `getTransferStatus()` - Check transfer status
- `getWalletTransactions()` - Get transaction history
- `getMerchantReport()` - Aggregate report data

### Circle Integration (`src/circleIntegration.js`)

- `linkMerchantToCircle()` - Link merchant account
- `handlePaymentConfirmed()` - Process confirmed payment
- `getMerchantDashboardReport()` - Generate dashboard report
- `initializeCircleDatabase()` - Setup DB tables

## Example Usage

### 1. Link Merchant

```bash
curl -X POST http://localhost:3001/merchants/store-001/circle/link \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Solana Store",
    "email": "owner@store.com"
  }'
```

### 2. View Dashboard

```bash
curl http://localhost:3001/merchants/store-001/dashboard/report
```

### 3. Check Payments

```bash
curl http://localhost:3001/merchants/store-001/payments
```

## Production Considerations

### 1. Circle Sandbox vs Production
- Dev: Use `https://api.sandbox.circle.com/v1`
- Prod: Use `https://api.circle.com/v1`

### 2. Idempotency Keys
- All Circle requests use idempotency keys for safety
- Format: `{operation}-{merchantId}-{timestamp}`
- Prevents duplicate transactions on retry

### 3. Balance Management
- Use Circle webhooks for real-time updates
- Implement sweep threshold (e.g., sweep when > 1000 USDC)
- Consider gas fees for sweeps

### 4. Security
- Store Circle API key in secure vault
- Use IAM for Circle account access
- Audit all transfers
- Implement rate limiting

### 5. Error Handling
- Retry failed Circle requests with exponential backoff
- Log all Circle API errors
- Notify merchant of sweep failures
- Fallback to manual reconciliation if needed

## Testing

### Mock Circle API
For testing without Circle integration:
```javascript
// Create mock CircleClient in tests
class MockCircleClient {
  async createMerchantAccount() {
    return {
      walletId: 'mock-wid',
      address: '0xMockAddress',
    };
  }
  // ... other mocked methods
}
```

### Test Endpoints

```bash
# Test merchant linking
npm run test:circle-link

# Test dashboard report
npm run test:circle-dashboard

# Test payment sweep
npm run test:circle-sweep
```

## Future Enhancements

- [ ] Webhook support for Circle payment notifications
- [ ] Automatic sweep on threshold
- [ ] Multi-currency support
- [ ] ACH withdrawals
- [ ] Dispute handling
- [ ] Settlement reports
- [ ] Tax reporting export
- [ ] Real-time price feeds

## Support

For Circle API issues:
- Check [Circle Docs](https://developers.circle.com)
- Review API error responses
- Check Circle status page
- Contact Circle support

For backend integration issues:
- Check logs: `console.error` output
- Verify Circle API key
- Test with mock data
- Review database tables
