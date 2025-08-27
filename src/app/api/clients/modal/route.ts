import { NextRequest, NextResponse } from 'next/server'
import { getClientsForModal } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const memberId = searchParams.get('memberId') || ''
    const sortField = searchParams.get('sortField') || 'first_name'
    const sortDirection = (searchParams.get('sortDirection') || 'asc') as 'asc' | 'desc'

    console.log('🔍 Clients modal API called with:', { page, limit, search, memberId, sortField, sortDirection })

    const result = await getClientsForModal(page, limit, search, memberId, sortField, sortDirection)
    
    console.log('✅ Clients modal API result:', { 
      clientsCount: result.clients?.length || 0, 
      totalCount: result.totalCount 
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in modal clients API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients for modal', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
