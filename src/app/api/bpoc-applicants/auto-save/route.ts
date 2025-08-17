import { NextResponse } from 'next/server'
import { bpocPool } from '@/lib/database'
import pool from '@/lib/database'

export async function POST() {
  try {
    console.log('🔧 Auto-save request received for new applications')
    
    if (!bpocPool) {
      console.log('❌ BPOC database is not configured')
      return NextResponse.json({ error: 'BPOC database is not configured' }, { status: 500 })
    }

    if (!pool) {
      console.log('❌ Main database pool not available')
      return NextResponse.json({ error: 'Main database not available' }, { status: 500 })
    }

    // Fetch only submitted applications from BPOC database
    const applicationsQuery = `
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
      WHERE a.status = 'submitted'
      ORDER BY a.created_at DESC
    `

    console.log('📊 Fetching submitted applications from BPOC database')
    const { rows: applications } = await bpocPool.query(applicationsQuery)
    console.log(`📊 Found ${applications.length} submitted applications in BPOC database`)

    // Check which applicants already exist in recruits table
    const existingRecruitsQuery = `
      SELECT applicant_id, job_ids, bpoc_application_ids FROM public.bpoc_recruits
    `
    const { rows: existingRecruits } = await pool.query(existingRecruitsQuery)
    
    // Convert to Map for faster lookup
    const existingApplicants = new Map(
      existingRecruits.map(r => [r.applicant_id, r])
    )
    
    console.log(`📊 Found ${existingRecruits.length} existing applicants in recruits table`)
    console.log(`📊 Found ${applications.length} submitted applications in BPOC`)
    
    // Group applications by applicant_id
    const applicationsByApplicant = new Map()
    applications.forEach(app => {
      if (!applicationsByApplicant.has(app.user_id)) {
        applicationsByApplicant.set(app.user_id, [])
      }
      applicationsByApplicant.get(app.user_id).push(app)
    })
    
    console.log(`📊 Grouped into ${applicationsByApplicant.size} unique applicants`)
    
    // Process each applicant
    let savedCount = 0
    let updatedCount = 0
    const errors: string[] = []
    
    // Safety check: prevent processing too many applicants at once
    const maxApplicants = 1000
    if (applicationsByApplicant.size > maxApplicants) {
      console.warn(`⚠️ Warning: Processing ${applicationsByApplicant.size} applicants (limit: ${maxApplicants}). This might indicate a potential issue.`)
    }

    for (const [applicantId, applicantApps] of applicationsByApplicant) {
      try {
        const existingApplicant = existingApplicants.get(applicantId)
        
        if (existingApplicant) {
          // Update existing applicant with new applications
          const newJobIds = applicantApps
            .filter((app: any) => !existingApplicant.job_ids.includes(app.job_id))
            .map((app: any) => app.job_id)
          
          const newBpocAppIds = applicantApps
            .filter((app: any) => !existingApplicant.bpoc_application_ids.includes(app.id))
            .map((app: any) => app.id)
          
          if (newJobIds.length > 0 || newBpocAppIds.length > 0) {
            // Log what we're about to update
            console.log(`📝 Updating applicant ${applicantId}:`, {
              existingJobIds: existingApplicant.job_ids,
              existingAppIds: existingApplicant.bpoc_application_ids,
              newJobIds,
              newBpocAppIds
            })
            
            // Update with new applications - DEDUPLICATED VERSION
            const updateQuery = `
              UPDATE public.bpoc_recruits 
              SET 
                job_ids = CASE 
                  WHEN $1::int[] IS NOT NULL AND array_length($1, 1) > 0 
                  THEN (
                    SELECT ARRAY(
                      SELECT DISTINCT unnest(array_cat(job_ids, $1))
                    )
                  )
                  ELSE job_ids 
                END,
                bpoc_application_ids = CASE 
                  WHEN $2::uuid[] IS NOT NULL AND array_length($2, 1) > 0 
                  THEN (
                    SELECT ARRAY(
                      SELECT DISTINCT unnest(array_cat(bpoc_application_ids, $2::uuid[]))
                    )
                  )
                  ELSE bpoc_application_ids 
                END,
                updated_at = now()
              WHERE applicant_id = $3
              RETURNING id
            `
            
            const updateParams = [
              newJobIds,
              newBpocAppIds,
              applicantId
            ]
            
            console.log(`📝 Updating applicant ${applicantId} with new applications:`, { newJobIds, newBpocAppIds })
            const result = await pool.query(updateQuery, updateParams)
            console.log(`✅ Successfully updated applicant ${applicantId}`)
            updatedCount++
          } else {
            console.log(`⏭️ Applicant ${applicantId} already has all applications, skipping...`)
          }
        } else {
          // Create new applicant record
          const insertQuery = `
            INSERT INTO public.bpoc_recruits (
              applicant_id, 
              job_ids, 
              bpoc_application_ids, 
              resume_slug, 
              status,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
          `
          
          // Ensure no duplicate job_ids or application_ids in new records
          const uniqueJobIds = [...new Set(applicantApps.map((app: any) => app.job_id))]
          const uniqueAppIds = [...new Set(applicantApps.map((app: any) => app.id))]
          
          const insertParams = [
            applicantId,
            uniqueJobIds,
            uniqueAppIds,
            applicantApps[0].resume_slug, // Use first app's resume
            'submitted', // Default status
            applicantApps[0].created_at // Use first app's created date
          ]
          
          console.log(`📝 Creating new applicant ${applicantId} with ${applicantApps.length} applications`)
          const result = await pool.query(insertQuery, insertParams)
          console.log(`✅ Successfully created applicant ${applicantId} with recruit ID: ${result.rows[0].id}`)
          savedCount++
        }
        
      } catch (error) {
        const errorMsg = `Failed to process applicant ${applicantId}: ${error}`
        console.error(`❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    console.log(`✅ Auto-save completed. Created: ${savedCount}, Updated: ${updatedCount}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Auto-save completed',
      createdCount: savedCount,
      updatedCount: updatedCount,
      totalApplicants: applicationsByApplicant.size,
      totalApplications: applications.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ Error during auto-save:', error)
    return NextResponse.json({ 
      error: 'Failed to process auto-save',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
