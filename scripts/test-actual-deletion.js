const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function testActualDeletion() {
  console.log('🧪 Testing Actual File Deletion')
  console.log('================================')
  
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
    
    const testCompanyName = 'bbbbb'
    console.log(`\n🔍 Testing actual deletion for company: "${testCompanyName}"`)
    
    // First, let's see what files exist before deletion
    console.log('\n📁 Files before deletion:')
    const { data: beforeFiles, error: beforeError } = await supabase.storage
      .from('members')
      .list('', { limit: 1000 })
    
    if (beforeError) {
      console.error('❌ Failed to list files before deletion:', beforeError)
      return
    }
    
    const companyFilesBefore = beforeFiles.filter(file => 
      file.name.startsWith(`${testCompanyName}/`)
    )
    
    console.log(`Found ${companyFilesBefore.length} files for company "${testCompanyName}":`)
    companyFilesBefore.forEach(file => {
      console.log(`  - ${file.name}`)
    })
    
    if (companyFilesBefore.length === 0) {
      console.log('ℹ️ No files found to delete')
      return
    }
    
    // Now let's delete the files
    console.log('\n🗑️ Deleting company files...')
    const filePathsToDelete = companyFilesBefore.map(file => file.name)
    
    const { error: deleteError } = await supabase.storage
      .from('members')
      .remove(filePathsToDelete)
    
    if (deleteError) {
      console.error('❌ Bulk deletion failed:', deleteError)
      
      // Try individual deletion
      console.log('\n🔄 Attempting individual deletion...')
      let successCount = 0
      let failCount = 0
      
      for (const filePath of filePathsToDelete) {
        try {
          const { error: singleDeleteError } = await supabase.storage
            .from('members')
            .remove([filePath])
          
          if (singleDeleteError) {
            console.warn(`❌ Failed to delete ${filePath}:`, singleDeleteError)
            failCount++
          } else {
            console.log(`✅ Deleted ${filePath}`)
            successCount++
          }
        } catch (singleError) {
          console.warn(`❌ Error deleting ${filePath}:`, singleError)
          failCount++
        }
      }
      
      console.log(`\n📊 Individual deletion results: ${successCount} successful, ${failCount} failed`)
      
    } else {
      console.log('✅ Bulk deletion successful!')
    }
    
    // Verify deletion
    console.log('\n🔍 Verifying deletion...')
    const { data: afterFiles, error: afterError } = await supabase.storage
      .from('members')
      .list('', { limit: 1000 })
    
    if (afterError) {
      console.error('❌ Failed to list files after deletion:', afterError)
    } else {
      const companyFilesAfter = afterFiles.filter(file => 
        file.name.startsWith(`${testCompanyName}/`)
      )
      
      if (companyFilesAfter.length === 0) {
        console.log('✅ All company files successfully deleted!')
      } else {
        console.log(`⚠️ ${companyFilesAfter.length} files still remain:`)
        companyFilesAfter.forEach(file => {
          console.log(`  - ${file.name}`)
        })
      }
    }
    
    console.log('\n✅ Actual deletion test completed!')
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

// Run the test
testActualDeletion()
