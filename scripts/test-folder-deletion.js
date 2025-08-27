const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function testFolderDeletion() {
  console.log('🧪 Testing Complete Folder Structure Deletion')
  console.log('============================================')
  
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
    
    // First, let's create a test company structure to test deletion
    const testCompanyName = 'Test Company Folder Deletion'
    console.log(`\n🔧 Creating test company structure: "${testCompanyName}"`)
    
    // Create a test PNG file
    const testPngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ])
    
    // Upload test files to create the structure
    const logoFileName = `${Date.now()}-test-logo.png`
    const logoPath = `${testCompanyName}/Logos/${logoFileName}`
    
    console.log(`📤 Uploading test logo to: ${logoPath}`)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('members')
      .upload(logoPath, testPngData, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ Failed to upload test file:', uploadError)
      return
    }
    
    console.log('✅ Test file uploaded successfully')
    
    // Now let's verify the structure exists
    console.log('\n🔍 Verifying folder structure exists...')
    
    // List company folder
    const { data: companyItems, error: listError } = await supabase.storage
      .from('members')
      .list(testCompanyName)
    
    if (listError) {
      console.error('❌ Failed to list company folder:', listError)
      return
    }
    
    if (companyItems && companyItems.length > 0) {
      console.log(`✅ Company folder contains ${companyItems.length} items:`)
      companyItems.forEach(item => {
        console.log(`  - ${item.name} (${item.id ? 'folder' : 'file'})`)
      })
      
      // List Logos subfolder
      const { data: logosFiles, error: logosError } = await supabase.storage
        .from('members')
        .list(`${testCompanyName}/Logos`)
      
      if (logosError) {
        console.error('❌ Failed to list Logos folder:', logosError)
      } else if (logosFiles && logosFiles.length > 0) {
        console.log(`✅ Logos folder contains ${logosFiles.length} files:`)
        logosFiles.forEach(file => {
          console.log(`  - ${file.name}`)
        })
      }
    }
    
    // Now let's test the complete deletion process
    console.log('\n🧪 Testing complete folder deletion process...')
    
    // Step 1: Delete all files in subfolders (using the same logic as the cleanup function)
    console.log('\n📁 Step 1: Deleting files in subfolders...')
    const allFilePaths = []
    
    for (const item of companyItems) {
      // In Supabase, folders appear as "files" but we need to treat them as folders
      // because they contain actual files
      console.log(`📁 Processing item: ${item.name} (treating as folder)`)
      
      try {
        // Try to list files inside this "folder" (even though it appears as a file)
        const { data: subFiles, error: subListError } = await supabase.storage
          .from('members')
          .list(`${testCompanyName}/${item.name}`)
        
        if (subListError) {
          console.warn(`Failed to list files in ${item.name}:`, subListError)
          // If we can't list it as a folder, treat it as a direct file
          console.log(`📄 Treating ${item.name} as direct file`)
          allFilePaths.push(`${testCompanyName}/${item.name}`)
        } else if (subFiles && subFiles.length > 0) {
          console.log(`  📄 Found ${subFiles.length} files in ${item.name} folder`)
          const subFilePaths = subFiles.map(subFile => `${testCompanyName}/${item.name}/${subFile.name}`)
          allFilePaths.push(...subFilePaths)
          
          subFiles.forEach(subFile => {
            console.log(`    - ${subFile.name}`)
          })
        } else {
          console.log(`  ℹ️ ${item.name} folder is empty`)
        }
      } catch (subFolderError) {
        console.warn(`Error processing ${item.name}:`, subFolderError)
        // Fallback: treat as direct file
        allFilePaths.push(`${testCompanyName}/${item.name}`)
      }
    }
    
    if (allFilePaths.length > 0) {
      console.log(`🗑️ Deleting ${allFilePaths.length} files:`, allFilePaths)
      
      const { error: deleteError } = await supabase.storage
        .from('members')
        .remove(allFilePaths)
      
      if (deleteError) {
        console.error('❌ Failed to delete files:', deleteError)
      } else {
        console.log('✅ Files deleted successfully')
      }
    } else {
      console.log('ℹ️ No files found to delete')
    }
    
    // Step 2: Delete subfolders
    console.log('\n📁 Step 2: Deleting subfolders...')
    const subfoldersToDelete = companyItems
      .map(item => `${testCompanyName}/${item.name}`)
    
    if (subfoldersToDelete.length > 0) {
      console.log(`🗑️ Deleting ${subfoldersToDelete.length} subfolders:`, subfoldersToDelete)
      
      const { error: subfolderDeleteError } = await supabase.storage
        .from('members')
        .remove(subfoldersToDelete)
      
      if (subfolderDeleteError) {
        console.error('❌ Failed to delete subfolders:', subfolderDeleteError)
      } else {
        console.log('✅ Subfolders deleted successfully')
      }
    }
    
    // Step 3: Delete company folder itself
    console.log('\n📁 Step 3: Deleting company folder...')
    const { error: companyFolderDeleteError } = await supabase.storage
      .from('members')
      .remove([testCompanyName])
    
    if (companyFolderDeleteError) {
      console.error('❌ Failed to delete company folder:', companyFolderDeleteError)
    } else {
      console.log('✅ Company folder deleted successfully')
    }
    
    // Verify everything is deleted
    console.log('\n🔍 Verifying complete deletion...')
    try {
      const { data: remainingItems, error: verifyError } = await supabase.storage
        .from('members')
        .list(testCompanyName)
      
      if (verifyError) {
        console.log('✅ Company folder no longer exists (deletion successful)')
      } else if (remainingItems && remainingItems.length === 0) {
        console.log('✅ Company folder is empty (deletion successful)')
      } else {
        console.log(`⚠️ Company folder still contains ${remainingItems.length} items`)
      }
    } catch (error) {
      console.log('✅ Company folder no longer accessible (deletion successful)')
    }
    
    console.log('\n✅ Complete folder deletion test completed!')
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

// Run the test
testFolderDeletion()
