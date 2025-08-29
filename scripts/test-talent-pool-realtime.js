const { Client } = require('pg')

// Test real-time functionality for talent pool page
// This tests updates to bpoc_recruits table which the talent pool page displays

async function testTalentPoolRealtime() {
  console.log('🧪 Testing Talent Pool Real-time Functionality...')
  
  // Connect to main database (bpoc_recruits table)
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/shoreagents'
  })

  try {
    await client.connect()
    console.log('✅ Connected to main database')

    // Check if we have any applicants with 'passed' status
    const checkResult = await client.query(`
      SELECT id, applicant_id, status, created_at 
      FROM public.bpoc_recruits 
      WHERE status = 'passed' 
      LIMIT 1
    `)

    if (checkResult.rows.length === 0) {
      console.log('⚠️ No applicants with "passed" status found. Creating a test record...')
      
      // Create a test applicant with 'passed' status
      const insertResult = await client.query(`
        INSERT INTO public.bpoc_recruits (
          applicant_id, 
          resume_slug, 
          status, 
          created_at, 
          updated_at
        ) VALUES (
          gen_random_uuid(), 
          'test-resume.pdf', 
          'passed', 
          NOW(), 
          NOW()
        ) RETURNING id, applicant_id, status
      `)
      
      console.log('✅ Created test applicant:', insertResult.rows[0])
    } else {
      console.log('✅ Found existing applicant with "passed" status:', checkResult.rows[0])
    }

    // Get a test applicant ID
    const testResult = await client.query(`
      SELECT id, applicant_id, status 
      FROM public.bpoc_recruits 
      WHERE status = 'passed' 
      LIMIT 1
    `)
    
    const testApplicant = testResult.rows[0]
    console.log('🎯 Testing with applicant:', testApplicant)

    // Test 1: Update status (should trigger real-time update)
    console.log('\n🔄 Test 1: Updating applicant status...')
    const updateResult = await client.query(`
      UPDATE public.bpoc_recruits 
      SET status = 'qualified', updated_at = NOW()
      WHERE id = $1
      RETURNING id, applicant_id, status, updated_at
    `, [testApplicant.id])
    
    console.log('✅ Status updated to "qualified":', updateResult.rows[0])

    // Wait a moment for the notification to be processed
    console.log('⏳ Waiting 2 seconds for real-time notification...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test 2: Change status back to 'passed' (should trigger real-time update)
    console.log('\n🔄 Test 2: Changing status back to "passed"...')
    const updateBackResult = await client.query(`
      UPDATE public.bpoc_recruits 
      SET status = 'passed', updated_at = NOW()
      WHERE id = $1
      RETURNING id, applicant_id, status, updated_at
    `, [testApplicant.id])
    
    console.log('✅ Status changed back to "passed":', updateBackResult.rows[0])

    // Wait a moment for the notification to be processed
    console.log('⏳ Waiting 2 seconds for real-time notification...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test 3: Update other fields (should trigger real-time update)
    console.log('\n🔄 Test 3: Updating other fields...')
    const updateFieldsResult = await client.query(`
      UPDATE public.bpoc_recruits 
      SET 
        resume_slug = 'updated-resume.pdf',
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, applicant_id, status, resume_slug, updated_at
    `, [testApplicant.id])
    
    console.log('✅ Fields updated:', updateFieldsResult.rows[0])

    // Wait a moment for the notification to be processed
    console.log('⏳ Waiting 2 seconds for real-time notification...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('\n✅ All tests completed!')
    console.log('📱 Check the talent pool page to see if real-time updates are working')
    console.log('🔍 Look for console logs showing real-time updates')

  } catch (error) {
    console.error('❌ Error testing talent pool real-time:', error)
  } finally {
    await client.end()
    console.log('🔌 Disconnected from database')
  }
}

// Run the test
testTalentPoolRealtime()
