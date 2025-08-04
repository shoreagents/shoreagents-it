// Simple test for comments API
console.log('🔧 Testing Comments API...')

// Test 1: Simple fetch
fetch('/api/tickets')
.then(r => r.json())
.then(tickets => {
  if (tickets.length > 0) {
    const ticket = tickets[0];
    console.log('📝 Testing with ticket:', ticket.ticket_id);
    
    // Test 2: Fetch comments
    return fetch(`/api/tickets/${ticket.ticket_id}/comments`);
  }
})
.then(r => {
  if (r) {
    console.log('✅ Comments fetch status:', r.status);
    return r.json();
  }
})
.then(result => {
  if (result) {
    console.log('📋 Comments result:', result);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
}); 