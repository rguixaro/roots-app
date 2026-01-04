import { useEffect, useRef } from 'react'

/**
 * Hook to manage CloudFront cookies
 * Cookies expire after 6 hours
 * @param enabled - Whether to enable the cookie refresh mechanism
 */
export function useCookies(enabled: boolean = true) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) return

    const refreshCookies = async () => {
      try {
        const response = await fetch('/api/cookies/refresh', {
          method: 'POST',
          credentials: 'include',
        })

        if (!response.ok) console.error('Failed to refresh cookies:', response.statusText)
      } catch (_) {}
    }

    const REFRESH_INTERVAL = 5 * 60 * 60 * 1000

    refreshCookies()

    intervalRef.current = setInterval(refreshCookies, REFRESH_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enabled])
}
