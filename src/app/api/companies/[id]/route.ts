import { NextRequest, NextResponse } from 'next/server'
import { getCompanyById, updateCompany, deleteCompany, uploadCompanyLogo } from '@/lib/db-utils'
import { CompaniesActivityLogger } from '@/lib/logs-utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = parseInt(id, 10)
    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 })
    }

    console.log('API: Starting company update for ID:', companyId)
    
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
        logoUrl = await uploadCompanyLogo(logo, company)
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

    // Get the current company data for comparison
    const currentCompany = await getCompanyById(companyId)
    if (!currentCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    
    console.log('🔍 Logo update processing:')
    console.log('  remove_logo:', remove_logo)
    console.log('  logoUrl:', logoUrl)
    console.log('  currentCompany.logo:', currentCompany.logo)

    // Clean up the update data - remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )
    
    console.log('API: Updating company in database:', companyId, cleanUpdateData)
    
    // Use db-utils function to update company
    const updatedCompany = await updateCompany(companyId, cleanUpdateData)
    
    // Log field changes for activity tracking
    try {
      const userId = updatedCompany.updated_by || currentCompany.created_by || null
      
      // Log company name changes
      if (currentCompany.company !== company) {
        if (!currentCompany.company || currentCompany.company.trim() === '') {
          await CompaniesActivityLogger.logFieldSet(companyId, 'Company Name', company, userId)
        } else {
          await CompaniesActivityLogger.logFieldUpdated(companyId, 'Company Name', currentCompany.company, company, userId)
        }
      }
      
      // Log address changes
      if (currentCompany.address !== address) {
        if (!currentCompany.address || currentCompany.address.trim() === '') {
          if (address && address.trim()) {
            await CompaniesActivityLogger.logFieldSet(companyId, 'Address', address, userId)
          }
        } else if (!address || address.trim() === '') {
          await CompaniesActivityLogger.logFieldRemoved(companyId, 'Address', currentCompany.address, userId)
        } else {
          await CompaniesActivityLogger.logFieldUpdated(companyId, 'Address', currentCompany.address, address, userId)
        }
      }
      
      // Log phone changes
      if (currentCompany.phone !== phone) {
        if (!currentCompany.phone || currentCompany.phone.trim() === '') {
          if (phone && phone.trim()) {
            await CompaniesActivityLogger.logFieldSet(companyId, 'Phone', phone, userId)
          }
        } else if (!phone || phone.trim() === '') {
          await CompaniesActivityLogger.logFieldRemoved(companyId, 'Phone', currentCompany.phone, userId)
        } else {
          await CompaniesActivityLogger.logFieldUpdated(companyId, 'Phone', currentCompany.phone, phone, userId)
        }
      }
      
      // Log country changes
      if (currentCompany.country !== country) {
        if (!currentCompany.country || currentCompany.country.trim() === '') {
          if (country && country.trim()) {
            await CompaniesActivityLogger.logFieldSet(companyId, 'Country', country, userId)
          }
        } else if (!country || country.trim() === '') {
          await CompaniesActivityLogger.logFieldRemoved(companyId, 'Country', currentCompany.country, userId)
        } else {
          await CompaniesActivityLogger.logFieldUpdated(companyId, 'Country', currentCompany.country, country, userId)
        }
      }
      
      // Log service changes
      if (currentCompany.service !== formattedService) {
        if (!currentCompany.service || currentCompany.service.trim() === '') {
          if (formattedService && formattedService.trim()) {
            await CompaniesActivityLogger.logFieldSet(companyId, 'Service', formattedService, userId)
          }
        } else if (!formattedService || formattedService.trim() === '') {
          await CompaniesActivityLogger.logFieldRemoved(companyId, 'Service', currentCompany.service, userId)
        } else {
          await CompaniesActivityLogger.logFieldUpdated(companyId, 'Service', currentCompany.service, formattedService, userId)
        }
      }
      
      // Log website changes using special handler
      console.log('🔍 Website comparison for logging:')
      console.log('  currentCompany.website:', currentCompany.website)
      console.log('  websiteArray:', websiteArray)
      console.log('  currentCompany.website JSON:', JSON.stringify(currentCompany.website))
      console.log('  websiteArray JSON:', JSON.stringify(websiteArray))
      console.log('  Are they different?', JSON.stringify(currentCompany.website) !== JSON.stringify(websiteArray))
      
      if (JSON.stringify(currentCompany.website) !== JSON.stringify(websiteArray)) {
        console.log('✅ Website change detected, logging...')
        await CompaniesActivityLogger.logWebsiteChange(companyId, currentCompany.website, websiteArray, userId)
      } else {
        console.log('ℹ️ No website change detected')
      }
      
      // Log badge color changes
      if (currentCompany.badge_color !== badge_color) {
        if (!currentCompany.badge_color || currentCompany.badge_color.trim() === '') {
          if (badge_color && badge_color.trim()) {
            await CompaniesActivityLogger.logFieldSet(companyId, 'Badge Color', badge_color, userId)
          }
        } else if (!badge_color || badge_color.trim() === '') {
          await CompaniesActivityLogger.logFieldRemoved(companyId, 'Badge Color', currentCompany.badge_color, userId)
        } else {
          await CompaniesActivityLogger.logFieldUpdated(companyId, 'Badge Color', currentCompany.badge_color, badge_color, userId)
        }
      }
      
      // Log status changes
      if (currentCompany.status !== status) {
        if (!currentCompany.status || currentCompany.status.trim() === '') {
          if (status && status.trim()) {
            await CompaniesActivityLogger.logFieldSet(companyId, 'Status', status, userId)
          }
        } else if (!status || status.trim() === '') {
          await CompaniesActivityLogger.logFieldRemoved(companyId, 'Status', currentCompany.status, userId)
        } else {
          await CompaniesActivityLogger.logFieldUpdated(companyId, 'Status', currentCompany.status, status, userId)
        }
      }
      
      // Log logo changes
      if (remove_logo === 'true') {
        // Logo was removed
        if (currentCompany.logo) {
          // Extract filename from the previous logo URL for display
          const urlParts = currentCompany.logo.split('/')
          const fileName = urlParts[urlParts.length - 1] || 'logo'
          await CompaniesActivityLogger.logFieldRemoved(companyId, 'Logo', fileName, userId)
        }
      } else if (logoUrl && currentCompany.logo !== logoUrl) {
        // New logo was uploaded
        if (!currentCompany.logo || currentCompany.logo.trim() === '') {
          // Create a shortened, user-friendly version of the URL
          const urlParts = logoUrl.split('/')
          const fileName = urlParts[urlParts.length - 1] || 'logo'
          const shortenedUrl = fileName
          await CompaniesActivityLogger.logFieldSet(companyId, 'Logo', shortenedUrl, userId)
        } else {
          // Create shortened versions for both old and new URLs
          const oldUrlParts = currentCompany.logo.split('/')
          const oldFileName = oldUrlParts[oldUrlParts.length - 1] || 'logo'
          const oldShortenedUrl = oldFileName
          
          const newUrlParts = logoUrl.split('/')
          const newFileName = newUrlParts[newUrlParts.length - 1] || 'logo'
          const newShortenedUrl = newFileName
          
          await CompaniesActivityLogger.logFieldUpdated(companyId, 'Logo', oldShortenedUrl, newShortenedUrl, userId)
        }
      }
      
    } catch (loggingError) {
      console.error('API: Failed to log activity (non-critical):', loggingError)
      // Don't fail the request if logging fails
    }
    
    console.log('API: Company updated successfully:', updatedCompany)
    
    return NextResponse.json({ 
      success: true, 
      company: updatedCompany // Keep 'company' key for frontend compatibility
    })

  } catch (error) {
    console.error('API: Unexpected error during company update:', error)
    
    // Handle specific errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ 
        error: 'Company not found',
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
    const companyId = parseInt(id, 10)
    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 })
    }

    // Use db-utils function to get company
    const company = await getCompanyById(companyId)

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json({ company: company }) // Keep 'company' key for frontend compatibility
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = parseInt(id, 10)
    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 })
    }

    console.log('API: Starting company deletion for ID:', companyId)
    console.log('API: Raw params id:', id)
    console.log('API: Parsed companyId:', companyId)
    
    // First, check if the company exists using the same method as other functions
    console.log('API: Checking if company exists in database...')
    const existingCompany = await getCompanyById(companyId)
    
    console.log('API: Database query result:', { existingCompany })
    
    if (!existingCompany) {
      console.log('API: Company not found, returning 404')
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    
    // Delete the company from the database using db-utils function
    // This will also clean up associated storage files
    console.log('API: Deleting company from database and cleaning up storage...')
    await deleteCompany(companyId)
    
    console.log('API: Company deleted successfully from database and storage:', companyId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Company deleted successfully along with all associated files',
      deletedId: companyId
    })

  } catch (error) {
    console.error('API: Unexpected error during company deletion:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
