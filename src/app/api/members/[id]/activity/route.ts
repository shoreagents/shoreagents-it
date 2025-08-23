import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import pool from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const memberId = parseInt(id, 10)
    
    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })
    }

    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const action = searchParams.get('action') || null
    const offset = (page - 1) * limit

    // Build the query
    let query = `
      SELECT 
        mal.id,
        mal.member_id,
        mal.field_name,
        mal.old_value,
        mal.new_value,
        mal.action,
        mal.created_at,
        u.first_name || ' ' || u.last_name as user_name
      FROM public.members_activity_log mal
      LEFT JOIN public.users u ON mal.user_id = u.id
      WHERE mal.member_id = $1
    `
    
    const queryParams: any[] = [memberId]
    let paramIndex = 1

    if (action) {
      paramIndex++
      query += ` AND mal.action = $${paramIndex}`
      queryParams.push(action)
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM public.members_activity_log mal
      WHERE mal.member_id = $1
      ${action ? 'AND mal.action = $2' : ''}
    `
    
    const countResult = await pool.query(countQuery, action ? [memberId, action] : [memberId])
    const totalCount = parseInt(countResult.rows[0]?.total || '0', 10)

    // Get paginated results
    query += ` ORDER BY mal.created_at DESC LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`
    queryParams.push(limit, offset)

    const result = await pool.query(query, queryParams)
    
    // Format the response
    const activities = result.rows.map(row => ({
      id: row.id,
      action: row.action,
      fieldName: row.field_name,
      oldValue: row.old_value,
      newValue: row.new_value,
      createdAt: row.created_at,
      userName: row.user_name
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    })

  } catch (error) {
    console.error('Error fetching member activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member activity' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const memberId = parseInt(id, 10)
    
    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })
    }

    const { action, fieldName, oldValue, newValue, userId } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // Insert custom activity log entry
    const result = await pool.query(`
      INSERT INTO public.members_activity_log (
        member_id, field_name, action, old_value, new_value, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [memberId, fieldName || '', action, oldValue || null, newValue || null, userId || null])

    return NextResponse.json({
      success: true,
      logId: result.rows[0].id
    })

  } catch (error) {
    console.error('Error creating activity log:', error)
    return NextResponse.json(
      { error: 'Failed to create activity log' },
      { status: 500 }
    )
  }
}
