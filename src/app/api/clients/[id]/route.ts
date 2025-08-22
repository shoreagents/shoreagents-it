import { NextRequest, NextResponse } from 'next/server'
import { updateClientMember, getClientById } from '@/lib/db-utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = parseInt(params.id, 10)
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    const body = await request.json()
    const { member_id } = body

    // Validate required fields
    if (member_id === undefined) {
      return NextResponse.json({ error: 'member_id is required' }, { status: 400 })
    }

    // Update client member_id using utility function
    const updatedClient = await updateClientMember(clientId, member_id)

    return NextResponse.json({ 
      message: 'Client updated successfully',
      client: updatedClient
    })

  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' }, 
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = parseInt(params.id, 10)
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    // Get client details using utility function
    const client = await getClientById(clientId)

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ client })

  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' }, 
      { status: 500 }
    )
  }
}
