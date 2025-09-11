import { NextRequest, NextResponse } from 'next/server'
import { getAgentsByIds } from '@/lib/db-utils'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Batch agents API called')
    const body = await request.json()
    console.log('🔄 Request body:', body)
    const { userIds } = body
    
    if (!userIds || !Array.isArray(userIds)) {
      console.log('❌ Invalid userIds:', userIds)
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Fetching agents for IDs:', userIds)
    const agents = await getAgentsByIds(userIds)
    console.log('🔄 Found agents:', agents.length)
    return NextResponse.json({ agents })
  } catch (error) {
    console.error('❌ Error fetching agents batch:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}
