/**
 * Test script for ticket notifications
 * Run this in your browser console or as a Node.js script
 */

// Test data for simulating a new ticket
const testTicketData = {
  type: 'ticket_update',
  data: {
    table: 'tickets',
    action: 'INSERT',
    record: {
      id: Math.floor(Math.random() * 10000),
      title: 'Test Notification from Script',
      description: 'This is a test notification created by the test script. It simulates a real ticket creation event.',
      status: 'For Approval',
      priority: 'High',
      category: 'Technical Support',
      user_id: 1,
      role_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  }
};

console.log('🧪 Testing Ticket Notifications');
console.log('Test data:', testTicketData);

// If running in browser context
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser context');
  
  // Check if Electron is available
  if (window.electronAPI) {
    console.log('✅ Electron API available');
    
    // Test notification directly
    window.electronAPI.showNotification({
      title: 'Test Ticket: ' + testTicketData.data.record.title,
      body: testTicketData.data.record.description,
      urgency: 'normal',
      id: 'test-' + Date.now()
    }).then(result => {
      console.log('Notification result:', result);
    }).catch(error => {
      console.error('Notification error:', error);
    });
  } else {
    console.log('❌ Electron API not available - notifications only work in Electron app');
  }
} else {
  console.log('🖥️ Running in Node.js context');
  console.log('To test notifications, run this script in your Electron app\'s browser console');
}

// Instructions
console.log(`
📋 Testing Instructions:

1. **Browser Console Test:**
   - Open your Electron app
   - Press F12 to open Developer Tools
   - Go to Console tab
   - Copy and paste this entire script
   - Press Enter to run

2. **Real Ticket Test:**
   - Go to /it/tickets or /admin/tickets
   - Create a new ticket
   - You should see a notification immediately

3. **Test Component:**
   - Go to /it/dashboard
   - Click "Test Notifications" button
   - Use the test interface

4. **WebSocket Test:**
   - Open Network tab in DevTools
   - Look for WebSocket connection to /ws
   - Check if it's receiving ticket updates

5. **Permission Test:**
   - Check if notifications are enabled in system settings
   - Grant permission when prompted
   - Test with the test component

🔧 Troubleshooting:
- Make sure you're running in Electron (not regular browser)
- Check system notification permissions
- Verify WebSocket connection is active
- Look for errors in console
`);
