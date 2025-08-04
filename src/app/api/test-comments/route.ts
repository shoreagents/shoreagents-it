import { NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET() {
  try {
    // Test ticket_comments table
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) as comment_count,
        MAX(created_at) as latest_comment
      FROM ticket_comments
    `)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Comments table accessible',
      commentCount: parseInt(rows[0].comment_count),
      latestComment: rows[0].latest_comment
    })
  } catch (error) {
    console.error('Comments table test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Comments table test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 