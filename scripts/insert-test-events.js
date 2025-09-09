const { Pool } = require('pg')

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function insertTestEvents() {
  try {
    console.log('Connecting to database...')
    
    // Check if events table exists and has data
    const checkResult = await pool.query('SELECT COUNT(*) FROM events')
    console.log('Current events count:', checkResult.rows[0].count)
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      console.log('Events table already has data')
      return
    }
    
    // Insert test events
    const testEvents = [
      {
        title: 'Team Building Workshop',
        description: 'Join us for an exciting team building workshop focused on collaboration and communication skills.',
        event_date: '2024-03-15',
        start_time: '14:00:00',
        end_time: '16:00:00',
        location: 'Conference Room A',
        event_type: 'event',
        status: 'upcoming',
        created_by: 1
      },
      {
        title: 'Company All-Hands Meeting',
        description: 'Monthly all-hands meeting to discuss company updates, achievements, and upcoming projects.',
        event_date: '2024-03-20',
        start_time: '10:00:00',
        end_time: '11:00:00',
        location: 'Main Auditorium',
        event_type: 'event',
        status: 'upcoming',
        created_by: 1
      },
      {
        title: 'Holiday Party',
        description: 'Annual company holiday party with food, drinks, and entertainment for all employees.',
        event_date: '2024-03-25',
        start_time: '18:00:00',
        end_time: '22:00:00',
        location: 'Grand Ballroom',
        event_type: 'event',
        status: 'upcoming',
        created_by: 1
      },
      {
        title: 'Technical Training Session',
        description: 'Advanced technical training for developers on new frameworks and best practices.',
        event_date: '2024-03-28',
        start_time: '09:00:00',
        end_time: '17:00:00',
        location: 'Training Room B',
        event_type: 'activity',
        status: 'upcoming',
        created_by: 1
      },
      {
        title: 'Quarterly Review Meeting',
        description: 'Quarterly business review meeting to discuss Q1 performance and Q2 planning.',
        event_date: '2024-03-30',
        start_time: '14:00:00',
        end_time: '16:00:00',
        location: 'Board Room',
        event_type: 'event',
        status: 'upcoming',
        created_by: 1
      }
    ]
    
    console.log('Inserting test events...')
    for (const event of testEvents) {
      const query = `
        INSERT INTO events (title, description, event_date, start_time, end_time, location, event_type, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `
      const result = await pool.query(query, [
        event.title,
        event.description,
        event.event_date,
        event.start_time,
        event.end_time,
        event.location,
        event.event_type,
        event.status,
        event.created_by
      ])
      console.log(`Inserted event: ${event.title} (ID: ${result.rows[0].id})`)
    }
    
    console.log('Test events inserted successfully!')
    
  } catch (error) {
    console.error('Error inserting test events:', error)
  } finally {
    await pool.end()
  }
}

insertTestEvents()
