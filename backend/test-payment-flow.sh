#!/bin/bash

# Quick test script for payment intent creation and status checking
# Make sure backend is running: npm start

echo "=== Testing Payment Intent Creation ==="
echo ""

# Create payment intent
echo "1. Creating payment intent..."
RESPONSE=$(curl -s -X POST http://localhost:3001/payment_intents \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10.00,
    "merchant_id": "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U",
    "currency": "USDC",
    "tip_amount": 1.00,
    "chain": "Solana"
  }')

# Extract values
PAYMENT_ID=$(echo $RESPONSE | jq -r '.id')
NONCE=$(echo $RESPONSE | jq -r '.nonce')
PDA=$(echo $RESPONSE | jq -r '.pda // "N/A"')
BUMP=$(echo $RESPONSE | jq -r '.bump // "N/A"')

if [ "$PAYMENT_ID" == "null" ] || [ -z "$PAYMENT_ID" ]; then
  echo "❌ Failed to create payment intent"
  echo "Response: $RESPONSE"
  exit 1
fi

echo "✓ Payment intent created"
echo "  ID: $PAYMENT_ID"
echo "  PDA: $PDA"
echo "  Bump: $BUMP"
echo "  Nonce: $NONCE"
echo ""

# Check status
echo "2. Checking payment intent status..."
STATUS_RESPONSE=$(curl -s http://localhost:3001/payment_intents/$PAYMENT_ID/status)
STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
ON_CHAIN=$(echo $STATUS_RESPONSE | jq -r '.on_chain')

echo "  Status: $STATUS"
echo "  On-chain: $ON_CHAIN"
echo ""

if [ "$ON_CHAIN" == "true" ]; then
  echo "✓ Account exists on-chain!"
else
  echo "ℹ️  Account not yet created on-chain"
  echo "   To create account, use Anchor client (see TESTING_GUIDE.md)"
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "Next steps:"
echo "1. Create on-chain account using Anchor client"
echo "2. Process payment via pay_invoice instruction"
echo "3. Verify status updates automatically"

