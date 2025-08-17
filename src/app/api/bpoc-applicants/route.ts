import { NextResponse } from 'next/server'
import { bpocPool } from '@/lib/database'
import pool from '@/lib/database'

export async function GET(request: Request) {
  try {
    console.log('🔧 GET request received for applicants')
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const diagnose = searchParams.get('diagnose') === 'true'
    
    console.log('🔍 Status filter:', statusFilter)
    console.log('🔍 Diagnose mode:', diagnose)
    
    if (!pool) {
      console.log('❌ Main database is not configured')
      return NextResponse.json({ error: 'Main database is not configured' }, { status: 500 })
    }

    // Test database connection
    try {
      await pool.query('SELECT 1')
      console.log('✅ Database connection test successful')
    } catch (connectionError) {
      console.error('❌ Database connection test failed:', connectionError)
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: connectionError instanceof Error ? connectionError.message : 'Unknown connection error'
      }, { status: 500 })
    }

    // Build query with optional status filter
    let applicantsQuery = `
      SELECT 
        r.id,
        r.bpoc_application_ids,
        r.applicant_id,
        r.job_ids,
        r.resume_slug,
        r.status,
        r.created_at,
        r.updated_at,
        r.video_introduction_url,
        r.current_salary,
        r.expected_monthly_salary,
        r.shift,
        COALESCE(r.position, 0) as position
      FROM public.bpoc_recruits r
    `
    
    let applicants: any[] = []
    
    // Add WHERE clause if status filter is provided
    if (statusFilter) {
      applicantsQuery += ` WHERE r.status = $1`
      applicantsQuery += ` ORDER BY COALESCE(r.position, 0), r.created_at DESC LIMIT 500`
      console.log('📊 Executing applicants query with status filter:', statusFilter)
      const result = await pool.query(applicantsQuery, [statusFilter])
      applicants = result.rows
      console.log('📊 Found applicants with status', statusFilter, ':', applicants.length)
      if (applicants.length > 0) {
        console.log('📊 Sample applicant:', applicants[0])
      }
      
      // Return early for filtered results (no need for BPOC enrichment for count)
      return NextResponse.json(applicants)
    } else {
      // No status filter - return all applicants with enrichment
      applicantsQuery += ` ORDER BY COALESCE(r.position, 0), r.created_at DESC LIMIT 500`
      console.log('📊 Executing applicants query from main database (all statuses)')
      console.log('🔍 Applicants Query:', applicantsQuery)
      
      const result = await pool.query(applicantsQuery)
      applicants = result.rows
      console.log('📊 Found applicants:', applicants.length)
      if (applicants.length > 0) {
        console.log('📊 Sample applicant:', applicants[0])
      }
    }

    // If we have BPOC database access, fetch additional user and job details
    let enrichedData = applicants
    
    // Add diagnostic information if requested
    if (diagnose) {
      console.log('🔍 DIAGNOSTIC MODE: Analyzing current data state...')
      
      // Check for duplicate arrays
      const duplicateAnalysis = applicants.map(app => ({
        id: app.id,
        applicant_id: app.applicant_id,
        job_ids_length: app.job_ids ? app.job_ids.length : 0,
        bpoc_app_ids_length: app.bpoc_application_ids ? app.bpoc_application_ids.length : 0,
        job_ids: app.job_ids,
        bpoc_application_ids: app.bpoc_application_ids,
        has_duplicates: app.job_ids && app.job_ids.length > 1 || app.bpoc_application_ids && app.bpoc_application_ids.length > 1
      }))
      
      const recordsWithDuplicates = duplicateAnalysis.filter(app => app.has_duplicates)
      console.log(`🔍 Found ${recordsWithDuplicates.length} records with potential duplicates`)
      
      if (recordsWithDuplicates.length > 0) {
        console.log('🔍 Sample records with duplicates:', recordsWithDuplicates.slice(0, 3))
      }
      
      // Add diagnostic info to response
      enrichedData = enrichedData.map(app => ({
        ...app,
        _diagnostic: {
          job_ids_length: app.job_ids ? app.job_ids.length : 0,
          bpoc_app_ids_length: app.bpoc_application_ids ? app.bpoc_application_ids.length : 0,
          has_duplicates: app.job_ids && app.job_ids.length > 1 || app.bpoc_application_ids && app.bpoc_application_ids.length > 1
        }
      }))
    }
    
    if (bpocPool) {
      try {
        const applicationIds = applicants.flatMap(app => app.bpoc_application_ids || []).filter(Boolean)
        const jobIds = applicants.flatMap(app => app.job_ids || []).filter(Boolean)
        
        let enrichmentData: any[] = []
        let jobData: any[] = []
        
        // Fetch application-based enrichment data
        if (applicationIds.length > 0) {
          const enrichmentQuery = `
            SELECT 
              a.id::text,
              a.user_id::text,
              u.first_name,
              u.last_name,
              u.full_name,
              u.avatar_url,
              p.job_title,
              m.company AS company_name,
              a.job_id,
              a.status::text as application_status,
              a.created_at as application_created_at
            FROM public.applications a
            JOIN public.users u ON u.id = a.user_id
            LEFT JOIN public.processed_job_requests p ON p.id = a.job_id
            LEFT JOIN public.members m ON m.company_id = p.company_id
            WHERE a.id IN (${applicationIds.map((_, i) => `$${i + 1}`).join(',')})
          `
          
          console.log('📊 Fetching enrichment data from BPOC for application IDs:', applicationIds)
          const { rows } = await bpocPool.query(enrichmentQuery, applicationIds)
          enrichmentData = rows
          console.log('📊 Found enrichment data:', enrichmentData.length)
        }
        
        // Fetch job-based data for job_ids that might not have applications yet
        if (jobIds.length > 0) {
          const jobQuery = `
            SELECT 
              p.id as job_id,
              p.job_title,
              m.company AS company_name
            FROM public.processed_job_requests p
            LEFT JOIN public.members m ON m.company_id = p.company_id
            WHERE p.id IN (${jobIds.map((_, i) => `$${i + 1}`).join(',')})
          `
          
          console.log('📊 Fetching job data from BPOC for job IDs:', jobIds)
          const { rows } = await bpocPool.query(jobQuery, jobIds)
          jobData = rows
          console.log('📊 Found job data:', jobData.length)
        }
        
        // Merge enrichment data with applicants
        enrichedData = applicants.map(applicant => {
          // Get ALL application data for this applicant
          const applicantApplications = enrichmentData.filter(e => 
            applicant.bpoc_application_ids?.includes(e.id)
          )
          
          // Get ALL job data for this applicant's job_ids
          const applicantJobs = jobData.filter(j => 
            applicant.job_ids?.includes(j.job_id)
          )
          
          // Use the first application for basic user data
          const firstApplication = applicantApplications[0] || enrichmentData.find(e => e.user_id === applicant.applicant_id)
          
          // Collect all job-company pairs to maintain relationships
          const applicationJobPairs = applicantApplications
            .filter(app => app.job_title)
            .map(app => ({
              job_title: app.job_title,
              company_name: app.company_name || null,
              application_status: app.application_status || 'submitted',
              application_created_at: app.application_created_at
            }))
          
          const directJobPairs = applicantJobs
            .filter(job => job.job_title)
            .map(job => ({
              job_title: job.job_title,
              company_name: job.company_name || null,
              application_status: 'submitted', // Default status for jobs without applications
              application_created_at: null // No specific application date for job-only entries
            }))
          
                    // Combine and deduplicate job pairs (keeping job-company-status relationships intact)
          const allJobPairs = [...applicationJobPairs, ...directJobPairs]
          const uniqueJobPairs = allJobPairs.filter((pair, index, self) =>
            index === self.findIndex(p => p.job_title === pair.job_title && p.company_name === pair.company_name)
          )
          
          // Extract titles, companies, statuses, and timestamps while maintaining index relationships
          const allJobTitles = uniqueJobPairs.map(pair => pair.job_title)
          const allCompanies = uniqueJobPairs.map(pair => pair.company_name)
          const allJobStatuses = uniqueJobPairs.map(pair => pair.application_status || 'submitted')
          const allJobTimestamps = uniqueJobPairs.map(pair => pair.application_created_at)
          

          
          return {
            ...applicant,
            // Add enrichment data
            user_id: firstApplication?.user_id || applicant.applicant_id,
            first_name: firstApplication?.first_name || null,
            last_name: firstApplication?.last_name || null,
            full_name: firstApplication?.full_name || null,
            profile_picture: firstApplication?.avatar_url || null,
            job_title: allJobTitles[0] || null, // Use first job title as primary
            company_name: allCompanies[0] || null, // Use first company as primary
            // Add arrays of all job information
            all_job_titles: allJobTitles,
            all_companies: allCompanies,
            all_job_statuses: allJobStatuses,
            all_job_timestamps: allJobTimestamps,
          }
        })
      } catch (enrichmentError) {
        console.error('⚠️ Warning: Failed to fetch enrichment data from BPOC:', enrichmentError)
        // Continue with basic data if enrichment fails
        enrichedData = applicants
      }
    } else {
      console.log('⚠️ Warning: BPOC database not available, using basic applicant data only')
    }

    console.log('✅ Returning enriched applicants data:', enrichedData.length)
    return NextResponse.json(enrichedData)
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
    
    if (!pool) {
      console.log('❌ Main database is not configured')
      return NextResponse.json({ error: 'Main database is not configured' }, { status: 500 })
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

    // Update status in main database (bpoc_recruits table)
    const updateQuery = `
      UPDATE public.bpoc_recruits 
      SET status = $1, updated_at = now()
      WHERE id = $2
      RETURNING id, status, updated_at, bpoc_application_ids
    `

    console.log('📊 Executing main database update query with params:', [status, id])
    const { rows } = await pool.query(updateQuery, [status, id])
    console.log('📊 Main Database query result:', rows)

    if (rows.length === 0) {
      console.log('❌ Failed to update applicant with id:', id)
      return NextResponse.json({ error: 'Failed to update applicant' }, { status: 500 })
    }

    // If BPOC database is available, check if we should update it
    if (bpocPool) {
      try {
        console.log('🔄 Checking if BPOC database should be updated...')
        
        // Get the bpoc_application_ids from the updated record
        const recruitRecord = rows[0]
        console.log('🔍 Recruit record for BPOC update:', recruitRecord)
        
        // Check current BPOC status before updating
        if (recruitRecord.bpoc_application_ids && recruitRecord.bpoc_application_ids.length > 0) {
          // First, check the current status in BPOC database
          const checkStatusQuery = `
            SELECT id, status::text as current_status
            FROM public.applications 
            WHERE id = ANY($1)
          `
          
          const statusCheckResult = await bpocPool.query(checkStatusQuery, [recruitRecord.bpoc_application_ids])
          console.log('🔍 Current BPOC statuses:', statusCheckResult.rows)
          
          // Define final statuses that should not be changed in BPOC database
          const finalBpocStatuses = ['withdrawn', 'final interview', 'hired', 'failed']
          
          // Separate applications by their current status
          const applicationsWithFinalStatus = statusCheckResult.rows.filter(row => 
            finalBpocStatuses.includes(row.current_status.toLowerCase())
          )
          const applicationsToUpdate = statusCheckResult.rows.filter(row => 
            !finalBpocStatuses.includes(row.current_status.toLowerCase())
          )
          
          if (applicationsWithFinalStatus.length > 0) {
            console.log('🚫 Skipping BPOC update for applications with final status:', 
              applicationsWithFinalStatus.map(app => ({ id: app.id, status: app.current_status }))
            )
          }
          
          if (applicationsToUpdate.length > 0) {
            console.log('📝 Updating BPOC applications without final status:', 
              applicationsToUpdate.map(app => app.id), 'to status:', status)
            
            // Update only applications that don't have final status
            for (const application of applicationsToUpdate) {
              const bpocUpdateQuery = `
                UPDATE public.applications 
                SET status = $1::application_status_enum
                WHERE id = $2
                RETURNING id, status
              `
              
              const bpocResult = await bpocPool.query(bpocUpdateQuery, [status, application.id])
              console.log('✅ BPOC application updated successfully:', bpocResult.rows[0])
            }
          } else {
            console.log('ℹ️ No BPOC applications to update (all have final status)')
          }
                  } else {
            console.log('⚠️ No bpoc_application_ids found in recruit record, trying to query it...')
          
          // Try to get bpoc_application_ids from the recruits table
          try {
            const bpocIdQuery = `
              SELECT bpoc_application_ids FROM public.bpoc_recruits WHERE id = $1
            `
            const bpocIdResult = await pool.query(bpocIdQuery, [id])
            
            if (bpocIdResult.rows.length > 0 && bpocIdResult.rows[0].bpoc_application_ids && bpocIdResult.rows[0].bpoc_application_ids.length > 0) {
              const bpocApplicationIds = bpocIdResult.rows[0].bpoc_application_ids
              console.log('📝 Found bpoc_application_ids:', bpocApplicationIds, 'updating BPOC database...')
              
              // Update all BPOC applications for this recruit
              for (const applicationId of bpocApplicationIds) {
                const bpocUpdateQuery = `
                  UPDATE public.applications 
                  SET status = $1::application_status_enum
                  WHERE id = $2
                  RETURNING id, status
                `
                
                const bpocResult = await bpocPool.query(bpocUpdateQuery, [status, applicationId])
                console.log('✅ BPOC application updated successfully:', bpocResult.rows[0])
              }
            } else {
              console.log('❌ Could not find bpoc_application_ids for recruit ID:', id)
            }
          } catch (fallbackError) {
            console.error('❌ Fallback query failed:', fallbackError)
          }
        }
        
      } catch (bpocError) {
        console.error('⚠️ Warning: Failed to update BPOC database:', bpocError)
        // Don't fail the entire request if BPOC update fails
        // The main database update was successful
      }
    } else {
      console.log('⚠️ BPOC database pool not available, skipping BPOC update')
    }

    console.log('✅ Applicant status updated successfully in main database:', rows[0])
    return NextResponse.json({ success: true, applicant: rows[0] })
  } catch (error) {
    console.error('❌ Error updating applicant status:', error)
    return NextResponse.json({ error: 'Failed to update applicant status' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    console.log('🔧 PUT request received for applicants')
    
    if (!pool) {
      console.log('❌ Main database is not configured')
      return NextResponse.json({ error: 'Main database is not configured' }, { status: 500 })
    }

    const { id, ...updateFields } = await request.json()
    console.log('📝 Request data:', { id, updateFields })

    if (!id) {
      console.log('❌ Missing required field: id')
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 })
    }

    // Define allowed fields that can be updated
    const allowedFields = [
      'resume_slug_recruits',
      'shift', 
      'current_salary',
      'expected_monthly_salary',
      'video_introduction_url'
    ]

    // Filter out only allowed fields
    const validUpdateFields: any = {}
    Object.keys(updateFields).forEach(key => {
      if (allowedFields.includes(key) && updateFields[key] !== undefined) {
        validUpdateFields[key] = updateFields[key]
      }
    })

    if (Object.keys(validUpdateFields).length === 0) {
      console.log('❌ No valid fields to update')
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    console.log('✅ Valid fields to update:', validUpdateFields)

    // Build dynamic UPDATE query
    const setClause = Object.keys(validUpdateFields)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')
    
    const updateQuery = `
      UPDATE public.bpoc_recruits 
      SET ${setClause}, updated_at = now()
      WHERE id = $1
      RETURNING id, ${Object.keys(validUpdateFields).join(', ')}, updated_at
    `

    const queryParams = [id, ...Object.values(validUpdateFields)]
    console.log('📊 Executing update query:', updateQuery)
    console.log('📊 Query parameters:', queryParams)
    console.log('📊 Parameter types:', queryParams.map(p => typeof p))

    let rows: any[] = []
    try {
      const result = await pool.query(updateQuery, queryParams)
      rows = result.rows
      console.log('📊 Update query result:', rows)

      if (rows.length === 0) {
        console.log('❌ Failed to update applicant with id:', id)
        return NextResponse.json({ error: 'Failed to update applicant' }, { status: 500 })
      }

      console.log('✅ Applicant fields updated successfully:', rows[0])
    } catch (dbError) {
      console.error('❌ Database error during update:', dbError)
      console.error('❌ Error message:', dbError instanceof Error ? dbError.message : 'Unknown error')
      console.error('❌ Error stack:', dbError instanceof Error ? dbError.stack : 'No stack trace')
      console.error('❌ Query that failed:', updateQuery)
      console.error('❌ Parameters that failed:', queryParams)
      return NextResponse.json({ 
        error: 'Database update failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error',
        query: updateQuery,
        params: queryParams
      }, { status: 500 })
    }
    
    // Trigger PostgreSQL notification for real-time updates
    try {
      if (pool) {
        // Get the complete applicant record for real-time updates
        const applicantQuery = `
          SELECT id, resume_slug, shift, current_salary, expected_monthly_salary, 
                 video_introduction_url, updated_at, status
          FROM public.bpoc_recruits 
          WHERE id = $1
        `
        const applicantResult = await pool.query(applicantQuery, [id])
        const completeApplicant = applicantResult.rows[0]
        
        const notificationPayload = {
          type: 'applicant_update',
          data: {
            table: 'bpoc_recruits',
            action: 'UPDATE',
            record: completeApplicant,
            old_record: {
              id: id
            },
            timestamp: new Date().toISOString()
          }
        }
        
        // Send notification to trigger WebSocket broadcast
        await pool.query('SELECT pg_notify($1, $2)', [
          'applicant_changes',
          JSON.stringify(notificationPayload)
        ])
        
        console.log('📡 Real-time notification sent for applicant field update:', completeApplicant)
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to send real-time notification:', notificationError)
      // Don't fail the main update if notification fails
    }
    
    return NextResponse.json({ 
      success: true, 
      applicant: rows[0],
      updatedFields: validUpdateFields
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
// Usage: DELETE /api/bpoc-applicants
// This will clean up existing duplicate job_ids and bpoc_application_ids
// 
// Also includes a GET parameter for diagnostics:
// GET /api/bpoc-applicants?diagnose=true - Shows current state of arrays
export async function DELETE(request: Request) {
  try {
    console.log('🧹 DELETE request received for cleanup')
    
    if (!pool) {
      console.log('❌ Main database is not configured')
      return NextResponse.json({ error: 'Main database is not configured' }, { status: 500 })
    }

    // Clean up duplicate job_ids and bpoc_application_ids
    const cleanupQuery = `
      UPDATE public.bpoc_recruits 
      SET 
        job_ids = array_remove(array_remove(job_ids, NULL), job_ids[1]),
        bpoc_application_ids = array_remove(array_remove(bpoc_application_ids, NULL), bpoc_application_ids[1]),
        updated_at = now()
      WHERE 
        (array_length(job_ids, 1) > 1 OR array_length(bpoc_application_ids, 1) > 1)
        AND (job_ids IS NOT NULL OR bpoc_application_ids IS NOT NULL)
      RETURNING id, job_ids, bpoc_application_ids
    `

    console.log('🧹 Executing cleanup query to remove duplicate IDs')
    const result = await pool.query(cleanupQuery)
    
    const cleanedCount = result.rows.length
    console.log(`✅ Cleanup completed. Fixed ${cleanedCount} records with duplicate IDs`)
    
    if (cleanedCount > 0) {
      console.log('📊 Sample cleaned records:', result.rows.slice(0, 3))
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cleanup completed successfully',
      cleanedRecords: cleanedCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    return NextResponse.json({ 
      error: 'Failed to cleanup duplicate IDs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


