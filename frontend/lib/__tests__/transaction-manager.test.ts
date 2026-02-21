/**
 * Transaction Manager Unit Tests
 * 
 * Tests for transaction storage, retrieval, and status updates
 * Validates requirements 5.1-5.6
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTransaction,
  updateTransactionStatus,
  getTransactionById,
  getTransactionByOrderId,
  getTransactionByHash,
  getTransactionsByWallet,
  getAllTransactions,
  deleteTransaction,
  clearTransactionsByWallet,
  clearAllTransactions,
  isTransactionPending,
  isTransactionCompleted,
  isTransactionFailed,
  getEstimatedCompletion,
  getTransactionStats,
  incrementRetryCount,
  setTransactionError,
} from '../transaction-manager';
import { StoredRampTransaction } from '@/types/mavapay';

describe('Transaction Manager', () => {
  const mockWalletAddress = '0x1234567890abcdef';
  const mockWalletAddress2 = '0xabcdef1234567890';

  beforeEach(() => {
    // Clear all transactions before each test
    clearAllTransactions();
  });

  afterEach(() => {
    // Clean up after each test
    clearAllTransactions();
  });

  describe('createTransaction', () => {
    it('should create a new transaction with unique ID and timestamps', () => {
      const transactionData: Omit<StoredRampTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      };

      const transaction = createTransaction(transactionData);

      expect(transaction.id).toBeDefined();
      expect(transaction.createdAt).toBeDefined();
      expect(transaction.updatedAt).toBeDefined();
      expect(transaction.walletAddress).toBe(mockWalletAddress);
      expect(transaction.type).toBe('off-ramp');
      expect(transaction.status).toBe('pending');
    });

    it('should create transactions with unique IDs', () => {
      const transactionData: Omit<StoredRampTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
        walletAddress: mockWalletAddress,
        type: 'on-ramp',
        status: 'pending',
        sourceAmount: '50000000',
        sourceCurrency: 'NGNKOBO',
        targetAmount: '1000000',
        targetCurrency: 'BTCSAT',
        exchangeRate: 0.02,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      };

      const tx1 = createTransaction(transactionData);
      const tx2 = createTransaction(transactionData);

      expect(tx1.id).not.toBe(tx2.id);
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status and timestamp', async () => {
      const transaction = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      const originalUpdatedAt = transaction.updatedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));
      const updated = updateTransactionStatus(transaction.id, 'processing');

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('processing');
      expect(updated!.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should set completedAt when status changes to completed', () => {
      const transaction = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      const updated = updateTransactionStatus(transaction.id, 'completed');

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('completed');
      expect(updated!.completedAt).toBeDefined();
    });

    it('should update additional data when provided', () => {
      const transaction = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      const updated = updateTransactionStatus(transaction.id, 'processing', {
        mavaPayOrderId: 'order-123',
        mavaPayHash: 'hash-456',
      });

      expect(updated).not.toBeNull();
      expect(updated!.mavaPayOrderId).toBe('order-123');
      expect(updated!.mavaPayHash).toBe('hash-456');
    });

    it('should return null for non-existent transaction', () => {
      const updated = updateTransactionStatus('non-existent-id', 'completed');
      expect(updated).toBeNull();
    });
  });

  describe('getTransactionById', () => {
    it('should retrieve transaction by ID', () => {
      const transaction = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      const retrieved = getTransactionById(transaction.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(transaction.id);
    });

    it('should return null for non-existent ID', () => {
      const retrieved = getTransactionById('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('getTransactionByOrderId', () => {
    it('should retrieve transaction by MavaPay order ID', () => {
      const transaction = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        mavaPayOrderId: 'order-123',
        retryCount: 0,
      });

      const retrieved = getTransactionByOrderId('order-123');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.mavaPayOrderId).toBe('order-123');
    });
  });

  describe('getTransactionByHash', () => {
    it('should retrieve transaction by MavaPay hash', () => {
      const transaction = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        mavaPayHash: 'hash-456',
        retryCount: 0,
      });

      const retrieved = getTransactionByHash('hash-456');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.mavaPayHash).toBe('hash-456');
    });
  });

  describe('getTransactionsByWallet', () => {
    beforeEach(() => {
      // Create multiple transactions for testing
      createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'completed',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      createTransaction({
        walletAddress: mockWalletAddress,
        type: 'on-ramp',
        status: 'pending',
        sourceAmount: '50000000',
        sourceCurrency: 'NGNKOBO',
        targetAmount: '1000000',
        targetCurrency: 'BTCSAT',
        exchangeRate: 0.02,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      createTransaction({
        walletAddress: mockWalletAddress2,
        type: 'off-ramp',
        status: 'failed',
        sourceAmount: '2000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '100000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '2000',
        networkFees: '1000',
        totalFees: '3000',
        retryCount: 0,
      });
    });

    it('should retrieve all transactions for a wallet', () => {
      const transactions = getTransactionsByWallet(mockWalletAddress);
      expect(transactions).toHaveLength(2);
    });

    it('should filter by transaction type', () => {
      const transactions = getTransactionsByWallet(mockWalletAddress, { type: 'off-ramp' });
      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('off-ramp');
    });

    it('should filter by transaction status', () => {
      const transactions = getTransactionsByWallet(mockWalletAddress, { status: 'pending' });
      expect(transactions).toHaveLength(1);
      expect(transactions[0].status).toBe('pending');
    });

    it('should sort transactions by createdAt descending by default', () => {
      const transactions = getTransactionsByWallet(mockWalletAddress);
      expect(transactions.length).toBeGreaterThan(1);
      
      // Most recent should be first
      const dates = transactions.map(tx => new Date(tx.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    it('should limit results when specified', () => {
      const transactions = getTransactionsByWallet(mockWalletAddress, { limit: 1 });
      expect(transactions).toHaveLength(1);
    });
  });

  describe('deleteTransaction', () => {
    it('should delete a transaction', () => {
      const transaction = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      const deleted = deleteTransaction(transaction.id);
      expect(deleted).toBe(true);

      const retrieved = getTransactionById(transaction.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent transaction', () => {
      const deleted = deleteTransaction('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('clearTransactionsByWallet', () => {
    it('should clear all transactions for a wallet', () => {
      createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      createTransaction({
        walletAddress: mockWalletAddress2,
        type: 'on-ramp',
        status: 'pending',
        sourceAmount: '50000000',
        sourceCurrency: 'NGNKOBO',
        targetAmount: '1000000',
        targetCurrency: 'BTCSAT',
        exchangeRate: 0.02,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      const deletedCount = clearTransactionsByWallet(mockWalletAddress);
      expect(deletedCount).toBe(1);

      const transactions = getTransactionsByWallet(mockWalletAddress);
      expect(transactions).toHaveLength(0);

      const otherTransactions = getTransactionsByWallet(mockWalletAddress2);
      expect(otherTransactions).toHaveLength(1);
    });
  });

  describe('Transaction Status Helpers', () => {
    it('should identify pending transactions', () => {
      const pendingTx = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      expect(isTransactionPending(pendingTx)).toBe(true);
      expect(isTransactionCompleted(pendingTx)).toBe(false);
      expect(isTransactionFailed(pendingTx)).toBe(false);
    });

    it('should identify completed transactions', () => {
      const completedTx = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'completed',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      expect(isTransactionPending(completedTx)).toBe(false);
      expect(isTransactionCompleted(completedTx)).toBe(true);
      expect(isTransactionFailed(completedTx)).toBe(false);
    });

    it('should identify failed transactions', () => {
      const failedTx = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'failed',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      expect(isTransactionPending(failedTx)).toBe(false);
      expect(isTransactionCompleted(failedTx)).toBe(false);
      expect(isTransactionFailed(failedTx)).toBe(true);
    });
  });

  describe('getEstimatedCompletion', () => {
    it('should return null for completed transactions', () => {
      const completedTx = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'completed',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      expect(getEstimatedCompletion(completedTx)).toBeNull();
    });

    it('should use expiresAt if available', () => {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const pendingTx = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        expiresAt,
        retryCount: 0,
      });

      const estimated = getEstimatedCompletion(pendingTx);
      expect(estimated).not.toBeNull();
      expect(estimated!.toISOString()).toBe(expiresAt);
    });

    it('should estimate based on transaction type', () => {
      const onRampTx = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'on-ramp',
        status: 'pending',
        sourceAmount: '50000000',
        sourceCurrency: 'NGNKOBO',
        targetAmount: '1000000',
        targetCurrency: 'BTCSAT',
        exchangeRate: 0.02,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      const estimated = getEstimatedCompletion(onRampTx);
      expect(estimated).not.toBeNull();
      
      const createdAt = new Date(onRampTx.createdAt);
      const estimatedTime = estimated!.getTime() - createdAt.getTime();
      
      // On-ramp should estimate 30 minutes
      expect(estimatedTime).toBeGreaterThanOrEqual(29 * 60 * 1000);
      expect(estimatedTime).toBeLessThanOrEqual(31 * 60 * 1000);
    });
  });

  describe('getTransactionStats', () => {
    beforeEach(() => {
      createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'completed',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      createTransaction({
        walletAddress: mockWalletAddress,
        type: 'on-ramp',
        status: 'pending',
        sourceAmount: '50000000',
        sourceCurrency: 'NGNKOBO',
        targetAmount: '1000000',
        targetCurrency: 'BTCSAT',
        exchangeRate: 0.02,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'failed',
        sourceAmount: '2000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '100000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '2000',
        networkFees: '1000',
        totalFees: '3000',
        retryCount: 0,
      });
    });

    it('should return correct transaction statistics', () => {
      const stats = getTransactionStats(mockWalletAddress);

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.onRamp).toBe(1);
      expect(stats.offRamp).toBe(2);
    });
  });

  describe('incrementRetryCount', () => {
    it('should increment retry count', () => {
      const transaction = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      const updated = incrementRetryCount(transaction.id);
      expect(updated).not.toBeNull();
      expect(updated!.retryCount).toBe(1);

      const updated2 = incrementRetryCount(transaction.id);
      expect(updated2!.retryCount).toBe(2);
    });
  });

  describe('setTransactionError', () => {
    it('should set error message and mark as failed', () => {
      const transaction = createTransaction({
        walletAddress: mockWalletAddress,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: '1000000',
        sourceCurrency: 'BTCSAT',
        targetAmount: '50000000',
        targetCurrency: 'NGNKOBO',
        exchangeRate: 50,
        transactionFees: '1000',
        networkFees: '500',
        totalFees: '1500',
        retryCount: 0,
      });

      const errorMessage = 'Payment failed: Insufficient balance';
      const updated = setTransactionError(transaction.id, errorMessage);

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('failed');
      expect(updated!.errorMessage).toBe(errorMessage);
    });
  });
});
