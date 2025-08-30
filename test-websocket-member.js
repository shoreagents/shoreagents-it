const WebSocket = require('ws')

// Test WebSocket connection to see if member updates are being received
function testWebSocketMember() {
  console.log('🔍 Testing WebSocket connection for member updates...')
  
  const protocol = 'ws:'
  const wsUrl = `${protocol}//localhost:3001/ws`
  
  console.log(`🔄 Connecting to WebSocket at: ${wsUrl}`)
  
  const ws = new WebSocket(wsUrl)
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected successfully')
    console.log('🔄 Waiting for member update notifications...')
    console.log('💡 Try updating a member\'s service in the database or UI to see notifications')
  })
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log('📨 Received WebSocket message:')
      console.log('  Type:', message.type)
      console.log('  Data:', JSON.stringify(message.data, null, 2))
      
      if (message.type === 'member_update') {
        console.log('✅ Member update notification received!')
        if (message.data.action === 'UPDATE') {
          console.log('📝 Update details:')
          console.log('  Table:', message.data.table)
          console.log('  Action:', message.data.action)
          console.log('  New Record ID:', message.data.record?.id)
          console.log('  Service changed:', message.data.old_record?.service !== message.data.record?.service)
          if (message.data.old_record?.service !== message.data.record?.service) {
            console.log('  Old Service:', message.data.old_record?.service)
            console.log('  New Service:', message.data.record?.service)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error)
      console.log('Raw data:', data.toString())
    }
  })
  
  ws.on('close', (code, reason) => {
    console.log(`❌ WebSocket closed: ${code} - ${reason}`)
  })
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
  })
  
  // Keep connection alive for testing
  setTimeout(() => {
    console.log('⏰ Test completed, closing connection...')
    ws.close()
  }, 30000) // 30 seconds
}

// Run the test
testWebSocketMember()
