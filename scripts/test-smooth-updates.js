const WebSocket = require('ws');

// Test smooth real-time updates without skeleton refresh
async function testSmoothUpdates() {
  console.log('🧪 Testing Smooth Real-time Updates...')
  
  // Connect to WebSocket
  const ws = new WebSocket('ws://localhost:3001/ws')
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected')
    console.log('📱 Open the talent pool page and watch for smooth updates')
    console.log('🔍 You should NOT see skeleton loading when updates happen')
  })
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      if (message.type === 'applicant_update') {
        console.log('📨 Real-time update received:', {
          action: message.data?.action,
          status: message.data?.record?.status,
          applicant_id: message.data?.record?.applicant_id
        })
      }
    } catch (error) {
      console.error('Error parsing message:', error)
    }
  })
  
  ws.on('close', () => {
    console.log('❌ WebSocket disconnected')
  })
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
  })
  
  // Keep the connection alive
  console.log('🔄 Listening for real-time updates... Press Ctrl+C to stop')
}

testSmoothUpdates()
