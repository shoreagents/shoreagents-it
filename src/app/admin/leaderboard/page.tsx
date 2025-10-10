"use client"

import React, { useState, useEffect, useId } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MedalIcon, 
  AwardIcon,
  StarIcon,
  CrownIcon,
  CalendarIcon
} from "lucide-react"
import { IconArrowUp, IconArrowDown, IconFileCvFilled } from "@tabler/icons-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator, SelectGroup, SelectLabel } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { ReloadButton } from "@/components/ui/reload-button"
import { NoData } from "@/components/ui/no-data"
import { calculateProductivityScore, formatTimeDuration, calculateActivePercentage } from "@/lib/utils"
import { LeaderboardModal } from "@/components/modals/leaderboard-modal"

interface LeaderboardEntry {
  id: number
  user_id: number
  first_name: string
  last_name: string
  email: string
  profile_picture: string | null
  department_name: string | null
  productivity_score: number
  total_active_seconds: number
  total_inactive_seconds: number
  total_seconds: number
  active_percentage: number
  rank: number
  company_id?: number | null
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [allLeaderboardData, setAllLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Tab state for daily/weekly/monthly
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  // Default month used for daily/weekly trend; timeframe selector removed but month selector kept
  const [timeframe] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const now = new Date()
    return now.getMonth() + 1
  })
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const now = new Date()
    return Math.max(now.getFullYear(), 2025)
  })
  const [monthYear, setMonthYear] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Unique IDs for each tab instance to prevent animation conflicts
  const tabId1 = useId()
  const tabId2 = useId()
  const tabId3 = useId()

  // Update monthYear when month or year changes
  useEffect(() => {
    setMonthYear(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`)
  }, [selectedMonth, selectedYear])

  // Daily trend types (from activity_data)
  interface DailyTopUser {
    user_id: number
    first_name: string
    last_name: string
    profile_picture: string | null
    points: number
    inactive_seconds?: number
  }
  interface DailyTrendPoint {
    date: string // YYYY-MM-DD
    total_active_seconds: number
    total_inactive_seconds: number
    top1?: DailyTopUser | null
    top2?: DailyTopUser | null
    top3?: DailyTopUser | null
    top4?: DailyTopUser | null
    top5?: DailyTopUser | null
  }

  const [trendDaily, setTrendDaily] = useState<DailyTrendPoint[]>([])
  const [trendLoading, setTrendLoading] = useState(false)
  const [trendError, setTrendError] = useState<string | null>(null)
  const [reloading, setReloading] = useState(false)
  
  // Sorting state
  const [sortField, setSortField] = useState<'rank' | 'name' | 'points'>('rank')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Company filter state
  const [companyId, setCompanyId] = useState<string>('all')
  const [companyOptions, setCompanyOptions] = useState<{ id: number; company: string; badge_color: string | null }[]>([])

  // Leaderboard modal state
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<LeaderboardEntry | null>(null)

  // Handle row click to open leaderboard modal
  const handleRowClick = (entry: LeaderboardEntry) => {
    setSelectedAgent(entry)
    setIsLeaderboardModalOpen(true)
  }

  // Calculate filtered leaderboard data based on company selection
  const getFilteredLeaderboardData = () => {
    // Safety check to prevent undefined errors
    if (!allLeaderboardData || !Array.isArray(allLeaderboardData)) {
      console.warn('⚠️ allLeaderboardData is not available:', allLeaderboardData)
      return []
    }
    
    let filteredData = allLeaderboardData
    
    console.log('🔍 Filtering leaderboard data:', {
      companyId,
      totalData: allLeaderboardData.length,
      sampleData: allLeaderboardData.slice(0, 2).map(entry => ({
        name: `${entry.first_name} ${entry.last_name}`,
        company_id: entry.company_id
      }))
    })
    
    if (companyId !== 'all') {
      if (companyId === 'none') {
        // Show only entries with no company assignment
        filteredData = allLeaderboardData.filter(entry => !entry.company_id)
        console.log('🔍 Filtered for "none" company:', filteredData.length)
      } else {
        // Show only entries from the selected company
        const selectedCompanyId = parseInt(companyId)
        filteredData = allLeaderboardData.filter(entry => entry.company_id === selectedCompanyId)
        console.log('🔍 Filtered for company', selectedCompanyId, ':', filteredData.length)
      }
    }
    
    // Calculate productivity scores from activity data
    const processedData = filteredData.map(entry => {
      const calculatedScore = calculateProductivityScore(
        entry.total_active_seconds || 0,
        entry.total_inactive_seconds || 0
      )
      
      const calculatedPercentage = calculateActivePercentage(
        entry.total_active_seconds || 0,
        entry.total_inactive_seconds || 0
      )
      
      return {
        ...entry,
        productivity_score: calculatedScore,
        active_percentage: calculatedPercentage
      }
    })
    
    // Re-rank the filtered data
    const rankedData = processedData.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))
    
    console.log('🔍 Final filtered data with calculated scores:', rankedData.length, 'entries')
    return rankedData
  }

  // Fetch productivity scores data
  const fetchProductivityScores = async () => {
    console.log('🔍 Fetching productivity scores for all companies')
    console.log('🔍 Full user data:', user)
    
    // Clear any previous errors and set loading
    setError(null)
    setLoading(true)

    try {
      console.log('📡 Making API request to /api/productivity-scores')
      const params = new URLSearchParams({
        companyId: 'all', // Always fetch all data
        timeframe: activeTab === 'daily' ? 'monthly' : activeTab === 'weekly' ? 'monthly' : 'quarterly'
      })
      
      // Add trend parameter for daily, monthly and weekly tabs to use their respective data sources
      if (activeTab === 'daily') {
        params.append('trend', 'daily')
      } else if (activeTab === 'monthly') {
        params.append('trend', 'monthly')
      } else if (activeTab === 'weekly') {
        params.append('trend', 'weekly')
      }
      
      if (monthYear) {
        params.append('monthYear', monthYear)
      }
      
      const response = await fetch(`/api/productivity-scores?${params}`)
      
      console.log('📊 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ API error:', errorText)
        throw new Error(`Failed to fetch productivity scores: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Productivity scores data received:', data)
      
      // Handle API response structure
      if (data) {
        if (activeTab === 'monthly' && data.source === 'monthly_activity_summary' && Array.isArray(data.productivityScores)) {
          // Monthly tab using monthly_activity_summary table
      setAllLeaderboardData(data.productivityScores)
          setError(null)
        } else if (activeTab === 'weekly' && data.source === 'weekly_activity_summary' && Array.isArray(data.productivityScores)) {
          // Weekly tab using weekly_activity_summary table
          setAllLeaderboardData(data.productivityScores)
          setError(null)
        } else if (activeTab === 'daily' && data.source === 'activity_data' && Array.isArray(data.productivityScores)) {
          // Daily tab using activity_data table
          setAllLeaderboardData(data.productivityScores)
          setError(null)
        } else {
          console.warn('⚠️ Invalid API response structure for', activeTab, 'tab:', data)
          setAllLeaderboardData([])
          setError('Invalid data format received from server')
        }
      } else {
        console.warn('⚠️ No data received from API')
        setAllLeaderboardData([])
        setError('No data received from server')
      }
    } catch (err) {
      console.error('❌ Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch productivity scores')
      setAllLeaderboardData([]) // Ensure it's always an array
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch if user is available
    if (user) {
      fetchProductivityScores()
    }
  }, [user, activeTab, monthYear])

  // Fetch company options
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/agents', { method: 'OPTIONS' })
        const data = await res.json()
        setCompanyOptions(data.companies || [])
      } catch (e) {
        console.error('❌ Failed to fetch companies:', e)
        setCompanyOptions([])
      }
    }
    fetchCompanies()
  }, [])

  // Reload function
  const handleReload = async () => {
    setReloading(true)
    try {
      // Don't set loading to true during reload to keep the UI visible
      setError(null)
      
      console.log('📡 Making API request to /api/productivity-scores')
      const params = new URLSearchParams({
        companyId: 'all', // Always fetch all data
        timeframe: activeTab === 'daily' ? 'monthly' : activeTab === 'weekly' ? 'monthly' : 'quarterly'
      })
      
      // Add trend parameter for daily, monthly and weekly tabs to use their respective data sources
      if (activeTab === 'daily') {
        params.append('trend', 'daily')
      } else if (activeTab === 'monthly') {
        params.append('trend', 'monthly')
      } else if (activeTab === 'weekly') {
        params.append('trend', 'weekly')
      }
      
      if (monthYear) {
        params.append('monthYear', monthYear)
      }
      
      const response = await fetch(`/api/productivity-scores?${params}`)
      
      console.log('📊 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ API error:', errorText)
        throw new Error(`Failed to fetch productivity scores: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Productivity scores data received:', data)
      
      // Handle API response structure
      if (data) {
        if (activeTab === 'monthly' && data.source === 'monthly_activity_summary' && Array.isArray(data.productivityScores)) {
          // Monthly tab using monthly_activity_summary table
      setAllLeaderboardData(data.productivityScores)
          setError(null)
        } else if (activeTab === 'weekly' && data.source === 'weekly_activity_summary' && Array.isArray(data.productivityScores)) {
          // Weekly tab using weekly_activity_summary table
          setAllLeaderboardData(data.productivityScores)
          setError(null)
        } else if (activeTab === 'daily' && data.source === 'activity_data' && Array.isArray(data.productivityScores)) {
          // Daily tab using activity_data table
          setAllLeaderboardData(data.productivityScores)
          setError(null)
        } else {
          console.warn('⚠️ Invalid API response structure for', activeTab, 'tab:', data)
          setAllLeaderboardData([])
          setError('Invalid data format received from server')
        }
      } else {
        console.warn('⚠️ No data received from API')
        setAllLeaderboardData([])
        setError('No data received from server')
      }
      
    } catch (err) {
      console.error('❌ Reload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to reload productivity scores')
      setAllLeaderboardData([]) // Ensure it's always an array
    } finally {
      setReloading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <CrownIcon className="h-4 w-4 text-yellow-500" />
      case 2:
        return <MedalIcon className="h-4 w-4 text-gray-500" />
      case 3:
        return <AwardIcon className="h-4 w-4 text-amber-600" />
      case 4:
        return <StarIcon className="h-4 w-4 text-blue-500" />
      case 5:
        return <StarIcon className="h-4 w-4 text-purple-500" />
      default:
        return null
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">🥇 1st</Badge>
      case 2:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">🥈 2nd</Badge>
      case 3:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">🥉 3rd</Badge>
      default:
        return <Badge variant="outline">#{rank}</Badge>
    }
  }



  const formatPoints = (score: number) => {
    return score.toFixed(2)
  }
  
  const formatActiveTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  // Sorting logic
  const handleSort = (field: 'rank' | 'name' | 'points') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: 'rank' | 'name' | 'points') => {
    if (sortField !== field) {
      return null
    }
    return sortDirection === 'asc' ? 
      <IconArrowUp className="h-4 w-4 text-primary" /> : 
      <IconArrowDown className="h-4 w-4 text-primary" />
  }

  const sortedLeaderboardData = [...getFilteredLeaderboardData()].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (sortField) {
      case 'rank':
        aValue = a.rank
        bValue = b.rank
        break
      case 'name':
        aValue = `${a.first_name} ${a.last_name}`.toLowerCase()
        bValue = `${b.first_name} ${b.last_name}`.toLowerCase()
        break
      case 'points':
        // Use calculated productivity score for sorting
        aValue = calculateProductivityScore(a.total_active_seconds || 0, a.total_inactive_seconds || 0)
        bValue = calculateProductivityScore(b.total_active_seconds || 0, b.total_inactive_seconds || 0)
        break
      default:
        return 0
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? 
        aValue.localeCompare(bValue) : 
        bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })
  
  

  // Generate month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  // Generate year options from current year down to 2025
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const startYear = 2025
    const options = []
    for (let year = currentYear; year >= startYear; year--) {
      options.push({ value: year, label: year.toString() })
    }
    return options
  }

  const yearOptions = generateYearOptions()

  // Helper function to get current week range (Monday to Sunday)
  const getCurrentWeekRange = () => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust for Monday start
    
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    return `${monday.toISOString().slice(0, 10)},${sunday.toISOString().slice(0, 10)}`
  }

  // Helper function to get today's date
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().slice(0, 10) // Returns "2025-01-15"
  }

  // Fetch daily trend (activity_data) for selected month
  useEffect(() => {
    const fetchDailyTrend = async () => {
      if (!user) return
      try {
        setTrendError(null)
        setTrendLoading(true)
        const params = new URLSearchParams({
          companyId: 'all', // Always fetch all data
          trend: activeTab === 'monthly' ? 'daily' : activeTab === 'weekly' ? 'daily' : activeTab, // Monthly and weekly tabs should show daily data
          monthYear: activeTab === 'daily' ? getTodayDate() : activeTab === 'weekly' ? getCurrentWeekRange() : monthYear, // Daily = today, Weekly = current week, Monthly = current month
          forChart: 'true' // Indicate this is for chart data, not leaderboard
        })
        const res = await fetch(`/api/productivity-scores?${params}`)
        if (!res.ok) {
          throw new Error(`Failed to fetch daily trend: ${res.status}`)
        }
        const json = await res.json()
        setTrendDaily(Array.isArray(json.trendDaily) ? json.trendDaily : [])
      } catch (e) {
        setTrendError(e instanceof Error ? e.message : 'Failed to fetch daily trend')
        setTrendDaily([])
      } finally {
        setTrendLoading(false)
      }
    }
    fetchDailyTrend()
  }, [user, activeTab, monthYear])

  // Selected month label helpers
  const selectedMonthDate = new Date(monthYear + '-01')
  const selectedMonthName = selectedMonthDate.toLocaleDateString('en-US', { month: 'long' })
  const selectedYearValue = selectedMonthDate.getFullYear()

  const chartConfig = {
    totalActive: {
      label: "Total Active Seconds",
      // Fixed light-mode color across themes
      color: "hsl(12 76% 61%)",
    },
  } satisfies ChartConfig

  // Daily data for chart (hide dates with no data)
  const dailyChartData = trendDaily.filter((d) =>
    (d.total_active_seconds ?? 0) > 0 || (d.total_inactive_seconds ?? 0) > 0
  )

  // Get today's data for circle chart
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const todayData = trendDaily.find(d => d.date === today)
  
  // Prepare data for circle chart (active vs inactive)
  const circleChartData = todayData ? [
    {
      name: 'Active',
      value: todayData.total_active_seconds || 0,
      color: 'hsl(12 76% 61%)'
    },
    {
      name: 'Inactive', 
      value: todayData.total_inactive_seconds || 0,
      color: 'hsl(0 0% 85%)'
    }
  ] : []

  if (loading) {
    return (
      <>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <AppHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* Loading skeleton */}
                <div className="px-4 lg:px-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column 1: Activity Rankings skeleton */}
                    <div className="order-3 lg:order-1">
                      {/* Ranking header moved to first column */}
                      <div className="mb-4 min-h-[72px] flex w-full items-center justify-start gap-3 lg:justify-start">
                        <div>
                          <h1 className="text-2xl font-bold">Leaderboard</h1>
                          <p className="text-sm text-muted-foreground">
                            View team rankings based on productivity scores and activity metrics.
                          </p>
                        </div>
                      </div>
                      
                      {/* Custom Tabs */}
                      <div className="mb-6 flex-shrink-0">
                        <div className="rounded-xl p-1 w-fit bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                          <div className="flex gap-1 relative">
                            {[
                              { title: "Monthly", value: "monthly" },
                              { title: "Weekly", value: "weekly" },
                              { title: "Daily", value: "daily" }
                            ].map((tab, idx) => (
                              <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value as 'daily' | 'weekly' | 'monthly')}
                                className="relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 text-black dark:text-white hover:text-foreground"
                                style={{ transformStyle: "preserve-3d" }}
                              >
                                {activeTab === tab.value && (
                                  <motion.div
                                    layoutId={`clickedbutton-${tabId1}`}
                                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                                    className="absolute inset-0 bg-primary/10 rounded-lg"
                                  />
                                )}
                                <span className="relative block text-gray-900 dark:text-white">
                                  {tab.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <Card className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="">
                            <Table>
                              <TableHeader>
                                <TableRow variant="no-hover" className="h-12">
                                  <TableHead className="w-16">
                                    Rank
                                  </TableHead>
                                  <TableHead>
                                    Agents
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Points
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Array.from({ length: 20 }).map((_, i) => (
                                  <TableRow key={i} className="h-14 cursor-pointer hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">
                                      <Skeleton className="h-4 w-8" />
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div>
                                          <Skeleton className="h-4 w-32 mb-1" />
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex justify-center">
                                        <Skeleton className="h-4 w-16" />
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right column skeletons */}
                    <div className="order-2 lg:order-2 lg:sticky lg:top-16 lg:self-start">
                      {/* Month/Year selector - show actual components */}
                      <div className="mb-4 min-h-[72px] flex w-full items-center justify-end gap-3 lg:justify-end">
                        <div className="flex items-center">
                          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {yearOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="w-56">
                          <Select value={companyId} onValueChange={(v: string) => setCompanyId(v)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Filter by company">
                                {companyId === 'all' ? 'All Agents' : 
                                 companyId === 'none' ? 'No Assigned Companies' :
                                 companyOptions.find(m => String(m.id) === companyId)?.company || 'Filter by company'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Agents</SelectItem>
                              <SelectItem value="none">No Assigned Companies</SelectItem>
                              <SelectSeparator className="bg-border mx-2" />
                              <SelectGroup>
                                <SelectLabel className="text-muted-foreground">Companies</SelectLabel>
                                {companyOptions.map((m) => (
                                  <SelectItem key={m.id} value={String(m.id)}>{m.company}</SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <ReloadButton 
                          loading={reloading} 
                          onReload={handleReload}
                        />
                      </div>
                      
                      {/* Top Performers skeleton */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              Top Performers
                            </CardTitle>
                            {/* Mobile month label (top-right) with same styling as old */}
                            <CardTitle className="lg:hidden flex items-center gap-2">
                              {selectedMonthName} {selectedYearValue}
                            </CardTitle>
                          </div>
                          <CardDescription>
                            {activeTab === 'daily' ? (
                              'Highlighting those who lead in activity and stay consistently engaged today.'
                            ) : activeTab === 'weekly' ? (
                              'Highlighting those who lead in activity and stay consistently engaged this week.'
                            ) : (
                              'Highlighting those who lead in activity and stay consistently engaged this month.'
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="relative">
                            {/* Podium Base */}
                            <div className="flex items-end justify-center gap-4 h-80">
                              {/* 2nd Place Pillar */}
                              <div className="flex flex-col items-center">
                                <div className="relative mb-2">
                                  <Skeleton className="h-16 w-16 rounded-full border-4 border-gray-300" />
                                  <div className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                    2
                                  </div>
                                  <MedalIcon className="absolute -bottom-1 -right-1 h-5 w-5 text-gray-500 bg-white rounded-full p-0.5" />
                                </div>
                                <div className="text-center mb-2">
                                  <Skeleton className="h-4 w-20 mb-1 mx-auto" />
                                  <div className="text-xs text-muted-foreground">Points: <Skeleton className="h-3 w-12 inline-block" /></div>
                                </div>
                                <div className="w-20 h-32 bg-gradient-to-t from-gray-400/20 to-gray-300/10 rounded-t-lg backdrop-blur-sm border border-gray-200/20"></div>
                              </div>

                              {/* 1st Place Pillar */}
                              <div className="flex flex-col items-center">
                                <div className="relative mb-2">
                                  <Skeleton className="h-20 w-20 rounded-full border-4 border-yellow-400" />
                                  <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                    1
                                  </div>
                                  <CrownIcon className="absolute -bottom-1 -right-1 h-5 w-5 text-yellow-500 bg-white rounded-full p-0.5" />
                                </div>
                                <div className="text-center mb-2">
                                  <Skeleton className="h-4 w-24 mb-1 mx-auto" />
                                  <div className="text-xs text-muted-foreground">Points: <Skeleton className="h-3 w-12 inline-block" /></div>
                                </div>
                                <div className="w-24 h-40 bg-gradient-to-t from-yellow-400/20 to-yellow-300/10 rounded-t-lg backdrop-blur-sm border border-yellow-200/20"></div>
                              </div>

                              {/* 3rd Place Pillar */}
                              <div className="flex flex-col items-center">
                                <div className="relative mb-2">
                                  <Skeleton className="h-16 w-16 rounded-full border-4 border-amber-600" />
                                  <div className="absolute -top-1 -right-1 bg-amber-700 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                    3
                                  </div>
                                  <AwardIcon className="absolute -bottom-1 -right-1 h-5 w-5 text-amber-700 bg-white rounded-full p-0.5" />
                                </div>
                                <div className="text-center mb-2">
                                  <Skeleton className="h-4 w-20 mb-1 mx-auto" />
                                  <div className="text-xs text-muted-foreground">Points: <Skeleton className="h-3 w-12 inline-block" /></div>
                                </div>
                                <div className="w-20 h-32 bg-gradient-to-t from-amber-600/20 to-amber-500/10 rounded-t-lg backdrop-blur-sm border border-amber-400/20"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Productivity Trends Chart - Static Loading State */}
                      <Card className="mt-6 @container/card">
                        <CardHeader className="relative pb-0">
                          <CardTitle className="flex items-center gap-2">
                            {activeTab === 'daily' ? 'Daily' : activeTab === 'weekly' ? 'Weekly' : 'Monthly'} Breakdown
                          </CardTitle>
                          <CardDescription>
                            {activeTab === 'daily' ? (
                              <>
                                <span className="@[540px]/card:block hidden">Track daily points for {selectedMonthName}—hover to reveal the top 5 stars.</span>
                                <span className="@[540px]/card:hidden">Track daily points for {selectedMonthName}—hover to reveal the top 5 stars.</span>
                              </>
                            ) : (
                              <>
                                <span className="@[540px]/card:block hidden">Track {activeTab} points for {selectedMonthName}—hover to reveal the top 5 stars.</span>
                                <span className="@[540px]/card:hidden">Track {activeTab} points for {selectedMonthName}—hover to reveal the top 5 stars.</span>
                              </>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="px-0 pt-4 sm:px-0 sm:pt-6">
                          <div className="relative">
                            {/* Chart area skeleton */}
                            <Skeleton className="h-[250px] w-full rounded-none" />
                            {/* X-axis labels skeleton */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4">
                              {Array.from({ length: 7 }).map((_, i) => (
                                <Skeleton key={i} className="h-3 w-8" />
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </>
    )
  }

  if (error) {
    return (
      <>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <AppHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column 1: Error message with header */}
                    <div className="order-3 lg:order-1">
                      {/* Ranking header moved to first column */}
                      <div className="mb-4 min-h-[72px] flex w-full items-center justify-start gap-3 lg:justify-start">
                        <div>
                          <h1 className="text-2xl font-bold">Ranking</h1>
                          <p className="text-sm text-muted-foreground">
                            View team rankings based on productivity scores and activity metrics.
                          </p>
                        </div>
                      </div>
                      
                      {/* Custom Tabs */}
                      <div className="mb-6 flex-shrink-0">
                        <div className="rounded-xl p-1 w-fit bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                          <div className="flex gap-1 relative">
                            {[
                              { title: "Daily", value: "daily" },
                              { title: "Weekly", value: "weekly" },
                              { title: "Monthly", value: "monthly" }
                            ].map((tab, idx) => (
                              <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value as 'daily' | 'weekly' | 'monthly')}
                                className="relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 text-black dark:text-white hover:text-foreground"
                                style={{ transformStyle: "preserve-3d" }}
                              >
                                {activeTab === tab.value && (
                                  <motion.div
                                    layoutId={`clickedbutton-${tabId2}`}
                                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                                    className="absolute inset-0 bg-primary/10 rounded-lg"
                                  />
                                )}
                                <span className="relative block text-black dark:text-white">
                                  {tab.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <Card>
                        <CardContent className="flex items-center justify-center h-32">
                          <div className="text-center">
                            <p className="text-lg font-medium text-destructive">Error</p>
                            <p className="text-sm text-muted-foreground">{error}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Column 2: Empty for error state */}
                    <div className="order-2 lg:order-2">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </>
    )
  }

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Removed empty spacer to eliminate extra top gap */}

              {/* Two Column Layout */}
              <div className="px-4 lg:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Column 1: Activity Rankings */}
                  <div className="order-3 lg:order-1">
                    {/* Ranking header moved to first column */}
                    <div className="mb-4 min-h-[72px] flex w-full items-center justify-start gap-3 lg:justify-start">
                      <div>
                        <h1 className="text-2xl font-bold">Leaderboard</h1>
                        <p className="text-sm text-muted-foreground">
                          View team rankings based on productivity scores and activity metrics.
                        </p>
                      </div>
                    </div>
                    
                    {/* Custom Tabs */}
                    <div className="mb-6 flex-shrink-0">
                      <div className="rounded-xl p-1 w-fit bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <div className="flex gap-1 relative">
                          {[
                            { title: "Monthly", value: "monthly" },
                            { title: "Weekly", value: "weekly" },
                            { title: "Daily", value: "daily" }
                          ].map((tab, idx) => (
                            <button
                              key={tab.value}
                              onClick={() => setActiveTab(tab.value as 'daily' | 'weekly' | 'monthly')}
                              className="relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 text-black dark:text-white hover:text-foreground"
                              style={{ transformStyle: "preserve-3d" }}
                            >
                              {activeTab === tab.value && (
                                <motion.div
                                  layoutId={`clickedbutton-${tabId3}`}
                                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                                  className="absolute inset-0 bg-primary/10 rounded-lg"
                                />
                              )}
                              <span className="relative block text-gray-900 dark:text-white">
                                {tab.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="">
                          <Table>
                            <TableHeader>
                              <TableRow variant="no-hover" className="h-12">
                                <TableHead 
                                  className={`w-16 cursor-pointer ${sortField === 'rank' ? 'text-primary font-medium bg-accent/50' : ''}`}
                                  onClick={() => handleSort('rank')}
                                >
                                  <div className="flex items-center gap-1">
                                    Rank
                                    {sortField === 'rank' && getSortIcon('rank')}
                                  </div>
                                </TableHead>
                                <TableHead 
                                  className={`cursor-pointer ${sortField === 'name' ? 'text-primary font-medium bg-accent/50' : ''}`}
                                  onClick={() => handleSort('name')}
                                >
                                  <div className="flex items-center gap-1">
                                    Agents
                                    {sortField === 'name' && getSortIcon('name')}
                                  </div>
                                </TableHead>
                                <TableHead 
                                  className={`text-center cursor-pointer ${sortField === 'points' ? 'text-primary font-medium bg-accent/50' : ''}`}
                                  onClick={() => handleSort('points')}
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    Points
                                    {sortField === 'points' && getSortIcon('points')}
                                  </div>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedLeaderboardData.map((entry, index) => (
                                <TableRow 
                                  key={`${entry.id}-${index}`} 
                                  className="h-14 cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => handleRowClick(entry)}
                                >
                                  <TableCell className="font-medium">
                                    <span className={`text-sm font-medium ${
                                      entry.rank === 1 ? 'text-yellow-500' :
                                      entry.rank === 2 ? 'text-gray-500' :
                                      entry.rank === 3 ? 'text-amber-600' :
                                      entry.rank === 4 ? 'text-blue-500' :
                                      entry.rank === 5 ? 'text-purple-500' :
                                      'text-muted-foreground'
                                    }`}>#{entry.rank}</span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={entry.profile_picture || undefined} alt={`${entry.first_name} ${entry.last_name}`} />
                                        <AvatarFallback>
                                          {entry.first_name?.[0]}{entry.last_name?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium flex items-center gap-2">
                                          {entry.first_name} {entry.last_name}
                                          {getRankIcon(entry.rank)}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-sm">{calculateProductivityScore(entry.total_active_seconds || 0, entry.total_inactive_seconds || 0).toFixed(2)}</span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Column 2: Fixed-height period header + Top Performers, Daily Performance (sticky) */}
                  <div className="order-2 lg:order-2 lg:sticky lg:top-16 lg:self-start">
                    <div className="mb-4 min-h-[72px] flex w-full items-center justify-end gap-3 lg:justify-end">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {monthOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="w-56">
                        <Select value={companyId} onValueChange={(v: string) => setCompanyId(v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by company">
                              {companyId === 'all' ? 'All Agents' : 
                               companyId === 'none' ? 'No Assigned Companies' :
                               companyOptions.find(m => String(m.id) === companyId)?.company || 'Filter by company'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Agents</SelectItem>
                            <SelectItem value="none">No Assigned Companies</SelectItem>
                            <SelectSeparator className="bg-border mx-2" />
                            <SelectGroup>
                              <SelectLabel className="text-muted-foreground">Companies</SelectLabel>
                              {companyOptions.map((m) => (
                                <SelectItem key={m.id} value={String(m.id)}>{m.company}</SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <ReloadButton 
                        loading={reloading} 
                        onReload={handleReload}
                      />
                    </div>
                    {/* Top Performers */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            Top Performers
                          </CardTitle>
                          {/* Mobile month label (top-right) with same styling as old */}
                          <CardTitle className="lg:hidden flex items-center gap-2">
                            {selectedMonthName} {selectedYearValue}
                          </CardTitle>
                        </div>
                        <CardDescription>
                          {activeTab === 'daily' ? (
                            'Highlighting those who lead in activity and stay consistently engaged today.'
                          ) : activeTab === 'weekly' ? (
                            'Highlighting those who lead in activity and stay consistently engaged this week.'
                          ) : (
                            'Highlighting those who lead in activity and stay consistently engaged this month.'
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="relative">
                          {/* Removed decorative trophy image */}
                          
                          {/* Podium Base */}
                          <div className="flex items-end justify-center gap-4 h-80">
                            {/* 2nd Place Pillar */}
                            {sortedLeaderboardData[1] && (
                              <div className="flex flex-col items-center">
                                <div className="relative mb-2">
                                  <Avatar className="h-16 w-16 border-4 border-gray-300">
                                    <AvatarImage src={sortedLeaderboardData[1].profile_picture || undefined} />
                                    <AvatarFallback className="text-lg">
                                      {sortedLeaderboardData[1].first_name?.[0]}{sortedLeaderboardData[1].last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                    2
                                  </div>
                                  <MedalIcon className="absolute -bottom-1 -right-1 h-5 w-5 text-gray-500 bg-white rounded-full p-0.5" />
                                </div>
                                <div className="text-center mb-2">
                                  <div className="font-semibold text-sm">
                                    {sortedLeaderboardData[1].first_name} {sortedLeaderboardData[1].last_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Points: {calculateProductivityScore(sortedLeaderboardData[1].total_active_seconds || 0, sortedLeaderboardData[1].total_inactive_seconds || 0).toFixed(2)}</div>
                                </div>
                                <div className="w-20 h-32 bg-gradient-to-t from-gray-400/20 to-gray-300/10 rounded-t-lg backdrop-blur-sm border border-gray-200/20"></div>
                              </div>
                            )}

                            {/* 1st Place Pillar */}
                            {sortedLeaderboardData[0] && (
                              <div className="flex flex-col items-center">
                                <div className="relative mb-2">
                                  <Avatar className="h-20 w-20 border-4 border-yellow-400">
                                    <AvatarImage src={sortedLeaderboardData[0].profile_picture || undefined} />
                                    <AvatarFallback className="text-xl">
                                      {sortedLeaderboardData[0].first_name?.[0]}{sortedLeaderboardData[0].last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                    1
                                  </div>
                                  <CrownIcon className="absolute -bottom-1 -right-1 h-5 w-5 text-yellow-500 bg-white rounded-full p-0.5" />
                                </div>
                                <div className="text-center mb-2">
                                  <div className="font-bold text-sm">
                                    {sortedLeaderboardData[0].first_name} {sortedLeaderboardData[0].last_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Points: {calculateProductivityScore(sortedLeaderboardData[0].total_active_seconds || 0, sortedLeaderboardData[0].total_inactive_seconds || 0).toFixed(2)}</div>
                                </div>
                                <div className="w-24 h-40 bg-gradient-to-t from-yellow-400/20 to-yellow-300/10 rounded-t-lg backdrop-blur-sm border border-yellow-200/20"></div>
                              </div>
                            )}

                            {/* 3rd Place Pillar */}
                            {sortedLeaderboardData[2] && (
                              <div className="flex flex-col items-center">
                                <div className="relative mb-2">
                                  <Avatar className="h-16 w-16 border-4 border-amber-600">
                                    <AvatarImage src={sortedLeaderboardData[2].profile_picture || undefined} />
                                    <AvatarFallback className="text-lg">
                                      {sortedLeaderboardData[2].first_name?.[0]}{sortedLeaderboardData[2].last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -top-1 -right-1 bg-amber-700 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                    3
                                  </div>
                                  <AwardIcon className="absolute -bottom-1 -right-1 h-5 w-5 text-amber-700 bg-white rounded-full p-0.5" />
                                </div>
                                <div className="text-center mb-2">
                                  <div className="font-semibold text-sm">
                                    {sortedLeaderboardData[2].first_name} {sortedLeaderboardData[2].last_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Points: {calculateProductivityScore(sortedLeaderboardData[2].total_active_seconds || 0, sortedLeaderboardData[2].total_inactive_seconds || 0).toFixed(2)}</div>
                                </div>
                                <div className="w-20 h-32 bg-gradient-to-t from-amber-600/20 to-amber-500/10 rounded-t-lg backdrop-blur-sm border border-amber-400/20"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Productivity Trends Chart (Daily from activity_data) */}
                    <Card className="mt-6 @container/card">
                      <CardHeader className="relative pb-0">
                        <CardTitle className="flex items-center gap-2">
                          {activeTab === 'daily' ? 'Daily' : activeTab === 'weekly' ? 'Weekly' : 'Monthly'} Breakdown
                        </CardTitle>
                        <CardDescription>
                          {activeTab === 'daily' ? (
                            <>
                              <span className="@[540px]/card:block hidden">Track daily points for {selectedMonthName}—hover to reveal the top 5 stars.</span>
                              <span className="@[540px]/card:hidden">Track daily points for {selectedMonthName}—hover to reveal the top 5 stars.</span>
                            </>
                          ) : (
                            <>
                              <span className="@[540px]/card:block hidden">Track {activeTab} points for {selectedMonthName}—hover to reveal the top 5 stars.</span>
                              <span className="@[540px]/card:hidden">Track {activeTab} points for {selectedMonthName}—hover to reveal the top 5 stars.</span>
                            </>
                          )}
                        </CardDescription>
                        {/* No range toggle for daily chart; controlled by month selector above */}
                      </CardHeader>
                      <CardContent className={`${dailyChartData.length === 0 ? 'px-6' : 'px-0'} pt-4 sm:pt-6`}>
                        {trendError && (
                          <div className="text-center text-sm text-destructive mb-2">{trendError}</div>
                        )}
                        {!trendLoading && !trendError && dailyChartData.length === 0 && (
                          <NoData message="No Activity Data" />
                        )}
                            {!trendLoading && !trendError && activeTab === 'daily' && trendDaily.length > 0 && (
                              <ChartContainer
                                config={chartConfig}
                                className="aspect-auto h-[250px] w-full"
                              >
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={trendDaily}>
                                    <defs>
                                      <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(12 76% 61%)" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="hsl(12 76% 61%)" stopOpacity={0.1}/>
                                      </linearGradient>
                                    </defs>
                                    <XAxis
                                      dataKey="date"
                                      tickLine={false}
                                      axisLine={false}
                                      tickMargin={8}
                                      minTickGap={32}
                                      tickFormatter={(value) => {
                                        const date = new Date(value)
                                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                      }}
                                    />
                                    <YAxis
                                      tickLine={false}
                                      axisLine={false}
                                      tickMargin={8}
                                      domain={[1, 'dataMax']}
                                      tickFormatter={(value: number) => {
                                        const points = Math.round(value)
                                        return points === 0 ? '' : `${points}pts`
                                      }}
                                    />
                                    <ChartTooltip
                                      cursor={false}
                                      content={
                                        <ChartTooltipContent
                                          className="min-w-[16rem]"
                                          labelClassName="text-center w-full"
                                          labelFormatter={(value) => {
                                            const date = new Date(value)
                                            const dateText = date.toLocaleDateString("en-US", {
                                              month: "long",
                                              day: "numeric",
                                              year: "numeric",
                                            })
                                            return (
                                              <div className="flex w-full flex-col items-center">
                                                <span>{dateText}</span>
                                                <div className="h-px w-full bg-foreground/20 my-1" />
                                              </div>
                                            )
                                          }}
                                          indicator="dot"
                                          formatter={(val, name, item, _idx, point: any) => {
                                            const d = point as any
                                            return (
                                              <div className="flex w-full flex-col gap-1">
                                                <div className="flex w-full items-center justify-between text-muted-foreground">
                                                  <span>Top</span>
                                                  <span>Points</span>
                                                </div>
                                                {([1,2,3,4,5] as const).map((rank) => {
                                                  const user = d?.[`top${rank}` as const] as any | null | undefined
                                                  return (
                                                    <div key={rank} className="flex w-full items-center justify-between">
                                                      <span className="flex items-center gap-2">
                                                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-muted text-[10px]">{rank}</span>
                                                        {user ? `${user.first_name} ${user.last_name}` : '—'}
                                                      </span>
                                                      <span>{user ? calculateProductivityScore(user.points || 0, user.inactive_seconds || 0).toLocaleString() : '—'}</span>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            )
                                          }}
                                        />
                                      }
                                    />
                                    <Area
                                      dataKey={(entry: any) => {
                                        // Calculate productivity score from individual user data (top1)
                                        const topUser = entry.top1
                                        if (!topUser) return 0
                                        return calculateProductivityScore(topUser.points || 0, topUser.inactive_seconds || 0)
                                      }}
                                      type="natural"
                                      fill="url(#fillActive)"
                                      fillOpacity={0.4}
                                      stroke="hsl(12 76% 61%)"
                                      stackId="a"
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </ChartContainer>
                            )}
                        {!trendLoading && !trendError && activeTab === 'monthly' && trendDaily.length > 0 && (
                          <ChartContainer
                            config={chartConfig}
                            className="aspect-auto h-[250px] w-full"
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={trendDaily}>
                                <defs>
                                  <linearGradient id="fillMonthly" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(12 76% 61%)" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="hsl(12 76% 61%)" stopOpacity={0.1}/>
                                  </linearGradient>
                                </defs>
                                <XAxis
                                  dataKey="date"
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                  minTickGap={32}
                                  tickFormatter={(value) => {
                                    const date = new Date(value)
                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                  }}
                                />
                                <YAxis
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                  domain={[1, 'dataMax']}
                                  tickFormatter={(value: number) => {
                                    const points = Math.round(value)
                                    return points === 0 ? '' : `${points}pts`
                                  }}
                                />
                                <ChartTooltip
                                  cursor={false}
                                  content={
                                    <ChartTooltipContent
                                      className="min-w-[16rem]"
                                      labelClassName="text-center w-full"
                                      labelFormatter={(value) => {
                                        const date = new Date(value)
                                        const dateText = date.toLocaleDateString("en-US", {
                                          month: "long",
                                          day: "numeric",
                                          year: "numeric",
                                        })
                                        return (
                                          <div className="flex w-full flex-col items-center">
                                            <span>{dateText}</span>
                                            <div className="h-px w-full bg-foreground/20 my-1" />
                                          </div>
                                        )
                                      }}
                                      indicator="dot"
                                      formatter={(val, name, item, _idx, point: any) => {
                                        const d = point as any
                                        return (
                                          <div className="flex w-full flex-col gap-1">
                                            <div className="flex w-full items-center justify-between text-muted-foreground">
                                              <span>Top</span>
                                              <span>Points</span>
                                            </div>
                                            {([1,2,3,4,5] as const).map((rank) => {
                                              const user = d?.[`top${rank}` as const] as any | null | undefined
                                              return (
                                                <div key={rank} className="flex w-full items-center justify-between">
                                                  <span className="flex items-center gap-2">
                                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-muted text-[10px]">{rank}</span>
                                                    {user ? `${user.first_name} ${user.last_name}` : '—'}
                                                  </span>
                                                  <span>{user ? calculateProductivityScore(user.points || 0, user.inactive_seconds || 0).toLocaleString() : '—'}</span>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        )
                                      }}
                                    />
                                  }
                                />
                                <Area
                                  dataKey={(entry: any) => {
                                    // Calculate productivity score from individual user data (top1)
                                    const topUser = entry.top1
                                    if (!topUser) return 0
                                    return calculateProductivityScore(topUser.points || 0, topUser.inactive_seconds || 0)
                                  }}
                                  type="natural"
                                  fill="url(#fillMonthly)"
                                  fillOpacity={0.4}
                                  stroke="hsl(12 76% 61%)"
                                  stackId="a"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        )}
                         {!trendLoading && !trendError && activeTab === 'weekly' && trendDaily.length > 0 && (
                          <div className="relative">
                            <ChartContainer
                              config={chartConfig}
                              className="aspect-auto h-[250px] w-full"
                            >
                             <AreaChart data={trendDaily} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                            <defs>
                          <linearGradient id="fillTotalActive" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                  offset="5%"
                              stopColor="var(--color-totalActive)"
                                  stopOpacity={1.0}
                                />
                                <stop
                                  offset="95%"
                              stopColor="var(--color-totalActive)"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="date"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              minTickGap={32}
                              tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              }}
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              domain={[1, 'dataMax']}
                              tickFormatter={(value: number) => {
                                const points = Math.round(value)
                                return points === 0 ? '' : `${points}pts`
                              }}
                            />
                            <ChartTooltip
                              cursor={false}
                              content={
                                <ChartTooltipContent
                                  className="min-w-[16rem]"
                                  labelClassName="text-center w-full"
                                  labelFormatter={(value) => {
                                    const date = new Date(value)
                                    const dateText = date.toLocaleDateString("en-US", {
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                    return (
                                      <div className="flex w-full flex-col items-center">
                                        <span>{dateText}</span>
                                        <div className="h-px w-full bg-foreground/20 my-1" />
                                      </div>
                                    )
                                  }}
                                  indicator="dot"
                                  formatter={(val, name, item, _idx, point: any) => {
                                    const d = point as DailyTrendPoint
                                    return (
                                      <div className="flex w-full flex-col gap-1">
                                        <div className="flex w-full items-center justify-between text-muted-foreground">
                                          <span>Top</span>
                                          <span>Points</span>
                                        </div>
                                        {([1,2,3,4,5] as const).map((rank) => {
                                          const user = d?.[`top${rank}` as const] as DailyTopUser | null | undefined
                                          return (
                                            <div key={rank} className="flex w-full items-center justify-between">
                                              <span className="flex items-center gap-2">
                                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-muted text-[10px]">{rank}</span>
                                                {user ? `${user.first_name} ${user.last_name}` : '—'}
                                              </span>
                                               <span>{user ? calculateProductivityScore(user.points || 0, user.inactive_seconds || 0).toLocaleString() : '—'}</span>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )
                                  }}
                                />
                              }
                            />
                            <Area
                              dataKey={(entry: any) => {
                                // Calculate productivity score from individual user data (top1)
                                const topUser = entry.top1
                                if (!topUser) return 0
                                return calculateProductivityScore(topUser.points || 0, topUser.inactive_seconds || 0)
                              }}
                              type="natural"
                              fill="url(#fillTotalActive)"
                              stroke="var(--color-totalActive)"
                              activeDot={{ r: 3 }}
                              stackId="a"
                            />
                          </AreaChart>
                        </ChartContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Leaderboard Modal */}
      {selectedAgent && (
        <LeaderboardModal
          isOpen={isLeaderboardModalOpen}
          onClose={() => {
            setIsLeaderboardModalOpen(false)
            setSelectedAgent(null)
          }}
          agentId={selectedAgent.user_id.toString()}
          agentData={{
            user_id: selectedAgent.user_id,
            email: selectedAgent.email,
            user_type: "Agent",
            first_name: selectedAgent.first_name,
            middle_name: null,
            last_name: selectedAgent.last_name,
            nickname: null,
            profile_picture: selectedAgent.profile_picture,
            phone: null,
            birthday: null,
            city: null,
            address: null,
            gender: null,
            employee_id: null,
            job_title: null,
            work_email: null,
            shift_period: null,
            shift_schedule: null,
            shift_time: null,
            work_setup: null,
            employment_status: null,
            hire_type: null,
            staff_source: null,
            start_date: null,
            exit_date: null,
            company_id: selectedAgent.company_id || null,
            company_name: selectedAgent.company_id ? companyOptions.find(c => c.id === selectedAgent.company_id)?.company || null : null,
            company_badge_color: selectedAgent.company_id ? companyOptions.find(c => c.id === selectedAgent.company_id)?.badge_color || null : null,
            department_id: null,
            department_name: selectedAgent.department_name,
            station_id: null
          }}
        />
      )}
    </>
  )
}

