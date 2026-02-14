'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { WalletProvider } from '@/lib/wallet-context'
import { BottomNav } from '@/components/bottom-nav'
import { DashboardTab } from '@/components/tabs/dashboard-tab'
import { DepositTab } from '@/components/tabs/deposit-tab'
import { BorrowTab } from '@/components/tabs/borrow-tab'
import { PositionsTab } from '@/components/tabs/positions-tab'
import { ExitTab } from '@/components/tabs/exit-tab'
import { useSearchParams } from 'next/navigation'

function HomeContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

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
