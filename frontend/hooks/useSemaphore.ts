'use client'

import { useState, useEffect, useCallback } from 'react'
import { Identity } from '@semaphore-protocol/identity'
import { Group } from '@semaphore-protocol/group'
import { generateProof } from '@semaphore-protocol/proof'

/**
 * useSemaphore Hook
 * 
 * Provides Semaphore Protocol integration for privacy-preserving identity and proof generation:
 * - Identity creation and local storage management
 * - Vote proof generation for anonymous voting
 * - Proposal proof generation for anonymous proposal creation
 * - Identity commitment export for member registration
 * 
 * Requirements: 4.1, 5.1
 */

export interface SemaphoreProof {
  merkleTreeDepth: number
  merkleTreeRoot: string
  nullifier: string
  message: string
  scope: string
  points: string[]
}

interface UseSemaphoreReturn {
  identity: Identity | null
  identityCommitment: string | null
  generateVoteProof: (
    groupId: string,
    members: string[],
    proposalId: string,
    voteYes: boolean
  ) => Promise<SemaphoreProof>
  generateProposalProof: (
    groupId: string,
    members: string[],
    amount: string,
    purpose: string
  ) => Promise<SemaphoreProof>
  isLoading: boolean
  error: string | null
}

/**
 * Hash proposal data for proof generation
 */
function hashProposalData(amount: string, purpose: string): string {
  // Simple hash: combine amount and purpose
  // In production, use a proper hash function
  const combined = `${amount}:${purpose}`
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString()
}

export function useSemaphore(): UseSemaphoreReturn {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Create or load identity from local storage
   * Identity is persisted to allow users to maintain the same anonymous identity across sessions
   */
  useEffect(() => {
    try {
      const storedIdentity = localStorage.getItem('semaphore_identity')
      if (storedIdentity) {
        // Load existing identity
        setIdentity(new Identity(storedIdentity))
      } else {
        // Create new identity
        const newIdentity = new Identity()
        localStorage.setItem('semaphore_identity', newIdentity.export())
        setIdentity(newIdentity)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize identity'
      setError(errorMessage)
      console.error('Error initializing Semaphore identity:', err)
    }
  }, [])

  /**
   * Generate zero-knowledge proof for voting
   * Proves group membership without revealing voter identity
   * 
   * @param groupId - Organization group ID
   * @param members - Array of member identity commitments
   * @param proposalId - Proposal ID (used as scope to prevent double-voting)
   * @param voteYes - Vote choice (true for yes, false for no)
   * @returns Semaphore proof that can be verified on-chain
   */
  const generateVoteProof = useCallback(async (
    groupId: string,
    members: string[],
    proposalId: string,
    voteYes: boolean
  ): Promise<SemaphoreProof> => {
    if (!identity) {
      throw new Error('Identity not initialized')
    }

    try {
      setIsLoading(true)
      setError(null)

      // Create off-chain group from member commitments
      const group = new Group(members)

      // Generate proof
      // Message: 1 for yes, 0 for no
      const message = voteYes ? '1' : '0'
      // Scope: proposal ID to prevent double-voting on same proposal
      const scope = proposalId

      const proof = await generateProof(identity, group, message, scope)

      return {
        merkleTreeDepth: proof.merkleTreeDepth,
        merkleTreeRoot: proof.merkleTreeRoot,
        nullifier: proof.nullifier,
        message: proof.message,
        scope: proof.scope,
        points: proof.points,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate vote proof'
      setError(errorMessage)
      console.error('Error generating vote proof:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [identity])

  /**
   * Generate zero-knowledge proof for proposal creation
   * Proves group membership without revealing proposer identity
   * 
   * @param groupId - Organization group ID
   * @param members - Array of member identity commitments
   * @param amount - Borrow amount requested
   * @param purpose - Purpose of the borrow request
   * @returns Semaphore proof that can be verified on-chain
   */
  const generateProposalProof = useCallback(async (
    groupId: string,
    members: string[],
    amount: string,
    purpose: string
  ): Promise<SemaphoreProof> => {
    if (!identity) {
      throw new Error('Identity not initialized')
    }

    try {
      setIsLoading(true)
      setError(null)

      // Create off-chain group from member commitments
      const group = new Group(members)

      // Generate proof
      // Message: hash of proposal data
      const message = hashProposalData(amount, purpose)
      // Scope: group ID for proposals
      const scope = groupId

      const proof = await generateProof(identity, group, message, scope)

      return {
        merkleTreeDepth: proof.merkleTreeDepth,
        merkleTreeRoot: proof.merkleTreeRoot,
        nullifier: proof.nullifier,
        message: proof.message,
        scope: proof.scope,
        points: proof.points,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate proposal proof'
      setError(errorMessage)
      console.error('Error generating proposal proof:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [identity])

  return {
    identity,
    identityCommitment: identity?.commitment.toString() || null,
    generateVoteProof,
    generateProposalProof,
    isLoading,
    error,
  }
}
