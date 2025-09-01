import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = parseInt(params.id)
    
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      )
    }

    // Fetch ONLY the 3 missing fields that aren't already available from ticket cards
    const result = await pool.query(`
      SELECT 
        -- ONLY the fields NOT available in ticket cards
        t.supporting_files, t.file_count,
        resolver_pi.last_name as resolver_last_name
        
      FROM public.tickets t
      LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
      
      WHERE t.id = $1
    `, [ticketId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    const ticket = result.rows[0]
    
    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error fetching ticket detail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket detail' },
      { status: 500 }
    )
  }
}
