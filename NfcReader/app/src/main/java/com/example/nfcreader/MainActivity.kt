package com.example.nfcreader

import android.app.Activity
import android.content.Intent
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.net.Uri
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import com.example.nfcreader.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var nfcAdapter: NfcAdapter? = null

    companion object {
        private const val TAG = "NfcReader"
        // Simple SELECT APDU that will trigger a response from the HCE service
        private val SELECT_APDU = byteArrayOf(
            0x00.toByte(),
            0xA4.toByte(),
            0x04.toByte(),
            0x00.toByte()
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        if (nfcAdapter == null) {
            binding.statusText.text = "NFC is not available on this device."
        } else {
            binding.statusText.text = "NFC Reader ready.\nTap this phone against the HCE Sender."
        }
    }

    override fun onResume() {
        super.onResume()
        enableReaderMode()
    }

    override fun onPause() {
        super.onPause()
        disableReaderMode()
    }

    private fun enableReaderMode() {
        val adapter = nfcAdapter ?: return

        adapter.enableReaderMode(
            this as Activity,
            { tag: Tag? ->
                if (tag == null) {
                    Log.e(TAG, "Null tag received")
                    return@enableReaderMode
                }
                handleTag(tag)
            },
            NfcAdapter.FLAG_READER_NFC_A or
                    NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK,
            null
        )
        Log.d(TAG, "Reader mode enabled")
    }

    private fun disableReaderMode() {
        nfcAdapter?.disableReaderMode(this)
        Log.d(TAG, "Reader mode disabled")
    }

    private fun handleTag(tag: Tag) {
        try {
            val isoDep = IsoDep.get(tag)
            if (isoDep == null) {
                Log.e(TAG, "IsoDep not supported by this tag")
                runOnUiThread {
                    Toast.makeText(this, "Tag is not IsoDep", Toast.LENGTH_SHORT).show()
                }
                return
            }

            isoDep.connect()
            Log.d(TAG, "Connected to IsoDep tag")

            val response = isoDep.transceive(SELECT_APDU)
            isoDep.close()

            Log.d(TAG, "Received response: ${response.toHexString()}")

            // Strip off trailing 90 00 if present
            val payload = if (response.size > 2 &&
                response[response.size - 2] == 0x90.toByte() &&
                response[response.size - 1] == 0x00.toByte()
            ) {
                response.copyOfRange(0, response.size - 2)
            } else {
                response
            }

            val url = String(payload, Charsets.UTF_8)
            Log.d(TAG, "Parsed URL: $url")

            runOnUiThread {
                binding.statusText.text = "Received URL:\n$url"
            }

            openUrl(url)
        } catch (e: Exception) {
            Log.e(TAG, "Error handling tag", e)
            runOnUiThread {
                Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun openUrl(url: String) {
        try {
            val uri = Uri.parse(url)
            val intent = Intent(Intent.ACTION_VIEW, uri)
            startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Invalid URL", e)
            runOnUiThread {
                Toast.makeText(this, "Invalid URL", Toast.LENGTH_LONG).show()
            }
        }
    }
}

private fun ByteArray.toHexString(): String =
    joinToString(" ") { String.format("%02X", it) }

