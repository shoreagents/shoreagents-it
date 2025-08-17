import { NextResponse } from 'next/server'
import { bpocPool } from '@/lib/database'
import pool from '@/lib/database'

export async function PATCH(request: Request) {
  try {
    console.log('🔧 PATCH request received for individual job status update')
    
    // Debug environment variables
    console.log('🔍 Environment check:')
    console.log('  DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('  BPOC_DATABASE_URL exists:', !!process.env.BPOC_DATABASE_URL)
    console.log('  NODE_ENV:', process.env.NODE_ENV)
    
    // Debug database connections
    console.log('🔍 Database connections:')
    console.log('  Main pool exists:', !!pool)
    console.log('  BPOC pool exists:', !!bpocPool)
    
    if (!pool) {
      console.log('❌ Main database is not configured')
      return NextResponse.json({ error: 'Main database is not configured' }, { status: 500 })
    }

    if (!bpocPool) {
      console.log('❌ BPOC database is not configured')
      return NextResponse.json({ error: 'BPOC database is not configured' }, { status: 500 })
    }

    const { applicantId, jobIndex, newStatus, applicationId } = await request.json()
    console.log('📝 Request data:', { applicantId, jobIndex, newStatus, applicationId })

    if (!applicantId || jobIndex === undefined || !newStatus) {
      console.log('❌ Missing required fields:', { applicantId, jobIndex, newStatus })
      return NextResponse.json({ error: 'Missing required fields: applicantId, jobIndex, and newStatus' }, { status: 400 })
    }

    // Validate status against the allowed final statuses (matching BPOC database enum)
    const validStatuses = ['withdrawn', 'final interview', 'hired', 'failed']
    if (!validStatuses.includes(newStatus.toLowerCase())) {
      console.log('❌ Invalid status value:', newStatus)
      return NextResponse.json({ error: 'Invalid status value. Must be one of: withdrawn, final interview, hired, failed' }, { status: 400 })
    }

    // Map frontend status to database enum value if needed
    const statusMapping: Record<string, string> = {
      'withdrawn': 'withdrawn',
      'final interview': 'final interview',
      'hired': 'hired',
      'failed': 'failed'
    }
    
    const dbStatus = statusMapping[newStatus.toLowerCase()] || newStatus

    console.log('✅ Validating BPOC status update:', { applicantId, jobIndex, newStatus, dbStatus })

    // Get the applicant's BPOC application IDs from main database
    if (!pool) {
      console.log('❌ Main database is not configured')
      return NextResponse.json({ error: 'Main database is not configured' }, { status: 500 })
    }

    const getApplicantQuery = `
      SELECT bpoc_application_ids 
      FROM public.bpoc_recruits 
      WHERE id = $1
    `
    
    const applicantResult = await pool.query(getApplicantQuery, [applicantId])
    console.log('📊 Applicant query result:', applicantResult.rows)

    if (applicantResult.rows.length === 0) {
      console.log('❌ Applicant not found with id:', applicantId)
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
    }

    const bpocApplicationIds = applicantResult.rows[0].bpoc_application_ids
    console.log('🔍 BPOC application IDs:', bpocApplicationIds)

    if (!bpocApplicationIds || bpocApplicationIds.length === 0) {
      console.log('❌ No BPOC application IDs found for applicant:', applicantId)
      return NextResponse.json({ error: 'No BPOC applications found for this applicant' }, { status: 404 })
    }

    // Determine which application ID to update based on jobIndex
    if (jobIndex < 0 || jobIndex >= bpocApplicationIds.length) {
      console.log('❌ Invalid job index:', jobIndex, 'for', bpocApplicationIds.length, 'applications')
      return NextResponse.json({ error: 'Invalid job index' }, { status: 400 })
    }

    const targetApplicationId = bpocApplicationIds[jobIndex]
    console.log('🎯 Updating BPOC application:', targetApplicationId, 'to status:', dbStatus)

    // Update the specific BPOC application status
    const updateQuery = `
      UPDATE public.applications 
      SET status = $1::application_status_enum, updated_at = NOW()
      WHERE id = $2::uuid
      RETURNING id, status, updated_at
    `
    
    const updateResult = await bpocPool.query(updateQuery, [dbStatus, targetApplicationId])
    console.log('📊 BPOC update result:', updateResult.rows)

    if (updateResult.rows.length === 0) {
      console.log('❌ Failed to update BPOC application:', targetApplicationId)
      return NextResponse.json({ error: 'Failed to update BPOC application status' }, { status: 500 })
    }

    // Trigger real-time update notification for the main database
    if (pool) {
      try {
        const notificationPayload = {
          type: 'bpoc_job_status_update',
          data: {
            applicantId: applicantId,
            jobIndex: jobIndex,
            newStatus: dbStatus,
            applicationId: targetApplicationId,
            timestamp: new Date().toISOString()
          }
        }
        
        await pool.query('SELECT pg_notify($1, $2)', [
          'applicant_changes',
          JSON.stringify(notificationPayload)
        ])
        
        console.log('📡 Real-time notification sent for BPOC job status update')
      } catch (notificationError) {
        console.warn('⚠️ Failed to send real-time notification:', notificationError)
        // Don't fail the main update if notification fails
      }
    }

    console.log('✅ BPOC application status updated successfully:', updateResult.rows[0])
    return NextResponse.json({ 
      success: true, 
      application: updateResult.rows[0],
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
