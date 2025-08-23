const { createClient } = require('redis')
require('dotenv').config({ path: '.env.local' })

async function testRedisConnection() {
  console.log('🔍 Testing Redis connection...')
  console.log('REDIS_URL:', process.env.REDIS_URL || 'Not set')
  
  if (!process.env.REDIS_URL) {
    console.error('❌ REDIS_URL environment variable not set!')
    console.log('Please add REDIS_URL to your .env.local file')
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
    
    // Test basic operations
    console.log('🧪 Testing Redis operations...')
    
    // Set a test key
    await redis.set('test:connection', 'Hello from Railway Redis!', 'EX', 60)
    console.log('✅ Set test key successfully')
    
    // Get the test key
    const value = await redis.get('test:connection')
    console.log('✅ Get test key successfully:', value)
    
    // Delete the test key
    await redis.del('test:connection')
    console.log('✅ Delete test key successfully')
    
    // Test ping
    const pong = await redis.ping()
    console.log('✅ Ping successful:', pong)
    
    console.log('🎉 All Redis tests passed!')
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message)
    console.log('\n🔧 Troubleshooting tips:')
    console.log('1. Check your REDIS_URL in .env.local')
    console.log('2. Verify Railway Redis service is running')
    console.log('3. Check if your IP is whitelisted (if required)')
    console.log('4. Verify username/password in connection string')
  } finally {
    if (redis.isOpen) {
      await redis.disconnect()
      console.log('🔌 Disconnected from Redis')
    }
  }
}

testRedisConnection()
