import { NextRequest, NextResponse } from 'next/server'
import { getCompanyActivityPaginated, createCompanyActivityLog } from '@/lib/db-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = parseInt(id, 10)
    
    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 })
    }

    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const action = searchParams.get('action') || null

    const result = await getCompanyActivityPaginated(companyId, page, limit, action)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching company activity and comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company activity and comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = parseInt(id, 10)
    
    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 })
    }

    const { action, fieldName, oldValue, newValue, userId } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const logId = await createCompanyActivityLog(companyId, fieldName || '', action, oldValue || null, newValue || null, userId || null)

    return NextResponse.json({
      success: true,
      logId
    })

  } catch (error) {
    console.error('Error creating activity log:', error)
    return NextResponse.json(
      { error: 'Failed to create activity log' },
      { status: 500 }
    )
  }
}
