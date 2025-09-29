import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

// POST /api/announcements/[id]/send - Send announcement
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid announcement ID' },
        { status: 400 }
      )
    }

    // Get announcement details
    const announcementQuery = `
      SELECT id, title, message, priority, status, assigned_user_ids
      FROM announcements 
      WHERE id = $1
    `
    const announcementResult = await pool.query(announcementQuery, [id])
    
    if (announcementResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    const announcement = announcementResult.rows[0]

    // Check if announcement is in draft status
    if (announcement.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft announcements can be sent' },
        { status: 400 }
      )
    }

    // Update announcement status to active and set sent_at
    const updateQuery = `
      UPDATE announcements 
      SET status = 'active', sent_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `
    
    const updateResult = await pool.query(updateQuery, [id])
    
    // Call the database function to send notifications
    await pool.query('SELECT send_announcement($1)', [id])
    
    return NextResponse.json({
      message: 'Announcement sent successfully',
      announcement: updateResult.rows[0]
    })
  } catch (error) {
    console.error('Error sending announcement:', error)
    return NextResponse.json(
      { error: 'Failed to send announcement' },
      { status: 500 }
    )
  }
}
