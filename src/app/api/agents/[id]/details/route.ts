import { NextRequest, NextResponse } from 'next/server'
import { getAgentDetailsById } from '@/lib/db-utils'

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

    // Get only the missing agent details (21 fields)
    const agentDetails = await getAgentDetailsById(agentId)

    if (!agentDetails) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json({ agent: agentDetails })
  } catch (error) {
    console.error('Error fetching agent details:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch agent details' 
    }, { status: 500 })
  }
}
