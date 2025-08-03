const { createClient } = require('@supabase/supabase-js')
const { Pool } = require('pg')

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function setupITRole() {
  try {
    console.log('Setting up IT role and updating tickets...')

    // First, create the IT role if it doesn't exist
    const roleResult = await pool.query(`
      INSERT INTO public.roles (name, description) 
      VALUES ('IT', 'Information Technology Support') 
      ON CONFLICT (name) DO NOTHING 
      RETURNING id
    `)
    
    console.log('✅ IT role created/verified')

    // Get the IT role ID
    const itRoleResult = await pool.query(`
      SELECT id FROM public.roles WHERE name = 'IT'
    `)
    
    const itRoleId = itRoleResult.rows[0]?.id
    
    if (!itRoleId) {
      console.error('❌ IT role not found')
      return
    }

    console.log(`📋 IT Role ID: ${itRoleId}`)

    // Update all existing tickets to have role_id = 1 (IT)
    const updateResult = await pool.query(`
      UPDATE public.tickets 
      SET role_id = $1 
      WHERE role_id IS NULL
    `, [itRoleId])
    
    console.log(`✅ Updated ${updateResult.rowCount} tickets with IT role`)

    // Verify the update
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as total_tickets, 
             COUNT(CASE WHEN role_id = $1 THEN 1 END) as it_tickets
      FROM public.tickets
    `, [itRoleId])
    
    const { total_tickets, it_tickets } = verifyResult.rows[0]
    console.log(`📊 Total tickets: ${total_tickets}`)
    console.log(`📊 IT tickets: ${it_tickets}`)

    console.log('\n🎉 IT tickets setup complete!')
    console.log('\nAll tickets now have role_id = 1 (IT)')

  } catch (error) {
    console.error('Setup failed:', error)
  } finally {
    await pool.end()
  }
}

setupITRole() 