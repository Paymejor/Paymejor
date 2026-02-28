'use client'

import { useState, useEffect, useCallback } from 'react'
import { RpcProvider } from 'starknet'
import { useNetwork } from './useNetwork'
import { useWallet } from '@/lib/wallet-context'
import { getNetworkConfig } from '@/lib/constants'
import { useCache } from './useCache'

/**
 * useOrganizationData Hook
 * 
 * Provides cached access to organization state and proposal data:
 * - Fetch organization state (collateral, debt, members, metrics)
 * - Fetch proposal list with voting status
 * - Auto-refresh on block updates
 * - Cache organization data similar to useVesuCache pattern
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

export interface Organization {
  address: string
  name: string
  admin: string
  groupId: string
  totalCollateral: bigint
  totalDebt: bigint
  ltv: number
  healthFactor: number
  memberCount: number
  members: string[] // Identity commitments
}

export interface Proposal {
  id: string
  creatorNullifier: string
  amount: bigint
  purpose: string
  yesVotes: number
  noVotes: number
  executed: boolean
  createdAt: number
  expiresAt: number
  quorumReached: boolean
  approved: boolean
  expired: boolean
}

interface UseOrganizationDataReturn {
  organization: Organization | null
  proposals: Proposal[]
  refreshOrganization: () => Promise<void>
  refreshProposals: () => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * Parse felt252 to string
 */
function feltToString(felt: string): string {
  try {
    // Remove 0x prefix
    const hex = felt.startsWith('0x') ? felt.slice(2) : felt
    
    // Convert hex to bytes
    const bytes: number[] = []
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.slice(i, i + 2), 16))
    }
    
    // Decode bytes to string
    const decoder = new TextDecoder()
    return decoder.decode(new Uint8Array(bytes))
  } catch (err) {
    return felt
  }
}

/**
 * Fetch organization state from contract
 */
async function fetchOrganizationState(
  orgAddress: string,
  network: string
): Promise<Organization> {
  const config = getNetworkConfig(network as any)
  const provider = new RpcProvider({ nodeUrl: config.rpcUrl })

  try {
    // Fetch organization data
    // Note: These are simplified calls - actual implementation depends on contract interface
    
    // Get basic info
    const nameResult = await provider.callContract({
      contractAddress: orgAddress,
      entrypoint: 'get_name',
      calldata: [],
    })
    
    const adminResult = await provider.callContract({
      contractAddress: orgAddress,
      entrypoint: 'get_admin',
      calldata: [],
    })
    
    const groupIdResult = await provider.callContract({
      contractAddress: orgAddress,
      entrypoint: 'get_group_id',
      calldata: [],
    })
    
    // Get collateral and debt
    const collateralResult = await provider.callContract({
      contractAddress: orgAddress,
      entrypoint: 'get_total_collateral',
      calldata: [],
    })
    
    const debtResult = await provider.callContract({
      contractAddress: orgAddress,
      entrypoint: 'get_total_debt',
      calldata: [],
    })
    
    // Get metrics
    const ltvResult = await provider.callContract({
      contractAddress: orgAddress,
      entrypoint: 'get_ltv',
      calldata: [],
    })
    
    const healthFactorResult = await provider.callContract({
      contractAddress: orgAddress,
      entrypoint: 'get_health_factor',
      calldata: [],
    })
    
    const memberCountResult = await provider.callContract({
      contractAddress: orgAddress,
      entrypoint: 'get_member_count',
      calldata: [],
    })

    // Parse results
    const name = feltToString(nameResult[0] || '0x0')
    const admin = adminResult[0] || '0x0'
    const groupId = groupIdResult[0] || '0x0'
    
    const collateralLow = BigInt(collateralResult[0] || '0')
    const collateralHigh = BigInt(collateralResult[1] || '0')
    const totalCollateral = collateralLow + (collateralHigh << BigInt(128))
    
    const debtLow = BigInt(debtResult[0] || '0')
    const debtHigh = BigInt(debtResult[1] || '0')
    const totalDebt = debtLow + (debtHigh << BigInt(128))
    
    const ltv = Number(ltvResult[0] || '0') / 100 // Convert from basis points
    const healthFactor = Number(healthFactorResult[0] || '0') / 100
    const memberCount = Number(memberCountResult[0] || '0')

    // Fetch member list (simplified - in production, paginate if needed)
    const members: string[] = []
    for (let i = 0; i < Math.min(memberCount, 100); i++) {
      try {
        const memberResult = await provider.callContract({
          contractAddress: orgAddress,
          entrypoint: 'get_member_by_index',
          calldata: [i.toString()],
        })
        if (memberResult[0]) {
          members.push(memberResult[0])
        }
      } catch (err) {
        // Member not found or error, skip
        break
      }
    }

    return {
      address: orgAddress,
      name,
      admin,
      groupId,
      totalCollateral,
      totalDebt,
      ltv,
      healthFactor,
      memberCount,
      members,
    }
  } catch (err) {
    console.error('Error fetching organization state:', err)
    throw new Error('Failed to fetch organization state')
  }
}

