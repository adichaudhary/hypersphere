/**
 * Test script to create PaymentIntent accounts on-chain
 * 
 * Usage:
 *   node test-create-account.js <payment_intent_id> <amount> <nonce_hex> [keypair_path]
 * 
 * Example:
 *   node test-create-account.js abc-123 10000000 a1b2c3d4... ~/.config/solana/id.json
 */

import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { derivePaymentIntentPDA } from './src/solanaListener.js';

dotenv.config();

const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || 'TapToPay111111111111111111111111111111111111');
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

async function createPaymentIntentAccount(paymentIntentId, amount, nonceHex, keypairPath) {
  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    // Load keypair
    let keypair;
    if (keypairPath) {
      const keypairData = JSON.parse(readFileSync(keypairPath, 'utf8'));
      keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    } else {
      // Try default location
      const defaultPath = process.env.HOME 
        ? `${process.env.HOME}/.config/solana/id.json`
        : `${process.env.USERPROFILE}/.config/solana/id.json`;
      try {
        const keypairData = JSON.parse(readFileSync(defaultPath, 'utf8'));
        keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
      } catch (e) {
        console.error('Could not load keypair. Please provide keypair path.');
        console.error('Usage: node test-create-account.js <payment_intent_id> <amount> <nonce_hex> [keypair_path]');
        process.exit(1);
      }
    }

    // Derive PDA
    const { pda, bump } = derivePaymentIntentPDA(paymentIntentId);

    console.log('\n=== Creating PaymentIntent Account On-Chain ===');
    console.log(`Payment Intent ID: ${paymentIntentId}`);
    console.log(`PDA: ${pda.toBase58()}`);
    console.log(`Bump: ${bump}`);
    console.log(`Merchant: ${keypair.publicKey.toBase58()}`);
    console.log(`Amount: ${amount}`);
    console.log(`Nonce: ${nonceHex}`);

    // Check if account already exists
    const accountInfo = await connection.getAccountInfo(pda);
    if (accountInfo) {
      console.log('\n⚠️  Account already exists on-chain!');
      console.log(`   PDA: ${pda.toBase58()}`);
      return { pda: pda.toBase58(), exists: true };
    }

    console.log('\n⚠️  Note: This script shows the PDA info.');
    console.log('   To actually create the account, you need to:');
    console.log('   1. Use Anchor client with the program IDL');
    console.log('   2. Call the create_payment_intent instruction');
    console.log('   3. Sign with merchant wallet');
    console.log('\n   See TESTING_GUIDE.md for full instructions.');

    // For now, just return the PDA info
    return { pda: pda.toBase58(), bump, needsAnchor: true };
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('test-create-account')) {
  const paymentIntentId = process.argv[2];
  const amount = process.argv[3] ? parseInt(process.argv[3]) : null;
  const nonceHex = process.argv[4];
  const keypairPath = process.argv[5];

  if (!paymentIntentId || !nonceHex) {
    console.error('Usage: node test-create-account.js <payment_intent_id> <amount> <nonce_hex> [keypair_path]');
    console.error('\nExample:');
    console.error('  node test-create-account.js abc-123 10000000 a1b2c3d4...');
    process.exit(1);
  }

  createPaymentIntentAccount(paymentIntentId, amount, nonceHex, keypairPath);
}

export { createPaymentIntentAccount };

