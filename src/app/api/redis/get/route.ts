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
    
    // Parse JSON data
    const parsedData = JSON.parse(data)
    
    return NextResponse.json({ data: parsedData })
  } catch (error) {
    console.error('Redis get error:', error)
    return NextResponse.json({ error: 'Failed to get data from Redis' }, { status: 500 })
  }
}
