'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { Navbar } from '@/components/navbar'
import { WalletProvider } from '@/lib/wallet-context'
import { BalanceProvider } from '@/lib/balance-context'
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
import { useToast } from '@/hooks/use-toast'

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
  const { isConnected, isReconnecting, connect } = useWallet()
  const { toast } = useToast()
  const [showConnectModal, setShowConnectModal] = useState(false)
  const hasShownModal = useRef(false)
  const [isFallbackConnecting, setIsFallbackConnecting] = useState(false)
  const connectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (hasShownModal.current) return
    const shouldShow = sessionStorage.getItem('pmj_show_connect_modal') === '1'
    if (!shouldShow) return

    hasShownModal.current = true
    setShowConnectModal(true)
    connectTimeout.current = setTimeout(() => {
      setShowConnectModal(false)
      sessionStorage.removeItem('pmj_show_connect_modal')
      toast({
        title: 'Wallet Connection Timed Out',
        description: 'Please try connecting again.',
        variant: 'destructive',
        duration: 5000,
      })
    }, 15000)
  }, [toast])

  useEffect(() => {
    if (!showConnectModal) return

    if (isConnected) {
      setShowConnectModal(false)
      sessionStorage.removeItem('pmj_show_connect_modal')
      if (connectTimeout.current) {
        clearTimeout(connectTimeout.current)
        connectTimeout.current = null
      }
      return
    }

    if (!isReconnecting) {
      setShowConnectModal(false)
      if (connectTimeout.current) {
        clearTimeout(connectTimeout.current)
        connectTimeout.current = null
      }
    }
  }, [showConnectModal, isReconnecting, isConnected])

  useEffect(() => {
    const shouldHandle = sessionStorage.getItem('pmj_show_connect_modal') === '1'
    if (!shouldHandle) return
    if (isConnected || isReconnecting || isFallbackConnecting) return

    setIsFallbackConnecting(true)
    connect()
      .catch(() => {
        // Navbar handles user-facing errors
      })
      .finally(() => {
        setIsFallbackConnecting(false)
        sessionStorage.removeItem('pmj_show_connect_modal')
        if (connectTimeout.current) {
          clearTimeout(connectTimeout.current)
          connectTimeout.current = null
        }
      })
  }, [isConnected, isReconnecting, isFallbackConnecting, connect])

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
      <Dialog open={showConnectModal || isFallbackConnecting}>
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
      <BalanceProvider>
        <HomeContent />
      </BalanceProvider>
    </WalletProvider>
  )
}
