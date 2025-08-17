const WebSocket = require('ws');

async function testRealtimeConnection() {
  console.log('🧪 Testing real-time connection...');
  
  try {
    // Connect to WebSocket
    const protocol = 'ws:';
    const wsUrl = `${protocol}//localhost:3000/ws`;
    
    console.log('🔌 Connecting to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully!');
      
      // Send a test message
      ws.send(JSON.stringify({
        type: 'test',
        message: 'Hello from test script'
      }));
      
      console.log('📤 Sent test message');
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received message:', message);
      } catch (error) {
        console.log('📨 Received raw message:', data.toString());
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
    
    ws.on('close', (code, reason) => {
      console.log('❌ WebSocket closed:', code, reason);
    });
    
    // Keep connection alive for a few seconds
    setTimeout(() => {
      console.log('🔌 Closing test connection...');
      ws.close();
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error('❌ Error testing real-time connection:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testRealtimeConnection().catch(console.error);
}

module.exports = { testRealtimeConnection };
