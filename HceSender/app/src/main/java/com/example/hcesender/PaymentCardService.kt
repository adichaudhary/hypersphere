package com.example.hcesender

import android.content.Intent
import android.net.Uri
import android.nfc.cardemulation.HostApduService
import android.os.Bundle
import android.util.Log
import androidx.localbroadcastmanager.content.LocalBroadcastManager

class PaymentCardService : HostApduService() {

    companion object {
        private const val TAG = "PaymentCardService"
        private val STATUS_SUCCESS = byteArrayOf(0x90.toByte(), 0x00.toByte())

        private const val PREFS_NAME = "hce_sender_prefs"
        private const val KEY_RECIPIENT = "recipient"
        private const val KEY_AMOUNT = "amount"
        private const val KEY_CHAIN = "selected_chain"

        // Merchant wallet (IMPORTANT) - Default Solana wallet
        private const val MERCHANT_WALLET = "2Qw4fFW9MeKvJXPVfMWX6X324PaX8aAA8B9J2Xnv8PBF"
        
        // USDC mint/contract addresses (using CCTP service values)
        private const val USDC_MINT_SOLANA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // Solana mainnet USDC
        private const val USDC_CONTRACT_ETH = CCTPService.USDC_ETH // Ethereum mainnet USDC (from CCTP service)
        private const val USDC_CONTRACT_BASE = CCTPService.USDC_BASE // Base mainnet USDC (from CCTP service)
        
        // Chain IDs (using CCTP service values)
        private const val ETH_CHAIN_ID = "1" // Ethereum mainnet
        private const val BASE_CHAIN_ID = "8453" // Base mainnet
        
        // CCTP service instance
        private val cctpService = CCTPService()
        
        // Fixed amount for now
        private const val FIXED_AMOUNT = "0.01"
        
        private const val LABEL = "Hypersphere"
        private const val MESSAGE = "Tap to Pay"
        
        // Broadcast action for NFC scan detected
        const val ACTION_NFC_SCANNED = "com.example.hcesender.NFC_SCANNED"
    }

    override fun processCommandApdu(commandApdu: ByteArray?, extras: Bundle?): ByteArray {
        if (commandApdu == null) return STATUS_SUCCESS

        Log.d(TAG, "Received APDU: ${commandApdu.toHexString()}")
        Log.d(TAG, "APDU length: ${commandApdu.size}")

        // Check if this is a SELECT command (NFC reader scanning)
        val isSelectCommand = commandApdu.size >= 2 && 
                              commandApdu[0] == 0x00.toByte() && 
                              commandApdu[1] == 0xA4.toByte()

        if (isSelectCommand) {
            Log.d(TAG, "NFC reader scanning detected - triggering success animation")
            
            // Send broadcast to MainActivity to trigger success animation
            val intent = Intent(ACTION_NFC_SCANNED)
            LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
        }

        // Read amount, recipient wallet, and selected chain from SharedPreferences
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val amount = prefs.getString(KEY_AMOUNT, FIXED_AMOUNT) ?: FIXED_AMOUNT
        val selectedChain = prefs.getString(KEY_CHAIN, "SOL") ?: "SOL"
        
        // Get recipient wallet from preferences
        val recipientWallet = prefs.getString(KEY_RECIPIENT, MERCHANT_WALLET) ?: MERCHANT_WALLET

        // Generate payment URL based on selected chain
        val paymentUrl = when (selectedChain) {
            "SOL" -> {
                // SOL uses Solana Pay format (opens Phantom on Solana network)
                // Format: solana:<recipient>?amount=<amount>&spl-token=<spl-token>&label=<label>&message=<message>
                val labelEncoded = Uri.encode(LABEL)
                val messageEncoded = Uri.encode(MESSAGE)
                "solana:$recipientWallet" +
                    "?amount=$amount" +
                    "&spl-token=$USDC_MINT_SOLANA" +
                    "&label=$labelEncoded" +
                    "&message=$messageEncoded"
            }
            "ETH" -> {
                // ETH uses MetaMask deep link format for Ethereum mainnet
                // Uses CCTP service to ensure correct Ethereum network USDC contract
                val amountDouble = amount.toDoubleOrNull() ?: 0.0
                cctpService.generatePaymentUrl("ETH", recipientWallet, amountDouble, false)
            }
            "BASE" -> {
                // Base Pay - opens MetaMask on Base network and prompts transaction
                // Uses CCTP service to ensure correct Base network USDC contract
                val amountDouble = amount.toDoubleOrNull() ?: 0.0
                cctpService.generatePaymentUrl("BASE", recipientWallet, amountDouble, false)
            }
            else -> {
                // Default to Solana Pay (Phantom)
                val labelEncoded = Uri.encode(LABEL)
                val messageEncoded = Uri.encode(MESSAGE)
                "solana:$recipientWallet" +
                    "?amount=$amount" +
                    "&spl-token=$USDC_MINT_SOLANA" +
                    "&label=$labelEncoded" +
                    "&message=$messageEncoded"
            }
        }

        Log.d(TAG, "Serving payment URL for chain $selectedChain: $paymentUrl")
        Log.d(TAG, "Merchant: $recipientWallet, Amount: $amount USDC, Chain: $selectedChain")

        // Convert to bytes and append 0x90 0x00
        val urlBytes = paymentUrl.toByteArray(Charsets.UTF_8)
        val response = urlBytes + STATUS_SUCCESS
        
        Log.d(TAG, "Response total length: ${response.size} bytes")
        val previewSize = minOf(150, response.size)
        Log.d(TAG, "Response hex (first $previewSize bytes): ${response.copyOfRange(0, previewSize).toHexString()}")
        
        return response
    }

    override fun onDeactivated(reason: Int) {
        Log.d(TAG, "Deactivated: reason=$reason")
    }
}

private fun ByteArray.toHexString(): String =
    joinToString(" ") { String.format("%02X", it) }

