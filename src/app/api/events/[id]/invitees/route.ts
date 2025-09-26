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

    const { searchParams } = new URL(request.url)
    const userIdsParam = searchParams.get('userIds')
    
    if (!userIdsParam) {
      return NextResponse.json({
        invitees: []
      })
    }

    const userIds = userIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    
    if (userIds.length === 0) {
      return NextResponse.json({
        invitees: []
      })
    }

    // Get invitees for the event based on assigned_user_ids
    const inviteesQuery = `
      SELECT 
        u.id as user_id,
        pi.first_name,
        pi.last_name,
        pi.profile_picture,
        ji.employee_id
      FROM users u
      LEFT JOIN personal_info pi ON u.id = pi.user_id
      LEFT JOIN job_info ji ON u.id = ji.agent_user_id OR u.id = ji.internal_user_id
      WHERE u.id = ANY($1)
      ORDER BY pi.first_name, pi.last_name
    `

    const result = await pool.query(inviteesQuery, [userIds])
    
    return NextResponse.json({
      invitees: result.rows
    })
  } catch (error) {
    console.error('Error fetching event invitees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitees' },
      { status: 500 }
    )
  }
}
