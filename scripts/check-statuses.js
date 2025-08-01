const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function checkStatuses() {
  try {
    console.log('Checking ticket statuses...')
    
    // Check what statuses exist in the database
    const statuses = await pool.query(`
      SELECT DISTINCT status FROM public.tickets ORDER BY status
    `)
    
    console.log('📋 Available statuses in database:')
    statuses.rows.forEach(row => {
      console.log(`  - "${row.status}"`)
    })
    
    // Check ticket counts by status
    const counts = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM public.tickets 
      GROUP BY status 
      ORDER BY status
    `)
    
    console.log('\n📊 Ticket counts by status:')
    counts.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} tickets`)
    })
    
    // Check enum values
    const enumValues = await pool.query(`
      SELECT unnest(enum_range(NULL::ticket_status_enum)) as status_value
    `)
    
    console.log('\n📋 Database enum values:')
    enumValues.rows.forEach(row => {
      console.log(`  - "${row.status_value}"`)
    })
    
  } catch (error) {
    console.error('Error checking statuses:', error)
  } finally {
    await pool.end()
  }
}

checkStatuses() 