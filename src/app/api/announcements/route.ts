import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

// GET /api/announcements - Get all announcements with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build the base query
    let query = `
      SELECT 
        id,
        title,
        message,
        priority,
        status,
        scheduled_at,
        expires_at,
        sent_at,
        assigned_user_ids,
        allow_dismiss,
        created_at,
        updated_at,
        created_by
      FROM announcements
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 0

    // Add status filter
    if (status && status !== 'all') {
      if (status.includes(',')) {
        // Handle comma-separated statuses
        const statuses = status.split(',').map(s => s.trim()).filter(s => s)
        if (statuses.length > 0) {
          const placeholders = statuses.map(() => {
            paramCount++
            return `$${paramCount}`
          }).join(', ')
          query += ` AND status IN (${placeholders})`
          params.push(...statuses)
        }
      } else {
        // Single status
        paramCount++
        query += ` AND status = $${paramCount}`
        params.push(status)
      }
    }

    // Add priority filter
    if (priority && priority !== 'all') {
      paramCount++
      query += ` AND priority = $${paramCount}`
      params.push(priority)
    }

    // Add search filter
    if (search && search.trim()) {
      paramCount++
      query += ` AND (title ILIKE $${paramCount} OR message ILIKE $${paramCount})`
      params.push(`%${search.trim()}%`)
    }

    // Get total count for pagination
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM')
    const countResult = await pool.query(countQuery, params)
    const totalCount = parseInt(countResult.rows[0].total)

    // Add sorting
    const validSortFields = ['created_at', 'updated_at', 'title', 'priority', 'status']
    const validSortDirections = ['asc', 'desc']
    
    const sortFieldSafe = validSortFields.includes(sortField) ? sortField : 'created_at'
    const sortDirectionSafe = validSortDirections.includes(sortDirection) ? sortDirection : 'desc'
    
    if (sortFieldSafe === 'priority') {
      query += ` ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END ${sortDirectionSafe.toUpperCase()},
        created_at DESC
      `
    } else {
      query += ` ORDER BY ${sortFieldSafe} ${sortDirectionSafe.toUpperCase()}`
    }

    // Add pagination
    paramCount++
    query += ` LIMIT $${paramCount}`
    params.push(limit)
    
    paramCount++
    query += ` OFFSET $${paramCount}`
    params.push(offset)

    const result = await pool.query(query, params)
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    
    return NextResponse.json({
      announcements: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

// POST /api/announcements - Create new announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      message, 
      priority, 
      status, 
      scheduled_at, 
      expires_at, 
      assigned_user_ids, 
      allow_dismiss, 
      created_by 
    } = body

    // Validate required fields
    if (!title || !message || !priority || !assigned_user_ids || !Array.isArray(assigned_user_ids)) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, priority, assigned_user_ids' },
        { status: 400 }
      )
    }

    // Validate priority
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: low, medium, high, urgent' },
        { status: 400 }
      )
    }

    // Validate status
    if (status && !['draft', 'scheduled', 'active', 'expired', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: draft, scheduled, active, expired, cancelled' },
        { status: 400 }
      )
    }

    // Note: For new announcements, we allow past dates since they might be for immediate publication
    // The database constraint will handle the validation against created_at

    // Validate expires_at constraint: expires_at must be after scheduled_at
    if (expires_at && scheduled_at && new Date(expires_at) <= new Date(scheduled_at)) {
      return NextResponse.json(
        { error: 'Expiry date must be after the scheduled date' },
        { status: 400 }
      )
    }

    let result;
    
    if (status === 'active') {
      // Use create_simple_announcement function for immediate sending
      const query = `SELECT create_simple_announcement($1, $2, $3, $4, $5) as id`
      const values = [title, message, assigned_user_ids, created_by || 1, priority]
      
      const functionResult = await pool.query(query, values)
      const announcementId = functionResult.rows[0].id
      
      // Get the created announcement
      const getQuery = `SELECT * FROM announcements WHERE id = $1`
      result = await pool.query(getQuery, [announcementId])
    } else if (status === 'scheduled') {
      // Use create_scheduled_announcement function
      const query = `SELECT create_scheduled_announcement($1, $2, $3, $4, $5, $6, $7) as id`
      const values = [title, message, scheduled_at, created_by || 1, assigned_user_ids, expires_at, priority]
      
      const functionResult = await pool.query(query, values)
      const announcementId = functionResult.rows[0].id
      
      // Get the created announcement
      const getQuery = `SELECT * FROM announcements WHERE id = $1`
      result = await pool.query(getQuery, [announcementId])
    } else {
      // Use regular insert for draft status
      const query = `
        INSERT INTO announcements (
          title, 
          message, 
          priority, 
          status, 
          scheduled_at, 
          expires_at, 
          assigned_user_ids, 
          allow_dismiss, 
          created_by,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `

      const values = [
        title,
        message,
        priority,
        status || 'draft',
        scheduled_at || null,
        expires_at || null,
        assigned_user_ids,
        allow_dismiss ?? true,
        created_by || 1
      ]

      result = await pool.query(query, values)
    }
    
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}