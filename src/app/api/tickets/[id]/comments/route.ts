import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import pool from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET /api/tickets/[id]/comments - Starting...')
    
    // Get the ticket's numeric ID from the Railway database
    const ticketQuery = `
      SELECT id FROM tickets WHERE ticket_id = $1
    `
    const ticketResult = await pool.query(ticketQuery, [params.id])
    
    if (ticketResult.rows.length === 0) {
      console.log('Ticket not found for ticket_id:', params.id)
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    
    const ticket = ticketResult.rows[0]
    console.log('Ticket found with ID:', ticket.id)
    
    // Get comments for the ticket with user information using Railway database
    const query = `
      SELECT 
        tc.id,
        tc.ticket_id,
        tc.user_id,
        tc.comment,
        tc.created_at,
        tc.updated_at,
        u.email,
        pi.first_name,
        pi.last_name,
        pi.profile_picture
      FROM ticket_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      LEFT JOIN personal_info pi ON u.id = pi.user_id
      WHERE tc.ticket_id = $1
      ORDER BY tc.created_at ASC
    `
    
    const result = await pool.query(query, [ticket.id])
    const comments = result.rows || []

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
        const userLookup = await pool.query('SELECT id FROM users WHERE email = $1', [sbUser.email])
        if (userLookup.rows.length > 0) {
          dbUserId = userLookup.rows[0].id
        }
      }
    }

    if (!dbUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate comment
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 })
    }

    // Get the ticket's numeric ID from the Railway database
    const ticketQuery = 'SELECT id FROM tickets WHERE ticket_id = $1'
    const ticketResult = await pool.query(ticketQuery, [params.id])
    if (ticketResult.rows.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    const ticket = ticketResult.rows[0]

    console.log('Inserting comment for ticket', ticket.id, 'by user', dbUserId)

    // Insert comment
    const insertQuery = `
      INSERT INTO ticket_comments (ticket_id, user_id, comment)
      VALUES ($1, $2, $3)
      RETURNING id, ticket_id, user_id, comment, created_at, updated_at
    `
    const result = await pool.query(insertQuery, [ticket.id, dbUserId, comment.trim()])
    const newComment = result.rows[0]

    // Fetch user info for response
    const userQuery = `
      SELECT u.id, u.email, pi.first_name, pi.last_name, pi.profile_picture
      FROM users u
      LEFT JOIN personal_info pi ON u.id = pi.user_id
      WHERE u.id = $1
    `
    const userResult = await pool.query(userQuery, [dbUserId])
    const userInfo = userResult.rows[0]

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