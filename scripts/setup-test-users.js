const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function setupTestUsers() {
  try {
    console.log('Setting up test users...')

    // First, ensure we have the IT role
    const roleQuery = `
      INSERT INTO roles (name, description) 
      VALUES ('IT', 'IT Support Team') 
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `
    const roleResult = await pool.query(roleQuery)
    const itRoleId = roleResult.rows[0]?.id || (await pool.query('SELECT id FROM roles WHERE name = $1', ['IT'])).rows[0]?.id

    console.log('IT Role ID:', itRoleId)

    // Add test users
    const users = [
      {
        email: 'arra.m@shoreagents.com',
        userType: 'Internal',
        firstName: 'Arra Lois',
        lastName: 'Magracia',
        roleId: itRoleId
      },
      {
        email: 'admin@shoreagents.com',
        userType: 'Internal',
        firstName: 'Admin',
        lastName: 'User',
        roleId: 1 // Assuming role ID 1 is Admin
      }
    ]

    for (const user of users) {
      console.log(`Adding user: ${user.email}`)
      
      // Insert user
      const userResult = await pool.query(
        'INSERT INTO users (email, user_type) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET user_type = $2 RETURNING id',
        [user.email, user.userType]
      )
      
      const userId = userResult.rows[0].id
      console.log(`User ID: ${userId}`)

      // Insert personal info
      await pool.query(
        `INSERT INTO personal_info (user_id, first_name, last_name) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (user_id) DO UPDATE SET 
           first_name = $2, 
           last_name = $3`,
        [userId, user.firstName, user.lastName]
      )

      // Insert into internal table
      await pool.query(
        'INSERT INTO internal (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
        [userId]
      )

      // Assign role
      await pool.query(
        `INSERT INTO internal_roles (internal_user_id, role_id) 
         VALUES ($1, $2) 
         ON CONFLICT (internal_user_id, role_id) DO NOTHING`,
        [userId, user.roleId]
      )

      console.log(`✅ Added user: ${user.email}`)
    }

    console.log('\n🎉 Test users setup complete!')
    console.log('\nTest accounts:')
    console.log('- arra.m@shoreagents.com (IT Role)')
    console.log('- admin@shoreagents.com (Admin Role)')

  } catch (error) {
    console.error('Setup failed:', error)
  } finally {
    await pool.end()
  }
}

setupTestUsers() 