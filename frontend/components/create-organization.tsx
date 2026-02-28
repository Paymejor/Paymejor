'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/hooks/useOrganization'
import { Loader2, ArrowLeft } from 'lucide-react'

/**
 * CreateOrganization Component
 * 
 * Form for creating new privacy-preserving organizations.
 * Allows users to input organization name and deploy a new organization contract.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

interface CreateOrganizationProps {
  onBack: () => void
}

export function CreateOrganization({ onBack }: CreateOrganizationProps) {
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const { createOrganization } = useOrganization()

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Invalid Name',
        description: 'Please enter an organization name',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      const orgAddress = await createOrganization(name)
      
      toast({
        title: 'Organization Created!',
        description: `Address: ${orgAddress.slice(0, 10)}...${orgAddress.slice(-8)}`,
      })
      
      // Navigate back to list after successful creation
      onBack()
    } catch (err) {
      console.error('Failed to create organization:', err)
      
      toast({
        title: 'Creation Failed',
        description: err instanceof Error ? err.message : 'Failed to create organization',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button 
        onClick={onBack} 
        variant="ghost" 
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Organizations
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create Organization</CardTitle>
          <CardDescription>
            Create a privacy-preserving organization for pooled borrowing using Semaphore Protocol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Lending DAO"
              disabled={isCreating}
              maxLength={31}
            />
            <p className="text-xs text-muted-foreground">
              Choose a memorable name for your organization
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={onBack} 
              variant="outline"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isCreating || !name.trim()}
              className="gap-2"
            >
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isCreating ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. A new organization contract will be deployed to Starknet</p>
          <p>2. You will be set as the admin with member management rights</p>
          <p>3. A Semaphore group will be created for anonymous voting</p>
          <p>4. You can then add members and start pooling collateral</p>
        </CardContent>
      </Card>
    </div>
  )
}
