import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set'
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Environment variables check',
      environment: envVars
    })
  } catch (error) {
    console.error('Environment check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Environment check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 