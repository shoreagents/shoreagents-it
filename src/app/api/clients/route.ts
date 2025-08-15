import { NextRequest, NextResponse } from 'next/server'
import { getClientsPaginated, getClientMembers } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '40', 10)
    const search = searchParams.get('search') || ''
    const memberId = searchParams.get('memberId') || 'all'
    const sortField = searchParams.get('sortField') || 'first_name'
    const sortDirection = (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc'

    const parsedMemberId = memberId === 'none' ? 'none' : (memberId === 'all' ? undefined : parseInt(memberId, 10))

    const { agents, totalCount } = await getClientsPaginated({ search, page, limit, memberId: parsedMemberId as any, sortField, sortDirection })
    const totalPages = Math.ceil(totalCount / Math.max(1, limit))

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
    console.error('Failed to fetch clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function OPTIONS() {
  try {
    const members = await getClientMembers()
    return NextResponse.json({ members })
  } catch (error) {
    console.error('Failed to fetch members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}



