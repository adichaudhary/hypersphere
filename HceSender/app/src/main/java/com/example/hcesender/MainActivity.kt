package com.example.hcesender

import android.app.AlertDialog
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.text.InputType
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.OvershootInterpolator
import android.util.Log
import android.net.Uri
import android.widget.Toast
import com.example.hcesender.databinding.ActivityMainBinding
import java.text.NumberFormat
import java.util.Locale
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.util.UUID
import kotlin.concurrent.thread
import kotlin.math.round

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var currentState = PaymentState.IDLE
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var nfcScanReceiver: BroadcastReceiver
    
    private var baseAmount = 0.0
    private var tipPercentage = 0
    private var tipAmount = 0.0
    private var totalAmount = 0.0
    
    private enum class Chain {
        ETH, SOL, BASE
    }
    private var selectedChain = Chain.SOL // Default to Solana
    private var currentMerchantWallet = MERCHANT_WALLET // Will be updated based on chain
    private val cctpService = CCTPService()

    companion object {
        const val PREFS_NAME = "hce_sender_prefs"
        const val KEY_RECIPIENT = "recipient"
        const val KEY_AMOUNT = "amount"
        const val KEY_CHAIN = "selected_chain"
        const val TAG = "MainActivity"

        // Merchant ID (used for API calls - should match frontend)
        const val MERCHANT_ID = "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U"
        // Default merchant wallet (fallback if wallet address not found)
        const val MERCHANT_WALLET = "2Qw4fFW9MeKvJXPVfMWX6X324PaX8aAA8B9J2Xnv8PBF"
        const val DEFAULT_AMOUNT = "0.01"
        
        // Backend API endpoint (update this with your actual backend URL)
        const val BACKEND_URL = "http://10.0.2.2:3001" // Use 10.0.2.2 for Android emulator to access localhost
    }

    enum class PaymentState {
        IDLE, PROCESSING, SUCCESS
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Load amount from SharedPreferences and display it
        loadAndDisplayAmount()
        
        // Fetch wallet address for the initially selected chain
        fetchWalletAddressForChain(selectedChain)

        // Set up amount text click listener to edit amount
        binding.amountText.setOnClickListener {
            showEditAmountDialog()
        }

        // Set up chain selection button listeners
        binding.ethButton.setOnClickListener { selectChain(Chain.ETH) }
        binding.solButton.setOnClickListener { selectChain(Chain.SOL) }
        binding.baseButton.setOnClickListener { selectChain(Chain.BASE) }

        // Set up tip button listeners
        binding.tip10Button.setOnClickListener { setTipPercentage(10) }
        binding.tip15Button.setOnClickListener { setTipPercentage(15) }
        binding.tip18Button.setOnClickListener { setTipPercentage(18) }
        binding.tip20Button.setOnClickListener { setTipPercentage(20) }

        // Set up tap area click listener
        binding.tapArea.setOnClickListener {
            if (currentState == PaymentState.IDLE) {
                simulatePayment()
            }
        }

        // Set up test URL button
        binding.testUrlButton.setOnClickListener {
            testPaymentUrl()
        }
        
        // Test Circle API connection on startup (in background)
        thread {
            val connected = cctpService.testCircleAPIConnection()
            handler.post {
                if (connected) {
                    Log.d(TAG, "✓ Circle API sandbox connection successful")
                } else {
                    Log.w(TAG, "⚠ Circle API sandbox connection failed - check API key")
                }
            }
        }

        // Update debug URL display initially
        updateDebugUrlDisplay()

        // Register broadcast receiver for NFC scan events
        nfcScanReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action == PaymentCardService.ACTION_NFC_SCANNED) {
                    // NFC reader scanned the HCE sender - trigger success animation
                    triggerPaymentSuccess()
                }
            }
        }

        val filter = IntentFilter(PaymentCardService.ACTION_NFC_SCANNED)
        LocalBroadcastManager.getInstance(this).registerReceiver(nfcScanReceiver, filter)
    }

    override fun onDestroy() {
        super.onDestroy()
        // Unregister receiver
        LocalBroadcastManager.getInstance(this).unregisterReceiver(nfcScanReceiver)
    }

    private fun loadAndDisplayAmount() {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val savedAmount = prefs.getString(KEY_AMOUNT, DEFAULT_AMOUNT) ?: DEFAULT_AMOUNT
        val savedChain = prefs.getString(KEY_CHAIN, "SOL") ?: "SOL"
        
        // Set base amount
        baseAmount = savedAmount.toDoubleOrNull() ?: 0.01
        
        // Set selected chain
        selectedChain = when (savedChain) {
            "ETH" -> Chain.ETH
            "BASE" -> Chain.BASE
            else -> Chain.SOL
        }
        
        // Ensure chain is saved to SharedPreferences (for PaymentCardService)
        prefs.edit().putString(KEY_CHAIN, selectedChain.name).apply()
        
        // Reset tip
        tipPercentage = 0
        tipAmount = 0.0
        totalAmount = baseAmount
        
        // Update all displays
        updateAmountDisplays()
        updateChainSelection()
        
        // Fetch wallet address for the loaded chain
        fetchWalletAddressForChain(selectedChain)
    }
    
    private fun updateAmountDisplays() {
        val formatter = NumberFormat.getCurrencyInstance(Locale.US)
        
        // Update base amount
        binding.amountText.text = formatter.format(baseAmount)
        
        // Update tip amount
        binding.tipAmountText.text = formatter.format(tipAmount)
        
        // Update total amount
        binding.totalAmountText.text = formatter.format(totalAmount)
        
        // Save total amount to SharedPreferences (this is what gets sent via NFC)
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        prefs.edit().putString(KEY_AMOUNT, String.format("%.2f", totalAmount)).apply()
        
        // Update tip button states
        updateTipButtonStates()
        
        // Update debug URL display
        updateDebugUrlDisplay()
    }
    
    private fun updateTipButtonStates() {
        // Reset all buttons to default state
        binding.tip10Button.setBackgroundColor(getColor(android.R.color.transparent))
        binding.tip15Button.setBackgroundColor(getColor(android.R.color.transparent))
        binding.tip18Button.setBackgroundColor(getColor(android.R.color.transparent))
        binding.tip20Button.setBackgroundColor(getColor(android.R.color.transparent))
        
        // Highlight selected button
        when (tipPercentage) {
            10 -> binding.tip10Button.setBackgroundColor(getColor(android.R.color.holo_blue_light))
            15 -> binding.tip15Button.setBackgroundColor(getColor(android.R.color.holo_blue_light))
            18 -> binding.tip18Button.setBackgroundColor(getColor(android.R.color.holo_blue_light))
            20 -> binding.tip20Button.setBackgroundColor(getColor(android.R.color.holo_blue_light))
        }
    }
    
    private fun showEditAmountDialog() {
        val builder = AlertDialog.Builder(this)
        builder.setTitle("Edit Base Amount")
        
        val input = EditText(this)
        input.inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
        input.hint = "Enter amount (e.g., 25.00)"
        input.setText(String.format("%.2f", baseAmount))
        builder.setView(input)
        
        builder.setPositiveButton("Save") { dialog, _ ->
            val newAmount = input.text.toString().toDoubleOrNull()
            if (newAmount != null && newAmount > 0) {
                baseAmount = newAmount
                // Recalculate tip and total
                calculateTipAndTotal()
                updateAmountDisplays()
            }
            dialog.dismiss()
        }
        
        builder.setNegativeButton("Cancel") { dialog, _ ->
            dialog.cancel()
        }
        
        builder.show()
    }
    
    private fun setTipPercentage(percentage: Int) {
        // Toggle tip: if same percentage is clicked again, remove tip
        tipPercentage = if (tipPercentage == percentage) 0 else percentage
        
        calculateTipAndTotal()
        updateAmountDisplays()
    }
    
    private fun calculateTipAndTotal() {
        if (tipPercentage > 0) {
            tipAmount = (baseAmount * tipPercentage / 100.0)
            // Round to 2 decimal places
            tipAmount = round(tipAmount * 100) / 100
        } else {
            tipAmount = 0.0
        }
        
        totalAmount = baseAmount + tipAmount
        // Round to 2 decimal places
        totalAmount = round(totalAmount * 100) / 100
    }
    
    private fun selectChain(chain: Chain) {
        selectedChain = chain
        
        // Save to SharedPreferences (for PaymentCardService to read)
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_CHAIN, chain.name)
            .apply()
        
        // Update UI
        updateChainSelection()
        
        // Fetch wallet address for the selected chain
        fetchWalletAddressForChain(chain)
        
        // Update debug URL display
        updateDebugUrlDisplay()
        
        Log.d(TAG, "Chain selected: ${chain.name}")
    }
    
    private fun fetchWalletAddressForChain(chain: Chain) {
        // Fetch wallet address from backend based on selected chain
        thread {
            try {
                val walletUrl = URL("$BACKEND_URL/merchants/$MERCHANT_ID/wallet/${chain.name}")
                val connection = walletUrl.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                
                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    val response = connection.inputStream.bufferedReader().readText()
                    val responseJson = JSONObject(response)
                    val walletAddress = responseJson.getString("wallet_address")
                    
                    if (walletAddress.isNotEmpty()) {
                        currentMerchantWallet = walletAddress
                        Log.d(TAG, "Wallet address for ${chain.name}: $walletAddress")
                        
                        // Update PaymentCardService with new wallet address
                        updatePaymentCardServiceWallet(walletAddress)
                    } else {
                        Log.w(TAG, "No wallet address found for ${chain.name}, using default")
                        // Use default wallet as fallback
                        currentMerchantWallet = MERCHANT_WALLET
                        updatePaymentCardServiceWallet(MERCHANT_WALLET)
                    }
                } else {
                    Log.w(TAG, "Failed to fetch wallet address: HTTP $responseCode, using default")
                    // Use default wallet as fallback
                    currentMerchantWallet = MERCHANT_WALLET
                    updatePaymentCardServiceWallet(MERCHANT_WALLET)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching wallet address for ${chain.name}", e)
                // Keep using default wallet address on error
                currentMerchantWallet = MERCHANT_WALLET
                updatePaymentCardServiceWallet(MERCHANT_WALLET)
            }
        }
    }
    
    private fun updatePaymentCardServiceWallet(walletAddress: String) {
        // Update SharedPreferences so PaymentCardService can use the new wallet
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        prefs.edit().putString(KEY_RECIPIENT, walletAddress).apply()
        
        // Update debug URL display with new wallet
        updateDebugUrlDisplay()
    }
    
    private fun updateChainSelection() {
        // Reset all chain buttons to default state
        binding.ethButton.setBackgroundResource(R.drawable.chain_button_background)
        binding.solButton.setBackgroundResource(R.drawable.chain_button_background)
        binding.baseButton.setBackgroundResource(R.drawable.chain_button_background)
        
        // Highlight selected chain
        when (selectedChain) {
            Chain.ETH -> binding.ethButton.setBackgroundResource(R.drawable.chain_button_background_selected)
            Chain.SOL -> binding.solButton.setBackgroundResource(R.drawable.chain_button_background_selected)
            Chain.BASE -> binding.baseButton.setBackgroundResource(R.drawable.chain_button_background_selected)
        }
    }

    private fun simulatePayment() {
        // Switch to processing state
        setState(PaymentState.PROCESSING)

        // Simulate payment processing (1.5 seconds)
        handler.postDelayed({
            triggerPaymentSuccess()
        }, 1500)
    }

    private fun triggerPaymentSuccess() {
        // Only trigger if currently idle or processing
        if (currentState == PaymentState.IDLE || currentState == PaymentState.PROCESSING) {
            setState(PaymentState.SUCCESS)
            
            // Update success amount text with total (including tip)
            val formatter = NumberFormat.getCurrencyInstance(Locale.US)
            binding.successAmount.text = "${formatter.format(totalAmount)} charged"
            
            // Animate checkmark appearance
            animateSuccessCheckmark()
            
            // Send payment data to backend
            sendPaymentToBackend(totalAmount)
            
            // Reset to idle after 3 seconds
            handler.postDelayed({
                setState(PaymentState.IDLE)
                // Reset tip after successful payment
                tipPercentage = 0
                calculateTipAndTotal()
                updateAmountDisplays()
            }, 3000)
        }
    }
    
    private fun animateSuccessCheckmark() {
        // Reset checkmark to initial state (hidden and scaled down)
        binding.successIcon.alpha = 0f
        binding.successIcon.scaleX = 0f
        binding.successIcon.scaleY = 0f
        
        // Animate checkmark with bounce effect
        binding.successIcon.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(600)
            .setInterpolator(OvershootInterpolator(1.2f))
            .start()
    }

    private fun sendPaymentToBackend(amount: Double) {
        // Send payment data to backend in a background thread
        thread {
            try {
                Log.d(TAG, "Sending payment to backend: amount=$amount, tip=$tipAmount, chain=${selectedChain.name}, merchant_id=$MERCHANT_ID, wallet=$currentMerchantWallet")
                
                // First, create a payment intent
                val createUrl = URL("$BACKEND_URL/payment_intents")
                val createConnection = createUrl.openConnection() as HttpURLConnection
                createConnection.requestMethod = "POST"
                createConnection.setRequestProperty("Content-Type", "application/json")
                createConnection.doOutput = true

                val createPayload = JSONObject().apply {
                    put("amount", amount)
                    put("merchant_id", MERCHANT_ID) // Use merchant ID, not wallet address
                    put("currency", "USDC")
                    put("tip_amount", tipAmount)
                    put("chain", selectedChain.name)
                }

                OutputStreamWriter(createConnection.outputStream).use { writer ->
                    writer.write(createPayload.toString())
                    writer.flush()
                }

                val createResponseCode = createConnection.responseCode
                if (createResponseCode == HttpURLConnection.HTTP_CREATED) {
                    val response = createConnection.inputStream.bufferedReader().readText()
                    val responseJson = JSONObject(response)
                    val paymentIntentId = responseJson.getString("id")
                    
                    Log.d(TAG, "Payment intent created: $paymentIntentId")
                    
                    // Simulate transaction confirmation (in real scenario, this would come from Solana)
                    // Generate a fake transaction signature for demo purposes
                    val txSignature = generateMockTxSignature()
                    
                    // Confirm the payment intent
                    val confirmUrl = URL("$BACKEND_URL/payment_intents/$paymentIntentId/confirm")
                    val confirmConnection = confirmUrl.openConnection() as HttpURLConnection
                    confirmConnection.requestMethod = "POST"
                    confirmConnection.setRequestProperty("Content-Type", "application/json")
                    confirmConnection.doOutput = true

                    val confirmPayload = JSONObject().apply {
                        put("tx_signature", txSignature)
                    }

                    OutputStreamWriter(confirmConnection.outputStream).use { writer ->
                        writer.write(confirmPayload.toString())
                        writer.flush()
                    }

                    val confirmResponseCode = confirmConnection.responseCode
                    if (confirmResponseCode == HttpURLConnection.HTTP_OK) {
                        Log.d(TAG, "✓ Payment confirmed successfully with signature: $txSignature")
                    } else {
                        Log.e(TAG, "Failed to confirm payment: HTTP $confirmResponseCode")
                    }
                } else {
                    Log.e(TAG, "Failed to create payment intent: HTTP $createResponseCode")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error sending payment to backend", e)
            }
        }
    }
    
    private fun generateMockTxSignature(): String {
        // Generate a realistic-looking Solana transaction signature (base58 format)
        val chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
        return (1..88).map { chars.random() }.joinToString("")
    }

    private fun setState(state: PaymentState) {
        currentState = state

        when (state) {
            PaymentState.IDLE -> {
                binding.idleState.visibility = View.VISIBLE
                binding.processingState.visibility = View.GONE
                binding.successState.visibility = View.GONE
                // Reset checkmark animation state for next payment
                binding.successIcon.alpha = 0f
                binding.successIcon.scaleX = 0f
                binding.successIcon.scaleY = 0f
            }
            PaymentState.PROCESSING -> {
                binding.idleState.visibility = View.GONE
                binding.processingState.visibility = View.VISIBLE
                binding.successState.visibility = View.GONE
            }
            PaymentState.SUCCESS -> {
                binding.idleState.visibility = View.GONE
                binding.processingState.visibility = View.GONE
                binding.successState.visibility = View.VISIBLE
            }
        }
    }
    
    /**
     * Generate payment URL based on current chain, amount, and wallet
     * Uses the same logic as PaymentCardService
     */
    private fun generatePaymentUrl(): String {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val amount = String.format("%.2f", totalAmount)
        val chain = selectedChain.name
        
        // Get recipient wallet from preferences
        val recipientWallet = prefs.getString(KEY_RECIPIENT, MERCHANT_WALLET) ?: MERCHANT_WALLET
        
        return when (chain) {
            "SOL" -> {
                // Solana Pay format for Phantom on Solana network
                val labelEncoded = Uri.encode("Hypersphere")
                val messageEncoded = Uri.encode("Tap to Pay")
                val usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                "solana:$recipientWallet?amount=$amount&spl-token=$usdcMint&label=$labelEncoded&message=$messageEncoded"
            }
            "ETH" -> {
                // MetaMask format for Ethereum mainnet - uses CCTP service to ensure correct network
                cctpService.generatePaymentUrl("ETH", recipientWallet, totalAmount, false)
            }
            "BASE" -> {
                // Base Pay format - opens MetaMask on Base network and prompts transaction
                // Uses CCTP service to ensure Base network USDC contract
                cctpService.generatePaymentUrl("BASE", recipientWallet, totalAmount, false)
            }
            else -> {
                val labelEncoded = Uri.encode("Hypersphere")
                val messageEncoded = Uri.encode("Tap to Pay")
                val usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                "solana:$recipientWallet?amount=$amount&spl-token=$usdcMint&label=$labelEncoded&message=$messageEncoded"
            }
        }
    }
    
    /**
     * Update debug URL display with current payment URL
     */
    private fun updateDebugUrlDisplay() {
        try {
            val paymentUrl = generatePaymentUrl()
            val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            
            val wallet = prefs.getString(KEY_RECIPIENT, MERCHANT_WALLET) ?: MERCHANT_WALLET
            
            binding.debugUrlText.text = paymentUrl
            
            val walletApp = when (selectedChain) {
                Chain.SOL -> "Phantom"
                Chain.ETH -> "MetaMask"
                Chain.BASE -> "MetaMask (Base Pay)"
            }
            
            val networkInfo = when (selectedChain) {
                Chain.ETH -> " | Network: Ethereum Mainnet (USDC via CCTP)"
                Chain.BASE -> " | Network: Base (USDC via CCTP) - Base Pay"
                Chain.SOL -> " | Network: Solana (USDC)"
            }
            
            binding.debugInfoText.text = "Chain: ${selectedChain.name} | Wallet: ${wallet.take(8)}... | Opens: $walletApp$networkInfo"
        } catch (e: Exception) {
            Log.e(TAG, "Error generating payment URL", e)
            binding.debugUrlText.text = "Error generating URL: ${e.message}"
        }
    }
    
    /**
     * Test opening the payment URL (simulates NFC reader behavior)
     */
    private fun testPaymentUrl() {
        try {
            val paymentUrl = generatePaymentUrl()
            Log.d(TAG, "Testing payment URL: $paymentUrl")
            
            val uri = Uri.parse(paymentUrl)
            
            if (uri.scheme == null) {
                Toast.makeText(this, "Invalid URL format", Toast.LENGTH_SHORT).show()
                return
            }
            
            val intent = Intent(Intent.ACTION_VIEW, uri)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            intent.addCategory(Intent.CATEGORY_BROWSABLE)
            intent.addCategory(Intent.CATEGORY_DEFAULT)
            
            // For ethereum: scheme, ensure MetaMask can handle the transaction request
            if (uri.scheme == "ethereum") {
                // MetaMask should handle EIP-681 format and create transaction request
                Log.d(TAG, "Opening Ethereum payment URL: $paymentUrl")
                Log.d(TAG, "This should create a transaction request in MetaMask with amount: $totalAmount USDC")
            }
            
            val walletApp = when (uri.scheme) {
                "solana" -> "Phantom"
                "ethereum" -> {
                    when (selectedChain) {
                        Chain.BASE -> "MetaMask (Base Pay)"
                        else -> "MetaMask"
                    }
                }
                else -> "wallet app"
            }
            
            try {
                startActivity(intent)
                val networkName = when (selectedChain) {
                    Chain.ETH -> "Ethereum Mainnet"
                    Chain.BASE -> "Base (Base Pay)"
                    Chain.SOL -> "Solana"
                }
                Toast.makeText(this, "Opening in $walletApp ($networkName)...", Toast.LENGTH_SHORT).show()
                Log.d(TAG, "Successfully opened URL in $walletApp")
            } catch (e: android.content.ActivityNotFoundException) {
                Toast.makeText(this, "Please install $walletApp to test this payment", Toast.LENGTH_LONG).show()
                Log.e(TAG, "$walletApp not installed", e)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error testing payment URL", e)
            Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
}

