import { NextRequest, NextResponse } from 'next/server'
import { getAgentCompanies, getAgentsPaginated } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '40', 10)
    const search = searchParams.get('search') || ''
    const companyIdParam = searchParams.get('companyId')
    const companyId = companyIdParam === 'none' ? 'none' : (companyIdParam ? parseInt(companyIdParam, 10) : undefined)
    const sortField = searchParams.get('sortField') || 'first_name'
    const sortDirection = (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc'

    const { agents, totalCount } = await getAgentsPaginated({ search, page, limit, companyId, sortField, sortDirection })
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
    const companies = await getAgentCompanies()
    return NextResponse.json({ companies })
  } catch (error) {
    return NextResponse.json({ companies: [] })
  }
}


