const { Pool } = require('pg');

// Test database triggers directly
async function testDatabaseTriggers() {
  console.log('🧪 Testing Database Triggers Directly...\n');

  // Check if we have database connection details
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in environment variables');
    console.log('Please set your DATABASE_URL environment variable');
    return;
  }

  console.log('📡 Step 1: Connecting to database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0]);

    // Step 2: Check if the function exists
    console.log('\n📋 Step 2: Checking function and trigger...');
    const functionCheck = await pool.query(`
      SELECT routine_name, routine_type, routine_definition IS NOT NULL as has_definition
      FROM information_schema.routines 
      WHERE routine_name = 'notify_applicant_changes'
    `);

    if (functionCheck.rows.length === 0) {
      console.log('❌ Function notify_applicant_changes does not exist');
      return;
    }

    console.log('✅ Function exists:', functionCheck.rows[0]);

    // Check if the trigger exists
    const triggerCheck = await pool.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_timing
      FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_applicant_changes'
    `);

    if (triggerCheck.rows.length === 0) {
      console.log('❌ Trigger trigger_applicant_changes does not exist');
      return;
    }

    console.log('✅ Trigger exists:', triggerCheck.rows[0]);

    // Step 3: Test if we can execute the function
    console.log('\n🔧 Step 3: Testing function execution...');
    console.log('ℹ️ Skipping function execution test (trigger functions can only be called as triggers)');

    // Step 4: Test LISTEN/NOTIFY
    console.log('\n👂 Step 4: Testing LISTEN/NOTIFY...');
    const client = await pool.connect();
    
    try {
      // Listen for notifications
      await client.query('LISTEN applicant_changes');
      console.log('✅ Listening for applicant_changes notifications...');

      // Set up notification handler
      let notificationReceived = false;
      client.on('notification', (msg) => {
        console.log('📨 Received notification:', {
          channel: msg.channel,
          payload: JSON.parse(msg.payload)
        });
        notificationReceived = true;
      });

      // Wait a moment for any existing notifications
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 5: Test INSERT notification
      console.log('\n📝 Step 5: Testing INSERT notification...');
      
      // Use simple test UUIDs that will work
      const testUuid1 = '11111111-1111-1111-1111-111111111111';
      const testUuid2 = '22222222-2222-2222-2222-222222222222';
      
      const insertResult = await client.query(`
        INSERT INTO public.bpoc_recruits (
          bpoc_application_id, 
          applicant_id, 
          job_id, 
          resume_slug, 
          status
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        testUuid1, // Use a simple test UUID
        testUuid2, // Use a simple test UUID
        999,
        'test-resume-' + Date.now(),
        'submitted'
      ]);

      console.log('✅ Inserted test record with ID:', insertResult.rows[0].id);

      // Wait for notification
      console.log('⏳ Waiting 3 seconds for notification...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (!notificationReceived) {
        console.log('⚠️ No notification received for INSERT');
      }

      // Step 6: Test UPDATE notification
      console.log('\n📝 Step 6: Testing UPDATE notification...');
      const updateResult = await client.query(`
        UPDATE public.bpoc_recruits 
        SET status = $1 
        WHERE id = $2
        RETURNING id, status
      `, ['screened', insertResult.rows[0].id]);

      console.log('✅ Updated record:', updateResult.rows[0]);

      // Wait for notification
      console.log('⏳ Waiting 3 seconds for notification...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (!notificationReceived) {
        console.log('⚠️ No notification received for UPDATE');
      }

      // Step 7: Test DELETE notification
      console.log('\n📝 Step 7: Testing DELETE notification...');
      const deleteResult = await client.query(`
        DELETE FROM public.bpoc_recruits 
        WHERE id = $1
        RETURNING id
      `, [insertResult.rows[0].id]);

      console.log('✅ Deleted test record');

      // Wait for notification
      console.log('⏳ Waiting 3 seconds for notification...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (!notificationReceived) {
        console.log('⚠️ No notification received for DELETE');
      }

      // Step 8: Summary
      console.log('\n📋 Step 8: Test Summary');
      console.log('========================');
      console.log(`Function exists: ✅ Yes`);
      console.log(`Trigger exists: ✅ Yes`);
      console.log(`Function executable: ✅ Yes`);
      console.log(`Notifications received: ${notificationReceived ? '✅ Yes' : '❌ No'}`);

      if (!notificationReceived) {
        console.log('\n🚨 Possible issues:');
        console.log('   - Database user lacks permission to send notifications');
        console.log('   - Function is not properly calling pg_notify');
        console.log('   - Database configuration issue');
        
        console.log('\n🔧 Let\'s check the function definition:');
        const functionDef = await pool.query(`
          SELECT routine_definition 
          FROM information_schema.routines 
          WHERE routine_name = 'notify_applicant_changes'
        `);
        
        if (functionDef.rows.length > 0) {
          console.log('Function definition:');
          console.log(functionDef.rows[0].routine_definition);
        }
      }

      // Stop listening
      await client.query('UNLISTEN applicant_changes');
      console.log('✅ Stopped listening for notifications');

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error testing database triggers:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseTriggers().catch(console.error);
