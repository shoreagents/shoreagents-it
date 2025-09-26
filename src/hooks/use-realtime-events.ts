import { useEffect, useRef, useState, useCallback } from 'react'
import { useElectronNotifications } from './use-electron-notifications'

interface EventUpdate {
  type: 'event_update' | 'event_attendance_update'
  data: {
    type?: string
    event_id?: number
    event_title?: string
    event_date?: string
    start_time?: string
    end_time?: string
    location?: string
    status?: string
    created_by?: number
    created_at?: string
    updated_at?: string
    data?: any
    old_data?: any
    new_data?: any
    event_data?: any
    user_data?: any
    action_url?: string
    // Event attendance fields
    user_id?: number
    is_going?: boolean
    is_back?: boolean
    going_at?: string
    back_at?: string
    // Legacy fields for compatibility
    table?: string
    action?: 'INSERT' | 'UPDATE' | 'DELETE'
    record?: any
    old_record?: any
    timestamp?: string
  }
}

interface UseRealtimeEventsOptions {
  onEventCreated?: (event: any) => void
  onEventUpdated?: (event: any, oldEvent?: any) => void
  onEventDeleted?: (event: any) => void
  onEventAttendanceChanged?: (attendance: any) => void
  autoConnect?: boolean
  // Enable notifications for new events
  enableNotifications?: boolean
}

// Singleton WebSocket connection
let globalWebSocket: WebSocket | null = null
let globalCallbacks: Set<(message: EventUpdate) => void> = new Set()
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
    
    console.log('🔄 Creating new WebSocket connection for events to:', wsUrl)
    globalWebSocket = new WebSocket(wsUrl)

    globalWebSocket.onopen = () => {
      console.log('✅ Global WebSocket connected for events')
      globalConnectionState.isConnected = true
      globalConnectionState.error = null
    }

    globalWebSocket.onmessage = (event) => {
      try {
        const message: EventUpdate = JSON.parse(event.data)
        console.log('📨 Global WebSocket received event message:', message)
        
        // Only process event-related messages
        if (message.type === 'event_update' || message.type === 'event_attendance_update') {
          // Notify all registered callbacks
          globalCallbacks.forEach(callback => {
            try {
              callback(message)
            } catch (error) {
              console.error('Error in WebSocket event callback:', error)
            }
          })
        }
      } catch (error) {
        console.error('Error parsing WebSocket event message:', error)
      }
    }

    globalWebSocket.onclose = (event) => {
      console.log('❌ Global WebSocket disconnected for events:', event.code, event.reason)
      globalConnectionState.isConnected = false
      globalWebSocket = null
      
      // Only reconnect if it wasn't a clean close
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('🔄 Attempting to reconnect global WebSocket for events...')
          getOrCreateWebSocket()
        }, 5000)
      }
    }

    globalWebSocket.onerror = (error) => {
      console.error('❌ Global WebSocket error for events:', error)
      globalConnectionState.error = 'WebSocket connection error'
      globalConnectionState.isConnected = false
    }

    return globalWebSocket
  } catch (error) {
    console.error('Error creating WebSocket for events:', error)
    globalConnectionState.error = 'Failed to create WebSocket connection'
    return null
  }
}

