'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * useCache Hook
 * 
 * Generic caching hook with TTL (time-to-live) and manual invalidation.
 * Supports automatic refresh intervals and cache invalidation on events.
 * 
 * Requirements: NFR-5.1, NFR-5.3, NFR-5.4
 */

interface CacheOptions<T> {
  key: string
  ttl?: number // Time to live in milliseconds (default: 30 seconds)
  refreshInterval?: number // Auto-refresh interval in milliseconds (0 = disabled)
  deferRefreshMs?: number // Delay before starting auto-refresh (default: 0)
  fetchFn: () => Promise<T>
  onError?: (error: Error) => void
  invalidateOn?: string[] // Event names that should invalidate this cache
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  isStale: boolean
}

// Global cache store (shared across hook instances with same key)
const cacheStore = new Map<string, CacheEntry<any>>()

// Event emitter for cache invalidation
const cacheInvalidationEvent = 'cache_invalidation'

export function useCache<T>(options: CacheOptions<T>) {
  const {
    key,
    ttl = 30000, // 30 seconds default
    refreshInterval = 0,
    fetchFn,
    onError,
    invalidateOn = [],
  } = options

  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback((entry: CacheEntry<T> | undefined): boolean => {
    if (!entry) return false
    const now = Date.now()
    return (now - entry.timestamp) < ttl && !entry.isStale
  }, [ttl])

  /**
   * Fetch data and update cache
   */
  const fetchData = useCallback(async (force = false) => {
    // Check cache first (unless forced)
    if (!force) {
      const cached = cacheStore.get(key) as CacheEntry<T> | undefined
      if (isCacheValid(cached)) {
        setData(cached.data)
        setLastFetch(cached.timestamp)
        return cached.data
      }
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await fetchFn()
      
      if (!isMountedRef.current) return result

      const now = Date.now()
      const entry: CacheEntry<T> = {
        data: result,
        timestamp: now,
        isStale: false,
      }

      // Update cache store
      cacheStore.set(key, entry)
      
      setData(result)
      setLastFetch(now)
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch data')
      
      if (!isMountedRef.current) return null

      setError(error)
      
      if (onError) {
        onError(error)
      }
      
      console.error(`Cache fetch error for key "${key}":`, error)
      return null
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [key, fetchFn, isCacheValid, onError])

  /**
   * Manually invalidate cache for this key
   */
  const invalidate = useCallback(() => {
    const cached = cacheStore.get(key)
    if (cached) {
      cached.isStale = true
      cacheStore.set(key, cached)
    }
    
    // Dispatch invalidation event
    window.dispatchEvent(new CustomEvent(cacheInvalidationEvent, {
      detail: { key }
    }))
  }, [key])

  /**
   * Manually refresh data (bypass cache)
   */
  const refresh = useCallback(async () => {
    return await fetchData(true)
  }, [fetchData])

  /**
   * Clear cache entry
   */
  const clear = useCallback(() => {
    cacheStore.delete(key)
    setData(null)
    setLastFetch(0)
  }, [key])

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchData()
  }, [fetchData])

  /**
   * Set up auto-refresh interval
   */
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData(true)
      }, refreshInterval)

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
        }
      }
    }
  }, [refreshInterval, fetchData])

  /**
   * Listen for cache invalidation events
   */
  useEffect(() => {
    const handleInvalidation = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail.key === key) {
        fetchData(true)
      }
    }

    window.addEventListener(cacheInvalidationEvent, handleInvalidation)
    return () => window.removeEventListener(cacheInvalidationEvent, handleInvalidation)
  }, [key, fetchData])

  /**
   * Listen for custom invalidation events
   */
  useEffect(() => {
    if (invalidateOn.length === 0) return

    const handleCustomInvalidation = () => {
      invalidate()
      fetchData(true)
    }

    invalidateOn.forEach(eventName => {
      window.addEventListener(eventName, handleCustomInvalidation)
    })

    return () => {
      invalidateOn.forEach(eventName => {
        window.removeEventListener(eventName, handleCustomInvalidation)
      })
    }
  }, [invalidateOn, invalidate, fetchData])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    lastFetch,
    refresh,
    invalidate,
    clear,
    isCached: data !== null && !isLoading,
  }
}

/**
 * Utility function to invalidate cache by key from anywhere
 */
export function invalidateCache(key: string) {
  const cached = cacheStore.get(key)
  if (cached) {
    cached.isStale = true
    cacheStore.set(key, cached)
  }
  
  window.dispatchEvent(new CustomEvent(cacheInvalidationEvent, {
    detail: { key }
  }))
}

/**
 * Utility function to clear all caches
 */
export function clearAllCaches() {
  cacheStore.clear()
  window.dispatchEvent(new CustomEvent(cacheInvalidationEvent, {
    detail: { key: '*' }
  }))
}
