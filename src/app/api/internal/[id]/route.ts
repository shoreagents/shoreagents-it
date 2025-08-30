import { NextRequest, NextResponse } from 'next/server'
import { getInternalById } from '@/lib/db-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const internalUserId = parseInt(id, 10)
    
    if (isNaN(internalUserId)) {
      return NextResponse.json({ error: 'Invalid internal user ID' }, { status: 400 })
    }

    const internalUser = await getInternalById(internalUserId)
    
    if (!internalUser) {
      return NextResponse.json({ error: 'Internal user not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      internal: internalUser
    })

  } catch (error) {
    console.error('Error fetching internal user:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch internal user' 
    }, { status: 500 })
  }
}
