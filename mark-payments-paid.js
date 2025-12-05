#!/usr/bin/env node

/**
 * Script to mark all payments as paid status
 * Updates the database directly to set status to 'paid' and adds mock transaction signatures
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

async function updatePaymentsToPaid() {
  try {
    // Use the new endpoint to mark all payments as paid
    const response = await makeRequest('POST', `/merchants/${MERCHANT_ID}/payments/mark-paid`);
    return response;
  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    log('========================================', colors.cyan);
    log('Marking Payments as Paid', colors.cyan);
    log('========================================', colors.cyan);
    log(`Merchant ID: ${MERCHANT_ID}`, colors.white);
    log('');

    log('Updating payment statuses...', colors.yellow);
    const result = await updatePaymentsToPaid();

    log('');
    log('========================================', colors.green);
    log('✓ Payments Updated Successfully!', colors.green);
    log('========================================', colors.green);
    log(`Updated: ${result.updated_count} payment(s)`, colors.white);
    log(`Total Pending: ${result.total_pending} payment(s)`, colors.gray);
    
    if (result.errors && result.errors.length > 0) {
      log('');
      log('Errors:', colors.yellow);
      result.errors.forEach(err => {
        log(`  - ${err.id}: ${err.error}`, colors.red);
      });
    }
    
    log('');
    log('All payments are now marked as "paid"', colors.green);
    log('View in dashboard: http://localhost:5173', colors.yellow);
    log('');

  } catch (error) {
    log('');
    log('========================================', colors.red);
    log('✗ Error:', colors.red);
    log('========================================', colors.red);
    log(error.message, colors.red);
    log('');
    process.exit(1);
  }
}

main();

