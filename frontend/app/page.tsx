'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ClickSpark from '@/components/ClickSpark'
import { Shield, Zap, Lock, TrendingUp } from 'lucide-react'

export default function LandingPage() {
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
              <Button asChild size="lg" className="text-base">
                <Link href="/app">Launch App</Link>
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
            <Button asChild size="lg" className="text-base">
              <Link href="/app">Launch App</Link>
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
