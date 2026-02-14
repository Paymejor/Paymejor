import { Loader2 } from 'lucide-react'

export interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ className = '', size = 'sm' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  )
}
