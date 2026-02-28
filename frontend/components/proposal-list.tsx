'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/hooks/useOrganization'
import { useSemaphore } from '@/hooks/useSemaphore'
import { Plus, ThumbsUp, ThumbsDown, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { TOKEN_METADATA } from '@/lib/constants'
import { CreateProposal } from '@/components/create-proposal'

/**
 * ProposalList Component
 * 
 * Displays active and past proposals with voting and execution capabilities.
 * Shows proposal details including amount, purpose, votes, and status.
 * 
 * Requirements: 4.1, 5.1, 6.1
 */

interface Proposal {
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

interface ProposalListProps {
  proposals: Proposal[]
  orgAddress: string
  onRefresh: () => void
}

export function ProposalList({ proposals, orgAddress, onRefresh }: ProposalListProps) {
  const { toast } = useToast()
  const { vote, executeProposal } = useOrganization()
  const { generateVoteProof } = useSemaphore()
  
  const [showCreateProposal, setShowCreateProposal] = useState(false)
  const [votingProposalId, setVotingProposalId] = useState<string | null>(null)
  const [executingProposalId, setExecutingProposalId] = useState<string | null>(null)

  const formatBalance = (balance: bigint, decimals: number): string => {
    try {
      const divisor = BigInt(10 ** decimals)
      const integerPart = balance / divisor
      const fractionalPart = balance % divisor
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
      const displayDecimals = decimals === 8 ? 8 : 6
      const truncatedFractional = fractionalStr.slice(0, displayDecimals)
      return `${integerPart}.${truncatedFractional}`
    } catch (error) {
      return '0.00'
    }
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const getProposalStatus = (proposal: Proposal): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    if (proposal.executed) {
      return { label: 'Executed', variant: 'default' }
    }
    if (proposal.expired) {
      return { label: 'Expired', variant: 'destructive' }
    }
    if (proposal.approved && proposal.quorumReached) {
      return { label: 'Approved', variant: 'default' }
    }
    if (proposal.quorumReached) {
      return { label: 'Quorum Reached', variant: 'secondary' }
    }
    return { label: 'Active', variant: 'outline' }
  }

  const handleVote = async (proposalId: string, voteYes: boolean) => {
    setVotingProposalId(proposalId)
    try {
      // TODO: Get actual group members for proof generation
      const members: string[] = []
      
      const proof = await generateVoteProof(
        orgAddress,
        members,
        proposalId,
        voteYes
      )
      
      await vote(orgAddress, proposalId, proof, voteYes)
      
      toast({
        title: 'Vote Cast',
        description: `You voted ${voteYes ? 'Yes' : 'No'} on the proposal`,
      })
      
      onRefresh()
    } catch (err) {
      console.error('Vote failed:', err)
      toast({
        title: 'Vote Failed',
        description: err instanceof Error ? err.message : 'Failed to cast vote',
        variant: 'destructive',
      })
    } finally {
      setVotingProposalId(null)
    }
  }

  const handleExecute = async (proposalId: string) => {
    setExecutingProposalId(proposalId)
    try {
      await executeProposal(orgAddress, proposalId)
      
      toast({
        title: 'Proposal Executed',
        description: 'The proposal has been executed successfully',
      })
      
      onRefresh()
    } catch (err) {
      console.error('Execution failed:', err)
      toast({
        title: 'Execution Failed',
        description: err instanceof Error ? err.message : 'Failed to execute proposal',
        variant: 'destructive',
      })
    } finally {
      setExecutingProposalId(null)
    }
  }

  const calculateVotePercentage = (yesVotes: number, noVotes: number): number => {
    const total = yesVotes + noVotes
    if (total === 0) return 0
    return (yesVotes / total) * 100
  }

  if (showCreateProposal) {
    return (
      <CreateProposal 
        orgAddress={orgAddress}
        onBack={() => setShowCreateProposal(false)}
        onSuccess={() => {
          setShowCreateProposal(false)
          onRefresh()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Proposals</h3>
          <p className="text-sm text-muted-foreground">
            Vote anonymously on borrow proposals
          </p>
        </div>
        <Button onClick={() => setShowCreateProposal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Proposal
        </Button>
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Proposals Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create the first proposal to borrow against pooled collateral
            </p>
            <Button onClick={() => setShowCreateProposal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Proposal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const status = getProposalStatus(proposal)
            const votePercentage = calculateVotePercentage(proposal.yesVotes, proposal.noVotes)
            const totalVotes = proposal.yesVotes + proposal.noVotes
            const isVoting = votingProposalId === proposal.id
            const isExecuting = executingProposalId === proposal.id

            return (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        Borrow {formatBalance(proposal.amount, TOKEN_METADATA.USDC.decimals)} USDC
                      </CardTitle>
                      <CardDescription>{proposal.purpose}</CardDescription>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vote Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Votes</span>
                      <span className="font-medium">
                        {proposal.yesVotes} Yes / {proposal.noVotes} No ({totalVotes} total)
                      </span>
                    </div>
                    <Progress value={votePercentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{votePercentage.toFixed(1)}% approval</span>
                      {proposal.quorumReached && (
                        <span className="text-green-500 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Quorum reached
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Proposal Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDate(proposal.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-medium">{formatDate(proposal.expiresAt)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {!proposal.executed && !proposal.expired && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleVote(proposal.id, true)}
                        disabled={isVoting}
                        variant="outline"
                        className="flex-1 gap-2"
                      >
                        {isVoting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="h-4 w-4" />
                        )}
                        Vote Yes
                      </Button>
                      <Button
                        onClick={() => handleVote(proposal.id, false)}
                        disabled={isVoting}
                        variant="outline"
                        className="flex-1 gap-2"
                      >
                        {isVoting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsDown className="h-4 w-4" />
                        )}
                        Vote No
                      </Button>
                    </div>
                  )}

                  {proposal.approved && proposal.quorumReached && !proposal.executed && !proposal.expired && (
                    <Button
                      onClick={() => handleExecute(proposal.id)}
                      disabled={isExecuting}
                      className="w-full gap-2"
                    >
                      {isExecuting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isExecuting ? 'Executing...' : 'Execute Proposal'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
