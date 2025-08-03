import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Query to get user data from Railway PostgreSQL
    const userQuery = `
      SELECT 
        u.id,
        u.email,
        u.user_type,
        pi.first_name,
        pi.last_name,
        pi.profile_picture,
        ir.role_id
      FROM users u
      LEFT JOIN personal_info pi ON u.id = pi.user_id
      LEFT JOIN internal i ON u.id = i.user_id
      LEFT JOIN internal_roles ir ON i.user_id = ir.internal_user_id
      WHERE u.email = $1 
        AND i.user_id IS NOT NULL 
        AND (ir.role_id = 1 OR ir.role_id = (SELECT id FROM roles WHERE name = 'IT'))
    `

    const userResult = await pool.query(userQuery, [email])

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found or not authorized' },
        { status: 404 }
      )
    }

    const dbUser = userResult.rows[0]
    
    return NextResponse.json({
      user: {
        id: dbUser.id.toString(),
        email: dbUser.email,
        userType: dbUser.user_type,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        profilePicture: dbUser.profile_picture,
        isAuthenticated: true
      }
    })

  } catch (error) {
    console.error('User data fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 