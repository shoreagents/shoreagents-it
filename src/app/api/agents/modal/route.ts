import { NextRequest, NextResponse } from 'next/server'
import { getAgentsForModal } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId') || ''
    const sortField = searchParams.get('sortField') || 'first_name'
    const sortDirection = (searchParams.get('sortDirection') || 'asc') as 'asc' | 'desc'

    console.log('🔍 Agents modal API called with:', { page, limit, search, companyId, sortField, sortDirection })

    const result = await getAgentsForModal(page, limit, search, companyId, sortField, sortDirection)
    
    console.log('✅ Agents modal API result:', { 
      agentsCount: result.agents?.length || 0, 
      totalCount: result.totalCount 
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in modal agents API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents for modal', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
