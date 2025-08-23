import { NextResponse } from 'next/server'
import { checkRedisHealth } from '@/lib/redis'

export async function GET() {
  try {
    const isHealthy = await checkRedisHealth()
    
    if (isHealthy) {
      return NextResponse.json({ 
        status: 'healthy', 
        message: 'Redis connection is working',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ 
        status: 'unhealthy', 
        message: 'Redis connection failed',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
  } catch (error) {
    console.error('Redis health check error:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Redis health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
