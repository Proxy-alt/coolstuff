import { useState, useEffect, useCallback } from 'react'

interface RateLimitConfig {
  key: string
  maxRequests: number
  windowMs: number
  storageKey?: string
}

interface RateLimitState {
  canProceed: boolean
  remainingRequests: number
  resetTime: number
  timeUntilReset: number
}

export const useRateLimit = (config: RateLimitConfig): RateLimitState & { recordRequest: () => boolean } => {
  const [state, setState] = useState<RateLimitState>({
    canProceed: true,
    remainingRequests: config.maxRequests,
    resetTime: Date.now() + config.windowMs,
    timeUntilReset: config.windowMs
  })

  const storageKey = config.storageKey || `rateLimit_${config.key}`

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        const now = Date.now()

        // If window has expired, reset
        if (now >= data.resetTime) {
          return {
            requests: [],
            resetTime: now + config.windowMs
          }
        }

        // Filter out expired requests
        const validRequests = data.requests.filter((timestamp: number) =>
          now - timestamp < config.windowMs
        )

        return {
          requests: validRequests,
          resetTime: data.resetTime
        }
      }
    } catch (error) {
      console.error('Error loading rate limit data:', error)
    }

    return {
      requests: [],
      resetTime: Date.now() + config.windowMs
    }
  }, [storageKey, config.windowMs])

  const saveToStorage = useCallback((requests: number[], resetTime: number) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        requests,
        resetTime
      }))
    } catch (error) {
      console.error('Error saving rate limit data:', error)
    }
  }, [storageKey])

  const updateState = useCallback(() => {
    const data = loadFromStorage()
    const now = Date.now()
    const remainingRequests = Math.max(0, config.maxRequests - data.requests.length)
    const timeUntilReset = Math.max(0, data.resetTime - now)

    setState({
      canProceed: remainingRequests > 0,
      remainingRequests,
      resetTime: data.resetTime,
      timeUntilReset
    })
  }, [loadFromStorage, config.maxRequests])

  const recordRequest = useCallback((): boolean => {
    const data = loadFromStorage()
    const now = Date.now()

    // Check if we can make the request
    if (data.requests.length >= config.maxRequests) {
      updateState()
      return false
    }

    // Record the request
    const newRequests = [...data.requests, now]
    saveToStorage(newRequests, data.resetTime)
    updateState()

    return true
  }, [loadFromStorage, saveToStorage, updateState, config.maxRequests])

  // Update state on mount and periodically
  useEffect(() => {
    updateState()

    const interval = setInterval(updateState, 1000) // Update every second
    return () => clearInterval(interval)
  }, [updateState])

  return {
    ...state,
    recordRequest
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  feedback: {
    key: 'feedback_submission',
    maxRequests: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    storageKey: 'feedbackRateLimit'
  },
  changelog: {
    key: 'changelog_creation',
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    storageKey: 'changelogRateLimit'
  },
  api: {
    key: 'api_requests',
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    storageKey: 'apiRateLimit'
  }
} as const
