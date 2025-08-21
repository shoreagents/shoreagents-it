import { NextResponse } from 'next/server'
import { getBpocDebugInfo } from '@/lib/db-utils'

export async function GET() {
  try {
    console.log('🐛 Debug endpoint called')
    const info = await getBpocDebugInfo()
    if ((info as any).error) {
      return NextResponse.json({ ...(info as any), timestamp: new Date().toISOString() }, { status: 500 })
    }
    return NextResponse.json({ ...(info as any), timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('❌ Debug failed:', error)
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
