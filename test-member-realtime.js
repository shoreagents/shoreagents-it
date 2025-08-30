const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function testMemberRealtime() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Testing member realtime functionality...')
    
    // First, let's check if the trigger function exists
    const triggerCheck = await client.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_table = 'members'
    `)
    
    console.log('📋 Triggers on members table:')
    triggerCheck.rows.forEach(row => {
      console.log(`  - ${row.trigger_name}: ${row.event_manipulation} on ${row.event_object_table}`)
    })
    
    // Check if the notify_member_changes function exists
    const functionCheck = await client.query(`
      SELECT 
        routine_name,
        routine_type,
        data_type
      FROM information_schema.routines 
      WHERE routine_name = 'notify_member_changes'
    `)
    
    console.log('📋 notify_member_changes function:')
    functionCheck.rows.forEach(row => {
      console.log(`  - ${row.routine_name}: ${row.routine_type} returns ${row.data_type}`)
    })
    
    // Check the current members table structure
    const tableCheck = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'members' 
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Members table structure:')
    tableCheck.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    })
    
    // Check if there are any existing members to test with
    const memberCheck = await client.query(`
      SELECT id, company, service, status 
      FROM members 
      LIMIT 3
    `)
    
    console.log('📋 Sample members:')
    memberCheck.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Company: ${row.company}, Service: ${row.service}, Status: ${row.status}`)
    })
    
    // Test the trigger by updating a member's service
    if (memberCheck.rows.length > 0) {
      const testMember = memberCheck.rows[0]
      console.log(`\n🧪 Testing service update for member ID ${testMember.id}...`)
      
      // Get current service
      const currentService = testMember.service
      const newService = currentService === 'One Agent' ? 'Team' : 'One Agent'
      
      console.log(`  Current service: ${currentService}`)
      console.log(`  New service: ${newService}`)
      
      // Update the service
      const updateResult = await client.query(`
        UPDATE members 
        SET service = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING id, company, service, updated_at
      `, [newService, testMember.id])
      
      if (updateResult.rows.length > 0) {
        console.log('✅ Service updated successfully:')
        console.log(`  - ID: ${updateResult.rows[0].id}`)
        console.log(`  - Company: ${updateResult.rows[0].company}`)
        console.log(`  - New Service: ${updateResult.rows[0].service}`)
        console.log(`  - Updated At: ${updateResult.rows[0].updated_at}`)
        
        // Revert the change
        await client.query(`
          UPDATE members 
          SET service = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
        `, [currentService, testMember.id])
        
        console.log('🔄 Service reverted to original value')
      } else {
        console.log('❌ Failed to update service')
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing member realtime:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the test
testMemberRealtime().catch(console.error)
