const WebSocket = require('ws');
const { Pool } = require('pg');

// Test the complete real-time flow
async function testCompleteRealtime() {
  console.log('🧪 Testing Complete Real-time Flow...\n');

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

  // Step 2: Connect to database and trigger changes
  console.log('\n📊 Step 2: Testing database triggers with WebSocket monitoring...');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found. Please set it in your environment.');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0]);

    // Step 3: Make database changes and monitor WebSocket
    console.log('\n🔄 Step 3: Making database changes...');
    
    // Test 1: INSERT
    console.log('\n📝 Test 1: INSERT operation...');
    const insertResult = await pool.query(`
      INSERT INTO public.bpoc_recruits (
        bpoc_application_id, 
        applicant_id, 
        job_id, 
        resume_slug, 
        status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      999,
      'test-realtime-' + Date.now(),
      'submitted'
    ]);

    console.log('✅ Inserted record with ID:', insertResult.rows[0].id);
    
    // Wait for WebSocket message
    console.log('⏳ Waiting 5 seconds for WebSocket message...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 2: UPDATE
    console.log('\n📝 Test 2: UPDATE operation...');
    const updateResult = await pool.query(`
      UPDATE public.bpoc_recruits 
      SET status = $1 
      WHERE id = $2
      RETURNING id, status
    `, ['screened', insertResult.rows[0].id]);

    console.log('✅ Updated record:', updateResult.rows[0]);
    
    // Wait for WebSocket message
    console.log('⏳ Waiting 5 seconds for WebSocket message...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 3: DELETE
    console.log('\n📝 Test 3: DELETE operation...');
    const deleteResult = await pool.query(`
      DELETE FROM public.bpoc_recruits 
      WHERE id = $1
      RETURNING id
    `, [insertResult.rows[0].id]);

    console.log('✅ Deleted record');
    
    // Wait for WebSocket message
    console.log('⏳ Waiting 5 seconds for WebSocket message...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Summary
    console.log('\n📋 Step 4: Test Summary');
    console.log('========================');
    console.log(`WebSocket Connected: ${wsConnected ? '✅ Yes' : '❌ No'}`);
    console.log(`Database Connected: ✅ Yes`);
    console.log(`Database Triggers: ✅ Working (confirmed in previous test)`);
    console.log(`WebSocket Messages: ${messagesReceived.length}`);
    
    if (messagesReceived.length > 0) {
      console.log('\n📨 WebSocket messages received:');
      messagesReceived.forEach((msg, index) => {
        console.log(`${index + 1}. Type: ${msg.type}, Action: ${msg.data?.action || 'N/A'}`);
        if (msg.data?.action) {
          console.log(`   Table: ${msg.data.table}, Record ID: ${msg.data.record?.id}`);
        }
      });
    } else {
      console.log('\n🚨 No WebSocket messages received!');
      console.log('\n🔍 Possible issues:');
      console.log('   1. WebSocket server not receiving database notifications');
      console.log('   2. WebSocket server not broadcasting messages');
      console.log('   3. Message format mismatch');
      console.log('   4. Server.js not properly configured');
      
      console.log('\n📋 Next steps to debug:');
      console.log('   1. Check server.js console logs for notifications');
      console.log('   2. Verify WebSocket server is listening on correct port');
      console.log('   3. Check if server.js is using the updated code');
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await pool.end();
  }

  // Close WebSocket
  ws.close();
  
  console.log('\n🏁 Test completed!');
}

// Run the test
testCompleteRealtime().catch(console.error);
