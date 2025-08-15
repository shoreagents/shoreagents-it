import { useEffect, useRef, useState, useCallback } from 'react'

interface TicketUpdate {
  type: 'ticket_update'
  data: {
    table: string
    action: 'INSERT' | 'UPDATE' | 'DELETE'
    record: any
    old_record?: any
    timestamp: string
  }
}

interface UseRealtimeTicketsOptions {
  onTicketCreated?: (ticket: any) => void
  onTicketUpdated?: (ticket: any, oldTicket?: any) => void
  onTicketDeleted?: (ticket: any) => void
  autoConnect?: boolean
  // If set (e.g., 1 for IT board), role transitions will be treated specially (create/delete when entering/leaving scope)
  // If null/undefined, updates won't be converted into create/delete on role changes
  roleFilter?: number | null
}

// Singleton WebSocket connection
let globalWebSocket: WebSocket | null = null
let globalCallbacks: Set<(message: TicketUpdate) => void> = new Set()
let globalConnectionState = { isConnected: false, error: null as string | null }

// Global WebSocket management
function getOrCreateWebSocket() {
  if (globalWebSocket?.readyState === WebSocket.OPEN) {
    return globalWebSocket
  }

  if (globalWebSocket?.readyState === WebSocket.CONNECTING) {
    return globalWebSocket
  }

  // Clean up existing connection
  if (globalWebSocket) {
    globalWebSocket.close()
    globalWebSocket = null
  }

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    
    console.log('🔄 Creating new WebSocket connection to:', wsUrl)
    globalWebSocket = new WebSocket(wsUrl)

    globalWebSocket.onopen = () => {
      console.log('✅ Global WebSocket connected')
      globalConnectionState.isConnected = true
      globalConnectionState.error = null
    }

    globalWebSocket.onmessage = (event) => {
      try {
        const message: TicketUpdate = JSON.parse(event.data)
        console.log('📨 Global WebSocket received:', message)
        
        // Notify all registered callbacks
        globalCallbacks.forEach(callback => {
          try {
            callback(message)
          } catch (error) {
            console.error('Error in WebSocket callback:', error)
          }
        })
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    globalWebSocket.onclose = (event) => {
      console.log('❌ Global WebSocket disconnected:', event.code, event.reason)
      globalConnectionState.isConnected = false
      globalWebSocket = null
      
      // Only reconnect if it wasn't a clean close
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('🔄 Attempting to reconnect global WebSocket...')
          getOrCreateWebSocket()
        }, 5000)
      }
    }

    globalWebSocket.onerror = (error) => {
      console.error('❌ Global WebSocket error:', error)
      globalConnectionState.error = 'WebSocket connection error'
      globalConnectionState.isConnected = false
    }

    return globalWebSocket
  } catch (error) {
    console.error('Error creating WebSocket:', error)
    globalConnectionState.error = 'Failed to create WebSocket connection'
    return null
  }
}

export function useRealtimeTickets(options: UseRealtimeTicketsOptions = {}) {
  const {
    onTicketCreated,
    onTicketUpdated,
    onTicketDeleted,
    autoConnect = true,
    roleFilter = 1,
  } = options

  const [isConnected, setIsConnected] = useState(globalConnectionState.isConnected)
  const [error, setError] = useState<string | null>(globalConnectionState.error)
  const callbackRef = useRef<((message: TicketUpdate) => void) | null>(null)

  // Create callback function
  const createCallback = useCallback((message: TicketUpdate) => {
    if (message.type === 'ticket_update') {
      const { action, record, old_record } = message.data
      
      switch (action) {
        case 'INSERT':
          onTicketCreated?.(record)
          break
        case 'UPDATE':
          // Refetch the specific ticket to get complete data with profile info
          fetch(`/api/tickets/${record.id}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`)
              }
              return res.json()
            })
            .then(completeTicket => {
              // If no role filter specified (e.g., Admin board), treat as a plain update
              if (roleFilter == null) {
                onTicketUpdated?.(completeTicket || record, old_record)
                return
              }

              // Role-scoped behavior (default IT): add/remove when crossing role boundary
              if (completeTicket && completeTicket.role_id === roleFilter) {
                const oldRoleId = old_record?.role_id
                if (oldRoleId !== roleFilter) {
                  onTicketCreated?.(completeTicket)
                } else {
                  onTicketUpdated?.(completeTicket, old_record)
                }
              } else {
                onTicketDeleted?.(record)
              }
            })
            .catch(error => {
              console.error('Error refetching ticket data:', error)
              onTicketUpdated?.(record, old_record)
            })
          break
        case 'DELETE':
          onTicketDeleted?.(record)
          break
      }
    }
  }, [onTicketCreated, onTicketUpdated, onTicketDeleted, roleFilter])

  // Register callback
  useEffect(() => {
    if (autoConnect) {
      callbackRef.current = createCallback
      globalCallbacks.add(callbackRef.current)
      
      // Get or create WebSocket connection
      getOrCreateWebSocket()
    }

    return () => {
      if (callbackRef.current) {
        globalCallbacks.delete(callbackRef.current)
      }
    }
  }, [autoConnect, createCallback])

  // Update local state when global state changes
  useEffect(() => {
    const updateState = () => {
      setIsConnected(globalConnectionState.isConnected)
      setError(globalConnectionState.error)
    }

    // Update immediately
    updateState()

    // Set up interval to check for changes
    const interval = setInterval(updateState, 1000)

    return () => clearInterval(interval)
  }, [])

  const connect = useCallback(() => {
    getOrCreateWebSocket()
  }, [])

  const disconnect = useCallback(() => {
    if (globalWebSocket) {
      globalWebSocket.close(1000) // Clean close
    }
  }, [])

  return {
    isConnected,
    error,
    connect,
    disconnect
  }
} 