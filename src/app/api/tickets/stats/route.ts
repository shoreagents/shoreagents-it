import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get current date in Asia/Manila timezone and calculate previous periods
    const now = new Date()
    
    // Create dates in Asia/Manila timezone
    const manilaToday = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}))
    const today = new Date(manilaToday.getFullYear(), manilaToday.getMonth(), manilaToday.getDate())
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const twoWeeksAgo = new Date(today)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    
    // Get first day of current month in Manila timezone
    const firstDayOfCurrentMonth = new Date(manilaToday.getFullYear(), manilaToday.getMonth(), 1)
    
    // Get first day of previous month in Manila timezone
    const firstDayOfPreviousMonth = new Date(manilaToday.getFullYear(), manilaToday.getMonth() - 1, 1)

    // Current period queries - no timezone conversion needed since DB stores Manila timezone
    const currentDayQuery = `
      SELECT COUNT(*) as count
      FROM public.tickets 
      WHERE status = 'Closed' 
        AND resolved_by = $1 
        AND resolved_at >= $2
        AND resolved_at < $3
    `
    
    const currentWeekQuery = `
      SELECT COUNT(*) as count
      FROM public.tickets 
      WHERE status = 'Closed' 
        AND resolved_by = $1 
        AND resolved_at >= $2
        AND resolved_at < $3
    `
    
    const currentMonthQuery = `
      SELECT COUNT(*) as count
      FROM public.tickets 
      WHERE status = 'Closed' 
        AND resolved_by = $1 
        AND resolved_at >= $2
        AND resolved_at < $3
    `
    


    // Previous period queries - no timezone conversion needed since DB stores Manila timezone
    const previousDayQuery = `
      SELECT COUNT(*) as count
      FROM public.tickets 
      WHERE status = 'Closed' 
        AND resolved_by = $1 
        AND resolved_at >= $2
        AND resolved_at < $3
    `
    
    const previousWeekQuery = `
      SELECT COUNT(*) as count
      FROM public.tickets 
      WHERE status = 'Closed' 
        AND resolved_by = $1 
        AND resolved_at >= $2
        AND resolved_at < $3
    `
    
    const previousMonthQuery = `
      SELECT COUNT(*) as count
      FROM public.tickets 
      WHERE status = 'Closed' 
        AND resolved_by = $1 
        AND resolved_at >= $2
        AND resolved_at < $3
    `
    


    // Execute queries
    const [
      currentDayResult,
      currentWeekResult,
      currentMonthResult,
      previousDayResult,
      previousWeekResult,
      previousMonthResult
    ] = await Promise.all([
      query(currentDayQuery, [userId, today.toISOString(), new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()]),
      query(currentWeekQuery, [userId, weekAgo.toISOString(), new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()]),
      query(currentMonthQuery, [userId, firstDayOfCurrentMonth.toISOString(), new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()]),
      query(previousDayQuery, [userId, yesterday.toISOString(), today.toISOString()]),
      query(previousWeekQuery, [userId, twoWeeksAgo.toISOString(), weekAgo.toISOString()]),
      query(previousMonthQuery, [userId, firstDayOfPreviousMonth.toISOString(), firstDayOfCurrentMonth.toISOString()])
    ])



    const currentDay = parseInt(currentDayResult.rows[0]?.count || '0')
    const currentWeek = parseInt(currentWeekResult.rows[0]?.count || '0')
    const currentMonth = parseInt(currentMonthResult.rows[0]?.count || '0')
    const previousDay = parseInt(previousDayResult.rows[0]?.count || '0')
    const previousWeek = parseInt(previousWeekResult.rows[0]?.count || '0')
    const previousMonth = parseInt(previousMonthResult.rows[0]?.count || '0')



    // Calculate percentage changes
    const dailyChange = previousDay > 0 ? ((currentDay - previousDay) / previousDay) * 100 : 0
    const weeklyChange = previousWeek > 0 ? ((currentWeek - previousWeek) / previousWeek) * 100 : 0
    const monthlyChange = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0

    return NextResponse.json({
      daily: {
        current: currentDay,
        previous: previousDay,
        change: Math.round(dailyChange * 100) / 100 // Round to 2 decimal places
      },
      weekly: {
        current: currentWeek,
        previous: previousWeek,
        change: Math.round(weeklyChange * 100) / 100 // Round to 2 decimal places
      },
      monthly: {
        current: currentMonth,
        previous: previousMonth,
        change: Math.round(monthlyChange * 100) / 100 // Round to 2 decimal places
      }
    })
  } catch (error) {
    console.error('Error fetching ticket stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket statistics' },
      { status: 500 }
    )
  }
} 