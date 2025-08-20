import { NextRequest, NextResponse } from 'next/server'
import pool, { bpocPool } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Fetching talent pool data...')

    // Read query params
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').toLowerCase()
    const category = searchParams.get('category') || 'All'
    const sortBy = searchParams.get('sortBy') || 'rating'

    // Detect optional tables
    const commentsExistsResult = await pool.query("SELECT to_regclass('public.bpoc_comments') IS NOT NULL AS exists")
    const hasBpocComments = Boolean(commentsExistsResult?.rows?.[0]?.exists)

    // Build query aligned to main.sql; make comments join optional
    const selectCommon = `
      SELECT 
        tp.id,
        tp.applicant_id,
        tp.interested_clients,
        tp.last_contact_date,
        tp.created_at,
        tp.updated_at,
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
        br.created_at as recruit_created_at`;

    const selectWithComments = `
        , rc.id as comment_id,
        rc.comment as comment_text,
        rc.comment_type,
        rc.created_by,
        rc.created_at as comment_created_at,
        u.email as creator_email,
        u.user_type as creator_user_type`;

    const fromBase = `
      FROM public.talent_pool tp
      LEFT JOIN public.bpoc_recruits br ON tp.applicant_id = br.applicant_id`;

    const joinComments = `
      LEFT JOIN public.bpoc_comments rc ON rc.id = tp.comment_id
      LEFT JOIN public.users u ON rc.created_by = u.id`;

    const orderBy = `
      ORDER BY tp.created_at DESC`;

    const query = `${selectCommon}${hasBpocComments ? selectWithComments : ''}
${fromBase}${hasBpocComments ? joinComments : ''}
${orderBy}`

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
      
      // Add comment if exists and columns present
      if (hasBpocComments && row.comment_id && !talentMap.get(row.id).comment) {
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
    console.log('📊 Processed talent pool data:', data.map(t => ({
      id: t.id,
      applicant_id: t.applicant_id,
      status: t.applicant?.status
    })))

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
          console.log('👥 Fetching user data for applicant IDs:', applicantIds)
          
          const bpocQuery = `
          SELECT 
              u.id,
              u.email,
            u.full_name,
              u.avatar_url
          FROM users u
            WHERE u.id = ANY($1::uuid[])`;

          const bpocResult = await bpocPool.query(bpocQuery, [applicantIds])
          console.log(`👤 Found ${bpocResult.rows.length} user records`)
          
          const bpocMap = new Map<string, any>()
          for (const row of bpocResult.rows) {
            bpocMap.set(row.id, row)
            console.log(`👤 User data for ${row.id}:`, { name: row.full_name, email: row.email })
          }

          let usersFound = 0
          for (const t of data) {
            const user = bpocMap.get(t.applicant_id)
            if (!user) {
              console.log(`❌ No user data found for applicant ${t.applicant_id}`)
              continue
            }
            t.applicant_name = user.full_name
            t.applicant_email = user.email
            t.applicant_avatar = user.avatar_url
            usersFound++
            console.log(`✅ User data enriched for ${t.applicant_id}: ${user.full_name}`)
          }
          
          console.log(`🎯 Successfully enriched ${usersFound} talent entries with user data`)
        }
      } catch (bpocError) {
        console.error('⚠️ Failed enriching with BPOC users data:', bpocError)
      }
    }

    // Optionally enrich with BPOC resume skills data when configured
    if (bpocPool && data.length > 0) {
      try {
        // Use the same applicant IDs that we used for users
        const applicantIds: string[] = Array.from(
          new Set(
            data
              .map((t) => t.applicant_id)
              .filter((id: string | null | undefined) => Boolean(id))
          )
        ) as string[]

        if (applicantIds.length > 0) {
          console.log('🔍 Fetching skills for applicant IDs:', applicantIds)
          
          const skillsQuery = `
            SELECT 
              rg.user_id,
              rg.generated_resume_data
            FROM resumes_generated rg
            WHERE rg.user_id = ANY($1::uuid[])`;

          const skillsResult = await bpocPool.query(skillsQuery, [applicantIds])
          console.log(`📚 Found ${skillsResult.rows.length} resume records with skills`)
          
          const skillsMap = new Map<string, any>()
          const summaryMap = new Map<string, string>()
          
          for (const row of skillsResult.rows) {
            const resumeData = row.generated_resume_data
            skillsMap.set(row.user_id, resumeData)
            
            // Extract summary if available
            if (resumeData.summary && typeof resumeData.summary === 'string') {
              summaryMap.set(row.user_id, resumeData.summary)
            }
            
            console.log(`📋 Resume data for user ${row.user_id}:`, JSON.stringify(resumeData, null, 2))
          }

          let skillsFound = 0
          for (const t of data) {
            const resumeData = skillsMap.get(t.applicant_id)
            if (!resumeData) {
              console.log(`❌ No resume data found for applicant ${t.applicant_id}`)
              continue
            }
            
            // Extract skills from the generated resume data
            try {
              let allSkills: string[] = []
              
              // Check for the nested skills structure
              if (resumeData.skills && typeof resumeData.skills === 'object') {
                // Handle nested skills structure: { soft: [], languages: [], technical: [] }
                if (resumeData.skills.technical && Array.isArray(resumeData.skills.technical)) {
                  allSkills = allSkills.concat(resumeData.skills.technical)
                }
                if (resumeData.skills.soft && Array.isArray(resumeData.skills.soft)) {
                  allSkills = allSkills.concat(resumeData.skills.soft)
                }
                if (resumeData.skills.languages && Array.isArray(resumeData.skills.languages)) {
                  allSkills = allSkills.concat(resumeData.skills.languages)
                }
                
                if (allSkills.length > 0) {
                  t.applicant_skills = allSkills
                  console.log(`✅ Skills extracted from nested structure for ${t.applicant_id}:`, allSkills)
                  skillsFound++
                }
              } else if (resumeData.skills && Array.isArray(resumeData.skills)) {
                // Handle flat skills array
                t.applicant_skills = resumeData.skills
                console.log(`✅ Skills found (flat array) for ${t.applicant_id}:`, resumeData.skills)
                skillsFound++
              } else if (resumeData.sections && resumeData.sections.skills) {
                // Handle skills in sections
                t.applicant_skills = resumeData.sections.skills
                console.log(`✅ Skills found in sections for ${t.applicant_id}:`, resumeData.sections.skills)
                skillsFound++
              } else {
                console.log(`⚠️ No skills found in resume data for ${t.applicant_id}:`, resumeData)
                t.applicant_skills = []
              }
              
              // Extract summary if available
              const summary = summaryMap.get(t.applicant_id)
              if (summary) {
                t.applicant_summary = summary
                console.log(`✅ Summary extracted for ${t.applicant_id}:`, summary.substring(0, 100) + '...')
              }
            } catch (parseError) {
              console.error(`❌ Error parsing skills for ${t.applicant_id}:`, parseError)
              t.applicant_skills = []
            }
          }
          
          console.log(`🎯 Successfully enriched ${skillsFound} talent entries with skills`)
        }
      } catch (skillsError) {
        console.error('⚠️ Failed enriching with BPOC skills data:', skillsError)
      }
    }

    // Apply lightweight filtering/sorting based on query params
    let filtered = data

    if (search) {
      filtered = filtered.filter((t) => {
        const haystack: string[] = []
        if (t.applicant_id) haystack.push(String(t.applicant_id))
        if (t.applicant_name) haystack.push(String(t.applicant_name))
        if (t.applicant_email) haystack.push(String(t.applicant_email))
        if (t.applicant?.status) haystack.push(String(t.applicant.status))
        if (t.comment?.text) haystack.push(String(t.comment.text))
        if (Array.isArray(t.applicant_skills)) haystack.push(...t.applicant_skills.map(String))
        return haystack.some((s) => s.toLowerCase().includes(search))
      })
    }

    // Category filtering placeholder (no explicit category in schema yet)
    if (category && category !== 'All') {
      // Keep as-is; when category exists, apply here
    }

    if (sortBy === 'rate') {
      filtered.sort((a, b) => {
        const ar = Number(a.applicant?.expected_monthly_salary ?? Infinity)
        const br = Number(b.applicant?.expected_monthly_salary ?? Infinity)
        return ar - br
      })
    } else if (sortBy === 'jobs') {
      filtered.sort((a, b) => {
        const ac = Array.isArray(a.interested_clients) ? a.interested_clients.length : 0
        const bc = Array.isArray(b.interested_clients) ? b.interested_clients.length : 0
        return bc - ac
      })
    } else {
      // Default to newest first using created_at
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return NextResponse.json({ 
      success: true, 
      data: filtered,
      total: filtered.length
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