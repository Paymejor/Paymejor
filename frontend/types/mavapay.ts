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
// API Request Types
// ============================================================================

export interface QuoteRequest {
  direction: 'btc-to-ngn' | 'ngn-to-btc';
  amount: string; // Amount in smallest unit (satoshis or kobo)
  sourceCurrency: 'BTCSAT' | 'NGNKOBO';
  targetCurrency: 'NGNKOBO' | 'BTCSAT';
}

export interface PayoutRequest {
  quoteId: string;
  bankAccountId: string;
  walletAddress: string;
}

export interface OnRampRequest {
  amount: string; // Amount in kobo
  lightningAddress: string; // User's Lightning wallet address
}

// ============================================================================
// API Response Types
// ============================================================================

export interface OnRampResponse {
  transactionId: string;
  mavaPayOrderId: string;
  paymentInstructions: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    amount: number; // In kobo
    reference: string;
  };
  btcAmount: number; // In satoshis
  exchangeRate: number;
  expiresAt: string;
}

export interface PayoutInitiationResponse {
  transactionId: string;
  mavaPayOrderId: string;
  invoice: string; // Lightning invoice to pay
  amount: number;
  status: 'pending_payment';
  expiresAt: string;
}

// ============================================================================
// Bank Account Types
// ============================================================================

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  nipBankCode: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface StoredBankAccount {
  id: string;
  walletAddress: string;
  bankName: string;
  accountNumber: string; // Encrypted
  accountName: string;
  nipBankCode: string;
  isVerified: boolean;
  createdAt: string;
}

// ============================================================================
// Transaction Types
// ============================================================================

export type RampTransactionType = 'on-ramp' | 'off-ramp';
export type RampTransactionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RampTransaction {
  id: string;
  type: RampTransactionType;
  status: RampTransactionStatus;
  sourceAmount: string;
  sourceCurrency: string;
  targetAmount: string;
  targetCurrency: string;
  exchangeRate: number;
  fees: string;
  mavaPayOrderId?: string;
  mavaPayHash?: string;
  bankReference?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletion?: Date;
  errorMessage?: string;
}

export interface StoredRampTransaction {
  id: string;
  walletAddress: string;
  type: RampTransactionType;
  status: RampTransactionStatus;
  
  // Amounts
  sourceAmount: string;
  sourceCurrency: string;
  targetAmount: string;
  targetCurrency: string;
  
  // Rates and fees
  exchangeRate: number;
  transactionFees: string;
  networkFees: string;
  totalFees: string;
  
  // MavaPay details
  mavaPayQuoteId?: string;
  mavaPayOrderId?: string;
  mavaPayHash?: string;
  lightningInvoice?: string;
  
  // Bank details (for off-ramp)
  bankAccountId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankReference?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  completedAt?: string;
  
  // Error handling
  errorMessage?: string;
  retryCount: number;
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

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public endpoint: string,
    message: string,
    public retryable: boolean
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class PaymentError extends Error {
  constructor(
    public type: 'insufficient_balance' | 'payment_failed' | 'timeout',
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class WebhookError extends Error {
  constructor(
    public webhookId: string,
    public event: string,
    message: string
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}
