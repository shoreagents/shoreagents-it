// Test script to verify ticket data structure and name loading
const fetch = require('node-fetch');

async function testTicketData() {
  try {
    console.log('Testing ticket data structure...');
    
    // Test the admin tickets endpoint
    const response = await fetch('http://localhost:3000/api/tickets?admin=true');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tickets = await response.json();
    console.log(`Found ${tickets.length} tickets`);
    
    // Check the first few tickets for name data
    tickets.slice(0, 3).forEach((ticket, index) => {
      console.log(`\nTicket ${index + 1}:`);
      console.log(`  ID: ${ticket.id}`);
      console.log(`  Ticket ID: ${ticket.ticket_id}`);
      console.log(`  User ID: ${ticket.user_id}`);
      console.log(`  First Name: ${ticket.first_name}`);
      console.log(`  Last Name: ${ticket.last_name}`);
      console.log(`  Company Name: ${ticket.company_name}`);
      console.log(`  User Type: ${ticket.user_type}`);
      console.log(`  Profile Picture: ${ticket.profile_picture}`);
      console.log(`  Concern: ${ticket.concern}`);
    });
    
    // Test individual ticket endpoint
    if (tickets.length > 0) {
      const firstTicket = tickets[0];
      console.log(`\nTesting individual ticket endpoint for ticket ${firstTicket.id}...`);
      
      const individualResponse = await fetch(`http://localhost:3000/api/tickets/${firstTicket.id}?admin=true`);
      if (!individualResponse.ok) {
        throw new Error(`HTTP error! status: ${individualResponse.status}`);
      }
      
      const individualTicket = await individualResponse.json();
      console.log('Individual ticket data:');
      console.log(`  First Name: ${individualTicket.first_name}`);
      console.log(`  Last Name: ${individualTicket.last_name}`);
      console.log(`  Company Name: ${individualTicket.company_name}`);
      console.log(`  User Type: ${individualTicket.user_type}`);
    }
    
  } catch (error) {
    console.error('Error testing ticket data:', error);
  }
}

testTicketData();
