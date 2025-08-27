const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function testUploadStructure() {
  console.log('🧪 Testing Supabase Upload Structure')
  console.log('====================================')
  
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
    
    // Create a test file
    const testFileName = 'test-logo.png'
    const testFilePath = path.join(__dirname, testFileName)
    
    // Create a simple test file (1x1 pixel PNG)
    const testPngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ])
    
    fs.writeFileSync(testFilePath, testPngData)
    console.log('✅ Created test PNG file')
    
    // Test upload with the same logic as the API
    const testCompanyName = 'Test Company Cleanup'
    const logoExt = testFileName.split('.').pop()
    const logoFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${logoExt}`
    const folderPath = `${testCompanyName}/Logos`
    const fullPath = `${folderPath}/${logoFileName}`
    
    console.log(`\n📤 Uploading test file:`)
    console.log(`  Company: ${testCompanyName}`)
    console.log(`  Path: ${fullPath}`)
    
    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('members')
      .upload(fullPath, testPngData, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError)
      return
    }
    
    console.log('✅ Upload successful:', uploadData)
    
    // Now let's check what was actually created
    console.log('\n🔍 Checking storage structure after upload...')
    
    // List the company folder
    const { data: companyFiles, error: companyListError } = await supabase.storage
      .from('members')
      .list(testCompanyName)
    
    if (companyListError) {
      console.error('❌ Failed to list company folder:', companyListError)
    } else if (companyFiles && companyFiles.length > 0) {
      console.log(`📁 Found ${companyFiles.length} items in "${testCompanyName}":`)
      companyFiles.forEach(item => {
        console.log(`  - ${item.name} (${item.id ? 'folder' : 'file'})`)
      })
      
      // Check if Logos is a folder
      const logosItem = companyFiles.find(item => item.name === 'Logos')
      if (logosItem) {
        console.log(`\n🔍 Logos item details:`)
        console.log(`  Name: ${logosItem.name}`)
        console.log(`  ID: ${logosItem.id}`)
        console.log(`  Is folder: ${!!logosItem.id}`)
        
        if (logosItem.id) {
          // It's a folder, list its contents
          console.log(`\n📁 Listing contents of Logos folder:`)
          const { data: logosFiles, error: logosListError } = await supabase.storage
            .from('members')
            .list(`${testCompanyName}/Logos`)
          
          if (logosListError) {
            console.error('❌ Failed to list Logos folder:', logosListError)
          } else if (logosFiles && logosFiles.length > 0) {
            console.log(`  Found ${logosFiles.length} files:`)
            logosFiles.forEach(file => {
              console.log(`    - ${file.name}`)
            })
          } else {
            console.log('  No files found in Logos folder')
          }
        } else {
          console.log('⚠️ Logos is a file, not a folder! This explains the cleanup issue.')
        }
      }
    } else {
      console.log(`ℹ️ No items found for "${testCompanyName}"`)
    }
    
    // Clean up test file
    fs.unlinkSync(testFilePath)
    console.log('\n🧹 Cleaned up test file')
    
    console.log('\n✅ Upload structure test completed!')
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

// Run the test
testUploadStructure()
