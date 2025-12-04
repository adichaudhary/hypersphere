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
} from './database.js';
import {
  getConnection,
  derivePaymentIntentPDA,
  watchPaymentIntent,
  verifyTransactionSignature,
  verifyTokenTransfer,
} from './solanaListener.js';
import {
  linkMerchantToCircle,
  handlePaymentConfirmed,
  getMerchantDashboardReport,
  initializeCircleDatabase,
} from './circleIntegration.js';

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

    // Initialize Circle database tables
    await initializeCircleDatabase();
    console.log('✓ Circle database initialized');

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
    const { amount, merchant_id, currency } = req.body;

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

      // Try to use merchant wallet address as recipient if merchant exists and is linked
      try {
        const merchant = await getMerchant(merchant_id);
        if (merchant && merchant.wallet_address) {
          recipient_address = merchant.wallet_address;
        }
      } catch (e) {
        console.warn('Could not fetch merchant for recipient assignment', e);
      }
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
    };

    // Save to database
    const saved = await savePaymentIntent(paymentIntent);

    // Start watching for payment confirmation on Solana
    setupPaymentWatcher(id, merchant_id);

    // Return saved row (includes timestamps)
    res.status(201).json(sanitizeObject(saved));
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

    res.json(sanitizeObject({
      id: paymentIntent.id,
      status: paymentIntent.status || 'pending',
      tx_signature: paymentIntent.tx_signature || null,
      amount: paymentIntent.amount,
      merchant_id: paymentIntent.merchant_id,
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
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * POST /merchants/:id/circle/link
 * Link merchant to Circle account
 */
app.post('/merchants/:id/circle/link', async (req, res) => {
  try {
    const { id: merchantId } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: 'Missing required fields: name, email',
      });
    }

    const result = await linkMerchantToCircle(merchantId, name, email);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error linking merchant to Circle:', error);
    res.status(500).json({ error: 'Failed to link merchant to Circle' });
  }
});

/**
 * GET /merchants/:id/dashboard/report
 * Get merchant dashboard report with volume and transaction data
 */
app.get('/merchants/:id/dashboard/report', async (req, res) => {
  try {
    const { id: merchantId } = req.params;

    const report = await getMerchantDashboardReport(merchantId);
    res.json(report);
  } catch (error) {
    console.error('Error getting merchant report:', error);
    res.status(500).json({ error: 'Failed to get merchant report' });
  }
});

/**
 * GET /merchants/:id/dashboard
 * Alternative endpoint name for merchant dashboard
 */
app.get('/merchants/:id/dashboard', async (req, res) => {
  try {
    const { id: merchantId } = req.params;

    const report = await getMerchantDashboardReport(merchantId);
    res.json(report);
  } catch (error) {
    console.error('Error getting merchant dashboard:', error);
    res.status(500).json({ error: 'Failed to get merchant dashboard' });
  }
});

/**
 * Setup payment watcher for a specific payment intent
 */
function setupPaymentWatcher(paymentIntentId, merchantId) {
  try {
    // Check if already watching
    if (activeWatchers.has(paymentIntentId)) {
      return;
    }

    // Start watching the Solana account
    const unsubscribe = watchPaymentIntent(paymentIntentId, async (update) => {
      console.log(`Payment update for ${paymentIntentId}:`, update);

      // If status changed to paid, update database
      if (update.status === 'paid' || update.status === 1) {
        try {
          await updatePaymentIntentStatus(
            paymentIntentId,
            'paid',
            update.tx_signature
          );
          console.log(`✓ Payment confirmed: ${paymentIntentId}`);

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
