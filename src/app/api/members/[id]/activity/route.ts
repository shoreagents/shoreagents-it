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

    // Fetch activity logs
    let activityQuery = `
      SELECT 
        mal.id,
        mal.member_id,
        mal.field_name,
        mal.old_value,
        mal.new_value,
        mal.action,
        mal.created_at,
        mal.user_id,
        COALESCE(pi.first_name || ' ' || pi.last_name, u.email) as user_name
      FROM public.members_activity_log mal
      LEFT JOIN public.users u ON mal.user_id = u.id
      LEFT JOIN public.personal_info pi ON u.id = pi.user_id
      WHERE mal.member_id = $1
    `

    if (action) {
      activityQuery += ` AND mal.action = $2`
    }

    // Fetch comments
    const commentsQuery = `
      SELECT 
        mc.id,
        mc.comment,
        mc.created_at,
        mc.user_id,
        COALESCE(pi.first_name || ' ' || pi.last_name, u.email) as user_name,
        pi.profile_picture
      FROM public.member_comments mc
      LEFT JOIN public.users u ON mc.user_id = u.id
      LEFT JOIN public.personal_info pi ON u.id = pi.user_id
      WHERE mc.member_id = $1
    `

    // Get total count for both activities and comments
    const countQuery = `
      SELECT 
        (SELECT COUNT(*) FROM public.members_activity_log WHERE member_id = $1 ${action ? 'AND action = $2' : ''}) as activity_count,
        (SELECT COUNT(*) FROM public.member_comments WHERE member_id = $1) as comment_count
    `
    
    const countResult = await pool.query(countQuery, action ? [memberId, action] : [memberId])
    const totalActivityCount = parseInt(countResult.rows[0]?.activity_count || '0', 10)
    const totalCommentCount = parseInt(countResult.rows[0]?.comment_count || '0', 10)
    const totalCount = totalActivityCount + totalCommentCount

    // Get ALL activities and comments for this member (we'll paginate after combining)
    const activityResult = await pool.query(activityQuery, action ? [memberId, action] : [memberId])
    const commentsResult = await pool.query(commentsQuery, [memberId])
    
    // Format activities
    const activities = activityResult.rows.map(row => ({
      id: `activity_${row.id}`,
      type: 'activity' as const,
      action: row.action,
      fieldName: row.field_name,
      oldValue: row.old_value,
      newValue: row.new_value,
      createdAt: row.created_at,
      userName: row.user_name,
      userId: row.user_id
    }))
    
    // Format comments
    const comments = commentsResult.rows.map(row => ({
      id: `comment_${row.id}`,
      type: 'comment' as const,
      comment: row.comment,
      createdAt: row.created_at,
      userName: row.user_name,
      userId: row.user_id,
      profilePicture: row.profile_picture
    }))
    
    // Combine and sort by timestamp (oldest first - chronological order)
    const allEntries = [...activities, ...comments].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    // Apply pagination to combined results
    const paginatedEntries = allEntries.slice(offset, offset + limit)
    
    // Debug logging
    console.log('🔍 Activity logs found:', activities.length)
    console.log('🔍 Comments found:', comments.length)
    console.log('🔍 Total combined entries:', allEntries.length)
    console.log('🔍 Paginated entries:', paginatedEntries.length)

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      entries: paginatedEntries,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        activityCount: totalActivityCount,
        commentCount: totalCommentCount
      }
    })

  } catch (error) {
    console.error('Error fetching member activity and comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member activity and comments' },
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
