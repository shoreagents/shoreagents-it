const { Pool } = require('pg')
const path = require('path')

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function testConnection() {
  try {
    console.log('Testing database connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
    
    const client = await pool.connect()
    console.log('✅ Database connection successful!')
    
    const result = await client.query('SELECT NOW()')
    console.log('✅ Database query successful:', result.rows[0])
    
    client.release()
    await pool.end()
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('Full error:', error)
    
    if (error.message.includes('password must be a string')) {
      console.log('\n💡 This usually means:')
      console.log('1. DATABASE_URL is not set correctly')
      console.log('2. Password in connection string is empty or malformed')
      console.log('3. Check your .env file for DATABASE_URL')
    }
  }
}

testConnection() 