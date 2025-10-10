import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id)
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    // For now, return empty comments since we don't have an events_comments table yet
    // This would be implemented similar to companies_comments
    const comments = []

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching event comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id)
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const { comment, user_id } = await request.json()

    if (!comment || !user_id) {
      return NextResponse.json({ error: 'Comment and user_id are required' }, { status: 400 })
    }

    // For now, return success since we don't have an events_comments table yet
    // This would be implemented similar to companies_comments
    const newComment = {
      id: Date.now().toString(),
      comment,
      user_name: 'User', // Would be fetched from users table
      created_at: new Date().toISOString()
    }

    return NextResponse.json({ comment: newComment })
  } catch (error) {
    console.error('Error creating event comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
