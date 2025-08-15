import { NextRequest, NextResponse } from 'next/server'
import { bpocPool } from '@/lib/database'

export async function PATCH(request: NextRequest) {
  try {
    console.log('🔧 PATCH request received for applicant positions')
    
    if (!bpocPool) {
      console.log('❌ BPOC database is not configured')
      return NextResponse.json({ error: 'BPOC database is not configured' }, { status: 500 })
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
    
    // First, check if position column exists in applications table
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'applications' 
      AND column_name = 'position'
    `
    
    const columnCheck = await bpocPool.query(checkColumnQuery)
    const positionColumnExists = columnCheck.rows.length > 0
    
    if (!positionColumnExists) {
      console.log('⚠️ Position column does not exist, creating it...')
      
      // Add position column to applications table
      await bpocPool.query(`
        ALTER TABLE public.applications 
        ADD COLUMN position INTEGER DEFAULT 0
      `)
      
      // Create index for fast sorting
      await bpocPool.query(`
        CREATE INDEX IF NOT EXISTS idx_applications_status_position 
        ON public.applications(status, position)
      `)
      
      console.log('✅ Position column and index created')
    }
    
    // Update positions in the BPOC applications table
    for (const position of positions) {
      console.log(`📝 Updating position for application ${position.id} to ${position.position}`)
      await bpocPool.query(
        'UPDATE public.applications SET position = $1 WHERE id = $2',
        [position.position, position.id]
      )
    }
    
    console.log('✅ All positions updated successfully')
    return NextResponse.json({ message: 'Applicant positions updated successfully' })
  } catch (error) {
    console.error('❌ Error updating applicant positions:', error)
    return NextResponse.json(
      { error: 'Failed to update applicant positions' },
      { status: 500 }
    )
  }
}
