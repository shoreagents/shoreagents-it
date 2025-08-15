import { NextRequest, NextResponse } from 'next/server'
import { getMembersPaginated, getAgentsByMember, getClientsByMember } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const memberIdForUsers = searchParams.get('usersOfMember')
    const usersType = (searchParams.get('type') || '').toLowerCase()

    if (memberIdForUsers && (usersType === 'agents' || usersType === 'clients')) {
      const memberId = parseInt(memberIdForUsers, 10)
      if (Number.isNaN(memberId)) {
        return NextResponse.json({ error: 'Invalid member id' }, { status: 400 })
      }
      if (usersType === 'agents') {
        const users = await getAgentsByMember(memberId)
        return NextResponse.json({ users })
      }
      const users = await getClientsByMember(memberId)
      return NextResponse.json({ users })
    }
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '40', 10)
    const search = searchParams.get('search') || ''
    const sortField = searchParams.get('sortField') || 'company'
    const sortDirection = (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc'

    const { members, totalCount } = await getMembersPaginated({ search, page, limit, sortField, sortDirection })
    const totalPages = Math.ceil(totalCount / Math.max(1, limit))

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Failed to fetch members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}



