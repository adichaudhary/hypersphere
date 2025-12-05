# Hypersphere Backend - Custodial CCTP + Bridge Kit Relayer

A TypeScript/Node.js backend service that orchestrates cross-chain USDC payments using Circle's Cross-Chain Transfer Protocol (CCTP) and Bridge Kit. The system receives USDC payments on any supported chain (Solana, Ethereum, Base), bridges them to the merchant's preferred chain, and forwards funds to merchant payout addresses.

## Architecture

### Core Components

- **PaymentService**: Registers incoming payments received on custodial addresses
- **BridgeService**: Orchestrates CCTP bridge operations (burn → attestation → mint)
- **PayoutService**: Sends USDC to merchant payout addresses
- **BridgeKitClient**: Wrapper for Circle's Bridge Kit / CCTP APIs
- **Chain Clients**: Solana and EVM (Ethereum/Base) clients for sending USDC

### Database Schema

- **merchants**: Merchant profiles with payout preferences
- **payments**: Incoming payment records
- **transfers**: CCTP bridge operation tracking
- **payouts**: Outgoing payment records to merchants

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Circle API key (for CCTP/Bridge Kit)

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate
```

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hypersphere

# Circle API
CIRCLE_API_KEY=your_circle_api_key_here
CIRCLE_API_SECRET=your_circle_api_secret_here  # Optional

# Custodial Wallet Private Keys (hex format, never commit these!)
CUSTODIAL_SOLANA_KEY=your_solana_private_key_hex
CUSTODIAL_ETH_KEY=your_ethereum_private_key_hex
CUSTODIAL_BASE_KEY=your_base_private_key_hex

# RPC Endpoints
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BASE_RPC_URL=https://mainnet.base.org

# USDC Contract Addresses (defaults provided, override if needed)
USDC_ETHEREUM=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
USDC_BASE=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
USDC_SOLANA_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Circle CCTP Domain IDs (defaults provided)
CCTP_DOMAIN_ETHEREUM=0
CCTP_DOMAIN_BASE=6
CCTP_DOMAIN_SOLANA=1
```

**⚠️ Security Note**: Never commit private keys or API secrets to version control. Use environment variables or a secure secrets management system.

### Database Setup

```bash
# Create database (PostgreSQL)
createdb hypersphere

# Run migrations
npm run migrate

# (Optional) Open Prisma Studio to view data
npm run studio
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

## API Endpoints

### Payments

- `POST /api/payments/incoming` - Register incoming payment
  ```json
  {
    "merchantId": "uuid",
    "sourceChain": "ETHEREUM",
    "sourceTxHash": "0x...",
    "amountUsdc": "100.50",
    "custodialSourceAddress": "0x..."
  }
  ```

- `POST /api/payments/:id/bridge` - Start bridge process for payment
- `GET /api/payments/:id` - Get payment details

### Transfers

- `POST /api/transfers/:id/mint` - Poll attestation and complete mint

### Merchants

- `POST /api/merchants` - Create merchant
  ```json
  {
    "name": "Merchant Name",
    "email": "merchant@example.com",
    "payout_chain": "SOLANA",
    "payout_address": "SolanaAddress..."
  }
  ```

- `GET /api/merchants` - List all merchants
- `GET /api/merchants/:id` - Get merchant details
- `PUT /api/merchants/:id` - Update merchant
- `POST /api/merchants/:id/payout` - Create and send payout
  ```json
  {
    "amountUsdc": "100.50"
  }
  ```

## Workflow

### 1. Incoming Payment Registration

When a USDC payment is detected on a custodial address:

```bash
POST /api/payments/incoming
{
  "merchantId": "...",
  "sourceChain": "ETHEREUM",
  "sourceTxHash": "0x...",
  "amountUsdc": "100",
  "custodialSourceAddress": "0x..."
}
```

The system:
- Creates a `payment` record with status `RECEIVED`
- Creates a `transfer` record with status `PENDING_BURN` (if bridge needed)
- If source chain == payout chain, marks payment as `SETTLED` (no bridge)

### 2. Bridge Orchestration

Start bridge process:

```bash
POST /api/payments/:id/bridge
```

The system:
- Burns USDC on source chain via Circle Bridge Kit
- Updates transfer with `burn_tx_hash` and status `PENDING_ATTESTATION`

Poll for attestation and mint:

```bash
POST /api/transfers/:id/mint
```

The system:
- Fetches attestation from Circle
- Mints USDC on destination chain
- Updates transfer as `COMPLETED`
- Marks payment as `SETTLED`
- Triggers payout to merchant

### 3. Payout to Merchant

Automatically triggered after successful bridge, or manually:

```bash
POST /api/merchants/:id/payout
{
  "amountUsdc": "100"
}
```

The system:
- Creates `payout` record
- Sends USDC to merchant's `payout_address` on their `payout_chain`
- Updates payout with `tx_hash` and status `SENT`

## Testing

The test suite uses mocks to avoid real blockchain transactions and API calls:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

- `PaymentService.test.ts` - Payment registration and status updates
- `BridgeService.test.ts` - Bridge orchestration flow
- `PayoutService.test.ts` - Payout creation and execution

All tests use mocked clients to avoid:
- Real blockchain transactions
- Real API calls to Circle
- Real money transfers

## Integration Points (TODOs)

The following integration points are stubbed and need real implementations:

### Circle Bridge Kit Client

- `burnUsdcOnChain()` - Integrate with Circle Bridge Kit SDK or REST API
- `getAttestation()` - Poll Circle's attestation API
- `mintUsdcOnChain()` - Integrate with Circle Bridge Kit mint API

### Chain Clients

- `SolanaClient.sendUsdc()` - Wire up Solana RPC and signing
- `EvmClient.sendUsdc()` - Wire up Ethereum/Base RPC and signing

### Security

- Replace direct private key usage with secure key management (AWS KMS, HashiCorp Vault, etc.)
- Implement proper key rotation
- Add rate limiting and request validation
- Add authentication/authorization for API endpoints

## Production Considerations

1. **Database**: Use connection pooling and read replicas for scale
2. **Monitoring**: Add Prometheus metrics and distributed tracing
3. **Error Handling**: Implement retry logic and dead letter queues
4. **Idempotency**: Ensure all operations are idempotent
5. **Audit Logging**: Log all financial operations for compliance
6. **Rate Limiting**: Protect API endpoints from abuse
7. **Secrets Management**: Use AWS Secrets Manager, Vault, or similar

## License

MIT
