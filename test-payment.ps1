# Quick test script to create a payment via the API

param(
    [Parameter(Mandatory=$false)]
    [decimal]$Amount = 10.50
)

$merchantId = "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U"
$backendUrl = "http://localhost:3001"

Write-Host "Creating test payment..." -ForegroundColor Cyan
Write-Host "Amount: $Amount USDC" -ForegroundColor White

try {
    # Create payment intent
    $createBody = @{
        amount = $Amount
        merchant_id = $merchantId
        currency = "USDC"
    } | ConvertTo-Json

    $createResponse = Invoke-RestMethod -Method Post -Uri "$backendUrl/payment_intents" `
        -ContentType "application/json" `
        -Body $createBody

    $paymentId = $createResponse.id
    Write-Host "✓ Payment intent created: $paymentId" -ForegroundColor Green

    # Generate mock transaction signature
    $chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    $txSignature = -join (1..88 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })

    # Confirm payment
    $confirmBody = @{
        tx_signature = $txSignature
    } | ConvertTo-Json

    $confirmResponse = Invoke-RestMethod -Method Post -Uri "$backendUrl/payment_intents/$paymentId/confirm" `
        -ContentType "application/json" `
        -Body $confirmBody

    Write-Host "✓ Payment confirmed!" -ForegroundColor Green
    Write-Host "  Transaction: $txSignature" -ForegroundColor Gray
    Write-Host ""
    Write-Host "View in dashboard: http://localhost:5173" -ForegroundColor Yellow

} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure the backend is running:" -ForegroundColor Yellow
    Write-Host "  cd backend && npm start" -ForegroundColor Gray
}

