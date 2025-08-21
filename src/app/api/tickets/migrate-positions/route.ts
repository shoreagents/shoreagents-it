import { NextRequest, NextResponse } from 'next/server'
import { migrateTicketPositions } from '@/lib/db-utils'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting position migration...')
    const { totalUpdated, statusBreakdown } = await migrateTicketPositions()
    console.log(`✅ Migration completed! Updated ${totalUpdated} tickets`)
    return NextResponse.json({ success: true, message: 'Position migration completed successfully', totalUpdated, statusBreakdown })
  } catch (error) {
    console.error('❌ Position migration failed:', error)
    return NextResponse.json(
      { 
        error: 'Position migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
