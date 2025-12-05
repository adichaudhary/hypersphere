#!/usr/bin/env node

/**
 * Interactive test payment script
 * Prompts user for payment details and creates a test payment
 */

const readline = require('readline');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const MERCHANT_ID = '4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
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

async function main() {
  console.log('\n========================================');
  console.log('Interactive Payment Test Script');
  console.log('========================================\n');

  try {
    // Get payment details from user
    const amountInput = await question('Enter base amount (default: 10.50): ');
    const amount = parseFloat(amountInput) || 10.50;

    const tipInput = await question('Enter tip amount (default: 2.00): ');
    const tip = parseFloat(tipInput) || 2.00;

    const chainInput = await question('Enter chain [SOL/ETH/BASE] (default: SOL): ');
    const chain = chainInput.trim().toUpperCase() || 'SOL';

    const totalAmount = amount + tip;

    console.log('\n========================================');
    console.log('Payment Summary');
    console.log('========================================');
    console.log(`Base Amount: $${amount.toFixed(2)} USDC`);
    console.log(`Tip Amount:  $${tip.toFixed(2)} USDC`);
    console.log(`Total:       $${totalAmount.toFixed(2)} USDC`);
    console.log(`Chain:       ${chain}`);
    console.log('');

    const confirm = await question('Create this payment? (y/n): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      rl.close();
      return;
    }

    console.log('\nCreating payment intent...');

    // Create payment intent
    const createData = {
      amount: totalAmount,
      merchant_id: MERCHANT_ID,
      currency: 'USDC',
      tip_amount: tip,
      chain: chain,
    };

    const createResponse = await makeRequest('POST', '/payment_intents', createData);

    console.log('✓ Payment intent created!');
    console.log(`  Payment ID: ${createResponse.id}`);
    console.log(`  Status: ${createResponse.status}`);
    console.log('');

    // Generate mock transaction signature
    const txSignature = generateMockTxSignature();

    console.log('Confirming payment...');

    // Confirm payment
    const confirmData = {
      tx_signature: txSignature,
    };

    const confirmResponse = await makeRequest(
      'POST',
      `/payment_intents/${createResponse.id}/confirm`,
      confirmData
    );

    console.log('\n========================================');
    console.log('✓ Payment Confirmed Successfully!');
    console.log('========================================');
    console.log(`Payment ID:    ${createResponse.id}`);
    console.log(`Transaction:   ${txSignature}`);
    console.log(`Amount:        $${totalAmount.toFixed(2)} USDC`);
    console.log(`  Base:        $${amount.toFixed(2)}`);
    console.log(`  Tip:         $${tip.toFixed(2)}`);
    console.log(`Chain:         ${chain}`);
    console.log(`Status:        ${confirmResponse.payment_intent.status}`);
    console.log('');
    console.log('View in dashboard: http://localhost:5173');
    console.log('');

  } catch (error) {
    console.log('\n========================================');
    console.log('✗ Error:');
    console.log('========================================');
    console.log(error.message);
    console.log('');
    console.log('Make sure the backend is running:');
    console.log('  cd backend && npm start');
    console.log('');
  } finally {
    rl.close();
  }
}

main();

