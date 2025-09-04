import { NextRequest, NextResponse } from 'next/server'
import { getMemberById, updateMember, deleteMember, uploadMemberLogo } from '@/lib/db-utils'
import { MembersActivityLogger } from '@/lib/logs-utils'

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
    const shift = formData.get('shift') as string
    const logo = formData.get('logo') as File | null
    const remove_logo = formData.get('remove_logo') as string
    const badge_color = formData.get('badge_color') as string
    const status = formData.get('status') as string
    
    console.log('API: Form data extracted for update:', {
      company,
      address: address ? 'present' : 'missing',
      phone,
      country,
      service: service || 'missing',
      website: website ? 'present' : 'missing',
      shift: shift || 'missing',
      logo: logo ? `File: ${logo.name} (${logo.size} bytes)` : 'none',
      badge_color,
      status
    })
    console.log('API: Service field details:', {
      rawService: service,
      serviceType: typeof service,
      serviceLength: service ? service.length : 0,
      serviceTrimmed: service ? service.trim() : null
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

    // Validate service enum values
    const validServices = ['One Agent', 'Team', 'Workforce']
    if (service && !validServices.includes(service)) {
      return NextResponse.json({ 
        error: 'Invalid service value. Must be one of: ' + validServices.join(', ') 
      }, { status: 400 })
    }

    // Handle logo upload if provided
    let logoUrl = null
    if (logo && logo.size > 0) {
      try {
        logoUrl = await uploadMemberLogo(logo, company)
        console.log('Logo uploaded successfully for update:', logoUrl)
      } catch (uploadError) {
        console.error('Logo upload error for update:', uploadError)
        logoUrl = null
      }
    }

    // Prepare website data (convert to array format as per schema)
    const websiteArray = website && website.trim() !== '' ? [website] : []
    
    console.log('🔍 Website update check:')
    console.log('  website:', website)
    console.log('  website type:', typeof website)
    console.log('  websiteArray:', websiteArray)

    // Format service field for consistency - ensure it matches the enum values exactly
    const formattedService = service ? service.trim() : null
    
    console.log('API: Service formatting:', {
      originalService: service,
      formattedService: formattedService,
      isValidService: formattedService ? validServices.includes(formattedService) : 'null'
    })

    // Prepare update data
    const updateData: any = {
      company,
      address,
      phone,
      country,
      service: formattedService,
      website: websiteArray,
      shift,
      badge_color,
      status,
    }

    // Handle logo updates
    if (remove_logo === 'true') {
      // Remove existing logo
      updateData.logo = null
      console.log('API: Logo removal requested - setting logo to null')
    } else if (logoUrl) {
      // Update with new logo
      updateData.logo = logoUrl
      console.log('API: New logo uploaded:', logoUrl)
    }
    // If neither remove_logo nor new logo, logo field won't be included in update

    // Get the current member data for comparison
    const currentMember = await getMemberById(memberId)
    if (!currentMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    
    console.log('🔍 Logo update processing:')
    console.log('  remove_logo:', remove_logo)
    console.log('  logoUrl:', logoUrl)
    console.log('  currentMember.logo:', currentMember.logo)

    // Clean up the update data - remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )
    
    console.log('API: Updating member in database:', memberId, cleanUpdateData)
    
    // Use db-utils function to update member
    const updatedMember = await updateMember(memberId, cleanUpdateData)
    
    // Log field changes for activity tracking
    try {
      const userId = updatedMember.updated_by || currentMember.created_by || null
      
      // Log company name changes
      if (currentMember.company !== company) {
        if (!currentMember.company || currentMember.company.trim() === '') {
          await MembersActivityLogger.logFieldSet(memberId, 'Company Name', company, userId)
        } else {
          await MembersActivityLogger.logFieldUpdated(memberId, 'Company Name', currentMember.company, company, userId)
        }
      }
      
      // Log address changes
      if (currentMember.address !== address) {
        if (!currentMember.address || currentMember.address.trim() === '') {
          if (address && address.trim()) {
            await MembersActivityLogger.logFieldSet(memberId, 'Address', address, userId)
          }
        } else if (!address || address.trim() === '') {
          await MembersActivityLogger.logFieldRemoved(memberId, 'Address', currentMember.address, userId)
        } else {
          await MembersActivityLogger.logFieldUpdated(memberId, 'Address', currentMember.address, address, userId)
        }
      }
      
      // Log phone changes
      if (currentMember.phone !== phone) {
        if (!currentMember.phone || currentMember.phone.trim() === '') {
          if (phone && phone.trim()) {
            await MembersActivityLogger.logFieldSet(memberId, 'Phone', phone, userId)
          }
        } else if (!phone || phone.trim() === '') {
          await MembersActivityLogger.logFieldRemoved(memberId, 'Phone', currentMember.phone, userId)
        } else {
          await MembersActivityLogger.logFieldUpdated(memberId, 'Phone', currentMember.phone, phone, userId)
        }
      }
      
      // Log country changes
      if (currentMember.country !== country) {
        if (!currentMember.country || currentMember.country.trim() === '') {
          if (country && country.trim()) {
            await MembersActivityLogger.logFieldSet(memberId, 'Country', country, userId)
          }
        } else if (!country || country.trim() === '') {
          await MembersActivityLogger.logFieldRemoved(memberId, 'Country', currentMember.country, userId)
        } else {
          await MembersActivityLogger.logFieldUpdated(memberId, 'Country', currentMember.country, country, userId)
        }
      }
      
      // Log service changes
      if (currentMember.service !== formattedService) {
        if (!currentMember.service || currentMember.service.trim() === '') {
          if (formattedService && formattedService.trim()) {
            await MembersActivityLogger.logFieldSet(memberId, 'Service', formattedService, userId)
          }
        } else if (!formattedService || formattedService.trim() === '') {
          await MembersActivityLogger.logFieldRemoved(memberId, 'Service', currentMember.service, userId)
        } else {
          await MembersActivityLogger.logFieldUpdated(memberId, 'Service', currentMember.service, formattedService, userId)
        }
      }
      
      // Log website changes using special handler
      console.log('🔍 Website comparison for logging:')
      console.log('  currentMember.website:', currentMember.website)
      console.log('  websiteArray:', websiteArray)
      console.log('  currentMember.website JSON:', JSON.stringify(currentMember.website))
      console.log('  websiteArray JSON:', JSON.stringify(websiteArray))
      console.log('  Are they different?', JSON.stringify(currentMember.website) !== JSON.stringify(websiteArray))
      
      if (JSON.stringify(currentMember.website) !== JSON.stringify(websiteArray)) {
        console.log('✅ Website change detected, logging...')
        await MembersActivityLogger.logWebsiteChange(memberId, currentMember.website, websiteArray, userId)
      } else {
        console.log('ℹ️ No website change detected')
      }
      
      // Log badge color changes
      if (currentMember.badge_color !== badge_color) {
        if (!currentMember.badge_color || currentMember.badge_color.trim() === '') {
          if (badge_color && badge_color.trim()) {
            await MembersActivityLogger.logFieldSet(memberId, 'Badge Color', badge_color, userId)
          }
        } else if (!badge_color || badge_color.trim() === '') {
          await MembersActivityLogger.logFieldRemoved(memberId, 'Badge Color', currentMember.badge_color, userId)
        } else {
          await MembersActivityLogger.logFieldUpdated(memberId, 'Badge Color', currentMember.badge_color, badge_color, userId)
        }
      }
      
      // Log status changes
      if (currentMember.status !== status) {
        if (!currentMember.status || currentMember.status.trim() === '') {
          if (status && status.trim()) {
            await MembersActivityLogger.logFieldSet(memberId, 'Status', status, userId)
          }
        } else if (!status || status.trim() === '') {
          await MembersActivityLogger.logFieldRemoved(memberId, 'Status', currentMember.status, userId)
        } else {
          await MembersActivityLogger.logFieldUpdated(memberId, 'Status', currentMember.status, status, userId)
        }
      }
      
      // Log logo changes
      if (remove_logo === 'true') {
        // Logo was removed
        if (currentMember.logo) {
          // Extract filename from the previous logo URL for display
          const urlParts = currentMember.logo.split('/')
          const fileName = urlParts[urlParts.length - 1] || 'logo'
          await MembersActivityLogger.logFieldRemoved(memberId, 'Logo', fileName, userId)
        }
      } else if (logoUrl && currentMember.logo !== logoUrl) {
        // New logo was uploaded
        if (!currentMember.logo || currentMember.logo.trim() === '') {
          // Create a shortened, user-friendly version of the URL
          const urlParts = logoUrl.split('/')
          const fileName = urlParts[urlParts.length - 1] || 'logo'
          const shortenedUrl = fileName
          await MembersActivityLogger.logFieldSet(memberId, 'Logo', shortenedUrl, userId)
        } else {
          // Create shortened versions for both old and new URLs
          const oldUrlParts = currentMember.logo.split('/')
          const oldFileName = oldUrlParts[oldUrlParts.length - 1] || 'logo'
          const oldShortenedUrl = oldFileName
          
          const newUrlParts = logoUrl.split('/')
          const newFileName = newUrlParts[newUrlParts.length - 1] || 'logo'
          const newShortenedUrl = newFileName
          
          await MembersActivityLogger.logFieldUpdated(memberId, 'Logo', oldShortenedUrl, newShortenedUrl, userId)
        }
      }
      
    } catch (loggingError) {
      console.error('API: Failed to log activity (non-critical):', loggingError)
      // Don't fail the request if logging fails
    }
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const memberId = parseInt(id, 10)
    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })
    }

    console.log('API: Starting member deletion for ID:', memberId)
    console.log('API: Raw params id:', id)
    console.log('API: Parsed memberId:', memberId)
    
    // First, check if the member exists using the same method as other functions
    console.log('API: Checking if member exists in database...')
    const existingMember = await getMemberById(memberId)
    
    console.log('API: Database query result:', { existingMember })
    
    if (!existingMember) {
      console.log('API: Member not found, returning 404')
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    
    // Delete the member from the database using db-utils function
    // This will also clean up associated storage files
    console.log('API: Deleting member from database and cleaning up storage...')
    await deleteMember(memberId)
    
    console.log('API: Member deleted successfully from database and storage:', memberId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Member deleted successfully along with all associated files',
      deletedId: memberId
    })

  } catch (error) {
    console.error('API: Unexpected error during member deletion:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
