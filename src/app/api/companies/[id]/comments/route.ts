import { NextRequest, NextResponse } from 'next/server'
import { getCompanyCommentsPaginated, createCompanyComment } from '@/lib/db-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const companyId = parseInt(params.id, 10)

    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 })
    }

    const result = await getCompanyCommentsPaginated(companyId, page, limit)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in comments GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { comment, user_id } = await request.json()
    const companyId = parseInt(params.id, 10)

    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 })
    }

    if (!comment?.trim() || !user_id) {
      return NextResponse.json({ error: 'Comment and user_id are required' }, { status: 400 })
    }

    const newComment = await createCompanyComment(companyId, user_id, comment)

    return NextResponse.json({ success: true, comment: newComment })
  } catch (error) {
    console.error('Error in comments POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
