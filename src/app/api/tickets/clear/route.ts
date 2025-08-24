import { NextRequest, NextResponse } from 'next/server'
import { markTicketAsCleared, unmarkTicketAsCleared } from '@/lib/db-utils'

export async function POST(request: NextRequest) {
  try {
    const { ticketId, action } = await request.json()
    
    if (!ticketId || !action) {
      return NextResponse.json(
        { error: 'Ticket ID and action are required' },
        { status: 400 }
      )
    }
    
    if (action === 'clear') {
      await markTicketAsCleared(ticketId)
      return NextResponse.json({ success: true, message: 'Ticket marked as cleared' })
    } else if (action === 'unclear') {
      await unmarkTicketAsCleared(ticketId)
      return NextResponse.json({ success: true, message: 'Ticket unmarked as cleared' })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "clear" or "unclear"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in clear ticket API:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket clear status' },
      { status: 500 }
    )
  }
}
