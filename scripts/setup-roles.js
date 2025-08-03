const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function setupRoles() {
  try {
    console.log('Setting up roles in Railway database...')

    // Define the roles we need
    const roles = [
      { name: 'Admin', description: 'System Administrator' },
      { name: 'IT', description: 'IT Support Team' },
      { name: 'Agent', description: 'Support Agent' },
      { name: 'Manager', description: 'Team Manager' }
    ]

    for (const role of roles) {
      console.log(`Adding role: ${role.name}`)
      
      await pool.query(
        'INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET description = $2',
        [role.name, role.description]
      )
      
      console.log(`✅ Added role: ${role.name}`)
    }

    // Display all roles
    const rolesResult = await pool.query('SELECT id, name, description FROM roles ORDER BY id')
    console.log('\n📋 Available roles:')
    rolesResult.rows.forEach(role => {
      console.log(`- ID: ${role.id}, Name: ${role.name}, Description: ${role.description}`)
    })

    console.log('\n🎉 Roles setup complete!')

  } catch (error) {
    console.error('Setup failed:', error)
  } finally {
    await pool.end()
  }
}

setupRoles() 