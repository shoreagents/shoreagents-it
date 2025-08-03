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

async function updateArraPassword() {
  try {
    console.log('Updating password for arra.m@shoreagents.com...')

    // First, get the user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError.message)
      return
    }

    const arraUser = users.users.find(user => user.email === 'arra.m@shoreagents.com')
    
    if (!arraUser) {
      console.error('User arra.m@shoreagents.com not found in Supabase')
      return
    }

    console.log('Found user:', arraUser.id)

    // Update the user's password
    const { data, error } = await supabase.auth.admin.updateUserById(
      arraUser.id,
      {
        password: 'w4gV*E3ogcE*M@G'
      }
    )

    if (error) {
      console.error('Error updating password:', error.message)
    } else {
      console.log('✅ Password updated successfully!')
      console.log('\nUpdated credentials:')
      console.log('- Email: arra.m@shoreagents.com')
      console.log('- Password: w4gV*E3ogcE*M@G')
    }

  } catch (error) {
    console.error('Update failed:', error)
  }
}

updateArraPassword() 