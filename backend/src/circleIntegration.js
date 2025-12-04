import {
  updatePaymentIntentStatus,
  getPaymentIntent,
  saveMerchant,
  getMerchant,
  getDatabase,
} from './database.js';
import CircleClient from './circle.js';

const circleClient = new CircleClient();

/**
 * Link merchant to Circle account
 * Creates a Circle wallet for the merchant
 */
export async function linkMerchantToCircle(merchantId, merchantName, email) {
  try {
    // Create Circle account
    const circleAccount = await circleClient.createMerchantAccount(
      merchantId,
      merchantName,
      email
    );

    // Save merchant with Circle info
    await saveMerchant({
      id: merchantId,
      name: merchantName,
      wallet_address: circleAccount.address,
      circle_wallet_id: circleAccount.walletId,
    });

    return {
      merchantId,
      circleWalletId: circleAccount.walletId,
      circleAddress: circleAccount.address,
      linked: true,
    };
  } catch (error) {
    console.error('Error linking merchant to Circle:', error);
    throw error;
  }
}

/**
 * On payment confirmation, optionally sweep USDC to Circle
 */
export async function handlePaymentConfirmed(paymentId, merchantId, amount) {
  try {
    // Get merchant Circle wallet info
    const merchant = await getMerchant(merchantId);

    if (!merchant || !merchant.circle_wallet_id) {
      console.warn(`Merchant ${merchantId} not linked to Circle`);
      return null;
    }

    // In a real scenario, we would:
    // 1. Verify USDC was received on Solana
    // 2. Sweep it to Circle wallet
    // For now, just log the action

    console.log(`Payment confirmed for merchant ${merchantId}: ${amount} lamports`);
    console.log(`Circle Wallet ID: ${merchant.circle_wallet_id}`);

    // Record in database that sweep was initiated
    const db = await getDatabase();
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO circle_transactions (merchant_id, payment_id, amount, status, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [merchantId, paymentId, amount, 'pending'],
        function(err) {
          db.close();
          if (err) reject(err);
          else resolve({
            transactionId: this.lastID,
            status: 'pending',
            amount,
          });
        }
      );
    });
  } catch (error) {
    console.error('Error handling payment confirmation for Circle:', error);
    throw error;
  }
}

/**
 * Get merchant dashboard report
 */
export async function getMerchantDashboardReport(merchantId) {
  try {
    // Get merchant
    const merchant = await getMerchant(merchantId);

    if (!merchant || !merchant.circle_wallet_id) {
      return {
        merchantId,
        error: 'Merchant not linked to Circle',
        linked: false,
      };
    }

    // Get Circle report
    const report = await circleClient.getMerchantReport(merchant.circle_wallet_id);

    // Get transactions from our database
    const db = await getDatabase();
    const transactions = await new Promise((resolve, reject) => {
      db.all(
        `SELECT pi.id, pi.amount, pi.status, pi.created_at, pi.tx_signature
         FROM payment_intents pi
         WHERE pi.merchant_id = ?
         ORDER BY pi.created_at DESC`,
        [merchantId],
        (err, rows) => {
          db.close();
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Calculate fiat equivalent (assuming $1 SOL for example, would use real rates)
    const fiatEquivalent = calculateFiatEquivalent(transactions);

    return {
      merchantId,
      merchantName: merchant.name,
      linked: true,
      circleWalletId: merchant.circle_wallet_id,
      currentBalance: report.currentBalance,
      totalVolume: report.totalVolume,
      totalVolumeUsd: fiatEquivalent,
      transactionCount: transactions.length,
      transactions: transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        status: t.status,
        timestamp: t.created_at,
        txSignature: t.tx_signature,
      })),
      circleTransactions: report.transactions,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting merchant report:', error);
    throw error;
  }
}

/**
 * Calculate fiat equivalent of SOL amounts
 */
function calculateFiatEquivalent(transactions) {
  // In production, would fetch real SOL price from oracle
  const SOL_USD_RATE = parseFloat(process.env.SOL_USD_RATE || '180'); // $180 per SOL
  
  return transactions.reduce((total, tx) => {
    const solAmount = tx.amount / 1_000_000; // Convert lamports to SOL
    return total + (solAmount * SOL_USD_RATE);
  }, 0);
}

/**
 * Initialize Circle database tables
 */
export async function initializeCircleDatabase() {
  return new Promise((resolve, reject) => {
    getDatabase().then(db => {
      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS circle_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            merchant_id TEXT NOT NULL,
            payment_id TEXT NOT NULL,
            amount INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            circle_transfer_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(merchant_id) REFERENCES merchants(id)
          )
        `, (err) => {
          if (err) reject(err);
          else {
            // Add circle_wallet_id to merchants if not exists
            db.all(`
              PRAGMA table_info(merchants)
            `, (err, info) => {
              if (!info || !info.some(col => col.name === 'circle_wallet_id')) {
                db.run(`
                  ALTER TABLE merchants ADD COLUMN circle_wallet_id TEXT
                `, (err) => {
                  db.close();
                  if (err) reject(err);
                  else resolve();
                });
              } else {
                db.close();
                resolve();
              }
            });
          }
        });
      });
    }).catch(reject);
  });
}

export default {
  linkMerchantToCircle,
  handlePaymentConfirmed,
  getMerchantDashboardReport,
  initializeCircleDatabase,
};
