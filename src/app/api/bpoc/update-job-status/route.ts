import { NextResponse } from 'next/server'
import { updateBpocApplicationStatus } from '@/lib/db-utils'

export async function PATCH(request: Request) {
  try {
    console.log('🔧 PATCH request received for individual job status update')
    
    // Debug environment variables
    console.log('🔍 Environment check:')
    console.log('  DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('  BPOC_DATABASE_URL exists:', !!process.env.BPOC_DATABASE_URL)
    console.log('  NODE_ENV:', process.env.NODE_ENV)
    
    // db-utils will validate BPOC/main pool presence

    const { applicantId, jobIndex, newStatus, applicationId } = await request.json()
    console.log('📝 Request data:', { applicantId, jobIndex, newStatus, applicationId })

    if (!applicantId || jobIndex === undefined || !newStatus) {
      console.log('❌ Missing required fields:', { applicantId, jobIndex, newStatus })
      return NextResponse.json({ error: 'Missing required fields: applicantId, jobIndex, and newStatus' }, { status: 400 })
    }

    // Validate status against the allowed final statuses (matching BPOC database enum)
    const validStatuses = ['withdrawn', 'qualified', 'final interview', 'hired', 'failed', 'not qualified']
    if (!validStatuses.includes(newStatus.toLowerCase())) {
      console.log('❌ Invalid status value:', newStatus)
      return NextResponse.json({ error: 'Invalid status value. Must be one of: withdrawn, qualified, final interview, hired, failed, not qualified' }, { status: 400 })
    }

    // Map frontend status to database enum value if needed
    const statusMapping: Record<string, string> = {
      'withdrawn': 'withdrawn',
      'qualified': 'qualified',
      'final interview': 'final interview',
      'hired': 'hired',
      'failed': 'not qualified',
      'not qualified': 'not qualified'
    }
    
    const dbStatus = statusMapping[newStatus.toLowerCase()] || newStatus

    console.log('✅ Validating BPOC status update:', { applicantId, jobIndex, newStatus, dbStatus })

    const { updated, targetApplicationId } = await updateBpocApplicationStatus(applicantId, jobIndex, dbStatus)



    console.log('✅ BPOC application status updated successfully:', updated)
    return NextResponse.json({ 
      success: true, 
      application: updated,
      jobIndex: jobIndex
    })

  } catch (error) {
    console.error('❌ Error updating BPOC application status:', error)
    return NextResponse.json({ 
      error: 'Failed to update BPOC application status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
