package com.solana.taptopay.nfc

import android.app.Activity
import android.content.Context
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.NfcAdapter
import android.nfc.NfcAdapter.CreateNdefMessageCallback
import android.nfc.NfcEvent
import android.nfc.Ndef
import android.nfc.Tag
import android.os.Handler
import android.os.Looper

class NfcManager(private val context: Context) {
    private val nfcAdapter: NfcAdapter? = NfcAdapter.getDefaultAdapter(context)
    private var pushCallback: CreateNdefMessageCallback? = null

    fun isNfcEnabled(): Boolean = nfcAdapter?.isEnabled ?: false

    fun isNfcSupported(): Boolean = nfcAdapter != null

    /**
     * Broadcast a payment URL via Android's NDEF push (P2P). The provided context must be an Activity.
     */
    fun broadcastPaymentUrl(paymentUrl: String, resultCallback: (Boolean) -> Unit) {
        if (nfcAdapter == null) {
            resultCallback(false)
            return
        }

        if (context !is Activity) {
            resultCallback(false)
            return
        }

        // Create NDEF callback
        pushCallback = CreateNdefMessageCallback { _: NfcEvent? ->
            val uriRecord = NdefRecord.createUri(paymentUrl)
            NdefMessage(arrayOf(uriRecord))
        }

        // Register the callback with the activity so Android will push when a peer is nearby
        nfcAdapter.setNdefPushMessageCallback(pushCallback, context)

        Handler(Looper.getMainLooper()).post {
            resultCallback(true)
        }
    }

    fun disableBroadcast() {
        if (nfcAdapter == null) return
        if (context !is Activity) return
        nfcAdapter.setNdefPushMessageCallback(null as CreateNdefMessageCallback?, context)
        pushCallback = null
    }

    /** Read an NDEF tag and return the first text/uri payload if present */
    fun readNfcTag(tag: Tag?): String? {
        if (tag == null) return null

        val ndef = Ndef.get(tag) ?: return null
        val msg = ndef.cachedNdefMessage ?: return null
        val records = msg.records
        if (records == null || records.isEmpty()) return null

        val record = records[0]
        return try {
            // If it's a URI record
            if (record.tnf == NdefRecord.TNF_WELL_KNOWN && java.util.Arrays.equals(record.type, NdefRecord.RTD_URI)) {
                val payload = record.payload
                // Android stores URI prefix in first byte; simplest fallback: decode as UTF-8
                String(payload)
            } else {
                String(record.payload)
            }
        } catch (e: Exception) {
            null
        }
    }
}
