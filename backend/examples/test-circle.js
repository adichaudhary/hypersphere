#!/usr/bin/env node

/**
 * Test script for Circle integration
 * Usage: node examples/test-circle.js
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001';
const MERCHANT_ID = `test-merchant-${Date.now()}`;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCircleIntegration() {
  console.log('🧪 Testing Circle Integration\n');

  try {
    // Test 1: Health check
    console.log('1️⃣  Health check...');
    let response = await fetch(`${BACKEND_URL}/health`);
    let data = await response.json();
    console.log('✓ Server is running\n');

    // Test 2: Link merchant to Circle
    console.log('2️⃣  Linking merchant to Circle...');
    response = await fetch(`${BACKEND_URL}/merchants/${MERCHANT_ID}/circle/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Merchant Store',
        email: 'test@merchant.com',
      }),
    });
    
    if (!response.ok) {
      console.error('Error response:', response.status);
      const errorData = await response.json();
      console.error('Details:', errorData);
      console.log('⚠️  Note: Circle linking requires valid API key in .env\n');
    } else {
      data = await response.json();
      console.log('✓ Merchant linked to Circle');
      console.log('  Circle Wallet ID:', data.circleWalletId);
      console.log('  Circle Address:', data.circleAddress);
    }

    // Test 3: Get merchant payments
    console.log('\n3️⃣  Creating test payments...');
    for (let i = 0; i < 3; i++) {
      const paymentResponse = await fetch(`${BACKEND_URL}/payment_intents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1000000 * (i + 1),
          merchant_id: MERCHANT_ID,
        }),
      });
      const paymentData = await paymentResponse.json();
      console.log(`  ✓ Payment ${i + 1}: ${paymentData.amount} lamports`);
    }

    // Test 4: Get merchant dashboard report
    console.log('\n4️⃣  Getting merchant dashboard report...');
    response = await fetch(`${BACKEND_URL}/merchants/${MERCHANT_ID}/dashboard/report`);
    
    if (!response.ok) {
      console.error('Error:', response.status);
      const errorData = await response.json();
      console.error('Details:', errorData);
    } else {
      data = await response.json();
      console.log('✓ Dashboard Report:');
      console.log('  Merchant:', data.merchantName);
      console.log('  Linked to Circle:', data.linked);
      console.log('  Transaction Count:', data.transactionCount);
      console.log('  Total Volume:', data.totalVolume, 'lamports');
      console.log('  Fiat Equivalent:', '$' + data.totalVolumeUsd.toFixed(2));
      console.log('  Current Balance:', '$' + (data.currentBalance || 0).toFixed(2));
      console.log('\n  Recent Transactions:');
      (data.transactions || []).slice(0, 3).forEach((tx, i) => {
        console.log(`    ${i + 1}. ${tx.amount} lamports - ${tx.status}`);
      });
    }

    // Test 5: Get merchant payments list
    console.log('\n5️⃣  Getting merchant payments list...');
    response = await fetch(`${BACKEND_URL}/merchants/${MERCHANT_ID}/payments`);
    data = await response.json();
    console.log('✓ Merchant Payments:');
    console.log('  Merchant ID:', data.merchant_id);
    console.log('  Total Payments:', data.total_count);
    console.log('  Payments:');
    (data.payments || []).forEach((p, i) => {
      console.log(`    ${i + 1}. ${p.amount} lamports - ${p.status}`);
    });

    console.log('\n✅ Circle Integration Tests Complete!');
    console.log('\nNote: To test with real Circle account:');
    console.log('1. Set CIRCLE_API_KEY in .env');
    console.log('2. Use CIRCLE_API_URL for sandbox or production');
    console.log('3. Verify Circle account has sufficient balance');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCircleIntegration();
