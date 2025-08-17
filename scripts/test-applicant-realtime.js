const WebSocket = require('ws');

// Test the applicant real-time system
async function testApplicantRealtime() {
  console.log('🧪 Testing Applicant Real-time System...\n');

  // Step 1: Connect to WebSocket
  console.log('📡 Step 1: Connecting to WebSocket...');
  const ws = new WebSocket('ws://localhost:3002/ws');
  
  let wsConnected = false;
  let messagesReceived = [];

  ws.on('open', () => {
    console.log('✅ WebSocket connected successfully');
    wsConnected = true;
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received WebSocket message:', message);
      messagesReceived.push(message);
    } catch (error) {
      console.log('📨 Received raw message:', data.toString());
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });

  // Wait for WebSocket connection
  await new Promise(resolve => {
    if (wsConnected) resolve();
    ws.on('open', resolve);
  });

  // Step 2: Test database triggers by making API calls
  console.log('\n📊 Step 2: Testing database triggers...');
  
  // Test 1: Create a new applicant
  console.log('\n🆕 Test 1: Creating new applicant...');
  try {
    const createResponse = await fetch('http://localhost:3002/api/bpoc-applicants/auto-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('✅ Auto-save result:', result);
    } else {
      console.log('⚠️ Auto-save response:', createResponse.status, createResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Auto-save error:', error.message);
  }

  // Wait for potential real-time messages
  console.log('\n⏳ Waiting 3 seconds for real-time messages...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 3: Test status update
  console.log('\n🔄 Test 2: Updating applicant status...');
  try {
    // First get existing applicants
    const getResponse = await fetch('http://localhost:3002/api/bpoc-applicants');
    if (getResponse.ok) {
      const applicants = await getResponse.json();
      if (applicants.length > 0) {
        const firstApplicant = applicants[0];
        console.log('📝 Updating applicant:', firstApplicant.id);
        
        const updateResponse = await fetch(`http://localhost:3002/api/bpoc-applicants`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: firstApplicant.id,
            status: 'initial interview'
          })
        });
        
        if (updateResponse.ok) {
          const result = await updateResponse.json();
          console.log('✅ Update result:', result);
        } else {
          console.log('⚠️ Update response:', updateResponse.status, updateResponse.statusText);
        }
      } else {
        console.log('⚠️ No applicants found to update');
      }
    } else {
      console.log('⚠️ Get applicants response:', getResponse.status, getResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Update error:', error.message);
  }

  // Wait for potential real-time messages
  console.log('\n⏳ Waiting 3 seconds for real-time messages...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 4: Test position update
  console.log('\n📍 Test 3: Updating applicant position...');
  try {
    const getResponse = await fetch('http://localhost:3002/api/bpoc-applicants');
    if (getResponse.ok) {
      const applicants = await getResponse.json();
      if (applicants.length > 0) {
        const firstApplicant = applicants[0];
        console.log('📝 Updating position for applicant:', firstApplicant.id);
        
        const positionResponse = await fetch('http://localhost:3002/api/bpoc-applicants/positions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            positions: [{
              id: firstApplicant.id,
              position: 999
            }]
          })
        });
        
        if (positionResponse.ok) {
          const result = await positionResponse.json();
          console.log('✅ Position update result:', result);
        } else {
          console.log('⚠️ Position update response:', positionResponse.status, positionResponse.statusText);
        }
      }
    }
  } catch (error) {
    console.log('❌ Position update error:', error.message);
  }

  // Wait for potential real-time messages
  console.log('\n⏳ Waiting 3 seconds for real-time messages...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 5: Summary
  console.log('\n📋 Step 5: Test Summary');
  console.log('========================');
  console.log(`WebSocket Connected: ${wsConnected ? '✅ Yes' : '❌ No'}`);
  console.log(`Messages Received: ${messagesReceived.length}`);
  
  if (messagesReceived.length > 0) {
    console.log('\n📨 Messages received:');
    messagesReceived.forEach((msg, index) => {
      console.log(`${index + 1}. Type: ${msg.type}, Action: ${msg.data?.action || 'N/A'}`);
    });
  } else {
    console.log('\n⚠️ No real-time messages received. Possible issues:');
    console.log('   - Database triggers not working');
    console.log('   - WebSocket server not receiving notifications');
    console.log('   - Function permissions issue');
  }

  // Close WebSocket
  ws.close();
  
  console.log('\n🏁 Test completed!');
}

// Run the test
testApplicantRealtime().catch(console.error);
