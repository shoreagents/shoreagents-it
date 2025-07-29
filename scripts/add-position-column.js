const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function addPositionColumn() {
  try {
    console.log('Adding position column to tickets table...')
    
    // Add position column if it doesn't exist
    await pool.query(`
      ALTER TABLE public.tickets 
      ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0
    `)
    
    // Create index for position
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_status_position 
      ON public.tickets(status, position)
    `)
    
    // Update existing tickets with position based on created_at
    await pool.query(`
      UPDATE public.tickets 
      SET position = subquery.row_num
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at ASC) - 1 as row_num
        FROM public.tickets
      ) as subquery
      WHERE public.tickets.id = subquery.id
    `)
    
    console.log('✅ Position column added successfully!')
    console.log('✅ Existing tickets updated with positions!')
    
  } catch (error) {
    console.error('❌ Error adding position column:', error)
  } finally {
    await pool.end()
  }
}

addPositionColumn()