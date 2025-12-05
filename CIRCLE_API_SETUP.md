# Circle API Sandbox Integration

## Overview
The Circle API sandbox has been integrated into the project to enable CCTP (Cross-Chain Transfer Protocol) functionality for USDC transfers between Ethereum and Base networks.

## API Key Configuration
The Circle API sandbox key has been configured in:
- **File**: `HceSender/app/src/main/java/com/example/hcesender/CCTPService.kt`
- **API Key**: `c0943ec4ba237858764df24eb45797c0`
- **API Secret**: `a9549e06dde3c0b1cf7137730190f417`
- **Environment**: Sandbox (for testing)

## API Endpoints

### Sandbox Base URLs
- **Circle API Sandbox**: `https://api-sandbox.circle.com`
- **CCTP Attestation Service Sandbox**: `https://iris-api-sandbox.circle.com/v1/attestations`

### Production URLs (when ready)
- **Circle API Production**: `https://api.circle.com`
- **CCTP Attestation Service Production**: `https://iris-api.circle.com/v1/attestations`

## Features Implemented

### 1. CCTP Attestation Status Check
- Method: `checkAttestationStatus(messageHash: String)`
- Checks the status of a CCTP burn transaction
- Returns attestation when status is "complete"
- Uses Bearer token authentication

### 2. Circle API Connectivity Test
- Method: `testCircleAPIConnection()`
- Tests connection to Circle API sandbox
- Called automatically on app startup
- Logs connection status

### 3. Authentication
All API requests include:
```
Authorization: Bearer c0943ec4ba237858764df24eb45797c0
```

## Usage

### Testing the Connection
The app automatically tests the Circle API connection on startup. Check the logs for:
- `✓ Circle API sandbox connection successful` - Connection working
- `⚠ Circle API sandbox connection failed` - Check API key or network

### Checking Attestation Status
```kotlin
val cctpService = CCTPService()
val attestation = cctpService.checkAttestationStatus(messageHash)
if (attestation != null) {
    // Attestation is ready, can proceed with minting
}
```

## Switching to Production
To switch from sandbox to production:
1. Update `USE_SANDBOX` constant in `CCTPService.kt` to `false`
2. Replace sandbox API key with production API key
3. Update API key constants with production credentials

## Circle API Documentation
- **Getting Started**: https://developers.circle.com/circle-mint/getting-started-with-the-circle-apis
- **CCTP Documentation**: https://developers.circle.com/cctp
- **API Reference**: https://developers.circle.com/reference

## Next Steps
1. Test CCTP cross-chain transfers using the sandbox
2. Implement full CCTP flow (burn → attestation → mint)
3. Add error handling and retry logic
4. Switch to production when ready

