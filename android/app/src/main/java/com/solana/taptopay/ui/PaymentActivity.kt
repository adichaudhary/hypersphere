package com.solana.taptopay.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solana.taptopay.databinding.ActivityPaymentBinding
import com.solana.taptopay.network.PaymentApiClient
import com.solana.taptopay.nfc.NfcManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class PaymentActivity : AppCompatActivity() {
    private lateinit var binding: ActivityPaymentBinding
    private lateinit var apiClient: PaymentApiClient
    private lateinit var nfcManager: NfcManager
    private var paymentId: String? = null
    private var isPolling = false

    companion object {
        private const val BACKEND_URL = "http://192.168.1.100:3001"
        private const val POLL_INTERVAL = 1000L // 1 second
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityPaymentBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        apiClient = PaymentApiClient(BACKEND_URL)
        nfcManager = NfcManager(this)
        
        paymentId = intent.getStringExtra("payment_id")
        val paymentUrl = intent.getStringExtra("payment_url")
        val amount = intent.getLongExtra("amount", 0)
        
        setupUI(amount)
        
        // Start NFC broadcast
        if (nfcManager.isNfcSupported()) {
            if (nfcManager.isNfcEnabled() && paymentUrl != null) {
                nfcManager.broadcastPaymentUrl(paymentUrl) { success ->
                    if (success) {
                        binding.nfcStatus.text = "📱 NFC Broadcasting..."
                    } else {
                        binding.nfcStatus.text = "❌ NFC Failed"
                        Toast.makeText(this, "NFC broadcast failed", Toast.LENGTH_SHORT).show()
                    }
                }
            } else {
                binding.nfcStatus.text = "❌ NFC Not Enabled"
            }
        } else {
            binding.nfcStatus.text = "❌ NFC Not Supported"
        }
        
        // Start polling for payment
        startPolling()
        
        binding.backBtn.setOnClickListener {
            nfcManager.disableBroadcast()
            finish()
        }
    }

    private fun setupUI(amount: Long) {
        binding.amountDisplay.text = "◎ ${amount / 1_000_000.0} SOL"
        binding.statusText.text = "Waiting for payment..."
        binding.paymentIcon.text = "⏳"
    }

    private fun startPolling() {
        if (isPolling || paymentId == null) return
        
        isPolling = true
        lifecycleScope.launch {
            while (isPolling) {
                try {
                    val status = apiClient.getPaymentStatus(paymentId!!)
                    
                    when (status.status) {
                        "paid" -> {
                            handlePaymentSuccess(status.tx_signature)
                            isPolling = false
                            break
                        }
                        "pending" -> {
                            binding.statusText.text = "Waiting for payment..."
                        }
                        "failed" -> {
                            handlePaymentFailed()
                            isPolling = false
                            break
                        }
                    }
                } catch (e: Exception) {
                    binding.statusText.text = "Error: ${e.message}"
                }
                
                delay(POLL_INTERVAL)
            }
        }
    }

    private fun handlePaymentSuccess(txSignature: String?) {
        binding.statusText.text = "✅ Payment Received!"
        binding.paymentIcon.text = "✅"
        binding.txSignature.text = "TX: ${txSignature?.take(20)}..."
        binding.txSignature.visibility = android.view.View.VISIBLE
        
        nfcManager.disableBroadcast()
        
        Toast.makeText(this, "Payment confirmed!", Toast.LENGTH_SHORT).show()
    }

    private fun handlePaymentFailed() {
        binding.statusText.text = "❌ Payment Failed"
        binding.paymentIcon.text = "❌"
        nfcManager.disableBroadcast()
        
        Toast.makeText(this, "Payment failed", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        super.onDestroy()
        isPolling = false
        nfcManager.disableBroadcast()
    }
}
