"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useRealtimeBreaks, BreakSession as RealtimeBreakSession } from "@/hooks/use-realtime-breaks"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  UserIcon, 
  ClockIcon, 
  PlusIcon,
  CoffeeIcon,
  SunIcon,
  MoonIcon,
  MoreHorizontalIcon,
  EyeIcon,
  EditIcon,
  PlayIcon,
  PauseIcon,
  UtensilsIcon
} from "lucide-react"
import { IconArrowUp, IconArrowDown } from "@tabler/icons-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ReloadButton } from "@/components/ui/reload-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator, SelectGroup, SelectLabel } from "@/components/ui/select"

interface BreakSession {
  id: number
  agent_user_id: number
  break_type: 'Morning' | 'Lunch' | 'Afternoon' | 'NightFirst' | 'NightMeal' | 'NightSecond'
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  created_at: string
  pause_time: string | null
  resume_time: string | null
  pause_used: boolean
  time_remaining_at_pause: number | null
  break_date: string
  // Joined data
  first_name: string | null
  last_name: string | null
  profile_picture: string | null
  email: string | null
  department_name: string | null
}

interface Employee {
  user_id: number
  email: string
  user_type: string
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  nickname: string | null
  profile_picture: string | null
  phone: string | null
  address: string | null
  city: string | null
  gender: string | null
  birthday: string | null
  employee_id: string | null
  job_title: string | null
  work_email: string | null
  start_date: string | null
  exit_date: string | null
  shift_period: string | null
  shift_schedule: string | null
  shift_time: string | null
  work_setup: string | null
  employment_status: string | null
  hire_type: string | null
  staff_source: string | null
  member_id: number | null
  member_company: string | null
  member_badge_color: string | null
  department_id: number | null
  department_name: string | null
  station_id: string | null
}

