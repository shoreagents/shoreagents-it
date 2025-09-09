const { Pool } = require('pg')

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function checkEventsTable() {
  try {
    console.log('Checking events table...')
    
    // Check if events table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'events'
      );
    `)
    console.log('Events table exists:', tableCheck.rows[0].exists)
    
    if (tableCheck.rows[0].exists) {
      // Check table structure
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        ORDER BY ordinal_position;
      `)
      console.log('Events table structure:')
      structure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
      })
      
      // Check if there are any events
      const countResult = await pool.query('SELECT COUNT(*) FROM events')
      console.log('Events count:', countResult.rows[0].count)
      
      if (parseInt(countResult.rows[0].count) > 0) {
        const sampleEvents = await pool.query('SELECT * FROM events LIMIT 3')
        console.log('Sample events:')
        sampleEvents.rows.forEach((event, index) => {
          console.log(`  Event ${index + 1}:`, {
            id: event.id,
            title: event.title,
            event_date: event.event_date,
            status: event.status,
            event_type: event.event_type
          })
        })
      }
    }
    
  } catch (error) {
    console.error('Error checking events table:', error)
  } finally {
    await pool.end()
  }
}

checkEventsTable()
