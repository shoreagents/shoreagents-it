import { NextRequest, NextResponse } from 'next/server'
import { getMembersPaginated, getAgentsByMember, getClientsByMember, createMemberCompany } from '@/lib/db-utils'
import { createServiceClient } from '@/lib/supabase/server'
import { MembersActivityLogger } from '@/lib/logs-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const memberIdForUsers = searchParams.get('usersOfMember')
    const usersType = (searchParams.get('type') || '').toLowerCase()

    if (memberIdForUsers && (usersType === 'agents' || usersType === 'clients')) {
      const memberId = parseInt(memberIdForUsers, 10)
      if (Number.isNaN(memberId)) {
        return NextResponse.json({ error: 'Invalid member id' }, { status: 400 })
      }
      if (usersType === 'agents') {
        const users = await getAgentsByMember(memberId)
        return NextResponse.json({ users })
      }
      const users = await getClientsByMember(memberId)
      return NextResponse.json({ users })
    }
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '40', 10)
    const search = searchParams.get('search') || ''
    const sortField = searchParams.get('sortField') || 'company'
    const sortDirection = (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc'

    const { members, totalCount } = await getMembersPaginated({ search, page, limit, sortField, sortDirection })
    const totalPages = Math.ceil(totalCount / Math.max(1, limit))

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Failed to fetch members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀🚀🚀 API ROUTE EXECUTED - POST /api/members 🚀🚀🚀')
    console.log('API: Starting member creation...')
    console.log('API: Request URL:', request.url)
    console.log('API: Request method:', request.method)
    console.log('API: Request headers:', Object.fromEntries(request.headers.entries()))
    
    const formData = await request.formData()
    
    // Debug: Log all FormData entries
    console.log('🔍 All FormData entries:')
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`)
    }
    
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
    
    console.log('🔍 API extracted form data:')
    console.log('  company:', company)
    console.log('  address:', address)
    console.log('  phone:', phone)
    console.log('  country:', country)
    console.log('  service:', service)
    console.log('  website:', website)
    console.log('  logo:', logo ? `File: ${logo.name}` : 'none')
    console.log('  badge_color:', badge_color)
    console.log('  status:', status)
    
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
    if (!company) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }
    
    // Validate status field
    if (status && status !== 'Current Client' && status !== 'Lost Client') {
      console.log('API: Invalid status value:', status)
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }
    
    // Set default values if not provided
    const finalBadgeColor = badge_color || '#0EA5E9'
    const finalStatus: 'Current Client' | 'Lost Client' = status as 'Current Client' | 'Lost Client' || 'Current Client'
    
    console.log('API: Final values for database:')
    console.log('  badge_color:', finalBadgeColor)
    console.log('  status:', finalStatus)

    // Validate status enum values if provided
    if (status) {
      const validStatuses = ['Current Client', 'Lost Client']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: 'Invalid status value. Must be one of: ' + validStatuses.join(', ') 
        }, { status: 400 })
      }
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
          console.log('🔍 Logo URL details:')
          console.log('  - URL length:', logoUrl?.length)
          console.log('  - URL starts with http:', logoUrl?.startsWith('http'))
          console.log('  - URL includes supabase:', logoUrl?.includes('supabase'))
          
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
    
    console.log('🔍 After logo processing:')
    console.log('  logoUrl final value:', logoUrl)
    console.log('  logoUrl type:', typeof logoUrl)
    console.log('  logoUrl truthy:', !!logoUrl)

    // Prepare website data (convert to array format as per schema)
    const websiteArray = website ? [website] : []
    
    console.log('🔍 Website logging check:')
    console.log('  website:', website)
    console.log('  website type:', typeof website)
    console.log('  website truthy:', !!website)
    console.log('  websiteArray:', websiteArray)
    console.log('  websiteArray length:', websiteArray.length)

    // Format service field for consistency (capitalize first letter of each word)
    const formattedService = service ? service
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') : null

    // Get user ID from request headers (sent by frontend)
    const userId = request.headers.get('x-user-id')
    const currentUserId = userId ? parseInt(userId, 10) : undefined
    
    const memberData = await createMemberCompany({
      company,
      address,
      phone,
      country,
      service: formattedService,
      website: websiteArray,
      logo: logoUrl,
      badge_color: finalBadgeColor,
      status: finalStatus,
      created_by: currentUserId
    })

    // Log company creation activity
    try {
      await MembersActivityLogger.logCompanyCreated(memberData.id, company, memberData.created_by || null)
      
      // Log initial field values if they exist
      if (address && address.trim()) {
        await MembersActivityLogger.logFieldSet(memberData.id, 'Address', address, memberData.created_by || null)
      }
      if (phone && phone.trim()) {
        await MembersActivityLogger.logFieldSet(memberData.id, 'Phone', phone, memberData.created_by || null)
      }
      if (country && country.trim()) {
        await MembersActivityLogger.logFieldSet(memberData.id, 'Country', country, memberData.created_by || null)
      }
      if (formattedService && formattedService.trim()) {
        await MembersActivityLogger.logFieldSet(memberData.id, 'Service', formattedService, memberData.created_by || null)
      }
      if (websiteArray.length > 0) {
        console.log('✅ Logging website to activity log:', websiteArray.join(', '))
        try {
          const logResult = await MembersActivityLogger.logFieldSet(memberData.id, 'Website', websiteArray.join(', '), memberData.created_by || null)
          console.log('✅ Website logged successfully:', logResult)
        } catch (logError) {
          console.error('❌ Error logging website:', logError)
        }
      } else {
        console.log('❌ No website to log - websiteArray is empty')
      }
      
      // Log logo if it was uploaded
      console.log('🔍 Logo logging check:')
      console.log('  logoUrl:', logoUrl)
      console.log('  logoUrl type:', typeof logoUrl)
      console.log('  logoUrl truthy:', !!logoUrl)
      console.log('  logoUrl length:', logoUrl?.length)
      console.log('  logoUrl includes http:', logoUrl?.includes('http'))
      
      if (logoUrl && logoUrl.trim()) {
        // Create a shortened, user-friendly version of the URL
        const urlParts = logoUrl.split('/')
        const fileName = urlParts[urlParts.length - 1] || 'logo'
        const shortenedUrl = fileName
        
        console.log('✅ Logging logo to activity log:', shortenedUrl)
        try {
          const logResult = await MembersActivityLogger.logFieldSet(memberData.id, 'Logo', shortenedUrl, memberData.created_by || null)
          console.log('✅ Logo logged successfully:', logResult)
        } catch (logError) {
          console.error('❌ Error logging logo:', logError)
        }
      } else {
        console.log('❌ No logo to log - logoUrl is falsy or empty')
      }
      
      // Log badge_color and status if they were set
      if (finalBadgeColor) {
        await MembersActivityLogger.logFieldSet(memberData.id, 'Badge Color', finalBadgeColor, memberData.created_by || null)
      }
      if (finalStatus) {
        await MembersActivityLogger.logFieldSet(memberData.id, 'Status', finalStatus, memberData.created_by || null)
      }

    } catch (loggingError) {
      console.error('API: Failed to log activity (non-critical):', loggingError)
      // Don't fail the request if logging fails
    }

    console.log('API: Returning success response')
    return NextResponse.json({ 
      success: true, 
      company: memberData // Keep 'company' key for frontend compatibility
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



