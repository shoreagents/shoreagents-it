import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    // Get date from browser (browser's local timezone)
    const body = await request.json()
    const today = body.date || new Date().toISOString().split('T')[0] // Fallback to server date
    
    console.log('Updating event statuses based on browser date:', today)
    
    // Update events to 'ended' status if event_date is in the past
    // Only update if current status is 'upcoming' or 'today' (preserve 'cancelled' status)
    const endedResult = await pool.query(`
      UPDATE public.events 
      SET 
        status = 'ended',
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        event_date < $1 
        AND status IN ('upcoming', 'today')
    `, [today])
    
    console.log(`Updated ${endedResult.rowCount} events to ended status`)
    
    // Update events to 'today' status if event_date is today
    // Only preserve 'cancelled' status, update all others to 'today'
    const todayResult = await pool.query(`
      UPDATE public.events 
      SET 
        status = 'today',
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        event_date = $1 
        AND status != 'cancelled'
    `, [today])
    
    console.log(`Updated ${todayResult.rowCount} events to today status`)
    
    // Update events to 'upcoming' status if event_date is in the future
    // This handles cases where events might have been manually set to 'today' or 'ended' incorrectly
    // Only update if current status is 'today' or 'ended' (preserve 'cancelled' status)
    const upcomingResult = await pool.query(`
      UPDATE public.events 
      SET 
        status = 'upcoming',
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        event_date > $1 
        AND status IN ('today', 'ended')
    `, [today])
    
    console.log(`Updated ${upcomingResult.rowCount} events to upcoming status`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Event statuses updated successfully',
      date: today,
      updates: {
        ended: endedResult.rowCount || 0,
        today: todayResult.rowCount || 0,
        upcoming: upcomingResult.rowCount || 0
      }
    })
    
  } catch (error) {
    console.error('Error updating event statuses:', error)
    return NextResponse.json(
      { error: 'Failed to update event statuses' },
      { status: 500 }
    )
  }
}
