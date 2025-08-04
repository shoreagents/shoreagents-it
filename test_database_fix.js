// Test script to verify database connection is working
const testDatabaseFix = async () => {
  console.log('🔧 Testing Database Connection After Fix...\n')

  try {
    // 1. Test simple database connection
    console.log('1. Testing Simple Database Connection...')
    const simpleResponse = await fetch('/api/test-simple')
    const simpleResult = await simpleResponse.json()
    console.log('✅ Simple DB Test:', simpleResult.success ? 'Passed' : 'Failed')
    if (!simpleResult.success) {
      console.error('❌ Simple DB Error:', simpleResult.error)
      console.error('❌ Simple DB Details:', simpleResult.details)
      return
    }

    // 2. Test environment variables
    console.log('\n2. Testing Environment Variables...')
    const envResponse = await fetch('/api/test-env')
    const envResult = await envResponse.json()
    console.log('✅ Environment Check:', envResult.success ? 'Passed' : 'Failed')
    console.log('📋 Environment Variables:', envResult.environment)

    // 3. Test database connection
    console.log('\n3. Testing Database Connection...')
    const dbResponse = await fetch('/api/test-db')
    const dbResult = await dbResponse.json()
    console.log('✅ Database:', dbResult.success ? 'Connected' : 'Failed')
    if (!dbResult.success) {
      console.error('❌ Database Error:', dbResult.error)
      console.error('❌ Database Details:', dbResult.details)
      return
    }

    // 4. Test tickets API (this was failing before)
    console.log('\n4. Testing Tickets API...')
    const ticketsResponse = await fetch('/api/tickets')
    const ticketsResult = await ticketsResponse.json()
    console.log('✅ Tickets API:', ticketsResponse.ok ? 'Success' : 'Failed')
    if (!ticketsResponse.ok) {
      console.error('❌ Tickets API Error:', ticketsResult.error)
    } else {
      console.log(`📝 Tickets Found: ${Array.isArray(ticketsResult) ? ticketsResult.length : 'N/A'}`)
    }

    // 5. Test comments API
    console.log('\n5. Testing Comments API...')
    const commentsResponse = await fetch('/api/tickets/TKT-000001/comments')
    const commentsResult = await commentsResponse.json()
    console.log('✅ Comments API:', commentsResponse.ok ? 'Success' : 'Failed')
    if (!commentsResponse.ok) {
      console.error('❌ Comments API Error:', commentsResult.error)
    } else {
      console.log(`📝 Comments Found: ${commentsResult.comments?.length || 0}`)
    }

    console.log('\n🎉 Database Fix Test Complete!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run test if in browser
if (typeof window !== 'undefined') {
  testDatabaseFix()
} 