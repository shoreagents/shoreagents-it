import { useEffect, useRef, useState, useCallback } from 'react'
import { useElectronNotifications } from './use-electron-notifications'

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
  // Enable notifications for new tickets
  enableNotifications?: boolean
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
    enableNotifications = false,
  } = options

  // Initialize notification system if enabled
  const { showInfoNotification, isSupported } = useElectronNotifications()

  const [isConnected, setIsConnected] = useState(globalConnectionState.isConnected)
  const [error, setError] = useState<string | null>(globalConnectionState.error)
  const callbackRef = useRef<((message: TicketUpdate) => void) | null>(null)

  // Create callback function
  const createCallback = useCallback((message: TicketUpdate) => {
    if (message.type === 'ticket_update') {
      const { action, record, old_record } = message.data
      
      switch (action) {
        case 'INSERT':
          // Fetch complete ticket data with user information for new tickets
          fetch(`/api/tickets/${record.id}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`)
              }
              return res.json()
            })
            .then(completeTicket => {
              onTicketCreated?.(completeTicket)
              
              // Show notification for new tickets if enabled and supported
              if (enableNotifications && isSupported) {
                console.log('🔔 Attempting to show notification for new ticket:', completeTicket.id)
                
                // Format name from available fields
                const getName = () => {
                  if (completeTicket.member_name) {
                    return completeTicket.member_name
                  }
                  if (completeTicket.first_name && completeTicket.last_name) {
                    return `${completeTicket.first_name} ${completeTicket.last_name}`
                  }
                  if (completeTicket.first_name) {
                    return completeTicket.first_name
                  }
                  return 'Unknown User'
                }
                
                const ticketTitle = completeTicket.concern || 'New Ticket'
                const userName = getName()
                
                showInfoNotification(
                  `TICKETS - ${userName}`,
                  ticketTitle,
                  {
                    id: `ticket-${completeTicket.id}-${Date.now()}`,
                    urgency: 'normal',
                    onClick: true
                  }
                ).then(result => {
                  console.log('✅ Notification sent successfully:', result)
                }).catch(error => {
                  console.error('❌ Failed to show ticket notification:', error)
                })
              } else {
                console.log('🔕 Notification skipped:', { enableNotifications, isSupported })
              }
            })
            .catch(error => {
              console.error('Error fetching complete ticket data for new ticket:', error)
              // Fallback to using the record directly
              onTicketCreated?.(record)
              
              // Show notification with basic record data if fetch failed
              if (enableNotifications && isSupported) {
                console.log('🔔 Attempting to show notification with basic record data:', record.id)
                
                // Format name from available fields (fallback)
                const getName = () => {
                  if (record.member_name) {
                    return record.member_name
                  }
                  if (record.first_name && record.last_name) {
                    return `${record.first_name} ${record.last_name}`
                  }
                  if (record.first_name) {
                    return record.first_name
                  }
                  return 'Unknown User'
                }
                
                const ticketTitle = record.title || record.concern || 'New Ticket'
                const userName = getName()
                
                showInfoNotification(
                  `TICKETS - ${userName}`,
                  ticketTitle,
                  {
                    id: `ticket-${record.id}-${Date.now()}`,
                    urgency: 'normal',
                    onClick: true
                  }
                ).then(result => {
                  console.log('✅ Fallback notification sent successfully:', result)
                }).catch(error => {
                  console.error('❌ Failed to show fallback notification:', error)
                })
              }
            })
          break
        case 'UPDATE':
          // For admin board (no role filter), fetch complete data to ensure user names are available
          if (roleFilter == null) {
            fetch(`/api/tickets/${record.id}?admin=true`)
              .then(res => {
                if (!res.ok) {
                  throw new Error(`HTTP error! status: ${res.status}`)
                }
                return res.json()
              })
              .then(completeTicket => {
                onTicketUpdated?.(completeTicket, old_record)
              })
              .catch(error => {
                console.error('Error refetching complete ticket data for admin update:', error)
                // Fallback to using the record directly
                onTicketUpdated?.(record, old_record)
              })
            return
          }

          // Role-scoped behavior (IT board): add/remove when crossing role boundary
          // Only refetch if we need to check role changes
          if (old_record?.role_id !== record.role_id) {
            fetch(`/api/tickets/${record.id}`)
              .then(res => {
                if (!res.ok) {
                  throw new Error(`HTTP error! status: ${res.status}`)
                }
                return res.json()
              })
              .then(completeTicket => {
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
                // Fallback to using the record directly
                if (record.role_id === roleFilter) {
                  onTicketUpdated?.(record, old_record)
                } else {
                  onTicketDeleted?.(record)
                }
              })
          } else {
            // No role change, but still fetch complete data to ensure user names are available
            fetch(`/api/tickets/${record.id}`)
              .then(res => {
                if (!res.ok) {
                  throw new Error(`HTTP error! status: ${res.status}`)
                }
                return res.json()
              })
              .then(completeTicket => {
                if (completeTicket && completeTicket.role_id === roleFilter) {
                  onTicketUpdated?.(completeTicket, old_record)
                } else {
                  onTicketDeleted?.(record)
                }
              })
              .catch(error => {
                console.error('Error refetching ticket data for update:', error)
                // Fallback to using the record directly
                if (record.role_id === roleFilter) {
                  onTicketUpdated?.(record, old_record)
                } else {
                  onTicketDeleted?.(record)
                }
              })
          }
          break
        case 'DELETE':
          onTicketDeleted?.(record)
          break
      }
    }
  }, [onTicketCreated, onTicketUpdated, onTicketDeleted, roleFilter, enableNotifications, isSupported, showInfoNotification])

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