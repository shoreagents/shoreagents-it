const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupSupabaseUsers() {
  try {
    console.log('Setting up Supabase users...')

    // Create users in Supabase Auth
    const users = [
      {
        email: 'admin@shoreagents.com',
        password: 'password123',
        user_metadata: {
          first_name: 'Admin',
          last_name: 'User'
        }
      },
      {
        email: 'agent1@shoreagents.com',
        password: 'password123',
        user_metadata: {
          first_name: 'John',
          last_name: 'Doe'
        }
      },
      {
        email: 'agent2@shoreagents.com',
        password: 'password123',
        user_metadata: {
          first_name: 'Jane',
          last_name: 'Smith'
        }
      }
    ]

    for (const user of users) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: user.user_metadata,
        email_confirm: true // Auto-confirm email
      })

      if (error) {
        console.error(`Error creating user ${user.email}:`, error.message)
      } else {
        console.log(`✅ Created user: ${user.email}`)
      }
    }

    console.log('\n🎉 Supabase users setup complete!')
    console.log('\nTest accounts:')
    console.log('- admin@shoreagents.com / password123')
    console.log('- agent1@shoreagents.com / password123')
    console.log('- agent2@shoreagents.com / password123')

  } catch (error) {
    console.error('Setup failed:', error)
  }
}

setupSupabaseUsers() 