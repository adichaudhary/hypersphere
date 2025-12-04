# Architecture Overview

## Tap-to-Pay Backend System

This backend implements a payment processing system for Solana tap-to-pay transactions.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend / Wallet App                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP (REST API)
                         │
        ┌────────────────▼────────────────┐
        │  Node.js Express Backend        │
        │                                 │
        │  ┌──────────────────────────┐   │
        │  │   API Endpoints          │   │
        │  │  - POST   /payment_...   │   │
        │  │  - GET    /payment_.../  │   │
        │  │  - GET    /merchants/    │   │
        │  └──────────────────────────┘   │
        │           │                     │
        │           │                     │
        │  ┌────────▼─────────┐  ┌──────┐│
        │  │ SQLite Database  │  │Solana││
        │  │  (payments.db)   │  │     ││
        │  └──────────────────┘  └──┬───┘│
        │                            │   │
        │                    ┌───────▼──┐│
        │                    │Listener  ││
        │                    │(Watch PDA││
        │                    │Status)   ││
        │                    └──────────┘│
        └─────────────────────────────────┘
                         │
                         │
        ┌────────────────▼────────────────┐
        │    Solana Blockchain            │
        │                                 │
        │  ┌──────────────────────────┐   │
        │  │   tap_to_pay Program     │   │
        │  │  - pay_invoice()         │   │
        │  │  - PaymentIntent PDAs    │   │
        │  └──────────────────────────┘   │
        └─────────────────────────────────┘
```

## Component Details

### 1. Express Server (`src/index.js`)
- Main application entry point
- Defines REST API endpoints
- Manages payment intent lifecycle
- Sets up Solana event listeners

### 2. Database Layer (`src/database.js`)
- SQLite3 database management
- Tables:
  - `payment_intents`: Stores payment records
  - `merchants`: Stores merchant profiles
- Async promise-based API

### 3. Solana Integration (`src/solanaListener.js`)
- Solana RPC connection management
- PDA derivation for PaymentIntent accounts
- Account data decoding (Borsh schema)
- WebSocket subscription for real-time updates
- Transaction verification

### 4. Client SDK (`src/client.js`)
- Example integration library
- Payment flow orchestration
- Status polling mechanism
- Transaction building helpers

## Data Flow

### Creating a Payment

1. **Frontend → Backend**: `POST /payment_intents`
   ```
   Request: { amount: 1000000, merchant_id: "merchant-001" }
   ```

2. **Backend Processing**:
   - Generate unique UUID for payment
   - Create random 32-byte nonce
   - Build payment URL
   - Save to SQLite database
   - Start watching Solana PDA

3. **Backend → Frontend**: Returns payment intent
   ```
   Response: { 
     id, amount, merchant_id, nonce, 
     payment_url, programId 
   }
   ```

### Payment Confirmation Flow

1. **Frontend**: Builds & signs Solana transaction
   - Calls `tap_to_pay::pay_invoice` instruction
   - Includes paymentIntentId, amount, nonce, bump
   - Sends transaction to Solana

2. **Solana**: Executes program
   - Loads PaymentIntent PDA
   - Validates amount and nonce
   - Updates status to "paid"
   - Emits PaymentEvent

3. **Backend Listener**: Detects change
   - Solana RPC notifies of account update
   - Backend decodes account data
   - Extracts tx_signature
   - Updates SQLite with status="paid"

4. **Frontend**: Polls for confirmation
   - `GET /payment_intents/:id/status`
   - Receives status and tx_signature
   - Displays confirmation to user

### Dashboard View

**Merchant Dashboard**: `GET /merchants/:id/payments`
- Returns all payment intents for merchant
- Shows statuses, amounts, timestamps
- Enables transaction history view

## Key Features

### 1. Real-time Payment Tracking
- Solana account subscriptions for instant updates
- Database persistence for reliability
- Automatic status propagation to clients

### 2. Unique Nonce Generation
- Each payment intent gets a random 32-byte nonce
- Prevents payment replays
- Validated during Solana instruction execution

### 3. Watcher Management
- Auto-cleanup after 24 hours
- Prevents memory leaks
- Graceful shutdown on server exit

### 4. Error Handling
- Database transaction safety
- Network error recovery
- Comprehensive logging

### 5. Scalability Considerations
- SQLite good for development/small scale
- Can migrate to PostgreSQL for production
- Solana listeners scale with number of transactions
- Consider connection pooling for high volume

## Environment Configuration

```env
SOLANA_RPC_URL=http://localhost:8899
PROGRAM_ID=TapToPay111111111111111111111111111111111111
PORT=3001
BASE_URL=http://localhost:3001
```

## Testing Flow

1. **Local Setup**:
   ```bash
   npm install
   npm run dev
   ```

2. **Create Payment**:
   ```bash
   node examples/test-api.js
   ```

3. **Verify Database**:
   - Check `data/payments.db`
   - Query: `SELECT * FROM payment_intents;`

4. **Test Full Flow**:
   - Create payment intent
   - Sign transaction in wallet
   - Monitor backend logs
   - Verify payment status update

## Security Considerations

1. **Input Validation**: All endpoints validate inputs
2. **CORS**: Configurable for specific origins
3. **PDA Verification**: Only official program PDAs accepted
4. **Nonce Verification**: Prevents replay attacks
5. **Status Immutability**: Once paid, cannot revert

## Future Enhancements

- [ ] Webhook notifications to merchants
- [ ] Rate limiting per merchant
- [ ] Payment expiration times
- [ ] Refund mechanism
- [ ] Multi-token support
- [ ] Batch payment verification
- [ ] Enhanced analytics dashboard
- [ ] Payment retry logic
