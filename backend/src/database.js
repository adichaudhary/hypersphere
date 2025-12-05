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
                    status TEXT DEFAULT 'confirmed',
                    tx_signature TEXT,
                    currency TEXT DEFAULT 'SOL',
                    token_mint TEXT,
                    recipient_address TEXT,
                    token_decimals INTEGER DEFAULT 6,
                    tip_amount REAL DEFAULT 0,
                    chain TEXT DEFAULT 'SOL',
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
              email TEXT,
              business_type TEXT,
              solana_address TEXT,
              base_address TEXT,
              ethereum_address TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
              const migrations = [];
              
              // Check payment_intents table
              db.all(`PRAGMA table_info(payment_intents)`, (err2, info) => {
                if (err2) {
                  db.close();
                  return reject(err2);
                }

                const existing = (info || []).map(c => c.name);
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
                if (!existing.includes('tip_amount')) {
                  migrations.push(`ALTER TABLE payment_intents ADD COLUMN tip_amount REAL DEFAULT 0`);
                }
                if (!existing.includes('chain')) {
                  migrations.push(`ALTER TABLE payment_intents ADD COLUMN chain TEXT DEFAULT 'SOL'`);
                }

                // Check merchants table
                db.all(`PRAGMA table_info(merchants)`, (err3, merchantInfo) => {
                  if (err3) {
                    db.close();
                    return reject(err3);
                  }
                  const merchantExisting = (merchantInfo || []).map(c => c.name);
                  if (!merchantExisting.includes('email')) {
                    migrations.push(`ALTER TABLE merchants ADD COLUMN email TEXT`);
                  }
                  if (!merchantExisting.includes('business_type')) {
                    migrations.push(`ALTER TABLE merchants ADD COLUMN business_type TEXT`);
                  }
                  if (!merchantExisting.includes('solana_address')) {
                    migrations.push(`ALTER TABLE merchants ADD COLUMN solana_address TEXT`);
                  }
                  if (!merchantExisting.includes('base_address')) {
                    migrations.push(`ALTER TABLE merchants ADD COLUMN base_address TEXT`);
                  }
                  if (!merchantExisting.includes('ethereum_address')) {
                    migrations.push(`ALTER TABLE merchants ADD COLUMN ethereum_address TEXT`);
                  }
                  if (!merchantExisting.includes('updated_at')) {
                    migrations.push(`ALTER TABLE merchants ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
                  }

                  // Run all migrations
                  const runNext = () => {
                    const sql = migrations.shift();
                    if (!sql) {
                      db.close();
                      return resolve(db);
                    }
                    db.run(sql, (err4) => {
                      if (err4) {
                        db.close();
                        return reject(err4);
                      }
                      runNext();
                    });
                  };

                  runNext();
                });
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
        `INSERT INTO payment_intents (id, amount, merchant_id, nonce, payment_url, status, currency, token_mint, recipient_address, token_decimals, tip_amount, chain)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentIntent.id,
          paymentIntent.amount,
          paymentIntent.merchant_id,
          paymentIntent.nonce,
          paymentIntent.payment_url,
          'confirmed',
          paymentIntent.currency || 'SOL',
          paymentIntent.token_mint || null,
          paymentIntent.recipient_address || null,
          typeof paymentIntent.token_decimals === 'number' ? paymentIntent.token_decimals : 6,
          paymentIntent.tip_amount || 0,
          // Normalize chain: ensure "Solana" becomes "SOL" for consistency
          (paymentIntent.chain && paymentIntent.chain.toUpperCase() === 'SOLANA') ? 'SOL' : (paymentIntent.chain || 'SOL'),
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
      // Ensure wallet_address is set (required field)
      const walletAddress = merchant.wallet_address || merchant.solana_address || merchant.id;
      
      db.run(
        `INSERT OR REPLACE INTO merchants (id, name, wallet_address, email, business_type, solana_address, base_address, ethereum_address, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          merchant.id, 
          merchant.name || 'Merchant', 
          walletAddress,
          merchant.email || null,
          merchant.business_type || null,
          merchant.solana_address || null,
          merchant.base_address || null,
          merchant.ethereum_address || null,
        ],
        function(err) {
          if (err) {
            db.close();
            console.error('Error saving merchant:', err);
            return reject(err);
          }
          // Fetch the updated row
          db.get(`SELECT * FROM merchants WHERE id = ?`, [merchant.id], (err2, row) => {
            db.close();
            if (err2) {
              console.error('Error fetching saved merchant:', err2);
              return reject(err2);
            }
            resolve(row || merchant);
          });
        }
      );
    }).catch(err => {
      console.error('Error in saveMerchant:', err);
      reject(err);
    });
  });
}

// Update merchant settings
export function updateMerchantSettings(merchantId, settings) {
  return new Promise((resolve, reject) => {
    getDatabase().then(db => {
      const updates = [];
      const values = [];
      
      // Allow empty strings, only skip if truly undefined
      if (settings.name !== undefined && settings.name !== null) {
        updates.push('name = ?');
        values.push(settings.name);
      }
      if (settings.email !== undefined && settings.email !== null) {
        updates.push('email = ?');
        values.push(settings.email);
      }
      if (settings.business_type !== undefined && settings.business_type !== null) {
        updates.push('business_type = ?');
        values.push(settings.business_type);
      }
      if (settings.solana_address !== undefined && settings.solana_address !== null) {
        updates.push('solana_address = ?');
        values.push(settings.solana_address);
      }
      if (settings.base_address !== undefined && settings.base_address !== null) {
        updates.push('base_address = ?');
        values.push(settings.base_address);
      }
      if (settings.ethereum_address !== undefined && settings.ethereum_address !== null) {
        updates.push('ethereum_address = ?');
        values.push(settings.ethereum_address);
      }
      
      if (updates.length === 0) {
        db.close();
        return resolve({});
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(merchantId);
      
      db.run(
        `UPDATE merchants SET ${updates.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            db.close();
            console.error('Error updating merchant settings:', err);
            return reject(err);
          }
          // Fetch the updated row
          db.get(`SELECT * FROM merchants WHERE id = ?`, [merchantId], (err2, row) => {
            db.close();
            if (err2) {
              console.error('Error fetching updated merchant:', err2);
              return reject(err2);
            }
            resolve(row || {});
          });
        }
      );
    }).catch(err => {
      console.error('Error in updateMerchantSettings:', err);
      reject(err);
    });
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
