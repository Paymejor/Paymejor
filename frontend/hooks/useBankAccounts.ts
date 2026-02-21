'use client'

import { useState, useCallback, useEffect } from 'react'
import { useWallet } from '@/lib/wallet-context'
import {
  BankAccount,
  BankVerificationRequest,
  BankVerificationResponse,
  ValidationError,
} from '@/types/mavapay'
import {
  getBankAccounts,
  addBankAccount as addBankAccountToStorage,
  deleteBankAccount as deleteBankAccountFromStorage,
  updateBankAccount as updateBankAccountInStorage,
  getBankAccountById,
} from '@/lib/bank-encryption'

/**
 * useBankAccounts Hook
 * 
 * Manages user's saved Nigerian bank accounts with encryption:
 * - Load bank accounts from encrypted storage
 * - Add new bank accounts with encryption
 * - Verify bank accounts via MavaPay API
 * - Update bank account details
 * - Delete bank accounts
 * - Automatic loading on wallet connection
 * 
 * Requirements: 4.1-4.6
 */

interface UseBankAccountsReturn {
  accounts: BankAccount[]
  loading: boolean
  error: Error | null
  addAccount: (account: Omit<BankAccount, 'id' | 'createdAt'>) => Promise<BankAccount>
  deleteAccount: (accountId: string) => Promise<void>
  updateAccount: (accountId: string, updates: Partial<Omit<BankAccount, 'id' | 'createdAt'>>) => Promise<BankAccount>
  verifyAccount: (accountNumber: string, bankCode: string) => Promise<BankVerificationResponse>
  getAccountById: (accountId: string) => Promise<BankAccount | null>
  refreshAccounts: () => Promise<void>
}

export function useBankAccounts(): UseBankAccountsReturn {
  const { address, isConnected } = useWallet()
  
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Load bank accounts from encrypted storage
   * Requirements: 4.4
   */
  const loadAccounts = useCallback(async () => {
    if (!address || !isConnected) {
      setAccounts([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const decryptedAccounts = await getBankAccounts(address)
      setAccounts(decryptedAccounts)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bank accounts'
      const loadError = new Error(errorMessage)
      setError(loadError)
      console.error('Error loading bank accounts:', err)
    } finally {
      setLoading(false)
    }
  }, [address, isConnected])

  /**
   * Load accounts when wallet connects or address changes
   */
  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  /**
   * Add a new bank account
   * Requirements: 4.1, 4.2, 4.3
   */
  const addAccount = useCallback(async (
    account: Omit<BankAccount, 'id' | 'createdAt'>
  ): Promise<BankAccount> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      setLoading(true)
      setError(null)

      // Validate account number format (10 digits for Nigerian banks)
      // Requirement: 4.1
      if (!/^\d{10}$/.test(account.accountNumber)) {
        throw new ValidationError(
          'accountNumber',
          'Account number must be exactly 10 digits',
          'Please enter a valid 10-digit Nigerian bank account number'
        )
      }

      // Add account to encrypted storage
      // Requirement: 4.3
      const storedAccount = await addBankAccountToStorage(account, address)
      
      // Decrypt and return the new account
      const newAccount: BankAccount = {
        id: storedAccount.id,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        nipBankCode: account.nipBankCode,
        isVerified: account.isVerified,
        createdAt: new Date(storedAccount.createdAt),
      }

      // Refresh accounts list
      await loadAccounts()
      
      return newAccount
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add bank account'
      const addError = new Error(errorMessage)
      setError(addError)
      console.error('Error adding bank account:', err)
      throw addError
    } finally {
      setLoading(false)
    }
  }, [address, isConnected, loadAccounts])

  /**
   * Delete a bank account
   * Requirements: 4.6
   */
  const deleteAccount = useCallback(async (accountId: string): Promise<void> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      setLoading(true)
      setError(null)

      const deleted = deleteBankAccountFromStorage(accountId, address)
      
      if (!deleted) {
        throw new Error('Bank account not found')
      }

      // Refresh accounts list
      await loadAccounts()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete bank account'
      const deleteError = new Error(errorMessage)
      setError(deleteError)
      console.error('Error deleting bank account:', err)
      throw deleteError
    } finally {
      setLoading(false)
    }
  }, [address, isConnected, loadAccounts])

  /**
   * Update a bank account
   * Requirements: 4.1, 4.3
   */
  const updateAccount = useCallback(async (
    accountId: string,
    updates: Partial<Omit<BankAccount, 'id' | 'createdAt'>>
  ): Promise<BankAccount> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      setLoading(true)
      setError(null)

      // Validate account number format if being updated
      if (updates.accountNumber && !/^\d{10}$/.test(updates.accountNumber)) {
        throw new ValidationError(
          'accountNumber',
          'Account number must be exactly 10 digits',
          'Please enter a valid 10-digit Nigerian bank account number'
        )
      }

      const updatedStoredAccount = await updateBankAccountInStorage(
        accountId,
        updates,
        address
      )

      if (!updatedStoredAccount) {
        throw new Error('Bank account not found')
      }

      // Refresh accounts list
      await loadAccounts()

      // Get and return the updated account
      const updatedAccount = await getBankAccountById(accountId, address)
      if (!updatedAccount) {
        throw new Error('Failed to retrieve updated account')
      }

      return updatedAccount
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update bank account'
      const updateError = new Error(errorMessage)
      setError(updateError)
      console.error('Error updating bank account:', err)
      throw updateError
    } finally {
      setLoading(false)
    }
  }, [address, isConnected, loadAccounts])

  /**
   * Verify a bank account via MavaPay API
   * Requirements: 4.2
   */
  const verifyAccount = useCallback(async (
    accountNumber: string,
    bankCode: string
  ): Promise<BankVerificationResponse> => {
    try {
      setLoading(true)
      setError(null)

      // Validate account number format
      if (!/^\d{10}$/.test(accountNumber)) {
        throw new ValidationError(
          'accountNumber',
          'Account number must be exactly 10 digits',
          'Please enter a valid 10-digit Nigerian bank account number'
        )
      }

      const request: BankVerificationRequest = {
        accountNumber,
        bankCode,
      }

      const response = await fetch('/api/ramp/verify-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to verify bank account: ${response.statusText}`)
      }

      const verificationData: BankVerificationResponse = await response.json()
      return verificationData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify bank account'
      const verifyError = new Error(errorMessage)
      setError(verifyError)
      console.error('Error verifying bank account:', err)
      throw verifyError
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get a specific bank account by ID
   * Requirements: 4.4
   */
  const getAccountById = useCallback(async (accountId: string): Promise<BankAccount | null> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      setError(null)
      return await getBankAccountById(accountId, address)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get bank account'
      const getError = new Error(errorMessage)
      setError(getError)
      console.error('Error getting bank account:', err)
      throw getError
    }
  }, [address, isConnected])

  /**
   * Manually refresh accounts list
   * Requirements: 4.4
   */
  const refreshAccounts = useCallback(async () => {
    await loadAccounts()
  }, [loadAccounts])

  return {
    accounts,
    loading,
    error,
    addAccount,
    deleteAccount,
    updateAccount,
    verifyAccount,
    getAccountById,
    refreshAccounts,
  }
}
