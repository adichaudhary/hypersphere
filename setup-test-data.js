#!/usr/bin/env node

/**
 * Script to clean up dummy data and create test payments
 * - Keeps only 1 payment: $10 base + $1 tip
 * - Creates 3-4 payments: $12-25 base with $3-5 tips
 * - Ensures $10 + $1 tip is created last (appears first in list)
 */

const http = require('http');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const MERCHANT_ID = '4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
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

async function deleteAllPayments() {
  try {
    const response = await makeRequest('DELETE', `/merchants/${MERCHANT_ID}/payments`);
    log(`  ✓ Deleted ${response.deleted_count} payment(s)`, colors.green);
  } catch (error) {
    // If endpoint doesn't exist or error, that's okay - we'll continue
    log(`  ⚠ Could not delete payments: ${error.message}`, colors.yellow);
    log('  Continuing anyway...', colors.gray);
  }
}

async function createPayment(amount, tip, chain = 'SOL', delay = 0, confirm = false) {
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  const totalAmount = amount + tip;
  
  // Create payment intent
  const createData = {
    amount: totalAmount,
    merchant_id: MERCHANT_ID,
    currency: 'USDC',
    tip_amount: tip,
    chain: chain,
  };

  const createResponse = await makeRequest('POST', '/payment_intents', createData);

  let status = 'pending';
  
  // Try to confirm payment if requested (may fail if Solana verification is strict)
  if (confirm) {
    try {
      const txSignature = generateMockTxSignature();
      const confirmData = {
        tx_signature: txSignature,
      };
      await makeRequest(
        'POST',
        `/payment_intents/${createResponse.id}/confirm`,
        confirmData
      );
      status = 'paid';
    } catch (error) {
      // If confirmation fails, payment remains pending
      log(`    ⚠ Could not confirm payment: ${error.message}`, colors.yellow);
    }
  }

  return {
    id: createResponse.id,
    amount: totalAmount,
    base: amount,
    tip: tip,
    chain: chain,
    status: status,
  };
}

async function main() {
  try {
    log('========================================', colors.cyan);
    log('Setting Up Test Payment Data', colors.cyan);
    log('========================================', colors.cyan);
    log('');

    // Step 1: Delete all existing payments
    log('Step 1: Clearing existing payments...', colors.yellow);
    try {
      await deleteAllPayments();
      log('✓ All payments deleted', colors.green);
    } catch (error) {
      log(`⚠ Could not delete payments: ${error.message}`, colors.yellow);
      log('Continuing anyway...', colors.gray);
    }
    log('');

    // Step 2: Create 3-4 payments with $12-25 base and $3-5 tips
    log('Step 2: Creating test payments ($12-25 base, $3-5 tips)...', colors.yellow);
    const testPayments = [
      { base: 15.00, tip: 3.00, chain: 'SOL' },
      { base: 20.00, tip: 4.00, chain: 'ETH' },
      { base: 12.50, tip: 3.50, chain: 'BASE' },
      { base: 25.00, tip: 5.00, chain: 'SOL' },
    ];

    const createdPayments = [];
    for (let i = 0; i < testPayments.length; i++) {
      const payment = testPayments[i];
      log(`  Creating payment ${i + 1}/${testPayments.length}: $${payment.base} + $${payment.tip} tip (${payment.chain})...`, colors.gray);
      const result = await createPayment(payment.base, payment.tip, payment.chain, 500, false); // Don't confirm - will be pending
      createdPayments.push(result);
      log(`  ✓ Created: $${result.amount} total (${result.chain}) - ${result.status}`, colors.green);
    }
    log('');

    // Step 3: Create the $10 + $1 tip payment last (so it appears first)
    log('Step 3: Creating final payment ($10 + $1 tip)...', colors.yellow);
    log('  This will appear first in the payments list', colors.gray);
    const finalPayment = await createPayment(10.00, 1.00, 'SOL', 500, false); // Don't confirm - will be pending
    log(`  ✓ Created: $${finalPayment.amount} total (${finalPayment.chain}) - ${finalPayment.status}`, colors.green);
    log('');

    // Summary
    log('========================================', colors.green);
    log('✓ Test Data Setup Complete!', colors.green);
    log('========================================', colors.green);
    log('');
    log('Created Payments:', colors.bright);
    log(`  1. $${finalPayment.amount} ($${finalPayment.base} + $${finalPayment.tip} tip) - ${finalPayment.chain}`, colors.white);
    createdPayments.forEach((p, i) => {
      log(`  ${i + 2}. $${p.amount} ($${p.base} + $${p.tip} tip) - ${p.chain}`, colors.white);
    });
    log('');
    log(`Total: ${createdPayments.length + 1} payments`, colors.gray);
    log('');
    log('View in dashboard: http://localhost:5173', colors.yellow);
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

main();

