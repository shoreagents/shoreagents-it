import { useEffect, useRef, useState, useCallback } from 'react'

interface AnnouncementUpdate {
  type: 'announcement_sent' | 'announcement_expired' | 'announcement_update' | 'announcement_change'
  data: {
    type?: string
    announcement_id?: number
    user_id?: number
    title?: string
    message?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    allow_dismiss?: boolean
    created_at?: string
    sent_at?: string
    expires_at?: string
    status?: 'draft' | 'scheduled' | 'active' | 'expired'
    assigned_user_ids?: number[]
    // Legacy fields for compatibility
    table?: string
    action?: 'INSERT' | 'UPDATE' | 'DELETE'
    record?: any
    old_record?: any
    timestamp?: string
    // Additional fields from database trigger
    old_status?: string
    new_status?: string
    status_changed?: boolean
  }
}

interface UseRealtimeAnnouncementsOptions {
  onAnnouncementSent?: (announcement: any) => void
  onAnnouncementExpired?: (announcement: any) => void
  onAnnouncementUpdated?: (announcement: any, oldAnnouncement?: any) => void
  onAnnouncementDeleted?: (announcement: any) => void
  autoConnect?: boolean
}

// Singleton WebSocket connection
let globalAnnouncementsWebSocket: WebSocket | null = null
let globalAnnouncementsCallbacks: Set<(message: AnnouncementUpdate) => void> = new Set()
let globalAnnouncementsConnectionState = { isConnected: false, error: null as string | null }

// Global WebSocket management
function getOrCreateAnnouncementsWebSocket() {
  if (globalAnnouncementsWebSocket?.readyState === WebSocket.OPEN) {
    return globalAnnouncementsWebSocket
  }

  if (globalAnnouncementsWebSocket?.readyState === WebSocket.CONNECTING) {
    return globalAnnouncementsWebSocket
  }

  // Clean up existing connection
  if (globalAnnouncementsWebSocket) {
    globalAnnouncementsWebSocket.close()
    globalAnnouncementsWebSocket = null
  }

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    
    console.log('🔄 Creating new Announcements WebSocket connection to:', wsUrl)
    globalAnnouncementsWebSocket = new WebSocket(wsUrl)

    globalAnnouncementsWebSocket.onopen = () => {
      console.log('✅ Announcements WebSocket connected')
      globalAnnouncementsConnectionState.isConnected = true
      globalAnnouncementsConnectionState.error = null
    }

    globalAnnouncementsWebSocket.onmessage = (event) => {
      try {
        const message: AnnouncementUpdate = JSON.parse(event.data)
        console.log('📨 Announcements WebSocket received:', message)
        
        // Only process announcement-related messages
        if (message.type === 'announcement_sent' || message.type === 'announcement_expired' || message.type === 'announcement_update' || message.type === 'announcement_change') {
          console.log('✅ Processing announcement update:', message.type)
          
          // Notify all registered callbacks
          globalAnnouncementsCallbacks.forEach(callback => {
            try {
              callback(message)
            } catch (error) {
              console.error('Error in Announcements WebSocket callback:', error)
            }
          })
        } else {
          console.log('❌ Ignoring non-announcement update:', message.type)
        }
      } catch (error) {
        console.error('Error parsing Announcements WebSocket message:', error)
      }
    }

    globalAnnouncementsWebSocket.onclose = (event) => {
      console.log('❌ Announcements WebSocket disconnected:', event.code, event.reason)
      globalAnnouncementsConnectionState.isConnected = false
      globalAnnouncementsWebSocket = null
      
      // Only reconnect if it wasn't a clean close
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('🔄 Attempting to reconnect Announcements WebSocket...')
          getOrCreateAnnouncementsWebSocket()
        }, 5000)
      }
    }

    globalAnnouncementsWebSocket.onerror = (error) => {
      console.error('❌ Announcements WebSocket error:', error)
      globalAnnouncementsConnectionState.error = 'WebSocket connection error'
      globalAnnouncementsConnectionState.isConnected = false
    }

    return globalAnnouncementsWebSocket
  } catch (error) {
    console.error('Error creating Announcements WebSocket:', error)
    globalAnnouncementsConnectionState.error = 'Failed to create WebSocket connection'
    globalAnnouncementsConnectionState.isConnected = false
    return null
  }
}

