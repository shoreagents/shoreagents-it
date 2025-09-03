import { NextRequest, NextResponse } from 'next/server'
import { updateClientData } from '@/lib/db-utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const clientId = parseInt(id, 10)
    
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    const body = await request.json()
    
    // Update client data using utility function
    const result = await updateClientData(clientId, body)

    return NextResponse.json({ 
      success: true, 
      message: 'Client updated successfully',
      result
    })

  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ 
      error: 'Failed to update client' 
    }, { status: 500 })
  }
}
