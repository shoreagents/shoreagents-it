import { Pool } from 'pg'

// Primary database (default)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// Optional secondary database for Recruitment (Applicants/Talent Pool)
let bpocPool: Pool | null = null
if (process.env.BPOC_DATABASE_URL) {
  bpocPool = new Pool({
    connectionString: process.env.BPOC_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })
}

export default pool
export { bpocPool }

// Test database connections
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()')
    console.log('Primary DB connected:', result.rows[0])
    return true
  } catch (error) {
    console.error('Primary DB connection failed:', error)
    return false
  }
}

export async function testBpocConnection() {
  if (!bpocPool) return false
  try {
    const result = await bpocPool.query('SELECT NOW()')
    console.log('BPOC DB connected:', result.rows[0])
    return true
  } catch (error) {
    console.error('BPOC DB connection failed:', error)
    return false
  }
}