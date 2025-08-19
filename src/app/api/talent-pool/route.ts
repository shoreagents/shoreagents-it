import { NextRequest, NextResponse } from 'next/server'
import pool, { bpocPool } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Fetching talent pool data...')
    
    // Query to get talent pool entries with related data
    const query = `
      SELECT 
        tp.id,
        tp.applicant_id,
        tp.interested_clients,
        tp.last_contact_date,
        tp.created_at,
        tp.updated_at,
        rc.id as comment_id,
        rc.comment as comment_text,
        rc.comment_type,
        rc.created_by,
        rc.created_at as comment_created_at,
        u.email as creator_email,
        u.user_type as creator_user_type,
        br.applicant_id as recruit_applicant_id,
        br.resume_slug,
        br.status,
        br.video_introduction_url,
        br.current_salary,
        br.expected_monthly_salary,
        br.shift,
        br.position,
        br.job_ids,
        br.bpoc_application_ids,
        br.created_at as recruit_created_at
      FROM talent_pool tp
      LEFT JOIN recruits_comments rc ON rc.talent_pool_id = tp.id
      LEFT JOIN users u ON rc.created_by = u.id
      LEFT JOIN bpoc_recruits br ON tp.applicant_id = br.applicant_id
      ORDER BY tp.created_at DESC
    `
    
    const result = await pool.query(query)
    console.log(`✅ Found ${result.rows.length} talent pool records`)
    
    // Group results by talent pool entry
    const talentMap = new Map()
    
    result.rows.forEach(row => {
      if (!talentMap.has(row.id)) {
        talentMap.set(row.id, {
          id: row.id,
          applicant_id: row.applicant_id,
          interested_clients: row.interested_clients || [],
          last_contact_date: row.last_contact_date,
          created_at: row.created_at,
          updated_at: row.updated_at,
          comment: null,
          applicant: {
            applicant_id: row.recruit_applicant_id,
            resume_slug: row.resume_slug,
            status: row.status || 'unknown',
            video_introduction_url: row.video_introduction_url,
            current_salary: row.current_salary,
            expected_monthly_salary: row.expected_monthly_salary,
            shift: row.shift,
            position: row.position || 0,
            job_ids: row.job_ids || [],
            bpoc_application_ids: row.bpoc_application_ids || [],
            created_at: row.recruit_created_at
          }
        })
      }
      
      // Add comment if exists
      if (row.comment_id && !talentMap.get(row.id).comment) {
        talentMap.get(row.id).comment = {
          id: row.comment_id,
          text: row.comment_text,
          type: row.comment_type,
          created_by: row.created_by,
          created_at: row.comment_created_at,
          creator: {
            email: row.creator_email,
            user_type: row.creator_user_type
          }
        }
      }
    })
    
    const data: any[] = Array.from(talentMap.values())

    // Optionally enrich with BPOC users data when configured
    if (bpocPool && data.length > 0) {
      try {
        // Collect unique applicant_ids that look like UUIDs
        const applicantIds: string[] = Array.from(
          new Set(
            data
              .map((t) => t.applicant_id)
              .filter((id: string | null | undefined) => Boolean(id))
          )
        ) as string[]

        if (applicantIds.length > 0) {
          const bpocQuery = `
            SELECT 
              u.id,
              u.email,
              u.full_name,
              u.avatar_url
            FROM users u
            WHERE u.id = ANY($1::uuid[])
          `

          const bpocResult = await bpocPool.query(bpocQuery, [applicantIds])
          const bpocMap = new Map<string, any>()
          for (const row of bpocResult.rows) {
            bpocMap.set(row.id, row)
          }

          for (const t of data) {
            const user = bpocMap.get(t.applicant_id)
            if (!user) continue
            t.applicant_name = user.full_name
            t.applicant_email = user.email
            t.applicant_avatar = user.avatar_url
          }
        }
      } catch (bpocError) {
        console.error('⚠️ Failed enriching with BPOC users data:', bpocError)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: data,
      total: data.length
    })

  } catch (error) {
    console.error('❌ Error fetching talent pool:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch talent pool data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}