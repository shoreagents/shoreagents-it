import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Simple count query for today's events (no role filtering since events doesn't have role_id)
    const countQuery = `
      SELECT COUNT(*) as count
      FROM events 
      WHERE status = 'today'
    `
    
    console.log('Events count query:', countQuery)
    
    const result = await pool.query(countQuery)
    const todayCount = parseInt(result.rows[0]?.count || '0')
    
    return NextResponse.json({ today: todayCount })
  } catch (error) {
    console.error('Error fetching today event count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today event count' },
      { status: 500 }
    )
  }
}
