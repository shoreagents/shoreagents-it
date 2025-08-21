import { NextRequest, NextResponse } from 'next/server'
import { countClosedTickets, countClosedTicketsWithResolvedAt, countClosedTicketsBetween } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    console.log('Stats API called with userId:', userId)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    const totalClosed = await countClosedTickets()
    console.log('Total closed tickets in system:', totalClosed)
    const closedWithResolvedAt = await countClosedTicketsWithResolvedAt()
    console.log('Closed tickets with resolved_at:', closedWithResolvedAt)

    // Get current date in Asia/Manila timezone and calculate previous periods
    const now = new Date()
    
    // Create dates in Asia/Manila timezone
    const manilaToday = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}))
    const today = new Date(manilaToday.getFullYear(), manilaToday.getMonth(), manilaToday.getDate())
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Calculate week boundaries (Monday to Sunday)
    const getWeekStart = (date: Date) => {
      const d = new Date(date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
      return new Date(d.setDate(diff))
    }
    
    const thisWeekStart = getWeekStart(today)
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    
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

    // Calculate end dates properly
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Fix: This Week should be exactly 7 days from today
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const nextMonth = new Date(firstDayOfCurrentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    console.log('Date ranges:', {
      today: today.toISOString(),
      yesterday: yesterday.toISOString(),
      thisWeekStart: thisWeekStart.toISOString(),
      lastWeekStart: lastWeekStart.toISOString(),
      firstDayOfCurrentMonth: firstDayOfCurrentMonth.toISOString(),
      firstDayOfPreviousMonth: firstDayOfPreviousMonth.toISOString(),
      tomorrow: tomorrow.toISOString(),
      nextWeek: nextWeek.toISOString(),
      nextMonth: nextMonth.toISOString()
    })

    // Current period queries - no timezone conversion needed since DB stores Manila timezone
    const currentDayQuery = `
      SELECT COUNT(*) as count
      FROM public.tickets 
      WHERE status = 'Closed' 
        AND role_id = 1
        AND resolved_at >= $1
        AND resolved_at < $2
    `
    
    const currentWeekQuery = `
      SELECT COUNT(*) as count
      FROM public.tickets 
      WHERE status = 'Closed' 
        AND role_id = 1
        AND resolved_at >= $1
        AND resolved_at < $2
    `
    
    const currentMonthQuery = `
      SELECT COUNT(*) as count
      FROM public.tickets 
      WHERE status = 'Closed' 
        AND role_id = 1
        AND resolved_at >= $1
        AND resolved_at < $2
    `
    


    // Previous period queries - no timezone conversion needed since DB stores Manila timezone
    const previousDayQuery = `
      SELECT COUNT(*) as count
      FROM public.tickets 
      WHERE status = 'Closed' 
        AND role_id = 1
        AND resolved_at >= $1
        AND resolved_at < $2
    `
    
    const previousWeekQuery = `
      SELECT COUNT(*) as count
      FROM public.tickets 
      WHERE status = 'Closed' 
        AND role_id = 1
        AND resolved_at >= $1
        AND resolved_at < $2
    `
    
    const previousMonthQuery = `
      SELECT COUNT(*) as count
      FROM public.tickets 
      WHERE status = 'Closed' 
      AND role_id = 1
      AND resolved_at >= $1
      AND resolved_at < $2
    `
    


    // Execute queries
    const [currentDay, currentWeek, currentMonth, previousDay, previousWeek, previousMonth] = await Promise.all([
      countClosedTicketsBetween(today.toISOString(), tomorrow.toISOString()),
      countClosedTicketsBetween(thisWeekStart.toISOString(), nextWeek.toISOString()),
      countClosedTicketsBetween(firstDayOfCurrentMonth.toISOString(), nextMonth.toISOString()),
      countClosedTicketsBetween(yesterday.toISOString(), today.toISOString()),
      countClosedTicketsBetween(lastWeekStart.toISOString(), thisWeekStart.toISOString()),
      countClosedTicketsBetween(firstDayOfPreviousMonth.toISOString(), firstDayOfCurrentMonth.toISOString()),
    ])



    console.log('Stats calculation results:', {
      currentDay,
      currentWeek,
      currentMonth,
      previousDay,
      previousWeek,
      previousMonth,
      queries: {
        currentDay: { start: today.toISOString(), end: tomorrow.toISOString() },
        currentWeek: { start: thisWeekStart.toISOString(), end: nextWeek.toISOString() },
        currentMonth: { start: firstDayOfCurrentMonth.toISOString(), end: nextMonth.toISOString() },
        previousDay: { start: yesterday.toISOString(), end: today.toISOString() },
        previousWeek: { start: lastWeekStart.toISOString(), end: thisWeekStart.toISOString() },
        previousMonth: { start: firstDayOfPreviousMonth.toISOString(), end: firstDayOfCurrentMonth.toISOString() }
      }
    })



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