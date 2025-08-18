import { NextRequest, NextResponse } from 'next/server'
import { updateTicketPositions } from '@/lib/db-utils'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { positions } = body
    
    // Validate input
    if (!positions || !Array.isArray(positions)) {
      return NextResponse.json(
        { error: 'Invalid positions data - expected array' },
        { status: 400 }
      )
    }
    
    // Validate each position entry
    for (const pos of positions) {
      if (!pos || typeof pos !== 'object') {
        return NextResponse.json(
          { error: 'Invalid position entry - expected object' },
          { status: 400 }
        )
      }
      
      if (typeof pos.id !== 'number' || pos.id <= 0) {
        return NextResponse.json(
          { error: 'Invalid ticket ID - expected positive number' },
          { status: 400 }
        )
      }
      
      if (typeof pos.position !== 'number' || pos.position < 0) {
        return NextResponse.json(
          { error: 'Invalid position - expected non-negative number' },
          { status: 400 }
        )
      }
    }
    
    // Ensure positions are integers (round if needed)
    const integerPositions = positions.map(pos => ({
      id: pos.id,
      position: Math.round(pos.position)
    }))
    
    console.log('🔢 API CALLED - Updating ticket positions:', integerPositions)
    
    await updateTicketPositions(integerPositions)
    
    console.log('🔢 API SUCCESS - Positions updated in database')
    
    return NextResponse.json({ 
      message: 'Positions updated successfully',
      updated: integerPositions.length
    })
  } catch (error) {
    console.error('Error updating ticket positions:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket positions' },
      { status: 500 }
    )
  }
}