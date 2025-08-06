require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')i
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSupabaseAccounts() {
  try {
    // Read email list from login.md
    const loginPath = path.join(__dirname, '..', 'login.md')
    const emailList = fs.readFileSync(loginPath, 'utf8')
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'))

    console.log(`Found ${emailList.length} email addresses`)

    const results = {
      success: [],
      failed: []
    }

    for (const email of emailList) {
      try {
        console.log(`Creating account for: ${email}`)
        
        // Create user without password (passwordless authentication)
        const { data, error } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            role: 'user',
            created_by: 'script'
          }
        })

        if (error) {
          console.error(`Failed to create account for ${email}:`, error.message)
          results.failed.push({ email, error: error.message })
        } else {
          console.log(`✅ Successfully created account for: ${email}`)
          results.success.push({ email, user_id: data.user.id })
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error creating account for ${email}:`, error.message)
        results.failed.push({ email, error: error.message })
      }
    }

    // Print summary
    console.log('\n=== SUMMARY ===')
    console.log(`✅ Successfully created: ${results.success.length} accounts`)
    console.log(`❌ Failed: ${results.failed.length} accounts`)

    if (results.success.length > 0) {
      console.log('\n✅ Successful accounts:')
      results.success.forEach(result => {
        console.log(`  - ${result.email} (ID: ${result.user_id})`)
      })
    }

    if (results.failed.length > 0) {
      console.log('\n❌ Failed accounts:')
      results.failed.forEach(result => {
        console.log(`  - ${result.email}: ${result.error}`)
      })
    }

    // Save results to file
    const resultsPath = path.join(__dirname, 'supabase-accounts-results.json')
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2))
    console.log(`\nResults saved to: ${resultsPath}`)

  } catch (error) {
    console.error('Script error:', error)
    process.exit(1)
  }
}

// Run the script
createSupabaseAccounts() 