import { NextRequest, NextResponse } from 'next/server'
import { updateInternalData } from '@/lib/db-utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const internalUserId = parseInt(id, 10)
    
    if (isNaN(internalUserId)) {
      return NextResponse.json({ error: 'Invalid internal user ID' }, { status: 400 })
    }

    const body = await request.json()
    
    // Update internal user data using utility function
    const result = await updateInternalData(internalUserId, body)

    return NextResponse.json({ 
      success: true, 
      message: 'Internal user updated successfully',
      result
    })

  } catch (error) {
    console.error('Error updating internal user:', error)
    return NextResponse.json({ 
      error: 'Failed to update internal user' 
    }, { status: 500 })
  }
}
