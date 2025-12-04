import * as web3 from 'https://cdn.jsdelivr.net/npm/@solana/web3.js@1.90.0/+esm';

// Use deployed backend URL if available; fallback to localhost for local dev
// In Vercel deployment, inject BACKEND_URL via window env or headers
const BACKEND_URL = window.BACKEND_URL || (typeof process !== 'undefined' && process.env.REACT_APP_BACKEND_URL) || 'http://localhost:3001';
const RPC_ENDPOINT = 'http://localhost:8899'; // Change for devnet/mainnet
const PROGRAM_ID = 'TapToPay111111111111111111111111111111111111';

let paymentIntent = null;
let isPolling = false;

// Extract payment_intent_id from URL
function getPaymentIntentId() {
  const path = window.location.pathname;
  const match = path.match(/\/i\/([^/]+)/);
  return match ? match[1] : null;
}

// Fetch payment intent details from backend
async function loadPaymentIntent(paymentIntentId) {
  try {
    const response = await fetch(`${BACKEND_URL}/pay/${paymentIntentId}`);
    if (!response.ok) throw new Error('Failed to load payment');
    
    paymentIntent = await response.json();
    displayPaymentDetails();
  } catch (error) {
    showError(`Failed to load payment: ${error.message}`);
  }
}

// Display payment details
function displayPaymentDetails() {
  if (!paymentIntent) return;

  document.getElementById('merchantName').textContent = 'Solana Merchant';
  document.getElementById('amount').textContent = `◎ ${(paymentIntent.amount / 1_000_000).toFixed(2)}`;
  document.getElementById('amountLabel').textContent = 'SOL';
  document.getElementById('paymentDetails').style.display = 'block';
  document.getElementById('loadingSpinner').style.display = 'none';
}

// Check if Phantom is installed
function isPhantomInstalled() {
  return window.solana && window.solana.isPhantom;
}

// Handle Pay with Phantom button
async function handlePayWithPhantom() {
  if (!paymentIntent) {
    showError('Payment intent not loaded');
    return;
  }

  if (!isPhantomInstalled()) {
    showError('Phantom wallet not detected. Please install Phantom.');
    return;
  }

  try {
    // Connect to Phantom if needed
    const response = await window.solana.connect({ onlyIfTrusted: false });
    const walletPubkey = response.publicKey;

    showStatus('Building transaction...');
    
    // Build transaction - call tap_to_pay::pay_invoice
    const connection = new web3.Connection(RPC_ENDPOINT, 'confirmed');
    const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
    const transaction = new web3.Transaction();
    transaction.recentBlockhash = recentBlockhash;
    transaction.feePayer = walletPubkey;

    // Add pay_invoice instruction
    // For now, simplified - would need full instruction building with IDL
    const instruction = createPayInvoiceInstruction(
      walletPubkey,
      paymentIntent.nonce
    );
    transaction.add(instruction);

    showStatus('Waiting for signature...');

    // Sign transaction with Phantom
    const signedTx = await window.solana.signAndSendTransaction(transaction);

    showStatus('Transaction sent, confirming...');

    // Wait for confirmation on the RPC
    await connection.confirmTransaction(signedTx.signature, 'confirmed');

    showStatus('Notifying backend...');

    // Inform backend of tx signature (idempotent confirm endpoint)
    try {
      await fetch(`${BACKEND_URL}/payment_intents/${paymentIntent.paymentIntentId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_signature: signedTx.signature }),
      });
    } catch (err) {
      console.warn('Failed to notify backend (will continue polling):', err);
    }

    showStatus('Confirming payment...');

    // Poll backend for payment confirmation
    startPolling();

  } catch (error) {
    showError(`Transaction failed: ${error.message}`);
  }
}

// Create pay_invoice instruction (simplified)
function createPayInvoiceInstruction(payer, nonce) {
  // This is a simplified version - you'd use proper Anchor IDL in production
  const programId = new web3.PublicKey(PROGRAM_ID);
  
  // Derive payment intent PDA
  const seeds = [
    Buffer.from('payment_intent'),
    Buffer.from(paymentIntent.paymentIntentId),
  ];
  const [paymentIntentPda] = web3.PublicKey.findProgramAddressSync(seeds, programId);

  return new web3.TransactionInstruction({
    programId,
    keys: [
      { pubkey: paymentIntentPda, isSigner: false, isWritable: true },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      // Discriminator (8 bytes) - would come from IDL
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
      // payment_intent_id
      Buffer.from(paymentIntent.paymentIntentId),
      // amount
      Buffer.from(new BigUint64Array([BigInt(paymentIntent.amount)])),
      // nonce (32 bytes)
      Buffer.from(nonce, 'hex').slice(0, 32),
      // bump
      Buffer.from([0]),
    ]),
  });
}

// Poll for payment confirmation
async function startPolling() {
  if (isPolling) return;
  isPolling = true;

  const paymentIntentId = paymentIntent.paymentIntentId;
  let attempts = 0;
  const maxAttempts = 120; // 2 minutes at 1s intervals

  while (isPolling && attempts < maxAttempts) {
    try {
      const response = await fetch(`${BACKEND_URL}/payment_intents/${paymentIntentId}/status`);
      if (!response.ok) throw new Error('Failed to check status');

      const status = await response.json();

      if (status.status === 'paid') {
        showSuccess(status.tx_signature);
        isPolling = false;
        break;
      }

      if (status.status === 'failed') {
        showError('Payment failed. Please try again.');
        isPolling = false;
        break;
      }

      showStatus('Confirming on blockchain...');
    } catch (error) {
      console.error('Poll error:', error);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (attempts >= maxAttempts) {
    showError('Payment confirmation timeout');
    isPolling = false;
  }
}

// UI Helpers
function showStatus(message) {
  document.getElementById('status').textContent = message;
  document.getElementById('statusContainer').style.display = 'block';
  document.getElementById('errorContainer').style.display = 'none';
}

function showError(message) {
  document.getElementById('error').textContent = message;
  document.getElementById('errorContainer').style.display = 'block';
  document.getElementById('statusContainer').style.display = 'none';
}

function showSuccess(txSignature) {
  document.getElementById('paymentDetails').style.display = 'none';
  document.getElementById('successMessage').style.display = 'block';
  document.getElementById('txLink').href = `https://explorer.solana.com/tx/${txSignature}`;
  document.getElementById('txLink').textContent = `View on Solana Explorer`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  const paymentIntentId = getPaymentIntentId();
  
  if (!paymentIntentId) {
    showError('Invalid payment URL');
    return;
  }

  // Check for Phantom
  if (!isPhantomInstalled()) {
    console.warn('Phantom not installed, but will show button for mobile deep link');
  }

  // Load payment intent
  await loadPaymentIntent(paymentIntentId);

  // Set up event listeners
  document.getElementById('payBtn').addEventListener('click', handlePayWithPhantom);
  document.getElementById('retryBtn').addEventListener('click', () => {
    location.reload();
  });
});
