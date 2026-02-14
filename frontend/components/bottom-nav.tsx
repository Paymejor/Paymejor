'use client'

import { LayoutDashboard, PiggyBank, Zap, Lock, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deposit', label: 'Deposit', icon: PiggyBank },
    { id: 'borrow', label: 'Borrow', icon: Zap },
    { id: 'positions', label: 'Positions', icon: Lock },
    { id: 'exit', label: 'Exit', icon: LogOut },
  ]

  if (!mounted) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card">
      <div className="flex items-center justify-around px-2 py-3 md:justify-start md:px-6 md:gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={item.label}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
