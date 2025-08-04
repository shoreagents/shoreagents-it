// Comprehensive test script for the comments system
const testCommentsSystem = async () => {
  console.log('🧪 Testing Comments System...\n')

  try {
    // 1. Test Database Connection
    console.log('1. Testing Database Connection...')
    const dbResponse = await fetch('/api/test-db')
    const dbResult = await dbResponse.json()
    console.log('✅ Database:', dbResult.success ? 'Connected' : 'Failed')
    if (!dbResult.success) {
      console.error('❌ Database Error:', dbResult.error)
      return
    }

    // 2. Test Comments Table
    console.log('\n2. Testing Comments Table...')
    const commentsResponse = await fetch('/api/test-comments')
    const commentsResult = await commentsResponse.json()
    console.log('✅ Comments Table:', commentsResult.success ? 'Accessible' : 'Failed')
    console.log(`📊 Total Comments: ${commentsResult.commentCount}`)

    // 3. Test Users Table
    console.log('\n3. Testing Users Table...')
    const usersResponse = await fetch('/api/test-user')
    const usersResult = await usersResponse.json()
    console.log('✅ Users Table:', usersResult.success ? 'Accessible' : 'Failed')
    console.log(`👥 Total Users: ${usersResult.totalUsers}`)
    console.log(`👤 Users with Profile: ${usersResult.usersWithProfile}`)

    // 4. Test Comments API
    console.log('\n4. Testing Comments API...')
    const getCommentsResponse = await fetch('/api/tickets/TKT-000001/comments')
    const getCommentsResult = await getCommentsResponse.json()
    console.log('✅ GET Comments:', getCommentsResponse.ok ? 'Success' : 'Failed')
    console.log(`📝 Comments Found: ${getCommentsResult.comments?.length || 0}`)

    // 5. Test Comment Submission (if authenticated)
    console.log('\n5. Testing Comment Submission...')
    const postResponse = await fetch('/api/tickets/TKT-000001/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        comment: 'Test comment from system test - ' + new Date().toISOString() 
      })
    })
    
    if (postResponse.status === 401) {
      console.log('⚠️  Comment Submission: Requires authentication (expected)')
    } else if (postResponse.ok) {
      console.log('✅ Comment Submission: Success')
    } else {
      console.log('❌ Comment Submission: Failed')
      const postResult = await postResponse.json()
      console.error('Error:', postResult.error)
    }

    console.log('\n🎉 Comments System Test Complete!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run test if in browser
if (typeof window !== 'undefined') {
  testCommentsSystem()
} 