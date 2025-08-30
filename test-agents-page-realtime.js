const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Create a connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function testAgentsPageRealtime() {
  try {
    console.log('🔄 Testing agents page real-time updates...');
    
    // Get a sample agent
    const agentResult = await pool.query(`
      SELECT a.user_id, a.member_id, pi.first_name, pi.last_name, ji.job_title
      FROM public.agents a
      JOIN public.personal_info pi ON a.user_id = pi.user_id
      LEFT JOIN public.job_info ji ON a.user_id = ji.agent_user_id
      LIMIT 1
    `);
    
    if (agentResult.rows.length === 0) {
      console.log('❌ No agents found in database');
      return;
    }
    
    const agent = agentResult.rows[0];
    console.log('📋 Found agent:', agent);
    
    // Get a sample company to assign
    const companyResult = await pool.query(`
      SELECT id, company, badge_color
      FROM public.members
      LIMIT 1
    `);
    
    if (companyResult.rows.length === 0) {
      console.log('❌ No companies found in database');
      return;
    }
    
    const company = companyResult.rows[0];
    console.log('🏢 Found company:', company);
    
    // Update the agent's company assignment to test real-time
    console.log(`🔄 Assigning agent ${agent.user_id} to company ${company.company}...`);
    
    await pool.query(`
      UPDATE public.agents 
      SET member_id = $1, updated_at = NOW()
      WHERE user_id = $2
    `, [company.id, agent.user_id]);
    
    console.log('✅ Agent company assignment updated successfully!');
    console.log('🔄 Check the agents page to see if real-time update is received...');
    console.log('🔄 The company badge should update instantly in the table...');
    
    // Wait a bit then revert the change
    setTimeout(async () => {
      console.log('🔄 Reverting company assignment change...');
      await pool.query(`
        UPDATE public.agents 
        SET member_id = $1, updated_at = NOW()
        WHERE user_id = $2
      `, [agent.member_id, agent.user_id]);
      console.log('✅ Company assignment reverted!');
    }, 10000);
    
  } catch (error) {
    console.error('❌ Error testing agents page real-time:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testAgentsPageRealtime();
