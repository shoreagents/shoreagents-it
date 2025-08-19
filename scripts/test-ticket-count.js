const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL || 'postgresql://postgres:uhHHXWXqcHsfigEncYiZCbyoozvkEnOk@shinkansen.proxy.rlwy.net:35256/railway'
});

async function testTicketCount() {
  try {
    console.log('🔍 Testing ticket count...');
    
    // Test 1: Count all tickets
    const allTicketsResult = await pool.query('SELECT COUNT(*) as total FROM public.tickets');
    console.log('📊 Total tickets in database:', allTicketsResult.rows[0].total);
    
    // Test 2: Count tickets by status
    const statusCountResult = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM public.tickets 
      GROUP BY status 
      ORDER BY count DESC
    `);
    console.log('📈 Tickets by status:');
    statusCountResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });
    
    // Test 3: Count tickets with role_id = 1
    const roleCountResult = await pool.query(`
      SELECT COUNT(*) as total 
      FROM public.tickets 
      WHERE role_id = 1
    `);
    console.log('🎯 Tickets with role_id = 1:', roleCountResult.rows[0].total);
    
    // Test 4: Count 'For Approval' tickets with role_id = 1
    const forApprovalResult = await pool.query(`
      SELECT COUNT(*) as total 
      FROM public.tickets 
      WHERE status = 'For Approval' AND role_id = 1
    `);
    console.log('✅ For Approval tickets with role_id = 1:', forApprovalResult.rows[0].total);
    
    // Test 5: Show sample tickets
    const sampleTicketsResult = await pool.query(`
      SELECT id, ticket_id, status, role_id, created_at 
      FROM public.tickets 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('📝 Sample tickets:');
    sampleTicketsResult.rows.forEach(row => {
      console.log(`   ID: ${row.id}, Ticket: ${row.ticket_id}, Status: ${row.status}, Role: ${row.role_id}, Created: ${row.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing ticket count:', error);
  } finally {
    await pool.end();
  }
}

testTicketCount();




