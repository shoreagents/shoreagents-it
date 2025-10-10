import { NextRequest, NextResponse } from 'next/server'
import { updateAgentCompany, getAgentById } from '@/lib/db-utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const agentId = parseInt(id, 10)
    
    if (isNaN(agentId)) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 })
    }

    const body = await request.json()
    const { company_id } = body

    // Validate required fields
    if (company_id === undefined) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    // Update agent company_id using utility function
    const updatedAgent = await updateAgentCompany(agentId, company_id)

    return NextResponse.json({ 
      success: true, 
      agent: updatedAgent 
    })

  } catch (error) {
    console.error('Error updating agent:', error)
    return NextResponse.json({ 
      error: 'Failed to update agent' 
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const agentId = parseInt(id, 10)
    
    if (isNaN(agentId)) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 })
    }

    // Get agent details using utility function
    const agent = await getAgentById(agentId)

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json({ agent })

  } catch (error) {
    console.error('Error fetching agent:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch agent' 
    }, { status: 500 })
  }
}
