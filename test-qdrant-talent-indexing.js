const { QdrantClient } = require('@qdrant/js-client-rest')
require('dotenv').config({ path: '.env.local' })

async function testTalentIndexing() {
  console.log('🧪 Testing Qdrant talent indexing...\n')
  
  const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    checkCompatibility: false,
  })
  
  try {
    const collectionName = process.env.QDRANT_COLLECTION_NAME || 'talent_pool_documents'
    
    console.log('1️⃣ Testing collection connection...')
    const collectionInfo = await client.getCollection(collectionName)
    console.log(`✅ Connected to collection: ${collectionName}`)
    console.log(`   Points count: ${collectionInfo.points_count}`)
    
    console.log('\n2️⃣ Testing search functionality...')
    
    // Test search for React developers
    const searchResults = await client.search(collectionName, {
      vector: new Array(1536).fill(0.1), // Dummy vector for testing
      limit: 3,
      with_payload: true,
      with_vector: false
    })
    
    console.log(`Found ${searchResults.length} results:`)
    searchResults.forEach((result, index) => {
      console.log(`  Result ${index + 1}:`)
      console.log(`    ID: ${result.id}`)
      console.log(`    Score: ${result.score}`)
      if (result.payload) {
        console.log(`    Name: ${result.payload.name || 'N/A'}`)
        console.log(`    Type: ${result.payload.type || 'N/A'}`)
        console.log(`    Skills: ${result.payload.skills ? result.payload.skills.join(', ') : 'N/A'}`)
      }
    })
    
    console.log('\n3️⃣ Testing metadata filtering...')
    
    // Test filtering by type
    const filteredResults = await client.scroll(collectionName, {
      filter: {
        must: [
          {
            key: 'type',
            match: { value: 'bpoc_profile' }
          }
        ]
      },
      limit: 5,
      with_payload: true
    })
    
    console.log(`Found ${filteredResults.points.length} BPOC profiles:`)
    filteredResults.points.forEach((point, index) => {
      console.log(`  Profile ${index + 1}:`)
      console.log(`    ID: ${point.id}`)
      console.log(`    Name: ${point.payload.name || 'N/A'}`)
      console.log(`    Email: ${point.payload.email || 'N/A'}`)
      console.log(`    Skills: ${point.payload.skills ? point.payload.skills.join(', ') : 'N/A'}`)
      console.log(`    AI Score: ${point.payload.aiScore || 'N/A'}`)
    })
    
    console.log('\n4️⃣ Testing talent-specific search...')
    
    // Test search for specific skills
    const skillSearchResults = await client.scroll(collectionName, {
      filter: {
        must: [
          {
            key: 'skills',
            match: { any: ['React', 'JavaScript', 'TypeScript'] }
          }
        ]
      },
      limit: 3,
      with_payload: true
    })
    
    console.log(`Found ${skillSearchResults.points.length} candidates with React/JS/TS skills:`)
    skillSearchResults.points.forEach((point, index) => {
      console.log(`  Candidate ${index + 1}:`)
      console.log(`    Name: ${point.payload.name || 'N/A'}`)
      console.log(`    Skills: ${point.payload.skills ? point.payload.skills.join(', ') : 'N/A'}`)
    })
    
    console.log('\n🎉 Qdrant talent indexing test completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Set an applicant status to "For Sale" to trigger automatic indexing')
    console.log('2. Use the API endpoint /api/rag/index-talent for manual indexing')
    console.log('3. Search for talents using the enhanced RAG functions')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  }
}

testTalentIndexing().catch(console.error)
