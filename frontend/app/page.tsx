'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ClickSpark from '@/components/ClickSpark'
import { Shield, Zap, Lock, TrendingUp } from 'lucide-react'
import { connect as connectStarknet } from '@starknet-io/get-starknet'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export default function LandingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  
  // Prefetch app route to make navigation snappy
  useEffect(() => {
    router.prefetch('/app')
  }, [router])

  const handleLaunchApp = async () => {
    setIsConnecting(true)
    try {
      // Otherwise, open wallet selector on landing page
      const starknet = await connectStarknet({
        modalMode: 'alwaysAsk',
        modalTheme: 'dark',
      })

      if (!starknet) {
        throw new Error('No wallet selected')
      }

      let account = (starknet as any).account
      if (!account) {
        try {
          if (typeof (starknet as any).enable === 'function') {
            await (starknet as any).enable()
          } else if (typeof (starknet as any).request === 'function') {
            await (starknet as any).request({ type: 'wallet_requestAccounts' })
          }
        } catch (enableError) {
          console.warn('Wallet enable/request failed:', enableError)
        }
        account = (starknet as any).account
      }

      if (!account) {
        throw new Error('No account found. Please unlock your wallet')
      }

      // Signal /app to show loading modal and allow reconnect
      sessionStorage.setItem('pmj_show_connect_modal', '1')
      sessionStorage.setItem('pmj_allow_reconnect', '1')

      router.push('/app')
    } catch (error) {
      console.error('Wallet connection error:', error)

      // Show error toast
      let errorMessage = 'Connection Failed'
      let errorDescription = 'Please try again'

      if (error instanceof Error) {
        if (error.message.includes('No wallet selected')) {
          errorMessage = 'No Wallet Selected'
          errorDescription = 'Please select a wallet to continue'
        } else if (error.message.includes('No account')) {
          errorMessage = 'No Account Found'
          errorDescription = 'Please unlock your wallet and try again'
        } else if (error.message.includes('rejected') || error.message.includes('denied')) {
          errorMessage = 'Connection Rejected'
          errorDescription = 'You rejected the connection request'
        } else {
          errorDescription = error.message
        }
      }

      toast({
        title: errorMessage,
        description: errorDescription,
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <ClickSpark
      sparkColor="#ffffff"
      sparkSize={13}
      sparkRadius={17}
      sparkCount={6}
      duration={400}
      easing="ease-out"
      extraScale={1}
    >
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Unlock Liquidity from Your{' '}
                <span className="text-primary">BTC Collateral</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                PayMeJor is a decentralized BTC lending platform that lets you borrow against your Bitcoin 
                without selling. Access instant liquidity while maintaining your BTC exposure.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-base"
                onClick={handleLaunchApp}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Launch App'}
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose PayMeJor?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built on Starknet for secure, efficient, and transparent BTC-backed lending
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Secure & Trustless</CardTitle>
                <CardDescription>
                  Your BTC collateral is secured by smart contracts on Starknet. No intermediaries, no custody risks.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Instant Liquidity</CardTitle>
                <CardDescription>
                  Borrow stablecoins instantly against your BTC. No credit checks, no waiting periods.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Keep Your BTC</CardTitle>
                <CardDescription>
                  Maintain exposure to BTC price appreciation while accessing the liquidity you need.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Competitive Rates</CardTitle>
                <CardDescription>
                  Benefit from transparent, market-driven interest rates with no hidden fees.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Connect your wallet and start borrowing against your BTC in minutes
            </p>
            <Button 
              size="lg" 
              className="text-base"
              onClick={handleLaunchApp}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Launch App'}
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 PayMeJor. Built on Starknet.</p>
          </div>
        </footer>
      </div>
    </ClickSpark>
  )
}
