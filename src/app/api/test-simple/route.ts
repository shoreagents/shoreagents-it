import { NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET() {
  try {
    console.log('Testing simple database connection...')
    
    // Simple test query
    const result = await pool.query('SELECT 1 as test')
    
    console.log('Database test successful:', result.rows[0])
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection working',
      test: result.rows[0].test
    })
  } catch (error) {
    console.error('Simple database test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 