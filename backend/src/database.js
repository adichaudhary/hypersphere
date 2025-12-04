import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/payments.db');

// Initialize database
export function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
      else {
        db.serialize(() => {
                // Create PaymentIntents table (include token fields for USDC support)
                db.run(`
                  CREATE TABLE IF NOT EXISTS payment_intents (
                    id TEXT PRIMARY KEY,
                    amount INTEGER NOT NULL,
                    merchant_id TEXT NOT NULL,
                    nonce TEXT NOT NULL,
                    payment_url TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    tx_signature TEXT,
                    currency TEXT DEFAULT 'SOL',
                    token_mint TEXT,
                    recipient_address TEXT,
                    token_decimals INTEGER DEFAULT 6,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                  )
                `, (err) => {
                  if (err) reject(err);
                });

          // Create Merchants table
          db.run(`
            CREATE TABLE IF NOT EXISTS merchants (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              wallet_address TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) reject(err);
          });

          // Create index for faster lookups
          db.run(`
            CREATE INDEX IF NOT EXISTS idx_merchant_id 
            ON payment_intents(merchant_id)
          `, (err) => {
            if (err) reject(err);
            else {
              // Ensure migration: add any missing columns for older DBs
              db.all(`PRAGMA table_info(payment_intents)`, (err2, info) => {
                if (err2) {
                  db.close();
                  return reject(err2);
                }

                const existing = (info || []).map(c => c.name);
                const migrations = [];
                if (!existing.includes('currency')) {
                  migrations.push(`ALTER TABLE payment_intents ADD COLUMN currency TEXT DEFAULT 'SOL'`);
                }
                if (!existing.includes('token_mint')) {
                  migrations.push(`ALTER TABLE payment_intents ADD COLUMN token_mint TEXT`);
                }
                if (!existing.includes('recipient_address')) {
                  migrations.push(`ALTER TABLE payment_intents ADD COLUMN recipient_address TEXT`);
                }
                if (!existing.includes('token_decimals')) {
                  migrations.push(`ALTER TABLE payment_intents ADD COLUMN token_decimals INTEGER DEFAULT 6`);
                }

                const runNext = () => {
                  const sql = migrations.shift();
                  if (!sql) {
                    db.close();
                    return resolve(db);
                  }
                  db.run(sql, (err3) => {
                    if (err3) {
                      db.close();
                      return reject(err3);
                    }
                    runNext();
                  });
                };

                runNext();
              });
            }
          });
        });
      }
    });
  });
}

// Get database connection
export function getDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

// Save payment intent
export function savePaymentIntent(paymentIntent) {
  return new Promise((resolve, reject) => {
    getDatabase().then(db => {
      db.run(
        `INSERT INTO payment_intents (id, amount, merchant_id, nonce, payment_url, status, currency, token_mint, recipient_address, token_decimals)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentIntent.id,
          paymentIntent.amount,
          paymentIntent.merchant_id,
          paymentIntent.nonce,
          paymentIntent.payment_url,
          'pending',
          paymentIntent.currency || 'SOL',
          paymentIntent.token_mint || null,
          paymentIntent.recipient_address || null,
          typeof paymentIntent.token_decimals === 'number' ? paymentIntent.token_decimals : 6,
        ],
        function(err) {
          if (err) {
            db.close();
            return reject(err);
          }

          // Fetch the inserted row so callers get timestamps and exact stored values
          db.get(`SELECT * FROM payment_intents WHERE id = ?`, [paymentIntent.id], (err2, row) => {
            db.close();
            if (err2) return reject(err2);
            resolve(row);
          });
        }
      );
    }).catch(reject);
  });
}

// Get payment intent by ID
export function getPaymentIntent(id) {
  return new Promise((resolve, reject) => {
    getDatabase().then(db => {
      db.get(
        `SELECT * FROM payment_intents WHERE id = ?`,
        [id],
        (err, row) => {
          db.close();
          if (err) reject(err);
          else resolve(row);
        }
      );
    }).catch(reject);
  });
}

// Update payment intent status
export function updatePaymentIntentStatus(id, status, tx_signature) {
  return new Promise((resolve, reject) => {
    getDatabase().then(db => {
      // Only update if not already paid to avoid race conditions/overwrites
      const params = [status, tx_signature, id];
      db.run(
        `UPDATE payment_intents 
         SET status = ?, tx_signature = COALESCE(?, tx_signature), updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND (status IS NULL OR status != 'paid')`,
        params,
        function(err) {
          if (err) {
            db.close();
            return reject(err);
          }

          // If no rows changed, return the existing row so callers can see current state
          db.get(`SELECT * FROM payment_intents WHERE id = ?`, [id], (err2, row) => {
            db.close();
            if (err2) return reject(err2);
            resolve(row || { id, status, tx_signature });
          });
        }
      );
    }).catch(reject);
  });
}

// Get all payment intents for a merchant
export function getMerchantPayments(merchant_id) {
  return new Promise((resolve, reject) => {
    getDatabase().then(db => {
      db.all(
        `SELECT * FROM payment_intents 
         WHERE merchant_id = ? 
         ORDER BY created_at DESC`,
        [merchant_id],
        (err, rows) => {
          db.close();
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    }).catch(reject);
  });
}

// Save merchant
export function saveMerchant(merchant) {
  return new Promise((resolve, reject) => {
    getDatabase().then(db => {
      db.run(
        `INSERT OR REPLACE INTO merchants (id, name, wallet_address)
         VALUES (?, ?, ?)`,
        [merchant.id, merchant.name, merchant.wallet_address],
        function(err) {
          db.close();
          if (err) reject(err);
          else resolve(merchant);
        }
      );
    }).catch(reject);
  });
}

// Get merchant by ID
export function getMerchant(id) {
  return new Promise((resolve, reject) => {
    getDatabase().then(db => {
      db.get(
        `SELECT * FROM merchants WHERE id = ?`,
        [id],
        (err, row) => {
          db.close();
          if (err) reject(err);
          else resolve(row);
        }
      );
    }).catch(reject);
  });
}
