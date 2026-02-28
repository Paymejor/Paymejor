'use client'

import { useState, useCallback } from 'react'
import { useWallet } from '@/lib/wallet-context'
import { useNetwork } from './useNetwork'
import { getNetworkConfig, TOKEN_METADATA } from '@/lib/constants'
import { SemaphoreProof } from './useSemaphore'

/**
 * useOrganization Hook
 * 
 * Provides organization contract interactions:
 * - createOrganization: Deploy new organization via factory
 * - depositCollateral: Deposit wBTC to organization pool
 * - withdrawCollateral: Withdraw wBTC from organization pool
 * - createProposal: Create anonymous borrow proposal with Semaphore proof
 * - vote: Cast anonymous vote on proposal with Semaphore proof
 * - executeProposal: Execute approved proposal to borrow from Vesu
 * - repayDebt: Repay borrowed USDC to reduce organization debt
 * 
 * Requirements: 1.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1
 */

interface UseOrganizationReturn {
  createOrganization: (name: string) => Promise<string>
  depositCollateral: (orgAddress: string, amount: string) => Promise<string>
  withdrawCollateral: (orgAddress: string, amount: string) => Promise<string>
  createProposal: (
    orgAddress: string,
    proof: SemaphoreProof,
    amount: string,
    purpose: string,
    duration: number
  ) => Promise<string>
  vote: (
    orgAddress: string,
    proposalId: string,
    proof: SemaphoreProof,
    voteYes: boolean
  ) => Promise<string>
  executeProposal: (orgAddress: string, proposalId: string) => Promise<string>
  repayDebt: (orgAddress: string, amount: string) => Promise<string>
  addMember: (orgAddress: string, identityCommitment: string) => Promise<string>
  isLoading: boolean
  error: string | null
}

/**
 * Convert string to felt252 (Cairo short string)
 */
function stringToFelt(str: string): string {
  // Convert string to hex bytes
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str.slice(0, 31)) // Max 31 characters for felt252
  
  // Convert bytes to hex string
  let hex = '0x'
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  
  return hex
}

/**
 * Extract organization address from factory transaction events
 */
async function extractOrgAddressFromTx(txHash: string, network: string): Promise<string> {
  // Poll for transaction receipt and extract organization address from events
  // This is a simplified implementation - in production, parse the actual event data
  
  const config = getNetworkConfig(network as any)
  const maxAttempts = 30
  const interval = 2000 // 2 seconds
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`/api/rpc?network=${network}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'starknet_getTransactionReceipt',
          params: {
            transaction_hash: txHash,
          },
          id: 1,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`RPC request failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.result && data.result.events) {
        // Find OrganizationCreated event
        const orgCreatedEvent = data.result.events.find((event: any) => 
          event.keys && event.keys[0] === '0x1' // Simplified event key check
        )
        
        if (orgCreatedEvent && orgCreatedEvent.data && orgCreatedEvent.data[0]) {
          return orgCreatedEvent.data[0]
        }
      }
    } catch (err) {
      // Transaction not found yet, continue polling
    }
    
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  throw new Error('Failed to extract organization address from transaction')
}

