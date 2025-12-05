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

        // Merchant wallet (IMPORTANT)
        private const val MERCHANT_WALLET = "4UznnYY4AMzAmss6AqeAvqUs5KeWYNinzKE2uFFQZ16U"
        
        // USDC mint address on Solana mainnet
        private const val USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        
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

        // Read amount from SharedPreferences (merchant wallet is fixed)
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val amount = prefs.getString(KEY_AMOUNT, FIXED_AMOUNT) ?: FIXED_AMOUNT

        // Construct Solana Pay transfer request URL
        // Format: solana:<recipient>?amount=<amount>&spl-token=<spl-token>&label=<label>&message=<message>
        val labelEncoded = Uri.encode(LABEL)
        val messageEncoded = Uri.encode(MESSAGE)

        val solanaPayUrl = "solana:$MERCHANT_WALLET" +
            "?amount=$amount" +
            "&spl-token=$USDC_MINT" +
            "&label=$labelEncoded" +
            "&message=$messageEncoded"

        Log.d(TAG, "Serving Solana Pay URL: $solanaPayUrl")
        Log.d(TAG, "Merchant: $MERCHANT_WALLET, Amount: $amount USDC, Token: $USDC_MINT")

        // Convert to bytes and append 0x90 0x00
        val urlBytes = solanaPayUrl.toByteArray(Charsets.UTF_8)
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

