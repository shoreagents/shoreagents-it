import { NextRequest, NextResponse } from 'next/server'
import { getClientsPaginated, getClientCompanies } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '40', 10)
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId') || 'all'
    const sortField = searchParams.get('sortField') || 'first_name'
    const sortDirection = (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc'

    const parsedCompanyId = companyId === 'none' ? 'none' : (companyId === 'all' ? undefined : parseInt(companyId, 10))

    const { agents, totalCount } = await getClientsPaginated({ search, page, limit, companyId: parsedCompanyId as any, sortField, sortDirection })
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
    const companies = await getClientCompanies()
    return NextResponse.json({ companies })
  } catch (error) {
    console.error('Failed to fetch companies:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}



