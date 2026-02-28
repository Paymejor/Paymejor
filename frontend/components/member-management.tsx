'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/hooks/useOrganization'
import { useWallet } from '@/lib/wallet-context'
import { Loader2, UserPlus, Users, Shield, AlertCircle } from 'lucide-react'
import { TOKEN_METADATA } from '@/lib/constants'

/**
 * MemberManagement Component
 * 
 * Displays organization members and allows admin to add new members.
 * Shows member identity commitments and collateral contributions.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

interface Organization {
  address: string
  name: string
  admin: string
  totalCollateral: bigint
  memberCount: number
}

interface Member {
  identityCommitment: string
  collateralContribution: bigint
  joinedAt: number
}

interface MemberManagementProps {
  orgAddress: string
  organization: Organization
  onRefresh: () => void
}

export function MemberManagement({ orgAddress, organization, onRefresh }: MemberManagementProps) {
  const { toast } = useToast()
  const { address } = useWallet()
  const { addMember } = useOrganization()

  const [identityCommitment, setIdentityCommitment] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  
  // TODO: Fetch actual members from contract
  const [members, setMembers] = useState<Member[]>([])

  const isAdmin = address?.toLowerCase() === organization.admin.toLowerCase()

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

  const handleAddMember = async () => {
    if (!identityCommitment.trim()) {
      toast({
        title: 'Invalid Commitment',
        description: 'Please enter a valid identity commitment',
        variant: 'destructive',
      })
      return
    }

    if (!isAdmin) {
      toast({
        title: 'Unauthorized',
        description: 'Only the admin can add members',
        variant: 'destructive',
      })
      return
    }

    setIsAdding(true)
    try {
      await addMember(orgAddress, identityCommitment)

      toast({
        title: 'Member Added',
        description: 'New member has been added to the organization',
      })

      setIdentityCommitment('')
      onRefresh()
    } catch (err) {
      console.error('Failed to add member:', err)
      toast({
        title: 'Add Member Failed',
        description: err instanceof Error ? err.message : 'Failed to add member',
        variant: 'destructive',
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Admin Controls */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Member
            </CardTitle>
            <CardDescription>
              Add a new member to the organization using their Semaphore identity commitment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identity-commitment">Identity Commitment</Label>
              <Input
                id="identity-commitment"
                value={identityCommitment}
                onChange={(e) => setIdentityCommitment(e.target.value)}
                placeholder="0x..."
                disabled={isAdding}
              />
              <p className="text-xs text-muted-foreground">
                The member's Semaphore identity commitment (public hash)
              </p>
            </div>

            <Button
              onClick={handleAddMember}
              disabled={isAdding || !identityCommitment}
              className="gap-2"
            >
              {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
              {isAdding ? 'Adding...' : 'Add Member'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Admin Badge */}
      {!isAdmin && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Only the organization admin can add new members
          </AlertDescription>
        </Alert>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({organization.memberCount})
              </CardTitle>
              <CardDescription>
                Organization members and their contributions
              </CardDescription>
            </div>
            <Badge variant="secondary">
              Admin: {organization.admin.slice(0, 6)}...{organization.admin.slice(-4)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Members Yet</h3>
              <p className="text-muted-foreground">
                {isAdmin 
                  ? 'Add the first member to start building your organization'
                  : 'The admin will add members to the organization'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member, index) => (
                <Card key={member.identityCommitment}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium">
                          Member #{index + 1}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs mt-1">
                          {member.identityCommitment.slice(0, 20)}...
                          {member.identityCommitment.slice(-20)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {formatBalance(member.collateralContribution, TOKEN_METADATA.wBTC.decimals)} wBTC
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Joined</p>
                        <p className="font-medium">{formatDate(member.joinedAt)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Contribution</p>
                        <p className="font-medium">
                          {formatBalance(member.collateralContribution, TOKEN_METADATA.wBTC.decimals)} wBTC
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            About Members
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Members are identified by their Semaphore identity commitments</p>
          <p>• Identity commitments are public hashes that don't reveal actual identities</p>
          <p>• Members can deposit collateral and vote on proposals anonymously</p>
          <p>• Only the admin can add new members to the organization</p>
        </CardContent>
      </Card>
    </div>
  )
}