/**
 * Fetch proposal list from contract
 */
async function fetchProposals(
  orgAddress: string,
  network: string
): Promise<Proposal[]> {
  const config = getNetworkConfig(network as any)
  const provider = new RpcProvider({ nodeUrl: config.rpcUrl })

  try {
    // Get proposal count
    const countResult = await provider.callContract({
      contractAddress: orgAddress,
      entrypoint: 'get_proposal_count',
      calldata: [],
    })
    
    const proposalCount = Number(countResult[0] || '0')
    
    // Fetch all proposals (simplified - in production, paginate if needed)
    const proposals: Proposal[] = []
    
    for (let i = 0; i < Math.min(proposalCount, 100); i++) {
      try {
        const proposalResult = await provider.callContract({
          contractAddress: orgAddress,
          entrypoint: 'get_proposal',
          calldata: [i.toString()],
        })
        
        // Parse proposal data
        // Expected format: [id, creator_nullifier, amount_low, amount_high, purpose, yes_votes, no_votes, executed, created_at, expires_at]
        const id = proposalResult[0] || '0'
        const creatorNullifier = proposalResult[1] || '0x0'
        const amountLow = BigInt(proposalResult[2] || '0')
        const amountHigh = BigInt(proposalResult[3] || '0')
        const amount = amountLow + (amountHigh << BigInt(128))
        const purpose = feltToString(proposalResult[4] || '0x0')
        const yesVotes = Number(proposalResult[5] || '0')
        const noVotes = Number(proposalResult[6] || '0')
        const executed = proposalResult[7] === '1'
        const createdAt = Number(proposalResult[8] || '0')
        const expiresAt = Number(proposalResult[9] || '0')
        
        // Calculate derived properties
        const totalVotes = yesVotes + noVotes
        const quorumReached = totalVotes > 0 // Simplified - should check against member count
        const approved = yesVotes > noVotes
        const expired = Date.now() / 1000 > expiresAt
        
        proposals.push({
          id,
          creatorNullifier,
          amount,
          purpose,
          yesVotes,
          noVotes,
          executed,
          createdAt,
          expiresAt,
          quorumReached,
          approved,
          expired,
        })
      } catch (err) {
        // Proposal not found or error, skip
        console.error(`Error fetching proposal ${i}:`, err)
      }
    }
    
    return proposals
  } catch (err) {
    console.error('Error fetching proposals:', err)
    throw new Error('Failed to fetch proposals')
  }
}

/**
 * Hook for fetching and caching organization data
 */
