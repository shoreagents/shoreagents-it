"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { NoData } from "@/components/ui/no-data"

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  department: string
  position: string
  hireDate?: string
  avatar?: string
  departmentId?: number
  workEmail?: string
  birthday?: string
  city?: string
  address?: string
  gender?: string
  shift?: string
  user_id?: number
  first_name?: string
  last_name?: string
  member_id?: number
  member_company?: string
  activity?: {
    today_active_seconds: number
    today_inactive_seconds: number
  }
}

interface ChartDataPoint {
  date: string
  active: number
  inactive: number
}

interface ActivityDataCardProps {
  selectedEmployee: Employee | null
  formatTime: (seconds: number) => string
  detailLoading: boolean
  getYesterdayActivityData: (employee: Employee) => { today_active_seconds: number; today_inactive_seconds: number }
  getWeekActivityData: (employee: Employee) => { total_active_seconds: number; total_inactive_seconds: number }
  getMonthActivityData: (employee: Employee) => { total_active_seconds: number; total_inactive_seconds: number }
  user: any // Add user prop for API calls
}

// Helper function to format dates consistently
const formatDateForDisplay = (dateString: string, format: 'short' | 'long' = 'short') => {
  if (!dateString || typeof dateString !== 'string') return 'No date available'
  
  // Handle both YYYY-MM-DD and ISO timestamp formats
  let date: Date
  if (dateString.includes('T') || dateString.includes('Z')) {
    // Full ISO timestamp format
    date = new Date(dateString)
  } else {
    // YYYY-MM-DD format - add time to avoid timezone issues
    date = new Date(dateString + 'T00:00:00')
  }
  
  if (isNaN(date.getTime())) return 'Invalid date' // Return meaningful message for invalid date
  
  if (format === 'long') {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }
}

