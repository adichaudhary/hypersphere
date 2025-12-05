# Quick test script for payment intent creation and status checking
# Make sure backend is running: npm start

Write-Host "=== Testing Payment Intent Creation ===" -ForegroundColor Cyan
Write-Host ""

# Create payment intent
Write-Host "1. Creating payment intent..." -ForegroundColor Yellow
$body = @{
    amount = 10.00
    merchant_id = "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U"
    currency = "USDC"
    tip_amount = 1.00
    chain = "Solana"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/payment_intents" -Method Post -ContentType "application/json" -Body $body
    
    $paymentId = $response.id
    $nonce = $response.nonce
    $pda = $response.pda
    $bump = $response.bump
    
    if (-not $paymentId) {
        Write-Host "Failed to create payment intent" -ForegroundColor Red
        Write-Host "Response: $($response | ConvertTo-Json -Depth 10)"
        exit 1
    }
    
    Write-Host "Payment intent created" -ForegroundColor Green
    Write-Host "  ID: $paymentId"
    Write-Host "  PDA: $pda"
    Write-Host "  Bump: $bump"
    Write-Host "  Nonce: $nonce"
    Write-Host ""
    
    # Check status
    Write-Host "2. Checking payment intent status..." -ForegroundColor Yellow
    $statusResponse = Invoke-RestMethod -Uri "http://localhost:3001/payment_intents/$paymentId/status"
    $status = $statusResponse.status
    $onChain = $statusResponse.on_chain
    
    Write-Host "  Status: $status"
    Write-Host "  On-chain: $onChain"
    Write-Host ""
    
    if ($onChain -eq $true) {
        Write-Host "Account exists on-chain!" -ForegroundColor Green
    } else {
        Write-Host "Account not yet created on-chain" -ForegroundColor Yellow
        Write-Host "   To create account, use Anchor client (see TESTING_GUIDE.md)"
    }
    
    Write-Host ""
    Write-Host "=== Test Complete ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Create on-chain account using Anchor client"
    Write-Host "2. Process payment via pay_invoice instruction"
    Write-Host "3. Verify status updates automatically"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}