export function useRealtimeEvents(options: UseRealtimeEventsOptions = {}) {
  const {
    onEventCreated,
    onEventUpdated,
    onEventDeleted,
    onEventAttendanceChanged,
    autoConnect = true,
    enableNotifications = false,
  } = options

  // Initialize notification system if enabled
  const { showInfoNotification, isSupported } = useElectronNotifications()

  const [isConnected, setIsConnected] = useState(globalConnectionState.isConnected)
  const [error, setError] = useState<string | null>(globalConnectionState.error)
  const callbackRef = useRef<((message: EventUpdate) => void) | null>(null)

  // Create callback function
  const createCallback = useCallback((message: EventUpdate) => {
    if (message.type === 'event_update') {
      const { 
        type, event_id, event_title, event_date, start_time, end_time, 
        location, status, created_by, created_at, updated_at, 
        data, old_data, new_data, action_url,
        // Legacy fields
        action, record, old_record
      } = message.data
      
      // Determine action from type or legacy action field
      const eventAction = type?.includes('created') ? 'INSERT' : 
                         type?.includes('updated') ? 'UPDATE' : 
                         type?.includes('deleted') ? 'DELETE' : action
      
      // Get event data from various possible sources
      const eventData = data || new_data || record
      const oldEventData = old_data || old_record
      
      switch (eventAction) {
        case 'INSERT':
          // Use event_id from notification or fallback to record.id
          const eventId = event_id || eventData?.id || record?.id
          
          if (eventId) {
            // Fetch complete event data for new events
            fetch(`/api/events/${eventId}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`)
              }
              return res.json()
            })
            .then(completeEvent => {
              onEventCreated?.(completeEvent)
              
              // Show notification for new events if enabled and supported
              if (enableNotifications && isSupported) {
                console.log('🔔 Attempting to show notification for new event:', completeEvent.id)
                
                const eventTitle = completeEvent.title || event_title || 'New Event'
                const eventType = completeEvent.event_type === 'activity' ? 'Activity' : 'Event'
                
                showInfoNotification(
                  `EVENTS - New ${eventType}`,
                  eventTitle,
                  {
                    id: `event-${completeEvent.id}-${Date.now()}`,
                    urgency: 'normal',
                    onClick: true
                  }
                ).then(result => {
                  console.log('✅ Event notification sent successfully:', result)
                }).catch(error => {
                  console.error('❌ Failed to show event notification:', error)
                })
              }
            })
            .catch(error => {
              console.error('Error fetching complete event data for new event:', error)
              // Fallback to using the available data
              onEventCreated?.(eventData || { id: eventId, title: event_title })
              
              // Show notification with basic data if fetch failed
              if (enableNotifications && isSupported) {
                const eventTitle = eventData?.title || event_title || 'New Event'
                const eventType = eventData?.event_type === 'activity' ? 'Activity' : 'Event'
                
                showInfoNotification(
                  `EVENTS - New ${eventType}`,
                  eventTitle,
                  {
                    id: `event-${record.id}-${Date.now()}`,
                    urgency: 'normal',
                    onClick: true
                  }
                ).then(result => {
                  console.log('✅ Fallback event notification sent successfully:', result)
                }).catch(error => {
                  console.error('❌ Failed to show fallback event notification:', error)
                })
              }
            })
          } else {
            // No event ID available, use what we have
            onEventCreated?.(eventData || { title: event_title })
          }
          break
        case 'UPDATE':
          // Use event_id from notification or fallback to record.id
          const updateEventId = event_id || eventData?.id || record?.id
          
          if (updateEventId) {
            // Fetch complete event data for updates
            fetch(`/api/events/${updateEventId}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`)
              }
              return res.json()
            })
            .then(completeEvent => {
              onEventUpdated?.(completeEvent, oldEventData)
              
              // Show notification for status changes if enabled
              if (enableNotifications && isSupported && oldEventData?.status !== completeEvent.status) {
                console.log('🔔 Event status changed:', oldEventData?.status, '->', completeEvent.status)
                
                const eventTitle = completeEvent.title || event_title || 'Event'
                const statusMessages = {
                  'upcoming': 'Event is upcoming',
                  'today': 'Event is happening today!',
                  'cancelled': 'Event has been cancelled',
                  'ended': 'Event has ended'
                }
                
                const statusMessage = statusMessages[completeEvent.status as keyof typeof statusMessages] || 'Event status updated'
                
                showInfoNotification(
                  `EVENTS - ${eventTitle}`,
                  statusMessage,
                  {
                    id: `event-status-${completeEvent.id}-${Date.now()}`,
                    urgency: completeEvent.status === 'today' ? 'critical' : 'normal',
                    onClick: true
                  }
                ).then(result => {
                  console.log('✅ Event status notification sent successfully:', result)
                }).catch(error => {
                  console.error('❌ Failed to show event status notification:', error)
                })
              }
            })
            .catch(error => {
              console.error('Error fetching complete event data for update:', error)
              // Fallback to using the available data
              onEventUpdated?.(eventData, oldEventData)
            })
          } else {
            // No event ID available, use what we have
            onEventUpdated?.(eventData, oldEventData)
          }
          break
        case 'DELETE':
          console.log('🗑️ Event deleted:', oldEventData)
          // Ensure we have valid event data for deletion
          const deletedEventData = oldEventData || {
            id: event_id || record?.id,
            title: event_title || 'Unknown Event',
            event_date: event_date,
            start_time: start_time,
            end_time: end_time,
            location: location,
            status: status
          }
          onEventDeleted?.(deletedEventData)
          break
      }
    } else if (message.type === 'event_attendance_update') {
      const { 
        type, event_id, user_id, is_going, is_back, 
        going_at, back_at, event_data, user_data,
        // Legacy fields
        action, record
      } = message.data
      
      // Handle event attendance changes
      const attendanceData = record || { event_id, user_id, is_going, is_back, going_at, back_at }
      console.log('👥 Event attendance changed:', attendanceData)
      onEventAttendanceChanged?.(attendanceData)
      
      // Show notification for attendance changes if enabled
      const attendanceAction = type?.includes('created') ? 'INSERT' : 
                             type?.includes('updated') ? 'UPDATE' : 
                             type?.includes('deleted') ? 'DELETE' : action
      
      if (enableNotifications && isSupported && attendanceAction === 'INSERT') {
        console.log('🔔 Event attendance changed:', attendanceData)
        
        const eventTitle = event_data?.title || 'Event'
        const userName = user_data ? 
          `${user_data.first_name || ''} ${user_data.last_name || ''}`.trim() || 
          user_data.employee_id || 'Someone' : 'Someone'
        
        showInfoNotification(
          `EVENTS - ${eventTitle}`,
          `${userName} is attending`,
          {
            id: `event-attendance-${record.id}-${Date.now()}`,
            urgency: 'normal',
            onClick: true
          }
        ).then(result => {
          console.log('✅ Event attendance notification sent successfully:', result)
        }).catch(error => {
          console.error('❌ Failed to show event attendance notification:', error)
        })
      }
    }
  }, [onEventCreated, onEventUpdated, onEventDeleted, onEventAttendanceChanged, enableNotifications, isSupported, showInfoNotification])

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
