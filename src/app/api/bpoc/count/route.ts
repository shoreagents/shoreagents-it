import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    
    if (!statusParam) {
      return NextResponse.json(
        { error: 'Status parameter is required' },
        { status: 400 }
      )
    }

    // Simple count query for BPOC applicants (no role filtering since bpoc_recruits doesn't have role_id)
    const countQuery = `
      SELECT COUNT(*) as count
      FROM bpoc_recruits r
      WHERE r.status = $1
    `
    
    console.log('BPOC count query:', countQuery, 'Status:', statusParam)
    
    const result = await pool.query(countQuery, [statusParam])
    const count = parseInt(result.rows[0]?.count || '0')
    
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching BPOC count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch BPOC count' },
      { status: 500 }
    )
  }
}
