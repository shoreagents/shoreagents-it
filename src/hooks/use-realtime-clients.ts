import { useEffect, useRef, useState, useCallback } from 'react'

interface ClientUpdate {
  type: 'client_update' | 'client_assignment_update' | 'personal_info_update'
  data: {
    table: string
    action: 'INSERT' | 'UPDATE' | 'DELETE'
    record: any
    old_record?: any
    timestamp: string
  }
}

interface UseRealtimeClientsOptions {
  onClientCreated?: (client: any) => void
  onClientUpdated?: (client: any, oldClient?: any) => void
  onClientDeleted?: (client: any) => void
  autoConnect?: boolean
}

// Singleton WebSocket connection
let globalWebSocket: WebSocket | null = null
let globalCallbacks: Set<(message: ClientUpdate) => void> = new Set()
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
    // Use window.location.host which includes port if present
    const wsUrl = `${protocol}//${window.location.host}/ws`
    
    console.log('🔄 Creating new WebSocket connection for clients to:', wsUrl)
    globalWebSocket = new WebSocket(wsUrl)

    globalWebSocket.onopen = () => {
      console.log('✅ Global WebSocket connected for clients')
      globalConnectionState.isConnected = true
      globalConnectionState.error = null
    }

    globalWebSocket.onmessage = (event) => {
      try {
        const message: ClientUpdate = JSON.parse(event.data)
        console.log('📨 Global WebSocket received client update:', message)
        console.log('📨 Raw WebSocket data:', event.data)
        
        // Process client-related updates
        if (message.type === 'client_update' || message.type === 'client_assignment_update' || message.type === 'personal_info_update') {
          console.log('✅ Processing client-related update:', message.type)
          // Notify all registered callbacks
          globalCallbacks.forEach(callback => {
            try {
              callback(message)
            } catch (error) {
              console.error('Error in WebSocket callback:', error)
            }
          })
        } else {
          console.log('❌ Ignoring non-client update:', message.type)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    globalWebSocket.onclose = (event) => {
      console.log('❌ Global WebSocket disconnected for clients:', event.code, event.reason)
      globalConnectionState.isConnected = false
      globalWebSocket = null
      
      // Only reconnect if it wasn't a clean close
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('🔄 Attempting to reconnect global WebSocket for clients...')
          getOrCreateWebSocket()
        }, 5000)
      }
    }

    globalWebSocket.onerror = (error) => {
      console.error('❌ Global WebSocket error for clients:', error)
      globalConnectionState.error = 'WebSocket connection error'
      globalConnectionState.isConnected = false
    }

    return globalWebSocket
  } catch (error) {
    console.error('Error creating WebSocket for clients:', error)
    globalConnectionState.error = 'Failed to create WebSocket connection'
    return null
  }
}

export function useRealtimeClients(options: UseRealtimeClientsOptions = {}) {
  const {
    onClientCreated,
    onClientUpdated,
    onClientDeleted,
    autoConnect = true,
  } = options

  const [isConnected, setIsConnected] = useState(globalConnectionState.isConnected)
  const [error, setError] = useState<string | null>(globalConnectionState.error)
  const callbackRef = useRef<((message: ClientUpdate) => void) | null>(null)

  // Create callback function
  const createCallback = useCallback((message: ClientUpdate) => {
    console.log('🔍 Real-time client callback triggered with message:', message)
    
    if (message.type === 'client_update' || message.type === 'client_assignment_update' || message.type === 'personal_info_update') {
      const { action, record, old_record } = message.data
      console.log('🔍 Processing client-related update:', { type: message.type, action, record, old_record })
      
      switch (action) {
        case 'INSERT':
          console.log('🆕 New client created:', record)
          onClientCreated?.(record)
          break
        case 'UPDATE':
          console.log('📝 Client updated:', record, 'Old:', old_record)
          onClientUpdated?.(record, old_record)
          break
        case 'DELETE':
          console.log('🗑️ Client deleted:', old_record)
          onClientDeleted?.(old_record)
          break
      }
    }
  }, [onClientCreated, onClientUpdated, onClientDeleted])

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
    const handleStateChange = () => {
      setIsConnected(globalConnectionState.isConnected)
      setError(globalConnectionState.error)
    }

    // Set initial state
    handleStateChange()

    // Listen for state changes
    const interval = setInterval(handleStateChange, 1000)

    return () => clearInterval(interval)
  }, [])

  // Manual connection control
  const connect = useCallback(() => {
    getOrCreateWebSocket()
  }, [])

  const disconnect = useCallback(() => {
    if (globalWebSocket) {
      globalWebSocket.close()
    }
  }, [])

  return {
    isConnected,
    error,
    connect,
    disconnect,
  }
}
