import { NextRequest, NextResponse } from 'next/server'
import { getInternalUserByEmail } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    const role = request.nextUrl.searchParams.get('role') || ''
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const dbUser = await getInternalUserByEmail(email, role)
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found or not authorized' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      user: {
        id: dbUser.id.toString(),
        email: dbUser.email,
        userType: dbUser.user_type,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        profilePicture: dbUser.profile_picture,
        roleName: dbUser.role_name,
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