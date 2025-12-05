# Test payment intent creation and check response

$body = @{
    amount = 10.00
    merchant_id = "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U"
    currency = "USDC"
} | ConvertTo-Json

Write-Host "Creating payment intent..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "http://localhost:3001/payment_intents" -Method Post -ContentType "application/json" -Body $body

Write-Host "`nFull Response:" -ForegroundColor Cyan
$response | ConvertTo-Json -Depth 5

Write-Host "`nKey Fields:" -ForegroundColor Cyan
Write-Host "  ID: $($response.id)"
Write-Host "  PDA: $($response.pda)"
Write-Host "  Bump: $($response.bump)"
Write-Host "  Nonce: $($response.nonce)"
Write-Host "  Amount: $($response.amount)"

if ($response.pda) {
    Write-Host "`nChecking status..." -ForegroundColor Yellow
    $status = Invoke-RestMethod -Uri "http://localhost:3001/payment_intents/$($response.id)/status"
    Write-Host "  Status: $($status.status)"
    Write-Host "  On-chain: $($status.on_chain)"
    Write-Host "  PDA: $($status.pda)"
}

