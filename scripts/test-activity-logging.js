const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'shoreagents', // Update this to your actual database name
  user: 'postgres', // Update this to your actual username
  password: 'your_password', // Update this to your actual password
});

async function testActivityLogging() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if the table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'members_activity_log'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ members_activity_log table exists');
      
      // Check table structure
      const tableStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'members_activity_log'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Table structure:');
      tableStructure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
      });
      
      // Check constraints
      const constraints = await client.query(`
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'public.members_activity_log'::regclass;
      `);
      
      console.log('🔒 Table constraints:');
      constraints.rows.forEach(row => {
        console.log(`  ${row.conname}: ${row.definition}`);
      });
      
      // Test inserting a record
      console.log('🧪 Testing insert...');
      const testInsert = await client.query(`
        INSERT INTO public.members_activity_log 
        (member_id, field_name, action, old_value, new_value, user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, member_id, field_name, action, old_value, new_value, user_id, created_at
      `, [1, 'Test Field', 'set', null, 'Test Value', 1]);
      
      console.log('✅ Test insert successful:', testInsert.rows[0]);
      
      // Clean up test data
      await client.query(`
        DELETE FROM public.members_activity_log 
        WHERE id = $1
      `, [testInsert.rows[0].id]);
      
      console.log('🧹 Test data cleaned up');
      
    } else {
      console.log('❌ members_activity_log table does not exist');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testActivityLogging();
