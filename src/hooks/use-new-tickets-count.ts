import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRealtimeTickets } from './use-realtime-tickets'

// Persistent storage keys
const TICKETS_COUNT_KEY = 'newTicketsCount'
const TICKETS_COUNT_TIMESTAMP_KEY = 'newTicketsCountTimestamp'

export function useNewTicketsCount() {
  const [newTicketsCount, setNewTicketsCount] = useState(() => {
    // Initialize from localStorage if available and recent (within 5 minutes)
    try {
      const storedCount = localStorage.getItem(TICKETS_COUNT_KEY)
      const timestamp = localStorage.getItem(TICKETS_COUNT_TIMESTAMP_KEY)
      
      if (storedCount && timestamp) {
        const age = Date.now() - parseInt(timestamp)
        const fiveMinutes = 5 * 60 * 1000
        
        if (age < fiveMinutes) {
          console.log('useNewTicketsCount: Using cached count:', storedCount)
          return parseInt(storedCount)
        }
      }
    } catch (error) {
      console.warn('useNewTicketsCount: Error reading from localStorage:', error)
    }
    return 0
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Helper function to update count and persist to localStorage
  const updateCount = (newCount: number) => {
    setNewTicketsCount(newCount)
    try {
      localStorage.setItem(TICKETS_COUNT_KEY, newCount.toString())
      localStorage.setItem(TICKETS_COUNT_TIMESTAMP_KEY, Date.now().toString())
    } catch (error) {
      console.warn('useNewTicketsCount: Error writing to localStorage:', error)
    }
  }

  // Use the existing realtime tickets hook for live updates
  const { isConnected } = useRealtimeTickets({
    onTicketCreated: (ticket) => {
      console.log('useNewTicketsCount: Ticket created:', ticket)
      // For new tickets, we can increment the count locally instead of refetching
      setNewTicketsCount(prev => prev + 1)
    },
    onTicketUpdated: (ticket, oldTicket) => {
      console.log('useNewTicketsCount: Ticket updated:', ticket, 'Old:', oldTicket)
      // Only refresh count if the status change affects our count
      const isAdmin = (user as any)?.roleName?.toLowerCase() === 'admin'
      const relevantStatus = isAdmin ? 'For Approval' : 'Approved'
      
      // Check if the status change affects our count
      const oldStatusRelevant = oldTicket?.status === relevantStatus
      const newStatusRelevant = ticket.status === relevantStatus
      
      if (oldStatusRelevant !== newStatusRelevant) {
        // Status change affects our count, update locally
        if (newStatusRelevant) {
          setNewTicketsCount(prev => prev + 1)
        } else {
          setNewTicketsCount(prev => Math.max(0, prev - 1))
        }
      }
    },
    onTicketDeleted: (ticket) => {
      console.log('useNewTicketsCount: Ticket deleted:', ticket)
      // Check if deleted ticket was in our count
      const isAdmin = (user as any)?.roleName?.toLowerCase() === 'admin'
      const relevantStatus = isAdmin ? 'For Approval' : 'Approved'
      
      if (ticket.status === relevantStatus) {
        setNewTicketsCount(prev => Math.max(0, prev - 1))
      }
    },
    autoConnect: true,
    roleFilter: null // Listen to all ticket changes
  })

  const fetchNewTicketsCount = async () => {
    if (!user?.id) {
      console.log('useNewTicketsCount: No user ID, skipping fetch')
      updateCount(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Determine if user is admin or IT
      const isAdmin = (user as any)?.roleName?.toLowerCase() === 'admin'
      
      // For IT users: count "Approved" tickets (new IT work)
      // For Admin users: count "For Approval" tickets (pending approval)
      const status = isAdmin ? 'For Approval' : 'Approved'
      const adminParam = isAdmin ? '&admin=true' : ''
      
      const apiUrl = `/api/tickets?status=${status}${adminParam}`
      console.log('useNewTicketsCount: Fetching from:', apiUrl, 'Status:', status, 'IsAdmin:', isAdmin)
      
      // Fetch tickets with appropriate status
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const tickets = await response.json()
      console.log('useNewTicketsCount: Received tickets:', tickets)
      console.log('useNewTicketsCount: Count:', tickets.length)
      
      updateCount(tickets.length)
    } catch (error) {
      console.error('useNewTicketsCount: Error fetching new tickets count:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      
      // Don't show mock data - always show actual count or 0
      console.log('useNewTicketsCount: Error occurred, setting count to 0')
      updateCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('useNewTicketsCount: User changed, fetching count. User:', user)
    console.log('useNewTicketsCount: WebSocket connected:', isConnected)
    fetchNewTicketsCount()
    
    // Only use polling as fallback when WebSocket is not connected
    let interval: NodeJS.Timeout | null = null
    if (!isConnected) {
      console.log('useNewTicketsCount: WebSocket not connected, using polling fallback')
      interval = setInterval(() => {
        console.log('useNewTicketsCount: Polling fallback - refreshing count...')
        fetchNewTicketsCount()
      }, 30000)
    }
    
    return () => {
      if (interval) {
        console.log('useNewTicketsCount: Cleaning up polling interval')
        clearInterval(interval)
      }
    }
  }, [user?.id, user?.roleName, isConnected])

  return { newTicketsCount, loading, error, isConnected }
}
