/**
 * MavaPay API Types
 * 
 * Type definitions for MavaPay API requests and responses
 * Based on MavaPay API documentation
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface MavaPayConfig {
  apiKey: string;
  baseUrl: string;
  webhookSecret: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// ============================================================================
// Quote Types
// ============================================================================

export interface QuoteParams {
  sourceCurrency: 'BTCSAT' | 'NGNKOBO';
  targetCurrency: 'NGNKOBO' | 'BTCSAT';
  amount: number;
  paymentMethod: 'LIGHTNING';
  autopayout?: boolean;
  paymentCurrency?: 'NGNKOBO' | 'BTCSAT';
  beneficiary?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export interface QuoteResponse {
  id: string;
  exchangeRate: number;
  usdToTargetCurrencyRate: number;
  sourceCurrency: string;
  targetCurrency: string;
  transactionFeesInSourceCurrency: number;
  transactionFeesInTargetCurrency: number;
  amountInSourceCurrency: number;
  amountInTargetCurrency: number;
  paymentMethod: 'LIGHTNING';
  expiry: string; // ISO 8601 timestamp
  isValid: boolean;
  invoice?: string; // Lightning invoice for off-ramp
  totalAmountInSourceCurrency: number;
}

// ============================================================================
// Payout Types
// ============================================================================

export interface PayoutParams {
  quoteId: string;
  beneficiary: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export interface PayoutResponse {
  id: string;
  walletId: string;
  ref: string;
  hash: string;
  amount: number;
  fees: number;
  currency: 'NGN' | 'BTC';
  type: 'DEPOSIT' | 'WITHDRAWAL';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  autopayout: boolean;
  createdAt: string;
  updatedAt: string;
  transactionMetadata: {
    orderId: string;
    reference: string;
    merchantId: string;
    bankName?: string;
    bankAccountNumber?: string;
    customerInternalFee: string;
  };
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface TransactionResponse {
  id: string;
  walletId: string;
  ref: string;
  hash: string;
  amount: number;
  fees: number;
  currency: 'NGN' | 'BTC';
  type: 'DEPOSIT' | 'WITHDRAWAL';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  autopayout: boolean;
  createdAt: string;
  updatedAt: string;
  transactionMetadata: {
    orderId: string;
    reference: string;
    merchantId: string;
    bankName?: string;
    bankAccountNumber?: string;
    customerInternalFee: string;
  };
}

// ============================================================================
// Bank Types
// ============================================================================

export interface BankListResponse {
  banks: Array<{
    name: string;
    code: string;
    nipBankCode: string;
  }>;
}

export interface BankVerificationParams {
  accountNumber: string;
  bankCode: string;
}

export interface BankVerificationResponse {
  isValid: boolean;
  accountName?: string;
  errorMessage?: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookEvent {
  event: 'payment.received' | 'payment.sent' | 'payout.completed' | 'payout.failed';
  data: {
    id: string;
    walletId: string;
    ref: string;
    hash: string;
    amount: number;
    fees: number;
    currency: 'NGN' | 'BTC';
    type: 'DEPOSIT' | 'WITHDRAWAL';
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    autopayout: boolean;
    createdAt: string;
    updatedAt: string;
    transactionMetadata: {
      orderId: string;
      reference: string;
      merchantId: string;
      bankName?: string;
      bankAccountNumber?: string;
      customerInternalFee: string;
    };
  };
}

// ============================================================================
// Error Types
// ============================================================================

export class MavaPayError extends Error {
  constructor(
    public statusCode: number,
    public endpoint: string,
    message: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'MavaPayError';
  }
}
