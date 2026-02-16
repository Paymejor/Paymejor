'use client'

import { useState, useCallback, useEffect } from 'react'
import { RpcProvider } from 'starknet'
import { useWallet } from '@/lib/wallet-context'
import { useNetwork } from './useNetwork'
import { getNetworkConfig, TOKEN_METADATA } from '@/lib/constants'
import { SecurityValidation } from '@/lib/security-validation'
import {
  TongoAccount,
  TongoFundParams,
  TongoShieldedBalance,
  TongoDecryptedBalance,
} from '@/types/tongo'

/**
 * useTongo Hook
 * 
 * Provides Tongo privacy layer integration:
 * - createAccount(): Create or retrieve Tongo account
 * - fund(): Shield deposits (encrypt amounts on-chain)
 * - getBalance(): Get encrypted balance
 * - decrypt(): Decrypt shielded balance
 * 
 * Requirements: AC-3.1, AC-3.6, TR-4.14
 */

interface UseTongoReturn {
  tongoAccount: TongoAccount | null
  createAccount: () => Promise<TongoAccount>
  fund: (params: TongoFundParams) => Promise<string>
  getBalance: (token: string) => Promise<TongoShieldedBalance>
  decrypt: (shieldedBalance: TongoShieldedBalance) => Promise<TongoDecryptedBalance>
  isLoading: boolean
  error: string | null
}

export function useTongo(): UseTongoReturn {
  const { account, address } = useWallet()
  const { network } = useNetwork()
  const [tongoAccount, setTongoAccount] = useState<TongoAccount | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Create or retrieve Tongo account for the connected wallet
   * Uses the user's Starknet account to derive encryption keys
   */
  const createAccount = useCallback(async (): Promise<TongoAccount> => {
    if (!account || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      // Get network configuration
      const config = getNetworkConfig(network)
      
      // Create RPC provider
      const provider = new RpcProvider({ nodeUrl: config.rpcUrl })

      // In a real implementation, we would use the Tongo SDK:
      // import { TongoAccount as TongoSDKAccount } from '@fatsolutions/tongo-sdk'
      // const tongoSDKAccount = await TongoSDKAccount.create({
      //   provider,
      //   signer: account,
      // })
      
      // For now, create a mock Tongo account structure
      // The actual SDK integration would handle key derivation and account creation
      const newTongoAccount: TongoAccount = {
        address: `${config.contracts.tongoProtocol}_${address}`, // Derived address
        owner: address,
      }

      setTongoAccount(newTongoAccount)
      return newTongoAccount
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create Tongo account'
      setError(errorMessage)
      console.error('Error creating Tongo account:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, address, network])

  /**
   * Fund (shield) a deposit - encrypts the amount on-chain
   * This is the core privacy feature: amounts are encrypted using ElGamal
   */
  const fund = useCallback(async (params: TongoFundParams): Promise<string> => {
    if (!account || !tongoAccount) {
      throw new Error('Tongo account not initialized')
    }

    try {
      setIsLoading(true)
      setError(null)

      const { token, amount } = params
      const config = getNetworkConfig(network)

      // Security validation: Verify Tongo protocol address
      const contractValidation = SecurityValidation.verifyContractAddress(
        config.contracts.tongoProtocol,
        'tongoProtocol',
        network
      )
      if (!contractValidation.valid) {
        throw new Error(contractValidation.error)
      }

      // Security validation: Validate amount
      const tokenSymbol = token === config.contracts.wBTC ? 'wBTC' : 'USDC'
      const amountValidation = SecurityValidation.validateAmount({
        amount,
        token: tokenSymbol,
      })
      if (!amountValidation.valid) {
        throw new Error(amountValidation.error)
      }

      // Security validation: Check rate limit
      const rateLimitCheck = SecurityValidation.checkTransactionRateLimit(account.address)
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.error)
      }

      // In a real implementation, we would use the Tongo SDK:
      // const txHash = await tongoSDKAccount.fund({
      //   token,
      //   amount: BigInt(amount),
      // })

      // For now, simulate the fund transaction
      // This would actually call the Tongo protocol contract to shield the deposit
      const result = await account.execute({
        contractAddress: config.contracts.tongoProtocol,
        entrypoint: 'fund',
        calldata: [
          token,
          amount,
          '0', // amount high (for Uint256)
        ],
      })

      const txHash = result.transaction_hash
      return txHash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fund Tongo account'
      setError(errorMessage)
      console.error('Error funding Tongo account:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, tongoAccount, network])

  /**
   * Get encrypted (shielded) balance for a token
   * Returns the ciphertext - actual amount is hidden
   */
  const getBalance = useCallback(async (token: string): Promise<TongoShieldedBalance> => {
    if (!tongoAccount) {
      throw new Error('Tongo account not initialized')
    }

    try {
      setIsLoading(true)
      setError(null)

      const config = getNetworkConfig(network)
      const provider = new RpcProvider({ nodeUrl: config.rpcUrl })

      // In a real implementation, we would use the Tongo SDK:
      // const balance = await tongoSDKAccount.getBalance(token)

      // For now, simulate getting encrypted balance
      // This would query the Tongo protocol contract for the encrypted balance
      const result = await provider.callContract({
        contractAddress: config.contracts.tongoProtocol,
        entrypoint: 'get_balance',
        calldata: [tongoAccount.address, token],
      })

      // The result would be an ElGamal ciphertext (encrypted amount)
      const encryptedAmount = result[0] || '0'
      const ciphertext = result[1] || '0x0'

      const shieldedBalance: TongoShieldedBalance = {
        token,
        encryptedAmount,
        ciphertext,
      }

      return shieldedBalance
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get balance'
      setError(errorMessage)
      console.error('Error getting Tongo balance:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [tongoAccount, network])

  /**
   * Decrypt a shielded balance using the user's private key
   * This reveals the actual amount - only the owner can do this
   */
  const decrypt = useCallback(async (
    shieldedBalance: TongoShieldedBalance
  ): Promise<TongoDecryptedBalance> => {
    if (!account || !tongoAccount) {
      throw new Error('Tongo account not initialized')
    }

    try {
      setIsLoading(true)
      setError(null)

      // In a real implementation, we would use the Tongo SDK:
      // const decrypted = await tongoSDKAccount.decrypt(shieldedBalance.ciphertext)

      // For now, simulate decryption
      // This would use the user's private key to decrypt the ElGamal ciphertext
      // The actual decryption happens client-side using the derived encryption key
      
      // Get token metadata for decimals
      const tokenSymbol = shieldedBalance.token === getNetworkConfig(network).contracts.wBTC 
        ? 'wBTC' 
        : 'USDC'
      const decimals = TOKEN_METADATA[tokenSymbol]?.decimals || 8

      // Simulate decrypted amount (in real implementation, this comes from ElGamal decryption)
      const decryptedBalance: TongoDecryptedBalance = {
        token: shieldedBalance.token,
        amount: shieldedBalance.encryptedAmount, // In reality, this would be decrypted
        decimals,
      }

      return decryptedBalance
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decrypt balance'
      setError(errorMessage)
      console.error('Error decrypting balance:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, tongoAccount, network])

  /**
   * Auto-create Tongo account when wallet connects
   */
  useEffect(() => {
    if (account && address && !tongoAccount) {
      createAccount().catch(console.error)
    }
  }, [account, address, tongoAccount, createAccount])

  return {
    tongoAccount,
    createAccount,
    fund,
    getBalance,
    decrypt,
    isLoading,
    error,
  }
}
