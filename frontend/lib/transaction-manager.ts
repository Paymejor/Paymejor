/**
 * Transaction Management Utilities
 * 
 * Handles storage, retrieval, and status updates for MavaPay ramp transactions
 * Implements requirements 5.1-5.6
 */

import { StoredRampTransaction, RampTransactionStatus, RampTransactionType } from '@/types/mavapay';

// ============================================================================
// Constants
// ============================================================================

const TRANSACTIONS_STORAGE_KEY = 'mavapay_transactions';

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Get all transactions from localStorage
 * @returns Array of stored transactions
 */
function getAllTransactionsFromStorage(): StoredRampTransaction[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading transactions from localStorage:', error);
    return [];
  }
}

/**
 * Save all transactions to localStorage
 * @param transactions - Array of transactions to save
 */
function saveAllTransactionsToStorage(transactions: StoredRampTransaction[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions to localStorage:', error);
    throw new Error('Failed to save transactions');
  }
}

// ============================================================================
// Transaction Management Functions
// ============================================================================

/**
 * Create a new transaction record
 * Requirement 5.1: Create transaction record with unique ID
 * 
 * @param transaction - Transaction data without id, createdAt, updatedAt
 * @returns The created transaction with generated id and timestamps
 */
export function createTransaction(
  transaction: Omit<StoredRampTransaction, 'id' | 'createdAt' | 'updatedAt'>
): StoredRampTransaction {
  const now = new Date().toISOString();
  
  // Generate unique ID using timestamp and random string
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  const newTransaction: StoredRampTransaction = {
    ...transaction,
    id,
    createdAt: now,
    updatedAt: now,
  };

  const transactions = getAllTransactionsFromStorage();
  transactions.push(newTransaction);
  saveAllTransactionsToStorage(transactions);

  return newTransaction;
}

/**
 * Update transaction status
 * Requirement 5.2: Update record with new status and timestamp
 * 
 * @param transactionId - ID of the transaction to update
 * @param status - New status
 * @param additionalData - Optional additional data to update
 * @returns Updated transaction or null if not found
 */
export function updateTransactionStatus(
  transactionId: string,
  status: RampTransactionStatus,
  additionalData?: Partial<StoredRampTransaction>
): StoredRampTransaction | null {
  const transactions = getAllTransactionsFromStorage();
  const index = transactions.findIndex(tx => tx.id === transactionId);

  if (index === -1) {
    console.error(`Transaction not found: ${transactionId}`);
    return null;
  }

  const now = new Date().toISOString();
  
  transactions[index] = {
    ...transactions[index],
    ...additionalData,
    status,
    updatedAt: now,
    ...(status === 'completed' && !transactions[index].completedAt ? { completedAt: now } : {}),
  };

  saveAllTransactionsToStorage(transactions);
  return transactions[index];
}

/**
 * Get transaction by ID
 * 
 * @param transactionId - ID of the transaction to retrieve
 * @returns Transaction or null if not found
 */
export function getTransactionById(transactionId: string): StoredRampTransaction | null {
  const transactions = getAllTransactionsFromStorage();
  return transactions.find(tx => tx.id === transactionId) || null;
}

/**
 * Get transaction by MavaPay order ID
 * 
 * @param orderId - MavaPay order ID
 * @returns Transaction or null if not found
 */
export function getTransactionByOrderId(orderId: string): StoredRampTransaction | null {
  const transactions = getAllTransactionsFromStorage();
  return transactions.find(tx => tx.mavaPayOrderId === orderId) || null;
}

/**
 * Get transaction by MavaPay hash
 * 
 * @param hash - MavaPay transaction hash
 * @returns Transaction or null if not found
 */
export function getTransactionByHash(hash: string): StoredRampTransaction | null {
  const transactions = getAllTransactionsFromStorage();
  return transactions.find(tx => tx.mavaPayHash === hash) || null;
}

/**
 * Get all transactions for a wallet address
 * Requirement 5.3: Display all ramp transactions
 * 
 * @param walletAddress - Wallet address to filter by
 * @param options - Optional filtering and sorting options
 * @returns Array of transactions
 */
export function getTransactionsByWallet(
  walletAddress: string,
  options?: {
    type?: RampTransactionType;
    status?: RampTransactionStatus;
    sortBy?: 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
  }
): StoredRampTransaction[] {
  let transactions = getAllTransactionsFromStorage();

  // Filter by wallet address
  transactions = transactions.filter(tx => tx.walletAddress === walletAddress);

  // Filter by type if specified
  if (options?.type) {
    transactions = transactions.filter(tx => tx.type === options.type);
  }

  // Filter by status if specified
  if (options?.status) {
    transactions = transactions.filter(tx => tx.status === options.status);
  }

  // Sort transactions
  const sortBy = options?.sortBy || 'createdAt';
  const sortOrder = options?.sortOrder || 'desc';
  
  transactions.sort((a, b) => {
    const aTime = new Date(a[sortBy]).getTime();
    const bTime = new Date(b[sortBy]).getTime();
    return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
  });

  // Limit results if specified
  if (options?.limit) {
    transactions = transactions.slice(0, options.limit);
  }

  return transactions;
}

