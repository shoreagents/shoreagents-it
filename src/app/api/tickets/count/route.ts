import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    const adminParam = searchParams.get('admin')
    
    if (!statusParam) {
      return NextResponse.json(
        { error: 'Status parameter is required' },
        { status: 400 }
      )
    }

    const isAdmin = adminParam === 'true'
    
    // Build count query based on status and role
    let countQuery = `
      SELECT COUNT(*) as count
      FROM tickets t
      WHERE t.status = $1
    `
    
    const queryParams = [statusParam]
    
    // Add role filter for non-admin users
    if (!isAdmin) {
      countQuery += ` AND t.role_id = 1`
    }
    
    // Add filter to hide cleared closed tickets
    if (statusParam === 'Closed') {
      countQuery += ` AND t.clear = false`
    }
    
    console.log('Tickets count query:', countQuery, 'Params:', queryParams)
    
    const result = await pool.query(countQuery, queryParams)
    const count = parseInt(result.rows[0]?.count || '0')
    
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching tickets count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets count' },
      { status: 500 }
    )
  }
}
