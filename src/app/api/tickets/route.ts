import { NextRequest, NextResponse } from 'next/server'
import { getAllTickets, createTicket, getTicketsByStatus } from '@/lib/db-utils'
import { generateTicketId } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let tickets
    if (status) {
      tickets = await getTicketsByStatus(status)
    } else {
      tickets = await getAllTickets()
    }
    
    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets from database:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, concern, details, category, status = 'For Approval' } = body
    
    // Generate unique ticket ID
    const ticket_id = await generateTicketId()
    
    const newTicket = await createTicket({
      ticket_id,
      user_id,
      concern,
      details,
      category,
      status
    })
    
    return NextResponse.json(newTicket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}