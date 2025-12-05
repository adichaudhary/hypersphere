import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4, validate as validateUUID } from 'uuid';
import crypto from 'crypto';
import {
  savePaymentIntent,
  getPaymentIntent,
  getMerchant,
  updatePaymentIntentStatus,
  getMerchantPayments,
  initializeDatabase,
  getDatabase,
  updateMerchantSettings,
  saveMerchant,
} from './database.js';
import {
  getConnection,
  derivePaymentIntentPDA,
  watchPaymentIntent,
  verifyTransactionSignature,
  verifyTokenTransfer,
  getPaymentIntentFromSolana,
} from './solanaListener.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Middleware
app.use(cors());
app.use(express.json());

// Map to track active watchers
const activeWatchers = new Map();

/**
 * Initialize the application
 */
async function initialize() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✓ Database initialized');

    // Core payment system initialized

    // Verify Solana connection
    const connection = getConnection();
    const version = await connection.getVersion();
    console.log('✓ Connected to Solana:', version['solana-core']);
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
}

/**
 * POST /payment_intents
 * Create a new payment intent
 * 
 * Body: { amount, merchant_id }
 * Returns: { id, amount, merchant_id, nonce, payment_url }
 */
app.post('/payment_intents', async (req, res) => {
  try {
    const { amount, merchant_id, currency, tip_amount, chain } = req.body;

    // Validate input
    if (amount === undefined || merchant_id === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: amount, merchant_id',
      });
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be a positive number',
      });
    }

    // Basic merchant id format check
    if (typeof merchant_id !== 'string' || merchant_id.length === 0) {
      return res.status(400).json({ error: 'merchant_id must be a non-empty string' });
    }

    // Generate unique ID
    const id = uuidv4();

    // Generate random nonce (32 bytes)
    const nonce = crypto.randomBytes(32).toString('hex');

    // Generate payment URL
    const payment_url = `${BASE_URL}/pay/${id}`;

    // Prepare token metadata (for USDC payments)
    let token_mint = null;
    let token_decimals = 6;
    let recipient_address = null;

    if (currency && String(currency).toUpperCase() === 'USDC') {
      // Use configured USDC mint unless provided by merchant/client later
      token_mint = process.env.USDC_MINT || null;
      token_decimals = process.env.USDC_DECIMALS ? parseInt(process.env.USDC_DECIMALS, 10) : 6;

      // Get chain-specific wallet address from merchant settings
      try {
        const merchant = await getMerchant(merchant_id);
        if (merchant) {
          // Determine which wallet address to use based on chain
          const chainUpper = chain ? String(chain).toUpperCase() : 'SOL';
          if (chainUpper === 'SOL' || chainUpper === 'SOLANA') {
            recipient_address = merchant.solana_address || merchant.wallet_address || null;
          } else if (chainUpper === 'ETH' || chainUpper === 'ETHEREUM') {
            recipient_address = merchant.ethereum_address || null;
          } else if (chainUpper === 'BASE') {
            recipient_address = merchant.base_address || null;
          } else {
            // Fallback to default wallet address
            recipient_address = merchant.wallet_address || null;
          }
        }
      } catch (e) {
        console.warn('Could not fetch merchant for recipient assignment', e);
      }
    }

    // Normalize chain value - ensure consistency (use SOL, not Solana)
    let normalizedChain = chain || 'SOL';
    const chainUpper = normalizedChain.toUpperCase();
    // Normalize "Solana" to "SOL" for consistency
    if (chainUpper === 'SOLANA') {
      normalizedChain = 'SOL';
    } else if (chainUpper === 'SOL') {
      normalizedChain = 'SOL';
    }

    // Create payment intent object
    const paymentIntent = {
      id,
      amount,
      merchant_id,
      nonce,
      payment_url,
      currency: currency ? String(currency).toUpperCase() : 'SOL',
      token_mint,
      recipient_address,
      token_decimals,
      tip_amount: tip_amount || 0,
      chain: normalizedChain,
    };

    // Save to database
    const saved = await savePaymentIntent(paymentIntent);

    // Derive PDA for on-chain account
    let pdaAddress = null;
    let bumpValue = null;
    try {
      const { derivePaymentIntentPDA } = await import('./solanaListener.js');
      const { pda, bump } = derivePaymentIntentPDA(id);
      pdaAddress = pda.toBase58();
      bumpValue = bump;
      console.log(`✓ Derived PDA for ${id}: ${pdaAddress}, bump: ${bump}`);
    } catch (error) {
      console.error('✗ Error deriving PDA:', error.message);
      console.error('  Stack:', error.stack);
      // Continue without PDA - account can be created later
    }

    // Start watching for payment confirmation on Solana (non-blocking)
    setupPaymentWatcher(id, merchant_id).catch(error => {
      console.error('Error setting up payment watcher:', error);
      // Continue anyway - watcher is not critical for payment intent creation
    });

    // Return saved row (includes timestamps) and PDA info for on-chain account creation
    res.status(201).json(sanitizeObject({
      ...saved,
      pda: pdaAddress,
      bump: bumpValue,
      // Note: The PaymentIntent account should be created on-chain by calling
      // the create_payment_intent instruction with the merchant's wallet
    }));
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

