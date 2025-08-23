// Test script for members_activity_log table
// Run this with: node scripts/test-members-activity-log.js

// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');

// Create a pool using the same configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function testMembersActivityLog() {
  try {
    console.log('🔍 Testing members_activity_log table...');
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'members_activity_log'
      )
    `);
    
    if (tableCheck.rows[0]?.exists) {
      console.log('✅ members_activity_log table exists');
      
      // Test basic query
      const testQuery = await pool.query(`
        SELECT COUNT(*) as total
        FROM public.members_activity_log
        LIMIT 1
      `);
      
      console.log('✅ Query successful, total records:', testQuery.rows[0]?.total);
      
      // Test with a specific member ID
      const memberQuery = await pool.query(`
        SELECT COUNT(*) as total
        FROM public.members_activity_log
        WHERE members_id = 151
      `);
      
      console.log('✅ Member-specific query successful, records for member 151:', memberQuery.rows[0]?.total);
      
    } else {
      console.log('❌ members_activity_log table does not exist');
      console.log('💡 Run the create-members-activity-log.sql script to create it');
      
      // Try to create the table
      console.log('🔄 Attempting to create the table...');
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS public.members_activity_log (
            id SERIAL PRIMARY KEY,
            members_id INTEGER NOT NULL,
            field_name VARCHAR(255),
            action VARCHAR(100) NOT NULL,
            old_value TEXT,
            new_value TEXT,
            user_id INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Table created successfully');
      } catch (createError) {
        console.error('❌ Failed to create table:', createError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing members_activity_log:', error);
  } finally {
    await pool.end();
  }
}

testMembersActivityLog();
