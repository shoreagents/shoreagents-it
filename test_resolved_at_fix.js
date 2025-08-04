// Test script to verify resolved_at timestamp fix
const testResolvedAtFix = async () => {
  console.log('🔧 Testing Resolved At Timestamp Fix...\n')

  try {
    // 1. Test updating a ticket status to 'Completed'
    console.log('1. Testing Ticket Status Update to Completed...')
    
    // First, get a ticket to test with
    const ticketsResponse = await fetch('/api/tickets')
    const tickets = await ticketsResponse.json()
    
    if (!Array.isArray(tickets) || tickets.length === 0) {
      console.log('❌ No tickets found to test with')
      return
    }
    
    const testTicket = tickets[0]
    console.log(`📝 Testing with ticket: ${testTicket.ticket_id}`)
    
    // Update the ticket status to 'Completed'
    const updateResponse = await fetch(`/api/tickets/${testTicket.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'Completed',
        resolvedBy: 1 // Assuming user ID 1 exists
      })
    })
    
    const updatedTicket = await updateResponse.json()
    console.log('✅ Status Update:', updateResponse.ok ? 'Success' : 'Failed')
    
    if (updateResponse.ok) {
      console.log(`📅 Resolved At: ${updatedTicket.resolved_at}`)
      console.log(`👤 Resolved By: ${updatedTicket.resolved_by}`)
      console.log(`📊 Status: ${updatedTicket.status}`)
      
      // Check if resolved_at is properly set
      if (updatedTicket.resolved_at) {
        console.log('✅ Resolved At timestamp is set correctly')
      } else {
        console.log('❌ Resolved At timestamp is not set')
      }
    } else {
      console.error('❌ Update Error:', updatedTicket.error)
    }

    // 2. Test updating to 'Closed'
    console.log('\n2. Testing Ticket Status Update to Closed...')
    
    const closeResponse = await fetch(`/api/tickets/${testTicket.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'Closed'
      })
    })
    
    const closedTicket = await closeResponse.json()
    console.log('✅ Close Update:', closeResponse.ok ? 'Success' : 'Failed')
    
    if (closeResponse.ok) {
      console.log(`📅 Resolved At: ${closedTicket.resolved_at}`)
      console.log(`📊 Status: ${closedTicket.status}`)
    } else {
      console.error('❌ Close Error:', closedTicket.error)
    }

    // 3. Test updating to 'In Progress' (should clear resolved_at)
    console.log('\n3. Testing Ticket Status Update to In Progress...')
    
    const progressResponse = await fetch(`/api/tickets/${testTicket.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'In Progress'
      })
    })
    
    const progressTicket = await progressResponse.json()
    console.log('✅ Progress Update:', progressResponse.ok ? 'Success' : 'Failed')
    
    if (progressResponse.ok) {
      console.log(`📅 Resolved At: ${progressTicket.resolved_at}`)
      console.log(`📊 Status: ${progressTicket.status}`)
      
      // Check if resolved_at is cleared
      if (!progressTicket.resolved_at) {
        console.log('✅ Resolved At timestamp is cleared correctly')
      } else {
        console.log('❌ Resolved At timestamp is not cleared')
      }
    } else {
      console.error('❌ Progress Error:', progressTicket.error)
    }

    console.log('\n🎉 Resolved At Fix Test Complete!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run test if in browser
if (typeof window !== 'undefined') {
  testResolvedAtFix()
} 