require('dotenv').config({ path: '.env.local' })

async function testSupabaseStorage() {
  console.log('Testing Supabase storage connection...')
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('❌ Supabase environment variables not set')
    return false
  }
  
  console.log('✅ Supabase environment variables found')
  
  try {
    const { createClient } = require('@supabase/supabase-js')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    )
    
    console.log('✅ Supabase client created')
    
    // List all storage buckets
    console.log('📦 Listing storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message)
      return false
    }
    
    console.log('✅ Buckets found:', buckets.length)
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
    })
    
    // Check if members bucket exists
    const membersBucket = buckets.find(b => b.name === 'members')
    if (membersBucket) {
      console.log('✅ Members bucket found')
      
      // Try to list files in members bucket
      console.log('📁 Listing files in members bucket...')
      const { data: files, error: filesError } = await supabase.storage
        .from('members')
        .list('', { limit: 10 })
      
      if (filesError) {
        console.error('❌ Error listing files:', filesError.message)
      } else {
        console.log('✅ Files in members bucket:', files.length)
        files.forEach(file => {
          console.log(`  - ${file.name} (${file.metadata?.size || 'unknown size'})`)
        })
      }
    } else {
      console.log('❌ Members bucket not found')
      console.log('💡 You may need to create the members bucket in Supabase dashboard')
    }
    
    return true
  } catch (error) {
    console.error('❌ Supabase storage test failed:', error.message)
    return false
  }
}

testSupabaseStorage().then(success => {
  if (success) {
    console.log('\n🎉 Supabase storage test completed!')
  } else {
    console.log('\n💥 Supabase storage test failed. Please check your configuration.')
    process.exit(1)
  }
})
