import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { bpocPool } from '@/lib/database'

export async function PATCH(request: NextRequest) {
  try {
    console.log('🔧 PATCH request received for applicant positions')
    
    if (!pool) {
      console.log('❌ Main database is not configured')
      return NextResponse.json({ error: 'Main database is not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const { positions } = body
    
    console.log('📊 Received position updates:', positions)
    
    if (!positions || !Array.isArray(positions)) {
      return NextResponse.json(
        { error: 'Invalid positions data' },
        { status: 400 }
      )
    }
    
    // First, check if position column exists in bpoc_recruits table
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'bpoc_recruits' 
      AND column_name = 'position'
    `
    
    const columnCheck = await pool.query(checkColumnQuery)
    const positionColumnExists = columnCheck.rows.length > 0
    
    if (!positionColumnExists) {
      console.log('⚠️ Position column does not exist, creating it...')
      
      // Add position column to bpoc_recruits table
      await pool.query(`
        ALTER TABLE public.bpoc_recruits 
        ADD COLUMN position INTEGER DEFAULT 0
      `)
      
      // Create index for fast sorting
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_bpoc_recruits_status_position 
        ON public.bpoc_recruits(status, position)
      `)
      
      console.log('✅ Position column and index created')
    }
    
    // Update positions in the main database (bpoc_recruits table)
    for (const position of positions) {
      console.log(`📝 Updating position for applicant ${position.id} to ${position.position}`)
      await pool.query(
        'UPDATE public.bpoc_recruits SET position = $1 WHERE id = $2',
        [position.position, position.id]
      )
    }
    
    // Sync positions to BPOC database for consistency
    if (bpocPool) {
      try {
        console.log('🔄 Syncing positions to BPOC database...')
        
        for (const position of positions) {
          // Get the bpoc_application_ids for this recruit
          const bpocIdQuery = `
            SELECT bpoc_application_ids FROM public.bpoc_recruits WHERE id = $1
          `
          const bpocIdResult = await pool.query(bpocIdQuery, [position.id])
          
          if (bpocIdResult.rows.length > 0 && bpocIdResult.rows[0].bpoc_application_ids && bpocIdResult.rows[0].bpoc_application_ids.length > 0) {
            const bpocApplicationIds = bpocIdResult.rows[0].bpoc_application_ids
            
            // Check if position column exists in BPOC applications table
            const bpocColumnCheck = await bpocPool.query(`
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'applications' 
              AND column_name = 'position'
            `)
            
            if (bpocColumnCheck.rows.length === 0) {
              console.log('⚠️ Position column does not exist in BPOC applications table, creating it...')
              
              // Add position column to BPOC applications table
              await bpocPool.query(`
                ALTER TABLE public.applications 
                ADD COLUMN position INTEGER DEFAULT 0
              `)
              
              // Create index for fast sorting
              await bpocPool.query(`
                CREATE INDEX IF NOT EXISTS idx_applications_status_position 
                ON public.applications(status, position)
              `)
              
              console.log('✅ Position column and index created in BPOC applications table')
            }
            
            // Update position in all BPOC applications for this recruit
            for (const bpocApplicationId of bpocApplicationIds) {
              console.log(`🔄 Syncing position ${position.position} to BPOC application ${bpocApplicationId}`)
              await bpocPool.query(
                'UPDATE public.applications SET position = $1 WHERE id = $2',
                [position.position, bpocApplicationId]
              )
            }
          } else {
            console.log(`⚠️ No bpoc_application_ids found for recruit ID ${position.id}, skipping BPOC sync`)
          }
        }
        
        console.log('✅ All positions synced to BPOC database successfully')
        
      } catch (bpocError) {
        console.error('⚠️ Warning: Failed to sync positions to BPOC database:', bpocError)
        // Don't fail the entire request if BPOC sync fails
        // The main database positions were updated successfully
      }
    } else {
      console.log('⚠️ BPOC database pool not available, skipping position sync')
    }
    
    console.log('✅ All positions updated successfully in main database')
    return NextResponse.json({ message: 'Applicant positions updated successfully' })
  } catch (error) {
    console.error('❌ Error updating applicant positions:', error)
    return NextResponse.json(
      { error: 'Failed to update applicant positions' },
      { status: 500 }
    )
  }
}
