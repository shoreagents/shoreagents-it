// Debug script for comments system
const debugComments = async () => {
  console.log('🔍 Debugging Comments System...\n')

  try {
    // 1. Check Environment Variables
    console.log('1. Checking Environment Variables...')
    const envResponse = await fetch('/api/test-env')
    const envResult = await envResponse.json()
    console.log('✅ Environment Check:', envResult.success ? 'Passed' : 'Failed')
    console.log('📋 Environment Variables:', envResult.environment)

    // 2. Test Database Connection
    console.log('\n2. Testing Database Connection...')
    const dbResponse = await fetch('/api/test-db')
    const dbResult = await dbResponse.json()
    console.log('✅ Database:', dbResult.success ? 'Connected' : 'Failed')
    if (!dbResult.success) {
      console.error('❌ Database Error:', dbResult.error)
      console.error('❌ Database Details:', dbResult.details)
      return
    }

    // 3. Test Comments Table
    console.log('\n3. Testing Comments Table...')
    const commentsResponse = await fetch('/api/test-comments')
    const commentsResult = await commentsResponse.json()
    console.log('✅ Comments Table:', commentsResult.success ? 'Accessible' : 'Failed')
    if (!commentsResult.success) {
      console.error('❌ Comments Table Error:', commentsResult.error)
      console.error('❌ Comments Table Details:', commentsResult.details)
    }

    // 4. Test Users Table
    console.log('\n4. Testing Users Table...')
    const usersResponse = await fetch('/api/test-user')
    const usersResult = await usersResponse.json()
    console.log('✅ Users Table:', usersResult.success ? 'Accessible' : 'Failed')
    if (!usersResult.success) {
      console.error('❌ Users Table Error:', usersResult.error)
      console.error('❌ Users Table Details:', usersResult.details)
    }

    // 5. Test Comments API
    console.log('\n5. Testing Comments API...')
    const getCommentsResponse = await fetch('/api/tickets/TKT-000001/comments')
    const getCommentsResult = await getCommentsResponse.json()
    console.log('✅ GET Comments:', getCommentsResponse.ok ? 'Success' : 'Failed')
    console.log(`📝 Comments Found: ${getCommentsResult.comments?.length || 0}`)
    if (!getCommentsResponse.ok) {
      console.error('❌ GET Comments Error:', getCommentsResult.error)
    }

    // 6. Test Comment Submission
    console.log('\n6. Testing Comment Submission...')
    const postResponse = await fetch('/api/tickets/TKT-000001/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        comment: 'Debug test comment - ' + new Date().toISOString() 
      })
    })
    
    const postResult = await postResponse.json()
    console.log('✅ POST Comments Status:', postResponse.status)
    console.log('✅ POST Comments Response:', postResult)
    
    if (postResponse.status === 401) {
      console.log('⚠️  Comment Submission: Requires authentication (expected)')
    } else if (postResponse.ok) {
      console.log('✅ Comment Submission: Success')
    } else {
      console.log('❌ Comment Submission: Failed')
      console.error('❌ POST Error:', postResult.error)
      console.error('❌ POST Details:', postResult.details)
    }

    console.log('\n🎯 Debug Complete!')
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Run debug if in browser
if (typeof window !== 'undefined') {
  debugComments()
} 