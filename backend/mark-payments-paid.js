#!/usr/bin/env node

/**
 * Script to mark all payments as paid status
 * Runs from backend directory where sqlite3 is available
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'payments.db');
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

function generateMockTxSignature() {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let signature = '';
  for (let i = 0; i < 88; i++) {
    signature += chars[Math.floor(Math.random() * chars.length)];
  }
  return signature;
}

function updatePaymentsToPaid() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        return reject(err);
      }
    });

    // Get all pending payments for the merchant
    db.all(
      `SELECT id, status FROM payment_intents WHERE merchant_id = ? AND status != 'paid'`,
      [MERCHANT_ID],
      (err, rows) => {
        if (err) {
          db.close();
          return reject(err);
        }

        if (rows.length === 0) {
          db.close();
          log('  No pending payments found to update', colors.yellow);
          return resolve({ updated: 0, total: 0 });
        }

        log(`  Found ${rows.length} pending payment(s) to update`, colors.gray);

        let completed = 0;
        const errors = [];

        rows.forEach((row) => {
          const txSignature = generateMockTxSignature();
          db.run(
            `UPDATE payment_intents 
             SET status = 'paid', 
                 tx_signature = COALESCE(tx_signature, ?),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [txSignature, row.id],
            function(updateErr) {
              if (updateErr) {
                errors.push({ id: row.id, error: updateErr.message });
              } else {
                completed++;
              }

              // Check if all updates are done
              if (completed + errors.length === rows.length) {
                db.close();
                if (errors.length > 0) {
                  log(`  ⚠ ${errors.length} payment(s) had errors`, colors.yellow);
                }
                resolve({ updated: completed, total: rows.length, errors });
              }
            }
          );
        });
      }
    );
  });
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
    log(`Updated: ${result.updated} payment(s)`, colors.white);
    log(`Total: ${result.total} payment(s)`, colors.gray);
    
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

