import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting position migration...')
    
    // Get all tickets grouped by status
    const result = await pool.query(`
      SELECT id, status, created_at
      FROM public.tickets
      ORDER BY status, created_at ASC, id ASC
    `)
    
    const tickets = result.rows
    console.log(`📊 Found ${tickets.length} tickets to migrate`)
    
    // Group tickets by status
    const ticketsByStatus: Record<string, any[]> = {}
    tickets.forEach(ticket => {
      if (!ticketsByStatus[ticket.status]) {
        ticketsByStatus[ticket.status] = []
      }
      ticketsByStatus[ticket.status].push(ticket)
    })
    
    // Status code mapping with larger ranges to prevent overflow
    const statusCodes: Record<string, number> = {
      'For Approval': 10000,    // 10,000 range (supports 999 tickets)
      'Approved': 20000,        // 20,000 range
      'In Progress': 30000,     // 30,000 range  
      'Actioned': 40000,        // 40,000 range
      'Closed': 50000,          // 50,000 range
      'On Hold': 60000,         // 60,000 range
      'Stuck': 70000            // 70,000 range
    }
    
    let totalUpdated = 0
    
    // Update positions for each status
    for (const [status, statusTickets] of Object.entries(ticketsByStatus)) {
      const basePosition = statusCodes[status] || 1000
      console.log(`🔢 Updating ${statusTickets.length} tickets for status: ${status} (base: ${basePosition})`)
      
      for (let i = 0; i < statusTickets.length; i++) {
        const ticket = statusTickets[i]
        const newPosition = basePosition + ((i + 1) * 10) // 10010, 10020, 10030, etc.
        
        await pool.query(
          'UPDATE public.tickets SET position = $1 WHERE id = $2',
          [newPosition, ticket.id]
        )
        
        totalUpdated++
      }
    }
    
    console.log(`✅ Migration completed! Updated ${totalUpdated} tickets`)
    
    return NextResponse.json({
      success: true,
      message: 'Position migration completed successfully',
      totalUpdated,
      statusBreakdown: Object.fromEntries(
        Object.entries(ticketsByStatus).map(([status, tickets]) => [
          status,
          tickets.length
        ])
      )
    })
  } catch (error) {
    console.error('❌ Position migration failed:', error)
    return NextResponse.json(
      { 
        error: 'Position migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
