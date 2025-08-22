import { NextRequest, NextResponse } from 'next/server'
import { getMemberById, updateMember } from '@/lib/db-utils'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const memberId = parseInt(id, 10)
    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })
    }

    console.log('API: Starting member update for ID:', memberId)
    
    const formData = await request.formData()
    
    // Extract form data
    const company = formData.get('company') as string
    const address = formData.get('address') as string
    const phone = formData.get('phone') as string
    const country = formData.get('country') as string
    const service = formData.get('service') as string
    const website = formData.get('website') as string
    const logo = formData.get('logo') as File | null
    const badge_color = formData.get('badge_color') as string
    const status = formData.get('status') as string
    
    console.log('API: Form data extracted for update:', {
      company,
      address: address ? 'present' : 'missing',
      phone,
      country,
      service,
      website: website ? 'present' : 'missing',
      logo: logo ? `File: ${logo.name} (${logo.size} bytes)` : 'none',
      badge_color,
      status
    })

    // Validate required fields
    if (!company) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Validate status enum values
    const validStatuses = ['Current Client', 'Lost Client']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status value. Must be one of: ' + validStatuses.join(', ') 
      }, { status: 400 })
    }

    // Handle logo upload if provided
    let logoUrl = null
    if (logo && logo.size > 0) {
      try {
        // Use service role key for storage operations (more permissions)
        const supabase = createServiceClient()
        
        // Create folder structure: CompanyName/Logos (keep original name)
        const logoExt = logo.name.split('.').pop()
        const logoFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${logoExt}`
        const folderPath = `${company}/Logos`
        const fullPath = `${folderPath}/${logoFileName}`
        
        console.log('Attempting to upload logo for update:', {
          bucket: 'members',
          path: fullPath,
          fileName: logo.name,
          fileSize: logo.size
        })
        
        // Upload logo to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('members')
          .upload(fullPath, logo, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) {
          console.error('Logo upload error for update:', uploadError)
          logoUrl = null
        } else {
          // Get public URL for the uploaded logo
          const { data: urlData } = supabase.storage
            .from('members')
            .getPublicUrl(fullPath)
          
          logoUrl = urlData.publicUrl
          console.log('Logo uploaded successfully for update:', logoUrl)
        }
      } catch (uploadError) {
        console.error('Logo upload exception for update:', uploadError)
        logoUrl = null
      }
    }

    // Prepare website data (convert to array format as per schema)
    const websiteArray = website && website.trim() !== '' ? [website] : []

    // Format service field for consistency
    const formattedService = service ? service
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') : null

    // Prepare update data
    const updateData: any = {
      company,
      address,
      phone,
      country,
      service: formattedService,
      website: websiteArray,
      badge_color: badge_color && badge_color.trim() !== '' ? badge_color : undefined,
      status: status as 'Current Client' | 'Lost Client',
    }

    // Only update logo if a new one was uploaded
    if (logoUrl) {
      updateData.logo = logoUrl
    }

    // Clean up the update data - remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )
    
    console.log('API: Updating member in database:', memberId, cleanUpdateData)
    
    // Use db-utils function to update member
    const updatedMember = await updateMember(memberId, cleanUpdateData)
    
    console.log('API: Member updated successfully:', updatedMember)
    
    return NextResponse.json({ 
      success: true, 
      company: updatedMember // Keep 'company' key for frontend compatibility
    })

  } catch (error) {
    console.error('API: Unexpected error during member update:', error)
    
    // Handle specific errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ 
        error: 'Member not found',
        details: error.message
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const memberId = parseInt(id, 10)
    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })
    }

    // Use db-utils function to get member
    const member = await getMemberById(memberId)

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json({ company: member }) // Keep 'company' key for frontend compatibility
  } catch (error) {
    console.error('Error fetching member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
