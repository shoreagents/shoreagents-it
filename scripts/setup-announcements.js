const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setupAnnouncements() {
  try {
    console.log('Setting up announcements table...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '..', 'announcements_complete_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('✅ Announcements table created successfully!');
    
    // Verify the table was created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'announcements'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Table verification successful');
      
      // Check if sample data was inserted
      const countResult = await pool.query('SELECT COUNT(*) FROM announcements');
      console.log(`✅ Sample announcements inserted: ${countResult.rows[0].count}`);
    } else {
      console.log('❌ Table verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error setting up announcements:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  setupAnnouncements()
    .then(() => {
      console.log('🎉 Announcements setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupAnnouncements };
