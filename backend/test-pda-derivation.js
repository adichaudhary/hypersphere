/**
 * Test PDA derivation to see if it's working
 */

import { derivePaymentIntentPDA } from './src/solanaListener.js';

const testId = 'test-payment-intent-123';

try {
  console.log('Testing PDA derivation...');
  console.log('Payment Intent ID:', testId);
  
  const { pda, bump } = derivePaymentIntentPDA(testId);
  
  console.log('✓ PDA derivation successful!');
  console.log('  PDA:', pda.toBase58());
  console.log('  Bump:', bump);
} catch (error) {
  console.error('✗ PDA derivation failed:');
  console.error('  Error:', error.message);
  console.error('  Stack:', error.stack);
}

