const { Pool } = require('pg')
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') })

async function testEventsRealtime() {
  console.log('🧪 Testing Events Realtime Notifications...')
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  try {
    // Test 1: Create a new event
    console.log('\n📝 Test 1: Creating a new event...')
    const createEventQuery = `
      INSERT INTO events (title, description, event_date, start_time, end_time, location, event_type, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const eventDate = tomorrow.toISOString().split('T')[0]
    
    const createResult = await pool.query(createEventQuery, [
      'Test Realtime Event',
      'This is a test event to verify realtime notifications',
      eventDate,
      '10:00',
      '11:00',
      'Test Location',
      'event',
      'upcoming',
      1 // created_by user ID
    ])
    
    const newEvent = createResult.rows[0]
    console.log('✅ Event created:', newEvent.id, newEvent.title)
    
    // Wait a moment for the notification to be processed
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Test 2: Update the event
    console.log('\n📝 Test 2: Updating the event...')
    const updateEventQuery = `
      UPDATE events 
      SET title = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `
    
    const updateResult = await pool.query(updateEventQuery, [
      'Updated Test Realtime Event',
      'This event has been updated to test realtime notifications',
      newEvent.id
    ])
    
    const updatedEvent = updateResult.rows[0]
    console.log('✅ Event updated:', updatedEvent.id, updatedEvent.title)
    
    // Wait a moment for the notification to be processed
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Test 3: Change event status
    console.log('\n📝 Test 3: Changing event status...')
    const statusUpdateQuery = `
      UPDATE events 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `
    
    const statusResult = await pool.query(statusUpdateQuery, [
      'today',
      newEvent.id
    ])
    
    const statusUpdatedEvent = statusResult.rows[0]
    console.log('✅ Event status updated:', statusUpdatedEvent.id, statusUpdatedEvent.status)
    
    // Wait a moment for the notification to be processed
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Test 4: Add event attendance
    console.log('\n📝 Test 4: Adding event attendance...')
    const addAttendanceQuery = `
      INSERT INTO event_attendance (event_id, user_id, is_going, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `
    
    const attendanceResult = await pool.query(addAttendanceQuery, [
      newEvent.id,
      1, // user_id
      true // is_going
    ])
    
    const attendance = attendanceResult.rows[0]
    console.log('✅ Event attendance added:', attendance.id, 'for event', attendance.event_id)
    
    // Wait a moment for the notification to be processed
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Test 5: Delete the event
    console.log('\n📝 Test 5: Deleting the event...')
    const deleteEventQuery = `
      DELETE FROM events WHERE id = $1 RETURNING *
    `
    
    const deleteResult = await pool.query(deleteEventQuery, [newEvent.id])
    const deletedEvent = deleteResult.rows[0]
    console.log('✅ Event deleted:', deletedEvent.id, deletedEvent.title)
    
    console.log('\n🎉 All realtime event tests completed!')
    console.log('📡 Check your WebSocket connection and events page to see realtime updates.')
    console.log('🔔 Check for desktop notifications if enabled.')
    
  } catch (error) {
    console.error('❌ Error testing events realtime:', error)
  } finally {
    await pool.end()
  }
}

// Run the test
testEventsRealtime().catch(console.error)
