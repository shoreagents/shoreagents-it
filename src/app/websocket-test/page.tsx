"use client"

import { useEffect, useState } from 'react'

export default function WebSocketTest() {
  const [status, setStatus] = useState('Not connected')
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    
    console.log('Testing WebSocket connection to:', wsUrl)
    
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected in test')
      setStatus('Connected')
      setMessages(prev => [...prev, '✅ Connected successfully'])
    }
    
    ws.onmessage = (event) => {
      console.log('📨 Received message:', event.data)
      setMessages(prev => [...prev, `📨 Received: ${event.data}`])
    }
    
    ws.onclose = (event) => {
      console.log('❌ WebSocket closed in test:', event.code, event.reason)
      setStatus(`Disconnected (${event.code})`)
      setMessages(prev => [...prev, `❌ Disconnected: ${event.code} - ${event.reason}`])
    }
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error in test:', error)
      setStatus('Error')
      setMessages(prev => [...prev, '❌ Connection error'])
    }
    
    return () => {
      ws.close()
    }
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">WebSocket Test</h1>
      <div className="mb-4">
        <p className="text-lg">Status: <span className="font-mono">{status}</span></p>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-bold mb-2">Connection Log:</h2>
        <div className="space-y-1 text-sm">
          {messages.map((msg, index) => (
            <div key={index} className="font-mono">{msg}</div>
          ))}
        </div>
      </div>
    </div>
  )
} 