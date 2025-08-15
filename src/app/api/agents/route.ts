import { NextRequest, NextResponse } from 'next/server'
import { getAgentMembers, getAgentsPaginated } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '40', 10)
    const search = searchParams.get('search') || ''
    const memberIdParam = searchParams.get('memberId')
    const memberId = memberIdParam === 'none' ? 'none' : (memberIdParam ? parseInt(memberIdParam, 10) : undefined)
    const sortField = searchParams.get('sortField') || 'first_name'
    const sortDirection = (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc'

    const { agents, totalCount } = await getAgentsPaginated({ search, page, limit, memberId, sortField, sortDirection })
    const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, limit)))

    return NextResponse.json({
      agents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}

export async function OPTIONS() {
  try {
    const members = await getAgentMembers()
    return NextResponse.json({ members })
  } catch (error) {
    return NextResponse.json({ members: [] })
  }
}


