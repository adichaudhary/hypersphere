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
import com.example.hcesender.databinding.ActivityMainBinding
import java.text.NumberFormat
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var currentState = PaymentState.IDLE
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var nfcScanReceiver: BroadcastReceiver

    companion object {
        const val PREFS_NAME = "hce_sender_prefs"
        const val KEY_RECIPIENT = "recipient"
        const val KEY_AMOUNT = "amount"

        // Merchant wallet (hardcoded for consistency with PaymentCardService)
        const val MERCHANT_WALLET = "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U"
        const val DEFAULT_AMOUNT = "0.01"
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
            
            // Reset to idle after 3 seconds
            handler.postDelayed({
                setState(PaymentState.IDLE)
            }, 3000)
        }
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

