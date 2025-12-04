import crypto from 'crypto';
import { Connection, PublicKey } from '@solana/web3.js';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || '11111111111111111111111111111112');

let connection = null;

export function getConnection() {
  if (!connection) {
    connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  }
  return connection;
}

/**
 * Derives the PDA for a PaymentIntent
 */
export function derivePaymentIntentPDA(paymentIntentId) {
  const hash = crypto.createHash('sha256');
  hash.update(paymentIntentId);
  const hashedId = hash.digest();

  const seeds = [Buffer.from('payment_intent'), hashedId];
  const [pda, bump] = PublicKey.findProgramAddressSync(seeds, PROGRAM_ID);
  return { pda, bump };
}

/**
 * Fetches PaymentIntent account from Solana (placeholder implementation)
 */
export async function getPaymentIntentFromSolana(paymentIntentId) {
  try {
    const { pda } = derivePaymentIntentPDA(paymentIntentId);
    const conn = getConnection();
    const accountInfo = await conn.getAccountInfo(pda);

    if (!accountInfo) return null;

    // In a production implementation we would decode account data here.
    return {
      pda: pda.toBase58(),
      amount: '0',
      nonce: Buffer.alloc(32),
      status: 'unknown',
      merchant: null,
      payment_intent_id: paymentIntentId,
      tx_signature: '',
    };
  } catch (err) {
    console.error('Error fetching PaymentIntent from Solana:', err);
    return null;
  }
}

/**
 * Periodic listener / poller (simple placeholder)
 */
export async function subscribeToPaymentIntents(onPaymentConfirmed) {
  const conn = getConnection();
  console.log('Starting Solana payment listener (polling)...');

  const interval = setInterval(async () => {
    try {
      // No-op placeholder. Real implementation would query program accounts or use webhooks.
    } catch (err) {
      console.error('Error in Solana listener:', err);
    }
  }, 5000);

  return () => clearInterval(interval);
}

/**
 * Verifies a transaction signature and (optionally) checks for a token transfer to expectedRecipient
 *
 * Parameters:
 *  - txSignature: string
 *  - expectedRecipient: base58 pubkey string (owner of token account expected to receive tokens)
  export async function verifyTokenTransfer(txSignature, expectedMint, expectedRecipientOwner, expectedAmount) {
    try {
      const conn = getConnection();
      const tx = await conn.getTransaction(txSignature, { maxSupportedTransactionVersion: 0 });
      if (!tx || tx.meta?.err) return null;

      const pre = tx.meta.preTokenBalances || [];
      const post = tx.meta.postTokenBalances || [];

      // expectedAmount is a number/string representing smallest units
      const expectedBig = BigInt(expectedAmount || 0);

      // Find any post balance entry matching the mint and recipient owner
      for (const p of post) {
        if (!p.mint) continue;
        if (p.mint !== expectedMint) continue;

        // owner may be available on the post entry
        const owner = p.owner || null;
        if (!owner) continue;

        // Only consider entries where owner matches expectedRecipientOwner
        if (expectedRecipientOwner && owner !== expectedRecipientOwner) continue;

        // Find corresponding pre balance by accountIndex where possible
        const preEntry = pre.find(x => x.accountIndex === p.accountIndex) || {};

        const before = BigInt(preEntry?.uiTokenAmount?.amount || '0');
        const after = BigInt(p?.uiTokenAmount?.amount || '0');
        const delta = after - before;

        if (delta >= expectedBig && delta > 0n) {
          return {
            confirmed: tx.blockTime !== null,
            blockTime: tx.blockTime,
            slot: tx.slot,
            status: 'confirmed',
            token: { mint: expectedMint, recipient: owner, amount: delta.toString() },
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error verifying token transfer:', error);
      return null;
    }
 *  - expectedAmount: integer in smallest token units (e.g., for USDC with 6 decimals)
 *  - opts: { tokenMint: string (base58) }
 */
