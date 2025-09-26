import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authSession = request.cookies.get('auth_session')

    if (!authSession) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Parse session data with error handling
    let sessionData
    try {
      sessionData = JSON.parse(authSession.value)
    } catch (parseError) {
      console.error('JSON parse error for auth session:', parseError)
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 401 }
      )
    }

    if (!sessionData.isAuthenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: sessionData
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 