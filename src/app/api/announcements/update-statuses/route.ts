import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    // Get date from browser (browser's local timezone)
    const body = await request.json()
    const today = body.date || new Date().toISOString().split('T')[0] // Fallback to server date
    
    console.log('Updating announcement statuses based on browser date:', today)
    
    // Update scheduled announcements to 'active' if scheduled_at is today or in the past
    // Only update if current status is 'scheduled' (preserve other statuses)
    const activatedResult = await pool.query(`
      UPDATE public.announcements 
      SET 
        status = 'active',
        sent_at = CASE 
          WHEN sent_at IS NULL THEN CURRENT_TIMESTAMP 
          ELSE sent_at 
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        status = 'scheduled'
        AND scheduled_at IS NOT NULL
        AND DATE(scheduled_at) <= $1
    `, [today])
    
    console.log(`Updated ${activatedResult.rowCount} announcements to active status`)
    
    // Update active announcements to 'expired' if expires_at is today or in the past
    // Only update if current status is 'active' (preserve other statuses)
    const expiredResult = await pool.query(`
      UPDATE public.announcements 
      SET 
        status = 'expired',
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        status = 'active'
        AND expires_at IS NOT NULL
        AND DATE(expires_at) <= $1
    `, [today])
    
    console.log(`Updated ${expiredResult.rowCount} announcements to expired status`)
    
    // Update quick announcements (no scheduled_at, no expires_at) to 'expired' 
    // if sent_at is not today (auto-expire old quick announcements)
    const quickExpiredResult = await pool.query(`
      UPDATE public.announcements 
      SET 
        status = 'expired',
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        status = 'active'
        AND scheduled_at IS NULL
        AND expires_at IS NULL
        AND sent_at IS NOT NULL
        AND DATE(sent_at) < $1
    `, [today])
    
    console.log(`Updated ${quickExpiredResult.rowCount} quick announcements to expired status`)
    
    // Update scheduled announcements that are still in the future to remain 'scheduled'
    // This handles cases where announcements might have been manually set incorrectly
    const scheduledResult = await pool.query(`
      UPDATE public.announcements 
      SET 
        status = 'scheduled',
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        status = 'active'
        AND scheduled_at IS NOT NULL
        AND DATE(scheduled_at) > $1
    `, [today])
    
    console.log(`Updated ${scheduledResult.rowCount} announcements back to scheduled status`)
    
    return NextResponse.json({
      success: true,
      date: today,
      updates: {
        activated: activatedResult.rowCount,
        expired: expiredResult.rowCount,
        quickExpired: quickExpiredResult.rowCount,
        rescheduled: scheduledResult.rowCount
      }
    })
  } catch (error) {
    console.error('Error updating announcement statuses:', error)
    return NextResponse.json(
      { error: 'Failed to update announcement statuses' },
      { status: 500 }
    )
  }
}
