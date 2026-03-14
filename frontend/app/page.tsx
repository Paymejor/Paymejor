'use client'

import { useRouter } from 'next/navigation'
import { connect as connectStarknet } from '@starknet-io/get-starknet'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

const partnerLogos = [
  'Straknet',
  'Tongo',
  'Semaphore',
  'Vesu',
  'Atomiq',
  'Xverse',
  'Ready Wallet',
]

const featureCards = [
  {
    title: 'True Privacy by Design',
    body: 'Semaphore ZK-proofs and Tongo SDK ensure shielded balances. Your identity remains hidden through selective disclosure.',
  },
  {
    title: 'Bitcoin Remains Yours',
    body: 'Utilize Atomiq bridge for non-custodial transfers to wBTC collateral on Vesu lending pools seamlessly.',
  },
  {
    title: 'Nigeria Optimized',
    body: 'Direct BTC to NGN fiat on/off-ramp. Lightning fast 10-minute settlements for local liquidity needs.',
  },
  {
    title: 'Group-Powered',
    body: 'Form private organizations, participate in anonymous voting, and trade via AVNU DEX liquidity.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Bridge & Deposit',
    body: 'Move BTC via Atomiq to Starknet wBTC pools with zero counterparty risk.',
  },
  {
    step: '02',
    title: 'Propose Privately',
    body: 'Create a loan request using ZK-proofs that hide your specific wallet holdings.',
  },
  {
    step: '03',
    title: 'Vote Anonymously',
    body: 'Community liquidity providers approve requests through Semaphore voting.',
  },
  {
    step: '04',
    title: 'Borrow & Convert',
    body: 'Receive funds instantly and off-ramp to NGN or USDC as needed.',
  },
]

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

      if (!(starknet as any).account) {
        throw new Error('No account found. Please unlock your wallet')
      }

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
    <div className="min-h-screen bg-[#070b08] text-white">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Unbounded:wght@500;600;700&display=swap');
        .font-headline { font-family: 'Unbounded', 'Space Grotesk', system-ui, sans-serif; }
        .font-body { font-family: 'Space Grotesk', system-ui, sans-serif; }
      `}</style>

      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.25),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,_rgba(14,116,144,0.28),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(0,0,0,0.7),_rgba(0,0,0,0.1))]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#070b08]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-400/90 text-black flex items-center justify-center font-bold">P</div>
            <span className="font-headline text-lg tracking-tight">PayMejor</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a className="transition hover:text-white" href="#features">Features</a>
            <a className="transition hover:text-white" href="#process">Process</a>
            <a className="transition hover:text-white" href="#security">Security</a>
          </nav>
          <button
            className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black shadow-[0_0_24px_rgba(16,185,129,0.5)] transition hover:bg-emerald-300"
            onClick={handleLaunchApp}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Launch App'}
          </button>
        </div>
      </header>

      <main className="font-body">
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-[11px] uppercase tracking-[0.3em] text-emerald-200">
              Starknet Powered Liquidity
            </span>
            <h1 className="font-headline mt-6 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Unlock Liquidity from Your
              <span className="block text-emerald-300">Bitcoin</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/70 sm:text-lg">
              Borrow against your BTC without selling, without revealing your identity. Institutional-grade privacy powered by Semaphore ZK-proofs.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black shadow-[0_0_24px_rgba(16,185,129,0.45)] transition hover:bg-emerald-300"
                onClick={handleLaunchApp}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Launch App'}
              </button>
              <button className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white">
                View Docs
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute right-0 top-1/2 h-[360px] w-[360px] -translate-y-1/2 rounded-full bg-emerald-400/30 blur-3xl" />
            <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_60%)]" />
              <div className="relative flex h-72 items-center justify-center rounded-2xl border border-white/10 bg-[#0b110d]">
                <div className="absolute h-56 w-56 rounded-full border border-emerald-400/30" />
                <div className="absolute h-44 w-44 rounded-full border border-emerald-400/50" />
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400 text-3xl font-bold text-black shadow-[0_0_24px_rgba(16,185,129,0.6)]">₿</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6">
          <div className="border-y border-white/5 py-6 text-center text-xs uppercase tracking-[0.35em] text-white/40">
            Integrated With Industry Standards
          </div>
          <div className="grid grid-cols-2 gap-4 py-6 text-sm text-white/70 sm:grid-cols-3 lg:grid-cols-7">
            {partnerLogos.map((logo) => (
              <div
                key={logo}
                className="flex items-center justify-center rounded-xl border border-white/5 bg-white/5 px-3 py-2"
              >
                {logo}
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="text-center">
            <h2 className="font-headline text-3xl font-semibold sm:text-4xl">Why Choose PayMejor?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/60">
              Built for secure, efficient, and transparent BTC-backed lending.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-emerald-500/10 bg-gradient-to-b from-emerald-500/10 to-white/0 p-6 text-left shadow-[0_15px_40px_rgba(0,0,0,0.4)]"
              >
                <div className="mb-4 h-10 w-10 rounded-xl bg-emerald-400/20" />
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm text-white/60">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="process" className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="font-headline text-3xl font-semibold sm:text-4xl">Four Steps to Private Liquidity</h2>
              <p className="mt-4 text-base text-white/60">
                Our workflow ensures you never have to sacrifice ownership for access. From bridging to settlement, every step is cryptographically secured.
              </p>
              <div className="mt-8 grid gap-6">
                {steps.map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="text-emerald-300/80 text-sm font-semibold">{item.step}</div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm text-white/60">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-8 top-12 h-56 w-56 rounded-full bg-emerald-400/25 blur-3xl" />
              <div className="relative rounded-3xl border border-white/10 bg-[#0b110d] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>MavaPay Bridge</span>
                  <span className="text-emerald-300">● Live</span>
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs text-white/50">You Send</div>
                  <div className="mt-2 flex items-center justify-between text-lg font-semibold">
                    <span>1,000,000</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">NGN</span>
                  </div>
                  <div className="my-4 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full border border-emerald-300/60 bg-emerald-400/10 text-center text-lg leading-10 text-emerald-200">↓</div>
                  </div>
                  <div className="text-xs text-white/50">You Receive (Approx.)</div>
                  <div className="mt-2 flex items-center justify-between text-lg font-semibold">
                    <span>0.0125</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">BTC</span>
                  </div>
                  <button className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black">
                    Execute Bridge
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="mx-auto w-full max-w-5xl px-6 pb-20">
          <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 via-white/5 to-emerald-500/5 p-10 text-center shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
            <h2 className="font-headline text-3xl font-semibold sm:text-4xl">Ready to Get Started?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/60">
              Connect your wallet and start borrowing against your BTC in minutes. Experience the future of private, decentralized finance on Starknet.
            </p>
            <button
              className="mt-8 rounded-xl bg-emerald-400 px-8 py-3 text-sm font-semibold text-black shadow-[0_0_24px_rgba(16,185,129,0.45)] transition hover:bg-emerald-300"
              onClick={handleLaunchApp}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Launch App Now'}
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 text-sm text-white/60 md:grid-cols-4">
          <div>
            <h3 className="font-headline text-base text-white">Platform</h3>
            <div className="mt-3 space-y-2">
              <p>App Console</p>
              <p>Analytics</p>
              <p>Security Audit</p>
            </div>
          </div>
          <div>
            <h3 className="font-headline text-base text-white">Resources</h3>
            <div className="mt-3 space-y-2">
              <p>Documentation</p>
              <p>Whitepaper</p>
              <p>API Reference</p>
            </div>
          </div>
          <div>
            <h3 className="font-headline text-base text-white">Community</h3>
            <div className="mt-3 space-y-2">
              <p>Twitter / X</p>
              <p>Discord</p>
              <p>Telegram</p>
            </div>
          </div>
          <div>
            <h3 className="font-headline text-base text-white">Development</h3>
            <div className="mt-3 space-y-2">
              <p>View on GitHub</p>
              <p>Open Issues</p>
              <p>Contribution</p>
            </div>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 pb-8 text-xs text-white/40 md:flex-row">
          <span>© 2024 PayMejor. Built on Starknet.</span>
          <div className="flex gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
