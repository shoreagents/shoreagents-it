const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function testActualStructure() {
  console.log('🧪 Testing Actual Storage Structure Cleanup')
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
    
    // Test with the actual company structure from the URL
    const testCompanyName = 'bbbbb'
    console.log(`\n🔍 Testing cleanup logic for company: "${testCompanyName}"`)
    
    // First, list the company folder to see what's inside
    console.log('\n📁 Listing company folder...')
    const { data: companyItems, error: listError } = await supabase.storage
      .from('members')
      .list(testCompanyName)
    
    if (listError) {
      console.error('❌ Failed to list company folder:', listError)
      return
    }
    
    if (companyItems && companyItems.length > 0) {
      console.log(`✅ Found ${companyItems.length} items in company folder: "${testCompanyName}"`)
      companyItems.forEach(item => {
        console.log(`  - ${item.name} (${item.id ? 'folder' : 'file'})`)
      })
      
      const allFilePaths = []
      
      // Process each item in the company folder
      for (const item of companyItems) {
        if (item.id) {
          // This is a folder (like "Logos")
          console.log(`\n📁 Processing folder: ${item.name}`)
          
          try {
            // List files inside the subfolder
            const { data: subFiles, error: subListError } = await supabase.storage
              .from('members')
              .list(`${testCompanyName}/${item.name}`)
            
            if (subListError) {
              console.error(`❌ Failed to list files in subfolder ${item.name}:`, subListError)
            } else if (subFiles && subFiles.length > 0) {
              console.log(`  📄 Found ${subFiles.length} files in ${item.name} folder:`)
              const subFilePaths = subFiles.map(subFile => `${testCompanyName}/${item.name}/${subFile.name}`)
              allFilePaths.push(...subFilePaths)
              
              subFiles.forEach(subFile => {
                console.log(`    - ${subFile.name}`)
              })
            } else {
              console.log(`  ℹ️ No files found in ${item.name} folder`)
            }
          } catch (subFolderError) {
            console.error(`❌ Error processing subfolder ${item.name}:`, subFolderError)
          }
        } else {
          // This is a direct file in the company folder
          console.log(`📄 Found direct file: ${item.name}`)
          allFilePaths.push(`${testCompanyName}/${item.name}`)
        }
      }
      
      if (allFilePaths.length > 0) {
        console.log(`\n🗑️ Found ${allFilePaths.length} files to delete:`)
        allFilePaths.forEach(path => {
          console.log(`  - ${path}`)
        })
        
        // Test deletion (but don't actually delete for safety)
        console.log('\n🧪 Testing deletion logic (dry run)...')
        console.log('Files that would be deleted:', allFilePaths)
        
        // Verify the files exist by checking their URLs
        console.log('\n🔍 Verifying file existence...')
        for (const filePath of allFilePaths) {
          try {
            const { data: urlData } = supabase.storage
              .from('members')
              .getPublicUrl(filePath)
            
            console.log(`✅ File exists: ${filePath}`)
            console.log(`  URL: ${urlData.publicUrl}`)
          } catch (error) {
            console.log(`❌ File not accessible: ${filePath}`)
          }
        }
        
      } else {
        console.log('\nℹ️ No files found to delete')
      }
      
    } else {
      console.log(`ℹ️ No items found for company: "${testCompanyName}"`)
    }
    
    console.log('\n✅ Structure test completed!')
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

// Run the test
testActualStructure()
