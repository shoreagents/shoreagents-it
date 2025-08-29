const WebSocket = require('ws');

// Simple test to check if real-time updates are working
async function testTalentPoolRealtime() {
  console.log('🧪 Testing Talent Pool Real-time Updates...')
  
  // Connect to WebSocket
  const ws = new WebSocket('ws://localhost:3001/ws')
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected to talent pool')
    console.log('📱 Open the talent pool page in your browser')
    console.log('🔍 Watch the browser console for real-time update logs')
    console.log('📊 Check if applicants list updates when changes occur')
  })
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log('📨 WebSocket message received:', {
        type: message.type,
        action: message.data?.action,
        table: message.data?.table,
        recordId: message.data?.record?.id || message.data?.record?.applicant_id
      })
      
      if (message.type === 'applicant_update') {
        console.log('🎯 Applicant update detected!')
        console.log('📝 Action:', message.data?.action)
        console.log('🆔 Record ID:', message.data?.record?.id || message.data?.record?.applicant_id)
        console.log('📊 Status:', message.data?.record?.status)
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error)
    }
  })
  
  ws.on('close', () => {
    console.log('❌ WebSocket disconnected')
  })
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
  })
  
  console.log('\n📋 Instructions:')
  console.log('1. Open the talent pool page in your browser')
  console.log('2. Open browser console (F12)')
  console.log('3. Make changes to applicant data in the database')
  console.log('4. Watch for real-time update logs')
  console.log('5. Check if the applicants list updates automatically')
  
  console.log('\n🔄 Listening for real-time updates... Press Ctrl+C to stop')
}

testTalentPoolRealtime()
