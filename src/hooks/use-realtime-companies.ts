import { useEffect, useRef, useState, useCallback } from 'react'

interface CompanyUpdate {
  type: 'company_update' | 'agent_update' | 'client_update' | 'client_assignment_update' | 'personal_info_update' | 'job_info_update' | 'company_activity_update'
  data: {
    table: string
    action: 'INSERT' | 'UPDATE' | 'DELETE'
    record: any
    old_record?: any
    timestamp: string
  }
}

interface UseRealtimeCompaniesOptions {
  onCompanyCreated?: (company: any) => void
  onCompanyUpdated?: (company: any, oldCompany?: any) => void
  onCompanyDeleted?: (company: any) => void
  onAgentCompanyChanged?: (agent: any, oldAgent?: any, notificationData?: any) => void
  onClientCompanyChanged?: (client: any, oldClient?: any, notificationData?: any) => void
  onPersonalInfoChanged?: (personalInfo: any, oldPersonalInfo?: any, notificationData?: any) => void
  onJobInfoChanged?: (jobInfo: any, oldJobInfo?: any, notificationData?: any) => void
  autoConnect?: boolean
}

// Singleton WebSocket connection
let globalWebSocket: WebSocket | null = null
let globalCallbacks: Set<(message: CompanyUpdate) => void> = new Set()
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
    
    console.log('🔄 Creating new WebSocket connection for companies to:', wsUrl)
    globalWebSocket = new WebSocket(wsUrl)

    globalWebSocket.onopen = () => {
      console.log('✅ Global WebSocket connected for companies')
      globalConnectionState.isConnected = true
      globalConnectionState.error = null
    }

    globalWebSocket.onmessage = (event) => {
      try {
        const message: CompanyUpdate = JSON.parse(event.data)
        console.log('📨 Global WebSocket received company update:', message)
        console.log('📨 Raw WebSocket data:', event.data)
        
        // Only process company-related updates
        if (message.type === 'company_update' || message.type === 'agent_update' || message.type === 'client_update' || message.type === 'client_assignment_update' || message.type === 'personal_info_update' || message.type === 'job_info_update' || message.type === 'company_activity_update') {
          console.log('✅ Processing company-related update:', message.type)
          // Notify all registered callbacks
          globalCallbacks.forEach(callback => {
            try {
              callback(message)
            } catch (error) {
              console.error('Error in WebSocket callback:', error)
            }
          })
        } else {
          console.log('❌ Ignoring non-company update:', message.type)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    globalWebSocket.onclose = (event) => {
      console.log('❌ Global WebSocket disconnected for companies:', event.code, event.reason)
      globalConnectionState.isConnected = false
      globalWebSocket = null
      
      // Only reconnect if it wasn't a clean close
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('🔄 Attempting to reconnect global WebSocket for companies...')
          getOrCreateWebSocket()
        }, 5000)
      }
    }

    globalWebSocket.onerror = (error) => {
      console.error('❌ Global WebSocket error for companies:', error)
      globalConnectionState.error = 'WebSocket connection error'
      globalConnectionState.isConnected = false
    }

    return globalWebSocket
  } catch (error) {
    console.error('Error creating WebSocket for companies:', error)
    globalConnectionState.error = 'Failed to create WebSocket connection'
    return null
  }
}

export function useRealtimeCompanies(options: UseRealtimeCompaniesOptions = {}) {
  const {
    onCompanyCreated,
    onCompanyUpdated,
    onCompanyDeleted,
    onAgentCompanyChanged,
    onClientCompanyChanged,
    onPersonalInfoChanged,
    onJobInfoChanged,
    autoConnect = true,
  } = options

  const [isConnected, setIsConnected] = useState(globalConnectionState.isConnected)
  const [error, setError] = useState<string | null>(globalConnectionState.error)
  const callbackRef = useRef<((message: CompanyUpdate) => void) | null>(null)

  // Create callback function
  const createCallback = useCallback((message: CompanyUpdate) => {
    console.log('🔍 Real-time company callback triggered with message:', message)
    
    if (message.type === 'company_update') {
      const { action, record, old_record } = message.data
      console.log('🔍 Processing company update:', { action, record, old_record })
      
      switch (action) {
        case 'INSERT':
          console.log('🆕 New company created:', record)
          onCompanyCreated?.(record)
          break
        case 'UPDATE':
          console.log('📝 Company updated:', record, 'Old:', old_record)
          onCompanyUpdated?.(record, old_record)
          break
        case 'DELETE':
          console.log('🗑️ Company deleted:', old_record)
          onCompanyDeleted?.(old_record)
          break
      }
    } else if (message.type === 'agent_update') {
      const { action, record, old_record } = message.data
      console.log('🔍 Processing agent update:', { action, record, old_record })
      
      // For agent updates, always call the callback regardless of what changed
      if (action === 'UPDATE') {
        console.log('🔄 Agent updated:', record, 'Old:', old_record)
        onAgentCompanyChanged?.(record, old_record, message.data)
      }
    } else if (message.type === 'client_assignment_update') {
      const { action, record, old_record } = message.data
      console.log('🔍 Processing client assignment update:', { action, record, old_record })
      
      // This is specifically for client company assignment changes
      if (action === 'UPDATE' && old_record && 
          record.company_id !== old_record.company_id) {
        console.log('🔄 Client company changed:', record, 'Old company_id:', old_record.company_id, 'New company_id:', record.company_id)
        onClientCompanyChanged?.(record, old_record, message.data)
      }
    } else if (message.type === 'personal_info_update') {
      const { action, record, old_record } = message.data
      console.log('🔍 Processing personal info update:', { action, record, old_record })
      
      if (action === 'UPDATE') {
        console.log('🔄 Personal info updated:', record, 'Old:', old_record)
        onPersonalInfoChanged?.(record, old_record, message.data)
      }
    } else if (message.type === 'job_info_update') {
      const { action, record, old_record } = message.data
      console.log('🔍 Processing job info update:', { action, record, old_record })
      
      if (action === 'UPDATE') {
        console.log('🔄 Job info updated:', record, 'Old:', old_record)
        onJobInfoChanged?.(record, old_record, message.data)
      }
    } else if (message.type === 'company_activity_update') {
      const { action, record, old_record } = message.data
      console.log('🔍 Processing company activity update:', { action, record, old_record })
      
      // Activity updates are typically INSERT operations for new activity logs
      if (action === 'INSERT') {
        console.log('🔄 New company activity logged:', record)
        // You can add a callback for activity updates if needed
        // onCompanyActivityChanged?.(record, old_record, message.data)
      }
    }
      }, [onCompanyCreated, onCompanyUpdated, onCompanyDeleted, onAgentCompanyChanged, onClientCompanyChanged, onPersonalInfoChanged, onJobInfoChanged])

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
