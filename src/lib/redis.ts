import { createClient } from 'redis'

// Redis client configuration
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000,
    lazyConnect: true,
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.error('Redis max reconnection attempts reached')
        return new Error('Redis max reconnection attempts reached')
      }
      return Math.min(retries * 100, 3000)
    }
  }
}

// Create Redis client
let redis: ReturnType<typeof createClient> | null = null

// Get Redis client (singleton pattern)
export const getRedisClient = () => {
  if (!redis) {
    redis = createClient(redisConfig)
    
    // Error handling
    redis.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })
    
    redis.on('connect', () => {
      console.log('Redis Client Connected')
    })
    
    redis.on('ready', () => {
      console.log('Redis Client Ready')
    })
    
    redis.on('end', () => {
      console.log('Redis Client Disconnected')
    })
  }
  
  return redis
}

// Connect to Redis
export const connectRedis = async () => {
  const client = getRedisClient()
  
  if (!client.isOpen) {
    try {
      await client.connect()
      console.log('Connected to Redis successfully')
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      throw error
    }
  }
  
  return client
}

// Disconnect from Redis
export const disconnectRedis = async () => {
  if (redis && redis.isOpen) {
    try {
      await redis.disconnect()
      console.log('Disconnected from Redis')
    } catch (error) {
      console.error('Failed to disconnect from Redis:', error)
    }
  }
}

// Health check
export const checkRedisHealth = async () => {
  try {
    const client = await connectRedis()
    await client.ping()
    return true
  } catch (error) {
    console.error('Redis health check failed:', error)
    return false
  }
}
