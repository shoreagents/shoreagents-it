import { NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET() {
  try {
    // Test users table
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) as user_count,
        COUNT(pi.id) as users_with_profile
      FROM users u
      LEFT JOIN personal_info pi ON u.id = pi.user_id
    `)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Users table accessible',
      totalUsers: parseInt(rows[0].user_count),
      usersWithProfile: parseInt(rows[0].users_with_profile)
    })
  } catch (error) {
    console.error('Users table test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Users table test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 