export default function BreaksPage() {
  const { user } = useAuth()
  const [breakSessions, setBreakSessions] = useState<BreakSession[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    today: 0,
    averageDuration: 0,
    totalAgents: 0
  })

  // Calculate filtered stats based on member selection
  const getFilteredStats = () => {
    let filteredEmployees = employees
    let filteredBreakSessions = breakSessions
    
    if (memberId !== 'all') {
      if (memberId === 'none') {
        // Show only employees with no member assignment
        filteredEmployees = employees.filter(emp => !emp.member_id)
        filteredBreakSessions = breakSessions.filter(session => {
          const employee = employees.find(emp => emp.user_id === session.agent_user_id)
          return employee && !employee.member_id
        })
      } else {
        // Show only employees from the selected member company
        const selectedMemberId = parseInt(memberId)
        filteredEmployees = employees.filter(emp => emp.member_id === selectedMemberId)
        filteredBreakSessions = breakSessions.filter(session => {
          const employee = employees.find(emp => emp.user_id === session.agent_user_id)
          return employee && employee.member_id === selectedMemberId
        })
      }
    }
    
    const activeSessions = filteredBreakSessions.filter(session => !session.end_time)
    const totalDuration = filteredBreakSessions
      .filter(session => session.duration_minutes)
      .reduce((sum, session) => sum + (session.duration_minutes || 0), 0)
    const completedSessions = filteredBreakSessions.filter(session => session.end_time)
    
    return {
      total: filteredBreakSessions.length,
      active: activeSessions.length,
      today: filteredBreakSessions.length, // All sessions are from today
      averageDuration: completedSessions.length > 0 ? totalDuration / completedSessions.length : 0,
      totalAgents: filteredEmployees.length
    }
  }
  const [currentTime, setCurrentTime] = useState(new Date())
  const [reloading, setReloading] = useState(false)

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'department' | 'position'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Member filter state
  const [memberId, setMemberId] = useState<string>('all')
  const [memberOptions, setMemberOptions] = useState<{ id: number; company: string }[]>([])

  // Real-time updates for break sessions
  const { isConnected: isRealtimeConnected } = useRealtimeBreaks({
    onBreakSessionCreated: (newBreakSession) => {
      console.log('🔄 Real-time: New break session created:', newBreakSession)
      
      // Add null check for newBreakSession
      if (!newBreakSession || !newBreakSession.id) {
        console.warn('🔄 Invalid break session creation received:', newBreakSession)
        return
      }
      
      setBreakSessions(prevSessions => {
        // Check if session already exists (avoid duplicates)
        const exists = prevSessions.some(session => session.id === newBreakSession.id)
        if (exists) {
          console.log('🔄 Break session already exists, skipping duplicate')
          return prevSessions
        }
        
        // Add new session to the list (database now provides joined data)
        const sessionWithDefaults: BreakSession = {
          ...newBreakSession,
        }
        const updatedSessions = [...prevSessions, sessionWithDefaults]
        console.log('🔄 Added new break session to list:', updatedSessions.length)
        return updatedSessions
      })
    },
    onBreakSessionUpdated: (updatedBreakSession, oldBreakSession) => {
      console.log('🔄 Real-time: Break session updated:', { updatedBreakSession, oldBreakSession })
      
      // Add null check for updatedBreakSession
      if (!updatedBreakSession || !updatedBreakSession.id) {
        console.warn('🔄 Invalid break session update received:', updatedBreakSession)
        return
      }
      
      setBreakSessions(prevSessions => {
        return prevSessions.map(session => {
          if (session.id === updatedBreakSession.id) {
            // Database now provides complete joined data
            const sessionWithDefaults: BreakSession = {
              ...updatedBreakSession,
            }
            return sessionWithDefaults
          }
          return session
        })
      })
    },
    onBreakSessionDeleted: (deletedBreakSession) => {
      console.log('🔄 Real-time: Break session deleted:', deletedBreakSession)
      
      // Add null check for deletedBreakSession
      if (!deletedBreakSession || !deletedBreakSession.id) {
        console.warn('🔄 Invalid break session deletion received:', deletedBreakSession)
        return
      }
      
      setBreakSessions(prevSessions => {
        return prevSessions.filter(session => session.id !== deletedBreakSession.id)
      })
    }
  })

  // Update current time every second for timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Fetch member options
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch('/api/agents', { method: 'OPTIONS' })
        const data = await res.json()
        setMemberOptions(data.members || [])
      } catch (e) {
        console.error('❌ Failed to fetch members:', e)
        setMemberOptions([])
      }
    }
    fetchMembers()
  }, [])

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user) {
        return
      }

      try {
        // Build query parameters
        const params = new URLSearchParams({
          limit: '1000'
        })
        
        if (memberId !== 'all') {
          params.append('memberId', memberId)
        }

        const response = await fetch(`/api/agents?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch employees: ${response.status}`)
        }

        const data = await response.json()
        setEmployees(data.agents)
      } catch (err) {
        console.error('❌ Employees fetch error:', err)
        // Don't set error state for employees fetch failure, just log it
      }
    }

    if (user) {
      fetchEmployees()
    }
  }, [user, memberId])

  // Fetch break sessions data
  const fetchBreakSessions = async () => {
    console.log('🔍 Fetching break sessions for user:', user?.userType)
    console.log('🔍 Full user data:', user)
    
    // Clear any previous errors and set loading
    setError(null)
    setLoading(true)
    
    if (!user) {
      console.log('❌ No user found')
      setError('User not found')
      setLoading(false)
      return
    }

    try {
      console.log('📡 Making API request to /api/breaks')
      // For internal users, fetch all break sessions. For others, this would need to be adjusted based on your business logic
      const memberId = 'all'
      // Get today's date in Asia/Manila timezone to match database calculations
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) // YYYY-MM-DD format
      const response = await fetch(`/api/breaks?memberId=${memberId}&date=${today}`)
      
      console.log('📊 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ API error:', errorText)
        throw new Error(`Failed to fetch break sessions: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Break sessions data received:', data)
      
      setBreakSessions(data.breakSessions)
      setStats({
        total: data.stats.total,
        active: data.stats.active,
        today: data.stats.today,
        averageDuration: data.stats.averageDuration,
        totalAgents: data.stats.totalAgents
      })
      setError(null) // Clear any previous errors
    } catch (err) {
      console.error('❌ Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch break sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch if user is available
    if (user) {
      fetchBreakSessions()
    }
  }, [user])

  // Reload function
  const handleReload = async () => {
    setReloading(true)
    try {
      // Don't set loading to true during reload to keep the UI visible
      setError(null)
      
      console.log('📡 Making API request to /api/breaks')
      // For internal users, fetch all break sessions. For others, this would need to be adjusted based on your business logic
      const memberId = 'all'
      // Get today's date in Asia/Manila timezone to match database calculations
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) // YYYY-MM-DD format
      const response = await fetch(`/api/breaks?memberId=${memberId}&date=${today}`)
      
      console.log('📊 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ API error:', errorText)
        throw new Error(`Failed to fetch break sessions: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Break sessions data received:', data)
      
      setBreakSessions(data.breakSessions)
      setStats({
        total: data.stats.total,
        active: data.stats.active,
        today: data.stats.today,
        averageDuration: data.stats.averageDuration,
        totalAgents: data.stats.totalAgents
      })
      setError(null) // Clear any previous errors
      
    } catch (err) {
      console.error('❌ Reload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to reload break sessions')
    } finally {
      setReloading(false)
    }
  }

  const getBreakTypeIcon = (breakType: string) => {
    switch (breakType) {
      case 'Morning':
        return <SunIcon className="h-4 w-4 text-orange-500" />
      case 'Lunch':
        return <UtensilsIcon className="h-4 w-4 text-green-500" />
      case 'Afternoon':
        return <MoonIcon className="h-4 w-4 text-blue-500" />
      case 'NightFirst':
        return <MoonIcon className="h-4 w-4 text-purple-500" />
      case 'NightMeal':
        return <UtensilsIcon className="h-4 w-4 text-indigo-500" />
      case 'NightSecond':
        return <MoonIcon className="h-4 w-4 text-violet-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getBreakTypeColor = (breakType: string) => {
    switch (breakType) {
      case 'Morning':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Lunch':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Afternoon':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'NightFirst':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'NightMeal':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'NightSecond':
        return 'bg-violet-100 text-violet-800 border-violet-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusBadge = (session: BreakSession) => {
    // Check if paused first - this takes priority over other statuses
    if (session.pause_time && !session.resume_time) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Paused</Badge>
    } else if (session.end_time) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Used</Badge>
    } else {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Active</Badge>
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    })
  }

  const formatTimeOnly = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    })
  }

  const formatTimeOnlyLocal = (dateTime: string) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(dateTime))
  }

  const getElapsedTime = (session: BreakSession) => {
    const start = new Date(session.start_time || new Date())
    const now = currentTime
    let endReference = session.end_time ? new Date(session.end_time) : now

    // Calculate paused duration (single pause supported by schema)
    let pausedMs = 0
    if (session.pause_time) {
      const pauseStart = new Date(session.pause_time)
      if (session.resume_time) {
        const pauseEnd = new Date(session.resume_time)
        pausedMs += Math.max(0, pauseEnd.getTime() - pauseStart.getTime())
      } else {
        // Currently paused: freeze elapsed by subtracting ongoing pause window
        pausedMs += Math.max(0, now.getTime() - pauseStart.getTime())
      }
    }

    const elapsedMs = Math.max(0, endReference.getTime() - start.getTime() - pausedMs)
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60))
    const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000)

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  const getPausedForText = (session: BreakSession) => {
    if (session.pause_time && !session.resume_time && !session.end_time) {
      const pausedMs = Math.max(0, currentTime.getTime() - new Date(session.pause_time).getTime())
      const minutes = Math.floor(pausedMs / (1000 * 60))
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return hours > 0 ? `Paused for ${hours}h ${mins}m` : `Paused for ${mins}m`
    }
    return null
  }

  const getBreakStatusText = (activeCount: number, totalAgents: number) => {
    // If no one is currently on break
    if (activeCount === 0) return "No one is currently on break."
    
    // If no agents data available, fallback to simple count
    if (totalAgents === 0) {
      if (activeCount === 1) return "1 team member is currently on break."
      return `${activeCount} team members are currently on break.`
    }
    
    // Calculate percentage based on actual team size
    const percentage = (activeCount / totalAgents) * 100
    
    if (percentage === 0) return "No one is currently on break."
    if (percentage > 0 && percentage < 20) return "A few team members are currently on break."
    if (percentage >= 20 && percentage < 40) return "Several team members are currently on break."
    if (percentage >= 40 && percentage < 70) return "Half the team is currently taking this break."
    if (percentage >= 70 && percentage < 100) return "Most of the team is currently on break."
    if (percentage === 100) return "Everyone is currently on break."
    
    return "No one is currently on break."
  }

  // Helper function to get break session for a specific employee and break type
  const getEmployeeBreakSession = (employeeId: number, breakType: string) => {
    return breakSessions.find(session => 
      session.agent_user_id === employeeId && session.break_type === breakType
    )
  }

  // Helper function to get all break sessions for an employee
  const getEmployeeBreakSessions = (employeeId: number) => {
    return breakSessions.filter(session => 
      session.agent_user_id === employeeId
    )
  }

  // Helper function to determine which break columns to show based on shift
  const getBreakColumnsForShift = (shift: string | undefined) => {
    if (shift === 'Night' || shift === 'night') {
      return ['NightFirst', 'NightMeal', 'NightSecond']
    } else {
      // Default to Day shift columns
      return ['Morning', 'Lunch', 'Afternoon']
    }
  }

  // Helper function to get all unique break columns needed for the table
  const getAllBreakColumns = () => {
    const allShifts = employees.map(emp => emp.shift_period || emp.shift_schedule || 'Day')
    const uniqueShifts = [...new Set(allShifts)]
    
    const allColumns = new Set<string>()
    uniqueShifts.forEach(shift => {
      getBreakColumnsForShift(shift || 'Day').forEach(column => allColumns.add(column))
    })
    
    return Array.from(allColumns)
  }

  // Helper function to get break type card data
  const getBreakTypeCardData = (breakType: string) => {
    // Filter break sessions by member selection
    let filteredSessions = breakSessions
    
    if (memberId !== 'all') {
      if (memberId === 'none') {
        // Show only sessions for employees with no member assignment
        filteredSessions = breakSessions.filter(session => {
          const employee = employees.find(emp => emp.user_id === session.agent_user_id)
          return employee && !employee.member_id
        })
      } else {
        // Show only sessions for employees from the selected member company
        const selectedMemberId = parseInt(memberId)
        filteredSessions = breakSessions.filter(session => {
          const employee = employees.find(emp => emp.user_id === session.agent_user_id)
          return employee && employee.member_id === selectedMemberId
        })
      }
    }
    
    const activeSessions = filteredSessions.filter(session => session.break_type === breakType && !session.end_time)
    const count = activeSessions.length
    
    let icon, color, description
    switch (breakType) {
      case 'Morning':
        icon = <SunIcon className="h-6 w-6 text-yellow-600" />
        color = 'text-yellow-600'
        description = 'Morning Break'
        break
      case 'Lunch':
        icon = <UtensilsIcon className="h-6 w-6 text-green-600" />
        color = 'text-green-600'
        description = 'Lunch Break'
        break
      case 'Afternoon':
        icon = <ClockIcon className="h-6 w-6 text-blue-600" />
        color = 'text-blue-600'
        description = 'Afternoon Break'
        break
      case 'NightFirst':
        icon = <CoffeeIcon className="h-6 w-6 text-orange-600" />
        color = 'text-orange-600'
        description = 'Night First Break'
        break
      case 'NightMeal':
        icon = <UtensilsIcon className="h-6 w-6 text-indigo-600" />
        color = 'text-indigo-600'
        description = 'Night Meal Break'
        break
      case 'NightSecond':
        icon = <MoonIcon className="h-6 w-6 text-violet-600" />
        color = 'text-violet-600'
        description = 'Night Second Break'
        break
      default:
        icon = <ClockIcon className="h-6 w-6 text-gray-600" />
        color = 'text-gray-600'
        description = 'Break'
    }

    return {
      icon,
      color,
      description,
      count,
      activeSessions
    }
  }

  // Sorting functions
  const handleSort = (field: 'name' | 'department' | 'position') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: 'name' | 'department' | 'position') => {
    if (sortField !== field) {
      return null
    }
    return sortDirection === 'asc' ? 
      <IconArrowUp className="h-4 w-4 text-primary" /> : 
      <IconArrowDown className="h-4 w-4 text-primary" />
  }

  // Helper function to check if employee is currently on break
  const isEmployeeOnBreak = (employeeId: number) => {
    return breakSessions.some(session => 
      session.agent_user_id === employeeId && !session.end_time
    )
  }

  // Sort employees based on current sort settings
  const sortedEmployees = [...employees].sort((a, b) => {
    // Always sort by active status first (active employees first), then by the selected field
    const aIsActive = isEmployeeOnBreak(a.user_id)
    const bIsActive = isEmployeeOnBreak(b.user_id)
    
    // If one is active and the other isn't, active comes first
    if (aIsActive !== bIsActive) {
      return aIsActive ? -1 : 1
    }
    
    // If both have same active status, sort by the selected field
    let aValue: string
    let bValue: string

    switch (sortField) {
      case 'name':
        aValue = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase()
        bValue = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase()
        break
      case 'department':
        aValue = (a.department_name || '').toLowerCase()
        bValue = (b.department_name || '').toLowerCase()
        break
      case 'position':
        aValue = (a.job_title || '').toLowerCase()
        bValue = (b.job_title || '').toLowerCase()
        break
      default:
        return 0
    }

    return sortDirection === 'asc' ? 
      aValue.localeCompare(bValue) : 
      bValue.localeCompare(aValue)
  })




   if (error) {
    return (
      <>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <AppHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col py-4 md:py-6">
                <div className="px-4 lg:px-6 mb-4 min-h-[72px]">
                  <h1 className="text-2xl font-bold">Employee Breaks</h1>
                  <p className="text-sm text-muted-foreground">
                    Monitor all employees and their break session status across all break types including morning, lunch, afternoon, and night shifts.
                  </p>
                </div>
                
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardContent className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <p className="text-lg font-medium text-destructive">Error</p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                      </div>
                    </CardContent>
                  </Card>
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
            <div className="flex flex-col py-4 md:py-6">
              {/* Employee Breaks Header Section */}
              <div className="px-4 lg:px-6 mb-4 min-h-[72px]">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Breaks</h1>
                    <p className="text-sm text-muted-foreground">
                      Monitor all employees and their break session status across all break types including morning, lunch, afternoon, and night shifts.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-56">
                      <Select value={memberId} onValueChange={(v: string) => setMemberId(v)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Filter by member">
                            {memberId === 'all' ? 'All Agents' : 
                             memberId === 'none' ? 'No Assigned Members' :
                             memberOptions.find(m => String(m.id) === memberId)?.company || 'Filter by member'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Agents</SelectItem>
                          <SelectItem value="none">No Assigned Members</SelectItem>
                          <SelectSeparator className="bg-border mx-2" />
                          <SelectGroup>
                            <SelectLabel className="text-muted-foreground">Members</SelectLabel>
                            {memberOptions.map((m) => (
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
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="px-4 lg:px-6">
                {loading || employees.length === 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column 1: Employee Break Sessions Table Skeleton */}
                    <div className="order-3 lg:order-1">
                      <Card className="overflow-hidden">
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow variant="no-hover" className="h-12">
                                <TableHead className="w-48">
                                  <div className="flex items-center gap-1">
                                    <Skeleton className="h-4 w-16" />
                                  </div>
                                </TableHead>
                                {[...Array(3)].map((_, i) => (
                                  <TableHead key={i} className="text-center w-32">
                                    <Skeleton className="h-4 w-20 mx-auto" />
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...Array(12)].map((_, i) => (
                                <TableRow key={i} className="h-20">
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Skeleton className="h-10 w-10 rounded-full" />
                                      <Skeleton className="h-5 w-28" />
                                    </div>
                                  </TableCell>
                                  {[...Array(3)].map((_, j) => (
                                    <TableCell key={j} className="text-center">
                                      <Skeleton className="h-7 w-20 mx-auto" />
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Column 2: Break Type Cards Skeleton */}
                    <div className="order-2 lg:order-2 lg:sticky lg:top-16 lg:self-start">
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <Card key={i} className="bg-white dark:bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                              <div>
                                <Skeleton className="h-4 w-24 mb-2" />
                                <div className="text-2xl font-semibold tabular-nums flex items-center gap-2 mt-2">
                                  <UserIcon className="h-5 w-5" />
                                  <Skeleton className="h-8 w-8" />
                                </div>
                              </div>
                              <Skeleton className="h-6 w-6" />
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <Skeleton className="h-4 w-3/4" />
                                <div className="border-t border-border mt-3 pt-3">
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 text-xs text-muted-foreground font-medium">
                                      <Skeleton className="h-3 w-12" />
                                      <Skeleton className="h-3 w-16 mx-auto" />
                                      <Skeleton className="h-3 w-20 ml-auto" />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                      {[...Array(3)].map((_, j) => (
                                        <div key={j} className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center">
                                          <div className="flex items-center gap-2">
                                            <Skeleton className="h-6 w-6 rounded-full" />
                                            <Skeleton className="h-4 w-20" />
                                          </div>
                                          <Skeleton className="h-3 w-12 mx-auto" />
                                          <Skeleton className="h-3 w-16 ml-auto" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Column 1: Employee Break Sessions Table */}
                  <div className="order-3 lg:order-1">
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="">
                          <Table>
                            <TableHeader>
                              <TableRow variant="no-hover" className="h-12">
                                <TableHead 
                                  className={`w-48 cursor-pointer ${sortField === 'name' ? 'text-primary font-medium bg-accent/50' : ''}`}
                                  onClick={() => handleSort('name')}
                                >
                                  <div className="flex items-center gap-1">
                                    Agents
                                    {sortField === 'name' && getSortIcon('name')}
                                  </div>
                                </TableHead>
                                {getAllBreakColumns().map((breakType) => (
                                  <TableHead key={breakType} className="text-center w-32">
                                    {breakType === 'Morning' && 'Morning Break'}
                                    {breakType === 'Lunch' && 'Lunch Break'}
                                    {breakType === 'Afternoon' && 'Afternoon Break'}
                                    {breakType === 'NightFirst' && 'Night First'}
                                    {breakType === 'NightMeal' && 'Night Meal'}
                                    {breakType === 'NightSecond' && 'Night Second'}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedEmployees.map((employee) => (
                                <TableRow key={employee.user_id} className="h-14">
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={employee.profile_picture || undefined} alt={`${employee.first_name} ${employee.last_name}`} />
                                        <AvatarFallback>
                                          {employee.first_name?.[0]}{employee.last_name?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                   
                                  {/* Dynamic Break Columns based on shift */}
                                  {getAllBreakColumns().map((breakType) => {
                                    const employeeBreakColumns = getBreakColumnsForShift(employee.shift_period || employee.shift_schedule || 'Day')
                                    const shouldShowColumn = employeeBreakColumns.includes(breakType)
                                    
                                    if (!shouldShowColumn) {
                                      return <TableCell key={breakType} className="text-center">-</TableCell>
                                    }
                                    
                                    const breakSession = getEmployeeBreakSession(employee.user_id, breakType)
                                    if (!breakSession) return <TableCell key={breakType} className="text-center"><span className="text-muted-foreground text-sm">-</span></TableCell>
                                    
                                       return (
                                      <TableCell key={breakType} className="text-center">
                                         <TooltipProvider>
                                           <Tooltip delayDuration={300}>
                                             <TooltipTrigger>
                                              {getStatusBadge(breakSession)}
                                             </TooltipTrigger>
                                              <TooltipContent className="min-w-[12rem]">
                                              {breakSession.end_time ? (
                                                <div className="flex w-full flex-col gap-1">
                                                  <div className="grid grid-cols-[1fr_2fr] gap-4 w-full">
                                                    <span className="text-muted-foreground">Completed:</span>
                                                    <div className="flex flex-col items-start">
                                                      <span className="font-bold">
                                                        Local: {formatTimeOnlyLocal(breakSession.start_time)} - {formatTimeOnlyLocal(breakSession.end_time)}
                                                      </span>
                                                      <span className="font-bold text-muted-foreground text-xs">
                                                        PH: {formatTimeOnly(breakSession.start_time)} - {formatTimeOnly(breakSession.end_time)}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-[1fr_2fr] gap-4 w-full">
                                                    <span className="text-muted-foreground">Duration:</span>
                                                    <span className="font-bold">{formatDuration(breakSession.duration_minutes)}</span>
                                                  </div>
                                                </div>
                                              ) : breakSession.pause_time && !breakSession.resume_time ? (
                                                <div className="flex w-full flex-col gap-1">
                                                  <div className="grid grid-cols-[1fr_2fr] gap-4 w-full">
                                                    <span className="text-muted-foreground">Started:</span>
                                                    <div className="flex flex-col items-start">
                                                      <span className="font-bold">
                                                        Local: {formatTimeOnlyLocal(breakSession.start_time)}
                                                      </span>
                                                      <span className="font-bold text-muted-foreground text-xs">
                                                        PH: {formatTimeOnly(breakSession.start_time)}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-[1fr_2fr] gap-4 w-full">
                                                    <span className="text-muted-foreground">Paused Since:</span>
                                                    <div className="flex flex-col items-start">
                                                      <span className="font-bold">
                                                        Local: {formatTimeOnlyLocal(breakSession.pause_time)}
                                                      </span>
                                                      <span className="font-bold text-muted-foreground text-xs">
                                                        PH: {formatTimeOnly(breakSession.pause_time)}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex w-full flex-col gap-1">
                                                  <div className="grid grid-cols-[1fr_2fr] gap-4 w-full">
                                                    <span className="text-muted-foreground">Started:</span>
                                                    <div className="flex flex-col items-start">
                                                      <span className="font-bold">
                                                        Local: {formatTimeOnlyLocal(breakSession.start_time)}
                                                      </span>
                                                      <span className="font-bold text-muted-foreground text-xs">
                                                        PH: {formatTimeOnly(breakSession.start_time)}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-[1fr_2fr] gap-4 w-full">
                                                    <span className="text-muted-foreground">Elapsed:</span>
                                                    <span className="font-bold">{getElapsedTime(breakSession)}</span>
                                                  </div>
                                                </div>
                                              )}
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                  </TableCell>
                                    )
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Column 2: Break Type Cards (sticky) */}
                  <div className="order-2 lg:order-2 lg:sticky lg:top-16 lg:self-start">
                    <div className="space-y-4">
                      {getAllBreakColumns().map((breakType) => {
                        const cardData = getBreakTypeCardData(breakType)
                        
                        return (
                          <Card key={breakType} className="bg-white dark:bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                              <div>
                                <CardDescription>{cardData.description}</CardDescription>
                                <div className="text-2xl font-semibold tabular-nums flex items-center gap-2 mt-2">
                                  <UserIcon className="h-5 w-5" />
                                  {cardData.count}
                                </div>
                              </div>
                              {cardData.icon}
                            </CardHeader>
                            <CardContent>
                              <CardTitle className="text-sm font-medium">
                                {getBreakStatusText(cardData.count, getFilteredStats().totalAgents)}
                              </CardTitle>
                              {cardData.count > 0 && (
                                <div className="border-t border-border mt-3 pt-3">
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 text-xs text-muted-foreground font-medium">
                                      <span>Name</span>
                                      <span className="text-center">Started Time</span>
                                      <span className="text-right">Elapsed Time</span>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                      {cardData.activeSessions.map((session) => (
                                        <div key={session.id} className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center">
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                              <AvatarImage src={session.profile_picture || undefined} alt={`${session.first_name} ${session.last_name}`} />
                                              <AvatarFallback className="text-xs">
                                                {session.first_name?.[0]}{session.last_name?.[0]}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium">
                                              {session.first_name} {session.last_name}
                                            </span>
                                          </div>
                                          {!session.end_time && (
                                            <>
                                              <span className="text-xs text-muted-foreground text-center">
                                                {formatTimeOnly(session.start_time)}
                                              </span>
                                              <div className="flex flex-col items-end">
                                                <span className="text-xs font-mono text-primary">
                                                  {getElapsedTime(session)}
                                                </span>
                                                {getPausedForText(session) && (
                                                  <span className="text-[10px] text-muted-foreground">{getPausedForText(session)}</span>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