/**
 * GET /payment_intents/:id/status
 * Get payment intent status
 * 
 * Returns: { id, status, tx_signature, amount, merchant_id, created_at, updated_at }
 */
app.get('/payment_intents/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    // Get from database
    const paymentIntent = await getPaymentIntent(id);

    if (!paymentIntent) {
      return res.status(404).json({
        error: 'Payment intent not found',
      });
    }

    // Also check on-chain status if available
    let onChainData = null;
    try {
      onChainData = await getPaymentIntentFromSolana(id);
    } catch (err) {
      // On-chain account may not exist yet, that's okay
      console.debug(`On-chain account not found for ${id}:`, err.message);
    }

    // Prefer on-chain status if available, otherwise use database
    const status = onChainData?.status || paymentIntent.status || 'confirmed';
    const tx_signature = onChainData?.tx_signature || paymentIntent.tx_signature || null;

    res.json(sanitizeObject({
      id: paymentIntent.id,
      status,
      tx_signature,
      amount: paymentIntent.amount,
      merchant_id: paymentIntent.merchant_id,
      tip_amount: paymentIntent.tip_amount || 0,
      chain: paymentIntent.chain || 'SOL',
      on_chain: onChainData !== null,
      pda: onChainData?.pda || null,
      currency: paymentIntent.currency || 'SOL',
      created_at: paymentIntent.created_at,
      updated_at: paymentIntent.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching payment intent status:', error);
    res.status(500).json({ error: 'Failed to fetch payment intent' });
  }
});


/**
 * POST /payment_intents/:id/confirm
 * Accepts { tx_signature }
 * Verifies transaction on Solana and updates PaymentIntent status
 */
app.post('/payment_intents/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { tx_signature } = req.body;

    if (!tx_signature || typeof tx_signature !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid tx_signature' });
    }

    // Ensure payment intent exists
    const pi = await getPaymentIntent(id);
    if (!pi) return res.status(404).json({ error: 'Payment intent not found' });

    // Verify transaction on Solana
    let txInfo = null;
    if (pi.currency && String(pi.currency).toUpperCase() === 'USDC' && pi.token_mint && pi.recipient_address) {
      // For token payments, expect amount to be in smallest units already
      txInfo = await verifyTokenTransfer(tx_signature, pi.token_mint, pi.recipient_address, pi.amount);
    } else {
      txInfo = await verifyTransactionSignature(tx_signature);
    }

    if (!txInfo || txInfo.status === 'failed' || !txInfo.confirmed) {
      return res.status(400).json({ error: 'Transaction not confirmed on Solana yet' });
    }

    // Atomically update status to paid (idempotent)
    const updated = await updatePaymentIntentStatus(id, 'paid', tx_signature);

    res.json({ success: true, payment_intent: updated });
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    res.status(500).json({ error: 'Failed to confirm payment intent' });
  }
});

/**
 * GET /merchants/:id/payments
 * Get all payments for a merchant (dashboard)
 * 
 * Returns: [ { id, amount, status, created_at, tx_signature }, ... ]
 */
app.get('/merchants/:id/payments', async (req, res) => {
  try {
    const { id: merchant_id } = req.params;

    // Get all payments for merchant
    const payments = await getMerchantPayments(merchant_id);

    res.json(sanitizeObject({
      merchant_id,
      total_count: payments.length,
      payments: payments.map(p => sanitizeObject({
        id: p.id,
        amount: p.amount,
        status: p.status,
        tip_amount: p.tip_amount || 0,
        chain: p.chain || 'SOL',
        currency: p.currency || 'SOL',
        created_at: p.created_at,
        updated_at: p.updated_at,
        tx_signature: p.tx_signature,
      })),
    }));
  } catch (error) {
    console.error('Error fetching merchant payments:', error);
    res.status(500).json({ error: 'Failed to fetch merchant payments' });
  }
});

