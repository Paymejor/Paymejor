'use client'

import { LayoutDashboard, Download, TrendingUp, Package, LogOut, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  isOpen: boolean
  onClose?: () => void
}

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Deposit', href: '/?tab=deposit', icon: Download },
  { label: 'Borrow & Loop', href: '/?tab=borrow', icon: TrendingUp },
  { label: 'Positions', href: '/?tab=positions', icon: Package },
  { label: 'Exit to NGN', href: '/?tab=exit', icon: LogOut },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 z-40 h-[calc(100vh-64px)] w-64 border-r border-border bg-card transition-transform duration-300 md:relative md:top-0 md:h-screen md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col p-4">
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="mb-4 flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary md:hidden"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Navigation items */}
          <nav className="flex flex-1 flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={`w-full justify-start gap-3 ${
                      isActive
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : ''
                    }`}
                    onClick={onClose}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Footer info */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              🛡️ Your assets are shielded using Tongo privacy protocol
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
