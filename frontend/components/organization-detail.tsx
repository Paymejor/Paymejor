'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import { useOrganizationData } from '@/hooks/useOrganizationData'
import { OrganizationOverview } from '@/components/organization-overview'
import { ProposalList } from '@/components/proposal-list'
import { MemberManagement } from '@/components/member-management'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

/**
 * OrganizationDetail Component
 * 
 * Detailed view of a specific organization with tabbed interface.
 * Shows Overview, Proposals, and Members tabs.
 * 
 * Requirements: 10.2
 */

interface OrganizationDetailProps {
  orgAddress: string
  onBack: () => void
}

export function OrganizationDetail({ orgAddress, onBack }: OrganizationDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'members'>('overview')
  const { organization, proposals, isLoading, error, refreshOrganization } = useOrganizationData(orgAddress)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Button>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="space-y-6">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Organization Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Could not find organization at address {orgAddress}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button onClick={onBack} variant="ghost" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Organizations
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{organization.name}</CardTitle>
          <CardDescription className="font-mono">
            Organization Address: {orgAddress}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <OrganizationOverview 
                organization={organization} 
                orgAddress={orgAddress}
                onRefresh={refreshOrganization}
              />
            </TabsContent>

            <TabsContent value="proposals" className="mt-6">
              <ProposalList 
                proposals={proposals} 
                orgAddress={orgAddress}
                onRefresh={refreshOrganization}
              />
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <MemberManagement 
                orgAddress={orgAddress}
                organization={organization}
                onRefresh={refreshOrganization}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
