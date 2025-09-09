// Simple test to check if events API is working
async function testEventsAPI() {
  try {
    console.log('Testing events API...')
    const response = await fetch('http://localhost:3000/api/events')
    console.log('Response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('Events data:', data)
    } else {
      const error = await response.text()
      console.log('Error response:', error)
    }
  } catch (error) {
    console.error('Error testing API:', error)
  }
}

testEventsAPI()
