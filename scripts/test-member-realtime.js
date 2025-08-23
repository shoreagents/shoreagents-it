const WebSocket = require('ws');
const { Pool } = require('pg');

// Test the member real-time flow
async function testMemberRealtime() {
  console.log('🧪 Testing Member Real-time Flow...\n');

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
    console.log('✅ Database connected successfully');

    // Step 3: Test member update notification
    console.log('\n📝 Step 3: Testing member update notification...');
    
    // Get a sample member to update
    const memberResult = await pool.query('SELECT id, company FROM public.members LIMIT 1');
    if (memberResult.rows.length === 0) {
      console.log('❌ No members found in database');
      return;
    }
    
    const member = memberResult.rows[0];
    const originalCompany = member.company;
    const newCompany = originalCompany + ' - Updated ' + Date.now();
    
    console.log(`📝 Updating member ${member.id}: "${originalCompany}" → "${newCompany}"`);
    
    // Update the member
    await pool.query(
      'UPDATE public.members SET company = $1 WHERE id = $2',
      [newCompany, member.id]
    );
    
    console.log('✅ Member updated successfully');
    
    // Wait for notification
    console.log('⏳ Waiting 3 seconds for member notification...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we received the notification
    const memberNotification = messagesReceived.find(msg => 
      msg.type === 'member_update' && 
      msg.data.table === 'members' && 
      msg.data.action === 'UPDATE'
    );
    
    if (memberNotification) {
      console.log('✅ Member update notification received successfully!');
      console.log('📊 Notification data:', JSON.stringify(memberNotification, null, 2));
    } else {
      console.log('⚠️ Member update notification not received');
    }

    // Step 4: Test agent member change notification
    console.log('\n👤 Step 4: Testing agent member change notification...');
    
    // Get a sample agent to update
    const agentResult = await pool.query('SELECT id, member_id FROM public.agents WHERE member_id IS NOT NULL LIMIT 1');
    if (agentResult.rows.length === 0) {
      console.log('⚠️ No agents with member_id found, skipping agent test');
    } else {
      const agent = agentResult.rows[0];
      const originalMemberId = agent.member_id;
      const newMemberId = originalMemberId === 1 ? 2 : 1;
      
      console.log(`👤 Updating agent ${agent.id}: member_id ${originalMemberId} → ${newMemberId}`);
      
      // Update the agent's member_id
      await pool.query(
        'UPDATE public.agents SET member_id = $1 WHERE id = $2',
        [newMemberId, agent.id]
      );
      
      console.log('✅ Agent member updated successfully');
      
      // Wait for notification
      console.log('⏳ Waiting 3 seconds for agent notification...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if we received the notification
      const agentNotification = messagesReceived.find(msg => 
        msg.type === 'agent_update' && 
        msg.data.table === 'agents' && 
        msg.data.action === 'UPDATE'
      );
      
      if (agentNotification) {
        console.log('✅ Agent member change notification received successfully!');
        console.log('📊 Notification data:', JSON.stringify(agentNotification, null, 2));
      } else {
        console.log('⚠️ Agent member change notification not received');
      }
      
      // Revert the change
      await pool.query(
        'UPDATE public.agents SET member_id = $1 WHERE id = $2',
        [originalMemberId, agent.id]
      );
      console.log('✅ Agent member reverted');
    }

    // Step 5: Test client member change notification
    console.log('\n🏢 Step 5: Testing client member change notification...');
    
    // Get a sample client to update
    const clientResult = await pool.query('SELECT id, member_id FROM public.clients WHERE member_id IS NOT NULL LIMIT 1');
    if (clientResult.rows.length === 0) {
      console.log('⚠️ No clients with member_id found, skipping client test');
    } else {
      const client = clientResult.rows[0];
      const originalMemberId = client.member_id;
      const newMemberId = originalMemberId === 1 ? 2 : 1;
      
      console.log(`🏢 Updating client ${client.id}: member_id ${originalMemberId} → ${newMemberId}`);
      
      // Update the client's member_id
      await pool.query(
        'UPDATE public.clients SET member_id = $1 WHERE id = $2',
        [newMemberId, client.id]
      );
      
      console.log('✅ Client member updated successfully');
      
      // Wait for notification
      console.log('⏳ Waiting 3 seconds for client notification...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if we received the notification
      const clientNotification = messagesReceived.find(msg => 
        msg.type === 'client_update' && 
        msg.data.table === 'clients' && 
        msg.data.action === 'UPDATE'
      );
      
      if (clientNotification) {
        console.log('✅ Client member change notification received successfully!');
        console.log('📊 Notification data:', JSON.stringify(clientNotification, null, 2));
      } else {
        console.log('⚠️ Client member change notification not received');
      }
      
      // Revert the change
      await pool.query(
        'UPDATE public.clients SET member_id = $1 WHERE id = $2',
        [originalMemberId, client.id]
      );
      console.log('✅ Client member reverted');
    }

    // Step 6: Revert member change
    console.log('\n🔄 Step 6: Reverting member change...');
    await pool.query(
      'UPDATE public.members SET company = $1 WHERE id = $2',
      [originalCompany, member.id]
    );
    console.log('✅ Member company reverted to original value');

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`📨 Total messages received: ${messagesReceived.length}`);
    console.log(`✅ Member updates: ${messagesReceived.filter(msg => msg.type === 'member_update').length}`);
    console.log(`✅ Agent updates: ${messagesReceived.filter(msg => msg.type === 'agent_update').length}`);
    console.log(`✅ Client updates: ${messagesReceived.filter(msg => msg.type === 'client_update').length}`);

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    // Close connections
    await pool.end();
    ws.close();
    console.log('\n🔌 Connections closed');
  }
}

// Run the test
testMemberRealtime().catch(console.error);