/**
 * GET /pay/:id
 * Payment page redirect (can be extended with UI)
 */
app.get('/pay/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const paymentIntent = await getPaymentIntent(id);

    if (!paymentIntent) {
      return res.status(404).json({ error: 'Payment intent not found' });
    }

    // Return payment intent details for frontend integration, including token metadata
    res.json(sanitizeObject({
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      nonce: paymentIntent.nonce,
      merchant_id: paymentIntent.merchant_id,
      currency: paymentIntent.currency || 'SOL',
      token_mint: paymentIntent.token_mint || null,
      token_decimals: paymentIntent.token_decimals || 6,
      recipient_address: paymentIntent.recipient_address || null,
      programId: process.env.PROGRAM_ID || 'TapToPay111111111111111111111111111111111111',
    }));
  } catch (error) {
    console.error('Error fetching payment page:', error);
    res.status(500).json({ error: 'Failed to load payment page' });
  }
});

/**
 * DELETE /merchants/:id/payments
 * Delete all payments for a merchant (for testing/cleanup)
 */
app.delete('/merchants/:id/payments', async (req, res) => {
  try {
    const { id: merchant_id } = req.params;
    
    // Get database connection
    const db = await getDatabase();
    
    db.run('DELETE FROM payment_intents WHERE merchant_id = ?', [merchant_id], function(err) {
      db.close();
      if (err) {
        console.error('Error deleting payments:', err);
        return res.status(500).json({ error: 'Failed to delete payments' });
      }
      res.json({ 
        success: true, 
        deleted_count: this.changes,
        merchant_id 
      });
    });
  } catch (error) {
    console.error('Error deleting payments:', error);
    res.status(500).json({ error: 'Failed to delete payments' });
  }
});

/**
 * POST /merchants/:id/payments/mark-paid
 * Mark all pending payments as paid (for testing purposes)
 */
app.post('/merchants/:id/payments/mark-paid', async (req, res) => {
  try {
    const { id: merchant_id } = req.params;
    
    // Get database connection
    const db = await getDatabase();
    
    // Generate mock transaction signatures for payments that don't have one
    db.all(
      `SELECT id FROM payment_intents WHERE merchant_id = ? AND status != 'paid'`,
      [merchant_id],
      (err, rows) => {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Failed to fetch payments' });
        }

        if (rows.length === 0) {
          db.close();
          return res.json({ 
            success: true, 
            updated_count: 0,
            message: 'No pending payments to update'
          });
        }

        let completed = 0;
        const errors = [];

        rows.forEach((row) => {
          const txSignature = crypto.randomBytes(44).toString('base64').replace(/[+/=]/g, '').substring(0, 88);
          
          db.run(
            `UPDATE payment_intents 
             SET status = 'paid', 
                 tx_signature = COALESCE(tx_signature, ?),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status != 'paid'`,
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
                res.json({ 
                  success: true, 
                  updated_count: completed,
                  total_pending: rows.length,
                  errors: errors.length > 0 ? errors : undefined
                });
              }
            }
          );
        });
      }
    );
  } catch (error) {
    console.error('Error marking payments as paid:', error);
    res.status(500).json({ error: 'Failed to mark payments as paid' });
  }
});

/**
 * GET /merchants/:id/settings
 * Get merchant settings/profile
 */
app.get('/merchants/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    const merchant = await getMerchant(id);
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json(sanitizeObject({
      id: merchant.id,
      name: merchant.name || '',
      email: merchant.email || '',
      business_type: merchant.business_type || '',
      wallet_address: merchant.wallet_address || '',
      solana_address: merchant.solana_address || merchant.wallet_address || '',
      base_address: merchant.base_address || '',
      ethereum_address: merchant.ethereum_address || '',
    }));
  } catch (error) {
    console.error('Error fetching merchant settings:', error);
    res.status(500).json({ error: 'Failed to fetch merchant settings' });
  }
});

/**
 * PUT /merchants/:id/settings
 * Update merchant settings/profile
 */
