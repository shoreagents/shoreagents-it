// Test script to verify comments API fix
const testCommentsFix = async () => {
  console.log('🔧 Testing Comments API Fix...\n')

  try {
    // 1. Test fetching comments
    console.log('1. Testing Comments Fetch...')
    
    // First, get a ticket to test with
    const ticketsResponse = await fetch('/api/tickets')
    const tickets = await ticketsResponse.json()
    
    if (!Array.isArray(tickets) || tickets.length === 0) {
      console.log('❌ No tickets found to test with')
      return
    }
    
    const testTicket = tickets[0]
    console.log(`📝 Testing with ticket: ${testTicket.ticket_id}`)
    
    // Fetch comments for the ticket
    const commentsResponse = await fetch(`/api/tickets/${testTicket.ticket_id}/comments`)
    const commentsResult = await commentsResponse.json()
    
    console.log('✅ Comments Fetch:', commentsResponse.ok ? 'Success' : 'Failed')
    if (commentsResponse.ok) {
      console.log(`📝 Comments Found: ${commentsResult.comments?.length || 0}`)
      if (commentsResult.comments?.length > 0) {
        console.log('📋 Sample Comment:', commentsResult.comments[0])
      }
    } else {
      console.error('❌ Comments Fetch Error:', commentsResult.error)
      console.error('❌ Comments Details:', commentsResult.details)
    }

    // 2. Test submitting a comment (if authenticated)
    console.log('\n2. Testing Comment Submission...')
    
    const testComment = {
      comment: `Test comment at ${new Date().toLocaleString()}`
    }
    
    const submitResponse = await fetch(`/api/tickets/${testTicket.ticket_id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testComment)
    })
    
    const submitResult = await submitResponse.json()
    console.log('✅ Comment Submit:', submitResponse.ok ? 'Success' : 'Failed')
    
    if (submitResponse.ok) {
      console.log('📝 Comment Submitted:', submitResult.comment)
    } else {
      console.error('❌ Comment Submit Error:', submitResult.error)
      console.error('❌ Comment Details:', submitResult.details)
      
      if (submitResponse.status === 401) {
        console.log('ℹ️ This is expected if not authenticated')
      }
    }

    // 3. Test fetching comments again to see if new comment appears
    console.log('\n3. Testing Comments Fetch After Submit...')
    
    const commentsResponse2 = await fetch(`/api/tickets/${testTicket.ticket_id}/comments`)
    const commentsResult2 = await commentsResponse2.json()
    
    console.log('✅ Comments Fetch 2:', commentsResponse2.ok ? 'Success' : 'Failed')
    if (commentsResponse2.ok) {
      console.log(`📝 Comments Found: ${commentsResult2.comments?.length || 0}`)
    } else {
      console.error('❌ Comments Fetch 2 Error:', commentsResult2.error)
    }

    console.log('\n🎉 Comments API Fix Test Complete!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run test if in browser
if (typeof window !== 'undefined') {
  testCommentsFix()
} 