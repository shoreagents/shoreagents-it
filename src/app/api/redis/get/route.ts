import { NextRequest, NextResponse } from 'next/server'
import { connectRedis } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    // Connect to Redis using shared utility
    const redis = await connectRedis()
    
    // Get data from Redis
    const data = await redis.get(key)
    
    if (!data) {
      return NextResponse.json({ data: null })
    }
    
    // Parse JSON data with error handling
    let parsedData
    try {
      parsedData = JSON.parse(data)
    } catch (parseError) {
      console.error('JSON parse error for Redis data:', parseError)
      return NextResponse.json({ error: 'Invalid JSON data in Redis' }, { status: 500 })
    }
    
    return NextResponse.json({ data: parsedData })
  } catch (error) {
    console.error('Redis get error:', error)
    return NextResponse.json({ error: 'Failed to get data from Redis' }, { status: 500 })
  }
}
