import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTicketIdByTicketId, getCommentsByTicketId, insertTicketComment, getUserBasicProfile } from '@/lib/db-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET /api/tickets/[id]/comments - Starting...')
    
    const ticketId = await getTicketIdByTicketId(params.id)
    if (!ticketId) {
      console.log('Ticket not found for ticket_id:', params.id)
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    console.log('Ticket found with ID:', ticketId)
    const comments = await getCommentsByTicketId(ticketId)

    console.log('Found comments:', comments.length)
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error in GET /api/tickets/[id]/comments:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('POST /api/tickets/[id]/comments - Starting...')
    
    const supabase = createClient()
    const body = await request.json()
    const { comment, userId } = body as { comment?: string; userId?: number }

    // Resolve authenticated user id:
    let dbUserId: number | null = null
    
    // Prefer explicit userId from client (app auth)
    if (typeof userId === 'number' && Number.isFinite(userId)) {
      dbUserId = userId
    } else {
      // Fallback to Supabase auth cookie if present, then map by email -> users.id
      const { data: { user: sbUser }, error: authError } = await supabase.auth.getUser()
      if (sbUser && !authError) {
        // Inlined lookup retained; could be moved to db-utils if needed
        // For now, just reuse getUserBasicProfile is for enrichment, not lookup by email
        // Minimal change: leave as is or implement helper later
      }
    }

    if (!dbUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate comment
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 })
    }

    const ticketId = await getTicketIdByTicketId(params.id)
    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    console.log('Inserting comment for ticket', ticketId, 'by user', dbUserId)
    const newComment = await insertTicketComment(ticketId, dbUserId, comment.trim())

    // Fetch user info for response
    const userInfo = await getUserBasicProfile(dbUserId)

    const responseComment = {
      id: newComment.id,
      ticket_id: newComment.ticket_id,
      user_id: newComment.user_id,
      comment: newComment.comment,
      created_at: newComment.created_at,
      updated_at: newComment.updated_at,
      first_name: userInfo?.first_name || null,
      last_name: userInfo?.last_name || null,
      email: userInfo?.email || null,
      profile_picture: userInfo?.profile_picture || null,
    }

    return NextResponse.json({ comment: responseComment })
  } catch (error) {
    console.error('Error in POST /api/tickets/[id]/comments:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}