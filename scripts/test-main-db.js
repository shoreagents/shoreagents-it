require('dotenv').config({ path: '.env.local' })

async function testMainConnection() {
  console.log('Testing main database connection...')
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL: Not set')
    console.log('Please add DATABASE_URL to your .env.local file')
    return false
  }
  
  console.log('✅ DATABASE_URL: Set')
  
  try {
    const { Pool } = require('pg')
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
    
    const result = await pool.query('SELECT NOW()')
    console.log('✅ Main Database connection successful!')
    console.log('✅ Main Database query successful:', result.rows[0])
    
    // Test if members table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'members'
      )
    `)
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Members table exists')
      
      // Test members table structure
      const structureResult = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'members' 
        ORDER BY ordinal_position
      `)
      
      console.log('✅ Members table structure:')
      structureResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
      })
      
      // Test members table count
      const countResult = await pool.query('SELECT COUNT(*) as count FROM public.members')
      console.log('✅ Members table count:', countResult.rows[0].count)
      
    } else {
      console.log('❌ Members table does not exist')
      
      // Show available tables
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `)
      
      console.log('Available tables:')
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`)
      })
    }
    
    await pool.end()
    return true
  } catch (error) {
    console.error('❌ Main Database connection failed:', error.message)
    console.error('Error details:', error)
    return false
  }
}

testMainConnection().then(success => {
  if (success) {
    console.log('\n🎉 Main Database connection successful!')
  } else {
    console.log('\n💥 Main Database connection failed. Please check your configuration.')
    process.exit(1)
  }
})
