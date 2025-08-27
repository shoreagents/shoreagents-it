const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function testCleanupFix() {
  console.log('🧪 Testing Updated Storage Cleanup Function')
  console.log('==========================================')
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing!')
    return
  }
  
  try {
    // Create service client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Test the new cleanup approach
    const testCompanyName = 'Test Company Cleanup'
    console.log(`\n🔍 Testing cleanup logic for company: "${testCompanyName}"`)
    
    // Search for all files that start with the company name
    const { data: allFiles, error: searchError } = await supabase.storage
      .from('members')
      .list('', { 
        limit: 1000,
        search: testCompanyName 
      })
    
    if (searchError) {
      console.error('❌ Failed to search storage files:', searchError)
      return
    }
    
    console.log(`📁 Found ${allFiles.length} total files in storage`)
    
    // Filter files that belong to this company
    const companyFiles = allFiles.filter(file => 
      file.name.startsWith(`${testCompanyName}/`)
    )
    
    if (companyFiles.length > 0) {
      console.log(`✅ Found ${companyFiles.length} files for company: "${testCompanyName}"`)
      companyFiles.forEach(file => {
        console.log(`  - ${file.name}`)
      })
      
      console.log('\n🧹 Testing deletion...')
      
      // Delete all company files
      const { error: deleteError } = await supabase.storage
        .from('members')
        .remove(companyFiles.map(file => file.name))
      
      if (deleteError) {
        console.error('❌ Bulk deletion failed:', deleteError)
        
        // Test individual deletion
        console.log('\n🔄 Testing individual deletion...')
        let successCount = 0
        let failCount = 0
        
        for (const file of companyFiles) {
          try {
            const { error: singleDeleteError } = await supabase.storage
              .from('members')
              .remove([file.name])
            
            if (singleDeleteError) {
              console.warn(`❌ Failed to delete ${file.name}:`, singleDeleteError)
              failCount++
            } else {
              console.log(`✅ Deleted ${file.name}`)
              successCount++
            }
          } catch (singleError) {
            console.warn(`❌ Error deleting ${file.name}:`, singleError)
            failCount++
          }
        }
        
        console.log(`\n📊 Individual deletion results: ${successCount} successful, ${failCount} failed`)
      } else {
        console.log('✅ Bulk deletion successful!')
      }
      
      // Verify deletion
      console.log('\n🔍 Verifying deletion...')
      const { data: remainingFiles, error: verifyError } = await supabase.storage
        .from('members')
        .list('', { 
          limit: 1000,
          search: testCompanyName 
        })
      
      if (verifyError) {
        console.error('❌ Failed to verify deletion:', verifyError)
      } else {
        const remainingCompanyFiles = remainingFiles.filter(file => 
          file.name.startsWith(`${testCompanyName}/`)
        )
        
        if (remainingCompanyFiles.length === 0) {
          console.log('✅ All company files successfully deleted!')
        } else {
          console.log(`⚠️ ${remainingCompanyFiles.length} files still remain:`)
          remainingCompanyFiles.forEach(file => {
            console.log(`  - ${file.name}`)
          })
        }
      }
      
    } else {
      console.log(`ℹ️ No files found for company: "${testCompanyName}"`)
    }
    
    console.log('\n✅ Cleanup test completed!')
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

// Run the test
testCleanupFix()
