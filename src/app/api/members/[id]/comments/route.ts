import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get comments for the member with user names
    const result = await pool.query(`
      SELECT 
        mc.id,
        mc.comment,
        mc.created_at,
        mc.updated_at,
        pi.first_name,
        pi.last_name
      FROM public.member_comments mc
      LEFT JOIN public.personal_info pi ON mc.user_id = pi.user_id
      WHERE mc.member_id = $1
      ORDER BY mc.created_at DESC
    `, [params.id])

    // Transform the data to match the expected format
    const transformedComments = result.rows.map(comment => ({
      id: comment.id,
      comment: comment.comment,
      user_name: comment.first_name && comment.last_name 
        ? `${comment.first_name} ${comment.last_name}`.trim() 
        : comment.first_name || comment.last_name || 'Unknown User',
      created_at: comment.created_at
    }))

    return NextResponse.json({ comments: transformedComments })
  } catch (error) {
    console.error('Error in comments GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { comment, user_id } = await request.json()

    if (!comment?.trim() || !user_id) {
      return NextResponse.json({ error: 'Comment and user_id are required' }, { status: 400 })
    }

    // Insert the comment
    const result = await pool.query(`
      INSERT INTO public.member_comments (member_id, user_id, comment)
      VALUES ($1, $2, $3)
      RETURNING id, member_id, user_id, comment, created_at, updated_at
    `, [params.id, user_id, comment.trim()])

    if (result.rows.length === 0) {
      throw new Error('Failed to insert comment')
    }

    return NextResponse.json({ success: true, comment: result.rows[0] })
  } catch (error) {
    console.error('Error in comments POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
