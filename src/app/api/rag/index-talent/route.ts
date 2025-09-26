import { NextRequest, NextResponse } from 'next/server'
import { indexBpocTalentProfile } from '@/lib/rag'
import { getApplicants } from '@/lib/db-utils'

export async function POST(request: NextRequest) {
  try {
    const { applicant_id } = await request.json()
    
    if (!applicant_id) {
      return NextResponse.json({ error: 'applicant_id is required' }, { status: 400 })
    }

    // Get the full applicant data from the database
    const applicants = await getApplicants({ status: 'passed' })
    const applicant = applicants.find(app => app.applicant_id === applicant_id)
    
    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found or not in "passed" status' }, { status: 404 })
    }

    // Index the talent profile in Qdrant using cleaned Applicant interface
    await indexBpocTalentProfile({
      id: applicant.id,
      user_id: applicant.user_id,
      resume_slug: applicant.resume_slug,
      details: applicant.details,
      status: applicant.status,
      created_at: applicant.created_at,
      updated_at: applicant.updated_at,
      profile_picture: applicant.profile_picture,
      first_name: applicant.first_name,
      last_name: applicant.last_name,
      full_name: applicant.full_name,
      employee_id: applicant.employee_id,
      job_title: applicant.job_title,
      company_name: applicant.company_name,
      user_position: applicant.user_position,
      job_ids: applicant.job_ids,
      video_introduction_url: applicant.video_introduction_url,
      current_salary: applicant.current_salary,
      expected_monthly_salary: applicant.expected_monthly_salary,
      shift: applicant.shift,
      all_job_titles: applicant.all_job_titles,
      all_companies: applicant.all_companies,
      all_job_statuses: applicant.all_job_statuses,
      all_job_timestamps: applicant.all_job_timestamps,
      skills: applicant.skills,
      interested_clients: applicant.interested_clients,
      originalSkillsData: applicant.originalSkillsData,
      summary: applicant.summary,
      email: applicant.email,
      phone: applicant.phone,
      address: applicant.address,
      aiAnalysis: applicant.aiAnalysis
    })

    return NextResponse.json({ 
      success: true, 
      message: `Talent profile indexed for ${applicant.full_name || applicant.id}` 
    })

  } catch (error) {
    console.error('Error indexing talent profile:', error)
    return NextResponse.json(
      { error: 'Failed to index talent profile' }, 
      { status: 500 }
    )
  }
}

// Bulk index all "passed" applicants
export async function PUT(request: NextRequest) {
  try {
    const applicants = await getApplicants({ status: 'passed' })
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const applicant of applicants) {
      try {
        await indexBpocTalentProfile({
          id: applicant.id,
          user_id: applicant.user_id,
          resume_slug: applicant.resume_slug,
          details: applicant.details,
          status: applicant.status,
          created_at: applicant.created_at,
          updated_at: applicant.updated_at,
          profile_picture: applicant.profile_picture,
          first_name: applicant.first_name,
          last_name: applicant.last_name,
          full_name: applicant.full_name,
          employee_id: applicant.employee_id,
          job_title: applicant.job_title,
          company_name: applicant.company_name,
          user_position: applicant.user_position,
          job_ids: applicant.job_ids,
          video_introduction_url: applicant.video_introduction_url,
          current_salary: applicant.current_salary,
          expected_monthly_salary: applicant.expected_monthly_salary,
          shift: applicant.shift,
          all_job_titles: applicant.all_job_titles,
          all_companies: applicant.all_companies,
          all_job_statuses: applicant.all_job_statuses,
          all_job_timestamps: applicant.all_job_timestamps,
          skills: applicant.skills,
          interested_clients: applicant.interested_clients,
          originalSkillsData: applicant.originalSkillsData,
          summary: applicant.summary,
          email: applicant.email,
          phone: applicant.phone,
          address: applicant.address,
          aiAnalysis: applicant.aiAnalysis
        })
        successCount++
      } catch (error) {
        errorCount++
        errors.push(`${applicant.id}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk indexing completed`,
      stats: {
        total: applicants.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors
      }
    })

  } catch (error) {
    console.error('Error in bulk indexing:', error)
    return NextResponse.json(
      { error: 'Failed to bulk index talent profiles' }, 
      { status: 500 }
    )
  }
}
