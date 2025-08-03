const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addArraUser() {
  try {
    console.log('Adding arra.m@shoreagents.com to Supabase...')

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'arra.m@shoreagents.com',
      password: 'password123',
      user_metadata: {
        first_name: 'Arra Lois',
        last_name: 'Magracia'
      },
      email_confirm: true // Auto-confirm email
    })

    if (error) {
      console.error('Error creating user:', error.message)
      if (error.message.includes('already registered')) {
        console.log('User already exists in Supabase')
      }
    } else {
      console.log('✅ Created user: arra.m@shoreagents.com')
    }

    console.log('\n🎉 Setup complete!')
    console.log('\nTest credentials:')
    console.log('- Email: arra.m@shoreagents.com')
    console.log('- Password: password123')

  } catch (error) {
    console.error('Setup failed:', error)
  }
}

addArraUser() 