export async function verifyTransactionSignature(txSignature, expectedRecipient = null, expectedAmount = 0, opts = {}) {
  try {
    const conn = getConnection();
    const tx = await conn.getTransaction(txSignature, { commitment: 'confirmed' });
    if (!tx) return null;

    // If tokenMint provided, inspect token balance diffs
    if (opts.tokenMint) {
      const mint = opts.tokenMint.toString ? opts.tokenMint.toString() : opts.tokenMint;
      const pre = tx.meta && tx.meta.preTokenBalances ? tx.meta.preTokenBalances : [];
      const post = tx.meta && tx.meta.postTokenBalances ? tx.meta.postTokenBalances : [];

      // Find post balances that match mint and owner
      const matches = (post || []).filter(p => {
        try {
          return p.mint === mint && p.owner === expectedRecipient;
        } catch (e) {
          return false;
        }
      });

      let totalReceived = 0n;
      for (const m of matches) {
        const amt = BigInt(m.uiTokenAmount.amount || '0');
        const preMatch = (pre || []).find(p => p.accountIndex === m.accountIndex && p.mint === m.mint);
        const preAmt = preMatch ? BigInt(preMatch.uiTokenAmount.amount || '0') : 0n;
        if (amt > preAmt) totalReceived += (amt - preAmt);
      }

      const expected = BigInt(expectedAmount || 0);
      const success = (totalReceived >= expected) && tx.meta && tx.meta.err === null;

      return {
        confirmed: tx.blockTime !== null,
        blockTime: tx.blockTime,
        slot: tx.slot,
        status: success ? 'confirmed' : (tx.meta?.err ? 'failed' : 'pending'),
        tokenReceived: totalReceived.toString(),
      };
    }

    // Fallback: return basic tx status
    return {
      confirmed: tx.blockTime !== null,
      blockTime: tx.blockTime,
      slot: tx.slot,
      status: tx.meta?.err ? 'failed' : 'confirmed',
    };
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return null;
  }
}

/**
 * Verify a token transfer by inspecting pre/post token balances for a given transaction.
 * Returns an object with details if a matching transfer is found, otherwise null.
 */
export async function verifyTokenTransfer(txSignature, expectedMint, expectedRecipientOwner, expectedAmount) {
  try {
    const conn = getConnection();
    const tx = await conn.getTransaction(txSignature, { maxSupportedTransactionVersion: 0 });
    if (!tx || tx.meta?.err) return null;

    const pre = tx.meta.preTokenBalances || [];
    const post = tx.meta.postTokenBalances || [];

    const expectedBig = BigInt(expectedAmount || 0);

    for (const p of post) {
      if (!p.mint) continue;
      if (p.mint !== expectedMint) continue;

      const owner = p.owner || null;
      if (!owner) continue;
      if (expectedRecipientOwner && owner !== expectedRecipientOwner) continue;

      const preEntry = pre.find(x => x.accountIndex === p.accountIndex) || {};

      const before = BigInt(preEntry?.uiTokenAmount?.amount || '0');
      const after = BigInt(p?.uiTokenAmount?.amount || '0');
      const delta = after - before;

      if (delta >= expectedBig && delta > 0n) {
        return {
          confirmed: tx.blockTime !== null,
          blockTime: tx.blockTime,
          slot: tx.slot,
          status: 'confirmed',
          token: { mint: expectedMint, recipient: owner, amount: delta.toString() },
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error verifying token transfer:', error);
    return null;
  }
}

/**
 * Watch a PaymentIntent PDA for changes (subscribe to account change)
 */
export async function watchPaymentIntent(paymentIntentId, callback) {
  const { pda } = derivePaymentIntentPDA(paymentIntentId);
  const conn = getConnection();

  try {
    const subscriptionId = conn.onAccountChange(
      pda,
      (accountInfo) => {
        try {
          callback({
            paymentIntentId,
            pda: pda.toBase58(),
            amount: '0',
            status: 'paid',
            tx_signature: 'mock-tx-signature',
          });
        } catch (err) {
          console.error('Error processing account data:', err);
        }
      }
    );

    console.log(`Watching PaymentIntent: ${paymentIntentId}`);

    return () => {
      try {
        conn.removeAccountChangeListener(subscriptionId);
        console.log(`Unsubscribed watcher for ${paymentIntentId}`);
      } catch (err) {
        console.error('Error unsubscribing watcher:', err);
      }
    };
  } catch (error) {
    console.error('Error watching PaymentIntent:', error);
    return null;
  }
}

export default {
  getConnection,
  derivePaymentIntentPDA,
  getPaymentIntentFromSolana,
  subscribeToPaymentIntents,
  verifyTransactionSignature,
  verifyTokenTransfer,
  watchPaymentIntent,
};
