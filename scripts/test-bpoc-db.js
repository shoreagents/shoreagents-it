require('dotenv').config({ path: '.env.local' })

async function testBpocConnection() {
  console.log('Testing BPOC database connection...')
  
  if (!process.env.BPOC_DATABASE_URL) {
    console.log('❌ BPOC_DATABASE_URL: Not set')
    console.log('Please add BPOC_DATABASE_URL to your .env.local file')
    return false
  }
  
  console.log('✅ BPOC_DATABASE_URL: Set')
  
  try {
    const { Pool } = require('pg')
    const pool = new Pool({
      connectionString: process.env.BPOC_DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
    
    const result = await pool.query('SELECT NOW()')
    console.log('✅ BPOC Database connection successful!')
    console.log('✅ BPOC Database query successful:', result.rows[0])
    
    // Test applications table
    const applicationsResult = await pool.query('SELECT COUNT(*) as count FROM public.applications')
    console.log('✅ Applications table accessible:', applicationsResult.rows[0])
    
    // Test users table
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM public.users')
    console.log('✅ Users table accessible:', usersResult.rows[0])
    
    // Test processed_job_requests table
    const jobsResult = await pool.query('SELECT COUNT(*) as count FROM public.processed_job_requests')
    console.log('✅ Processed job requests table accessible:', jobsResult.rows[0])
    
    // Test members table
    const membersResult = await pool.query('SELECT COUNT(*) as count FROM public.members')
    console.log('✅ Members table accessible:', membersResult.rows[0])
    
    await pool.end()
    return true
  } catch (error) {
    console.error('❌ BPOC Database connection failed:', error.message)
    return false
  }
}

testBpocConnection().then(success => {
  if (success) {
    console.log('\n🎉 BPOC Database is ready for applicants!')
  } else {
    console.log('\n💥 BPOC Database connection failed. Please check your configuration.')
    process.exit(1)
  }
})
