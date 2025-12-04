package com.solana.taptopay.network

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import com.google.gson.Gson
import com.google.gson.JsonObject
import java.util.concurrent.TimeUnit

class PaymentApiClient(private val baseUrl: String) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()

    data class PaymentIntent(
        val id: String,
        val amount: Long,
        val merchant_id: String,
        val nonce: String,
        val payment_url: String
    )

    data class PaymentStatus(
        val id: String,
        val status: String,
        val tx_signature: String?,
        val amount: Long,
        val merchant_id: String,
        val created_at: String,
        val updated_at: String
    )

    suspend fun createPaymentIntent(amount: Long, merchantId: String): PaymentIntent {
        val json = JsonObject().apply {
            addProperty("amount", amount)
            addProperty("merchant_id", merchantId)
        }

        val requestBody = json.toString().toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url("$baseUrl/payment_intents")
            .post(requestBody)
            .build()

        return client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw Exception("Failed to create payment: ${response.code}")
            val body = response.body?.string() ?: throw Exception("Empty response")
            gson.fromJson(body, PaymentIntent::class.java)
        }
    }

    suspend fun getPaymentStatus(paymentId: String): PaymentStatus {
        val request = Request.Builder()
            .url("$baseUrl/payment_intents/$paymentId/status")
            .get()
            .build()

        return client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw Exception("Failed to get status: ${response.code}")
            val body = response.body?.string() ?: throw Exception("Empty response")
            gson.fromJson(body, PaymentStatus::class.java)
        }
    }
}
