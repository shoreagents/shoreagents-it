import { NextResponse } from 'next/server'
import { getRecruitById } from '@/lib/db-utils'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔧 GET request received for single applicant:', params.id)
    
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }
    
    const applicant = await getRecruitById(id)
    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
    }
    
    // For now, return the basic data from getRecruitById
    // In the future, this could be enhanced to include enriched BPOC data
    return NextResponse.json({ applicant })
  } catch (error) {
    console.error('❌ Error fetching applicant:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch applicant',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
