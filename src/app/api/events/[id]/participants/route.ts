import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = parseInt(id)
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      )
    }

    // Get participants for the event based on event_attendance (users who are going)
    const participantsQuery = `
      SELECT 
        u.id as user_id,
        pi.first_name,
        pi.last_name,
        pi.profile_picture,
        ji.employee_id
      FROM event_attendance ea
      JOIN users u ON ea.user_id = u.id
      LEFT JOIN personal_info pi ON u.id = pi.user_id
      LEFT JOIN job_info ji ON u.id = ji.agent_user_id OR u.id = ji.internal_user_id
      WHERE ea.event_id = $1 AND ea.is_going = true
      ORDER BY pi.first_name, pi.last_name
    `

    const result = await pool.query(participantsQuery, [eventId])
    
    return NextResponse.json({
      participants: result.rows
    })
  } catch (error) {
    console.error('Error fetching event participants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    )
  }
}
