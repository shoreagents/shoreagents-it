import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRealtimeApplicants } from './use-realtime-applicants'

// Persistent storage keys
const APPLICANTS_COUNT_KEY = 'newApplicantsCount'
const APPLICANTS_COUNT_TIMESTAMP_KEY = 'newApplicantsCountTimestamp'

export function useNewApplicantsCount() {
  const [newApplicantsCount, setNewApplicantsCount] = useState(() => {
    // Initialize from localStorage if available and recent (within 5 minutes)
    try {
      const storedCount = localStorage.getItem(APPLICANTS_COUNT_KEY)
      const timestamp = localStorage.getItem(APPLICANTS_COUNT_TIMESTAMP_KEY)
      
      if (storedCount && timestamp) {
        const age = Date.now() - parseInt(timestamp)
        const fiveMinutes = 5 * 60 * 1000
        
        if (age < fiveMinutes) {
          console.log('useNewApplicantsCount: Using cached count:', storedCount)
          return parseInt(storedCount)
        }
      }
    } catch (error) {
      console.warn('useNewApplicantsCount: Error reading from localStorage:', error)
    }
    return 0
  })
  
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { isConnected } = useRealtimeApplicants()

  // Helper function to update count and persist to localStorage
  const updateCount = useCallback((newCount: number | ((prev: number) => number)) => {
    if (typeof newCount === 'function') {
      setNewApplicantsCount(prev => {
        const result = newCount(prev)
        try {
          localStorage.setItem(APPLICANTS_COUNT_KEY, result.toString())
          localStorage.setItem(APPLICANTS_COUNT_TIMESTAMP_KEY, Date.now().toString())
        } catch (error) {
          console.warn('useNewApplicantsCount: Error writing to localStorage:', error)
        }
        return result
      })
    } else {
      setNewApplicantsCount(newCount)
      try {
        localStorage.setItem(APPLICANTS_COUNT_KEY, newCount.toString())
        localStorage.setItem(APPLICANTS_COUNT_TIMESTAMP_KEY, Date.now().toString())
      } catch (error) {
        console.warn('useNewApplicantsCount: Error writing to localStorage:', error)
      }
    }
  }, [])

  // Fetch new applicants count
  const fetchNewApplicantsCount = useCallback(async () => {
    if (!user?.id) {
      console.log('useNewApplicantsCount: No user ID, skipping fetch')
      return
    }

    try {
      console.log('useNewApplicantsCount: Fetching from: /api/bpoc-applicants?status=submitted')
      const response = await fetch('/api/bpoc-applicants?status=submitted')
      
      if (response.ok) {
        const applicants = await response.json()
        const count = applicants.length
        console.log('useNewApplicantsCount: Received applicants:', applicants)
        console.log('useNewApplicantsCount: Count:', count)
        updateCount(count)
        setError(null)
      } else {
        throw new Error(`Failed to fetch applicants: ${response.status}`)
      }
    } catch (err) {
      console.error('useNewApplicantsCount: Error fetching applicants count:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch applicants count')
    }
  }, [user?.id, updateCount])

  // Real-time updates for applicants count
  const { isConnected: realtimeConnected } = useRealtimeApplicants({
    onApplicantCreated: (newApplicant) => {
      // If new applicant has 'submitted' status, increment count
      if (newApplicant.status === 'submitted') {
        updateCount(prev => prev + 1)
      }
    },
    onApplicantUpdated: (updatedApplicant, oldApplicant) => {
      // Handle status changes that affect the count
      if (oldApplicant.status === 'submitted' && updatedApplicant.status !== 'submitted') {
        // Status changed from 'submitted' to something else, decrement count
        updateCount(prev => Math.max(0, prev - 1))
      } else if (oldApplicant.status !== 'submitted' && updatedApplicant.status === 'submitted') {
        // Status changed to 'submitted', increment count
        updateCount(prev => prev + 1)
      }
    },
    onApplicantDeleted: (deletedApplicant) => {
      // If deleted applicant had 'submitted' status, decrement count
      if (deletedApplicant.status === 'submitted') {
        updateCount(prev => Math.max(0, prev - 1))
      }
    }
  })

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      console.log('useNewApplicantsCount: User changed, fetching count. User:', user)
      console.log('useNewApplicantsCount: WebSocket connected:', isConnected)
      fetchNewApplicantsCount()
    }
  }, [user?.id, fetchNewApplicantsCount])

  // Real-time updates
  useEffect(() => {
    if (isConnected) {
      console.log('useNewApplicantsCount: WebSocket connected, using real-time updates')
      // Real-time updates will handle count changes automatically
    } else {
      console.log('useNewApplicantsCount: WebSocket not connected, using polling fallback')
      // Fallback to polling every 30 seconds if WebSocket is not connected
      const interval = setInterval(fetchNewApplicantsCount, 30000)
      return () => clearInterval(interval)
    }
  }, [isConnected, fetchNewApplicantsCount])

  // Cleanup polling interval when user changes
  useEffect(() => {
    if (!user?.id) {
      console.log('useNewApplicantsCount: Cleaning up polling interval')
    }
  }, [user?.id])

  return {
    newApplicantsCount,
    error,
    isConnected,
    refetch: fetchNewApplicantsCount
  }
}
