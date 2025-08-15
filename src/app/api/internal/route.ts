import { NextRequest, NextResponse } from 'next/server'
import { getInternalPaginated } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '40', 10)
    const search = searchParams.get('search') || ''
    const sortField = searchParams.get('sortField') || 'first_name'
    const sortDirection = (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc'

    const { agents, totalCount } = await getInternalPaginated({ search, page, limit, sortField, sortDirection })
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
    console.error('Failed to fetch internal users:', error)
    return NextResponse.json({ error: 'Failed to fetch internal users' }, { status: 500 })
  }
}



