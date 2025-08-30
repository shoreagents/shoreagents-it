import { NextRequest, NextResponse } from 'next/server'
import { updateAgentData } from '@/lib/db-utils'

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
    
    // Update agent data using utility function
    const result = await updateAgentData(agentId, body)

    return NextResponse.json({ 
      success: true, 
      message: 'Agent updated successfully',
      result
    })

  } catch (error) {
    console.error('Error updating agent:', error)
    return NextResponse.json({ 
      error: 'Failed to update agent' 
    }, { status: 500 })
  }
}
