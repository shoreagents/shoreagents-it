require('dotenv').config({ path: '.env.local' })

async function testApplicantUpdate() {
  console.log('🧪 Testing applicant status update...')
  
  if (!process.env.BPOC_DATABASE_URL) {
    console.log('❌ BPOC_DATABASE_URL: Not set')
    return false
  }
  
  try {
    const { Pool } = require('pg')
    const pool = new Pool({
      connectionString: process.env.BPOC_DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
    
    // First, let's see what applications exist
    console.log('📊 Checking existing applications...')
    const applicationsResult = await pool.query('SELECT id, status, user_id, job_id FROM public.applications LIMIT 5')
    console.log('📊 Applications found:', applicationsResult.rows)
    
    if (applicationsResult.rows.length === 0) {
      console.log('❌ No applications found in database')
      await pool.end()
      return false
    }
    
    // Get the first application
    const testApplication = applicationsResult.rows[0]
    const currentStatus = testApplication.status
    const newStatus = currentStatus === 'submitted' ? 'screened' : 'submitted'
    
    console.log('🧪 Testing update for application:', {
      id: testApplication.id,
      currentStatus,
      newStatus
    })
    
    // Test the update
    const updateQuery = `
      UPDATE public.applications 
      SET status = $1::application_status_enum
      WHERE id = $2
      RETURNING id, status
    `
    
    console.log('📝 Executing update query...')
    const updateResult = await pool.query(updateQuery, [newStatus, testApplication.id])
    console.log('📝 Update result:', updateResult.rows)
    
    if (updateResult.rows.length > 0) {
      console.log('✅ Update successful!')
      
      // Verify the update
      const verifyResult = await pool.query('SELECT id, status FROM public.applications WHERE id = $1', [testApplication.id])
      console.log('🔍 Verification result:', verifyResult.rows[0])
      
      // Revert back to original status
      console.log('🔄 Reverting to original status...')
      const revertResult = await pool.query(updateQuery, [currentStatus, testApplication.id])
      console.log('🔄 Revert result:', revertResult.rows)
      
    } else {
      console.log('❌ Update failed')
    }
    
    await pool.end()
    return true
  } catch (error) {
    console.error('❌ Error testing applicant update:', error)
    return false
  }
}

testApplicantUpdate().then(success => {
  if (success) {
    console.log('\n🎉 Applicant update test completed!')
  } else {
    console.log('\n💥 Applicant update test failed.')
    process.exit(1)
  }
})
