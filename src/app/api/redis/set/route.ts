import { NextRequest, NextResponse } from 'next/server'
import { connectRedis } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const { key, data, expiry = 3600 } = await request.json()
    
    if (!key || !data) {
      return NextResponse.json({ error: 'Key and data are required' }, { status: 400 })
    }

    // Connect to Redis using shared utility
    const redis = await connectRedis()
    
    // Store data in Redis with expiry
    await redis.setEx(key, expiry, JSON.stringify(data))
    
    return NextResponse.json({ success: true, message: 'Data stored in Redis successfully' })
  } catch (error) {
    console.error('Redis set error:', error)
    return NextResponse.json({ error: 'Failed to store data in Redis' }, { status: 500 })
  }
}
