#!/usr/bin/env node

/**
 * Test payment script to create and confirm a payment via the API
 * Usage: node test-payment.js [amount] [tip] [chain]
 * Example: node test-payment.js 10.50 2.00 SOL
 */

const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const MERCHANT_ID = '4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U';

// Parse command line arguments
const args = process.argv.slice(2);
const amount = parseFloat(args[0]) || 10.50;
const tip = parseFloat(args[1]) || 2.00;
const chain = args[2] || 'SOL';
const totalAmount = amount + tip;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || body}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

function generateMockTxSignature() {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let signature = '';
  for (let i = 0; i < 88; i++) {
    signature += chars[Math.floor(Math.random() * chars.length)];
  }
  return signature;
}

async function createTestPayment() {
  try {
    log('========================================', colors.cyan);
    log('Creating Test Payment', colors.cyan);
    log('========================================', colors.cyan);
    log(`Base Amount: $${amount.toFixed(2)} USDC`, colors.white);
    log(`Tip Amount:  $${tip.toFixed(2)} USDC`, colors.white);
    log(`Total:       $${totalAmount.toFixed(2)} USDC`, colors.green);
    log(`Chain:       ${chain}`, colors.white);
    log('');

    // Create payment intent
    log('Creating payment intent...', colors.cyan);
    const createData = {
      amount: totalAmount,
      merchant_id: MERCHANT_ID,
      currency: 'USDC',
      tip_amount: tip,
      chain: chain,
    };

    const createResponse = await makeRequest('POST', '/payment_intents', createData);

    log('✓ Payment intent created!', colors.green);
    log(`  Payment ID: ${createResponse.id}`, colors.gray);
    log(`  Status: ${createResponse.status}`, colors.gray);
    log(`  Created: ${createResponse.created_at}`, colors.gray);
    log('');

    // Generate mock transaction signature
    const txSignature = generateMockTxSignature();

    log('Confirming payment...', colors.cyan);

    // Confirm payment
    const confirmData = {
      tx_signature: txSignature,
    };

    const confirmResponse = await makeRequest(
      'POST',
      `/payment_intents/${createResponse.id}/confirm`,
      confirmData
    );

    log('');
    log('========================================', colors.green);
    log('✓ Payment Confirmed Successfully!', colors.green);
    log('========================================', colors.green);
    log(`Payment ID:    ${createResponse.id}`, colors.white);
    log(`Transaction:   ${txSignature}`, colors.white);
    log(`Amount:        $${totalAmount.toFixed(2)} USDC`, colors.white);
    log(`  Base:        $${amount.toFixed(2)}`, colors.gray);
    log(`  Tip:         $${tip.toFixed(2)}`, colors.gray);
    log(`Chain:         ${chain}`, colors.white);
    log(`Status:        ${confirmResponse.payment_intent.status}`, colors.green);
    log('');
    log('View in dashboard: http://localhost:5173', colors.yellow);
    log('');

    // Fetch and display payment status
    log('Fetching payment details...', colors.cyan);
    const statusResponse = await makeRequest('GET', `/payment_intents/${createResponse.id}/status`);
    
    log('');
    log('Payment Details:', colors.bright);
    log(`  ID:          ${statusResponse.id}`, colors.white);
    log(`  Amount:       $${statusResponse.amount.toFixed(2)}`, colors.white);
    log(`  Status:       ${statusResponse.status}`, colors.green);
    log(`  Created:      ${statusResponse.created_at}`, colors.gray);
    log(`  Updated:      ${statusResponse.updated_at}`, colors.gray);
    log(`  TX Signature: ${statusResponse.tx_signature || 'N/A'}`, colors.gray);
    log('');

  } catch (error) {
    log('');
    log('========================================', colors.red);
    log('✗ Error:', colors.red);
    log('========================================', colors.red);
    log(error.message, colors.red);
    log('');
    log('Make sure the backend is running:', colors.yellow);
    log('  cd backend && npm start', colors.gray);
    log('');
    process.exit(1);
  }
}

// Run the test
createTestPayment();

