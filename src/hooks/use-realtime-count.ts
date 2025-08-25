import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRealtimeApplicants } from './use-realtime-applicants'
import { useRealtimeTickets } from './use-realtime-tickets'

// Types for the hook configuration
type CountType = 'applicants' | 'tickets'

interface CountConfig {
  type: CountType
  localStorageKey: string
  localStorageTimestampKey: string
  apiEndpoint: string
  statusFilter: string
  adminParam?: string
  roleFilter?: boolean
}

// Configuration for different count types
const COUNT_CONFIGS: Record<CountType, CountConfig> = {
  applicants: {
    type: 'applicants',
    localStorageKey: 'newApplicantsCount',
    localStorageTimestampKey: 'newApplicantsCountTimestamp',
    apiEndpoint: '/api/bpoc',
    statusFilter: 'submitted',
  },
  tickets: {
    type: 'tickets',
    localStorageKey: 'newTicketsCount',
    localStorageTimestampKey: 'newTicketsCountTimestamp',
    apiEndpoint: '/api/tickets',
    statusFilter: 'Approved', // Default for IT users
    adminParam: '&admin=true',
    roleFilter: true,
  }
}

export function useRealtimeCount(countType: CountType) {
  const config = COUNT_CONFIGS[countType]
  const [count, setCount] = useState(() => {
    // Initialize from localStorage if available and recent (within 5 minutes)
    try {
      const storedCount = localStorage.getItem(config.localStorageKey)
      const timestamp = localStorage.getItem(config.localStorageTimestampKey)
      
      if (storedCount && timestamp) {
        const age = Date.now() - parseInt(timestamp)
        const fiveMinutes = 5 * 60 * 1000
        
        if (age < fiveMinutes) {
          console.log(`useRealtimeCount: Using cached ${countType} count:`, storedCount)
          return parseInt(storedCount)
        }
      }
    } catch (error) {
      console.warn(`useRealtimeCount: Error reading from localStorage for ${countType}:`, error)
    }
    return 0
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Helper function to update count and persist to localStorage
  const updateCount = useCallback((newCount: number | ((prev: number) => number)) => {
    if (typeof newCount === 'function') {
      setCount(prev => {
        const result = newCount(prev)
        try {
          localStorage.setItem(config.localStorageKey, result.toString())
          localStorage.setItem(config.localStorageTimestampKey, Date.now().toString())
        } catch (error) {
          console.warn(`useRealtimeCount: Error writing to localStorage for ${countType}:`, error)
        }
        return result
      })
    } else {
      setCount(newCount)
      try {
        localStorage.setItem(config.localStorageKey, newCount.toString())
        localStorage.setItem(config.localStorageTimestampKey, Date.now().toString())
      } catch (error) {
        console.warn(`useRealtimeCount: Error writing to localStorage for ${countType}:`, error)
      }
    }
  }, [config.localStorageKey, config.localStorageTimestampKey, countType])

  // Fetch count from API
  const fetchCount = useCallback(async () => {
    if (!user?.id) {
      console.log(`useRealtimeCount: No user ID, skipping fetch for ${countType}`)
      if (countType === 'tickets') {
        updateCount(0)
        setLoading(false)
      }
      return
    }

    try {
      if (countType === 'tickets') {
        setLoading(true)
      }
      setError(null)
      
      let apiUrl = `${config.apiEndpoint}?status=${config.statusFilter}`
      
      // Add admin parameter for tickets if user is admin
      if (countType === 'tickets' && config.roleFilter) {
        const isAdmin = (user as any)?.roleName?.toLowerCase() === 'admin'
        if (isAdmin) {
          apiUrl = `${config.apiEndpoint}?status=For Approval${config.adminParam}`
        }
      }
      
      console.log(`useRealtimeCount: Fetching ${countType} from:`, apiUrl)
      
      const response = await fetch(apiUrl)
      
      if (response.ok) {
        const data = await response.json()
        const count = data.length
        console.log(`useRealtimeCount: Received ${countType}:`, data)
        console.log(`useRealtimeCount: Count:`, count)
        updateCount(count)
        setError(null)
      } else {
        throw new Error(`Failed to fetch ${countType}: ${response.status}`)
      }
    } catch (err) {
      console.error(`useRealtimeCount: Error fetching ${countType} count:`, err)
      setError(err instanceof Error ? err.message : `Failed to fetch ${countType} count`)
      if (countType === 'tickets') {
        updateCount(0)
      }
    } finally {
      if (countType === 'tickets') {
        setLoading(false)
      }
    }
  }, [user?.id, user?.roleName, config, countType, updateCount])

  // Real-time updates for applicants
  const { isConnected: applicantsConnected } = useRealtimeApplicants({
    onApplicantCreated: (newApplicant) => {
      if (countType === 'applicants' && newApplicant.status === 'submitted') {
        updateCount(prev => prev + 1)
      }
    },
    onApplicantUpdated: (updatedApplicant, oldApplicant) => {
      if (countType === 'applicants') {
        if (oldApplicant.status === 'submitted' && updatedApplicant.status !== 'submitted') {
          updateCount(prev => Math.max(0, prev - 1))
        } else if (oldApplicant.status !== 'submitted' && updatedApplicant.status === 'submitted') {
          updateCount(prev => prev + 1)
        }
      }
    },
    onApplicantDeleted: (deletedApplicant) => {
      if (countType === 'applicants' && deletedApplicant.status === 'submitted') {
        updateCount(prev => Math.max(0, prev - 1))
      }
    }
  })

  // Real-time updates for tickets
  const { isConnected: ticketsConnected } = useRealtimeTickets({
    onTicketCreated: (ticket) => {
      if (countType === 'tickets') {
        const isAdmin = (user as any)?.roleName?.toLowerCase() === 'admin'
        const relevantStatus = isAdmin ? 'For Approval' : 'Approved'
        
        if (ticket.status === relevantStatus) {
          updateCount(prev => prev + 1)
        }
      }
    },
    onTicketUpdated: (ticket, oldTicket) => {
      if (countType === 'tickets') {
        const isAdmin = (user as any)?.roleName?.toLowerCase() === 'admin'
        const relevantStatus = isAdmin ? 'For Approval' : 'Approved'
        
        const oldStatusRelevant = oldTicket?.status === relevantStatus
        const newStatusRelevant = ticket.status === relevantStatus
        
        if (oldStatusRelevant !== newStatusRelevant) {
          if (newStatusRelevant) {
            updateCount(prev => prev + 1)
          } else {
            updateCount(prev => Math.max(0, prev - 1))
          }
        }
      }
    },
    onTicketDeleted: (ticket) => {
      if (countType === 'tickets') {
        const isAdmin = (user as any)?.roleName?.toLowerCase() === 'admin'
        const relevantStatus = isAdmin ? 'For Approval' : 'Approved'
        
        if (ticket.status === relevantStatus) {
          updateCount(prev => Math.max(0, prev - 1))
        }
      }
    },
    autoConnect: countType === 'tickets',
    roleFilter: null
  })

  // Get the appropriate connection status
  const isConnected = countType === 'applicants' ? applicantsConnected : ticketsConnected

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      console.log(`useRealtimeCount: User changed, fetching ${countType} count. User:`, user)
      console.log(`useRealtimeCount: WebSocket connected:`, isConnected)
      fetchCount()
    }
  }, [user?.id, user?.roleName, fetchCount])

  // Real-time updates and polling fallback
  useEffect(() => {
    if (isConnected) {
      console.log(`useRealtimeCount: WebSocket connected for ${countType}, using real-time updates`)
    } else {
      console.log(`useRealtimeCount: WebSocket not connected for ${countType}, using polling fallback`)
      const interval = setInterval(fetchCount, 30000)
      return () => clearInterval(interval)
    }
  }, [isConnected, fetchCount])

  // Cleanup when user changes
  useEffect(() => {
    if (!user?.id) {
      console.log(`useRealtimeCount: Cleaning up for ${countType}`)
    }
  }, [user?.id, countType])

  return {
    count,
    loading: countType === 'tickets' ? loading : false,
    error,
    isConnected,
    refetch: fetchCount
  }
}

// Convenience hooks for backward compatibility
export function useNewApplicantsCount() {
  const result = useRealtimeCount('applicants')
  return {
    newApplicantsCount: result.count,
    error: result.error,
    isConnected: result.isConnected,
    refetch: result.refetch
  }
}

export function useNewTicketsCount() {
  const result = useRealtimeCount('tickets')
  return {
    newTicketsCount: result.count,
    loading: result.loading,
    error: result.error,
    isConnected: result.isConnected
  }
}

