# Deployed Smart Contract / Program Address

## Your Program Address:
**`3fJqtvkQLR45CVT83LqRP8hefjkXxAjKZ4e1N4QdHKMR`**

## Network:
**Solana Devnet**

## Locations in Your Codebase:

### 1. Solana Program (Rust)
**File:** `programs/tap_to_pay/src/lib.rs`
```rust
declare_id!("3fJqtvkQLR45CVT83LqRP8hefjkXxAjKZ4e1N4QdHKMR");
```
Line 3

### 2. Backend Configuration
**File:** `backend/.env` (create this file if it doesn't exist)
```env
PROGRAM_ID=3fJqtvkQLR45CVT83LqRP8hefjkXxAjKZ4e1N4QdHKMR
```

### 3. Backend Code Files (with defaults):
- `backend/src/solanaListener.js` - Line 5
- `backend/src/solanaProgram.js` - Line 12
- `backend/src/index.js` - Line 344
- `backend/src/createOnChainAccount.js` - Line 17

## View on Solana Explorer:

**Devnet Explorer:**
https://explorer.solana.com/address/3fJqtvkQLR45CVT83LqRP8hefjkXxAjKZ4e1N4QdHKMR?cluster=devnet

**Solscan (Devnet):**
https://solscan.io/account/3fJqtvkQLR45CVT83LqRP8hefjkXxAjKZ4e1N4QdHKMR?cluster=devnet

## Verify Deployment:

You can verify your program is deployed by:
1. Visiting the Explorer links above
2. Checking that the program account exists
3. Viewing the program's bytecode and metadata

## Important Notes:

- **Network**: Currently deployed on **Devnet** (test network)
- **Program ID**: Cannot be changed after deployment
- **Environment**: Make sure `backend/.env` has `PROGRAM_ID` set
- **RPC URL**: Should be `https://api.devnet.solana.com` for devnet

