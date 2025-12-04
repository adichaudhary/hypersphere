import axios from 'axios';

const CIRCLE_API_URL = process.env.CIRCLE_API_URL || 'https://api.circle.com/v1';
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY || '';

export class CircleClient {
  constructor(apiKey = CIRCLE_API_KEY) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: CIRCLE_API_URL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Create a new Circle account for a merchant
   */
  async createMerchantAccount(merchantId, merchantName, email) {
    try {
      const response = await this.client.post('/wallets', {
        idempotencyKey: `merchant-${merchantId}-${Date.now()}`,
        description: `Wallet for ${merchantName}`,
        metadata: {
          merchantId,
          merchantName,
          email,
          createdAt: new Date().toISOString(),
        },
      });

      return {
        walletId: response.data.data.walletId,
        address: response.data.data.addresses?.[0]?.address,
        currency: 'USD',
      };
    } catch (error) {
      console.error('Error creating Circle account:', error.response?.data || error.message);
      throw new Error(`Failed to create Circle account: ${error.message}`);
    }
  }

  /**
   * Get merchant wallet balance
   */
  async getWalletBalance(walletId) {
    try {
      const response = await this.client.get(`/wallets/${walletId}`);
      const balances = response.data.data.balances || [];
      
      return {
        walletId,
        balances: balances.map(b => ({
          currency: b.currency,
          amount: b.amount,
        })),
        totalUsd: balances
          .filter(b => b.currency === 'USD')
          .reduce((sum, b) => sum + parseFloat(b.amount || 0), 0),
      };
    } catch (error) {
      console.error('Error getting wallet balance:', error.response?.data || error.message);
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }

  /**
   * Create a transfer (sweep USDC to Circle)
   */
  async createTransfer(fromWalletId, toAddress, amount, currency = 'USDC') {
    try {
      const response = await this.client.post('/transfers', {
        idempotencyKey: `transfer-${fromWalletId}-${Date.now()}`,
        source: {
          type: 'wallet',
          id: fromWalletId,
        },
        destination: {
          type: 'blockchain',
          address: toAddress,
          chain: 'SOL', // Solana
        },
        amount: {
          amount: amount.toString(),
          currency,
        },
      });

      return {
        transferId: response.data.data.id,
        status: response.data.data.status,
        amount: response.data.data.amount.amount,
        currency: response.data.data.amount.currency,
      };
    } catch (error) {
      console.error('Error creating transfer:', error.response?.data || error.message);
      throw new Error(`Failed to create transfer: ${error.message}`);
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId) {
    try {
      const response = await this.client.get(`/transfers/${transferId}`);
      
      return {
        transferId: response.data.data.id,
        status: response.data.data.status,
        amount: response.data.data.amount.amount,
        currency: response.data.data.amount.currency,
        createDate: response.data.data.createDate,
        updateDate: response.data.data.updateDate,
      };
    } catch (error) {
      console.error('Error getting transfer status:', error.response?.data || error.message);
      throw new Error(`Failed to get transfer status: ${error.message}`);
    }
  }

  /**
   * Get transaction history for a wallet
   */
  async getWalletTransactions(walletId, limit = 50) {
    try {
      const response = await this.client.get(`/wallets/${walletId}/transactions`, {
        params: { limit },
      });

      return {
        walletId,
        transactions: (response.data.data || []).map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount?.amount,
          currency: tx.amount?.currency,
          status: tx.status,
          createDate: tx.createDate,
          description: tx.description,
        })),
      };
    } catch (error) {
      console.error('Error getting transactions:', error.response?.data || error.message);
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  /**
   * Get all payments for merchant reporting
   */
  async getMerchantReport(walletId) {
    try {
      const walletInfo = await this.getWalletBalance(walletId);
      const transactions = await this.getWalletTransactions(walletId);

      // Calculate volume
      const incomingTransactions = transactions.transactions.filter(tx => 
        (tx.type === 'payment' || tx.type === 'deposit') && tx.status === 'confirmed'
      );

      const totalVolume = incomingTransactions.reduce((sum, tx) => {
        return sum + (parseFloat(tx.amount) || 0);
      }, 0);

      return {
        walletId,
        currentBalance: walletInfo.totalUsd,
        totalVolume,
        transactionCount: incomingTransactions.length,
        transactions: incomingTransactions.map(tx => ({
          id: tx.id,
          amount: tx.amount,
          currency: tx.currency,
          timestamp: tx.createDate,
          status: tx.status,
        })),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating merchant report:', error);
      throw error;
    }
  }
}

export default CircleClient;
