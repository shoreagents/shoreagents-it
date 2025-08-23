const { createClient } = require('redis')
require('dotenv').config({ path: '.env.local' })

async function checkRedisData() {
  console.log('🔍 Checking Redis data for company editing sessions...')
  console.log('REDIS_URL:', process.env.REDIS_URL || 'Not set')
  
  if (!process.env.REDIS_URL) {
    console.error('❌ REDIS_URL environment variable not set!')
    return
  }

  const redis = createClient({
    url: process.env.REDIS_URL,
    socket: {
      connectTimeout: 10000,
      lazyConnect: true,
    }
  })

  try {
    console.log('📡 Connecting to Redis...')
    await redis.connect()
    console.log('✅ Connected to Redis successfully!')
    
    // Get all keys
    console.log('\n🔑 Searching for company edit sessions...')
    const keys = await redis.keys('company_edit:*')
    
    if (keys.length === 0) {
      console.log('📭 No company edit sessions found in Redis')
      return
    }
    
    console.log(`📊 Found ${keys.length} company edit session(s):`)
    
    for (const key of keys) {
      console.log(`\n--- Session: ${key} ---`)
      
      // Get the data
      const data = await redis.get(key)
      if (data) {
        const parsedData = JSON.parse(data)
        
        // Check TTL
        const ttl = await redis.ttl(key)
        const expiresIn = ttl > 0 ? `${ttl} seconds` : 'No expiry'
        
        console.log(`⏰ Expires in: ${expiresIn}`)
        console.log(`🏢 Company: ${parsedData.company || 'N/A'}`)
        console.log(`👥 Selected Agents: ${parsedData.selectedAgentIds?.length || 0}`)
        console.log(`👤 Selected Clients: ${parsedData.selectedClientIds?.length || 0}`)
        
        if (parsedData.selectedAgentIds?.length > 0) {
          console.log(`   Agent IDs: ${parsedData.selectedAgentIds.join(', ')}`)
        }
        
        if (parsedData.selectedClientIds?.length > 0) {
          console.log(`   Client IDs: ${parsedData.selectedClientIds.join(', ')}`)
        }
        
        // Show last save time if available
        if (parsedData.lastRedisSave) {
          console.log(`💾 Last Redis Save: ${new Date(parsedData.lastRedisSave).toLocaleString()}`)
        }
        
        if (parsedData.lastDatabaseSync) {
          console.log(`🗄️ Last DB Sync: ${new Date(parsedData.lastDatabaseSync).toLocaleString()}`)
        }
        
      } else {
        console.log('❌ No data found for this key')
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking Redis data:', error.message)
  } finally {
    if (redis.isOpen) {
      await redis.disconnect()
      console.log('🔌 Disconnected from Redis')
    }
  }
}

checkRedisData()