export function useRealtimeAnnouncements(options: UseRealtimeAnnouncementsOptions = {}) {
  const {
    onAnnouncementSent,
    onAnnouncementExpired,
    onAnnouncementUpdated,
    onAnnouncementDeleted,
    autoConnect = true
  } = options

  const [isConnected, setIsConnected] = useState(globalAnnouncementsConnectionState.isConnected)
  const [error, setError] = useState<string | null>(globalAnnouncementsConnectionState.error)
  const callbackRef = useRef<(message: AnnouncementUpdate) => void>(() => {})

  // Update callback ref when options change
  callbackRef.current = useCallback((message: AnnouncementUpdate) => {
    console.log('📨 Announcement callback triggered:', message)

    // Handle different announcement update types
    switch (message.type) {
      case 'announcement_sent':
        if (onAnnouncementSent) {
          onAnnouncementSent(message.data)
        }
        break

      case 'announcement_expired':
        if (onAnnouncementExpired) {
          onAnnouncementExpired(message.data)
        }
        break

      case 'announcement_update':
        if (onAnnouncementUpdated) {
          onAnnouncementUpdated(message.data, message.data.old_record)
        }
        break

      case 'announcement_change':
        // Handle database trigger notifications
        if (message.data.action === 'INSERT') {
          // New announcement created
          if (onAnnouncementSent) {
            onAnnouncementSent(message.data)
          }
        } else if (message.data.action === 'DELETE') {
          // Announcement deleted
          if (onAnnouncementDeleted) {
            onAnnouncementDeleted(message.data)
          }
        } else if (message.data.status_changed) {
          if (message.data.new_status === 'active' && message.data.old_status !== 'active') {
            // Announcement became active (sent)
            if (onAnnouncementSent) {
              onAnnouncementSent(message.data)
            }
          } else if (message.data.new_status === 'expired' && message.data.old_status !== 'expired') {
            // Announcement expired
            if (onAnnouncementExpired) {
              onAnnouncementExpired(message.data)
            }
          }
        }
        
        // Always call the general update callback
        if (onAnnouncementUpdated) {
          onAnnouncementUpdated(message.data, { status: message.data.old_status })
        }
        break

      default:
        console.log('Unknown announcement message type:', message.type)
    }
  }, [onAnnouncementSent, onAnnouncementExpired, onAnnouncementUpdated, onAnnouncementDeleted])

  // Register/unregister callback
  useEffect(() => {
    if (callbackRef.current) {
      globalAnnouncementsCallbacks.add(callbackRef.current)
      console.log('📝 Registered announcement callback')
    }

    return () => {
      if (callbackRef.current) {
        globalAnnouncementsCallbacks.delete(callbackRef.current)
        console.log('📝 Unregistered announcement callback')
      }
    }
  }, [])

  // Connect/disconnect WebSocket
  useEffect(() => {
    if (autoConnect) {
      const ws = getOrCreateAnnouncementsWebSocket()
      if (ws) {
        setIsConnected(globalAnnouncementsConnectionState.isConnected)
        setError(globalAnnouncementsConnectionState.error)
      }
    }

    return () => {
      // Don't close the global WebSocket, just unregister our callback
      // The global WebSocket will be cleaned up when all components unmount
    }
  }, [autoConnect])

  // Update connection state when global state changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected !== globalAnnouncementsConnectionState.isConnected) {
        setIsConnected(globalAnnouncementsConnectionState.isConnected)
      }
      if (error !== globalAnnouncementsConnectionState.error) {
        setError(globalAnnouncementsConnectionState.error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isConnected, error])

  return {
    isConnected,
    error,
    reconnect: () => {
      console.log('🔄 Manual reconnect requested for announcements')
      getOrCreateAnnouncementsWebSocket()
    }
  }
}
