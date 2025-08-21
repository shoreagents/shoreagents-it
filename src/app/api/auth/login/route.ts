import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getInternalLoginUserByEmail } from '@/lib/db-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Now check if user exists in our database and has proper roles
    const dbUser = await getInternalLoginUserByEmail(email)
    if (!dbUser) {
      // Logout from Supabase if user doesn't exist in our database
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'User not found or not authorized' },
        { status: 401 }
      )
    }

    // Create session data (in a real app, you'd use JWT or session management)
    const sessionData = {
      id: dbUser.id,
      email: dbUser.email,
      userType: dbUser.user_type,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      profilePicture: dbUser.profile_picture,
      isAuthenticated: true
    }

    // Set a cookie for session management
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: sessionData
      },
      { status: 200 }
    )

    // Set HTTP-only cookie for session
    response.cookies.set('auth_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 