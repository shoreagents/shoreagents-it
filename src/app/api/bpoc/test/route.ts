import { NextResponse } from 'next/server'
import { getBpocApplicationsCount } from '@/lib/db-utils'

export async function GET() {
  try {
    console.log('🧪 Testing BPOC database connection')
    const applicationsCount = await getBpocApplicationsCount()
    return NextResponse.json({ message: 'BPOC database connection successful', applicationsCount, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('❌ BPOC database test failed:', error)
    return NextResponse.json({ 
      error: 'BPOC database test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
