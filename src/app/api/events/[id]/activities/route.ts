import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id)
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    // For now, return empty activities since we don't have an events_activity_log table yet
    // This would be implemented similar to companies_activity_log
    const activities = []

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching event activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
