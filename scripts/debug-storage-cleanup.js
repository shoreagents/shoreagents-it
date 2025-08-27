const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function debugStorageCleanup() {
  console.log('🔍 Debugging Supabase Storage Cleanup')
  console.log('=====================================')
  
  // Check environment variables
  console.log('\n📋 Environment Variables:')
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('\n❌ SUPABASE_SERVICE_ROLE_KEY is missing! This is required for storage operations.')
    console.log('Please check your .env.local file and ensure SUPABASE_SERVICE_ROLE_KEY is set.')
    return
  }
  
  try {
    // Create service client
    console.log('\n🔧 Creating Supabase service client...')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Test bucket access
    console.log('\n📦 Testing bucket access...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Failed to list buckets:', bucketError)
      return
    }
    
    console.log('✅ Available buckets:', buckets.map(b => b.name))
    
    // Check if 'members' bucket exists
    const membersBucket = buckets.find(b => b.name === 'members')
    if (!membersBucket) {
      console.error('❌ "members" bucket not found!')
      return
    }
    
    console.log('✅ "members" bucket found')
    
    // List files in members bucket
    console.log('\n📁 Listing files in members bucket...')
    const { data: files, error: listError } = await supabase.storage
      .from('members')
      .list('', { limit: 100 })
    
    if (listError) {
      console.error('❌ Failed to list files:', listError)
      return
    }
    
    console.log(`✅ Found ${files.length} items in members bucket:`)
    files.forEach(file => {
      console.log(`  - ${file.name} (${file.id ? 'folder' : 'file'})`)
    })
    
    // Test with a specific company name from the list
    const testCompanyName = 'Aria First Homes Pty Ltd (Charles Lloyd Property Group)'
    console.log(`\n🧪 Testing cleanup logic for company: "${testCompanyName}"`)
    
    // List files for the test company
    const { data: companyFiles, error: companyListError } = await supabase.storage
      .from('members')
      .list(testCompanyName)
    
    if (companyListError) {
      console.log(`ℹ️ No files found for "${testCompanyName}" (this is normal if company doesn't exist)`)
    } else if (companyFiles && companyFiles.length > 0) {
      console.log(`📁 Found ${companyFiles.length} items for "${testCompanyName}":`)
      companyFiles.forEach(item => {
        console.log(`  - ${item.name} (${item.id ? 'folder' : 'file'})`)
      })
    } else {
      console.log(`ℹ️ No files found for "${testCompanyName}"`)
    }
    
    // Test with another company
    const testCompanyName2 = 'BoxBrownie'
    console.log(`\n🧪 Testing cleanup logic for company: "${testCompanyName2}"`)
    
    const { data: companyFiles2, error: companyListError2 } = await supabase.storage
      .from('members')
      .list(testCompanyName2)
    
    if (companyListError2) {
      console.log(`ℹ️ No files found for "${testCompanyName2}" (this is normal if company doesn't exist)`)
    } else if (companyFiles2 && companyFiles2.length > 0) {
      console.log(`📁 Found ${companyFiles2.length} items for "${testCompanyName2}":`)
      companyFiles2.forEach(item => {
        console.log(`  - ${item.name} (${item.id ? 'folder' : 'file'})`)
      })
    } else {
      console.log(`ℹ️ No files found for "${testCompanyName2}"`)
    }
    
    console.log('\n✅ Storage cleanup debug completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during debug:', error)
  }
}

// Run the debug function
debugStorageCleanup()
