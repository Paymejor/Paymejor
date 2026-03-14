import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'

import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { EnvValidator } from '@/components/env-validator'

export const metadata: Metadata = {
  title: 'PayMeJor - BTC Lending Platform',
  description: 'Unlock liquidity from your BTC collateral',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <EnvValidator />
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
