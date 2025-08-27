const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function testPrefixSearch() {
  console.log('🧪 Testing Different Search Approaches')
  console.log('=====================================')
  
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
    console.log(`\n🔍 Testing different search approaches for company: "${testCompanyName}"`)
    
    // Approach 1: List all files and filter by prefix
    console.log('\n📁 Approach 1: List all files and filter by prefix')
    const { data: allFiles, error: allFilesError } = await supabase.storage
      .from('members')
      .list('', { limit: 1000 })
    
    if (allFilesError) {
      console.error('❌ Failed to list all files:', allFilesError)
    } else {
      console.log(`✅ Found ${allFiles.length} total files in storage`)
      
      // Filter files that start with the company name
      const companyFiles = allFiles.filter(file => 
        file.name.startsWith(`${testCompanyName}/`)
      )
      
      console.log(`📁 Found ${companyFiles.length} files for company "${testCompanyName}":`)
      companyFiles.forEach(file => {
        console.log(`  - ${file.name}`)
      })
    }
    
    // Approach 2: Try to list the Logos "folder" directly
    console.log('\n📁 Approach 2: Try to list Logos folder directly')
    try {
      const { data: logosFiles, error: logosError } = await supabase.storage
        .from('members')
        .list(`${testCompanyName}/Logos`)
      
      if (logosError) {
        console.log(`ℹ️ Cannot list ${testCompanyName}/Logos directly:`, logosError.message)
      } else if (logosFiles && logosFiles.length > 0) {
        console.log(`✅ Found ${logosFiles.length} files in Logos folder:`)
        logosFiles.forEach(file => {
          console.log(`  - ${file.name}`)
        })
      } else {
        console.log(`ℹ️ No files found in Logos folder`)
      }
    } catch (error) {
      console.log(`❌ Error listing Logos folder:`, error.message)
    }
    
    // Approach 3: Try to get the specific file we know exists
    console.log('\n📁 Approach 3: Try to access specific known file')
    const knownFilePath = `${testCompanyName}/Logos/1756273662614-9j2oopn09fho.png`
    try {
      const { data: urlData } = supabase.storage
        .from('members')
        .getPublicUrl(knownFilePath)
      
      console.log(`✅ File accessible: ${knownFilePath}`)
      console.log(`  URL: ${urlData.publicUrl}`)
    } catch (error) {
      console.log(`❌ File not accessible: ${knownFilePath}`)
    }
    
    // Approach 4: Try different variations of the path
    console.log('\n📁 Approach 4: Try different path variations')
    const pathVariations = [
      `${testCompanyName}/Logos`,
      `${testCompanyName}/Logos/`,
      `${testCompanyName}Logos`,
      `${testCompanyName}_Logos`
    ]
    
    for (const path of pathVariations) {
      try {
        const { data: files, error } = await supabase.storage
          .from('members')
          .list(path)
        
        if (error) {
          console.log(`ℹ️ ${path}: ${error.message}`)
        } else if (files && files.length > 0) {
          console.log(`✅ ${path}: Found ${files.length} files`)
          files.forEach(file => {
            console.log(`    - ${file.name}`)
          })
        } else {
          console.log(`ℹ️ ${path}: No files found`)
        }
      } catch (e) {
        console.log(`❌ ${path}: Error - ${e.message}`)
      }
    }
    
    console.log('\n✅ Prefix search test completed!')
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

// Run the test
testPrefixSearch()
