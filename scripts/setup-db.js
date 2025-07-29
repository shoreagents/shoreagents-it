const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  try {
    console.log('Connecting to Railway PostgreSQL database...')
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../src/lib/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('Executing database schema...')
    await pool.query(schema)
    
    console.log('✅ Database setup completed successfully!')
    console.log('📊 Sample tickets have been inserted.')
    console.log('🔗 Your Railway PostgreSQL database is ready to use.')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
}

module.exports = { setupDatabase }