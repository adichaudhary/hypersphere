# Quick test script to create a payment via the API

param(
    [Parameter(Mandatory=$false)]
    [decimal]$Amount = 10.50,
    [Parameter(Mandatory=$false)]
    [decimal]$Tip = 2.00,
    [Parameter(Mandatory=$false)]
    [string]$Chain = "SOL"
)

$merchantId = "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U"
$backendUrl = "http://localhost:3001"

$totalAmount = $Amount + $Tip

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating Test Payment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Base Amount: `$$Amount USDC" -ForegroundColor White
Write-Host "Tip Amount:  `$$Tip USDC" -ForegroundColor White
Write-Host "Total:       `$$totalAmount USDC" -ForegroundColor Green
Write-Host "Chain:       $Chain" -ForegroundColor White
Write-Host ""

try {
    # Create payment intent
    $createBody = @{
        amount = $totalAmount
        merchant_id = $merchantId
        currency = "USDC"
        tip_amount = $Tip
        chain = $Chain
    } | ConvertTo-Json

    $createResponse = Invoke-RestMethod -Method Post -Uri "$backendUrl/payment_intents" `
        -ContentType "application/json" `
        -Body $createBody

    $paymentId = $createResponse.id
    Write-Host "✓ Payment intent created!" -ForegroundColor Green
    Write-Host "  Payment ID: $paymentId" -ForegroundColor Gray
    Write-Host "  Status: $($createResponse.status)" -ForegroundColor Gray
    Write-Host "  Created: $($createResponse.created_at)" -ForegroundColor Gray
    Write-Host ""

    # Generate mock transaction signature
    $chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    $txSignature = -join (1..88 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })

    Write-Host "Confirming payment..." -ForegroundColor Cyan
    
    # Confirm payment
    $confirmBody = @{
        tx_signature = $txSignature
    } | ConvertTo-Json

    $confirmResponse = Invoke-RestMethod -Method Post -Uri "$backendUrl/payment_intents/$paymentId/confirm" `
        -ContentType "application/json" `
        -Body $confirmBody

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ Payment Confirmed Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Payment ID:    $paymentId" -ForegroundColor White
    Write-Host "Transaction:  $txSignature" -ForegroundColor White
    Write-Host "Amount:        `$$totalAmount USDC" -ForegroundColor White
    Write-Host "  Base:        `$$Amount" -ForegroundColor Gray
    Write-Host "  Tip:         `$$Tip" -ForegroundColor Gray
    Write-Host "Chain:         $Chain" -ForegroundColor White
    Write-Host "Status:        $($confirmResponse.payment_intent.status)" -ForegroundColor Green
    Write-Host ""
    Write-Host "View in dashboard: http://localhost:5173" -ForegroundColor Yellow
    Write-Host ""

} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure the backend is running:" -ForegroundColor Yellow
    Write-Host "  cd backend; npm start" -ForegroundColor Gray
}
