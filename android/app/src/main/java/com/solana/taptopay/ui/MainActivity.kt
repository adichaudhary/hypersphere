package com.solana.taptopay.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solana.taptopay.databinding.ActivityMainBinding
import com.solana.taptopay.network.PaymentApiClient
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var apiClient: PaymentApiClient
    
    companion object {
        private const val BACKEND_URL = "http://192.168.1.100:3001" // Change to your backend IP
        private const val MERCHANT_ID = "android-merchant-01"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        apiClient = PaymentApiClient(BACKEND_URL)
        
        binding.createPaymentBtn.setOnClickListener {
            handleCreatePayment()
        }
    }

    private fun handleCreatePayment() {
        val amountStr = binding.amountInput.text.toString().trim()
        
        if (amountStr.isEmpty()) {
            binding.statusText.text = "Please enter an amount"
            return
        }

        val amount = try {
            amountStr.toLong()
        } catch (e: NumberFormatException) {
            binding.statusText.text = "Invalid amount"
            return
        }

        binding.statusText.text = "Creating payment..."
        binding.createPaymentBtn.isEnabled = false

        lifecycleScope.launch {
            try {
                val paymentIntent = apiClient.createPaymentIntent(amount, MERCHANT_ID)
                
                // Navigate to payment screen
                val intent = Intent(this@MainActivity, PaymentActivity::class.java).apply {
                    putExtra("payment_id", paymentIntent.id)
                    putExtra("payment_url", paymentIntent.payment_url)
                    putExtra("amount", paymentIntent.amount)
                }
                startActivity(intent)
                
            } catch (e: Exception) {
                binding.statusText.text = "Error: ${e.message}"
                binding.createPaymentBtn.isEnabled = true
            }
        }
    }
}
