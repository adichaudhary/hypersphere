package com.example.hcesender

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.appcompat.app.AppCompatActivity
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.util.Log
import com.example.hcesender.databinding.ActivityMainBinding
import java.text.NumberFormat
import java.util.Locale
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.util.UUID
import kotlin.concurrent.thread

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var currentState = PaymentState.IDLE
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var nfcScanReceiver: BroadcastReceiver

    companion object {
        const val PREFS_NAME = "hce_sender_prefs"
        const val KEY_RECIPIENT = "recipient"
        const val KEY_AMOUNT = "amount"
        const val TAG = "MainActivity"

        // Merchant wallet (hardcoded for consistency with PaymentCardService)
        const val MERCHANT_WALLET = "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U"
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

        // Set up tap area click listener
        binding.tapArea.setOnClickListener {
            if (currentState == PaymentState.IDLE) {
                simulatePayment()
            }
        }

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
        
        // Format amount as currency
        val amountValue = savedAmount.toDoubleOrNull() ?: 0.0
        val formattedAmount = NumberFormat.getCurrencyInstance(Locale.US).format(amountValue)
        
        binding.amountText.text = formattedAmount
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
            
            // Update success amount text
            val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            val savedAmount = prefs.getString(KEY_AMOUNT, DEFAULT_AMOUNT) ?: DEFAULT_AMOUNT
            val amountValue = savedAmount.toDoubleOrNull() ?: 0.0
            val formattedAmount = NumberFormat.getCurrencyInstance(Locale.US).format(amountValue)
            binding.successAmount.text = "$formattedAmount charged"
            
            // Send payment data to backend
            sendPaymentToBackend(amountValue)
            
            // Reset to idle after 3 seconds
            handler.postDelayed({
                setState(PaymentState.IDLE)
            }, 3000)
        }
    }

    private fun sendPaymentToBackend(amount: Double) {
        // Send payment data to backend in a background thread
        thread {
            try {
                Log.d(TAG, "Sending payment to backend: amount=$amount, merchant=$MERCHANT_WALLET")
                
                // First, create a payment intent
                val createUrl = URL("$BACKEND_URL/payment_intents")
                val createConnection = createUrl.openConnection() as HttpURLConnection
                createConnection.requestMethod = "POST"
                createConnection.setRequestProperty("Content-Type", "application/json")
                createConnection.doOutput = true

                val createPayload = JSONObject().apply {
                    put("amount", amount)
                    put("merchant_id", MERCHANT_WALLET)
                    put("currency", "USDC")
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
}

