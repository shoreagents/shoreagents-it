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

    // Index the talent profile in Qdrant
    await indexBpocTalentProfile({
      applicant_id: applicant.applicant_id,
      first_name: applicant.first_name,
      last_name: applicant.last_name,
      summary: applicant.summary,
      skills: applicant.skills,
      current_salary: applicant.current_salary,
      expected_monthly_salary: applicant.expected_monthly_salary,
      all_job_titles: applicant.all_job_titles,
      all_companies: applicant.all_companies,
      video_introduction_url: applicant.video_introduction_url,
      aiAnalysis: applicant.aiAnalysis
    })

    return NextResponse.json({ 
      success: true, 
      message: `Talent profile indexed for ${applicant.full_name || applicant.applicant_id}` 
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
          applicant_id: applicant.applicant_id,
          first_name: applicant.first_name,
          last_name: applicant.last_name,
          summary: applicant.summary,
          skills: applicant.skills,
          current_salary: applicant.current_salary,
          expected_monthly_salary: applicant.expected_monthly_salary,
          all_job_titles: applicant.all_job_titles,
          all_companies: applicant.all_companies,
          video_introduction_url: applicant.video_introduction_url,
          aiAnalysis: applicant.aiAnalysis
        })
        successCount++
      } catch (error) {
        errorCount++
        errors.push(`${applicant.applicant_id}: ${error}`)
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
