import { NextRequest, NextResponse } from 'next/server'
import { MembersActivityLogger } from '@/lib/logs-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const memberId = parseInt(id, 10)
    
    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })
    }

    const { 
      originalAgentIds, 
      currentAgentIds, 
      originalClientIds, 
      currentClientIds, 
      userId 
    } = await request.json()

    // Debug logging
    console.log('🔍 Assignment logging request:', {
      memberId,
      originalAgentIds,
      currentAgentIds,
      originalClientIds,
      currentClientIds,
      userId
    })

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Log agent assignment changes
    if (originalAgentIds !== undefined && currentAgentIds !== undefined) {
      console.log('🔍 Logging agent assignment change:', {
        memberId,
        originalAgentIds,
        currentAgentIds,
        userId
      })
      
      await MembersActivityLogger.logAgentAssignmentChange(
        memberId,
        originalAgentIds,
        currentAgentIds,
        userId
      )
      
      console.log('✅ Agent assignment change logged successfully')
    }

    // Log client assignment changes
    if (originalClientIds !== undefined && currentClientIds !== undefined) {
      console.log('🔍 Logging client assignment change:', {
        memberId,
        originalClientIds,
        currentClientIds,
        userId
      })
      
      await MembersActivityLogger.logClientAssignmentChange(
        memberId,
        originalClientIds,
        currentClientIds,
        userId
      )
      
      console.log('✅ Client assignment change logged successfully')
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment changes logged successfully'
    })

  } catch (error) {
    console.error('Error logging assignment changes:', error)
    return NextResponse.json(
      { error: 'Failed to log assignment changes' },
      { status: 500 }
    )
  }
}
