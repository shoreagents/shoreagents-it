const { Pool } = require('pg')
const WebSocket = require('ws')

console.log('🧪 Testing Complete Events Realtime Flow...')

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/shoreagents_it'
})

// WebSocket connection
const ws = new WebSocket('ws://localhost:3001')

let messageCount = 0
const expectedMessages = 5 // We'll create 5 database events

ws.on('open', function open() {
  console.log('✅ WebSocket connected!')
  
  // Start database operations
  setTimeout(() => {
    testDatabaseOperations()
  }, 1000)
})

ws.on('message', function message(data) {
  try {
    const parsed = JSON.parse(data)
    messageCount++
    
    console.log(`📨 Message ${messageCount}:`, parsed.type)
    
    if (parsed.type === 'event_update' || parsed.type === 'event_attendance_update') {
      console.log('🎯 Event message received!', {
        type: parsed.type,
        eventId: parsed.data.event_id,
        title: parsed.data.event_title,
        action: parsed.data.type || parsed.data.action
      })
    }
    
    if (messageCount >= expectedMessages) {
      console.log('✅ All expected messages received!')
      ws.close()
      pool.end()
    }
  } catch (error) {
    console.log('📨 Raw message:', data.toString())
  }
})

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message)
})

ws.on('close', function close() {
  console.log('🔌 WebSocket connection closed')
  pool.end()
})

async function testDatabaseOperations() {
  try {
    console.log('📝 Creating test event...')
    
    // Create event
    const createResult = await pool.query(`
      INSERT INTO events (title, description, event_date, start_time, end_time, location, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title
    `, [
      'WebSocket Test Event',
      'Testing realtime notifications',
      '2024-12-20',
      '10:00:00',
      '11:00:00',
      'Test Location',
      'upcoming',
      1
    ])
    
    const eventId = createResult.rows[0].id
    console.log('✅ Event created:', eventId)
    
    // Wait for notification
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update event
    console.log('📝 Updating event...')
    await pool.query(`
      UPDATE events 
      SET title = $1, status = $2
      WHERE id = $3
    `, ['Updated WebSocket Test Event', 'today', eventId])
    console.log('✅ Event updated')
    
    // Wait for notification
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Add attendance
    console.log('📝 Adding event attendance...')
    await pool.query(`
      INSERT INTO event_attendance (event_id, user_id, is_going, going_at)
      VALUES ($1, $2, $3, $4)
    `, [eventId, 1, true, new Date()])
    console.log('✅ Event attendance added')
    
    // Wait for notification
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update attendance
    console.log('📝 Updating event attendance...')
    await pool.query(`
      UPDATE event_attendance 
      SET is_back = $1, back_at = $2
      WHERE event_id = $3 AND user_id = $4
    `, [true, new Date(), eventId, 1])
    console.log('✅ Event attendance updated')
    
    // Wait for notification
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Delete event
    console.log('📝 Deleting event...')
    await pool.query('DELETE FROM events WHERE id = $1', [eventId])
    console.log('✅ Event deleted')
    
  } catch (error) {
    console.error('❌ Database error:', error.message)
    ws.close()
    pool.end()
  }
}

// Timeout after 30 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - closing connections')
  ws.close()
  pool.end()
}, 30000)
