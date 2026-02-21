/**
 * MavaPay API Client
 * 
 * Handles all interactions with the MavaPay API including:
 * - Quote management
 * - Payout operations
 * - Bank operations
 * - Webhook signature verification
 * - Retry logic with exponential backoff
 * 
 * Requirements: 3.1, 3.2, 3.6, 3.7
 */

import {
  MavaPayConfig,
  QuoteParams,
  QuoteResponse,
  PayoutParams,
  PayoutResponse,
  TransactionResponse,
  BankListResponse,
  BankVerificationParams,
  BankVerificationResponse,
  MavaPayError,
} from '@/types/mavapay';

export class MavaPayClient {
  private config: MavaPayConfig;

  constructor(config: MavaPayConfig) {
    this.config = config;
  }

  /**
   * Create a quote for currency conversion
   * Requirements: 3.3
   */
  async createQuote(params: QuoteParams): Promise<QuoteResponse> {
    return this.makeRequest<QuoteResponse>('/v1/quotes', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get an existing quote by ID
   */
  async getQuote(quoteId: string): Promise<QuoteResponse> {
    return this.makeRequest<QuoteResponse>(`/v1/quotes/${quoteId}`, {
      method: 'GET',
    });
  }

  /**
   * Create a payout to a Nigerian bank account
   * Requirements: 3.4
   */
  async createPayout(params: PayoutParams): Promise<PayoutResponse> {
    return this.makeRequest<PayoutResponse>('/v1/payouts', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get transaction details by ID
   */
  async getTransaction(transactionId: string): Promise<TransactionResponse> {
    return this.makeRequest<TransactionResponse>(`/v1/transactions/${transactionId}`, {
      method: 'GET',
    });
  }

  /**
   * Get transactions by Lightning payment hash
   */
  async getTransactionByHash(hash: string): Promise<TransactionResponse[]> {
    return this.makeRequest<TransactionResponse[]>(`/v1/transactions?hash=${hash}`, {
      method: 'GET',
    });
  }

  /**
   * Get list of supported Nigerian banks
   */
  async getBanks(country: string = 'NG'): Promise<BankListResponse> {
    return this.makeRequest<BankListResponse>(`/v1/banks?country=${country}`, {
      method: 'GET',
    });
  }

  /**
   * Verify a Nigerian bank account
   * Requirements: 4.2
   */
  async verifyBankAccount(params: BankVerificationParams): Promise<BankVerificationResponse> {
    try {
      const response = await this.makeRequest<{ accountName: string }>(
        '/v1/banks/verify',
        {
          method: 'POST',
          body: JSON.stringify(params),
        }
      );
      
      return {
        isValid: true,
        accountName: response.accountName,
      };
    } catch (error) {
      if (error instanceof MavaPayError) {
        return {
          isValid: false,
          errorMessage: error.message,
        };
      }
      throw error;
    }
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   * Requirements: 3.5, 9.1
   * 
   * Note: This method should only be called on the server-side (API routes)
   * as it requires the crypto module which is not available in the browser.
   */
  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    // Dynamic import of crypto module (only available in Node.js/server-side)
    if (typeof window !== 'undefined') {
      throw new Error('verifyWebhookSignature can only be called on the server-side');
    }

    const crypto = await import('crypto');
    
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Make HTTP request with retry logic and exponential backoff
   * Requirements: 3.6, 3.7
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Determine if error is retryable (5xx errors or network issues)
        const isRetryable = response.status >= 500 || response.status === 429;
        
        throw new MavaPayError(
          response.status,
          endpoint,
          errorMessage,
          isRetryable
        );
      }

      return await response.json();
    } catch (error: unknown) {
      // Handle network errors and timeouts
      if (error instanceof TypeError || (error as Error).name === 'AbortError') {
        const networkError = new MavaPayError(
          0,
          endpoint,
          'Network error or timeout',
          true
        );
        
        // Retry logic with exponential backoff
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
          return this.makeRequest<T>(endpoint, options, attempt + 1);
        }
        
        throw networkError;
      }

      // Handle MavaPayError with retry logic
      if (error instanceof MavaPayError && error.retryable) {
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
          return this.makeRequest<T>(endpoint, options, attempt + 1);
        }
      }

      throw error;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create MavaPay client instance from environment variables
 * Requirements: 3.1, 3.2
 */
export function createMavaPayClient(useSandbox: boolean = false): MavaPayClient {
  const config: MavaPayConfig = {
    apiKey: useSandbox
      ? process.env.MAVAPAY_SANDBOX_API_KEY || ''
      : process.env.MAVAPAY_API_KEY || '',
    baseUrl: useSandbox
      ? process.env.NEXT_PUBLIC_MAVAPAY_SANDBOX_URL || 'https://staging.api.mavapay.co'
      : process.env.NEXT_PUBLIC_MAVAPAY_API_URL || 'https://api.mavapay.co',
    webhookSecret: useSandbox
      ? process.env.MAVAPAY_SANDBOX_WEBHOOK_SECRET || ''
      : process.env.MAVAPAY_WEBHOOK_SECRET || '',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second base delay
  };

  return new MavaPayClient(config);
}
