# Tap-to-Pay Web

Payment page for Solana tap-to-pay.

## Setup

```bash
cd web
npm install
npm start
```

Server runs on `http://localhost:3000`

## Usage

1. Backend creates payment intent and returns `payment_url`
2. User visits `/i/:payment_intent_id` 
3. Page loads payment details from `GET /pay/:payment_intent_id`
4. User selects tip amount (optional)
5. Clicks "Pay with Phantom"
6. Builds `pay_invoice` instruction and signs with Phantom
7. Polls `/payment_intents/:id/status` every 1s
8. Shows "Payment Received!" when status = paid

## URL Routing

- `/` - Home (not used)
- `/i/:payment_intent_id` - Payment page

## Phantom Integration

- Detects `window.solana` 
- Calls `connect()` to get wallet pubkey
- Calls `signAndSendTransaction()` to sign and send
- Falls back to mobile deep link if needed

## Configuration

Update in `app.js`:
```javascript
const BACKEND_URL = 'http://localhost:3001';
const RPC_ENDPOINT = 'http://localhost:8899';
const PROGRAM_ID = 'TapToPay111111111111111111111111111111111111';
```

## Features

✅ Responsive design
✅ Loading states
✅ Error handling with retry
✅ Tip selector
✅ Phantom wallet integration
✅ Status polling
✅ Success confirmation with tx link
✅ Mobile friendly
