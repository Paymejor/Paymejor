'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
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
import { useWallet } from '@/lib/wallet-context'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

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
  const { isConnected, isReconnecting } = useWallet()
  const [showConnectModal, setShowConnectModal] = useState(false)
  const hasShownModal = useRef(false)

  useEffect(() => {
    if (hasShownModal.current) return
    const shouldShow = sessionStorage.getItem('pmj_show_connect_modal') === '1'
    if (!shouldShow) return

    hasShownModal.current = true
    setShowConnectModal(true)
  }, [])

  useEffect(() => {
    if (!showConnectModal) return
    if (!isReconnecting || isConnected) {
      setShowConnectModal(false)
      sessionStorage.removeItem('pmj_show_connect_modal')
    }
  }, [showConnectModal, isReconnecting, isConnected])

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
      <Dialog open={showConnectModal}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center gap-3 py-4">
            <Spinner className="h-6 w-6 text-primary" />
            <div className="text-center">
              <p className="text-base font-semibold">Connecting Wallet</p>
              <p className="text-sm text-muted-foreground">
                Opening your wallet to complete the connection...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
