import { NextResponse } from 'next/server'
import { getApplicants, updateRecruitStatusAndSyncBpoc, updateRecruitFields, getRecruitById, cleanupBpocRecruitsDuplicates } from '@/lib/db-utils'

export async function GET(request: Request) {
  try {
    console.log('🔧 GET request received for applicants')
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const diagnose = searchParams.get('diagnose') === 'true'
    
    console.log('🔍 Status filter:', statusFilter)
    console.log('🔍 Diagnose mode:', diagnose)
    const data = await getApplicants({ status: statusFilter, diagnose })
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Error fetching applicants:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch applicants',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    console.log('🔧 PATCH request received for applicants')
    
    const { id, status, previousStatus, recruiterId } = await request.json()
    console.log('📝 Request data:', { id, status, previousStatus, recruiterId })

    if (!id || !status) {
      console.log('❌ Missing required fields:', { id, status })
      return NextResponse.json({ error: 'Missing required fields: id and status' }, { status: 400 })
    }

    // Validate status against the enum
    const validStatuses = ['reject', 'submitted', 'for verification', 'verified', 'initial interview', 'passed', 'failed', 'withdrawn']
    if (!validStatuses.includes(status)) {
      console.log('❌ Invalid status value:', status)
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    console.log('✅ Validating status update:', { id, status })

    const applicant = await updateRecruitStatusAndSyncBpoc(id, status)
    console.log('✅ Applicant status updated successfully in main database:', applicant)
    return NextResponse.json({ success: true, applicant })
  } catch (error) {
    console.error('❌ Error updating applicant status:', error)
    return NextResponse.json({ error: 'Failed to update applicant status' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    console.log('🔧 PUT request received for applicants')
    
    const { id, ...updateFields } = await request.json()
    console.log('📝 Request data:', { id, updateFields })

    if (!id) {
      console.log('❌ Missing required field: id')
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 })
    }

    if (Object.keys(updateFields).length === 0) {
      console.log('❌ No valid fields to update')
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await updateRecruitFields(id, updateFields)
    
    try {
      const completeApplicant = await getRecruitById(id)
      const notificationPayload = {
        type: 'applicant_update',
        data: {
          table: 'bpoc_recruits',
          action: 'UPDATE',
          record: completeApplicant,
          old_record: { id },
          timestamp: new Date().toISOString(),
        },
      }
      await (await import('@/lib/db-utils')).notifyApplicantChange(notificationPayload)
      console.log('📡 Real-time notification sent for applicant field update:', completeApplicant)
    } catch (notificationError) {
      console.warn('⚠️ Failed to send real-time notification:', notificationError)
      // Don't fail the main update if notification fails
    }
    
    return NextResponse.json({ 
      success: true, 
      applicant: updated,
      updatedFields: updateFields
    })

  } catch (error) {
    console.error('❌ Error updating applicant fields:', error)
    return NextResponse.json({ 
      error: 'Failed to update applicant fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Cleanup endpoint to remove duplicate IDs from existing records
// Usage: DELETE /api/bpoc
// This will clean up existing duplicate job_ids and bpoc_application_ids
// 
// Also includes a GET parameter for diagnostics:
// GET /api/bpoc?diagnose=true - Shows current state of arrays
export async function DELETE(request: Request) {
  try {
    console.log('🧹 DELETE request received for cleanup')
    
    const { cleanedRecords, sample } = await cleanupBpocRecruitsDuplicates()
    console.log(`✅ Cleanup completed. Fixed ${cleanedRecords} records with duplicate IDs`)
    return NextResponse.json({ success: true, message: 'Cleanup completed successfully', cleanedRecords, sample, timestamp: new Date().toISOString() })

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    return NextResponse.json({ 
      error: 'Failed to cleanup duplicate IDs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


