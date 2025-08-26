import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for BPOC database
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Fetch job details from processed_job_requests table
    const { data: jobData, error } = await supabase
      .from('processed_job_requests')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) {
      console.error('Error fetching job details:', error)
      return NextResponse.json(
        { error: 'Failed to fetch job details' },
        { status: 500 }
      )
    }

    if (!jobData) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Transform the data to include company name if available
    const transformedJobData = {
      ...jobData,
      company_name: jobData.company_name || jobData.company || null
    }

    return NextResponse.json(transformedJobData)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