export function useOrganization(): UseOrganizationReturn {
  const { account, address } = useWallet()
  const { network } = useNetwork()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Create a new organization via factory contract
   * Deploys a new Organization contract instance
   * 
   * Requirements: 1.1
   */
  const createOrganization = useCallback(async (name: string): Promise<string> => {
    if (!account || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      const config = getNetworkConfig(network)
      const factoryAddress = config.contracts.organizationFactory
      
      if (!factoryAddress) {
        throw new Error(`Organization factory not configured for ${network}`)
      }

      // Convert name to felt252
      const nameFelt = stringToFelt(name)

      // Call factory contract to create organization
      const result = await account.execute({
        contractAddress: factoryAddress,
        entrypoint: 'create_organization',
        calldata: [
          nameFelt,
          address,
          config.contracts.semaphore || '0x0', // Semaphore address (placeholder if not configured)
        ],
      })

      // Extract organization address from transaction events
      const orgAddress = await extractOrgAddressFromTx(result.transaction_hash, network)
      
      return orgAddress
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create organization'
      setError(errorMessage)
      console.error('Error creating organization:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, address, network])

  /**
   * Deposit wBTC collateral to organization pool
   * Requires prior approval of wBTC to organization contract
   * 
   * Requirements: 3.1
   */
  const depositCollateral = useCallback(async (
    orgAddress: string,
    amount: string
  ): Promise<string> => {
    if (!account || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      const config = getNetworkConfig(network)
      const wBTCAddress = config.contracts.wBTC

      // Convert amount to Uint256 (low, high)
      const amountBigInt = BigInt(amount)
      const low = (amountBigInt & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toString()
      const high = (amountBigInt >> BigInt(128)).toString()

      // Step 1: Approve wBTC to organization
      await account.execute({
        contractAddress: wBTCAddress,
        entrypoint: 'approve',
        calldata: [orgAddress, low, high],
      })

      // Step 2: Deposit collateral
      const result = await account.execute({
        contractAddress: orgAddress,
        entrypoint: 'deposit_collateral',
        calldata: [low, high],
      })

      return result.transaction_hash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deposit collateral'
      setError(errorMessage)
      console.error('Error depositing collateral:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, address, network])

  /**
   * Withdraw wBTC collateral from organization pool
   * Validates that withdrawal doesn't violate LTV requirements
   * 
   * Requirements: 7.1
   */
  const withdrawCollateral = useCallback(async (
    orgAddress: string,
    amount: string
  ): Promise<string> => {
    if (!account || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      // Convert amount to Uint256 (low, high)
      const amountBigInt = BigInt(amount)
      const low = (amountBigInt & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toString()
      const high = (amountBigInt >> BigInt(128)).toString()

      // Withdraw collateral
      const result = await account.execute({
        contractAddress: orgAddress,
        entrypoint: 'withdraw_collateral',
        calldata: [low, high],
      })

      return result.transaction_hash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw collateral'
      setError(errorMessage)
      console.error('Error withdrawing collateral:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, address])

  /**
   * Create anonymous borrow proposal with Semaphore proof
   * Proves group membership without revealing proposer identity
   * 
   * Requirements: 4.1
   */
  const createProposal = useCallback(async (
    orgAddress: string,
    proof: SemaphoreProof,
    amount: string,
    purpose: string,
    duration: number
  ): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      // Convert amount to Uint256 (low, high)
      const amountBigInt = BigInt(amount)
      const low = (amountBigInt & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toString()
      const high = (amountBigInt >> BigInt(128)).toString()

      // Convert purpose to felt252
      const purposeFelt = stringToFelt(purpose)

      // Prepare proof calldata
      const proofCalldata = [
        proof.merkleTreeDepth.toString(),
        proof.merkleTreeRoot,
        proof.nullifier,
        proof.message,
        proof.scope,
        proof.points.length.toString(),
        ...proof.points,
      ]

      // Create proposal
      const result = await account.execute({
        contractAddress: orgAddress,
        entrypoint: 'create_proposal',
        calldata: [
          ...proofCalldata,
          low,
          high,
          purposeFelt,
          duration.toString(),
        ],
      })

      return result.transaction_hash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create proposal'
      setError(errorMessage)
      console.error('Error creating proposal:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account])

  /**
   * Cast anonymous vote on proposal with Semaphore proof
   * Proves group membership without revealing voter identity
   * 
   * Requirements: 5.1
   */
  const vote = useCallback(async (
    orgAddress: string,
    proposalId: string,
    proof: SemaphoreProof,
    voteYes: boolean
  ): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      // Prepare proof calldata
      const proofCalldata = [
        proof.merkleTreeDepth.toString(),
        proof.merkleTreeRoot,
        proof.nullifier,
        proof.message,
        proof.scope,
        proof.points.length.toString(),
        ...proof.points,
      ]

      // Cast vote
      const result = await account.execute({
        contractAddress: orgAddress,
        entrypoint: 'vote',
        calldata: [
          proposalId,
          ...proofCalldata,
          voteYes ? '1' : '0',
        ],
      })

      return result.transaction_hash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to vote'
      setError(errorMessage)
      console.error('Error voting:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account])

  /**
   * Execute approved proposal to borrow from Vesu
   * Checks quorum and approval before executing
   * 
   * Requirements: 6.1
   */
  const executeProposal = useCallback(async (
    orgAddress: string,
    proposalId: string
  ): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      // Execute proposal
      const result = await account.execute({
        contractAddress: orgAddress,
        entrypoint: 'execute_proposal',
        calldata: [proposalId],
      })

      return result.transaction_hash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute proposal'
      setError(errorMessage)
      console.error('Error executing proposal:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account])

  /**
   * Repay borrowed USDC to reduce organization debt
   * Requires prior approval of USDC to organization contract
   * 
   * Requirements: 8.1
   */
  const repayDebt = useCallback(async (
    orgAddress: string,
    amount: string
  ): Promise<string> => {
    if (!account || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      const config = getNetworkConfig(network)
      const usdcAddress = config.contracts.USDC

      // Convert amount to Uint256 (low, high)
      const amountBigInt = BigInt(amount)
      const low = (amountBigInt & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toString()
      const high = (amountBigInt >> BigInt(128)).toString()

      // Step 1: Approve USDC to organization
      await account.execute({
        contractAddress: usdcAddress,
        entrypoint: 'approve',
        calldata: [orgAddress, low, high],
      })

      // Step 2: Repay debt
      const result = await account.execute({
        contractAddress: orgAddress,
        entrypoint: 'repay_debt',
        calldata: [low, high],
      })

      return result.transaction_hash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to repay debt'
      setError(errorMessage)
      console.error('Error repaying debt:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, address, network])

  /**
   * Add member to organization (admin only)
   * Adds identity commitment to Semaphore group
   * 
   * Requirements: 2.1
   */
  const addMember = useCallback(async (
    orgAddress: string,
    identityCommitment: string
  ): Promise<string> => {
    if (!account || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      // Add member to organization
      const result = await account.execute({
        contractAddress: orgAddress,
        entrypoint: 'add_member',
        calldata: [identityCommitment],
      })

      return result.transaction_hash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add member'
      setError(errorMessage)
      console.error('Error adding member:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, address])

  return {
    createOrganization,
    depositCollateral,
    withdrawCollateral,
    createProposal,
    vote,
    executeProposal,
    repayDebt,
    addMember,
    isLoading,
    error,
  }
}
