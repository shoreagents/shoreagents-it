"use client"

import * as React from "react"
import { useId } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { IconTrophy, IconMedal, IconCrown, IconStar, IconChartBar, IconAlertCircle } from "@tabler/icons-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NoData } from "@/components/ui/no-data"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "next-themes"

// Helper function to add alpha to hex colors
function withAlpha(hex: string, alpha: number): string {
  const clean = hex?.trim() || ''
  const match = /^#([A-Fa-f0-9]{6})$/.exec(clean)
  if (!match) return hex || 'transparent'
  const r = parseInt(clean.slice(1, 3), 16)
  const g = parseInt(clean.slice(3, 5), 16)
  const b = parseInt(clean.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface LeaderboardModalProps {
  isOpen: boolean
  onClose: () => void
  agentId?: string
  agentData?: AgentRecord
}

interface ChartDataPoint {
  date: string
  active: number
  inactive: number
}

interface ProductivityScore {
  user_id: number
  productivity_score: number
  rank: number
  month: number
  monthName: string
  isCurrentMonth?: boolean
  total_active_seconds?: number
}

interface AgentRecord {
  user_id: number
  email: string
  user_type: string
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  nickname: string | null
  profile_picture: string | null
  phone: string | null
  birthday: string | null
  city: string | null
  address: string | null
  gender: string | null
  employee_id: string | null
  job_title: string | null
  work_email: string | null
  shift_period: string | null
  shift_schedule: string | null
  shift_time: string | null
  work_setup: string | null
  employment_status: string | null
  hire_type: string | null
  staff_source: string | null
  start_date: string | null
  exit_date: string | null
  company_id: number | null
  company_name: string | null
  company_badge_color: string | null
  department_id: number | null
  department_name: string | null
  station_id: string | null
}

export function LeaderboardModal({ isOpen, onClose, agentId, agentData }: LeaderboardModalProps) {
  const { user } = useAuth()
  const { theme } = useTheme()
  
  // State for productivity scores
  const [productivityScores, setProductivityScores] = React.useState<ProductivityScore[]>([])
  const [productivityLoading, setProductivityLoading] = React.useState(false)
  const [productivityError, setProductivityError] = React.useState<string | null>(null)
  const [productivityDataLoaded, setProductivityDataLoaded] = React.useState(false)
  
  // Year selection state
  const [selectedYear, setSelectedYear] = React.useState<number>(() => {
    const now = new Date()
    return Math.max(now.getFullYear(), 2025)
  })
  
  // Tab state for current card
  const [activeTab, setActiveTab] = React.useState<'daily' | 'weekly' | 'monthly'>('monthly')
  
  // Unique ID for tab animation to prevent conflicts with other components
  const tabId = useId()
  
  // Current performance data for different timeframes
  const [currentPerformanceData, setCurrentPerformanceData] = React.useState<{
    daily: { rank: number; score: number } | null
    weekly: { rank: number; score: number } | null
    monthly: { rank: number; score: number } | null
  }>({
    daily: null,
    weekly: null,
    monthly: null
  })
  
  // Leaderboard data cache for productivity scores by year
  const [leaderboardDataCache, setLeaderboardDataCache] = React.useState<Record<string, ProductivityScore[]>>({})
  
  // All-time statistics data cache
  const [allTimeStatsCache, setAllTimeStatsCache] = React.useState<ProductivityScore[] | null>(null)
  
  // Leaderboard chart data cache
  const [leaderboardChartCache, setLeaderboardChartCache] = React.useState<Record<string, ChartDataPoint[]>>({})

  // Function to clear leaderboard cache
  const clearLeaderboardCache = () => {
    setLeaderboardDataCache({})
    setLeaderboardChartCache({})
    setAllTimeStatsCache(null)
    console.log('🗑️ Cleared leaderboard cache')
  }
  
  // Fetch all-time statistics data
  const fetchAllTimeStats = async () => {
    if (!agentData || !user || allTimeStatsCache) return
    
    try {
      const companyId = user.userType === 'Internal' ? 'all' : user.id
      const allTimeData: ProductivityScore[] = []
      
      // Fetch data for all years from 2025 to current year
      const currentYear = new Date().getFullYear()
      for (let year = 2025; year <= currentYear; year++) {
        for (let month = 1; month <= 12; month++) {
          try {
            const params = new URLSearchParams({
              companyId: companyId.toString(),
              timeframe: 'monthly',
              monthYear: `${year}-${month.toString().padStart(2, '0')}`
            })
            
            const response = await fetch(`/api/productivity-scores?${params}`)
            
            if (!response.ok) {
              continue
            }
            
            const data = await response.json()
            
            if (data && Array.isArray(data.productivityScores)) {
              const agentScore = data.productivityScores.find((score: any) => score.user_id === agentData.user_id)
              
              if (agentScore) {
                const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' })
                allTimeData.push({
                  ...agentScore,
                  month,
                  monthName,
                  year,
                  isCurrentMonth: month === new Date().getMonth() + 1 && year === new Date().getFullYear()
                })
              }
            }
          } catch (monthError) {
            continue
          }
        }
      }
      
      setAllTimeStatsCache(allTimeData)
      
    } catch (err) {
      console.error('❌ All-time stats fetch error:', err)
    }
  }
  
  // Fetch current performance data for different timeframes
  const fetchCurrentPerformanceData = async () => {
    if (!agentData || !user) return
    
    console.log('🔄 Fetching current performance data for agent:', agentData.user_id)
    
    try {
      const companyId = user.userType === 'Internal' ? 'all' : user.id
      const now = new Date()
      
      // Helper functions for date ranges
      const getTodayDate = () => {
        return now.toISOString().slice(0, 10)
      }
      
      const getCurrentWeekRange = () => {
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        return `${startOfWeek.toISOString().slice(0, 10)},${endOfWeek.toISOString().slice(0, 10)}`
      }
      
      const getCurrentMonth = () => {
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      }
      
      // Fetch daily data
      try {
        const dailyParams = new URLSearchParams({
          companyId: companyId.toString(),
          timeframe: 'monthly',
          trend: 'daily',
          monthYear: getTodayDate()
        })
        
        console.log('📅 Fetching daily data with params:', dailyParams.toString())
        const dailyResponse = await fetch(`/api/productivity-scores?${dailyParams}`)
        if (dailyResponse.ok) {
          const dailyData = await dailyResponse.json()
          console.log('📅 Daily data received:', dailyData)
          if (dailyData && Array.isArray(dailyData.productivityScores)) {
            const agentScore = dailyData.productivityScores.find((score: any) => score.user_id === agentData.user_id)
            if (agentScore) {
              console.log('📅 Daily agent score:', agentScore)
              setCurrentPerformanceData(prev => ({
                ...prev,
                daily: { rank: agentScore.rank, score: parseFloat(agentScore.productivity_score) || 0 }
              }))
            }
          }
        }
      } catch (dailyError) {
        console.warn('⚠️ Error fetching daily data:', dailyError)
      }
      
      // Fetch weekly data
      try {
        const weeklyParams = new URLSearchParams({
          companyId: companyId.toString(),
          timeframe: 'monthly',
          trend: 'daily',
          monthYear: getCurrentWeekRange()
        })
        
        console.log('📅 Fetching weekly data with params:', weeklyParams.toString())
        const weeklyResponse = await fetch(`/api/productivity-scores?${weeklyParams}`)
        if (weeklyResponse.ok) {
          const weeklyData = await weeklyResponse.json()
          console.log('📅 Weekly data received:', weeklyData)
          if (weeklyData && Array.isArray(weeklyData.productivityScores)) {
            const agentScore = weeklyData.productivityScores.find((score: any) => score.user_id === agentData.user_id)
            if (agentScore) {
              console.log('📅 Weekly agent score:', agentScore)
              setCurrentPerformanceData(prev => ({
                ...prev,
                weekly: { rank: agentScore.rank, score: parseFloat(agentScore.productivity_score) || 0 }
              }))
            }
          }
        }
      } catch (weeklyError) {
        console.warn('⚠️ Error fetching weekly data:', weeklyError)
      }
      
      // Fetch monthly data
      try {
        const monthlyParams = new URLSearchParams({
          companyId: companyId.toString(),
          timeframe: 'monthly',
          monthYear: getCurrentMonth()
        })
        
        console.log('📅 Fetching monthly data with params:', monthlyParams.toString())
        const monthlyResponse = await fetch(`/api/productivity-scores?${monthlyParams}`)
        if (monthlyResponse.ok) {
          const monthlyData = await monthlyResponse.json()
          console.log('📅 Monthly data received:', monthlyData)
          if (monthlyData && Array.isArray(monthlyData.productivityScores)) {
            const agentScore = monthlyData.productivityScores.find((score: any) => score.user_id === agentData.user_id)
            if (agentScore) {
              console.log('📅 Monthly agent score:', agentScore)
              setCurrentPerformanceData(prev => ({
                ...prev,
                monthly: { rank: agentScore.rank, score: parseFloat(agentScore.productivity_score) || 0 }
              }))
            }
          }
        }
      } catch (monthlyError) {
        console.warn('⚠️ Error fetching monthly data:', monthlyError)
      }
      
    } catch (err) {
      console.error('❌ Current performance data fetch error:', err)
    }
  }

  // Clear cache when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      clearLeaderboardCache()
    }
  }, [isOpen])

  // Fetch productivity scores
  const fetchProductivityScores = async () => {
    if (!agentData || !user) return
    
    const cacheKey = `${agentData.user_id}-${selectedYear}`
    
    // Check cache first
    if (leaderboardDataCache[cacheKey]) {
      console.log('📊 Using cached productivity data for year:', selectedYear)
      setProductivityScores(leaderboardDataCache[cacheKey])
      setProductivityDataLoaded(true)
      return
    }
    
    setProductivityLoading(true)
    setProductivityError(null)
    
    try {
      const companyId = user.userType === 'Internal' ? 'all' : user.id
      const allMonthsData: ProductivityScore[] = []
      
      // Fetch data for all months in the selected year
      for (let month = 1; month <= 12; month++) {
        try {
          const params = new URLSearchParams({
            companyId: companyId.toString(),
            timeframe: 'monthly',
            monthYear: `${selectedYear}-${month.toString().padStart(2, '0')}`
          })
          
          const response = await fetch(`/api/productivity-scores?${params}`)
          
          if (!response.ok) {
            console.warn(`⚠️ No data for ${selectedYear}-${month}`)
            continue
          }
          
          const data = await response.json()
          
          if (data && Array.isArray(data.productivityScores)) {
            // Find the specific agent's data
            const agentScore = data.productivityScores.find((score: any) => score.user_id === agentData.user_id)
            
            if (agentScore) {
              const monthName = new Date(selectedYear, month - 1).toLocaleDateString('en-US', { month: 'long' })
              allMonthsData.push({
                ...agentScore,
                month,
                monthName,
                isCurrentMonth: month === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear()
              })
            }
          }
        } catch (monthError) {
          console.warn(`⚠️ Error fetching data for ${selectedYear}-${month}:`, monthError)
          continue
        }
      }
      
      // Sort by month (most recent first)
      allMonthsData.sort((a, b) => b.month - a.month)
      
      setProductivityScores(allMonthsData)
      setProductivityDataLoaded(true)
      
      // Cache the data
      setLeaderboardDataCache(prev => ({
        ...prev,
        [cacheKey]: allMonthsData
      }))
      
      console.log('💾 Cached productivity data for year:', selectedYear)
      
    } catch (err) {
      console.error('❌ Productivity scores fetch error:', err)
      setProductivityError(err instanceof Error ? err.message : 'Failed to fetch productivity scores')
      setProductivityScores([])
    } finally {
      setProductivityLoading(false)
    }
  }

  // Load productivity scores when modal opens
  React.useEffect(() => {
    if (isOpen && !productivityDataLoaded && agentData && user) {
      fetchProductivityScores()
      fetchAllTimeStats()
      fetchCurrentPerformanceData()
      setProductivityDataLoaded(true)
    }
  }, [isOpen, productivityDataLoaded, agentData, user, selectedYear])

  // Handle year changes
  React.useEffect(() => {
    if (isOpen && productivityDataLoaded && agentData && user) {
      const cacheKey = `${agentData.user_id}-${selectedYear}`
      
      // Check if we have cached data for this year
      if (leaderboardDataCache[cacheKey]) {
        console.log('📊 Using cached data for year change:', selectedYear)
        setProductivityScores(leaderboardDataCache[cacheKey])
        return
      }
      
      // If no cached data, fetch it
      console.log('📊 No cached data found, fetching for year:', selectedYear)
      fetchProductivityScores()
    }
  }, [selectedYear])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50" />
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
          <DialogTitle className="sr-only">Leaderboard Performance</DialogTitle>
          
          {/* Fixed Header */}
          <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <Badge className="text-xs h-6 flex items-center rounded-[6px]">
                Leaderboard
              </Badge>
            </div>
          </div>

          {/* Fixed Agent Header */}
          <div className="px-6 py-5 flex-shrink-0">
            {/* Avatar and Agent Name */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={agentData?.profile_picture || "/avatars/shadcn.svg"} alt="Agent Avatar" />
                <AvatarFallback className="text-2xl">
                  {agentData?.first_name?.[0]}{agentData?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-2xl font-semibold mb-2">
                  {agentData?.first_name} {agentData?.last_name}
                </div>
                {/* Company Badge */}
                {agentData?.company_name && (
                  <Badge
                    variant="outline"
                    className="border"
                    style={{
                      backgroundColor: withAlpha(agentData.company_badge_color || '#999999', 0.2),
                      borderColor: withAlpha(agentData.company_badge_color || '#999999', 0.4),
                      color: theme === 'dark' ? '#ffffff' : (agentData.company_badge_color || '#6B7280'),
                    }}
                  >
                    <span className="truncate inline-block max-w-[16rem] align-bottom">{agentData.company_name}</span>
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Current Rank and Points with Tabs - Moved under the name/avatar */}
            <div className="mt-6">
              <div className="grid grid-cols-[1fr_2fr] gap-4 h-48">
                {/* Performance Card */}
                <div className="bg-card border rounded-lg p-4 flex flex-col">
                  {/* Animated Tabs inside the card */}
                  <div className="mb-4">
                    <div className="rounded-xl p-1 w-fit bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      <div className="flex gap-1 relative">
                        {[
                          { title: "Today", value: "daily" },
                          { title: "This Week", value: "weekly" },
                          { title: "This Month", value: "monthly" }
                        ].map((tab, idx) => (
                          <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value as 'daily' | 'weekly' | 'monthly')}
                            className="relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 text-black dark:text-white hover:text-foreground"
                            style={{ transformStyle: "preserve-3d" }}
                          >
                            {activeTab === tab.value && (
                              <motion.div
                                layoutId={`clickedbutton-${tabId}`}
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
                  
                  <div className="flex items-center flex-1">
                    <div className="flex-1 text-center border-r pr-4">
                      <div className="flex items-center justify-center gap-3">
                        {currentPerformanceData[activeTab] ? (
                          <>
                            <div className={`text-2xl font-bold ${
                              currentPerformanceData[activeTab]!.rank === 1 ? 'text-yellow-500' :
                              currentPerformanceData[activeTab]!.rank === 2 ? 'text-gray-500' :
                              currentPerformanceData[activeTab]!.rank === 3 ? 'text-amber-600' :
                              currentPerformanceData[activeTab]!.rank === 4 ? 'text-blue-500' :
                              currentPerformanceData[activeTab]!.rank === 5 ? 'text-purple-500' :
                              'text-muted-foreground'
                            }`}>
                              #{currentPerformanceData[activeTab]!.rank}
                            </div>
                            <div className="flex items-center gap-2">
                              {currentPerformanceData[activeTab]!.rank === 1 && <IconCrown className="h-6 w-6 text-yellow-500" />}
                              {currentPerformanceData[activeTab]!.rank === 2 && <IconMedal className="h-6 w-6 text-gray-500" />}
                              {currentPerformanceData[activeTab]!.rank === 3 && <IconTrophy className="h-6 w-6 text-amber-600" />}
                              {currentPerformanceData[activeTab]!.rank === 4 && <IconStar className="h-6 w-6 text-blue-500" />}
                              {currentPerformanceData[activeTab]!.rank === 5 && <IconStar className="h-6 w-6 text-purple-500" />}
                              {currentPerformanceData[activeTab]!.rank > 5 && <IconMedal className="h-6 w-6 text-muted-foreground" />}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-muted-foreground">-</div>
                            <IconMedal className="h-6 w-6 text-muted-foreground" />
                          </>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">Rank</div>
                    </div>
                    <div className="flex-1 text-center pl-4">
                      {currentPerformanceData[activeTab] ? (
                        <>
                          <div className="text-2xl font-bold text-primary">{currentPerformanceData[activeTab]!.score.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">Points</div>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-muted-foreground">0.00</div>
                          <div className="text-sm text-muted-foreground">Points</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Achievements Card */}
                <div className="bg-card border rounded-lg p-4 flex flex-col">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Achievements</h4>
                  
                  {/* Static Achievements */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center justify-center gap-6">
                      <div className="text-center">
                        <span className="text-lg">😊</span>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Happy Warrior</div>
                        <div className="text-xs text-muted-foreground">10 days positive mood</div>
                      </div>
                      <div className="text-center">
                        <span className="text-lg">⚡</span>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Speed Demon</div>
                        <div className="text-xs text-muted-foreground">Response time under 30 seconds</div>
                      </div>
                      <div className="text-center">
                        <span className="text-lg">🎯</span>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Task Master</div>
                        <div className="text-xs text-muted-foreground">50 tasks completed in a week</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="px-6 pb-6 space-y-6 overflow-y-auto flex-1 min-h-0">
            {/* Statistics Section - Separate card */}
            {productivityScores && productivityScores.length > 0 && (
              <div>
                <div className="flex items-center justify-between min-h-[40px]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-muted-foreground">Statistics</h3>
                  </div>
                </div>
                <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <IconChartBar className="h-5 w-5 text-primary" />
                          Overview
                        </h4>
                      </div>
                    </div>
                    {(() => {
                        const hasData = allTimeStatsCache && allTimeStatsCache.length > 0
                        
                        const stats = hasData ? {
                          totalMonths: allTimeStatsCache.length,
                          averageScore: allTimeStatsCache.reduce((sum, score) => sum + score.productivity_score, 0) / allTimeStatsCache.length,
                          bestScore: Math.max(...allTimeStatsCache.map(score => score.productivity_score)),
                          worstScore: Math.min(...allTimeStatsCache.map(score => score.productivity_score)),
                          totalActiveTime: allTimeStatsCache.reduce((sum, score) => sum + (score.total_active_seconds || 0), 0),
                          bestRank: Math.min(...allTimeStatsCache.map(score => score.rank)),
                          worstRank: Math.max(...allTimeStatsCache.map(score => score.rank))
                        } : {
                          totalMonths: 0,
                          averageScore: 0,
                          bestScore: 0,
                          worstScore: 0,
                          totalActiveTime: 0,
                          bestRank: 0,
                          worstRank: 0
                        }
                        
                        return (
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Best Score</span>
                                <span className="font-semibold">{hasData ? <span className="text-green-600">{stats.bestScore.toFixed(2)}</span> : "-"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Best Rank</span>
                                <span className="font-semibold flex items-center gap-1">
                                  {hasData ? (() => {
                                    const bestRankMonth = allTimeStatsCache.find(score => score.rank === stats.bestRank)
                                    return (
                                      <>
                                        <span className={`${
                                          stats.bestRank === 1 ? 'text-yellow-500' :
                                          stats.bestRank === 2 ? 'text-gray-500' :
                                          stats.bestRank === 3 ? 'text-amber-600' :
                                          stats.bestRank === 4 ? 'text-blue-500' :
                                          stats.bestRank === 5 ? 'text-purple-500' :
                                          'text-muted-foreground'
                                        }`}>#{stats.bestRank}</span>
                                        {stats.bestRank === 1 && <IconCrown className="h-4 w-4 text-yellow-500" />}
                                        {stats.bestRank === 2 && <IconMedal className="h-4 w-4 text-gray-500" />}
                                        {stats.bestRank === 3 && <IconTrophy className="h-4 w-4 text-amber-600" />}
                                        {stats.bestRank === 4 && <IconStar className="h-4 w-4 text-blue-500" />}
                                        {stats.bestRank === 5 && <IconStar className="h-4 w-4 text-purple-500" />}
                                      </>
                                    )
                                  })() : "-"}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Lowest Score</span>
                                <span className="font-semibold">{hasData ? <span className="text-red-600">{stats.worstScore.toFixed(2)}</span> : "-"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Worst Rank</span>
                                <span className="font-semibold flex items-center gap-1">
                                  {hasData ? (() => {
                                    const worstRankMonth = allTimeStatsCache.find(score => score.rank === stats.worstRank)
                                    return (
                                      <>
                                        <span className={`${
                                          stats.worstRank === 1 ? 'text-yellow-500' :
                                          stats.worstRank === 2 ? 'text-gray-500' :
                                          stats.worstRank === 3 ? 'text-amber-600' :
                                          stats.worstRank === 4 ? 'text-blue-500' :
                                          stats.worstRank === 5 ? 'text-purple-500' :
                                          'text-muted-foreground'
                                        }`}>#{stats.worstRank}</span>
                                        {stats.worstRank === 1 && <IconCrown className="h-4 w-4 text-yellow-500" />}
                                        {stats.worstRank === 2 && <IconMedal className="h-4 w-4 text-gray-500" />}
                                        {stats.worstRank === 3 && <IconTrophy className="h-4 w-4 text-amber-600" />}
                                        {stats.worstRank === 4 && <IconStar className="h-4 w-4 text-blue-500" />}
                                        {stats.worstRank === 5 && <IconStar className="h-4 w-4 text-purple-500" />}
                                      </>
                                    )
                                  })() : "-"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}
            
            {/* Past Records Section */}
            <div>
              <div className="flex items-center justify-between min-h-[40px]">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-muted-foreground">Past Records</h3>
                </div>
              </div>
              <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                 {!productivityDataLoaded && !productivityLoading ? (
                   <div>
                     {/* Current Month Skeleton */}
                     <div className="p-6 border-b border-[#cecece99] dark:border-border bg-gradient-to-r from-primary/5 to-primary/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Current</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-8" />
                          </div>
                          <div>
                            <Skeleton className="h-6 w-32 mb-1" />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <Skeleton className="h-6 w-16 mb-1" />
                              <span className="text-sm text-muted-foreground">Points</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Summary Section Skeleton */}
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Summary</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Year:</span>
                          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const currentYear = new Date().getFullYear()
                                const startYear = 2025
                                const options = []
                                for (let year = currentYear; year >= startYear; year--) {
                                  options.push({ value: year, label: year.toString() })
                                }
                                return options
                              })().map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Monthly Scores Skeleton */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <IconTrophy className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium">Monthly Scores</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 border-border">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 w-8">
                                  <Skeleton className="h-4 w-6" />
                                </div>
                                <div>
                                  <Skeleton className="h-4 w-24" />
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-4">
                                  <div className="text-center">
                                    <Skeleton className="h-4 w-12 mb-1" />
                                    <span className="text-xs text-muted-foreground">Points</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Statistics Skeleton */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <IconChartBar className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Statistics</span>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Best Score</span>
                              <Skeleton className="h-4 w-12" />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Best Rank</span>
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Lowest Score</span>
                              <Skeleton className="h-4 w-12" />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Worst Rank</span>
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                 ) : productivityLoading ? (
                   <div>
                     {/* Current Month Skeleton */}
                     <div className="p-6 border-b border-[#cecece99] dark:border-border bg-gradient-to-r from-primary/5 to-primary/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Current</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-8" />
                          </div>
                          <div>
                            <Skeleton className="h-6 w-32 mb-1" />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <Skeleton className="h-6 w-16 mb-1" />
                              <span className="text-sm text-muted-foreground">Points</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Summary Section Skeleton */}
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Summary</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Year:</span>
                          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const currentYear = new Date().getFullYear()
                                const startYear = 2025
                                const options = []
                                for (let year = currentYear; year >= startYear; year--) {
                                  options.push({ value: year, label: year.toString() })
                                }
                                return options
                              })().map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Monthly Scores Skeleton */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <IconTrophy className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium">Monthly Scores</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 border-border">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 w-8">
                                  <Skeleton className="h-4 w-6" />
                                </div>
                                <div>
                                  <Skeleton className="h-4 w-24" />
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-4">
                                  <div className="text-center">
                                    <Skeleton className="h-4 w-12 mb-1" />
                                    <span className="text-xs text-muted-foreground">Points</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Statistics Skeleton */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <IconChartBar className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Statistics</span>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Best Score</span>
                              <Skeleton className="h-4 w-12" />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Best Rank</span>
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Lowest Score</span>
                              <Skeleton className="h-4 w-12" />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Worst Rank</span>
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : productivityError ? (
                  <div className="p-6 text-center">
                    <IconAlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                    <p className="text-sm text-destructive">{productivityError}</p>
                  </div>
                 ) : (
                   <div>
                     {/* Summary Section - Only show when there's data */}
                     {productivityScores && productivityScores.length > 0 && (
                     <div className="p-6">
                      
                      {/* Monthly Score Section */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <IconTrophy className="h-5 w-5 text-primary" />
                            Monthly Scores
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Year:</span>
                            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                              <SelectTrigger className="w-24">
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent>
                                {(() => {
                                  const currentYear = new Date().getFullYear()
                                  const startYear = 2025
                                  const options = []
                                  for (let year = currentYear; year >= startYear; year--) {
                                    options.push({ value: year, label: year.toString() })
                                  }
                                  return options
                                })().map((option) => (
                                  <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {(() => {
                            // Show only current month and preceding months if year is current
                            const currentYear = new Date().getFullYear()
                            const currentMonth = new Date().getMonth() + 1
                            
                            return productivityScores
                              .filter((score: any) => {
                                if (selectedYear === currentYear) {
                                  // For current year, only show current month and preceding months
                                  return score.month <= currentMonth
                                } else {
                                  // For past years, show all months
                                  return true
                                }
                              })
                              .map((score: any, index: number) => (
                            <div 
                              key={`${score.month}-${score.user_id}`}
                              className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 border-border"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 w-8">
                                  <span className={`text-sm font-medium ${
                                    score.rank === 1 ? 'text-yellow-500' :
                                    score.rank === 2 ? 'text-gray-500' :
                                    score.rank === 3 ? 'text-amber-600' :
                                    score.rank === 4 ? 'text-blue-500' :
                                    score.rank === 5 ? 'text-purple-500' :
                                    'text-muted-foreground'
                                  }`}>#{score.rank}</span>
                                </div>
                                <div>
                                  <div className="font-medium text-sm flex items-center gap-2">
                                    {score.monthName}
                                    {score.rank === 1 && <IconCrown className="h-4 w-4 text-yellow-500" />}
                                    {score.rank === 2 && <IconMedal className="h-4 w-4 text-gray-500" />}
                                    {score.rank === 3 && <IconTrophy className="h-4 w-4 text-amber-600" />}
                                    {score.rank === 4 && <IconStar className="h-4 w-4 text-blue-500" />}
                                    {score.rank === 5 && <IconStar className="h-4 w-4 text-purple-500" />}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-center">
                                  <div className="text-sm font-medium">{score.productivity_score.toFixed(2)}</div>
                                  <div className="text-xs text-muted-foreground">Points</div>
                                </div>
                              </div>
                            </div>
                          ))
                          })()}
                        </div>
                        </div>
                    </div>
                    )}
                    
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
