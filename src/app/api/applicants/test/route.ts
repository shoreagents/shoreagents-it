import { NextResponse } from 'next/server'
import { bpocPool } from '@/lib/database'

export async function GET() {
  try {
    console.log('🧪 Testing BPOC database connection')
    
    if (!bpocPool) {
      console.log('❌ BPOC database is not configured')
      return NextResponse.json({ 
        error: 'BPOC database is not configured',
        bpocUrl: process.env.BPOC_DATABASE_URL ? 'Set' : 'Not set'
      }, { status: 500 })
    }

    // Test simple query
    const testQuery = 'SELECT COUNT(*) as count FROM public.applications'
    console.log('📊 Executing test query:', testQuery)
    
    const { rows } = await bpocPool.query(testQuery)
    console.log('✅ Test query successful:', rows[0])

    return NextResponse.json({ 
      message: 'BPOC database connection successful',
      applicationsCount: rows[0].count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ BPOC database test failed:', error)
    return NextResponse.json({ 
      error: 'BPOC database test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
