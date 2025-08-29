const WebSocket = require('ws');

// Test BPOC job status real-time updates
async function testBpocJobStatusRealtime() {
  console.log('🧪 Testing BPOC Job Status Real-time Updates...')
  
  // Connect to WebSocket
  const ws = new WebSocket('ws://localhost:3001/ws')
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected to BPOC job status real-time')
    console.log('📱 Open the talent pool page and a modal in your browser')
    console.log('🔍 Watch the browser console for real-time job status update logs')
    console.log('📊 Check if job statuses update in real-time when changes occur')
  })
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log('📨 WebSocket message received:', {
        type: message.type,
        data: message.data
      })
      
      if (message.type === 'bpoc_job_status_update') {
        console.log('🎯 BPOC Job Status Update detected!')
        console.log('📝 Job Status Change:', {
          applicationId: message.data.application_id,
          userId: message.data.user_id,
          jobId: message.data.job_id,
          oldStatus: message.data.old_status,
          newStatus: message.data.new_status,
          timestamp: message.data.timestamp
        })
        console.log('✅ This should trigger a real-time update in the talent pool modal!')
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
  console.log('2. Open a modal for any applicant')
  console.log('3. Open browser console (F12)')
  console.log('4. Make changes to job statuses in the BPOC database')
  console.log('5. Watch for real-time update logs in the modal console')
  console.log('6. Check if job statuses update automatically in the modal')
  
  console.log('\n🔄 Listening for BPOC job status real-time updates... Press Ctrl+C to stop')
}

testBpocJobStatusRealtime()
