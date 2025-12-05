#!/usr/bin/env node

/**
 * Script to delete all payments for a merchant
 * Usage: node delete-payments.js [merchant_id]
 */

const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const MERCHANT_ID = process.argv[2] || '4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U';

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

async function main() {
  try {
    log('========================================', colors.cyan);
    log('Delete Payments', colors.cyan);
    log('========================================', colors.cyan);
    log(`Merchant ID: ${MERCHANT_ID}`, colors.white);
    log('');

    // First, get current payment count
    log('Checking current payments...', colors.yellow);
    const getResponse = await makeRequest('GET', `/merchants/${MERCHANT_ID}/payments`);
    const currentCount = getResponse.total_count || 0;
    
    if (currentCount === 0) {
      log('✓ No payments found to delete', colors.green);
      return;
    }

    log(`Found ${currentCount} payment(s)`, colors.white);
    log('');

    // Delete all payments
    log('Deleting all payments...', colors.yellow);
    const deleteResponse = await makeRequest('DELETE', `/merchants/${MERCHANT_ID}/payments`);

    log('');
    log('========================================', colors.green);
    log('✓ Payments Deleted Successfully!', colors.green);
    log('========================================', colors.green);
    log(`Deleted: ${deleteResponse.deleted_count} payment(s)`, colors.white);
    log('');

  } catch (error) {
    log('');
    log('========================================', colors.red);
    log('✗ Error:', colors.red);
    log('========================================', colors.red);
    log(error.message, colors.red);
    log('');
    
    if (error.message.includes('Cannot DELETE')) {
      log('The DELETE endpoint may not be available.', colors.yellow);
      log('Make sure the backend server has been restarted', colors.yellow);
      log('to include the new DELETE endpoint.', colors.yellow);
    } else {
      log('Make sure the backend is running:', colors.yellow);
      log('  cd backend && npm start', colors.gray);
    }
    log('');
    process.exit(1);
  }
}

main();

