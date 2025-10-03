"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconGlobe, IconCreditCard, IconPlus, IconUpload, IconX, IconSearch, IconLink, IconMinus, IconCheck, IconGenderMale, IconGenderFemale, IconGenderNeutrois, IconHelp, IconSun, IconMoon, IconClockHour4, IconUsers, IconHome, IconDeviceLaptop, IconTrophy, IconMedal, IconCrown, IconStar, IconChartBar, IconRefresh } from "@tabler/icons-react"
import { useRealtimeMembers } from '@/hooks/use-realtime-members'
import { SendHorizontal, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataFieldRow } from "@/components/ui/fields"
import { Calendar } from "@/components/ui/calendar"
import { NoData } from "@/components/ui/no-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedTabs } from "@/components/ui/animated-tabs"

import { Popover, PopoverContent, PopoverTrigger, PopoverItem } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { ColorPicker } from "@/components/ui/color-picker"
import { LinkPreview } from "@/components/ui/link-preview"
import { MembersActivityLog } from "@/components/members-activity-log"
import { Comment } from "@/components/ui/comment"
import { AgentActivityData } from "@/components/agent-activity-data"

interface AgentsDetailModalProps {
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
  // Personal Info fields
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
  // Job Info fields
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
  // Agent specific fields
  member_id: number | null
  member_company: string | null
  member_badge_color: string | null
  department_id: number | null
  department_name: string | null
  station_id: string | null
}

// Helper function to get company badge styling based on badge color
const getCompanyBadgeClass = (badgeColor: string | null): string => {
  if (!badgeColor) {
    return 'bg-gray-50 dark:bg-gray-600/20 border-gray-300 dark:border-gray-600/20'
  }
  
  // Convert hex to RGB and create light/dark variants
  const hex = badgeColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Create light mode background (20% opacity)
  const lightBg = `rgba(${r}, ${g}, ${b}, 0.1)`
  // Create dark mode background (20% opacity)
  const darkBg = `rgba(${r}, ${g}, ${b}, 0.2)`
  // Create border color (40% opacity)
  const borderColor = `rgba(${r}, ${g}, ${b}, 0.4)`
  
  return `border-[${borderColor}]`
}

