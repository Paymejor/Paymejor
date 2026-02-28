'use client'

import { useState, useEffect, Suspense } from 'react'
import { Navbar } from '@/components/navbar'
import { WalletProvider } from '@/lib/wallet-context'
import { BottomNav } from '@/components/bottom-nav'
import { DashboardTab } from '@/components/tabs/dashboard-tab'
import { DepositTab } from '@/components/tabs/deposit-tab'
import { BorrowTab } from '@/components/tabs/borrow-tab'
import { PositionsTab } from '@/components/tabs/positions-tab'
import { ExitTab } from '@/components/tabs/exit-tab'
import { RampTab } from '@/components/tabs/ramp-tab'
import { OrganizationsTab } from '@/components/tabs/organizations-tab'
import { useSearchParams } from 'next/navigation'
import { isMavaPayEnabled } from '@/lib/constants'

function TabManager({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      onTabChange(tab)
    }
  }, [searchParams, onTabChange])

  return null
}

function HomeContent() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />
      case 'deposit':
        return <DepositTab />
      case 'borrow':
        return <BorrowTab />
      case 'positions':
        return <PositionsTab />
      case 'ramp':
        // Only render Ramp tab if MavaPay is enabled
        return isMavaPayEnabled() ? <RampTab /> : <DashboardTab />
      case 'organizations':
        return <OrganizationsTab />
      case 'exit':
        return <ExitTab />
      default:
        return <DashboardTab />
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
          <div className="space-y-6">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Tab Manager with Suspense */}
      <Suspense fallback={null}>
        <TabManager onTabChange={setActiveTab} />
      </Suspense>
    </div>
  )
}

export default function Page() {
  return (
    <WalletProvider>
      <HomeContent />
    </WalletProvider>
  )
}
