// Test script for ticket comments API
const testCommentsAPI = async () => {
  try {
    // Test GET comments
    console.log('Testing GET /api/tickets/TKT-000001/comments...')
    const getResponse = await fetch('/api/tickets/TKT-000001/comments')
    const getData = await getResponse.json()
    console.log('GET Response:', getData)
    
    // Test POST comment
    console.log('\nTesting POST /api/tickets/TKT-000001/comments...')
    const postResponse = await fetch('/api/tickets/TKT-000001/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        comment: 'Test comment from API - ' + new Date().toISOString() 
      })
    })
    const postData = await postResponse.json()
    console.log('POST Response:', postData)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run test if in browser
if (typeof window !== 'undefined') {
  testCommentsAPI()
} 