import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get count for active (today) announcements only
    const countQuery = `
      SELECT COUNT(*) as count
      FROM announcements 
      WHERE status = 'active'
    `
    
    const result = await pool.query(countQuery)
    const activeCount = parseInt(result.rows[0]?.count || '0')
    
    return NextResponse.json({ active: activeCount })
  } catch (error) {
    console.error('Error fetching active announcements count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active announcements count' },
      { status: 500 }
    )
  }
}
