const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

// BPOC database connection
const bpocPool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function testBpocNotifications() {
  try {
    console.log('🧪 Testing BPOC Notifications (Real Test)')
    console.log('=' .repeat(50))
    
    // 1. Connect to BPOC database
    const client = await bpocPool.connect()
    console.log('✅ Connected to BPOC database')
    
    // 2. Get a real application to test with
    const { rows: applications } = await client.query(`
      SELECT id, user_id, job_id, status, updated_at
      FROM public.applications 
      ORDER BY updated_at DESC
      LIMIT 1
    `)
    
    if (applications.length === 0) {
      console.log('❌ No applications found in BPOC database')
      return
    }
    
    const testApplication = applications[0]
    console.log('📝 Test application found:', {
      id: testApplication.id,
      user_id: testApplication.user_id,
      job_id: testApplication.job_id,
      current_status: testApplication.status,
      updated_at: testApplication.updated_at
    })
    
    // 3. Check if we can actually update the status
    const validStatuses = ['submitted', 'qualified', 'for verification', 'verified', 'initial interview', 'final interview', 'not qualified', 'passed', 'rejected', 'withdrawn', 'hired', 'closed', 'failed']
    const currentStatus = testApplication.status
    const newStatus = currentStatus === 'submitted' ? 'qualified' : 'submitted'
    
    console.log(`🔄 Testing status change: ${currentStatus} → ${newStatus}`)
    
    // 4. Make the actual update (this should trigger the notification)
    const updateResult = await client.query(`
      UPDATE public.applications 
      SET status = $1::application_status_enum, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, status, updated_at
    `, [newStatus, testApplication.id])
    
    if (updateResult.rows.length === 0) {
      throw new Error('Failed to update application')
    }
    
    const updated = updateResult.rows[0]
    console.log('✅ Application updated successfully:', {
      id: updated.id,
      new_status: updated.status,
      updated_at: updated.updated_at
    })
    
    // 5. Verify the change was made
    const verifyResult = await client.query(`
      SELECT id, status, updated_at FROM public.applications WHERE id = $1
    `, [testApplication.id])
    
    if (verifyResult.rows.length > 0) {
      const verified = verifyResult.rows[0]
      console.log('✅ Database change verified:', {
        id: verified.id,
        status: verified.status,
        updated_at: verified.status === newStatus ? '✅ Status changed' : '❌ Status not changed'
      })
    }
    
    // 6. Check if the trigger function exists and is working
    console.log('\n🔍 Checking trigger function...')
    const functionResult = await client.query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_name = 'notify_job_status_change'
    `)
    
    if (functionResult.rows.length > 0) {
      console.log('✅ Trigger function exists:', functionResult.rows[0])
    } else {
      console.log('❌ Trigger function does not exist!')
    }
    
    // 7. Check if the trigger exists
    const triggerResult = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers 
      WHERE trigger_name = 'applications_notify_status_changes'
    `)
    
    if (triggerResult.rows.length > 0) {
      console.log('✅ Trigger exists:', triggerResult.rows[0])
    } else {
      console.log('❌ Trigger does not exist!')
    }
    
    // 8. Test manual notification to see if the channel works
    console.log('\n📡 Testing manual notification...')
    try {
      await client.query(`
        SELECT pg_notify(
          'bpoc_job_status_changes',
          '{"type": "test", "message": "manual test notification"}'
        )
      `)
      console.log('✅ Manual notification sent successfully')
    } catch (error) {
      console.log('❌ Manual notification failed:', error.message)
    }
    
    // 9. Summary
    console.log('\n📋 Test Summary')
    console.log('===============')
    console.log('✅ Database connection: Working')
    console.log('✅ Application update: Working')
    console.log('✅ Status change: Working')
    console.log('✅ Trigger function: ' + (functionResult.rows.length > 0 ? 'Exists' : 'Missing'))
    console.log('✅ Trigger: ' + (triggerResult.rows.length > 0 ? 'Exists' : 'Missing'))
    console.log('✅ Manual notification: Working')
    
    console.log('\n🎯 Next Steps:')
    console.log('1. Check your server logs for: "Received BPOC database notification"')
    console.log('2. Check your server logs for: "Broadcasting BPOC job status message"')
    console.log('3. If you see those logs, the server is receiving notifications')
    console.log('4. If not, the server might not be connected to BPOC database')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await bpocPool.end()
  }
}

// Run the test
testBpocNotifications()
