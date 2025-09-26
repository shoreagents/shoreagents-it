const WebSocket = require('ws')

console.log('🔌 Testing WebSocket connection for events...')

// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:3001')

ws.on('open', function open() {
  console.log('✅ WebSocket connected successfully!')
  
  // Send a test message to verify connection
  ws.send(JSON.stringify({
    type: 'ping',
    data: { message: 'Testing events WebSocket connection' }
  }))
})

ws.on('message', function message(data) {
  try {
    const parsed = JSON.parse(data)
    console.log('📨 Received WebSocket message:', parsed.type, parsed.data)
    
    // Check if it's an event-related message
    if (parsed.type === 'event_update' || parsed.type === 'event_attendance_update') {
      console.log('🎯 Event message received!', parsed.data)
    }
  } catch (error) {
    console.log('📨 Raw message:', data.toString())
  }
})

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message)
})

ws.on('close', function close() {
  console.log('🔌 WebSocket connection closed')
})

// Keep connection alive for 30 seconds to test
setTimeout(() => {
  console.log('⏰ Closing WebSocket connection after 30 seconds...')
  ws.close()
}, 30000)
