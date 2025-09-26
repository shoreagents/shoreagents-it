import { NextRequest, NextResponse } from 'next/server'
import { indexTalentDocuments } from '@/lib/rag'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting talent indexing process...')
    
    // Index all talents from the database
    const result = await indexTalentDocuments()
    
    if (result.success) {
      return NextResponse.json({
        message: 'Talents indexed successfully',
        indexedCount: result.indexedCount,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to index talents' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Talent indexing error:', error)
    return NextResponse.json(
      { error: 'Failed to index talents' },
      { status: 500 }
    )
  }
}
