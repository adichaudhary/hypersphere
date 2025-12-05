# On-Chain Implementation Guide

This document explains the fully implemented on-chain functionality for the Tap-to-Pay application.

## Overview

The application now has full on-chain support for PaymentIntent accounts on Solana. PaymentIntent accounts are stored as Program Derived Addresses (PDAs) on the Solana blockchain and can be read and monitored in real-time.

## Components

### 1. Solana Program (`programs/tap_to_pay/src/lib.rs`)

The Solana program provides two main instructions:

#### `create_payment_intent`
- Creates a new PaymentIntent account on-chain
- Account is a PDA derived from `[b"payment_intent", payment_intent_id]`
- Stores: id, merchant, amount, status, nonce, tx_signature, created_at
- Requires merchant wallet to sign and pay for account creation

#### `pay_invoice`
- Processes a payment and marks the PaymentIntent as paid
- Verifies amount and nonce match
- Updates status from `0` (pending) to `1` (paid)
- Records payer's pubkey as tx_signature
- Emits PaymentEvent

### 2. Backend Integration

#### Account Decoding (`backend/src/solanaListener.js`)
- **`decodePaymentIntentAccount(data)`**: Decodes Borsh-encoded account data from Solana
- **`getPaymentIntentFromSolana(paymentIntentId)`**: Fetches and decodes PaymentIntent account from blockchain
- **`watchPaymentIntent(paymentIntentId, callback)`**: Monitors account changes in real-time via WebSocket

#### PDA Derivation
- Uses `[b"payment_intent", payment_intent_id]` as seeds
- Returns PDA address and bump seed

#### Status Endpoint
- `GET /payment_intents/:id/status` now checks both database and on-chain
- Returns `on_chain: true/false` to indicate if account exists on-chain
- Returns `pda` address if account exists

### 3. Payment Intent Creation

When a payment intent is created via `POST /payment_intents`:
1. Payment intent is saved to database
2. PDA is derived and returned in response
3. Backend starts watching the PDA for changes
4. **Note**: The on-chain account must be created separately by calling the `create_payment_intent` instruction

## How It Works

### Creating a Payment Intent

1. **Backend creates payment intent** (off-chain):
   ```bash
   POST /payment_intents
   {
     "amount": 10.00,
     "merchant_id": "...",
     "currency": "USDC"
   }
   ```

2. **Response includes PDA info**:
   ```json
   {
     "id": "uuid-here",
     "amount": 10.00,
     "pda": "PDA_ADDRESS_HERE",
     "bump": 255
   }
   ```

3. **Create on-chain account** (requires merchant wallet):
   - Merchant calls `create_payment_intent` instruction
   - Account is created at the PDA address
   - Account stores payment intent data on-chain

### Processing a Payment

1. **User pays** via Solana Pay or direct transaction
2. **Transaction includes `pay_invoice` instruction**:
   - Calls the Solana program
   - Updates PaymentIntent account status to `1` (paid)
   - Records payer's pubkey

3. **Backend watcher detects change**:
   - WebSocket subscription detects account data change
   - Decodes updated account data
   - Updates database with `status = "paid"` and `tx_signature`

4. **Status endpoint reflects on-chain state**:
   - Returns status from on-chain account if it exists
   - Falls back to database if account not yet created

## Account Data Structure

PaymentIntent accounts on-chain store:
- `id`: String (payment intent ID)
- `merchant`: Pubkey (32 bytes)
- `amount`: u64 (8 bytes)
- `status`: u8 (0 = pending, 1 = paid, 2 = expired)
- `nonce`: [u8; 32] (32 bytes, security nonce)
- `tx_signature`: String (payer's pubkey when paid)
- `created_at`: i64 (8 bytes, Unix timestamp)

## Creating On-Chain Accounts

### Option 1: Using Anchor Client (Recommended)

```javascript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

// Load program IDL and create program instance
const program = new Program(idl, programId, provider);

// Create payment intent account
await program.methods
  .createPaymentIntent(paymentIntentId, amount, nonce)
  .accounts({
    paymentIntent: pda,
    merchant: merchantKeypair.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([merchantKeypair])
  .rpc();
```

### Option 2: Manual Transaction Building

Use the helper functions in `backend/src/solanaProgram.js`:
- `buildCreatePaymentIntentInstruction()` - Builds the instruction
- Add to transaction and send with merchant's wallet

### Option 3: Frontend Integration

The frontend can create accounts when payment intents are created:
1. Receive PDA info from backend
2. Use merchant's wallet (Phantom, etc.) to sign transaction
3. Call `create_payment_intent` instruction

## Monitoring Payments

The backend automatically monitors PaymentIntent accounts:

1. **WebSocket Subscription**: Real-time account change notifications
2. **Automatic Decoding**: Borsh decoding of account data
3. **Database Sync**: Updates database when status changes to "paid"
4. **Auto-cleanup**: Watchers stop after 24 hours or when payment confirmed

## Testing

### Check if Account Exists On-Chain

```bash
curl http://localhost:3001/payment_intents/{id}/status
```

Response includes:
- `on_chain: true/false` - Whether account exists on-chain
- `pda: "..."` - PDA address if exists
- `status` - From on-chain if available, otherwise from database

### Monitor Account Changes

The backend automatically watches accounts. Check logs for:
```
Watching PaymentIntent PDA: <address> for payment intent: <id>
Payment update for <id>: { status: 'paid', ... }
✓ Payment confirmed on-chain: <id>
```

## Environment Variables

Required in `.env`:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=TapToPay111111111111111111111111111111111111
```

## Deployment

### 1. Deploy Solana Program

```bash
cd programs/tap_to_pay
anchor build
anchor deploy
```

Update `PROGRAM_ID` in `.env` with the deployed program ID.

### 2. Update Program ID in Code

Update `declare_id!()` in `programs/tap_to_pay/src/lib.rs` with your deployed program ID.

### 3. Test On-Chain

1. Create a payment intent via API
2. Note the PDA address from response
3. Create the account on-chain using merchant wallet
4. Verify account exists: `GET /payment_intents/{id}/status`
5. Process a payment that calls `pay_invoice`
6. Verify status updates automatically

## Benefits

1. **Immutable Record**: Payment intents stored on-chain cannot be tampered with
2. **Real-time Updates**: WebSocket subscriptions provide instant payment confirmations
3. **Decentralized**: No single point of failure for payment state
4. **Transparent**: All payment intents are publicly verifiable on Solana
5. **Secure**: Nonce verification prevents replay attacks

## Limitations

1. **Account Creation Cost**: Requires SOL for account rent (paid by merchant)
2. **Network Dependency**: Requires Solana RPC connection
3. **Wallet Required**: Creating accounts requires merchant wallet signature
4. **Program Deployment**: Program must be deployed to Solana network

## Future Enhancements

- Automatic account creation via backend service wallet
- Support for multiple chains (Base, Ethereum) with cross-chain bridges
- Event indexing for faster historical queries
- Account expiration and automatic cleanup

