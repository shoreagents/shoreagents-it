import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id)
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      )
    }

    // Get participants for the event based on assigned_user_ids
    const participantsQuery = `
      SELECT 
        u.id as user_id,
        pi.first_name,
        pi.last_name,
        pi.profile_picture,
        pi.employee_id
      FROM events e
      JOIN unnest(e.assigned_user_ids) AS user_id ON true
      JOIN users u ON u.id = user_id
      LEFT JOIN personal_info pi ON u.id = pi.user_id
      WHERE e.id = $1 AND e.assigned_user_ids IS NOT NULL
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
