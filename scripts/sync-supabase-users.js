const { createClient } = require('@supabase/supabase-js')
const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Railway database client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function syncSupabaseUsers() {
  try {
    console.log('Syncing Supabase users with Railway database...')

    // Get all users from Supabase
    const { data: supabaseUsers, error: supabaseError } = await supabase.auth.admin.listUsers()
    
    if (supabaseError) {
      console.error('Error fetching Supabase users:', supabaseError)
      return
    }

    console.log(`Found ${supabaseUsers.users.length} users in Supabase`)

    // Get existing roles from Railway database
    const rolesResult = await pool.query('SELECT id, name FROM roles')
    const roles = rolesResult.rows.reduce((acc, role) => {
      acc[role.name.toLowerCase()] = role.id
      return acc
    }, {})

    console.log('Available roles:', roles)

    // Process each Supabase user
    for (const supabaseUser of supabaseUsers.users) {
      const email = supabaseUser.email
      if (!email) continue

      console.log(`Processing user: ${email}`)

      try {
        // Check if user exists in Railway database
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email])
        
        if (existingUser.rows.length === 0) {
          // User doesn't exist in Railway DB, create them
          console.log(`Creating user in Railway DB: ${email}`)
          
          // Insert user
          const userResult = await pool.query(
            'INSERT INTO users (email, user_type) VALUES ($1, $2) RETURNING id',
            [email, 'Internal']
          )
          
          const userId = userResult.rows[0].id
          console.log(`Created user with ID: ${userId}`)

          // Insert personal info (extract from Supabase metadata)
          const metadata = supabaseUser.user_metadata || {}
          const firstName = metadata.first_name || email.split('@')[0]
          const lastName = metadata.last_name || ''
          
          await pool.query(
            'INSERT INTO personal_info (user_id, first_name, last_name) VALUES ($1, $2, $3)',
            [userId, firstName, lastName]
          )

          // Insert into internal table
          await pool.query('INSERT INTO internal (user_id) VALUES ($1)', [userId])

          // Assign default role (IT or Admin)
          const defaultRoleId = roles['it'] || roles['admin'] || 1
          await pool.query(
            'INSERT INTO internal_roles (internal_user_id, role_id) VALUES ($1, $2)',
            [userId, defaultRoleId]
          )

          console.log(`✅ Created user: ${email}`)
        } else {
          console.log(`User already exists in Railway DB: ${email}`)
        }
      } catch (error) {
        console.error(`Error processing user ${email}:`, error)
      }
    }

    console.log('\n🎉 User sync complete!')
    console.log('\nUsers can now login with their Supabase credentials')

  } catch (error) {
    console.error('Sync failed:', error)
  } finally {
    await pool.end()
  }
}

syncSupabaseUsers() 