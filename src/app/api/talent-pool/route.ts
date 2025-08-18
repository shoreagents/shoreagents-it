import { NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET() {
  try {
    console.log('🎯 Fetching talent pool data from database')
    
    if (!pool) {
      console.log('❌ Database pool not available')
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Query to get talent pool with all related data
    const query = `
      SELECT 
        tp.id,
        tp.applicant_id,
        tp.interested_clients,
        tp.last_contact_date,
        tp.created_at as talent_pool_created_at,
        tp.updated_at as talent_pool_updated_at,
        
        -- Comment data
        c.comment,
        c.comment_type,
        c.created_by as comment_created_by,
        c.created_at as comment_created_at,
        
        -- Applicant data from bpoc_recruits
        br.resume_slug,
        br.status,
        br.video_introduction_url,
        br.current_salary,
        br.expected_monthly_salary,
        br.shift,
        br.position,
        br.job_ids,
        br.bpoc_application_ids,
        br.created_at as recruit_created_at,
        
        -- User data (creator of comment)
        u.email as comment_creator_email,
        u.user_type as comment_creator_type
        
      FROM public.talent_pool tp
      LEFT JOIN public.bpoc_comments c ON tp.comment_id = c.id
      LEFT JOIN public.bpoc_recruits br ON tp.applicant_id = br.applicant_id
      LEFT JOIN public.users u ON c.created_by = u.id
      ORDER BY tp.created_at DESC
    `

    const { rows } = await pool.query(query)
    
    console.log(`📊 Found ${rows.length} talent pool entries`)
    
    // Transform the data to match frontend expectations
    const talentPool = rows.map(row => ({
      id: row.id,
      applicant_id: row.applicant_id,
      interested_clients: row.interested_clients || [],
      last_contact_date: row.last_contact_date,
      created_at: row.talent_pool_created_at,
      updated_at: row.talent_pool_updated_at,
      
      // Comment information
      comment: {
        id: row.comment_id,
        text: row.comment,
        type: row.comment_type,
        created_by: row.comment_created_by,
        created_at: row.comment_created_at,
        creator: {
          email: row.comment_creator_email,
          user_type: row.comment_creator_type
        }
      },
      
      // Applicant information
      applicant: {
        applicant_id: row.applicant_id,
        resume_slug: row.resume_slug,
        status: row.status,
        video_introduction_url: row.video_introduction_url,
        current_salary: row.current_salary,
        expected_monthly_salary: row.expected_monthly_salary,
        shift: row.shift,
        position: row.position,
        job_ids: row.job_ids || [],
        bpoc_application_ids: row.bpoc_application_ids || [],
        created_at: row.recruit_created_at
      }
    }))

    return NextResponse.json({
      success: true,
      data: talentPool,
      count: talentPool.length
    })

  } catch (error) {
    console.error('❌ Error fetching talent pool:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch talent pool data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// Update interested clients for a talent pool entry
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const talentPoolId = searchParams.get('id')
    const body = await request.json()
    
    if (!talentPoolId) {
      return NextResponse.json({ error: 'Talent pool ID is required' }, { status: 400 })
    }

    const { interested_clients, last_contact_date } = body

    console.log(`🔄 Updating talent pool entry ${talentPoolId}`)

    if (!pool) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    let updateQuery = 'UPDATE public.talent_pool SET updated_at = NOW()'
    const queryParams: any[] = [talentPoolId]
    let paramIndex = 2

    if (interested_clients !== undefined) {
      updateQuery += `, interested_clients = $${paramIndex}`
      queryParams.push(interested_clients)
      paramIndex++
    }

    if (last_contact_date !== undefined) {
      updateQuery += `, last_contact_date = $${paramIndex}`
      queryParams.push(last_contact_date)
      paramIndex++
    }

    updateQuery += ' WHERE id = $1 RETURNING *'

    const { rows } = await pool.query(updateQuery, queryParams)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Talent pool entry not found' }, { status: 404 })
    }

    console.log(`✅ Updated talent pool entry ${talentPoolId}`)

    return NextResponse.json({
      success: true,
      data: rows[0]
    })

  } catch (error) {
    console.error('❌ Error updating talent pool:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update talent pool entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
