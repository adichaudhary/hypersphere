package com.example.hcesender

import android.nfc.cardemulation.HostApduService
import android.os.Bundle
import android.util.Log

class PaymentCardService : HostApduService() {

    companion object {
        private const val TAG = "PaymentCardService"
        // Optional: "90 00" success status
        private val STATUS_SUCCESS = byteArrayOf(0x90.toByte(), 0x00.toByte())
    }

    override fun processCommandApdu(commandApdu: ByteArray?, extras: Bundle?): ByteArray {
        if (commandApdu == null) return STATUS_SUCCESS

        Log.d(TAG, "Received APDU: ${commandApdu.toHexString()}")

        // TODO: put your real Phantom/Solana Pay URL here
        val phantomUrl =
            "https://phantom.app/ul/v1/transfer?to=7a9Fw8cwEru1GPpxwtUyXYHLAgSrY4XNemPjwBLLmHqVW&amount=0.01&network=mainnet-beta"

        val urlBytes = phantomUrl.toByteArray(Charsets.UTF_8)

        // Return URL + 0x9000 at the end
        return urlBytes + STATUS_SUCCESS
    }

    override fun onDeactivated(reason: Int) {
        Log.d(TAG, "Deactivated: reason=$reason")
    }
}

private fun ByteArray.toHexString(): String =
    joinToString(" ") { String.format("%02X", it) }

