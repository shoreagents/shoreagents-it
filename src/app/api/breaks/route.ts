import { NextRequest, NextResponse } from 'next/server'
import { getBreakSessions, getBreakStats } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const date = searchParams.get('date')

    console.log('📊 API: Fetching break sessions for companyId:', companyId, 'date:', date)

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const breakSessions = await getBreakSessions(companyId, date!)
    const stats = await getBreakStats(companyId, date!)

    return NextResponse.json({ breakSessions, stats })

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch break sessions' },
      { status: 500 }
    )
  }
}