// Convert 24-hour time to 12-hour format
const convertTo12Hour = (time24: string): string => {
  if (!time24) return ''
  
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Convert 12-hour time to 24-hour format
const convertTo24Hour = (time12: string): string => {
  if (!time12) return ''
  
  const [time, period] = time12.split(' ')
  const [hours, minutes] = time.split(':').map(Number)
  
  let hours24 = hours
  if (period === 'AM' && hours === 12) {
    hours24 = 0
  } else if (period === 'PM' && hours !== 12) {
    hours24 = hours + 12
  }
  
  return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Parse shift time string to extract start and end times
const parseShiftTime = (shiftTime: string | null): { startTime: string; endTime: string } => {
  if (!shiftTime) return { startTime: '', endTime: '' }
  
  const parts = shiftTime.split(' - ')
  if (parts.length !== 2) return { startTime: '', endTime: '' }
  
  return {
    startTime: convertTo24Hour(parts[0].trim()),
    endTime: convertTo24Hour(parts[1].trim())
  }
}

// Combine start and end times into shift time format
const combineShiftTime = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return ''
  
  const start12 = convertTo12Hour(startTime)
  const end12 = convertTo12Hour(endTime)
  
  return `${start12} - ${end12}`
}


export function AgentsDetailModal({ isOpen, onClose, agentId, agentData }: AgentsDetailModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()

  // Activity data fetching function (to be called lazily)
  const fetchActivityData = async () => {
    if (!agentData || !user) return
    
    setActivityLoading(true)
    
    try {
      const memberId = user.userType === 'Internal' ? 'all' : user.id
      
      // Get date ranges
      const today = new Date()
      
      // Yesterday's date
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
      
      // Week range (Sunday to Saturday)
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay()) // Start from Sunday
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + (6 - today.getDay())) // End on Saturday
      
      const startDate = startOfWeek.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
      const endDate = endOfWeek.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
      
      // Month range
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      
      const monthStartDate = startOfMonth.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
      const monthEndDate = endOfMonth.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
      
      // Today's date
      const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
      
      // Fetch activity data in parallel
      const [todayResponse, yesterdayResponse, weekResponse, monthResponse] = await Promise.all([
        fetch(`/api/activities?memberId=${memberId}&date=${todayStr}`),
        fetch(`/api/activities?memberId=${memberId}&date=${yesterdayStr}`),
        fetch(`/api/activities?memberId=${memberId}&startDate=${startDate}&endDate=${endDate}`),
        fetch(`/api/activities?memberId=${memberId}&startDate=${monthStartDate}&endDate=${monthEndDate}`)
      ])
      
      // Process responses
      const [todayData, yesterdayData, weekData, monthData] = await Promise.all([
        todayResponse.ok ? todayResponse.json() : { activities: [] },
        yesterdayResponse.ok ? yesterdayResponse.json() : { activities: [] },
        weekResponse.ok ? weekResponse.json() : { activities: [] },
        monthResponse.ok ? monthResponse.json() : { activities: [] }
      ])
      
      setTodayActivities(todayData.activities || [])
      setYesterdayActivities(yesterdayData.activities || [])
      setWeekActivities(weekData.activities || [])
      setMonthActivities(monthData.activities || [])
      
    } catch (err) {
      console.error('❌ Activity data fetch error:', err)
      setTodayActivities([])
      setYesterdayActivities([])
      setWeekActivities([])
      setMonthActivities([])
    } finally {
      setActivityLoading(false)
    }
  }

  // Helper functions for activity data
  const getTodayActivityData = (employee: any) => {
    const employeeId = employee.user_id || employee.id
    const todayActivity = todayActivities.find(a => a.user_id.toString() === employeeId.toString())
    return todayActivity || {
      today_active_seconds: 0,
      today_inactive_seconds: 0
    }
  }

  const getYesterdayActivityData = (employee: any) => {
    const employeeId = employee.user_id || employee.id
    const yesterdayActivity = yesterdayActivities.find(a => a.user_id.toString() === employeeId.toString())
    return yesterdayActivity || {
      today_active_seconds: 0,
      today_inactive_seconds: 0
    }
  }

  const getWeekActivityData = (employee: any) => {
    const employeeId = employee.user_id || employee.id
    const weekEmployeeActivities = weekActivities.filter(a => a.user_id.toString() === employeeId.toString())
    
    const totalActive = weekEmployeeActivities.reduce((sum, activity) => sum + activity.today_active_seconds, 0)
    const totalInactive = weekEmployeeActivities.reduce((sum, activity) => sum + activity.today_inactive_seconds, 0)
    
    return {
      total_active_seconds: totalActive,
      total_inactive_seconds: totalInactive
    }
  }

  const getMonthActivityData = (employee: any) => {
    const employeeId = employee.user_id || employee.id
    const monthEmployeeActivities = monthActivities.filter(a => a.user_id.toString() === employeeId.toString())
    
    const totalActive = monthEmployeeActivities.reduce((sum, activity) => sum + activity.today_active_seconds, 0)
    const totalInactive = monthEmployeeActivities.reduce((sum, activity) => sum + activity.today_inactive_seconds, 0)
    
    return {
      total_active_seconds: totalActive,
      total_inactive_seconds: totalInactive
    }
  }
  
  // Helper function to create colors with alpha transparency
  function withAlpha(hex: string, alpha: number): string {
    const clean = hex?.trim() || ''
    const match = /^#([A-Fa-f0-9]{6})$/.exec(clean)
    if (!match) return hex || 'transparent'
    const r = parseInt(clean.slice(1, 3), 16)
    const g = parseInt(clean.slice(3, 5), 16)
    const b = parseInt(clean.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const [activeTab, setActiveTab] = React.useState("information")
  const [comment, setComment] = React.useState("")
  const [isCommentFocused, setIsCommentFocused] = React.useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
      const [commentsList, setCommentsList] = React.useState<Array<{id: string, comment: string, user_name: string, created_at: string}>>([])
    const [localGender, setLocalGender] = React.useState<string | null>(null)
    
    // Lazy loading states
    const [activityDataLoaded, setActivityDataLoaded] = React.useState(false)
    const [productivityDataLoaded, setProductivityDataLoaded] = React.useState(false)
    
    // Progressive loading state for additional agent data
    const [isLoadingAdditionalData, setIsLoadingAdditionalData] = React.useState(false)
    
    // Activity data states
    const [todayActivities, setTodayActivities] = React.useState<any[]>([])
    const [yesterdayActivities, setYesterdayActivities] = React.useState<any[]>([])
    const [weekActivities, setWeekActivities] = React.useState<any[]>([])
    const [monthActivities, setMonthActivities] = React.useState<any[]>([])
    const [activityLoading, setActivityLoading] = React.useState(false)
    const [localBirthday, setLocalBirthday] = React.useState<Date | undefined>(undefined)
    const [localStartDate, setLocalStartDate] = React.useState<Date | undefined>(undefined)
    const [localExitDate, setLocalExitDate] = React.useState<Date | undefined>(undefined)
    const [localShiftPeriod, setLocalShiftPeriod] = React.useState<string | null>(null)
    const [localEmploymentStatus, setLocalEmploymentStatus] = React.useState<string | null>(null)
    const [localStartTime, setLocalStartTime] = React.useState<string>('')
    const [localEndTime, setLocalEndTime] = React.useState<string>('')
    const [showCompanySelection, setShowCompanySelection] = React.useState(false)
    const [companySearch, setCompanySearch] = React.useState("")
    const [companies, setCompanies] = React.useState<Array<{id: number, company: string, badge_color: string | null}>>([])
    const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [localAgentData, setLocalAgentData] = React.useState<AgentRecord | null>(null)
    
    // Productivity scores state
    const [productivityScores, setProductivityScores] = React.useState<any[]>([])
    const [productivityStats, setProductivityStats] = React.useState<any>(null)
    const [productivityLoading, setProductivityLoading] = React.useState(false)
    const [productivityError, setProductivityError] = React.useState<string | null>(null)
    const [selectedMonth, setSelectedMonth] = React.useState<number>(() => {
      const now = new Date()
      return now.getMonth() + 1
    })
    const [selectedYear, setSelectedYear] = React.useState<number>(() => {
      const now = new Date()
      return Math.max(now.getFullYear(), 2025)
    })

    // Add local state for editable text fields
    const [inputValues, setInputValues] = React.useState<Record<string, string>>({
      first_name: '',
      middle_name: '',
      last_name: '',
      nickname: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      employee_id: '',
      job_title: '',
      shift_schedule: '',
      work_setup: '',
      hire_type: '',
      staff_source: ''
    })

    // Add original values for change tracking
    const [originalValues, setOriginalValues] = React.useState<Record<string, string>>({
      first_name: '',
      middle_name: '',
      last_name: '',
      nickname: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      employee_id: '',
      job_title: '',
      shift_schedule: '',
      work_setup: '',
      hire_type: '',
      staff_source: ''
    })

    // Add change tracking state
    const [hasChanges, setHasChanges] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)

    // Chart data cache for AgentActivityData component
    const [chartDataCache, setChartDataCache] = React.useState<Record<string, ChartDataPoint[]>>({})

    // Leaderboard data cache for productivity scores by year
    const [leaderboardDataCache, setLeaderboardDataCache] = React.useState<Record<string, ProductivityScore[]>>({})
    
    // Leaderboard chart data cache (similar to Activity Data)
    const [leaderboardChartCache, setLeaderboardChartCache] = React.useState<Record<string, ChartDataPoint[]>>({})

    // Function to clear leaderboard cache (useful for manual refresh)
    const clearLeaderboardCache = () => {
      setLeaderboardDataCache({})
      setLeaderboardChartCache({})
      console.log('🗑️ Cleared leaderboard cache')
    }

    // Function to clear all caches
    const clearAllCaches = () => {
      setChartDataCache({})
      setLeaderboardDataCache({})
      setLeaderboardChartCache({})
      console.log('🗑️ Cleared all caches')
    }

    // Clear all caches when modal closes
    React.useEffect(() => {
      if (!isOpen) {
        clearAllCaches()
      }
    }, [isOpen])

    // Clear all caches when switching agents
    React.useEffect(() => {
      if (isOpen && agentData) {
        clearAllCaches()
      }
    }, [agentData?.user_id])

    // Initialize input values when modal opens
    React.useEffect(() => {
      if (isOpen && agentData) {
        // Reset active tab to Personal Info when modal opens
        setActiveTab("information")
        
        // Reset lazy loading states when modal opens
        setActivityDataLoaded(false)
        setProductivityDataLoaded(false)
        
        // Initialize local agent data
        setLocalAgentData(agentData)
        
        setLocalGender(agentData.gender)
        // Initialize birthday date - parse date string directly to avoid timezone issues
        if (agentData.birthday) {
          const [year, month, day] = agentData.birthday.split('-').map(Number)
          setLocalBirthday(new Date(year, month - 1, day))
        } else {
          setLocalBirthday(undefined)
        }
        // Initialize start date - parse date string directly to avoid timezone issues
        if (agentData.start_date) {
          const [year, month, day] = agentData.start_date.split('-').map(Number)
          setLocalStartDate(new Date(year, month - 1, day))
        } else {
          setLocalStartDate(undefined)
        }
        // Initialize exit date - parse date string directly to avoid timezone issues
        if (agentData.exit_date) {
          const [year, month, day] = agentData.exit_date.split('-').map(Number)
          setLocalExitDate(new Date(year, month - 1, day))
        } else {
          setLocalExitDate(undefined)
        }
        // Initialize shift period
        setLocalShiftPeriod(agentData.shift_period)
        // Initialize employment status
        setLocalEmploymentStatus(agentData.employment_status)
        
        // Initialize shift times by parsing the shift_time string
        const { startTime, endTime } = parseShiftTime(agentData.shift_time)
        setLocalStartTime(startTime)
        setLocalEndTime(endTime)

        // Initialize input values for editable fields
        const initialValues = {
          first_name: agentData.first_name || '',
          middle_name: agentData.middle_name || '',
          last_name: agentData.last_name || '',
          nickname: agentData.nickname || '',
          email: agentData.email || '',
          phone: agentData.phone || '',
          address: agentData.address || '',
          city: agentData.city || '',
          employee_id: agentData.employee_id || '',
          job_title: agentData.job_title || '',
          shift_schedule: agentData.shift_schedule || '',
          work_setup: agentData.work_setup || '',
          hire_type: agentData.hire_type || '',
          staff_source: agentData.staff_source || ''
        }
        setInputValues(initialValues)
        setOriginalValues(initialValues)
        setHasChanges(false)
      }
    }, [isOpen, agentData])

  // Fetch companies when company selection is opened
  React.useEffect(() => {
    if (showCompanySelection) {
      fetchCompanies(companySearch)
    }
  }, [showCompanySelection, companySearch])

  // Lazy load activity data when tab is clicked
  React.useEffect(() => {
    if (activeTab === 'activity-data' && !activityDataLoaded && agentData && user) {
      fetchActivityData()
      setActivityDataLoaded(true)
    }
  }, [activeTab, activityDataLoaded, agentData, user])

  // Productivity scores fetching function (to be called lazily)
    const fetchProductivityScores = async () => {
      if (!agentData?.user_id || !user) return
      
      // Check if data is already cached for this year
      const cacheKey = `${agentData.user_id}-${selectedYear}`
      if (leaderboardDataCache[cacheKey]) {
        console.log('📊 Using cached productivity data for year:', selectedYear)
        setProductivityScores(leaderboardDataCache[cacheKey])
        setProductivityDataLoaded(true)
        return
      }
      
      setProductivityLoading(true)
      setProductivityError(null)
      
      try {
        const memberId = user.userType === 'Internal' ? 'all' : user.id
        const allMonthsData: ProductivityScore[] = []
        
        console.log('📊 Fetching productivity scores for user:', agentData.user_id, 'memberId:', memberId, 'year:', selectedYear)
        
        const currentYear = new Date().getFullYear()
        
        // If viewing past years, first fetch current year's current month data
        if (selectedYear !== currentYear) {
          const currentMonth = new Date().getMonth() + 1
          const currentMonthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
          
          const params = new URLSearchParams({
            memberId: String(memberId),
            timeframe: 'monthly',
            monthYear: currentMonthYear
          })
          
          const response = await fetch(`/api/productivity-scores?${params}`)
          
          if (response.ok) {
            const data = await response.json()
            const userScore = data.productivityScores.find((score: any) => score.user_id === agentData.user_id)
            const userRank = data.productivityScores.findIndex((score: any) => score.user_id === agentData.user_id) + 1
            
            if (userScore && userScore.productivity_score > 0) {
              userScore.rank = userRank
              userScore.month = currentMonth
              userScore.monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })
              userScore.isCurrentMonth = true
              allMonthsData.push(userScore)
            }
          }
        }
        
      // 🚀 OPTIMIZATION: Fetch all 12 months in parallel instead of sequential!
      const monthPromises = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
          const monthYear = `${selectedYear}-${String(month).padStart(2, '0')}`
          
          const params = new URLSearchParams({
            memberId: String(memberId),
            timeframe: 'monthly',
            monthYear: monthYear
          })
          
        return fetch(`/api/productivity-scores?${params}`)
      })
      
      // Execute all 12 API calls in parallel
      const responses = await Promise.all(monthPromises)
      
      // Process all responses
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i]
        const month = i + 1
          
          if (!response.ok) {
          console.warn(`Failed to fetch data for ${selectedYear}-${String(month).padStart(2, '0')}`)
            continue
          }
          
          const data = await response.json()
          
          // Find the current user's score for this month
          const userScore = data.productivityScores.find((score: any) => score.user_id === agentData.user_id)
          const userRank = data.productivityScores.findIndex((score: any) => score.user_id === agentData.user_id) + 1
          
          // Only add months that have actual data (userScore exists and has productivity data)
          if (userScore && userScore.productivity_score > 0) {
            userScore.rank = userRank
            userScore.month = month
            userScore.monthName = new Date(selectedYear, month - 1).toLocaleString('default', { month: 'long' })
            allMonthsData.push(userScore)
          }
        }
        
        console.log('✅ All months productivity data received:', allMonthsData)
        
        // Sort by month (December first, January last)
        // If viewing past years, prioritize current month at the top
        allMonthsData.sort((a, b) => {
          if (a.isCurrentMonth && selectedYear !== currentYear) return -1
          if (b.isCurrentMonth && selectedYear !== currentYear) return 1
          return b.month - a.month
        })
        
        setProductivityScores(allMonthsData)
        setProductivityStats(null) // No stats needed for individual user data
        
        // Cache the fetched data for this year
        setLeaderboardDataCache(prev => ({
          ...prev,
          [cacheKey]: allMonthsData
        }))
        
        console.log('💾 Cached productivity data for year:', selectedYear)
        
      } catch (err) {
        console.error('❌ Productivity scores fetch error:', err)
        setProductivityError(err instanceof Error ? err.message : 'Failed to fetch productivity scores')
        setProductivityScores([])
        setProductivityStats(null)
      } finally {
        setProductivityLoading(false)
      }
    }

  // Lazy load productivity scores when leaderboard tab is clicked
  React.useEffect(() => {
    if (activeTab === 'leaderboard' && !productivityDataLoaded && agentData && user) {
    fetchProductivityScores()
      setProductivityDataLoaded(true)
    }
  }, [activeTab, productivityDataLoaded, agentData, user, selectedYear])

  // Handle year changes - use cache if available, otherwise refetch data
  React.useEffect(() => {
    if (activeTab === 'leaderboard' && productivityDataLoaded && agentData && user) {
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

  // Detect when additional agent data is being loaded
  React.useEffect(() => {
    if (agentData) {
      // Check if we have basic data only by looking for meaningful data in additional fields
      // We'll consider data "loaded" if we have at least 3 meaningful additional fields
      const additionalFields = [
        agentData.middle_name,
        agentData.nickname,
        agentData.birthday,
        agentData.city,
        agentData.address,
        agentData.gender,
        agentData.employee_id,
        agentData.work_email,
        agentData.shift_schedule,
        agentData.shift_time,
        agentData.work_setup,
        agentData.hire_type,
        agentData.staff_source,
        agentData.start_date,
        agentData.exit_date,
        agentData.member_badge_color,
        agentData.station_id,
        agentData.department_name
      ]
      
      // Count fields that have meaningful data (not null, undefined, or empty string)
      const meaningfulFieldsCount = additionalFields.filter(field => 
        field && typeof field === 'string' && field.trim() !== ''
      ).length
      
      // If we have less than 5 meaningful additional fields, show skeleton
      // This accounts for agents who might have naturally sparse data
      const hasBasicDataOnly = meaningfulFieldsCount < 5

      console.log('🔍 Loading state check:', {
        hasBasicDataOnly,
        meaningfulFieldsCount,
        totalAdditionalFields: additionalFields.length,
        additionalFields: additionalFields.map((field, index) => ({
          index,
          value: field,
          hasValue: field && typeof field === 'string' && field.trim() !== ''
        }))
      })

      setIsLoadingAdditionalData(hasBasicDataOnly)
    }
  }, [agentData])

  // Use local agent data if available, otherwise use original agent data, fallback to static data
  const currentAgentData = localAgentData || agentData
  
  // Debug: Log the current agent data and display data
  console.log('🔄 Current agent data:', {
    member_id: currentAgentData?.member_id,
    member_company: currentAgentData?.member_company,
    member_badge_color: currentAgentData?.member_badge_color
  })
  
  const displayData = currentAgentData ? {
    id: currentAgentData.user_id.toString(),
    first_name: inputValues.first_name || currentAgentData.first_name || "Unknown",
    middle_name: inputValues.middle_name || currentAgentData.middle_name || null,
    last_name: inputValues.last_name || currentAgentData.last_name || "Agent",
    nickname: inputValues.nickname || currentAgentData.nickname || null,
    profile_picture: currentAgentData.profile_picture || null,
    employee_id: inputValues.employee_id || currentAgentData.employee_id || "N/A",
    member_id: currentAgentData.member_id || null,
    member_company: currentAgentData.member_company || null,
    member_badge_color: currentAgentData.member_badge_color || null,
    member_name: (inputValues.first_name || currentAgentData.first_name) && (inputValues.last_name || currentAgentData.last_name) ? `${inputValues.first_name || currentAgentData.first_name} ${inputValues.last_name || currentAgentData.last_name}` : null,
    job_title: inputValues.job_title || currentAgentData.job_title || "Not Specified",
    department: currentAgentData.department_name || "Not Specified",
    email: currentAgentData.work_email || currentAgentData.email || "No email",
    phone: inputValues.phone || currentAgentData.phone || "No phone",
          birthday: localBirthday ? `${localBirthday.getFullYear()}-${String(localBirthday.getMonth() + 1).padStart(2, '0')}-${String(localBirthday.getDate()).padStart(2, '0')}` : (currentAgentData.birthday || null),
    city: inputValues.city || currentAgentData.city || null,
    address: inputValues.address || currentAgentData.address || null,
    gender: localGender !== null ? localGender : (currentAgentData.gender || null),
    start_date: localStartDate ? `${localStartDate.getFullYear()}-${String(localStartDate.getMonth() + 1).padStart(2, '0')}-${String(localStartDate.getDate()).padStart(2, '0')}` : (currentAgentData.start_date || null),
    exit_date: localExitDate ? `${localExitDate.getFullYear()}-${String(localExitDate.getMonth() + 1).padStart(2, '0')}-${String(localExitDate.getDate()).padStart(2, '0')}` : (currentAgentData.exit_date || null),
    work_email: currentAgentData.work_email || null,
    shift_period: localShiftPeriod !== null ? localShiftPeriod : (currentAgentData.shift_period || null),
    shift_schedule: inputValues.shift_schedule || currentAgentData.shift_schedule || null,
    shift_time: (localStartTime && localEndTime) ? combineShiftTime(localStartTime, localEndTime) : (currentAgentData.shift_time || null),
    work_setup: inputValues.work_setup || currentAgentData.work_setup || null,
    employment_status: localEmploymentStatus !== null ? localEmploymentStatus : (currentAgentData.employment_status || null),
    hire_type: inputValues.hire_type || currentAgentData.hire_type || null,
    staff_source: inputValues.staff_source || currentAgentData.staff_source || null,
    status: currentAgentData.exit_date ? "Inactive" : "Active"
  } : {
    id: "N/A",
    first_name: "Unknown",
    middle_name: null,
    last_name: "Agent",
    nickname: null,
    profile_picture: null,
    employee_id: "N/A",
    member_id: null,
    member_company: null,
    member_badge_color: null,
    member_name: null,
    job_title: "Not Specified",
    department: "Not Specified",
    email: "No email",
    phone: "No phone",
    birthday: null,
    city: null,
    address: null,
    gender: null,
    start_date: null,
    exit_date: null,
    work_email: null,
    shift_period: null,
    shift_schedule: null,
    shift_time: null,
    work_setup: null,
    employment_status: null,
    hire_type: null,
    staff_source: null,
    status: "Unknown"
  }

  // Check if there are unsaved changes
  const hasUnsavedChanges = React.useMemo(() => {
    if (!localAgentData) return false
    
    // Check for input field changes
    const hasFieldChanges = Object.keys(inputValues).some(fieldName => {
      const currentValue = inputValues[fieldName]
      const originalValue = originalValues[fieldName]
      return currentValue !== originalValue
    })
    
    // Check for other field changes by comparing with original values
    const hasOtherChanges = 
      localGender !== (agentData?.gender || null) ||
      (localBirthday?.toISOString().split('T')[0] || null) !== (agentData?.birthday || null) ||
      (localStartDate?.toISOString().split('T')[0] || null) !== (agentData?.start_date || null) ||
      (localExitDate?.toISOString().split('T')[0] || null) !== (agentData?.exit_date || null) ||
      localShiftPeriod !== (agentData?.shift_period || null) ||
      localEmploymentStatus !== (agentData?.employment_status || null) ||
      localStartTime !== (parseShiftTime(agentData?.shift_time || null).startTime) ||
      localEndTime !== (parseShiftTime(agentData?.shift_time || null).endTime)
    
    const hasChanges = hasFieldChanges || hasOtherChanges
    
    // Debug logging
    if (hasChanges) {
      console.log('🔄 Changes detected:', {
        hasFieldChanges,
        hasOtherChanges,
        fieldChanges: Object.keys(inputValues).filter(fieldName => {
          const currentValue = inputValues[fieldName]
          const originalValue = originalValues[fieldName]
          return currentValue !== originalValue
        }),
        otherChanges: {
          gender: { current: localGender, original: agentData?.gender },
          birthday: { current: localBirthday?.toISOString().split('T')[0], original: agentData?.birthday },
          startDate: { current: localStartDate?.toISOString().split('T')[0], original: agentData?.start_date },
          exitDate: { current: localExitDate?.toISOString().split('T')[0], original: agentData?.exit_date },
          shiftPeriod: { current: localShiftPeriod, original: agentData?.shift_period },
          employmentStatus: { current: localEmploymentStatus, original: agentData?.employment_status }
        }
      })
    }
    
    return hasChanges
  }, [inputValues, originalValues, localAgentData, agentData, localGender, localBirthday, localStartDate, localExitDate, localShiftPeriod, localEmploymentStatus])

  // Auto-save function that can be called before closing
  const autoSaveBeforeClose = async (): Promise<boolean> => {
    if (!localAgentData || !hasUnsavedChanges) {
      console.log('🔄 No changes to save, closing directly')
      return true // No need to save, can close
    }

    try {
      console.log('🔄 Auto-saving changes before closing...')
      console.log('🔄 Current state:', {
        localAgentData: localAgentData?.user_id,
        hasUnsavedChanges,
        inputValues,
        originalValues,
        localGender,
        localBirthday: localBirthday?.toISOString().split('T')[0],
        localStartDate: localStartDate?.toISOString().split('T')[0],
        localExitDate: localExitDate?.toISOString().split('T')[0],
        localShiftPeriod,
        localEmploymentStatus
      })
      
      setIsSaving(true)
      
      // Prepare all updates in one object
      const allUpdates: Record<string, any> = {}
      
      // Add input field changes
      Object.keys(inputValues).forEach(fieldName => {
        const currentValue = inputValues[fieldName]
        const originalValue = originalValues[fieldName]
        if (currentValue !== originalValue) {
          allUpdates[fieldName] = currentValue || null
          console.log(`🔄 Field change detected: ${fieldName}`, { current: currentValue, original: originalValue })
        }
      })
      
      // Add other field changes
      if (localGender !== agentData?.gender) {
        allUpdates.gender = localGender
        console.log(`🔄 Gender change detected:`, { current: localGender, original: agentData?.gender })
      }
      if (localBirthday) {
        const birthdayStr = `${localBirthday.getFullYear()}-${String(localBirthday.getMonth() + 1).padStart(2, '0')}-${String(localBirthday.getDate()).padStart(2, '0')}`
        if (birthdayStr !== agentData?.birthday) {
          allUpdates.birthday = birthdayStr
          console.log(`🔄 Birthday change detected:`, { current: birthdayStr, original: agentData?.birthday })
        }
      }
      if (localStartDate) {
        const startDateStr = `${localStartDate.getFullYear()}-${String(localStartDate.getMonth() + 1).padStart(2, '0')}-${String(localStartDate.getDate()).padStart(2, '0')}`
        if (startDateStr !== agentData?.start_date) {
          allUpdates.start_date = startDateStr
          console.log(`🔄 Start date change detected:`, { current: startDateStr, original: agentData?.start_date })
        }
      }
      if (localExitDate) {
        const exitDateStr = `${localExitDate.getFullYear()}-${String(localExitDate.getMonth() + 1).padStart(2, '0')}-${String(localExitDate.getDate()).padStart(2, '0')}`
        if (exitDateStr !== agentData?.exit_date) {
          allUpdates.exit_date = exitDateStr
          console.log(`🔄 Exit date change detected:`, { current: exitDateStr, original: agentData?.exit_date })
        }
      }
      if (localShiftPeriod !== agentData?.shift_period) {
        allUpdates.shift_period = localShiftPeriod
        console.log(`🔄 Shift period change detected:`, { current: localShiftPeriod, original: agentData?.shift_period })
      }
      if (localEmploymentStatus !== agentData?.employment_status) {
        allUpdates.employment_status = localEmploymentStatus
        console.log(`🔄 Employment status change detected:`, { current: localEmploymentStatus, original: agentData?.employment_status })
      }
      
      // Check for shift time changes
      const originalShiftTimes = parseShiftTime(agentData?.shift_time || null)
      if (localStartTime !== originalShiftTimes.startTime || localEndTime !== originalShiftTimes.endTime) {
        allUpdates.shift_time = combineShiftTime(localStartTime, localEndTime)
        console.log(`🔄 Shift time change detected:`, { 
          current: { startTime: localStartTime, endTime: localEndTime, combined: combineShiftTime(localStartTime, localEndTime) }, 
          original: { startTime: originalShiftTimes.startTime, endTime: originalShiftTimes.endTime, combined: agentData?.shift_time }
        })
      }
      
      console.log('🔄 All updates to send:', allUpdates)
      
      // Send all updates to the consolidated endpoint
      if (Object.keys(allUpdates).length > 0) {
        console.log('🔄 Sending update request to:', `/api/agents/${localAgentData.user_id}/update/`)
        
        const response = await fetch(`/api/agents/${localAgentData.user_id}/update/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(allUpdates)
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Update failed:', response.status, errorText)
          throw new Error(`Failed to update agent: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('✅ Agent updated successfully:', result)
        
        // Update original values after successful save
        const changedInputFields = Object.keys(inputValues).filter(fieldName => {
          const currentValue = inputValues[fieldName]
          const originalValue = originalValues[fieldName]
          return currentValue !== originalValue
        })
        
        if (changedInputFields.length > 0) {
          setOriginalValues(prev => {
            const updated = { ...prev }
            changedInputFields.forEach(fieldName => {
              updated[fieldName] = inputValues[fieldName]
            })
            return updated
          })
        }
      } else {
        console.log('🔄 No updates to send')
      }
      
      return true
    } catch (error) {
      console.error(`❌ Auto-save failed:`, error)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Modified close handler with auto-save
  const handleClose = async () => {
    console.log('🔒 handleClose called:', { 
      agent: localAgentData?.user_id, 
      hasUnsavedChanges, 
      isOpen,
      localAgentData: !!localAgentData
    })
    
    if (localAgentData && hasUnsavedChanges) {
      // Auto-save changes before closing
      try {
        console.log('🔄 Auto-saving changes before close...')
        const saveSuccess = await autoSaveBeforeClose()
        
        if (saveSuccess) {
          console.log('✅ Changes saved successfully, closing modal')
          onClose() // Call the original onClose prop
        } else {
          // Don't close if save failed
          console.error('❌ Failed to save changes')
          alert('Failed to save changes. Please try again.')
          return
        }
      } catch (error) {
        // Don't close if save failed
        console.error('❌ Failed to save changes:', error)
        alert('Failed to save changes. Please try again.')
        return
      }
    } else {
      // No unsaved changes, just close
      console.log('🔒 Closing without auto-save - no changes detected')
      console.log('🔒 Debug info:', {
        hasLocalAgent: !!localAgentData,
        hasUnsavedChanges,
        inputValues,
        originalValues
      })
      onClose() // Call the original onClose prop
    }
  }

  // Helper functions to manage company selection panel
  const openCompanySelection = () => {
    setShowCompanySelection(true)
    console.log('🔍 Company selection opened:', true)
  }

  const closeCompanySelection = () => {
    setShowCompanySelection(false)
    console.log('📝 Company selection closed')
  }

  // Fetch companies from members table
  const fetchCompanies = async (searchTerm: string = "", page: number = 1) => {
    try {
      setIsLoadingCompanies(true)
      console.log('🔍 Fetching companies with search term:', searchTerm)
      
      const params = new URLSearchParams({
        page: String(page),
        limit: '1000', // Get all companies for selection
        search: searchTerm,
        sortField: 'company',
        sortDirection: 'asc'
      })
      
      const url = `/api/members?${params.toString()}`
      console.log('🔍 API URL:', url)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch companies')
      }
      
      const data = await response.json()
      console.log('🔍 API response:', data)
      console.log('🔍 Companies found:', data.members?.length || 0)
      
      setCompanies(data.members || [])
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  // Handle company selection
  const handleCompanySelect = async (companyId: number, companyName: string, badgeColor: string | null) => {
    try {
      if (!agentData?.user_id) {
        console.error('No agent user_id available')
        return
      }

      console.log('🔄 Assigning agent to company:', { companyId, companyName, badgeColor })
      
      // API call to update agent's member_id in database
      const response = await fetch(`/api/agents/${agentData.user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: companyId
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update agent company: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Agent company updated successfully:', result)

      // Update local state to reflect the change
      if (localAgentData) {
        // Update the local agent data with new company info
        const updatedAgentData = {
          ...localAgentData,
          member_id: companyId,
          member_company: companyName,
          member_badge_color: badgeColor
        }
        
        // Update local state so UI reflects the change immediately
        setLocalAgentData(updatedAgentData)
        console.log('🔄 Local agent data updated with new company:', updatedAgentData)
      }

      // Reset shift period and employment status when company changes
      setLocalShiftPeriod(null)
      setLocalEmploymentStatus(null)
      
      // Close company selection
      closeCompanySelection()
      
    } catch (error) {
      console.error('❌ Failed to update agent company:', error)
      // You could add a toast notification here for user feedback
    }
  }

  // Real-time updates for all agent changes
  console.log('🔄 Initializing real-time hook for agents modal (all changes)')
  const { isConnected: isRealtimeConnected } = useRealtimeMembers({
    onAgentMemberChanged: async (updatedAgent, oldAgent, notificationData) => {
      console.log('🔄 Real-time: Agent member assignment change received in modal:', { 
        updatedAgent, 
        oldAgent, 
        currentAgentId: localAgentData?.user_id,
        modalIsOpen: isOpen,
        hasLocalAgent: !!localAgentData
      })
      
      // Only process updates for the current agent
      if (localAgentData && updatedAgent.user_id === localAgentData.user_id) {
        console.log('🔄 Real-time: Processing member assignment change for current agent:', updatedAgent)
        
        // Update the member_id immediately
        setLocalAgentData(prevAgent => {
          if (!prevAgent) return prevAgent
          
          return {
            ...prevAgent,
            member_id: updatedAgent.member_id
          }
        })
        
        // If member_id changed, fetch the updated company information
        if (updatedAgent.member_id !== oldAgent?.member_id) {
          try {
            console.log('🔄 Fetching updated company information for member_id:', updatedAgent.member_id)
            const response = await fetch(`/api/agents/${updatedAgent.user_id}`)
            if (response.ok) {
              const responseData = await response.json()
              const freshAgentData = responseData.agent // Extract agent from response
              console.log('🔄 Fetched fresh agent data with company info:', freshAgentData)
              console.log('🔄 Company info from API:', {
                member_id: freshAgentData.member_id,
                member_company: freshAgentData.member_company,
                member_badge_color: freshAgentData.member_badge_color
              })
              
              // Update local agent data with fresh company information
              setLocalAgentData(prevAgent => {
                if (!prevAgent) return prevAgent
                
                const updatedAgent = {
                  ...prevAgent,
                  member_id: freshAgentData.member_id,
                  member_company: freshAgentData.member_company,
                  member_badge_color: freshAgentData.member_badge_color
                }
                
                console.log('🔄 Updated localAgentData with company info:', {
                  member_id: updatedAgent.member_id,
                  member_company: updatedAgent.member_company,
                  member_badge_color: updatedAgent.member_badge_color
                })
                
                return updatedAgent
              })
            }
          } catch (error) {
            console.error('❌ Failed to fetch updated agent data:', error)
          }
        }
        
        console.log('🔄 Updated agent member assignment in real-time')

      } else {
        console.log('🔄 Real-time: Update not for current agent, skipping')
      }
    },
    onPersonalInfoChanged: async (personalInfo, oldPersonalInfo, notificationData) => {
      console.log('🔄 Real-time: Personal info change received in modal:', { 
        personalInfo, 
        oldPersonalInfo, 
        currentAgentId: localAgentData?.user_id,
        modalIsOpen: isOpen,
        hasLocalAgent: !!localAgentData
      })
      
      // Only process updates for the current agent
      if (localAgentData && personalInfo.user_id === localAgentData.user_id) {
        console.log('🔄 Real-time: Processing personal info change for current agent:', personalInfo)
        
        // Update local agent data with new personal info
        setLocalAgentData(prevAgent => {
          if (!prevAgent) return prevAgent
          
          return {
            ...prevAgent,
            first_name: personalInfo.first_name,
            middle_name: personalInfo.middle_name,
            last_name: personalInfo.last_name,
            nickname: personalInfo.nickname,
            phone: personalInfo.phone,
            address: personalInfo.address,
            city: personalInfo.city,
            gender: personalInfo.gender,
            birthday: personalInfo.birthday
          }
        })
        
        // Update input values if they haven't been changed locally
        setInputValues(prev => ({
          ...prev,
          first_name: personalInfo.first_name || '',
          middle_name: personalInfo.middle_name || '',
          last_name: personalInfo.last_name || '',
          nickname: personalInfo.nickname || '',
          phone: personalInfo.phone || '',
          address: personalInfo.address || '',
          city: personalInfo.city || ''
        }))
        
        // Update local state for fields that have their own state
        if (personalInfo.gender !== oldPersonalInfo?.gender) {
          setLocalGender(personalInfo.gender)
        }
        if (personalInfo.birthday !== oldPersonalInfo?.birthday) {
          if (personalInfo.birthday) {
            const [year, month, day] = personalInfo.birthday.split('-').map(Number)
            setLocalBirthday(new Date(year, month - 1, day))
          } else {
            setLocalBirthday(undefined)
          }
        }
        
        console.log('🔄 Updated agent personal info in real-time')
      } else {
        console.log('🔄 Real-time: Personal info update not for current agent, skipping')
      }
    },
    onJobInfoChanged: async (jobInfo, oldJobInfo, notificationData) => {
      console.log('🔄 Real-time: Job info change received in modal:', { 
        jobInfo, 
        oldJobInfo, 
        currentAgentId: localAgentData?.user_id,
        modalIsOpen: isOpen,
        hasLocalAgent: !!localAgentData
      })
      
      // Only process updates for the current agent
      if (localAgentData && jobInfo.user_id === localAgentData.user_id) {
        console.log('🔄 Real-time: Processing job info change for current agent:', jobInfo)
        
        // Update local agent data with new job info
        setLocalAgentData(prevAgent => {
          if (!prevAgent) return prevAgent
          
          return {
            ...prevAgent,
            employee_id: jobInfo.employee_id,
            job_title: jobInfo.job_title,
            shift_period: jobInfo.shift_period,
            shift_schedule: jobInfo.shift_schedule,
            shift_time: jobInfo.shift_time,
            work_setup: jobInfo.work_setup,
            employment_status: jobInfo.employment_status,
            hire_type: jobInfo.hire_type,
            staff_source: jobInfo.staff_source,
            start_date: jobInfo.start_date,
            exit_date: jobInfo.exit_date,
            work_email: jobInfo.work_email
          }
        })
        
        // Update input values if they haven't been changed locally
        setInputValues(prev => ({
          ...prev,
          employee_id: jobInfo.employee_id || '',
          job_title: jobInfo.job_title || '',
          shift_schedule: jobInfo.shift_schedule || '',
          work_setup: jobInfo.work_setup || '',
          hire_type: jobInfo.hire_type || '',
          staff_source: jobInfo.staff_source || ''
        }))
        
        // Update shift times if they changed
        if (jobInfo.shift_time !== oldJobInfo?.shift_time) {
          const { startTime, endTime } = parseShiftTime(jobInfo.shift_time)
          setLocalStartTime(startTime)
          setLocalEndTime(endTime)
        }
        
        // Update local state for fields that have their own state
        if (jobInfo.shift_period !== oldJobInfo?.shift_period) {
          setLocalShiftPeriod(jobInfo.shift_period)
        }
        if (jobInfo.employment_status !== oldJobInfo?.employment_status) {
          setLocalEmploymentStatus(jobInfo.employment_status)
        }
        if (jobInfo.start_date !== oldJobInfo?.start_date) {
          if (jobInfo.start_date) {
            const [year, month, day] = jobInfo.start_date.split('-').map(Number)
            setLocalStartDate(new Date(year, month - 1, day))
          } else {
            setLocalStartDate(undefined)
          }
        }
        if (jobInfo.exit_date !== oldJobInfo?.exit_date) {
          if (jobInfo.exit_date) {
            const [year, month, day] = jobInfo.exit_date.split('-').map(Number)
            setLocalExitDate(new Date(year, month - 1, day))
          } else {
            setLocalExitDate(undefined)
          }
        }
        
        console.log('🔄 Updated agent job info in real-time')
      } else {
        console.log('🔄 Real-time: Job info update not for current agent, skipping')
      }
    }
  })

  // Handle input changes for editable fields
  const handleInputChange = (fieldName: string, value: string) => {
    console.log(`🔄 Input change for ${fieldName}:`, value)
    
    // For phone and employee_id fields, only allow numbers
    if (fieldName === 'phone' || fieldName === 'employee_id') {
      // Remove all non-numeric characters
      const numericValue = value.replace(/[^0-9]/g, '')
      setInputValues(prev => ({ ...prev, [fieldName]: numericValue }))
    } else {
      // For other fields, allow any input
      setInputValues(prev => ({ ...prev, [fieldName]: value }))
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !agentData?.user_id || isSubmittingComment) return

    setIsSubmittingComment(true)

    // Create the comment object
    const newComment = {
      id: Date.now().toString(),
      comment: comment.trim(),
      user_name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Unknown User',
      created_at: new Date().toISOString()
    }

    // Add to local state immediately for responsive UI
    setCommentsList((prev) => [newComment, ...prev])
    setComment("")

    // Save comment to database (you'll need to implement this API endpoint)
    try {
      const response = await fetch(`/api/agents/${agentData.user_id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: newComment.comment,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save comment')
      }

      console.log('✅ Comment saved successfully')
    } catch (error) {
      console.error('❌ Failed to save comment:', error)
      // Remove from local state if save failed
      setCommentsList((prev) => prev.filter(c => c.id !== newComment.id))
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
              <DialogContent
          className="max-w-7xl max-h-[95vh] overflow-hidden p-0 rounded-xl"
          style={{ backgroundColor: theme === 'dark' ? '#111111' : '#f8f9fa' }}
        >
        <DialogTitle className="sr-only">Agent Details</DialogTitle>
        <div className="flex h-[95vh]">
          {/* Left Panel - Form */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
              <div className="flex items-center gap-3">
                <Badge className="text-xs h-6 flex items-center rounded-[6px]">
                  Agent
                </Badge>
                {/* Removed loader - skeleton loading in Personal Info and Job Info provides better feedback */}
              </div>
            </div>

            {/* Agent Header */}
            <div className="px-6 py-5">
              {/* Avatar and Agent Name */}
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={agentData?.profile_picture || "/avatars/shadcn.svg"} alt="Agent Avatar" />
                  <AvatarFallback className="text-2xl">
                    {displayData.first_name[0]}{displayData.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-2xl font-semibold mb-2">
                    {displayData.first_name} {displayData.last_name}
                  </div>
                </div>
              </div>
              
              {/* Agent Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Member */}
                <div className="flex items-center gap-2">
                  <IconBuilding className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Member:</span>
                  {displayData.member_company ? (
                    <Badge
                      variant="outline"
                      className="border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={openCompanySelection}
                      style={{
                        backgroundColor: withAlpha(displayData.member_badge_color || '#999999', 0.2),
                        borderColor: withAlpha(displayData.member_badge_color || '#999999', 0.4),
                        color: theme === 'dark' ? '#ffffff' : (displayData.member_badge_color || '#6B7280'),
                      }}
                    >
                      <span className="truncate inline-block max-w-[16rem] align-bottom">{displayData.member_company}</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20 px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center border-dashed"
                      onClick={openCompanySelection}
                    >
                      Select Company
                    </Badge>
                  )}
                </div>

                {/* Department */}
                <div className="flex items-center gap-2">
                  <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{displayData.department}</span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status:</span>
                  <Badge 
                    variant="outline" 
                    className={`px-3 py-1 font-medium ${
                      displayData.status === 'Active' 
                        ? 'text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20' 
                        : 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20'
                    }`}
                  >
                    {displayData.status}
                  </Badge>
                </div>
              </div>
            </div>
            


            {/* Scrollable Form Content */}
            <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                <div className="mb-6 flex-shrink-0">
                  <div className={`rounded-xl p-1 w-fit ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-gray-100/80 border border-gray-200'
                  }`}>
                    <div className="flex gap-1 relative">
                      {[
                        { title: "Personal Info", value: "information" },
                        { title: "Job Info", value: "job-info" },
                        { title: "Activity Data", value: "activity-data" },
                        { title: "Leaderboard", value: "leaderboard" }
                      ].map((tab, idx) => (
                        <button
                          key={tab.value}
                          onClick={() => setActiveTab(tab.value)}
                          className="relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 text-black dark:text-white hover:text-foreground"
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          {activeTab === tab.value && (
                            <motion.div
                              layoutId="modalClickedButton"
                              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                              className="absolute inset-0 bg-primary/10 rounded-lg"
                            />
                          )}
                          <span className="relative block text-black dark:text-white flex items-center justify-center gap-2">
                            {tab.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                 {/* Information Tab */}
                 <TabsContent value="information" className="space-y-6">
                   <div>
                     <div className="flex items-center justify-between min-h-[40px]">
                       <h3 className="text-lg font-medium text-muted-foreground">Personal Information</h3>
                     </div>
                     <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                       {isLoadingAdditionalData ? (
                         <div className="space-y-0">
                           {/* Show skeleton only for missing fields, real data for existing fields */}
                                              {/* First Name */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="First Name"
                         fieldName="first_name"
                         value={inputValues.first_name}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Middle Name */}
                           {!inputValues.middle_name || inputValues.middle_name.trim() === '' ? (
                             <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden border-b border-[#cecece99] dark:border-border">
                               <div className="flex items-center gap-3 min-w-0 px-4">
                                 <IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                 <span className="text-sm text-foreground">Middle Name</span>
                               </div>
                               <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                               <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                                 <Skeleton className="h-3 w-16" />
                               </div>
                             </div>
                           ) : (
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Middle Name"
                         fieldName="middle_name"
                         value={inputValues.middle_name}
                         onSave={handleInputChange}
                         placeholder="-"
                       />
                           )}

                       {/* Last Name */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Last Name"
                         fieldName="last_name"
                         value={inputValues.last_name}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Nickname */}
                           {!inputValues.nickname || inputValues.nickname.trim() === '' ? (
                             <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden border-b border-[#cecece99] dark:border-border">
                               <div className="flex items-center gap-3 min-w-0 px-4">
                                 <IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                 <span className="text-sm text-foreground">Nickname</span>
                               </div>
                               <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                               <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                                 <Skeleton className="h-3 w-16" />
                               </div>
                             </div>
                           ) : (
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Nickname"
                         fieldName="nickname"
                         value={inputValues.nickname}
                         onSave={handleInputChange}
                         placeholder="-"
                       />
                           )}

                           {/* Email */}
                       <DataFieldRow
                         icon={<IconMail className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Email"
                         fieldName="email"
                             value={inputValues.email}
                             onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Phone */}
                       <DataFieldRow
                         icon={<IconPhone className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Phone"
                         fieldName="phone"
                         value={inputValues.phone}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Birthday */}
                           {!displayData.birthday || displayData.birthday.trim() === '' ? (
                             <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden border-b border-[#cecece99] dark:border-border">
                               <div className="flex items-center gap-3 min-w-0 px-4">
                                 <IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                 <span className="text-sm text-foreground">Birthday</span>
                               </div>
                               <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                               <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                                 <Skeleton className="h-3 w-16" />
                               </div>
                             </div>
                           ) : (
                       <DataFieldRow
                         icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Birthday"
                         fieldName="birthday"
                         value={displayData.birthday}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="outline"
                                 className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                   localBirthday ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                               >
                                 {localBirthday ? localBirthday.toLocaleDateString() : "-"}
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Calendar
                                 mode="single"
                                 selected={localBirthday}
                                 onSelect={(date) => {
                                   setLocalBirthday(date)
                                   console.log('Birthday changed to:', date)
                                 }}
                                 captionLayout="dropdown"
                               />
                             </PopoverContent>
                           </Popover>
                         }
                       />
                           )}
                           
                           {/* City */}
                           {!inputValues.city || inputValues.city.trim() === '' ? (
                             <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden border-b border-[#cecece99] dark:border-border">
                               <div className="flex items-center gap-3 min-w-0 px-4">
                                 <IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                 <span className="text-sm text-foreground">City</span>
                               </div>
                               <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                               <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                                 <Skeleton className="h-3 w-16" />
                               </div>
                             </div>
                           ) : (
                             <DataFieldRow
                               icon={<IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                               label="City"
                               fieldName="city"
                               value={inputValues.city}
                               onSave={handleInputChange}
                               placeholder="-"
                             />
                           )}
                           
                           {/* Address */}
                           {!inputValues.address || inputValues.address.trim() === '' ? (
                             <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden border-b border-[#cecece99] dark:border-border">
                               <div className="flex items-center gap-3 min-w-0 px-4">
                                 <IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                 <span className="text-sm text-foreground">Address</span>
                               </div>
                               <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                               <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                                 <Skeleton className="h-3 w-16" />
                               </div>
                             </div>
                           ) : (
                             <DataFieldRow
                               icon={<IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                               label="Address"
                               fieldName="address"
                               value={inputValues.address}
                               onSave={handleInputChange}
                               placeholder="-"
                             />
                           )}

                       {/* Gender */}
                           {!displayData.gender || displayData.gender.trim() === '' ? (
                             <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden">
                               <div className="flex items-center gap-3 min-w-0 px-4">
                                 <IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                 <span className="text-sm text-foreground">Gender</span>
                               </div>
                               <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                               <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                                 <Skeleton className="h-3 w-16" />
                               </div>
                             </div>
                           ) : (
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Gender"
                         fieldName="gender"
                         value={displayData.gender}
                         onSave={() => {}}
                         placeholder="-"
                               isLast={true}
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                                                               <div 
                                  className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                    displayData.gender ? 'text-foreground' : 'text-muted-foreground'
                                  }`}
                                  style={{ backgroundColor: 'transparent' }}
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                    }
                                  }}
                                >
                                  <span className="text-sm">
                                    {(() => {
                                      const genderOption = [
                                        { value: 'Male', label: 'Male' },
                                        { value: 'Female', label: 'Female' },
                                        { value: 'Other', label: 'Other' },
                                        { value: 'Prefer not to say', label: 'Prefer Not To Say' }
                                      ].find(option => option.value === displayData.gender);
                                      return genderOption ? genderOption.label : (displayData.gender || '-');
                                    })()}
                                  </span>
                                </div>
                             </PopoverTrigger>
                             <PopoverContent className="w-48 p-2" align="start" side="bottom" sideOffset={4}>
                               {[
                                   { value: 'Male', label: 'Male', icon: <IconGenderMale className="h-4 w-4 text-muted-foreground" /> },
                                   { value: 'Female', label: 'Female', icon: <IconGenderFemale className="h-4 w-4 text-muted-foreground" /> },
                                   { value: 'Other', label: 'Other', icon: <IconUser className="h-4 w-4 text-muted-foreground" /> },
                                   { value: 'Prefer not to say', label: 'Prefer Not To Say', icon: <IconMinus className="h-4 w-4 text-muted-foreground" /> }
                                 ].map((genderOption) => {
                                   const isCurrentGender = displayData.gender === genderOption.value;
                                   return (
                                     <PopoverItem
                                       key={genderOption.value}
                                       isSelected={isCurrentGender}
                                                                        onClick={() => {
                                   // Update the gender value
                                   if (displayData.gender !== genderOption.value) {
                                     setLocalGender(genderOption.value)
                                     console.log('Gender changed to:', genderOption.value)
                                   }
                                 }}
                                     >
                                             <div className="flex items-center gap-2">
                                               {genderOption.icon}
                                               <span className="text-sm">{genderOption.label}</span>
                                             </div>
                                     </PopoverItem>
                                         )
                                 })}
                             </PopoverContent>
                           </Popover>
                         }
                             />
                           )}
                         </div>
                       ) : (
                         <>
                           {/* First Name */}
                           <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="First Name"
                         fieldName="first_name"
                         value={inputValues.first_name}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Middle Name */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Middle Name"
                         fieldName="middle_name"
                         value={inputValues.middle_name}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Last Name */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Last Name"
                         fieldName="last_name"
                         value={inputValues.last_name}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Nickname */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Nickname"
                         fieldName="nickname"
                         value={inputValues.nickname}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Contact Information */}
                       <DataFieldRow
                         icon={<IconMail className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Email"
                         fieldName="email"
                         value={displayData.email}
                         onSave={() => {}}
                         placeholder="-"
                         readOnly={true}
                       />

                       {/* Phone */}
                       <DataFieldRow
                         icon={<IconPhone className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Phone"
                         fieldName="phone"
                         value={inputValues.phone}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Birthday */}
                       <DataFieldRow
                         icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Birthday"
                         fieldName="birthday"
                         value={displayData.birthday}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="outline"
                                 className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                   localBirthday ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                               >
                                 {localBirthday ? localBirthday.toLocaleDateString() : "-"}
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Calendar
                                 mode="single"
                                 selected={localBirthday}
                                 onSelect={(date) => {
                                   setLocalBirthday(date)
                                   console.log('Birthday changed to:', date)
                                 }}
                                 captionLayout="dropdown"
                               />
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* City */}
                       <DataFieldRow
                         icon={<IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="City"
                         fieldName="city"
                         value={inputValues.city}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Address */}
                       <DataFieldRow
                         icon={<IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Address"
                         fieldName="address"
                         value={inputValues.address}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Gender */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Gender"
                         fieldName="gender"
                         value={displayData.gender}
                         onSave={() => {}}
                         placeholder="-"
                         isLast={true}
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                                                               <div 
                                  className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                    displayData.gender ? 'text-foreground' : 'text-muted-foreground'
                                  }`}
                                  style={{ backgroundColor: 'transparent' }}
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                    }
                                  }}
                                >
                                  <span className="text-sm">
                                    {(() => {
                                      const genderOption = [
                                        { value: 'Male', label: 'Male' },
                                        { value: 'Female', label: 'Female' },
                                        { value: 'Other', label: 'Other' },
                                        { value: 'Prefer not to say', label: 'Prefer Not To Say' }
                                      ].find(option => option.value === displayData.gender);
                                      return genderOption ? genderOption.label : (displayData.gender || '-');
                                    })()}
                                  </span>
                                </div>
                             </PopoverTrigger>
                             <PopoverContent className="w-48 p-2" align="start" side="bottom" sideOffset={4}>
                               {[
                                   { value: 'Male', label: 'Male', icon: <IconGenderMale className="h-4 w-4 text-muted-foreground" /> },
                                   { value: 'Female', label: 'Female', icon: <IconGenderFemale className="h-4 w-4 text-muted-foreground" /> },
                                   { value: 'Other', label: 'Other', icon: <IconUser className="h-4 w-4 text-muted-foreground" /> },
                                   { value: 'Prefer not to say', label: 'Prefer Not To Say', icon: <IconMinus className="h-4 w-4 text-muted-foreground" /> }
                                 ].map((genderOption) => {
                                   const isCurrentGender = displayData.gender === genderOption.value;
                                   return (
                                     <PopoverItem
                                       key={genderOption.value}
                                       isSelected={isCurrentGender}
                                                                        onClick={() => {
                                   // Update the gender value
                                   if (displayData.gender !== genderOption.value) {
                                     setLocalGender(genderOption.value)
                                     console.log('Gender changed to:', genderOption.value)
                                   }
                                 }}
                                     >
                                       <span className="text-sm">{genderOption.icon}</span>
                                       <span className="text-sm font-medium">{genderOption.label || genderOption.value}</span>
                                     </PopoverItem>
                                   );
                                 })}
                             </PopoverContent>
                           </Popover>
                         }
                       />
                         </>
                       )}
                     </div>
                   </div>
                 </TabsContent>

                                 {/* Job Info Tab */}
                 <TabsContent value="job-info" className="space-y-6 overflow-y-auto flex-1 min-h-0">
                   <div>
                     <div className="flex items-center justify-between min-h-[40px]">
                       <h3 className="text-lg font-medium text-muted-foreground">Job Information</h3>
                     </div>
                     <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                       {isLoadingAdditionalData ? (
                         <div className="space-y-0">
                           {/* Show skeleton only for missing fields, real data for existing fields */}
                           {/* Job Info skeleton fields - showing real icons/labels, skeleton only for missing data */}
                           
                           {/* Employee ID */}
                           <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden border-b border-[#cecece99] dark:border-border">
                             <div className="flex items-center gap-3 min-w-0 px-4">
                               <IconId className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                               <span className="text-sm text-foreground">Employee ID</span>
                             </div>
                             <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                             <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                               <Skeleton className="h-3 w-16" />
                             </div>
                           </div>
                           
                           {/* Job Title */}
                           <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden border-b border-[#cecece99] dark:border-border">
                             <div className="flex items-center gap-3 min-w-0 px-4">
                               <IconBriefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                               <span className="text-sm text-foreground">Job Title</span>
                             </div>
                             <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                             <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                               <Skeleton className="h-3 w-16" />
                             </div>
                           </div>
                           
                           {/* Work Email */}
                           <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden border-b border-[#cecece99] dark:border-border">
                             <div className="flex items-center gap-3 min-w-0 px-4">
                               <IconMail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                               <span className="text-sm text-foreground">Work Email</span>
                             </div>
                             <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                             <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                               <Skeleton className="h-3 w-16" />
                             </div>
                           </div>
                           
                           {/* Shift Period */}
                           <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden border-b border-[#cecece99] dark:border-border">
                             <div className="flex items-center gap-3 min-w-0 px-4">
                               <IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                               <span className="text-sm text-foreground">Shift Period</span>
                             </div>
                             <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                             <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                               <Skeleton className="h-3 w-16" />
                             </div>
                           </div>
                           
                           {/* Employment Status */}
                           <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden border-b border-[#cecece99] dark:border-border">
                             <div className="flex items-center gap-3 min-w-0 px-4">
                               <IconBuilding className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                               <span className="text-sm text-foreground">Employment Status</span>
                             </div>
                             <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                             <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                               <Skeleton className="h-3 w-16" />
                             </div>
                           </div>
                           
                           {/* Start Date */}
                           <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden border-b border-[#cecece99] dark:border-border">
                             <div className="flex items-center gap-3 min-w-0 px-4">
                               <IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                               <span className="text-sm text-foreground">Start Date</span>
                             </div>
                             <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                             <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                               <Skeleton className="h-3 w-16" />
                             </div>
                           </div>
                           
                           {/* Exit Date */}
                           <div className="grid grid-cols-[180px_auto_1fr] h-[33px] items-center overflow-hidden">
                             <div className="flex items-center gap-3 min-w-0 px-4">
                               <IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                               <span className="text-sm text-foreground">Exit Date</span>
                             </div>
                             <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                             <div className="min-w-0 flex items-center pl-2 pr-2 h-full">
                               <Skeleton className="h-3 w-16" />
                             </div>
                           </div>
                         </div>
                       ) : (
                         <>
                       {/* Employee ID */}
                       <DataFieldRow
                         icon={<IconId className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Employee ID"
                         fieldName="employee_id"
                         value={inputValues.employee_id}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Job Title */}
                       <DataFieldRow
                         icon={<IconBriefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Job Title"
                         fieldName="job_title"
                         value={inputValues.job_title}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Work Email */}
                       <DataFieldRow
                         icon={<IconMail className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Work Email"
                         fieldName="work_email"
                         value={displayData.work_email}
                         onSave={() => {}}
                         placeholder="-"
                         readOnly={true}
                       />

                       {/* Shift Period */}
                       <DataFieldRow
                         icon={<IconClockHour4 className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Shift Period"
                         fieldName="shift_period"
                         value={displayData.shift_period}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <div 
                                 className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                   displayData.shift_period ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                                 style={{ backgroundColor: 'transparent' }}
                                 tabIndex={0}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' || e.key === ' ') {
                                     e.preventDefault()
                                   }
                                 }}
                               >
                                 {displayData.shift_period || '-'}
                               </div>
                             </PopoverTrigger>
                             <PopoverContent className="w-32 p-1" align="start" side="bottom" sideOffset={4}>
                               {[
                                 { value: 'Day', icon: <IconSun className="h-4 w-4 text-muted-foreground" /> },
                                 { value: 'Night', icon: <IconMoon className="h-4 w-4 text-muted-foreground" /> }
                               ].map((shiftOption) => (
                                   <PopoverItem
                                     key={shiftOption.value}
                                     isSelected={displayData.shift_period === shiftOption.value}
                                                                      onClick={() => {
                                   // Update the shift period value
                                   if (displayData.shift_period !== shiftOption.value) {
                                     setLocalShiftPeriod(shiftOption.value)
                                     console.log('Shift period changed to:', shiftOption.value)
                                   }
                                 }}
                                   >
                                     <span className="text-sm">{shiftOption.icon}</span>
                                     <span className="text-sm font-medium">{shiftOption.value}</span>
                                   </PopoverItem>
                                 ))}
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* Shift Schedule */}
                       <DataFieldRow
                         icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Shift Schedule"
                         fieldName="shift_schedule"
                         value={inputValues.shift_schedule}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Start Time */}
                       <DataFieldRow
                         icon={<IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Start Time"
                         fieldName="start_time"
                         value={localStartTime ? convertTo12Hour(localStartTime) : ''}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="outline"
                                 tabIndex={-1}
                                 className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                   localStartTime ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                                 onClick={() => {
                                   console.log('🔄 Start time popover opened, current value:', localStartTime)
                                 }}
                               >
                                 {localStartTime ? convertTo12Hour(localStartTime) : "-"}
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Input
                                 type="time"
                                 value={localStartTime || ''}
                                 onChange={(e) => {
                                   console.log('🔄 Start time changed:', e.target.value)
                                   setLocalStartTime(e.target.value)
                                 }}
                                 className="w-full"
                                 autoFocus
                                 placeholder=""
                               />
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* End Time */}
                       <DataFieldRow
                         icon={<IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="End Time"
                         fieldName="end_time"
                         value={localEndTime ? convertTo12Hour(localEndTime) : ''}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="outline"
                                 tabIndex={-1}
                                 className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                   localEndTime ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                                 onClick={() => {
                                   console.log('🔄 End time popover opened, current value:', localEndTime)
                                 }}
                               >
                                 {localEndTime ? convertTo12Hour(localEndTime) : "-"}
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Input
                                 type="time"
                                 value={localEndTime || ''}
                                 onChange={(e) => {
                                   console.log('🔄 End time changed:', e.target.value)
                                   setLocalEndTime(e.target.value)
                                 }}
                                 className="w-full"
                                 autoFocus
                                 placeholder=""
                               />
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* Work Setup */}
                       <DataFieldRow
                         icon={<IconBuilding className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Work Setup"
                         fieldName="work_setup"
                         value={inputValues.work_setup}
                         onSave={handleInputChange}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <div 
                                 className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                   inputValues.work_setup ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                                 style={{ backgroundColor: 'transparent' }}
                                 tabIndex={0}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' || e.key === ' ') {
                                     e.preventDefault()
                                   }
                                 }}
                               >
                                 {inputValues.work_setup || '-'}
                               </div>
                             </PopoverTrigger>
                             <PopoverContent className="w-48 p-1" align="start" side="bottom" sideOffset={4}>
                               {[
                                 { value: 'On-site', icon: <IconBuilding className="h-4 w-4 text-muted-foreground" /> },
                                 { value: 'Hybrid', icon: <IconDeviceLaptop className="h-4 w-4 text-muted-foreground" /> },
                                 { value: 'Work From Home', icon: <IconHome className="h-4 w-4 text-muted-foreground" /> }
                               ].map((setupOption) => (
                                   <PopoverItem
                                     key={setupOption.value}
                                     isSelected={inputValues.work_setup === setupOption.value}
                                                                      onClick={() => {
                                   // Update the work setup value
                                   if (inputValues.work_setup !== setupOption.value) {
                                     setInputValues(prev => ({ ...prev, work_setup: setupOption.value }))
                                     console.log('Work setup changed to:', setupOption.value)
                                   }
                                 }}
                                   >
                                     <span className="text-sm">{setupOption.icon}</span>
                                     <span className="text-sm font-medium">{setupOption.value}</span>
                                   </PopoverItem>
                                 ))}
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* Employment Status */}
                       <DataFieldRow
                         icon={<IconId className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Employment Status"
                         fieldName="employment_status"
                         value={displayData.employment_status}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <div 
                                 className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                   displayData.employment_status ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                                 style={{ backgroundColor: 'transparent' }}
                                 tabIndex={0}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' || e.key === ' ') {
                                     e.preventDefault()
                                   }
                                 }}
                               >
                                 {displayData.employment_status || '-'}
                               </div>
                             </PopoverTrigger>
                             <PopoverContent className="w-40 p-1" align="start" side="bottom" sideOffset={4}>
                               {[
                                 { value: 'Regular', icon: <IconCheck className="h-4 w-4 text-muted-foreground" /> },
                                 { value: 'Probationary', icon: <IconClock className="h-4 w-4 text-muted-foreground" /> }
                               ].map((statusOption) => (
                                   <PopoverItem
                                     key={statusOption.value}
                                     isSelected={displayData.employment_status === statusOption.value}
                                                                      onClick={() => {
                                   // Update the employment status value
                                   if (displayData.employment_status !== statusOption.value) {
                                     setLocalEmploymentStatus(statusOption.value)
                                     console.log('Employment status changed to:', statusOption.value)
                                   }
                                 }}
                                   >
                                     <span className="text-sm">{statusOption.icon}</span>
                                     <span className="text-sm font-medium">{statusOption.value}</span>
                                   </PopoverItem>
                                 ))}
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* Hire Type */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Hire Type"
                         fieldName="hire_type"
                         value={inputValues.hire_type}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Staff Source */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Staff Source"
                         fieldName="staff_source"
                         value={inputValues.staff_source}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Start Date */}
                       <DataFieldRow
                         icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Start Date"
                         fieldName="start_date"
                         value={displayData.start_date}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="outline"
                                 className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                   localStartDate ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                               >
                                 {localStartDate ? localStartDate.toLocaleDateString() : "-"}
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Calendar
                                 mode="single"
                                 selected={localStartDate}
                                 onSelect={(date) => {
                                   setLocalStartDate(date)
                                   console.log('Start date changed to:', date)
                                 }}
                                 captionLayout="dropdown"
                               />
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* Exit Date */}
                       <DataFieldRow
                         icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Exit Date"
                         fieldName="exit_date"
                         value={displayData.exit_date}
                         onSave={() => {}}
                         placeholder="-"
                         isLast={true}
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="outline"
                                 className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                   localExitDate ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                               >
                                 {localExitDate ? localExitDate.toLocaleDateString() : "-"}
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Calendar
                                 mode="single"
                                 selected={localExitDate}
                                 onSelect={(date) => {
                                   setLocalExitDate(date)
                                   console.log('Exit date changed to:', date)
                                 }}
                                 captionLayout="dropdown"
                               />
                             </PopoverContent>
                           </Popover>
                         }
                       />
                         </>
                       )}
                     </div>
                   </div>
                 </TabsContent>

                 {/* Activity Data Tab */}
                 <TabsContent value="activity-data" className="space-y-6 overflow-y-auto flex-1 min-h-0">
                   <div>
                     <div className="flex items-center justify-between min-h-[40px]">
                       <h3 className="text-lg font-medium text-muted-foreground">Activity Data</h3>
                     </div>
                     <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                       {!activityDataLoaded && !activityLoading ? (
                         <div className="p-6 text-center">
                           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                           <p className="text-sm text-muted-foreground">Loading activity data...</p>
                         </div>
                       ) : (
                       <AgentActivityData 
                         selectedEmployee={agentData ? {
                           id: agentData.user_id.toString(),
                           firstName: agentData.first_name || '',
                           lastName: agentData.last_name || '',
                           email: agentData.email,
                           phone: agentData.phone || '',
                           department: agentData.department_name || '',
                           position: agentData.job_title || '',
                           hireDate: agentData.start_date || '',
                           avatar: agentData.profile_picture || '',
                           departmentId: agentData.department_id || 0,
                           workEmail: agentData.email,
                           birthday: agentData.birthday || '',
                           city: agentData.city || '',
                           address: agentData.address || '',
                           gender: agentData.gender || '',
                           shift: agentData.shift_period || '',
                           user_id: agentData.user_id,
                           first_name: agentData.first_name || undefined,
                           last_name: agentData.last_name || undefined,
                           member_id: agentData.member_id || undefined,
                           member_company: agentData.member_company || undefined,
                           activity: getTodayActivityData({
                             user_id: agentData.user_id,
                             id: agentData.user_id.toString()
                           })
                         } : null}
                         formatTime={(seconds: number) => {
                           const hours = Math.floor(seconds / 3600)
                           const minutes = Math.floor((seconds % 3600) / 60)
                           return `${hours}h ${minutes}m`
                         }}
                         detailLoading={activityLoading}
                         getYesterdayActivityData={getYesterdayActivityData}
                         getWeekActivityData={getWeekActivityData}
                         getMonthActivityData={getMonthActivityData}
                         user={user}
                         chartDataCache={chartDataCache}
                         setChartDataCache={setChartDataCache}
                       />
                       )}
                     </div>
                   </div>
                 </TabsContent>

                 {/* Leaderboard Tab */}
                 <TabsContent value="leaderboard" className="space-y-6 overflow-y-auto flex-1 min-h-0">
                   <div>
                     <div className="flex items-center justify-between min-h-[40px]">
                       <div className="flex items-center gap-2">
                         <h3 className="text-lg font-medium text-muted-foreground">Leaderboard</h3>
                       </div>
                     </div>
                     <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                       {!productivityDataLoaded && !productivityLoading ? (
                         <div className="p-0">
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
                         <div className="p-0">
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
                         <div className="p-0">
                           {/* Current Month Section */}
                           {(() => {
                             if (!productivityScores || productivityScores.length === 0) {
                                 return (
                                   <div className="p-6">
                                     <div className="space-y-4">
                                       <NoData message="No Activity Data" />
                                     </div>
                                   </div>
                                 )
                             }
                             
                             const currentYear = new Date().getFullYear()
                             
                             // Always show the first item (which will be current month when viewing past years)
                             const currentMonthScore = productivityScores[0]
                             
                             return (
                               <div className="p-6 border-b border-[#cecece99] dark:border-border bg-gradient-to-r from-primary/5 to-primary/10">
                                 <div className="flex items-center justify-between">
                                   <span className="text-sm font-medium text-muted-foreground">Current</span>
                                 </div>
                                 <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-4">
                                     <div className="flex items-center gap-2">
                                       <span className={`text-lg font-bold ${
                                         currentMonthScore.rank === 1 ? 'text-yellow-500' :
                                         currentMonthScore.rank === 2 ? 'text-gray-500' :
                                         currentMonthScore.rank === 3 ? 'text-amber-600' :
                                         currentMonthScore.rank === 4 ? 'text-blue-500' :
                                         currentMonthScore.rank === 5 ? 'text-purple-500' :
                                         'text-muted-foreground'
                                       }`}>#{currentMonthScore.rank}</span>
                                     </div>
                                     <div>
                                       <h4 className="font-semibold text-lg flex items-center gap-2">
                                         {currentMonthScore.monthName}
                                         {currentMonthScore.rank === 1 && <IconCrown className="h-5 w-5 text-yellow-500" />}
                                         {currentMonthScore.rank === 2 && <IconMedal className="h-5 w-5 text-gray-500" />}
                                         {currentMonthScore.rank === 3 && <IconTrophy className="h-5 w-5 text-amber-600" />}
                                         {currentMonthScore.rank === 4 && <IconStar className="h-5 w-5 text-blue-500" />}
                                         {currentMonthScore.rank === 5 && <IconStar className="h-5 w-5 text-purple-500" />}
                                       </h4>
                                     </div>
                                   </div>
                                   <div className="text-right">
                                     <div className="flex items-center gap-6">
                                       <div className="text-center">
                                         <div className="text-lg font-bold text-primary">{currentMonthScore.productivity_score.toFixed(2)}</div>
                                         <div className="text-sm text-muted-foreground">Points</div>
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             )
                           })()}
                           
                           {/* Summary Section - Only show when there's data */}
                           {productivityScores && productivityScores.length > 0 && (
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
                             
                             {/* Monthly Score Section */}
                             <div className="mb-6">
                               <div className="flex items-center justify-between mb-4">
                                 <h4 className="font-semibold flex items-center gap-2">
                                   <IconTrophy className="h-5 w-5 text-primary" />
                                   Monthly Scores
                                 </h4>
                             </div>
                             
                             <div className="space-y-3">
                               {(() => {
                                 // Always exclude the first item (current month) from Previous Monthly Scores
                                 return productivityScores.slice(1).map((score: any, index: number) => (
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
                             
                             {/* Statistics Section */}
                             {(() => {
                               const hasData = productivityScores && productivityScores.length > 0
                               
                               const stats = hasData ? {
                                 totalMonths: productivityScores.length,
                                 averageScore: productivityScores.reduce((sum, score) => sum + score.productivity_score, 0) / productivityScores.length,
                                 bestScore: Math.max(...productivityScores.map(score => score.productivity_score)),
                                 worstScore: Math.min(...productivityScores.map(score => score.productivity_score)),
                                 totalActiveTime: productivityScores.reduce((sum, score) => sum + (score.total_active_seconds || 0), 0),
                                 bestRank: Math.min(...productivityScores.map(score => score.rank)),
                                 worstRank: Math.max(...productivityScores.map(score => score.rank))
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
                                 <div>
                                   <h4 className="font-semibold flex items-center gap-2 mb-4">
                                     <IconChartBar className="h-5 w-5 text-primary" />
                                     Statistics
                                   </h4>
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
                                             const bestRankMonth = productivityScores.find(score => score.rank === stats.bestRank)
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
                                                 <span className="text-sm">{bestRankMonth ? bestRankMonth.monthName : ""}</span>
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
                                             const worstRankMonth = productivityScores.find(score => score.rank === stats.worstRank)
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
                                                 <span className="text-sm">{worstRankMonth ? worstRankMonth.monthName : ""}</span>
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
                                 </div>
                               )
                             })()}
                           </div>
                           )}
                         </div>
                       )}
                     </div>
                   </div>
                 </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Panel - Activity & Comments */}
          <div className="w-96 flex flex-col border-l border-[#cecece99] dark:border-border h-full bg-[#ebebeb] dark:bg-[#0a0a0a]">
                          <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border flex-shrink-0">
                <h3 className="font-medium">
                  {showCompanySelection ? 'Select Companies' : 'Activity'}
                </h3>
              {!showCompanySelection && (
                <button
                  type="button"
                  onClick={openCompanySelection}
                  className="text-sm text-primary hover:text-primary/80 transition-all duration-300 cursor-pointer flex items-center gap-2 group"
                >


                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 bg-[#ebebeb] dark:bg-[#0a0a0a]">
              {showCompanySelection ? (
                /* Company Selection Content */
                <div className="flex flex-col h-full">
                  {/* Search Input */}
                  <div className="space-y-3 flex-shrink-0">
                    <div className="relative">
                      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search companies..."
                        value={companySearch}
                        onChange={(e) => {
                          console.log('🔍 Search input changed:', e.target.value)
                          setCompanySearch(e.target.value)
                        }}
                        className="pl-9"
                      />
                      {companySearch && (
                        <button
                          onClick={() => setCompanySearch('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <IconX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Companies List */}
                  <div 
                    className="space-y-3 flex-1 overflow-y-auto min-h-0 px-2 py-4"
                  >
                    {isLoadingCompanies ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, index) => (
                          <div key={index} className="flex items-center gap-3 p-4 border bg-muted/20 dark:bg-muted/30 border-border rounded-lg">
                            <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : companies.length > 0 ? (
                      (() => {
                        console.log('🔍 Rendering companies:', companies)
                        return companies.map((company) => (
                          <div
                            key={company.id}
                            onClick={() => handleCompanySelect(company.id, company.company, company.badge_color)}
                            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 ${
                              !company.badge_color ? 'bg-gray-50 dark:bg-gray-600/20 border-gray-300 dark:border-gray-600/20 text-gray-700 dark:text-gray-300' : ''
                            }`}
                            style={{
                              backgroundColor: company.badge_color ? `${company.badge_color}20` : undefined,
                              borderColor: company.badge_color ? `${company.badge_color}40` : undefined,
                              color: theme === 'dark' ? '#ffffff' : (company.badge_color || undefined)
                            }}
                          >
                            <span className="text-sm font-medium truncate">{company.company}</span>
                          </div>
                        ))
                      })()
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No Companies Found</p>
                      </div>
                    )}
                  </div>

                  {/* Done Button */}
                  <div className="flex-shrink-0">
                    <Button
                      onClick={closeCompanySelection}
                      className="w-full"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                /* Activity Content - Shows agent activity and recent changes */
                <div className="space-y-4">
                  {agentData?.user_id ? (
                    <MembersActivityLog 
                      memberId={agentData.user_id} 
                      companyName={agentData.first_name && agentData.last_name ? `${agentData.first_name} ${agentData.last_name}` : 'Unknown Agent'} 
                      onRefresh={() => {
                        // Real-time updates handle refresh automatically
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No Activities Found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comment Input Section - Outside main content */}
            {!showCompanySelection && (
              <div className="px-3 pb-3 bg-[#ebebeb] dark:bg-[#0a0a0a]">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <form onSubmit={handleCommentSubmit}>
                      <div className={`border rounded-lg bg-sidebar overflow-hidden transition-all duration-300 ease-in-out [&>*]:border-none [&>*]:outline-none [&>textarea]:transition-all [&>textarea]:duration-300 [&>textarea]:ease-in-out ${
                        isCommentFocused || comment.trim() 
                          ? 'border-muted-foreground' 
                          : 'border-border'
                      }`}>
                        <textarea 
                          placeholder="Write a comment..." 
                          value={comment}
                          onChange={(e) => {
                            setComment(e.target.value)
                            // Auto-resize the textarea
                            e.target.style.height = 'auto'
                            e.target.style.height = e.target.scrollHeight + 'px'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              if (comment.trim() && !isSubmittingComment) {
                                handleCommentSubmit(e)
                              }
                            }
                          }}
                          onFocus={(e) => {
                            setIsCommentFocused(true)
                          }}
                          onBlur={(e) => {
                            setIsCommentFocused(false)
                          }}
                          className="w-full resize-none border-0 bg-transparent text-foreground px-3 py-2 shadow-none text-sm focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 dark:text-foreground placeholder:text-muted-foreground align-middle transition-all duration-300 ease-in-out min-h-[36px] overflow-hidden"
                          disabled={isSubmittingComment}
                          rows={1}
                        />
                        
                        {/* Send button - only show when expanded, inside the textarea container */}
                        {(isCommentFocused || comment.trim()) && (
                          <div className="p-1 flex justify-end animate-in fade-in duration-300">
                            <button
                              type="submit"
                              onClick={handleCommentSubmit}
                              disabled={!comment.trim() || isSubmittingComment}
                              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              {isSubmittingComment ? (
                                <IconClock className="h-3 w-3 text-muted-foreground animate-spin" />
                              ) : (
                                <SendHorizontal className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