export function ActivityDataCard({ 
  selectedEmployee, 
  formatTime, 
  detailLoading,
  getYesterdayActivityData,
  getWeekActivityData,
  getMonthActivityData,
  user
}: ActivityDataCardProps) {
  const [activeTab, setActiveTab] = useState("data")
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [chartError, setChartError] = useState<string | null>(null)

  // Fetch chart data from API when employee is selected
  const fetchChartData = async (employeeId: string) => {
    if (!employeeId || !user) return

    setChartLoading(true)
    setChartError(null)

    try {
      // Get current month date range
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const startDate = startOfMonth.toLocaleDateString('en-CA')
      const endDate = endOfMonth.toLocaleDateString('en-CA')
      
      // Use the same memberId as the parent component
      const memberId = user.userType === 'Internal' ? 'all' : user.id
      
      console.log('📊 Fetching chart data for date range:', startDate, 'to', endDate, 'memberId:', memberId)

      const response = await fetch(`/api/activities?memberId=${memberId}&startDate=${startDate}&endDate=${endDate}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📊 Fetched chart data from API:', data)
      console.log('📊 API Response structure:', {
        hasActivities: 'activities' in data,
        activitiesType: typeof data.activities,
        activitiesLength: data.activities?.length,
        dateRange: data.dateRange,
        stats: data.stats
      })

      // Extract activities from API response
      const allActivities = data.activities || []
      console.log('📊 All activities from API:', allActivities)

      // Filter activities for the selected employee
      const activities = allActivities.filter((activity: any) => 
        activity.user_id.toString() === employeeId
      )
      console.log('📊 Filtered activities for employee:', activities)

      // Check if there are any activities
      if (!Array.isArray(activities) || activities.length === 0) {
        console.log('📊 No activities found for this employee, setting empty chart data')
        setChartData([])
        return
      }

      // Process data for daily chart (only days with activity data)
      const generateDailyChartData = (activities: any[]) => {
        console.log('📊 Raw activities data:', activities)
        
        // Group activities by date
        const activitiesByDate = activities.reduce((acc, activity) => {
          const date = activity.today_date
          if (!date) {
            console.warn('⚠️ Activity missing today_date:', activity)
            return acc
          }
          
          if (!acc[date]) {
            acc[date] = []
          }
          acc[date].push(activity)
          return acc
        }, {} as Record<string, any[]>)

        console.log('📊 Activities grouped by date:', activitiesByDate)

        // Create chart data only for dates that have activity
        const chartData = Object.keys(activitiesByDate)
          .sort() // Sort dates chronologically
          .map(date => {
            const dayActivities = activitiesByDate[date]
            const totalActive = dayActivities.reduce((sum: number, a: any) => sum + (a?.today_active_seconds || 0), 0)
            const totalInactive = dayActivities.reduce((sum: number, a: any) => sum + (a?.today_inactive_seconds || 0), 0)
            
            console.log(`📊 Processing date ${date}:`, { totalActive, totalInactive })
            
            return {
              date,
              active: totalActive,
              inactive: totalInactive,
            }
          })
        
        return chartData
      }

      const chartData = generateDailyChartData(activities)
      console.log('📊 Chart data generated:', chartData.length, 'data points')
      setChartData(chartData)

    } catch (err) {
      console.error('❌ Chart data fetch error:', err)
      setChartError(err instanceof Error ? err.message : 'Failed to fetch chart data')
    } finally {
      setChartLoading(false)
    }
  }

  // Fetch chart data when employee is selected
  useEffect(() => {
    if (selectedEmployee) {
      const employeeId = selectedEmployee.user_id || selectedEmployee.id
      fetchChartData(employeeId.toString())
    }
  }, [selectedEmployee?.user_id || selectedEmployee?.id, user?.id])

  const tabs = [
    {
      title: "View Data",
      value: "data",
      content: null
    },
    {
      title: "View Charts", 
      value: "charts",
      content: null
    }
  ]

  // Handle tab change
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue)
  }

  const renderDataContent = () => {
    if (!selectedEmployee) {
      return (
        <div className="space-y-4">
          {/* Today - Default with no data */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Today</div>
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-muted/50 dark:bg-muted/20 border-border">
                <CardContent className="p-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Active Time</span>
                  </div>
                  <div className="text-lg font-semibold tabular-nums mt-1">
                    0h 0m
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50 dark:bg-muted/20 border-border">
                <CardContent className="p-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Inactive Time</span>
                  </div>
                  <div className="text-lg font-semibold tabular-nums mt-1">
                    0h 0m
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Yesterday */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Yesterday</div>
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-muted/50 dark:bg-muted/20 border-border">
                <CardContent className="p-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Active Time</span>
                  </div>
                  <div className="text-lg font-semibold tabular-nums mt-1">
                    0h 0m
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50 dark:bg-muted/20 border-border">
                <CardContent className="p-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Inactive Time</span>
                  </div>
                  <div className="text-lg font-semibold tabular-nums mt-1">
                    0h 0m
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* This Week */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">This Week</div>
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-muted/50 dark:bg-muted/20 border-border">
                <CardContent className="p-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Active Time</span>
                  </div>
                  <div className="text-lg font-semibold tabular-nums mt-1">
                    0h 0m
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50 dark:bg-muted/20 border-border">
                <CardContent className="p-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Inactive Time</span>
                  </div>
                  <div className="text-lg font-semibold tabular-nums mt-1">
                    0h 0m
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* This Month */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">This Month</div>
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-muted/50 dark:bg-muted/20 border-border">
                <CardContent className="p-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Active Time</span>
                  </div>
                  <div className="text-lg font-semibold tabular-nums mt-1">
                    0h 0m
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50 dark:bg-muted/20 border-border">
                <CardContent className="p-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Inactive Time</span>
                  </div>
                  <div className="text-lg font-semibold tabular-nums mt-1">
                    0h 0m
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )
    }

    // Check if there's any activity data available
    const hasActivityData = selectedEmployee.activity && (
      (selectedEmployee.activity.today_active_seconds > 0) ||
      (selectedEmployee.activity.today_inactive_seconds > 0) ||
      (getYesterdayActivityData(selectedEmployee).today_active_seconds > 0) ||
      (getYesterdayActivityData(selectedEmployee).today_inactive_seconds > 0) ||
      (getWeekActivityData(selectedEmployee).total_active_seconds > 0) ||
      (getWeekActivityData(selectedEmployee).total_inactive_seconds > 0) ||
      (getMonthActivityData(selectedEmployee).total_active_seconds > 0) ||
      (getMonthActivityData(selectedEmployee).total_inactive_seconds > 0)
    )

    // If no activity data is available, show empty state
    if (!hasActivityData && !detailLoading) {
      return (
        <div className="space-y-4">
          <NoData message="No Activity Data" />
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Today - Always available, no loading state needed */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Today</div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-muted/50 dark:bg-muted/20 border-border">
              <CardContent className="p-3">
                <div>
                  <span className="text-xs text-muted-foreground">Total Active Time</span>
                </div>
                <div className="text-lg font-semibold tabular-nums mt-1">
                  {formatTime(selectedEmployee.activity?.today_active_seconds || 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 dark:bg-muted/20 border-border">
              <CardContent className="p-3">
                <div>
                  <span className="text-xs text-muted-foreground">Total Inactive Time</span>
                </div>
                <div className="text-lg font-semibold tabular-nums mt-1">
                  {formatTime(selectedEmployee.activity?.today_inactive_seconds || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Yesterday */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Yesterday</div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-muted/50 dark:bg-muted/20 border-border">
              <CardContent className="p-3">
                <div>
                  <span className="text-xs text-muted-foreground">Total Active Time</span>
                </div>
                <div className="text-lg font-semibold tabular-nums mt-1">
                  {detailLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    formatTime(getYesterdayActivityData(selectedEmployee).today_active_seconds)
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 dark:bg-muted/20 border-border">
              <CardContent className="p-3">
                <div>
                  <span className="text-xs text-muted-foreground">Total Inactive Time</span>
                </div>
                <div className="text-lg font-semibold tabular-nums mt-1">
                  {detailLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    formatTime(getYesterdayActivityData(selectedEmployee).today_inactive_seconds)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* This Week */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">This Week</div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-muted/50 dark:bg-muted/20 border-border">
              <CardContent className="p-3">
                <div>
                  <span className="text-xs text-muted-foreground">Total Active Time</span>
                </div>
                <div className="text-lg font-semibold tabular-nums mt-1">
                  {detailLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    formatTime(getWeekActivityData(selectedEmployee).total_active_seconds)
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 dark:bg-muted/20 border-border">
              <CardContent className="p-3">
                <div>
                  <span className="text-xs text-muted-foreground">Total Inactive Time</span>
                </div>
                <div className="text-lg font-semibold tabular-nums mt-1">
                  {detailLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    formatTime(getWeekActivityData(selectedEmployee).total_inactive_seconds)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* This Month */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">This Month</div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-muted/50 dark:bg-muted/20 border-border">
              <CardContent className="p-3">
                <div>
                  <span className="text-xs text-muted-foreground">Total Active Time</span>
                </div>
                <div className="text-lg font-semibold tabular-nums mt-1">
                  {detailLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    formatTime(getMonthActivityData(selectedEmployee).total_active_seconds)
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 dark:bg-muted/20 border-border">
              <CardContent className="p-3">
                <div>
                  <span className="text-xs text-muted-foreground">Total Inactive Time</span>
                </div>
                <div className="text-lg font-semibold tabular-nums mt-1">
                  {detailLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    formatTime(getMonthActivityData(selectedEmployee).total_inactive_seconds)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const renderChartsContent = () => {
    if (!selectedEmployee) {
      return (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              Click on an employee to view their activity charts
            </div>
          </div>
        </div>
      )
    }

    const chartConfig = {
      active: {
        label: "Active Time",
        color: "hsl(12 76% 61%)",
      },
      inactive: {
        label: "Inactive Time", 
        color: "hsl(0 84% 60%)",
      },
    } satisfies ChartConfig

    // Calculate most active and most inactive times
    const calculatePeakTimes = () => {
      if (!chartData || chartData.length === 0) {
        return {
          mostActive: null,
          mostInactive: null
        }
      }

      let mostActive = chartData[0]
      let mostInactive = chartData[0]

      chartData.forEach((dataPoint: ChartDataPoint) => {
        if (dataPoint.active > mostActive.active) {
          mostActive = dataPoint
        }
        if (dataPoint.inactive > mostInactive.inactive) {
          mostInactive = dataPoint
        }
      })

      return {
        mostActive: mostActive.active > 0 ? mostActive : null,
        mostInactive: mostInactive.inactive > 0 ? mostInactive : null
      }
    }

    const peakTimes = calculatePeakTimes()

    if (chartLoading) {
      return (
        <div className="space-y-6">
          <div>
            <Card className="@container/card">
              <CardContent className="px-0 pt-4 sm:px-0 sm:pt-6">
                <div className="relative">
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
      )
    }

    if (chartError) {
      return (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="text-destructive">
              Error loading chart data: {chartError}
            </div>
          </div>
        </div>
      )
    }

    if (chartData.length === 0) {
      return (
        <div className="space-y-4">
          <NoData message="No Activity Data" />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Monthly Activity Chart */}
        <div>
          <Card className="@container/card">
            <CardContent className="px-0 pt-4 sm:px-0 sm:pt-6">
              <div className="relative">
                <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-active)" stopOpacity={1.0} />
                      <stop offset="95%" stopColor="var(--color-active)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillInactive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-inactive)" stopOpacity={1.0} />
                      <stop offset="95%" stopColor="var(--color-inactive)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value: string) => formatDateForDisplay(value, 'short')}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        className="min-w-[16rem]"
                        labelClassName="text-center w-full"
                        labelFormatter={(value: string) => {
                          const dateText = formatDateForDisplay(value, 'long')
                          // Check if formatting failed by looking for our error messages
                          if (dateText === 'No date available' || dateText === 'Invalid date') {
                            // If formatting failed, return original value with styling
                            return (
                              <div className="flex w-full flex-col items-center">
                                <span>{value}</span>
                                <div className="h-px w-full bg-foreground/20 my-1" />
                              </div>
                            )
                          }
                          return (
                            <div className="flex w-full flex-col items-center">
                              <span>{dateText}</span>
                              <div className="h-px w-full bg-foreground/20 my-1" />
                            </div>
                          )
                        }}
                        indicator="dot"
                        formatter={(val: any, name: string, item: any, _idx: number, point: any) => {
                          // Only render once for the first series (active) to avoid duplication
                          if (name !== 'active') return null
                          
                          const activeValue = point?.active || 0
                          const inactiveValue = point?.inactive || 0
                          const activeHours = Math.floor(activeValue / 3600)
                          const activeMinutes = Math.floor((activeValue % 3600) / 60)
                          const inactiveHours = Math.floor(inactiveValue / 3600)
                          const inactiveMinutes = Math.floor((inactiveValue % 3600) / 60)
                          
                          return (
                            <div className="flex w-full flex-col gap-1">
                              <div className="flex w-full items-center justify-between text-muted-foreground">
                                <span>Status</span>
                                <span>Time</span>
                              </div>
                              <div className="flex w-full items-center justify-between">
                                <span className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                                  Active
                                </span>
                                <span>
                                  {activeHours}h {activeMinutes}m
                                </span>
                              </div>
                              <div className="flex w-full items-center justify-between">
                                <span className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                  Inactive
                                </span>
                                <span>
                                  {inactiveHours}h {inactiveMinutes}m
                                </span>
                              </div>
                            </div>
                          )
                        }}
                      />
                    }
                  />
                  <Area
                    dataKey="active"
                    type="natural"
                    fill="url(#fillActive)"
                    stroke="var(--color-active)"
                    stackId="a"
                  />
                  <Area
                    dataKey="inactive"
                    type="natural"
                    fill="url(#fillInactive)"
                    stroke="var(--color-inactive)"
                    stackId="a"
                  />
                </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    )
  }

  // Calculate most active and most inactive times (moved outside renderChartsContent)
  const calculatePeakTimes = () => {
    if (!chartData || chartData.length === 0) {
      return {
        mostActive: null,
        mostInactive: null
      }
    }

    let mostActive = chartData[0]
    let mostInactive = chartData[0]

    chartData.forEach((dataPoint: ChartDataPoint) => {
      if (dataPoint.active > mostActive.active) {
        mostActive = dataPoint
      }
      if (dataPoint.inactive > mostInactive.inactive) {
        mostInactive = dataPoint
      }
    })

    return {
      mostActive: mostActive.active > 0 ? mostActive : null,
      mostInactive: mostInactive.inactive > 0 ? mostInactive : null
    }
  }

  const peakTimes = calculatePeakTimes()

  return (
    <Card className="bg-white dark:bg-card overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {selectedEmployee ? `${selectedEmployee.firstName}'s Activity Data` : 'Select Employee'}
            </CardTitle>
            <CardDescription>Analytics for activity data over time.</CardDescription>
          </div>
          <div className="ml-4">
            <AnimatedTabs
              tabs={tabs}
              containerClassName="flex flex-row items-center justify-end"
              activeTabClassName="bg-primary/10"
              tabClassName="px-3 py-1 text-sm font-medium"
              onTabChange={(tab) => handleTabChange(tab.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Tab Content */}
          {activeTab === "data" ? renderDataContent() : renderChartsContent()}
        </div>
      </CardContent>
      
      {/* Peak Times Summary - Outside tab content and padding container */}
      {(() => {
        // If no employee is selected, always show peak cards
        if (!selectedEmployee) {
          return (
            <div className="bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {/* Most Active Time */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center">
                        <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Most Active Time</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDateForDisplay(new Date().toISOString().split('T')[0], 'long')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          0h 0m
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Most Inactive Time */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center">
                        <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Most Inactive Time</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDateForDisplay(new Date().toISOString().split('T')[0], 'long')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          0h 0m
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        }

        // If employee is selected, check if there's activity data
        const hasActivityData = (
          ((selectedEmployee.activity?.today_active_seconds || 0) > 0) ||
          ((selectedEmployee.activity?.today_inactive_seconds || 0) > 0) ||
          (getYesterdayActivityData(selectedEmployee).today_active_seconds > 0) ||
          (getYesterdayActivityData(selectedEmployee).today_inactive_seconds > 0) ||
          (getWeekActivityData(selectedEmployee).total_active_seconds > 0) ||
          (getWeekActivityData(selectedEmployee).total_inactive_seconds > 0) ||
          (getMonthActivityData(selectedEmployee).total_active_seconds > 0) ||
          (getMonthActivityData(selectedEmployee).total_inactive_seconds > 0)
        )

        // Only show peak cards if there's activity data or if loading
        if (!hasActivityData && !detailLoading) {
          return null
        }

        return (
          <div className="bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {/* Most Active Time */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center">
                      <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Most Active Time</h3>
                      <p className="text-sm text-muted-foreground">
                        {detailLoading ? (
                          <Skeleton className="h-4 w-32" />
                        ) : peakTimes.mostActive ? (
                          formatDateForDisplay(peakTimes.mostActive.date, 'long')
                        ) : (
                          "No data available"
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {detailLoading ? (
                          <Skeleton className="h-6 w-16" />
                        ) : peakTimes.mostActive ? (
                          formatTime(peakTimes.mostActive.active)
                        ) : (
                          "0h 0m"
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Most Inactive Time */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center">
                      <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Most Inactive Time</h3>
                      <p className="text-sm text-muted-foreground">
                        {detailLoading ? (
                          <Skeleton className="h-4 w-32" />
                        ) : peakTimes.mostInactive ? (
                          formatDateForDisplay(peakTimes.mostInactive.date, 'long')
                        ) : (
                          "No data available"
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        {detailLoading ? (
                          <Skeleton className="h-6 w-16" />
                        ) : peakTimes.mostInactive ? (
                          formatTime(peakTimes.mostInactive.inactive)
                        ) : (
                          "0h 0m"
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      })()}
    </Card>
  )
}