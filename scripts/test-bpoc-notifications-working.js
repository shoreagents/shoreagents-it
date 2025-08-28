const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

// BPOC database connection
const bpocPool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function testBpocNotifications() {
  try {
    console.log('🧪 Testing BPOC Notifications (Quick Test)')
    console.log('=' .repeat(40))
    
    // 1. Connect and listen to notifications
    const client = await bpocPool.connect()
    console.log('✅ Connected to BPOC database')
    
    // Listen to the notification channel
    await client.query('LISTEN bpoc_job_status_changes')
    console.log('✅ Listening to bpoc_job_status_changes channel')
    
    // 2. Set up notification listener
    let notificationReceived = false
    client.on('notification', (msg) => {
      console.log('📨 NOTIFICATION RECEIVED!')
      console.log('   Channel:', msg.channel)
      console.log('   Payload:', msg.payload)
      notificationReceived = true
    })
    
    // 3. Trigger a notification
    console.log('\n📝 Triggering notification by updating job status...')
    const { rows: applications } = await bpocPool.query(`
      SELECT id, user_id, job_id, status 
      FROM public.applications 
      LIMIT 1
    `)
    
    if (applications.length === 0) {
      console.log('❌ No applications found to test with')
      return
    }
    
    const testApplication = applications[0]
    const oldStatus = testApplication.status
    const newStatus = oldStatus === 'submitted' ? 'qualified' : 'submitted'
    
    console.log(`📝 Updating application ${testApplication.id} status from '${oldStatus}' to '${newStatus}'...`)
    
    // Start transaction
    await client.query('BEGIN')
    
    // Update status (this should trigger notification)
    const updateResult = await client.query(`
      UPDATE public.applications 
      SET status = $1::application_status_enum, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, status, updated_at
    `, [newStatus, testApplication.id])
    
    if (updateResult.rows.length === 0) {
      throw new Error('Failed to update application')
    }
    
    console.log('✅ Application updated successfully')
    
    // 4. Wait for notification
    console.log('⏳ Waiting for notification...')
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (!notificationReceived) {
          console.log('❌ No notification received within 5 seconds')
        }
        resolve()
      }, 5000)
      
      if (notificationReceived) {
        clearTimeout(timeout)
        resolve()
      }
    })
    
    // 5. Commit the transaction to send the notification
    await client.query('COMMIT')
    console.log('✅ Transaction committed - notification should be sent')
    
    // Wait a bit more for the notification to be processed
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (notificationReceived) {
      console.log('\n🎉 SUCCESS! BPOC notifications are working!')
      console.log('   Your real-time updates should work now.')
    } else {
      console.log('\n❌ FAILED! BPOC notifications are not working.')
      console.log('   Check your database configuration.')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await bpocPool.end()
  }
}

// Run the test
testBpocNotifications()
