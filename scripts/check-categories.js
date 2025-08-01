const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function checkCategories() {
  try {
    console.log('Checking ticket categories...')
    
    // Check if ticket_categories table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ticket_categories'
      )
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ ticket_categories table does not exist')
      return
    }
    
    console.log('✅ ticket_categories table exists')
    
    // Get all categories
    const categories = await pool.query(`
      SELECT id, name FROM public.ticket_categories ORDER BY id
    `)
    
    console.log('📋 Available categories:')
    categories.rows.forEach(cat => {
      console.log(`  ${cat.id}: ${cat.name}`)
    })
    
    // Check tickets with category_id
    const tickets = await pool.query(`
      SELECT t.id, t.ticket_id, t.category, t.category_id, 
             tc.name as category_name
      FROM public.tickets t
      LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
      ORDER BY t.id DESC
      LIMIT 5
    `)
    
    console.log('\n📋 Sample tickets:')
    tickets.rows.forEach(ticket => {
      console.log(`  Ticket ${ticket.ticket_id}: category="${ticket.category}", category_id=${ticket.category_id}, category_name="${ticket.category_name}"`)
    })
    
  } catch (error) {
    console.error('Error checking categories:', error)
  } finally {
    await pool.end()
  }
}

checkCategories() 