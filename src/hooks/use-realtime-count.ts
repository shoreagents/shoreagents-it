import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRealtimeApplicants } from './use-realtime-applicants'
import { useRealtimeTickets } from './use-realtime-tickets'
import { useRealtimeEvents } from './use-realtime-events'
import { useRealtimeAnnouncements } from './use-realtime-announcements'

// Types for the hook configuration
type CountType = 'applicants' | 'tickets' | 'events' | 'announcements'

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
  },
  events: {
    type: 'events',
    localStorageKey: 'todayEventsCount',
    localStorageTimestampKey: 'todayEventsCountTimestamp',
    apiEndpoint: '/api/events/counts',
    statusFilter: 'today',
  },
  announcements: {
    type: 'announcements',
    localStorageKey: 'activeAnnouncementsCount',
    localStorageTimestampKey: 'activeAnnouncementsCountTimestamp',
    apiEndpoint: '/api/announcements/counts',
    statusFilter: 'active',
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
      
      const response = await fetch(apiUrl)
      
      if (response.ok) {
        const data = await response.json()
        let count: number
        
        if (countType === 'events') {
          // Events API returns { today: number }
          count = data.today || 0
        } else if (countType === 'announcements') {
          // Announcements API returns { active: number }
          count = data.active || 0
        } else {
          // Other APIs return arrays
          count = data.length
        }
        
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
        const relevantStatus = 'For Approval' // Both admin and IT users count For Approval tickets
        
        if (ticket.status === relevantStatus) {
          updateCount(prev => prev + 1)
        }
      }
    },
    onTicketUpdated: (ticket, oldTicket) => {
      if (countType === 'tickets') {
        const relevantStatus = 'For Approval' // Both admin and IT users count For Approval tickets
        
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
        const relevantStatus = 'For Approval' // Both admin and IT users count For Approval tickets
        
        if (ticket.status === relevantStatus) {
          updateCount(prev => Math.max(0, prev - 1))
        }
      }
    },
    autoConnect: countType === 'tickets',
    enableNotifications: true, // Enable global notifications
    roleFilter: countType === 'tickets' ? (user as any)?.roleName?.toLowerCase() === 'admin' ? null : 1 : null
  })

  // Real-time updates for events
  const { isConnected: eventsConnected } = useRealtimeEvents({
    onEventCreated: (newEvent) => {
      if (countType === 'events' && newEvent.status === 'today') {
        updateCount(prev => prev + 1)
      }
    },
    onEventUpdated: (updatedEvent, oldEvent) => {
      if (countType === 'events') {
        const oldStatusToday = oldEvent?.status === 'today'
        const newStatusToday = updatedEvent.status === 'today'
        
        if (oldStatusToday !== newStatusToday) {
          if (newStatusToday) {
            updateCount(prev => prev + 1)
          } else {
            updateCount(prev => Math.max(0, prev - 1))
          }
        }
      }
    },
    onEventDeleted: (deletedEvent) => {
      if (countType === 'events' && deletedEvent?.status === 'today') {
        updateCount(prev => Math.max(0, prev - 1))
      }
    },
    enableNotifications: false // Don't show notifications for count updates
  })

  // Real-time updates for announcements
  const { isConnected: announcementsConnected } = useRealtimeAnnouncements({
    onAnnouncementSent: (announcement) => {
      if (countType === 'announcements' && announcement.status === 'active') {
        updateCount(prev => prev + 1)
      }
    },
    onAnnouncementExpired: (announcement) => {
      if (countType === 'announcements' && announcement.status === 'expired') {
        updateCount(prev => Math.max(0, prev - 1))
      }
    },
    onAnnouncementUpdated: (announcement, oldAnnouncement) => {
      if (countType === 'announcements') {
        const oldStatusActive = oldAnnouncement?.status === 'active'
        const newStatusActive = announcement.status === 'active'
        
        if (oldStatusActive !== newStatusActive) {
          if (newStatusActive) {
            updateCount(prev => prev + 1)
          } else {
            updateCount(prev => Math.max(0, prev - 1))
          }
        }
      }
    },
    onAnnouncementDeleted: (announcement) => {
      if (countType === 'announcements' && announcement?.status === 'active') {
        updateCount(prev => Math.max(0, prev - 1))
      }
    },
    autoConnect: countType === 'announcements'
  })

  // Get the appropriate connection status
  const isConnected = countType === 'applicants' ? applicantsConnected : 
                     countType === 'tickets' ? ticketsConnected : 
                     countType === 'events' ? eventsConnected :
                     countType === 'announcements' ? announcementsConnected :
                     false

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchCount()
    }
  }, [user?.id, user?.roleName])

  // Real-time updates and polling fallback
  useEffect(() => {
    if (isConnected) {
      // WebSocket connected, using real-time updates
    } else {
      // WebSocket not connected, using polling fallback
      const interval = setInterval(() => {
        if (user?.id) {
          fetchCount()
        }
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [isConnected, user?.id])

  // Cleanup when user changes
  useEffect(() => {
    // Cleanup logic handled automatically
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

export function useTodayEventsCount() {
  const result = useRealtimeCount('events')
  return {
    todayEventsCount: result.count,
    error: result.error,
    isConnected: result.isConnected,
    refetch: result.refetch
  }
}

export function useActiveAnnouncementsCount() {
  const result = useRealtimeCount('announcements')
  return {
    activeAnnouncementsCount: result.count,
    error: result.error,
    isConnected: result.isConnected,
    refetch: result.refetch
  }
}

