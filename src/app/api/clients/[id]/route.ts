import { NextRequest, NextResponse } from 'next/server'
import { updateClientCompany, getClientById } from '@/lib/db-utils'

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
    const { company_id } = body

    // Validate required fields
    if (company_id === undefined) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    // Update client company_id using utility function
    const updatedClient = await updateClientCompany(clientId, company_id)

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const clientId = parseInt(id, 10)
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
