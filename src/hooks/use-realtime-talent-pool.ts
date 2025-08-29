import { useEffect, useRef, useState, useCallback } from 'react'

interface TalentPoolUpdate {
  type: 'talent_pool_update'
  data: {
    table: string
    action: 'INSERT' | 'UPDATE' | 'DELETE'
    record: any
    old_record?: any
    timestamp: string
  }
}

interface UseRealtimeTalentPoolOptions {
  onTalentPoolCreated?: (talent: any) => void
  onTalentPoolUpdated?: (talent: any, oldTalent?: any) => void
  onTalentPoolDeleted?: (talent: any) => void
  autoConnect?: boolean
}

// Singleton WebSocket connection for talent pool
let globalTalentPoolWebSocket: WebSocket | null = null
let globalTalentPoolCallbacks: Set<(message: TalentPoolUpdate) => void> = new Set()
let globalTalentPoolConnectionState = { isConnected: false, error: null as string | null }

// Global WebSocket management for talent pool
function getOrCreateTalentPoolWebSocket() {
  if (globalTalentPoolWebSocket?.readyState === WebSocket.OPEN) {
    return globalTalentPoolWebSocket
  }

  if (globalTalentPoolWebSocket?.readyState === WebSocket.CONNECTING) {
    return globalTalentPoolWebSocket
  }

  // Clean up existing connection
  if (globalTalentPoolWebSocket) {
    globalTalentPoolWebSocket.close()
    globalTalentPoolWebSocket = null
  }

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    
    console.log('🔄 Creating new Talent Pool WebSocket connection to:', wsUrl)
    globalTalentPoolWebSocket = new WebSocket(wsUrl)

    globalTalentPoolWebSocket.onopen = () => {
      console.log('✅ Talent Pool WebSocket connected')
      globalTalentPoolConnectionState.isConnected = true
      globalTalentPoolConnectionState.error = null
    }

    globalTalentPoolWebSocket.onmessage = (event) => {
      try {
        const message: TalentPoolUpdate = JSON.parse(event.data)
        console.log('📨 Talent Pool WebSocket received:', message)
        
        // Process talent pool updates
        if (message.type === 'talent_pool_update') {
          console.log('📨 Talent Pool WebSocket received:', message)
          
          // Notify all registered callbacks
          globalTalentPoolCallbacks.forEach(callback => {
            try {
              callback(message)
            } catch (error) {
              console.error('Error in Talent Pool WebSocket callback:', error)
            }
          })
        }
      } catch (error) {
        console.error('Error parsing Talent Pool WebSocket message:', error)
      }
    }

    globalTalentPoolWebSocket.onclose = (event) => {
      console.log('❌ Talent Pool WebSocket disconnected:', event.code, event.reason)
      globalTalentPoolConnectionState.isConnected = false
      globalTalentPoolWebSocket = null
      
      // Only reconnect if it wasn't a clean close
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('🔄 Attempting to reconnect Talent Pool WebSocket...')
          getOrCreateTalentPoolWebSocket()
        }, 5000)
      }
    }

    globalTalentPoolWebSocket.onerror = (error) => {
      console.error('❌ Talent Pool WebSocket error:', error)
      globalTalentPoolConnectionState.error = 'WebSocket connection error'
      globalTalentPoolConnectionState.isConnected = false
    }

    return globalTalentPoolWebSocket
  } catch (error) {
    console.error('Error creating Talent Pool WebSocket:', error)
    globalTalentPoolConnectionState.error = 'Failed to create WebSocket connection'
    return null
  }
}

export function useRealtimeTalentPool(options: UseRealtimeTalentPoolOptions = {}) {
  const {
    onTalentPoolCreated,
    onTalentPoolUpdated,
    onTalentPoolDeleted,
    autoConnect = true,
  } = options

  const [isConnected, setIsConnected] = useState(globalTalentPoolConnectionState.isConnected)
  const [error, setError] = useState<string | null>(globalTalentPoolConnectionState.error)
  const callbackRef = useRef<((message: TalentPoolUpdate) => void) | null>(null)

  // Create callback function
  const createCallback = useCallback((message: TalentPoolUpdate) => {
    console.log('🔍 Real-time talent pool callback triggered with message:', message)
    
    if (message.type === 'talent_pool_update') {
      const { action, record, old_record } = message.data
      console.log('🔍 Processing talent pool update:', { action, record, old_record })
      
      switch (action) {
        case 'INSERT':
          console.log('🆕 New talent pool record created:', record)
          onTalentPoolCreated?.(record)
          break
        case 'UPDATE':
          console.log('📝 Talent pool record updated:', record, 'Old:', old_record)
          console.log('🔍 Calling onTalentPoolUpdated callback...')
          onTalentPoolUpdated?.(record, old_record)
          console.log('🔍 onTalentPoolUpdated callback completed')
          break
        case 'DELETE':
          console.log('🗑️ Talent pool record deleted:', record)
          onTalentPoolDeleted?.(record)
          break
      }
    }
  }, [onTalentPoolCreated, onTalentPoolUpdated, onTalentPoolDeleted])

  // Register callback
  useEffect(() => {
    if (autoConnect) {
      callbackRef.current = createCallback
      globalTalentPoolCallbacks.add(callbackRef.current)
      
      // Get or create WebSocket connection
      getOrCreateTalentPoolWebSocket()
    }

    return () => {
      if (callbackRef.current) {
        globalTalentPoolCallbacks.delete(callbackRef.current)
      }
    }
  }, [autoConnect, createCallback])

  // Update local state when global state changes
  useEffect(() => {
    const updateState = () => {
      setIsConnected(globalTalentPoolConnectionState.isConnected)
      setError(globalTalentPoolConnectionState.error)
    }

    // Update immediately
    updateState()

    // Set up interval to check for changes
    const interval = setInterval(updateState, 1000)

    return () => clearInterval(interval)
  }, [])

  const connect = useCallback(() => {
    getOrCreateTalentPoolWebSocket()
  }, [])

  const disconnect = useCallback(() => {
    if (globalTalentPoolWebSocket) {
      globalTalentPoolWebSocket.close(1000) // Clean close
    }
  }, [])

  return {
    isConnected,
    error,
    connect,
    disconnect
  }
}