app.put('/merchants/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, business_type, solana_address, base_address, ethereum_address } = req.body;

    console.log('Updating merchant settings:', { id, name, email, business_type, solana_address, base_address, ethereum_address });

    // Ensure merchant exists
    let merchant = await getMerchant(id);
    if (!merchant) {
      console.log('Merchant does not exist, creating new merchant');
      // Create merchant if doesn't exist
      merchant = {
        id,
        name: name || 'Merchant',
        wallet_address: solana_address || id, // Use solana_address as default wallet_address
        email: email || null,
        business_type: business_type || null,
        solana_address: solana_address || null,
        base_address: base_address || null,
        ethereum_address: ethereum_address || null,
      };
      await saveMerchant(merchant);
      console.log('Merchant created successfully');
      
      // Return the created merchant
      const createdMerchant = await getMerchant(id);
      return res.json(sanitizeObject({
        success: true,
        merchant: createdMerchant,
      }));
    } else {
      console.log('Merchant exists, updating settings');
      // Update settings
      const updated = await updateMerchantSettings(id, {
        name,
        email,
        business_type,
        solana_address,
        base_address,
        ethereum_address,
      });

      console.log('Merchant settings updated successfully');
      return res.json(sanitizeObject({
        success: true,
        merchant: updated,
      }));
    }
  } catch (error) {
    console.error('Error updating merchant settings:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: `Failed to update merchant settings: ${error.message}` });
  }
});

/**
 * GET /merchants/:id/wallet/:chain
 * Get wallet address for a specific chain
 */
app.get('/merchants/:id/wallet/:chain', async (req, res) => {
  try {
    const { id, chain } = req.params;
    const merchant = await getMerchant(id);
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Map chain names to database fields
    const chainMap = {
      'SOL': 'solana_address',
      'Solana': 'solana_address',
      'ETH': 'ethereum_address',
      'Ethereum': 'ethereum_address',
      'BASE': 'base_address',
      'Base': 'base_address',
    };

    const chainField = chainMap[chain] || 'solana_address';
    const walletAddress = merchant[chainField] || merchant.wallet_address || '';

    res.json({
      merchant_id: id,
      chain: chain,
      wallet_address: walletAddress,
    });
  } catch (error) {
    console.error('Error fetching wallet address:', error);
    res.status(500).json({ error: 'Failed to fetch wallet address' });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});


/**
 * Setup payment watcher for a specific payment intent
 */
async function setupPaymentWatcher(paymentIntentId, merchantId) {
  try {
    // Check if already watching
    if (activeWatchers.has(paymentIntentId)) {
      return;
    }

    // Start watching the Solana account
    const unsubscribe = await watchPaymentIntent(paymentIntentId, async (update) => {
      console.log(`Payment update for ${paymentIntentId}:`, update);

      // If status changed to paid, update database
      if (update.status === 'paid' || update.status === 1) {
        try {
          await updatePaymentIntentStatus(
            paymentIntentId,
            'paid',
            update.tx_signature || ''
          );
          console.log(`✓ Payment confirmed on-chain: ${paymentIntentId}`);

          // Stop watching after payment confirmed
          if (unsubscribe) {
            unsubscribe();
            activeWatchers.delete(paymentIntentId);
          }
        } catch (error) {
          console.error('Error updating payment status:', error);
        }
      }
    });

    if (unsubscribe) {
      activeWatchers.set(paymentIntentId, unsubscribe);

      // Auto-cleanup after 24 hours (even if not paid)
      setTimeout(() => {
        if (activeWatchers.has(paymentIntentId)) {
          unsubscribe();
          activeWatchers.delete(paymentIntentId);
          console.log(`✓ Stopped watching payment: ${paymentIntentId}`);
        }
      }, 24 * 60 * 60 * 1000);
    }
  } catch (error) {
    console.error('Error setting up payment watcher:', error);
  }
}

// Basic sanitization helpers to avoid reflected XSS in returned JSON
function sanitizeString(s) {
  if (s === null || s === undefined) return s;
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    out[k] = typeof v === 'string' ? sanitizeString(v) : v;
  }
  return out;
}

/**
 * Cleanup function
 */
function cleanup() {
  console.log('Cleaning up active watchers...');
  activeWatchers.forEach((unsubscribe, paymentIntentId) => {
    try {
      if (unsubscribe) {
        unsubscribe();
      }
      console.log(`✓ Stopped watching: ${paymentIntentId}`);
    } catch (error) {
      console.error(`Error stopping watcher for ${paymentIntentId}:`, error);
    }
  });
  activeWatchers.clear();
}

// Start server
async function start() {
  try {
    await initialize();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
      console.log('Endpoints:');
      console.log('  POST   /payment_intents');
      console.log('  GET    /payment_intents/:id/status');
      console.log('  GET    /merchants/:id/payments');
      console.log('  GET    /health\n');
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down gracefully...');
      cleanup();
      server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
