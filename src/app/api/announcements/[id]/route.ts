import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

// GET /api/announcements/[id] - Get specific announcement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid announcement ID' },
        { status: 400 }
      )
    }

    const query = `
      SELECT 
        id,
        title,
        message,
        priority,
        status,
        scheduled_at,
        expires_at,
        sent_at,
        assigned_user_ids,
        allow_dismiss,
        created_at,
        updated_at,
        created_by
      FROM announcements
      WHERE id = $1
    `

    const result = await pool.query(query, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching announcement:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcement' },
      { status: 500 }
    )
  }
}

// PUT /api/announcements/[id] - Update announcement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid announcement ID' },
        { status: 400 }
      )
    }

    // Check if announcement exists
    const checkQuery = 'SELECT id, scheduled_at, created_at FROM announcements WHERE id = $1'
    const checkResult = await pool.query(checkQuery, [id])
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    // Build dynamic update query
    const updateFields: string[] = []
    const values: any[] = []
    let paramCount = 0

    if (body.title !== undefined) {
      paramCount++
      updateFields.push(`title = $${paramCount}`)
      values.push(body.title)
    }

    if (body.message !== undefined) {
      paramCount++
      updateFields.push(`message = $${paramCount}`)
      values.push(body.message)
    }

    if (body.priority !== undefined) {
      if (!['low', 'medium', 'high', 'urgent'].includes(body.priority)) {
        return NextResponse.json(
          { error: 'Invalid priority. Must be one of: low, medium, high, urgent' },
          { status: 400 }
        )
      }
      paramCount++
      updateFields.push(`priority = $${paramCount}`)
      values.push(body.priority)
    }

    if (body.status !== undefined) {
      if (!['draft', 'scheduled', 'active', 'expired', 'cancelled'].includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: draft, scheduled, active, expired, cancelled' },
          { status: 400 }
        )
      }
      paramCount++
      updateFields.push(`status = $${paramCount}`)
      values.push(body.status)
    }

    if (body.scheduled_at !== undefined) {
      // Validate scheduled_at constraint: scheduled_at must be after created_at
      const currentAnnouncement = checkResult.rows[0]
      const scheduledAt = body.scheduled_at
      
      if (scheduledAt && currentAnnouncement.created_at && new Date(scheduledAt) <= new Date(currentAnnouncement.created_at)) {
        return NextResponse.json(
          { error: 'Scheduled date must be after the creation date' },
          { status: 400 }
        )
      }
      
      paramCount++
      updateFields.push(`scheduled_at = $${paramCount}`)
      values.push(body.scheduled_at || null)
    }

    if (body.expires_at !== undefined) {
      // Validate expires_at constraint: expires_at must be after scheduled_at
      const scheduledAt = body.scheduled_at !== undefined ? body.scheduled_at : checkResult.rows[0]?.scheduled_at
      const expiresAt = body.expires_at
      
      if (expiresAt && scheduledAt && new Date(expiresAt) <= new Date(scheduledAt)) {
        return NextResponse.json(
          { error: 'Expiry date must be after the scheduled date' },
          { status: 400 }
        )
      }
      
      paramCount++
      updateFields.push(`expires_at = $${paramCount}`)
      values.push(body.expires_at || null)
    }

    if (body.assigned_user_ids !== undefined) {
      if (!Array.isArray(body.assigned_user_ids)) {
        return NextResponse.json(
          { error: 'assigned_user_ids must be an array' },
          { status: 400 }
        )
      }
      paramCount++
      updateFields.push(`assigned_user_ids = $${paramCount}`)
      values.push(body.assigned_user_ids)
    }

    if (body.allow_dismiss !== undefined) {
      paramCount++
      updateFields.push(`allow_dismiss = $${paramCount}`)
      values.push(body.allow_dismiss)
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Add updated_at and id
    paramCount++
    updateFields.push(`updated_at = $${paramCount}`)
    values.push(new Date())
    
    paramCount++
    values.push(id)

    const query = `
      UPDATE announcements 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await pool.query(query, values)
    
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    )
  }
}

// DELETE /api/announcements/[id] - Delete announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid announcement ID' },
        { status: 400 }
      )
    }

    // Check if announcement exists and get its status
    const checkQuery = 'SELECT id, status FROM announcements WHERE id = $1'
    const checkResult = await pool.query(checkQuery, [id])
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    const announcement = checkResult.rows[0]
    
    // If announcement is scheduled, cancel it instead of deleting
    if (announcement.status === 'scheduled') {
      const updateQuery = `
        UPDATE announcements 
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `
      const result = await pool.query(updateQuery, [id])
      
      return NextResponse.json({ 
        message: 'Scheduled announcement cancelled successfully',
        announcement: result.rows[0]
      })
    }
    
    // For other statuses, actually delete the announcement
    const deleteQuery = 'DELETE FROM announcements WHERE id = $1'
    await pool.query(deleteQuery, [id])
    
    return NextResponse.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    )
  }
}