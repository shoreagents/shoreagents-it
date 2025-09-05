/**
 * Test script for Electron notifications
 * Run this in your Electron app's browser console
 */

console.log('🧪 Testing Electron Notifications');

// Test if Electron API is available
if (typeof window !== 'undefined' && window.electronAPI) {
  console.log('✅ Electron API available');
  
  // Test notification permission check
  console.log('🔍 Checking notification permission...');
  window.electronAPI.checkNotificationPermission()
    .then(result => {
      console.log('Permission check result:', result);
      
      if (result.granted) {
        console.log('✅ Permission granted, testing notification...');
        
        // Test showing a notification
        return window.electronAPI.showNotification({
          title: 'Test Notification',
          body: 'This is a test notification from the console',
          urgency: 'normal',
          id: 'test-' + Date.now()
        });
      } else {
        console.log('❌ Permission not granted');
        return null;
      }
    })
    .then(result => {
      if (result) {
        console.log('✅ Notification test result:', result);
      }
    })
    .catch(error => {
      console.error('❌ Error testing notifications:', error);
    });
} else {
  console.log('❌ Electron API not available - make sure you\'re running in Electron app');
}

console.log(`
📋 Testing Instructions:

1. **Open your Electron app**
2. **Press F12 to open Developer Tools**
3. **Go to Console tab**
4. **Copy and paste this entire script**
5. **Press Enter to run**

Expected results:
- ✅ Electron API available
- ✅ Permission granted
- ✅ Notification test result: {success: true, notificationId: "test-..."}
- Desktop notification should appear

If you see errors:
- Make sure you're running in Electron (not browser)
- Check if the app was restarted after the main.js changes
- Look for any error messages in the console
`);