/**
 * Get all transactions (admin/debug function)
 * 
 * @returns Array of all transactions
 */
export function getAllTransactions(): StoredRampTransaction[] {
  return getAllTransactionsFromStorage();
}

/**
 * Delete a transaction
 * 
 * @param transactionId - ID of the transaction to delete
 * @returns true if deleted, false if not found
 */
export function deleteTransaction(transactionId: string): boolean {
  const transactions = getAllTransactionsFromStorage();
  const index = transactions.findIndex(tx => tx.id === transactionId);

  if (index === -1) {
    return false;
  }

  transactions.splice(index, 1);
  saveAllTransactionsToStorage(transactions);
  return true;
}

/**
 * Clear all transactions for a wallet address
 * 
 * @param walletAddress - Wallet address to clear transactions for
 * @returns Number of transactions deleted
 */
export function clearTransactionsByWallet(walletAddress: string): number {
  const transactions = getAllTransactionsFromStorage();
  const filtered = transactions.filter(tx => tx.walletAddress !== walletAddress);
  const deletedCount = transactions.length - filtered.length;
  
  saveAllTransactionsToStorage(filtered);
  return deletedCount;
}

/**
 * Clear all transactions (admin/debug function)
 */
export function clearAllTransactions(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
}

// ============================================================================
// Transaction Status Helpers
// ============================================================================

/**
 * Check if a transaction is pending
 * Requirement 5.4: Show estimated completion time for pending transactions
 * 
 * @param transaction - Transaction to check
 * @returns true if transaction is pending
 */
export function isTransactionPending(transaction: StoredRampTransaction): boolean {
  return transaction.status === 'pending' || transaction.status === 'processing';
}

/**
 * Check if a transaction is completed
 * Requirement 5.6: Show confirmation details for completed transactions
 * 
 * @param transaction - Transaction to check
 * @returns true if transaction is completed
 */
export function isTransactionCompleted(transaction: StoredRampTransaction): boolean {
  return transaction.status === 'completed';
}

/**
 * Check if a transaction has failed
 * Requirement 5.5: Display failure reason and suggested next steps
 * 
 * @param transaction - Transaction to check
 * @returns true if transaction has failed
 */
export function isTransactionFailed(transaction: StoredRampTransaction): boolean {
  return transaction.status === 'failed';
}

/**
 * Get estimated completion time for a pending transaction
 * Requirement 5.4: Show estimated completion time
 * 
 * @param transaction - Transaction to estimate
 * @returns Estimated completion date or null
 */
export function getEstimatedCompletion(transaction: StoredRampTransaction): Date | null {
  if (!isTransactionPending(transaction)) {
    return null;
  }

  // If expiresAt is set, use that
  if (transaction.expiresAt) {
    return new Date(transaction.expiresAt);
  }

  // Otherwise, estimate based on transaction type
  const createdAt = new Date(transaction.createdAt);
  const estimatedMinutes = transaction.type === 'on-ramp' ? 30 : 15; // On-ramp takes longer
  
  return new Date(createdAt.getTime() + estimatedMinutes * 60 * 1000);
}

/**
 * Get transaction summary statistics for a wallet
 * 
 * @param walletAddress - Wallet address to get stats for
 * @returns Transaction statistics
 */
export function getTransactionStats(walletAddress: string): {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  onRamp: number;
  offRamp: number;
} {
  const transactions = getTransactionsByWallet(walletAddress);

  return {
    total: transactions.length,
    pending: transactions.filter(tx => tx.status === 'pending').length,
    processing: transactions.filter(tx => tx.status === 'processing').length,
    completed: transactions.filter(tx => tx.status === 'completed').length,
    failed: transactions.filter(tx => tx.status === 'failed').length,
    onRamp: transactions.filter(tx => tx.type === 'on-ramp').length,
    offRamp: transactions.filter(tx => tx.type === 'off-ramp').length,
  };
}

/**
 * Increment retry count for a transaction
 * 
 * @param transactionId - ID of the transaction
 * @returns Updated transaction or null if not found
 */
export function incrementRetryCount(transactionId: string): StoredRampTransaction | null {
  const transactions = getAllTransactionsFromStorage();
  const index = transactions.findIndex(tx => tx.id === transactionId);

  if (index === -1) {
    return null;
  }

  transactions[index].retryCount += 1;
  transactions[index].updatedAt = new Date().toISOString();

  saveAllTransactionsToStorage(transactions);
  return transactions[index];
}

/**
 * Update transaction with error message
 * Requirement 5.5: Display failure reason
 * 
 * @param transactionId - ID of the transaction
 * @param errorMessage - Error message to set
 * @returns Updated transaction or null if not found
 */
export function setTransactionError(
  transactionId: string,
  errorMessage: string
): StoredRampTransaction | null {
  return updateTransactionStatus(transactionId, 'failed', { errorMessage });
}
