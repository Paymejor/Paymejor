'use client'

import { useState } from 'react'
import { useWallet } from '@/lib/wallet-context'
import { OrganizationList } from '@/components/organization-list'
import { CreateOrganization } from '@/components/create-organization'
import { OrganizationDetail } from '@/components/organization-detail'

/**
 * OrganizationsTab Component
 * 
 * Main tab component for organization management with three views:
 * - list: Display user's organizations
 * - create: Form to create new organization
 * - detail: View and interact with specific organization
 * 
 * Requirements: 10.2, 10.3
 */

type ViewState = 'list' | 'create' | 'detail'

export function OrganizationsTab() {
  const { address, isConnected } = useWallet()
  const [view, setView] = useState<ViewState>('list')
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)

  const handleSelectOrg = (orgAddress: string) => {
    setSelectedOrg(orgAddress)
    setView('detail')
  }

  const handleCreateClick = () => {
    setView('create')
  }

  const handleBackToList = () => {
    setView('list')
    setSelectedOrg(null)
  }

  return (
    <div className="space-y-6">
      {view === 'list' && (
        <OrganizationList 
          onSelect={handleSelectOrg} 
          onCreate={handleCreateClick} 
        />
      )}
      
      {view === 'create' && (
        <CreateOrganization onBack={handleBackToList} />
      )}
      
      {view === 'detail' && selectedOrg && (
        <OrganizationDetail 
          orgAddress={selectedOrg} 
          onBack={handleBackToList} 
        />
      )}
    </div>
  )
}
