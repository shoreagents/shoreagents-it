import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createMemberCompany } from '@/lib/db-utils'

export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting company creation...')
    console.log('API: Request URL:', request.url)
    console.log('API: Request method:', request.method)
    console.log('API: Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Simple authentication check - if they can reach this endpoint, they're logged in
    // The admin dashboard already protects this route

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
    
    console.log('API: Form data extracted:', {
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
    if (!company || !address || !phone || !country || !service) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
    console.log('Logo file received:', {
      hasLogo: !!logo,
      logoSize: logo?.size,
      logoName: logo?.name,
      logoType: logo?.type
    })
    
    if (logo && logo.size > 0) {
      try {
        // Use service role key for storage operations (more permissions)
        const supabase = createServiceClient()
        
        // Create folder structure: CompanyName/Logos (keep original name)
        const logoExt = logo.name.split('.').pop()
        const logoFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${logoExt}`
        const folderPath = `${company}/Logos`
        const fullPath = `${folderPath}/${logoFileName}`
        
        console.log('Attempting to upload logo to Supabase storage:', {
          bucket: 'members',
          path: fullPath,
          fileName: logo.name,
          fileSize: logo.size,
          fileType: logo.type
        })
        
        // Upload logo to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('members')
          .upload(fullPath, logo, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) {
          console.error('Logo upload error details:', {
            error: uploadError,
            message: uploadError.message
          })
          // Don't fail the entire request, just skip logo upload
          console.log('Logo upload failed, continuing without logo')
          logoUrl = null
        } else {
          console.log('Upload successful, data:', uploadData)
          
          // Get public URL for the uploaded logo
          const { data: urlData } = supabase.storage
            .from('members')
            .getPublicUrl(fullPath)
          
          logoUrl = urlData.publicUrl
          console.log('Logo uploaded successfully to:', fullPath)
          console.log('Public URL:', logoUrl)
          
          // Verify the URL was generated
          if (!logoUrl) {
            console.error('Failed to generate public URL for uploaded logo')
            logoUrl = null
          }
        }
        
      } catch (uploadError) {
        console.error('Logo upload exception:', uploadError)
        // Don't fail the entire request, just skip logo upload
        console.log('Logo upload failed due to exception, continuing without logo')
        logoUrl = null
      }
    }

    // Prepare website data (convert to array format as per schema)
    // Note: website field is _text (array type) in the database
    const websiteArray = website ? [website] : []

    // Format service field for consistency (capitalize first letter of each word)
    const formattedService = service ? service
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') : null

    console.log('API: Attempting database insertion via db-utils...')
    const companyData = await createMemberCompany({
      company,
      address,
      phone,
      country,
      service: formattedService,
      website: websiteArray,
      logo: logoUrl,
      badge_color: badge_color && badge_color.trim() !== '' ? badge_color : undefined,
      status: status as 'Current Client' | 'Lost Client',
    })

    console.log('API: Returning success response')
    return NextResponse.json({ 
      success: true, 
      company: companyData 
    })

  } catch (error) {
    console.error('API: Unexpected error:', error)
    console.error('API: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // For now, return empty array - you can implement database fetch later
    return NextResponse.json({ companies: [] })

  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
