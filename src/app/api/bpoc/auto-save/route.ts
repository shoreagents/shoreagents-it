import { NextResponse } from 'next/server'
import { autoSaveSubmittedApplications } from '@/lib/db-utils'

export async function POST() {
  try {
    console.log('🔧 Auto-save request received for new applications')
    const result = await autoSaveSubmittedApplications()
    console.log(`✅ Auto-save completed. Created: ${result.createdCount}, Updated: ${result.updatedCount}`)
    return NextResponse.json({ success: true, message: 'Auto-save completed', ...result })

  } catch (error) {
    console.error('❌ Error during auto-save:', error)
    return NextResponse.json({ 
      error: 'Failed to process auto-save',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