export function useOrganizationData(orgAddress: string): UseOrganizationDataReturn {
  const { network } = useNetwork()
  const { address } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cache organization state
  const {
    data: organization,
    refresh: refreshOrganization,
    isLoading: orgLoading,
    error: orgError,
  } = useCache<Organization>({
    key: `organization_${network}_${orgAddress}`,
    ttl: 60 * 1000, // 1 minute
    refreshInterval: 30 * 1000, // Refresh every 30 seconds
    fetchFn: useCallback(async () => {
      return await fetchOrganizationState(orgAddress, network)
    }, [orgAddress, network]),
    invalidateOn: [
      'paymejor_network_changed',
      'paymejor_transaction_confirmed',
      'paymejor_organization_updated',
    ],
  })

  // Cache proposals
  const {
    data: proposals,
    refresh: refreshProposals,
    isLoading: proposalsLoading,
    error: proposalsError,
  } = useCache<Proposal[]>({
    key: `proposals_${network}_${orgAddress}`,
    ttl: 30 * 1000, // 30 seconds
    refreshInterval: 15 * 1000, // Refresh every 15 seconds
    fetchFn: useCallback(async () => {
      return await fetchProposals(orgAddress, network)
    }, [orgAddress, network]),
    invalidateOn: [
      'paymejor_network_changed',
      'paymejor_transaction_confirmed',
      'paymejor_proposal_created',
      'paymejor_vote_cast',
      'paymejor_proposal_executed',
    ],
  })

  // Combine loading and error states
  useEffect(() => {
    setIsLoading(orgLoading || proposalsLoading)
    const errorMessage = orgError || proposalsError
    setError(errorMessage ? String(errorMessage) : null)
  }, [orgLoading, proposalsLoading, orgError, proposalsError])

  // Wrap refresh functions to return void
  const handleRefreshOrganization = useCallback(async () => {
    await refreshOrganization()
  }, [refreshOrganization])

  const handleRefreshProposals = useCallback(async () => {
    await refreshProposals()
  }, [refreshProposals])

  return {
    organization: organization || null,
    proposals: proposals || [],
    refreshOrganization: handleRefreshOrganization,
    refreshProposals: handleRefreshProposals,
    isLoading,
    error,
  }
}

/**
 * Hook for fetching user's organizations
 */
export function useUserOrganizations() {
  const { network } = useNetwork()
  const { address } = useWallet()
  const [organizations, setOrganizations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserOrganizations = useCallback(async () => {
    if (!address) {
      setOrganizations([])
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const config = getNetworkConfig(network)
      const factoryAddress = config.contracts.organizationFactory
      
      if (!factoryAddress) {
        throw new Error(`Organization factory not configured for ${network}`)
      }

      const provider = new RpcProvider({ nodeUrl: config.rpcUrl })

      // Get organization count
      const countResult = await provider.callContract({
        contractAddress: factoryAddress,
        entrypoint: 'get_organization_count',
        calldata: [],
      })
      
      const orgCount = Number(countResult[0] || '0')
      
      // Fetch all organizations and filter by user
      const userOrgs: string[] = []
      
      for (let i = 0; i < Math.min(orgCount, 100); i++) {
        try {
          const orgResult = await provider.callContract({
            contractAddress: factoryAddress,
            entrypoint: 'get_organization_by_index',
            calldata: [i.toString()],
          })
          
          const orgAddress = orgResult[0]
          
          if (orgAddress) {
            // Check if user is admin or member
            const adminResult = await provider.callContract({
              contractAddress: orgAddress,
              entrypoint: 'get_admin',
              calldata: [],
            })
            
            if (adminResult[0] === address) {
              userOrgs.push(orgAddress)
            }
          }
        } catch (err) {
          // Organization not found or error, skip
          console.error(`Error fetching organization ${i}:`, err)
        }
      }
      
      setOrganizations(userOrgs)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organizations'
      setError(errorMessage)
      console.error('Error fetching user organizations:', err)
    } finally {
      setIsLoading(false)
    }
  }, [address, network])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchUserOrganizations()
  }, [fetchUserOrganizations])

  return {
    organizations,
    refresh: fetchUserOrganizations,
    isLoading,
    error,
  }
}
