import { NextRequest, NextResponse } from 'next/server'
import { getDailyProductivityTrend, getWeeklyTrend, getProductivityScoresRows, getProductivityStatsRow, getMonthlyActivitySummaryRows, getMonthlyActivitySummaryStats, getWeeklyActivitySummaryRows, getWeeklyActivitySummaryStats } from '@/lib/db-utils'
import pool from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId') || 'all' // Default to 'all' if not provided
    const timeframe = searchParams.get('timeframe') || 'monthly' // weekly, monthly, quarterly
    const monthYear = searchParams.get('monthYear') // Format: YYYY-MM
    const trend = searchParams.get('trend') // 'daily' for activity_data trend
    const limit = searchParams.get('limit') // Optional limit for top N results

    console.log('📊 API: Fetching productivity scores for companyId:', companyId, 'timeframe:', timeframe, 'monthYear:', monthYear, 'limit:', limit)

    // Determine the month/year to query
    let targetMonthYear = monthYear
    if (!targetMonthYear) {
      const now = new Date()
      targetMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }

    // If requesting daily data (either trend for chart or rankings from activity_data)
    if (trend === 'daily') {
      // Check if this is for chart data or rankings
      const isForChart = searchParams.get('forChart') === 'true'
      
      if (isForChart) {
        // Check if targetMonthYear is a week range (contains comma) or month (YYYY-MM) or single date (YYYY-MM-DD)
        let startISO, endISO
        
        if (targetMonthYear.includes(',')) {
          // Week range format: "2025-01-13,2025-01-19"
          const [startDateStr, endDateStr] = targetMonthYear.split(',')
          startISO = startDateStr
          endISO = endDateStr
        } else if (targetMonthYear.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Single date format: "2025-01-15" (for daily tab)
          startISO = targetMonthYear
          endISO = targetMonthYear
        } else {
          // Month format: "2025-01"
          const [yearStr, monthStr] = targetMonthYear.split('-')
          const year = parseInt(yearStr, 10)
          const month = parseInt(monthStr, 10)
          const startDate = new Date(Date.UTC(year, month - 1, 1))
          const endDate = new Date(Date.UTC(year, month, 0))
          startISO = startDate.toISOString().slice(0, 10)
          endISO = endDate.toISOString().slice(0, 10)
        }

      const dailyActivityQuery = `
        WITH daily_totals AS (
          SELECT 
            COALESCE(ad.today_date, $1::date) as activity_date,
            SUM(COALESCE(ad.today_active_seconds, 0)) as total_active_seconds,
            SUM(COALESCE(ad.today_inactive_seconds, 0)) as total_inactive_seconds
          FROM users u
          INNER JOIN agents a ON u.id = a.user_id
          LEFT JOIN activity_data ad ON u.id = ad.user_id AND ad.today_date >= $1 AND ad.today_date <= $2
          WHERE u.user_type = 'Agent'
            ${companyId === 'all' ? '' : companyId === 'none' ? 'AND a.company_id IS NULL' : 'AND a.company_id = $3'}
          GROUP BY COALESCE(ad.today_date, $1::date)
        ),
        daily_ranked AS (
          SELECT 
            u.id as user_id,
            COALESCE(ad.today_date, $1::date) as today_date,
            COALESCE(ad.today_active_seconds, 0) as today_active_seconds,
            COALESCE(ad.today_inactive_seconds, 0) as today_inactive_seconds,
            ROW_NUMBER() OVER (
              PARTITION BY COALESCE(ad.today_date, $1::date)
              ORDER BY (COALESCE(ad.today_active_seconds, 0) / 3600.0) - (COALESCE(ad.today_inactive_seconds, 0) / 3600.0) DESC
            ) as rn
          FROM users u
          INNER JOIN agents a ON u.id = a.user_id
          LEFT JOIN activity_data ad ON u.id = ad.user_id AND ad.today_date >= $1 AND ad.today_date <= $2
          WHERE u.user_type = 'Agent'
            ${companyId === 'all' ? '' : companyId === 'none' ? 'AND a.company_id IS NULL' : 'AND a.company_id = $3'}
        )
        SELECT 
          dt.activity_date::text as date,
          COALESCE(dt.total_active_seconds, 0) as total_active_seconds,
          COALESCE(dt.total_inactive_seconds, 0) as total_inactive_seconds,
          (SELECT json_build_object(
            'user_id', dr1.user_id,
            'first_name', pi1.first_name,
            'last_name', pi1.last_name,
            'profile_picture', pi1.profile_picture,
            'points', dr1.today_active_seconds,
            'inactive_seconds', dr1.today_inactive_seconds
          ) FROM daily_ranked dr1 
          LEFT JOIN personal_info pi1 ON pi1.user_id = dr1.user_id
          WHERE dr1.today_date = dt.activity_date 
          AND dr1.rn = 1 LIMIT 1) AS top1,
          (SELECT json_build_object(
            'user_id', dr2.user_id,
            'first_name', pi2.first_name,
            'last_name', pi2.last_name,
            'profile_picture', pi2.profile_picture,
            'points', dr2.today_active_seconds,
            'inactive_seconds', dr2.today_inactive_seconds
          ) FROM daily_ranked dr2 
          LEFT JOIN personal_info pi2 ON pi2.user_id = dr2.user_id
          WHERE dr2.today_date = dt.activity_date 
          AND dr2.rn = 2 LIMIT 1) AS top2,
          (SELECT json_build_object(
            'user_id', dr3.user_id,
            'first_name', pi3.first_name,
            'last_name', pi3.last_name,
            'profile_picture', pi3.profile_picture,
            'points', dr3.today_active_seconds,
            'inactive_seconds', dr3.today_inactive_seconds
          ) FROM daily_ranked dr3 
          LEFT JOIN personal_info pi3 ON pi3.user_id = dr3.user_id
          WHERE dr3.today_date = dt.activity_date 
          AND dr3.rn = 3 LIMIT 1) AS top3,
          (SELECT json_build_object(
            'user_id', dr4.user_id,
            'first_name', pi4.first_name,
            'last_name', pi4.last_name,
            'profile_picture', pi4.profile_picture,
            'points', dr4.today_active_seconds,
            'inactive_seconds', dr4.today_inactive_seconds
          ) FROM daily_ranked dr4 
          LEFT JOIN personal_info pi4 ON pi4.user_id = dr4.user_id
          WHERE dr4.today_date = dt.activity_date 
          AND dr4.rn = 4 LIMIT 1) AS top4,
          (SELECT json_build_object(
            'user_id', dr5.user_id,
            'first_name', pi5.first_name,
            'last_name', pi5.last_name,
            'profile_picture', pi5.profile_picture,
            'points', dr5.today_active_seconds,
            'inactive_seconds', dr5.today_inactive_seconds
          ) FROM daily_ranked dr5 
          LEFT JOIN personal_info pi5 ON pi5.user_id = dr5.user_id
          WHERE dr5.today_date = dt.activity_date 
          AND dr5.rn = 5 LIMIT 1) AS top5
        FROM daily_totals dt
        ORDER BY dt.activity_date
      `

      const queryParams = companyId === 'all' || companyId === 'none' 
        ? [startISO, endISO] 
        : [startISO, endISO, parseInt(companyId)]

      const dailyTrendRows = await pool.query(dailyActivityQuery, queryParams)
      
      const trendDaily = dailyTrendRows.rows.map((row: any) => ({
        date: row.date,
        total_active_seconds: Number(row.total_active_seconds) || 0,
        total_inactive_seconds: Number(row.total_inactive_seconds) || 0,
        top1: row.top1 || null,
        top2: row.top2 || null,
        top3: row.top3 || null,
        top4: row.top4 || null,
        top5: row.top5 || null,
      }))

      return NextResponse.json({ trendDaily, monthYear: targetMonthYear })
      } else {
        // Get daily rankings from activity_data table (for leaderboard)
        const today = new Date().toISOString().slice(0, 10)
        
        const dailyRankingsQuery = `
          SELECT 
            u.id as user_id,
            COALESCE(ad.today_active_seconds, 0) as today_active_seconds,
            COALESCE(ad.today_inactive_seconds, 0) as today_inactive_seconds,
            pi.first_name,
            pi.last_name,
            u.email,
            pi.profile_picture,
            d.name as department_name,
            a.company_id,
            -- Calculate productivity score from daily activity
            CASE 
              WHEN (COALESCE(ad.today_active_seconds, 0) + COALESCE(ad.today_inactive_seconds, 0)) > 0 THEN
                GREATEST(0, ROUND(
                  (COALESCE(ad.today_active_seconds, 0)::DECIMAL / 3600.0) - 
                  (COALESCE(ad.today_inactive_seconds, 0)::DECIMAL / 3600.0), 2
                ))
              ELSE 0
            END as productivity_score,
            -- Calculate active percentage
            CASE 
              WHEN (COALESCE(ad.today_active_seconds, 0) + COALESCE(ad.today_inactive_seconds, 0)) > 0 THEN
                ROUND((COALESCE(ad.today_active_seconds, 0)::DECIMAL / (COALESCE(ad.today_active_seconds, 0) + COALESCE(ad.today_inactive_seconds, 0))) * 100, 2)
              ELSE 0
            END as active_percentage,
            (COALESCE(ad.today_active_seconds, 0) + COALESCE(ad.today_inactive_seconds, 0)) as total_seconds
          FROM users u
          INNER JOIN agents a ON u.id = a.user_id
          LEFT JOIN personal_info pi ON u.id = pi.user_id
          LEFT JOIN departments d ON a.department_id = d.id
          LEFT JOIN activity_data ad ON u.id = ad.user_id AND ad.today_date = $1
          WHERE u.user_type = 'Agent'
            ${companyId === 'all' ? '' : companyId === 'none' ? 'AND a.company_id IS NULL' : 'AND a.company_id = $2'}
          ORDER BY productivity_score DESC, COALESCE(ad.today_active_seconds, 0) DESC
          ${limit ? `LIMIT ${parseInt(limit)}` : ''}
        `

        const queryParams = companyId === 'all' || companyId === 'none' 
          ? [today] 
          : [today, parseInt(companyId)]

        const dailyRankingsRows = await pool.query(dailyRankingsQuery, queryParams)
        
        const productivityScores = dailyRankingsRows.rows.map((row: any, index: number) => ({
          id: index + 1,
          user_id: row.user_id,
          month_year: targetMonthYear,
          productivity_score: parseFloat(row.productivity_score) || 0,
          total_active_seconds: row.today_active_seconds || 0,
          total_inactive_seconds: row.today_inactive_seconds || 0,
          total_seconds: row.total_seconds || 0,
          active_percentage: parseFloat(row.active_percentage) || 0,
          first_name: row.first_name || '',
          last_name: row.last_name || '',
          profile_picture: row.profile_picture,
          email: row.email,
          department_name: row.department_name || 'Unassigned',
          company_id: row.company_id || null,
          rank: index + 1
        }))

        return NextResponse.json({
          productivityScores,
          stats: {
            total: dailyRankingsRows.rows.length,
            averageProductivity: productivityScores.reduce((sum, p) => sum + p.productivity_score, 0) / productivityScores.length || 0,
            averageActivePercentage: productivityScores.reduce((sum, p) => sum + p.active_percentage, 0) / productivityScores.length || 0,
            highestProductivity: Math.max(...productivityScores.map(p => p.productivity_score)),
            lowestProductivity: Math.min(...productivityScores.map(p => p.productivity_score))
          },
          timeframe: 'daily',
          monthYear: targetMonthYear,
          source: 'activity_data'
        })
      }
    }

    // If requesting weekly trend data for charts
    if (trend === 'weekly' && searchParams.get('forChart') === 'true') {
      const [yearStr, monthStr] = targetMonthYear.split('-')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10)
      const startDate = new Date(Date.UTC(year, month - 1, 1))
      const endDate = new Date(Date.UTC(year, month, 0))

      const startISO = startDate.toISOString().slice(0, 10)
      const endISO = endDate.toISOString().slice(0, 10)

      // Queries moved to db-utils: getWeeklyTrend()

      const weeklyTrendRows = await getWeeklyTrend(companyId, startISO, endISO)
      const trendWeekly = weeklyTrendRows.map((row: any) => ({
        week_start_date: row.week_start_date,
        week_end_date: row.week_end_date,
        avg_active_seconds: Number(row.avg_active_seconds) || 0,
        avg_inactive_seconds: Number(row.avg_inactive_seconds) || 0,
        top1: row.top1 || null,
        top2: row.top2 || null,
        top3: row.top3 || null,
      }))

      return NextResponse.json({ trendWeekly, monthYear: targetMonthYear })
    }

    // If requesting weekly data, use weekly_activity_summary table
    if (trend === 'weekly') {
      const rows = await getWeeklyActivitySummaryRows(companyId, targetMonthYear, limit ? parseInt(limit) : undefined)
      const statsRow = await getWeeklyActivitySummaryStats(companyId, targetMonthYear)
      
      const productivityScores = rows.map((row, index) => ({
        id: row.id,
        user_id: row.user_id,
        month_year: targetMonthYear,
        productivity_score: parseFloat(row.productivity_score) || 0,
        total_active_seconds: row.total_active_seconds || 0,
        total_inactive_seconds: row.total_inactive_seconds || 0,
        total_seconds: row.total_seconds || 0,
        active_percentage: parseFloat(row.active_percentage) || 0,
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        profile_picture: row.profile_picture,
        email: row.email,
        department_name: row.department_name || 'Unassigned',
        company_id: row.company_id || null,
        rank: index + 1
      }))

      const stats = statsRow || {
        total_agents: 0,
        average_productivity: 0,
        average_active_percentage: 0,
        highest_productivity: 0,
        lowest_productivity: 0
      }

      return NextResponse.json({
        productivityScores,
        stats: {
          total: parseInt(stats.total_agents) || 0,
          averageProductivity: parseFloat(stats.average_productivity) || 0,
          averageActivePercentage: parseFloat(stats.average_active_percentage) || 0,
          highestProductivity: parseFloat(stats.highest_productivity) || 0,
          lowestProductivity: parseFloat(stats.lowest_productivity) || 0
        },
        timeframe: 'weekly',
        monthYear: targetMonthYear,
        source: 'weekly_activity_summary'
      })
    }

    // If requesting monthly data, use monthly_activity_summary table
    if (trend === 'monthly') {
      const rows = await getMonthlyActivitySummaryRows(companyId, targetMonthYear, limit ? parseInt(limit) : undefined)
      const statsRow = await getMonthlyActivitySummaryStats(companyId, targetMonthYear)
      
      const productivityScores = rows.map((row, index) => ({
        id: row.id,
        user_id: row.user_id,
        month_year: targetMonthYear,
        productivity_score: parseFloat(row.productivity_score) || 0,
        total_active_seconds: row.total_active_seconds || 0,
        total_inactive_seconds: row.total_inactive_seconds || 0,
        total_seconds: row.total_seconds || 0,
        active_percentage: parseFloat(row.active_percentage) || 0,
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        profile_picture: row.profile_picture,
        email: row.email,
        department_name: row.department_name || 'Unassigned',
        company_id: row.company_id || null,
        rank: index + 1
      }))

      const stats = statsRow || {
        total_agents: 0,
        average_productivity: 0,
        average_active_percentage: 0,
        highest_productivity: 0,
        lowest_productivity: 0
      }

      return NextResponse.json({
        productivityScores,
        stats: {
          total: parseInt(stats.total_agents) || 0,
          averageProductivity: parseFloat(stats.average_productivity) || 0,
          averageActivePercentage: parseFloat(stats.average_active_percentage) || 0,
          highestProductivity: parseFloat(stats.highest_productivity) || 0,
          lowestProductivity: parseFloat(stats.lowest_productivity) || 0
        },
        timeframe: 'monthly',
        monthYear: targetMonthYear,
        source: 'monthly_activity_summary'
      })
    }

    // Build the query based on companyId and timeframe
    const rows = await getProductivityScoresRows(companyId, targetMonthYear, limit ? parseInt(limit) : undefined)
    console.log('📊 API: Found', rows.length, 'productivity scores')

    // Get statistics
    const statsRow = await getProductivityStatsRow(companyId, targetMonthYear)

    const productivityScores = rows.map((row, index) => ({
      id: row.id,
      user_id: row.user_id,
      month_year: row.month_year,
      productivity_score: parseFloat(row.productivity_score) || 0,
      total_active_seconds: row.total_active_seconds || 0,
      total_inactive_seconds: row.total_inactive_seconds || 0,
      total_seconds: row.total_seconds || 0,
      active_percentage: parseFloat(row.active_percentage) || 0,
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      profile_picture: row.profile_picture,
      email: row.email,
      department_name: row.department_name || 'Unassigned',
      company_id: row.company_id || null,
      rank: index + 1
    }))

    const stats = statsRow || {
      total_agents: 0,
      average_productivity: 0,
      average_active_percentage: 0,
      highest_productivity: 0,
      lowest_productivity: 0
    }

    return NextResponse.json({
      productivityScores,
      stats: {
        total: parseInt(stats.total_agents) || 0,
        averageProductivity: parseFloat(stats.average_productivity) || 0,
        averageActivePercentage: parseFloat(stats.average_active_percentage) || 0,
        highestProductivity: parseFloat(stats.highest_productivity) || 0,
        lowestProductivity: parseFloat(stats.lowest_productivity) || 0
      },
      timeframe,
      monthYear: targetMonthYear
    })

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch productivity scores' },
      { status: 500 }
    )
  }
}
