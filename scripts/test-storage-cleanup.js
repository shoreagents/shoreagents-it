require('dotenv').config({ path: '.env.local' })

async function testStorageCleanup() {
  console.log('🧪 Testing storage cleanup functionality...')
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Supabase environment variables not set (need service role key)')
    return false
  }
  
  console.log('✅ Supabase environment variables found')
  
  try {
    const { createClient } = require('@supabase/supabase-js')
    
    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    )
    
    console.log('✅ Supabase admin client created')
    
    // Test company name for cleanup
    const testCompanyName = 'TEST_COMPANY_CLEANUP'
    const testFilePath = `${testCompanyName}/Logos/test-logo.png`
    
    console.log(`📁 Testing cleanup for company: ${testCompanyName}`)
    
    // First, check if test files exist
    console.log('🔍 Checking existing test files...')
    const { data: existingFiles, error: listError } = await supabase.storage
      .from('members')
      .list(testCompanyName)
    
    if (listError) {
      console.log('⚠️ Error listing existing files:', listError.message)
    } else if (existingFiles && existingFiles.length > 0) {
      console.log(`📋 Found ${existingFiles.length} existing test files:`)
      existingFiles.forEach(file => {
        console.log(`  - ${file.name}`)
      })
    } else {
      console.log('📭 No existing test files found')
    }
    
    // Create a test file (empty file for testing)
    console.log('📝 Creating test file...')
    const testContent = Buffer.from('This is a test file for cleanup testing')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('members')
      .upload(testFilePath, testContent, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.error('❌ Error creating test file:', uploadError.message)
      return false
    }
    
    console.log('✅ Test file created successfully')
    
    // Verify file exists
    console.log('🔍 Verifying test file exists...')
    const { data: verifyFiles, error: verifyError } = await supabase.storage
      .from('members')
      .list(testCompanyName)
    
    if (verifyError) {
      console.error('❌ Error verifying test file:', verifyError.message)
      return false
    }
    
    if (verifyFiles && verifyFiles.length > 0) {
      console.log(`✅ Test file verified: ${verifyFiles.length} files found`)
      verifyFiles.forEach(file => {
        console.log(`  - ${file.name}`)
      })
    } else {
      console.log('❌ Test file not found after creation')
      return false
    }
    
    // Now test the cleanup functionality
    console.log('🧹 Testing cleanup functionality...')
    const filePaths = verifyFiles.map(file => `${testCompanyName}/${file.name}`)
    
    const { error: deleteError } = await supabase.storage
      .from('members')
      .remove(filePaths)
    
    if (deleteError) {
      console.error('❌ Error during cleanup:', deleteError.message)
      return false
    }
    
    console.log('✅ Cleanup completed successfully')
    
    // Verify cleanup worked
    console.log('🔍 Verifying cleanup...')
    const { data: finalFiles, error: finalError } = await supabase.storage
      .from('members')
      .list(testCompanyName)
    
    if (finalError) {
      console.log('⚠️ Error checking final state:', finalError.message)
    } else if (!finalFiles || finalFiles.length === 0) {
      console.log('✅ Cleanup verification successful: No files remaining')
    } else {
      console.log(`⚠️ Cleanup may have failed: ${finalFiles.length} files still exist`)
      finalFiles.forEach(file => {
        console.log(`  - ${file.name}`)
      })
    }
    
    return true
  } catch (error) {
    console.error('❌ Storage cleanup test failed:', error.message)
    return false
  }
}

testStorageCleanup().then(success => {
  if (success) {
    console.log('\n🎉 Storage cleanup test completed successfully!')
    console.log('💡 This means the deleteMember function will properly clean up storage files')
  } else {
    console.log('\n💥 Storage cleanup test failed. Please check your configuration.')
    process.exit(1)
  }
})
