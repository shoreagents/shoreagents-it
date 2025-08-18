const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL || 'postgresql://postgres:uhHHXWXqcHsfigEncYiZCbyoozvkEnOk@shinkansen.proxy.rlwy.net:35256/railway'
});

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    // List all tables in public schema
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in public schema:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check if there are any tables at all
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found in public schema!');
    }
    
    // Check if we're connected to the right database
    const dbResult = await pool.query('SELECT current_database() as db_name');
    console.log('🗄️  Connected to database:', dbResult.rows[0].db_name);
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkTables();




