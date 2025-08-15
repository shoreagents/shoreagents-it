import { NextResponse } from 'next/server'
import { bpocPool } from '@/lib/database'
import pool from '@/lib/database'

export async function GET() {
  try {
    console.log('🔧 GET request received for applicants')
    
    if (!bpocPool) {
      console.log('❌ BPOC database is not configured')
      return NextResponse.json({ error: 'BPOC database is not configured' }, { status: 500 })
    }

    const query = `
      SELECT 
        a.id::text,
        a.user_id::text,
        a.job_id,
        a.resume_slug,
        a.status::text,
        a.created_at,
        u.first_name,
        u.last_name,
        u.full_name,
        u.avatar_url,
        p.job_title,
        m.company AS company_name,
        COALESCE(a.position, 0) as position
      FROM public.applications a
      JOIN public.users u ON u.id = a.user_id
      LEFT JOIN public.processed_job_requests p ON p.id = a.job_id
      LEFT JOIN public.members m ON m.company_id = p.company_id
      ORDER BY COALESCE(a.position, 0), a.created_at DESC
      LIMIT 500
    `

    console.log('📊 Executing GET query for applicants')
    console.log('🔍 Query:', query)
    
    const { rows } = await bpocPool.query(query)
    console.log('📊 Found applications:', rows.length)
    if (rows.length > 0) {
      console.log('📊 Sample application:', rows[0])
    }

    return NextResponse.json(rows)
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
    
    if (!bpocPool) {
      console.log('❌ BPOC database is not configured')
      return NextResponse.json({ error: 'BPOC database is not configured' }, { status: 500 })
    }

    const { id, status, previousStatus, recruiterId } = await request.json()
    console.log('📝 Request data:', { id, status, previousStatus, recruiterId })

    if (!id || !status) {
      console.log('❌ Missing required fields:', { id, status })
      return NextResponse.json({ error: 'Missing required fields: id and status' }, { status: 400 })
    }

    // Validate status against the enum
    const validStatuses = ['submitted', 'screened', 'for verification', 'verified', 'initial interview', 'final interview', 'failed', 'passed']
    if (!validStatuses.includes(status)) {
      console.log('❌ Invalid status value:', status)
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    console.log('✅ Validating status update:', { id, status })

    // First, let's check if the application exists and get its current status
    const checkQuery = `
      SELECT id, status, user_id, job_id, resume_slug FROM public.applications WHERE id = $1
    `
    console.log('🔍 Checking if application exists with id:', id)
    const checkResult = await bpocPool.query(checkQuery, [id])
    
    if (checkResult.rows.length === 0) {
      console.log('❌ Application not found with id:', id)
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    
    const application = checkResult.rows[0]
    const currentStatus = application.status
    console.log('📊 Current application status:', currentStatus)

    // Update BPOC database
    const updateQuery = `
      UPDATE public.applications 
      SET status = $1::application_status_enum
      WHERE id = $2
      RETURNING id, status
    `

    console.log('📊 Executing BPOC database update query with params:', [status, id])
    const { rows } = await bpocPool.query(updateQuery, [status, id])
    console.log('📊 BPOC Database query result:', rows)

    if (rows.length === 0) {
      console.log('❌ Failed to update application with id:', id)
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }

    // Now save to main database recruits table
    try {
      console.log('💾 Saving to main database recruits table...')
      const recruitsQuery = `
        INSERT INTO public.recruits (
          bpoc_application_id, 
          applicant_id, 
          job_id, 
          resume_slug, 
          status, 
          previous_status,
          recruiter_id,
          video_introduction_url,
          current_salary,
          expected_monthly_salary,
          shift
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `
      
      const recruitsParams = [
        id, // bpoc_application_id
        application.user_id, // applicant_id
        application.job_id, // job_id
        application.resume_slug, // resume_slug
        status, // new status
        previousStatus || currentStatus, // previous status
        recruiterId, // recruiter_id (from frontend)
        null, // video_introduction_url (can be updated later)
        null, // current_salary (can be updated later)
        null, // expected_monthly_salary (can be updated later)
        null // shift (can be updated later)
      ]
      
      console.log('📊 Executing recruits table insert with params:', recruitsParams)
      console.log('👤 Recruiter ID being saved:', recruiterId)
      console.log('📋 Recruits table insert query:', recruitsQuery)
      
      const recruitsResult = await pool.query(recruitsQuery, recruitsParams)
      console.log('✅ Recruits table insert successful:', recruitsResult.rows[0])
      
    } catch (recruitsError) {
      console.error('⚠️ Warning: Failed to save to main database:', recruitsError)
      // Don't fail the entire request if main database save fails
      // The BPOC update was successful
    }

    console.log('✅ Application status updated successfully in BPOC database:', rows[0])
    return NextResponse.json({ success: true, application: rows[0] })
  } catch (error) {
    console.error('❌ Error updating application status:', error)
    return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 })
  }
}


