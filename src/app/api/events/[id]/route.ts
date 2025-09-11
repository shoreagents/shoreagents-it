import { NextRequest, NextResponse } from 'next/server'
import { updateEvent, deleteEvent } from '@/lib/db-utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id)
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      event_date, 
      start_time, 
      end_time, 
      location, 
      status, 
      event_type, 
      assigned_user_ids 
    } = body

    const event = await updateEvent(eventId, {
      title,
      description,
      event_date,
      start_time,
      end_time,
      location,
      status,
      event_type,
      assigned_user_ids
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id)
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      )
    }

    await deleteEvent(eventId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
