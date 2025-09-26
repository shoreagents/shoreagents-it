import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

// GET /api/users - Get all users or users by IDs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    let query = `
      SELECT 
        u.id as user_id,
        u.email,
        u.user_type,
        pi.first_name,
        pi.last_name,
        pi.profile_picture,
        ji.employee_id,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN personal_info pi ON u.id = pi.user_id
      LEFT JOIN job_info ji ON u.id = ji.agent_user_id OR u.id = ji.internal_user_id
    `
    
    const params: any[] = []
    
    if (idsParam) {
      // Fetch specific users by IDs
      const userIds = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      
      if (userIds.length === 0) {
        return NextResponse.json({ users: [] })
      }
      
      query += ` WHERE u.id = ANY($1)`
      params.push(userIds)
    }
    
    query += ` ORDER BY pi.first_name, pi.last_name, u.email ASC`

    const result = await pool.query(query, params)
    
    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
