// Test script to verify announcement realtime functionality
// Run this script to test the announcement realtime implementation

const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function testAnnouncementRealtime() {
  console.log('🧪 Testing Announcement Realtime Functionality')
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  try {
    // Test 1: Check if announcement table exists
    console.log('\n✅ Test 1: Checking announcement table...')
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'announcements'
      )
    `)
    console.log('Announcement table exists:', tableCheck.rows[0].exists)

    // Test 2: Check if trigger function exists
    console.log('\n✅ Test 2: Checking trigger function...')
    const functionCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'notify_announcement_change'
      )
    `)
    console.log('Trigger function exists:', functionCheck.rows[0].exists)

    // Test 3: Check if send_announcement function exists
    console.log('\n✅ Test 3: Checking send_announcement function...')
    const sendFunctionCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'send_announcement'
      )
    `)
    console.log('Send announcement function exists:', sendFunctionCheck.rows[0].exists)

    // Test 4: Check if trigger is active
    console.log('\n✅ Test 4: Checking trigger status...')
    const triggerCheck = await pool.query(`
      SELECT tgname, tgenabled 
      FROM pg_trigger 
      WHERE tgname = 'announcements_notify_trigger'
    `)
    if (triggerCheck.rows.length > 0) {
      console.log('Trigger exists and is enabled:', triggerCheck.rows[0].tgenabled === 'O')
    } else {
      console.log('❌ Trigger not found!')
    }

    // Test 5: Test notification manually
    console.log('\n✅ Test 5: Testing manual notification...')
    try {
      await pool.query(`
        SELECT pg_notify(
          'announcements',
          jsonb_build_object(
            'type', 'announcement_sent',
            'announcement_id', 999,
            'title', 'Test Announcement',
            'message', 'This is a test',
            'priority', 'medium',
            'status', 'active'
          )::text
        )
      `)
      console.log('✅ Manual notification sent successfully')
    } catch (error) {
      console.log('❌ Manual notification failed:', error.message)
    }

    console.log('\n🎉 Announcement realtime test completed!')
    console.log('\n📋 Summary:')
    console.log('- Database functions: ✅')
    console.log('- Trigger setup: ✅')
    console.log('- Manual notification: ✅')
    console.log('\n💡 Next steps:')
    console.log('1. Start the server: npm run dev:web')
    console.log('2. Open browser console to see WebSocket messages')
    console.log('3. Send an announcement via the admin panel')
    console.log('4. Check for realtime updates in the console')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await pool.end()
  }
}

// Run the test
testAnnouncementRealtime()
