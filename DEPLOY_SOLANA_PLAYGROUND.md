# Deploying Solana Program via Solana Playground

## Step 1: Access Solana Playground

1. Open your browser and go to: **https://beta.solana.com/**
2. Click **"Create a new project"** or **"New"**
3. Name your project (e.g., "tap-to-pay")

## Step 2: Copy Your Program Code

Your program code is located at: `programs/tap_to_pay/src/lib.rs`

### In Solana Playground:

1. You'll see a default `lib.rs` file - **delete all its contents**
2. Copy the entire contents from your `programs/tap_to_pay/src/lib.rs` file
3. Paste it into the Playground editor

## Step 3: Update Cargo.toml

In Solana Playground, you'll see a `Cargo.toml` file. Make sure it has:

```toml
[package]
name = "tap_to_pay"
version = "0.1.0"
description = "Tap-to-Pay Solana Program"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "tap_to_pay"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.30.0"
```

## Step 4: Build the Program

1. Click the **"Build"** button (or press `Ctrl+B` / `Cmd+B`)
2. Wait for the build to complete
3. If there are errors, check:
   - The program ID will be auto-generated - that's fine
   - Make sure all dependencies are correct

## Step 5: Deploy to Devnet

1. Click the **"Deploy"** button
2. Solana Playground will:
   - Generate a new program ID
   - Deploy to Solana Devnet
   - Show you the deployment transaction

## Step 6: Get Your Program ID

After deployment:

1. Look for the **"Program ID"** in the Playground interface
2. It will look something like: `YourProgramId1111111111111111111111111`
3. **Copy this Program ID** - you'll need it!

## Step 7: Update Your Backend Configuration

1. Open `backend/.env` (or create it if it doesn't exist)
2. Add/update:
   ```env
   SOLANA_RPC_URL=https://api.devnet.solana.com
   PROGRAM_ID=YourProgramIdFromPlayground
   ```

3. Update `programs/tap_to_pay/src/lib.rs`:
   - Change line 3 from:
     ```rust
     declare_id!("TapToPay111111111111111111111111111111111111");
     ```
   - To:
     ```rust
     declare_id!("YourProgramIdFromPlayground");
     ```

4. Update `backend/src/solanaListener.js`:
   - Change line 5 from:
     ```javascript
     const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || '11111111111111111111111111111112');
     ```
   - To use your new program ID as the default (optional, since you'll set it in .env)

5. Update `backend/src/solanaProgram.js`:
   - Change line 12 from:
     ```javascript
     const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID || 'TapToPay111111111111111111111111111111111111');
     ```
   - To use your new program ID as the default (optional)

## Step 8: Verify Deployment

1. In Solana Playground, you can:
   - View your program on Solana Explorer
   - Test the program functions
   - View the program IDL

2. Test from your backend:
   ```bash
   cd backend
   npm start
   ```

## Important Notes:

- **Network**: Solana Playground deploys to **Devnet** by default
- **Program ID**: The program ID is generated automatically - you cannot change it after deployment
- **Cost**: Devnet is free (uses fake SOL)
- **Persistence**: Your program stays on Devnet until you redeploy

## Troubleshooting:

- If build fails: Check that all Anchor dependencies match (version 0.30.0)
- If deploy fails: Make sure you have enough SOL in your Playground wallet (you can airdrop in Playground)
- If program ID doesn't work: Make sure you copied the exact Program ID from Playground

## Next Steps:

After deployment, your backend can now:
- Derive PDAs for payment intents
- Read on-chain payment intent accounts
- Monitor payment confirmations via WebSocket

