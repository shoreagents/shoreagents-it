import { NextRequest, NextResponse } from 'next/server'
import { getEventsPaginated, createEvent } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const eventType = searchParams.get('eventType') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortField = searchParams.get('sortField') || 'event_date'
    const sortDirection = searchParams.get('sortDirection') || 'asc'

    const result = await getEventsPaginated({
      search,
      status,
      eventType,
      page,
      limit,
      sortField,
      sortDirection
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      event_date, 
      start_time, 
      end_time, 
      location, 
      event_type, 
      status,
      assigned_user_ids,
      created_by 
    } = body

    const event = await createEvent({
      title,
      description,
      event_date,
      start_time,
      end_time,
      location,
      event_type,
      status,
      assigned_user_ids,
      created_by
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
