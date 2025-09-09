import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/database'

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

    let query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.event_date,
        e.start_time,
        e.end_time,
        e.location,
        e.status,
        e.event_type,
        e.created_by,
        e.created_at,
        e.updated_at,
        u.first_name,
        u.last_name,
        COUNT(ea.id) as participants_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN event_attendance ea ON e.id = ea.event_id AND ea.is_going = true
    `

    const conditions = []
    const params = []

    if (search) {
      conditions.push(`(e.title ILIKE $${params.length + 1} OR e.description ILIKE $${params.length + 1} OR e.location ILIKE $${params.length + 1})`)
      params.push(`%${search}%`)
    }

    if (status) {
      conditions.push(`e.status = $${params.length + 1}`)
      params.push(status)
    }

    if (eventType) {
      conditions.push(`e.event_type = $${params.length + 1}`)
      params.push(eventType)
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` GROUP BY e.id, u.first_name, u.last_name`

    // Add sorting
    const validSortFields = ['event_date', 'title', 'status', 'created_at']
    const sortFieldSafe = validSortFields.includes(sortField) ? sortField : 'event_date'
    const sortDirectionSafe = sortDirection.toLowerCase() === 'desc' ? 'DESC' : 'ASC'
    query += ` ORDER BY e.${sortFieldSafe} ${sortDirectionSafe}`

    // Add pagination
    const offset = (page - 1) * limit
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await pool.query(query, params)
    const events = result.rows

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM events e
    `
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`
    }

    const countResult = await pool.query(countQuery, params.slice(0, -2)) // Remove limit and offset params
    const totalCount = parseInt(countResult.rows[0].total)

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
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
    const { title, description, event_date, start_time, end_time, location, event_type, created_by } = body

    const query = `
      INSERT INTO events (title, description, event_date, start_time, end_time, location, event_type, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `

    const result = await pool.query(query, [
      title,
      description,
      event_date,
      start_time,
      end_time,
      location,
      event_type || 'event',
      created_by
    ])

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
