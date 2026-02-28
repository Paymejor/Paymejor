'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/hooks/useOrganization'
import { useSemaphore } from '@/hooks/useSemaphore'
import { Loader2, ArrowLeft, Lock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * CreateProposal Component
 * 
 * Form for creating anonymous borrow proposals.
 * Generates Semaphore proof to prove membership without revealing identity.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

interface CreateProposalProps {
  orgAddress: string
  onBack: () => void
  onSuccess: () => void
}

export function CreateProposal({ orgAddress, onBack, onSuccess }: CreateProposalProps) {
  const { toast } = useToast()
  const { createProposal } = useOrganization()
  const { generateProposalProof, identityCommitment } = useSemaphore()

  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [duration, setDuration] = useState('7') // Default 7 days
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid borrow amount',
        variant: 'destructive',
      })
      return
    }

    if (!purpose.trim()) {
      toast({
        title: 'Invalid Purpose',
        description: 'Please describe the purpose of this proposal',
        variant: 'destructive',
      })
      return
    }

    if (!duration || parseInt(duration) <= 0) {
      toast({
        title: 'Invalid Duration',
        description: 'Please enter a valid duration in days',
        variant: 'destructive',
      })
      return
    }

    if (!identityCommitment) {
      toast({
        title: 'Identity Not Ready',
        description: 'Your Semaphore identity is not initialized',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      // TODO: Get actual group members for proof generation
      const members: string[] = []
      
      // Generate Semaphore proof
      const proof = await generateProposalProof(
        orgAddress,
        members,
        amount,
        purpose
      )

      // Create proposal on-chain
      await createProposal(orgAddress, proof, amount, purpose, parseInt(duration))

      toast({
        title: 'Proposal Created',
        description: 'Your anonymous proposal has been submitted',
      })

      onSuccess()
    } catch (err) {
      console.error('Failed to create proposal:', err)
      toast({
        title: 'Creation Failed',
        description: err instanceof Error ? err.message : 'Failed to create proposal',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button onClick={onBack} variant="ghost" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Proposals
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create Anonymous Proposal</CardTitle>
          <CardDescription>
            Propose borrowing USDC against the organization's pooled collateral
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Privacy Notice */}
          <Alert className="border-primary bg-primary/5">
            <Lock className="h-4 w-4 text-primary" />
            <AlertDescription>
              Your identity will remain anonymous. Only your Semaphore proof will be verified on-chain.
            </AlertDescription>
          </Alert>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Borrow Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000.000000"
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              Amount of USDC to borrow from Vesu
            </p>
          </div>

          {/* Purpose Input */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe why you need this loan..."
              disabled={isCreating}
              rows={4}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {purpose.length}/200 characters
            </p>
          </div>

          {/* Duration Input */}
          <div className="space-y-2">
            <Label htmlFor="duration">Voting Duration (days)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="7"
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              How long members can vote on this proposal (1-30 days)
            </p>
          </div>

          {/* Identity Status */}
          {identityCommitment && (
            <div className="space-y-2">
              <Label>Your Identity Commitment</Label>
              <div className="text-xs font-mono bg-muted p-2 rounded">
                {identityCommitment.slice(0, 20)}...{identityCommitment.slice(-20)}
              </div>
              <p className="text-xs text-muted-foreground">
                This commitment proves you're a member without revealing your identity
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={onBack} variant="outline" disabled={isCreating}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !amount || !purpose || !duration}
              className="gap-2"
            >
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isCreating ? 'Creating...' : 'Create Proposal'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Your Semaphore proof will be generated and verified on-chain</p>
          <p>2. Members can vote anonymously on your proposal</p>
          <p>3. If approved and quorum is reached, anyone can execute the proposal</p>
          <p>4. Borrowed USDC will be transferred to your wallet address</p>
        </CardContent>
      </Card>
    </div>
  )
}
