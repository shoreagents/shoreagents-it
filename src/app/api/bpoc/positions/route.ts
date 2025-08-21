import { NextRequest, NextResponse } from 'next/server'
import { updateApplicantPositions } from '@/lib/db-utils'

export async function PATCH(request: NextRequest) {
  try {
    console.log('🔧 PATCH request received for applicant positions')
    
    const body = await request.json()
    const { positions } = body
    
    console.log('📊 Received position updates:', positions)
    
    if (!positions || !Array.isArray(positions)) {
      return NextResponse.json(
        { error: 'Invalid positions data' },
        { status: 400 }
      )
    }
    
    await updateApplicantPositions(positions)
    console.log('✅ All positions updated successfully')
    return NextResponse.json({ message: 'Applicant positions updated successfully' })
  } catch (error) {
    console.error('❌ Error updating applicant positions:', error)
    return NextResponse.json(
      { error: 'Failed to update applicant positions' },
      { status: 500 }
    )
  }
}
