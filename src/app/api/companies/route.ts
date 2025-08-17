import { NextRequest, NextResponse } from 'next/server'
import pool, { bpocPool } from '@/lib/database'
import { createServiceClient } from '@/lib/supabase/server'

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

    console.log('API: Attempting database insertion...')
    
    // Insert company data into members table using Railway database (main system)
    // Schema: members (id, company, address, phone, logo, service, status, created_at, updated_at, badge_color, country, website, company_id)
    // Note: website is _text (array type), status is member_status_enum
    console.log('API: Using Railway database connection')
    
    // Prepare insert data, only including badge_color if it has a value
    const insertColumns = ['company', 'address', 'phone', 'country', 'service', 'website', 'logo', 'status', 'company_id']
    const insertValues = [
      company,
      address,
      phone,
      country,
      formattedService,
      websiteArray,
      logoUrl,
      status as 'Current Client' | 'Lost Client',
      crypto.randomUUID()
    ]
    
    // Add badge_color only if it has a value
    if (badge_color && badge_color.trim() !== '') {
      insertColumns.push('badge_color')
      insertValues.push(badge_color)
    }
    
    const insertData = {
      company,
      address,
      phone,
      country,
      service: formattedService,
      website: websiteArray,
      logo: logoUrl,
      badge_color: badge_color && badge_color.trim() !== '' ? badge_color : undefined,
      status: status as 'Current Client' | 'Lost Client',
      company_id: insertValues[insertValues.length - 1] // Get the generated UUID
    }
    
    console.log('API: Inserting data:', insertData)
    console.log('API: Insert columns:', insertColumns)
    console.log('API: Insert values count:', insertValues.length)
    
    let companyData
    try {
      const placeholders = insertValues.map((_, index) => `$${index + 1}`).join(', ')
      const result = await pool.query(`
        INSERT INTO members (${insertColumns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `, insertValues)

      companyData = result.rows[0]
      console.log('API: Company created successfully in Railway database:', companyData)
      
      // Also insert into BPOC database for recruitment purposes
      if (bpocPool) {
        try {
          console.log('API: Inserting company into BPOC database...')
          const bpocResult = await bpocPool.query(`
            INSERT INTO members (company, company_id)
            VALUES ($1, $2)
            ON CONFLICT (company_id) DO UPDATE SET
              company = EXCLUDED.company,
              updated_at = CURRENT_TIMESTAMP
            RETURNING *
          `, [company, insertData.company_id])
          
          console.log('API: Company synced to BPOC database:', bpocResult.rows[0])
        } catch (bpocError) {
          console.error('API: BPOC database sync failed:', bpocError)
          // Don't fail the main request, just log the error
          console.log('API: Continuing without BPOC sync...')
        }
      } else {
        console.log('API: BPOC database not configured, skipping sync')
      }
    } catch (dbError) {
      console.error('API: Database operation exception:', dbError)
      console.error('API: Exception details:', {
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
      })
      throw dbError
    }

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
