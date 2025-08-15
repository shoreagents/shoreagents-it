import { NextResponse } from 'next/server'
import pool from '@/lib/database'

// GET: Retrieve comments for a specific recruit
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const recruitId = searchParams.get('recruitId')
    
    if (!recruitId) {
      return NextResponse.json({ error: 'Recruit ID is required' }, { status: 400 })
    }

    console.log('🔍 Fetching comments for recruit:', recruitId)

         const query = `
               SELECT 
          rc.id,
          rc.recruit_id,
          rc.user_id,
          rc.comments,
          rc.created_at,
          rc.updated_at
       FROM public.recruit_comments rc
       WHERE rc.recruit_id = $1
       ORDER BY rc.created_at DESC
     `

    const { rows } = await pool.query(query, [recruitId])
    console.log('✅ Comments fetched successfully:', rows.length, 'comments')

    return NextResponse.json({ comments: rows })
  } catch (error) {
    console.error('❌ Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

  // POST: Add a new comment
  export async function POST(request: Request) {
    try {
      const { recruitId, userId, commentText } = await request.json()

      if (!recruitId || !userId || !commentText) {
        return NextResponse.json({ 
          error: 'Recruit ID, User ID, and comment text are required' 
        }, { status: 400 })
      }

      console.log('📝 Adding new comment:', { recruitId, userId })

      const query = `
        INSERT INTO public.recruit_comments (
          recruit_id, user_id, comments
        ) VALUES ($1, $2, $3)
        RETURNING id, recruit_id, user_id, comments, created_at
      `

      const { rows } = await pool.query(query, [recruitId, userId, commentText])
      console.log('✅ Comment added successfully:', rows[0])

      return NextResponse.json({ comment: rows[0] })
    } catch (error) {
      console.error('❌ Error adding comment:', error)
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
    }
  }

  // PUT: Update an existing comment
  export async function PUT(request: Request) {
    try {
      const { commentId, commentText } = await request.json()

      if (!commentId || !commentText) {
        return NextResponse.json({ 
          error: 'Comment ID and comment text are required' 
        }, { status: 400 })
      }

      console.log('✏️ Updating comment:', commentId)

      const query = `
        UPDATE public.recruit_comments 
        SET 
          comments = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, recruit_id, user_id, comments, updated_at
      `

      const { rows } = await pool.query(query, [commentText, commentId])
      
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      }

      console.log('✅ Comment updated successfully:', rows[0])
      return NextResponse.json({ comment: rows[0] })
    } catch (error) {
      console.error('❌ Error updating comment:', error)
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }
  }

  // DELETE: Permanently delete a comment
  export async function DELETE(request: Request) {
    try {
      const { searchParams } = new URL(request.url)
      const commentId = searchParams.get('commentId')
      
      if (!commentId) {
        return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
      }

      console.log('🗑️ Deleting comment:', commentId)

      const query = `
        DELETE FROM public.recruit_comments 
        WHERE id = $1
        RETURNING id
      `

      const { rows } = await pool.query(query, [commentId])
      
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      }

      console.log('✅ Comment deleted successfully:', rows[0])
      return NextResponse.json({ success: true, comment: rows[0] })
    } catch (error) {
      console.error('❌ Error deleting comment:', error)
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }
  }
