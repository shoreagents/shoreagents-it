import { NextRequest, NextResponse } from 'next/server'
import { getResolverDataSample, getResolverStatsRange } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    console.log('Resolver stats API called with days:', days)
    
    // Calculate date range - use current date in Manila timezone
    const now = new Date()
    const manilaToday = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}))
    
    // End date: end of today (tomorrow at 00:00)
    const endDate = new Date(manilaToday.getFullYear(), manilaToday.getMonth(), manilaToday.getDate() + 1)
    
    // Start date: days ago from today
    const startDate = new Date(manilaToday.getFullYear(), manilaToday.getMonth(), manilaToday.getDate() - days + 1)
    
    console.log('Date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      manilaToday: manilaToday.toISOString(),
      days
    })

    // First, let's check what data we actually have
    const checkSample = await getResolverDataSample(10)
    console.log('Available data sample:', checkSample)

    // Build the main query with proper GROUP BY clause
    let query = `
      SELECT 
        DATE(t.resolved_at) as date,
        t.resolved_by,
        CONCAT(pi.first_name, ' ', pi.last_name) as resolver_name,
        COUNT(*) as resolved_count
      FROM public.tickets t
      LEFT JOIN public.personal_info pi ON t.resolved_by = pi.user_id
      WHERE t.status = 'Closed' 
        AND t.role_id = 1
        AND t.resolved_at IS NOT NULL
        AND t.resolved_by IS NOT NULL
        AND pi.first_name IS NOT NULL
        AND pi.last_name IS NOT NULL
    `
    
    let queryParams: string[] = []
    
    // If we have data in the calculated range, use it; otherwise get all data
    let rawData: any[] = []
    if (checkSample.length > 0) {
      const latestDataDate = new Date(checkSample[0].latest)
      const earliestDataDate = new Date(checkSample[0].earliest)
      
      console.log('Data date range:', {
        earliest: earliestDataDate.toISOString(),
        latest: latestDataDate.toISOString(),
        calculatedStart: startDate.toISOString(),
        calculatedEnd: endDate.toISOString()
      })
      
      // If our calculated range doesn't overlap with actual data, use all data
      if (latestDataDate < startDate || earliestDataDate > endDate) {
        console.log('Date range mismatch, using all available data')
        rawData = await getResolverStatsRange()
      } else {
        console.log('Using calculated date range')
        rawData = await getResolverStatsRange(startDate.toISOString(), endDate.toISOString())
      }
    } else {
      console.log('No data found, using all available data')
      rawData = await getResolverStatsRange()
    }
    console.log('Query result:', rawData)
    
    // Process the data to create chart format
    const chartData: any[] = []
    const resolvers = new Set<string>()
    
    if (rawData.length === 0) {
      console.log('No resolver data found')
      return NextResponse.json({
        chartData: [],
        chartConfig: {},
        resolvers: []
      })
    }
    
    // First pass: collect all unique dates and resolvers
    rawData.forEach(row => {
      resolvers.add(row.resolver_name)
    })
    
    // Get the actual date range from the data - FIXED: Sort dates properly
    const dates = rawData.map(row => row.date).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    const actualStartDate = new Date(dates[0])
    const actualEndDate = new Date(dates[dates.length - 1])
    actualEndDate.setDate(actualEndDate.getDate() + 1) // Include the last day
    
    console.log('Actual data date range:', {
      start: actualStartDate.toISOString(),
      end: actualEndDate.toISOString(),
      dates: dates.map(d => d.toISOString())
    })
    
    // Create date range based on actual data
    const dateRange: string[] = []
    const currentDate = new Date(actualStartDate)
    while (currentDate < actualEndDate) {
      dateRange.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    console.log('Generated date range:', dateRange)
    
    // Create chart data structure
    dateRange.forEach(date => {
      const dayData: any = { date }
      
      // Initialize all resolvers with 0 for this date
      resolvers.forEach(resolver => {
        dayData[resolver] = 0
      })
      
      // Fill in actual data
      rawData.forEach(row => {
        const rowDate = new Date(row.date).toISOString().split('T')[0]
        if (rowDate === date) {
          dayData[row.resolver_name] = parseInt(row.resolved_count)
        }
      })
      
      chartData.push(dayData)
    })
    
    // Create chart config with colors for each resolver
    const colors = [
      '#f97316', // orange
      '#10b981', // emerald
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ef4444', // red
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f59e0b', // amber
      '#ec4899', // pink
      '#6366f1', // indigo
    ]
    
    const chartConfig: any = {}
    Array.from(resolvers).forEach((resolver, index) => {
      chartConfig[resolver] = {
        label: resolver,
        color: colors[index % colors.length],
      }
    })
    
    console.log('Chart data generated:', {
      totalDays: chartData.length,
      resolvers: Array.from(resolvers),
      sampleData: chartData.slice(0, 3),
      rawDataCount: rawData.length
    })
    
    return NextResponse.json({
      chartData,
      chartConfig,
      resolvers: Array.from(resolvers)
    })
    
  } catch (error) {
    console.error('Error fetching resolver stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resolver statistics' },
      { status: 500 }
    )
  }
}
