const { Pool } = require('pg')

console.log('🧪 Testing Event Date Realtime Updates...')

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/shoreagents_it'
})

async function testEventDateRealtime() {
  try {
    console.log('📝 Creating test event with initial date...')
    
    // Create event with initial date
    const createResult = await pool.query(`
      INSERT INTO events (title, description, event_date, start_time, end_time, location, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, event_date
    `, [
      'Date Realtime Test Event',
      'Testing realtime date updates',
      '2024-12-20',
      '10:00:00',
      '11:00:00',
      'Test Location',
      'upcoming',
      1
    ])
    
    const eventId = createResult.rows[0].id
    const initialDate = createResult.rows[0].event_date
    console.log('✅ Event created:', eventId, 'Initial date:', initialDate)
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update the event date
    console.log('📝 Updating event date to 2024-12-25...')
    const updateResult = await pool.query(`
      UPDATE events 
      SET event_date = $1
      WHERE id = $2
      RETURNING event_date
    `, ['2024-12-25', eventId])
    
    const newDate = updateResult.rows[0].event_date
    console.log('✅ Event date updated:', newDate)
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update the event date again
    console.log('📝 Updating event date to 2024-12-30...')
    const updateResult2 = await pool.query(`
      UPDATE events 
      SET event_date = $1
      WHERE id = $2
      RETURNING event_date
    `, ['2024-12-30', eventId])
    
    const finalDate = updateResult2.rows[0].event_date
    console.log('✅ Event date updated again:', finalDate)
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Clean up - delete the test event
    console.log('📝 Cleaning up test event...')
    await pool.query('DELETE FROM events WHERE id = $1', [eventId])
    console.log('✅ Test event deleted')
    
    console.log('🎉 Event date realtime test completed!')
    console.log('📡 Check your events modal to see if the date updates in realtime')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

testEventDateRealtime()
