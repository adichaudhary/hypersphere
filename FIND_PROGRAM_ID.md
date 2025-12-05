# Finding Your Program ID in Solana Playground

## If You Haven't Deployed Yet:

1. **Build the Program First:**
   - In Solana Playground, click the **"Build"** button (or press `Ctrl+B`)
   - Wait for it to compile successfully
   - You should see "Build successful" message

2. **Deploy the Program:**
   - After building, click the **"Deploy"** button
   - This will deploy to Solana Devnet
   - Wait for deployment to complete

3. **Find the Program ID:**
   After deployment, the Program ID appears in several places:
   
   **Option A: In the Editor Panel**
   - Look at the top of your `lib.rs` file
   - You'll see: `declare_id!("YourProgramIdHere");`
   - This is your Program ID!

   **Option B: In the Build Output**
   - Check the terminal/output panel at the bottom
   - Look for a line like: `Program Id: YourProgramId1111111111111111111111111`

   **Option C: In the Program Info Panel**
   - Look for a panel on the right side showing program information
   - The Program ID should be displayed there

   **Option D: Check the Explorer Link**
   - After deployment, there's usually a link to view on Solana Explorer
   - The Program ID is in the URL

## If You Already Deployed:

1. **Check the `declare_id!()` line:**
   - In your `lib.rs` file, look at line 3
   - It should show: `declare_id!("YourActualProgramId");`
   - This is your Program ID!

2. **Check Solana Explorer:**
   - If you have a transaction signature from deployment
   - Go to https://explorer.solana.com/?cluster=devnet
   - Paste the transaction signature
   - Look for the "Program" field - that's your Program ID

3. **Redeploy if Needed:**
   - If you can't find it, you can redeploy
   - The Program ID will be shown after deployment
   - Make sure to copy it this time!

## What the Program ID Looks Like:

A Solana Program ID is a base58-encoded string, typically 32-44 characters long, like:
- `ABC123xyz789...` (44 characters)
- Or shorter if it's a well-known program

## Important:

- The Program ID is **NOT** the same as your wallet address
- The Program ID is generated when you first build/deploy
- Once set, it cannot be changed (unless you create a new program)

## Next Steps After Finding Program ID:

1. Copy the Program ID
2. Update `backend/.env`:
   ```
   PROGRAM_ID=YourProgramIdHere
   ```
3. Update `programs/tap_to_pay/src/lib.rs` line 3:
   ```rust
   declare_id!("YourProgramIdHere");
   ```

