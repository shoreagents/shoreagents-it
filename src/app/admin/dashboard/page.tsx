"use client"

import { useState, useEffect, useMemo } from "react"
import { TrendingDownIcon, TrendingUpIcon, TicketIcon, Users, UserPlus, Building2, Calendar, Megaphone, BarChart3, Clock, Trophy, FileText, Sparkles, History, User, UserCheck, FilePenLine, Home, IdCard } from "lucide-react"
import { IconCalendar, IconClock } from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NumberFlow from '@number-flow/react'
import { useRouter } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { CardStack } from "@/components/ui/card-stack"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AdminStats {
  daily: {
    current: number
    previous: number
    change: number
  }
  weekly: {
    current: number
    previous: number
    change: number
  }
  monthly: {
    current: number
    previous: number
    change: number
  }
}

interface RecentActivity {
  id: number
  title: string
  description: string
  type: string
  created_at: string
  user_name?: string
  icon?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [prevDirection, setPrevDirection] = useState<'positive' | 'negative' | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<RecentActivity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleViewActivity = (activity: RecentActivity) => {
    setSelectedActivity(activity)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedActivity(null)
  }

  const handleCardClick = (url: string) => {
    router.push(url)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch admin stats
        if (user?.id) {
          console.log('Fetching admin stats for user:', user.id)
          const statsResponse = await fetch(`/api/admin/stats?userId=${user.id}`)
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            console.log('Fetched admin stats:', statsData)
            setStats(statsData)
          } else {
            console.error('Admin stats response not ok:', statsResponse.status)
          }
        }

        // Fetch recent activities
        const activitiesResponse = await fetch('/api/admin/recent-activities')
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json()
          setRecentActivities(activitiesData)
        }
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  // Mock data for demonstration - replace with actual API calls
  const mockStats = {
    daily: { current: 45, previous: 38, change: 18.4 },
    weekly: { current: 312, previous: 289, change: 8.0 },
    monthly: { current: 1247, previous: 1156, change: 7.9 }
  }

  const mockActivities = [
    {
      id: 1,
      title: "New Employee Onboarded",
      description: "John Doe completed onboarding process",
      type: "onboarding",
      created_at: new Date().toISOString(),
      user_name: "John Doe",
      icon: "👤"
    },
    {
      id: 2,
      title: "Client Meeting Scheduled",
      description: "Meeting with ABC Corp scheduled for tomorrow",
      type: "meeting",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      user_name: "Sarah Wilson",
      icon: "📅"
    },
    {
      id: 3,
      title: "New Job Posted",
      description: "Software Developer position posted",
      type: "job",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      user_name: "HR Team",
      icon: "💼"
    }
  ]

  // Use mock data if API data is not available
  const currentStats = stats || mockStats
  const currentActivities = recentActivities.length > 0 ? recentActivities : mockActivities

  // Get the current value based on viewMode
  const getCurrentValue = () => {
    switch (viewMode) {
      case 'daily':
        return currentStats.daily.current
      case 'weekly':
        return currentStats.weekly.current
      case 'monthly':
        return currentStats.monthly.current
      default:
        return currentStats.daily.current
    }
  }

  const currentValue = useMemo(() => getCurrentValue(), [currentStats, viewMode])

  // Get current direction and check if it changed
  const getCurrentDirection = () => {
    switch (viewMode) {
      case 'daily':
        return currentStats.daily.change >= 0 ? 'positive' : 'negative'
      case 'weekly':
        return currentStats.weekly.change >= 0 ? 'positive' : 'negative'
      case 'monthly':
        return currentStats.monthly.change >= 0 ? 'positive' : 'negative'
      default:
        return 'positive'
    }
  }

  const currentDirection = getCurrentDirection()
  const directionChanged = prevDirection !== null && prevDirection !== currentDirection

  // Update previous direction when it changes
  useEffect(() => {
    if (prevDirection !== currentDirection) {
      setPrevDirection(currentDirection)
    }
  }, [currentDirection, prevDirection])

  // Get status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
      case "Pending":
        return "text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20"
      case "Completed":
        return "text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20"
      case "Overdue":
        return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
      default:
        return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
    }
  }

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Overview of your administrative system and metrics.</p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
                  {/* Recent Activities Skeleton */}
                  <Card className="@container/card">
                    <CardHeader>
                      <div className="h-4 w-28 bg-muted animate-pulse rounded"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats Cards Skeleton */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="@container/card">
                      <CardHeader>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                      </CardHeader>
                    </Card>
                    <Card className="@container/card">
                      <CardHeader>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                      </CardHeader>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
                  
                  {/* Column 1: Recent Activities and System Status - smaller width */}
                  <div className="flex flex-col gap-4 md:col-span-1 h-full">
                    {/* Recent Activities - takes up 2 rows worth of space */}
                    <div className="flex-1">
                      <Card className="@container/card h-full flex flex-col">
                        <CardHeader className="relative flex-shrink-0">
                          <CardDescription>Recent Activities</CardDescription>
                        </CardHeader>
                        <CardContent className="px-2 sm:px-6 flex-1 overflow-hidden">
                          <div className="space-y-3 h-full max-h-[500px] overflow-y-auto">
                            {currentActivities.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No recent activities found</p>
                              </div>
                            ) : (
                              currentActivities.map((activity, index) => (
                                <div key={activity.id} className="rounded-xl border bg-sidebar dark:bg-[#252525] p-3">
                              <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src="" alt={`Activity ${activity.id}`} />
                                        <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                                          {activity.icon || "📋"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm font-medium text-foreground">
                                        {activity.title}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 min-w-0">
                                      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground min-w-0">
                                        <div className="flex items-center gap-1">
                                          <IconCalendar className="size-3 text-muted-foreground" />
                                          <span className="whitespace-nowrap font-medium text-muted-foreground">{new Date(activity.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <span className="text-muted-foreground">•</span>
                                        <div className="flex items-center gap-1">
                                          <IconClock className="size-3 text-muted-foreground" />
                                          <span className="whitespace-nowrap text-muted-foreground">{new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                      </div>
                                  </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* System Status - Row 3 */}
                    <div className="flex-1">
                      <Card className="@container/card h-full">
                        <CardHeader className="relative">
                          <CardDescription>System Status</CardDescription>
                          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 text-primary">⚡</div>
                              Operational
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1 text-sm">
                          <div className="line-clamp-1 flex gap-2 font-medium mb-2">
                            All Systems
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs rounded-xl text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20">
                              Online <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600/20 dark:bg-green-600/40 text-green-700 dark:text-white text-xs ml-1">✓</span>
                            </Badge>
                            <Badge variant="outline" className="text-xs rounded-xl text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20">
                              Stable <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/20 dark:bg-blue-600/40 text-blue-700 dark:text-white text-xs ml-1">●</span>
                            </Badge>
                          </div>
                        </CardFooter>
                      </Card>
                    </div>
                  </div>

                  {/* Column 2: Split into 3 rows */}
                  <div className="flex flex-col gap-4 md:col-span-2 h-full">
                    
                    {/* Row 1: Active Users, Completed Tasks, and Recent Activities Card Stack */}
                    <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                      {/* Active Users */}
                      <Card className="@container/card">
                        <CardHeader className="relative h-32">
                          <CardDescription>Active Users</CardDescription>
                          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                            <div className="flex items-center gap-2">
                              <Users className="h-6 w-6 text-primary" />
                              {currentValue}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1 text-sm">
                          <div className="line-clamp-1 flex gap-2 font-medium mb-2">
                            User Breakdown
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs rounded-xl text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20">
                              Online <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600/20 dark:bg-green-600/40 text-green-700 dark:text-white text-xs ml-1">{Math.floor(currentValue * 0.7)}</span>
                            </Badge>
                            <Badge variant="outline" className="text-xs rounded-xl text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20">
                              Away <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-600/20 dark:bg-yellow-600/40 text-yellow-700 dark:text-white text-xs ml-1">{Math.floor(currentValue * 0.3)}</span>
                                  </Badge>
                          </div>
                        </CardFooter>
                      </Card>

                      {/* Completed Tasks */}
                      <Card className="@container/card">
                        <CardHeader className="relative h-32">
                          <CardDescription className="flex items-center gap-3">
                            <span>Completed Tasks</span>
                          </CardDescription>
                          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-6 w-6 text-primary" />
                              <NumberFlow 
                                value={currentValue}
                                transformTiming={{ duration: 750, easing: 'ease-out' }}
                                spinTiming={{ duration: 750, easing: 'ease-out' }}
                                opacityTiming={{ duration: 350, easing: 'ease-out' }}
                                className="tabular-nums"
                                style={{ '--number-flow-mask-height': '0.1em' } as React.CSSProperties}
                              />
                            </div>
                          </CardTitle>
                          <div className="absolute right-4 top-4">
                            <div
                              className={`grid grid-cols-3 gap-1 rounded-lg text-xs bg-sidebar dark:bg-[#252525] transition-all duration-500 ease-out px-1.5 py-0.5 border w-20 h-6 items-center ${
                                viewMode === 'daily' ? (currentStats.daily.change >= 0 ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-600/30' : 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-600/30') :
                                viewMode === 'weekly' ? (currentStats.weekly.change >= 0 ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-600/30' : 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-600/30') :
                                (currentStats.monthly.change >= 0 ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-600/30' : 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-600/30')
                              }`}
                            >
                              <div className="flex items-center justify-center">
                                {currentDirection === 'positive' ? (
                                  <TrendingUpIcon className="size-3" />
                                ) : (
                                  <TrendingDownIcon className="size-3" />
                                )}
                              </div>
                              <div className="flex items-center justify-center">
                                {currentDirection === 'positive' ? '+' : '-'}
                                <NumberFlow 
                                  value={Math.round(Math.abs(
                                    viewMode === 'daily' ? currentStats.daily.change :
                                    viewMode === 'weekly' ? currentStats.weekly.change :
                                    currentStats.monthly.change
                                  ))}
                                  transformTiming={{ duration: 500, easing: 'ease-out' }}
                                  spinTiming={{ duration: 500, easing: 'ease-out' }}
                                  opacityTiming={{ duration: 250, easing: 'ease-out' }}
                                  className="tabular-nums"
                                  style={{ '--number-flow-mask-height': '0.05em' } as React.CSSProperties}
                                />
                              </div>
                              <div className="flex items-center justify-center w-4">
                                %
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1 text-sm">
                          <div className="line-clamp-1 flex gap-2 font-medium">
                            {viewMode === 'daily' ? (currentStats.daily.change >= 0 ? 'Uptrend Today' : 'Downtrend Today') :
                             viewMode === 'weekly' ? (currentStats.weekly.change >= 0 ? 'Uptrend This Week' : 'Downtrend This Week') :
                             (currentStats.monthly.change >= 0 ? 'Uptrend This Month' : 'Downtrend This Month')}
                          </div>
                          <div className="text-muted-foreground text-xs">Total tasks completed across all departments.</div>
                          <div className="mt-2">
                            <AnimatedTabs
                              tabs={[
                                { title: "Today", value: "daily" },
                                { title: "This Week", value: "weekly" },
                                { title: "This Month", value: "monthly" }
                              ]}
                              onTabChange={(tab) => setViewMode(tab.value as 'daily' | 'weekly' | 'monthly')}
                            />
                          </div>
                        </CardFooter>
                      </Card>

                      {/* Card Stack */}
                      <Card className="@container/card h-full flex flex-col">
                        <CardHeader className={`relative flex-shrink-0 ${currentActivities.length > 0 ? 'pb-0' : 'pb-3'}`}>
                          <CardDescription>Recent Activities</CardDescription>
                          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="px-2 sm:px-6 flex-1 overflow-visible flex items-center justify-center min-h-[220px] pb-0">
                          {currentActivities.length > 0 ? (
                            <CardStack
                              items={currentActivities.slice(0, 3).map((activity) => ({
                                id: activity.id,
                                name: activity.user_name || 'System',
                                designation: activity.type,
                                content: activity.description,
                                created_at: activity.created_at,
                                activity: activity
                              }))}
                              offset={6}
                              scaleFactor={0.04}
                              onViewTicket={handleViewActivity}
                            />
                          ) : (
                            <div className="w-full h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-xl bg-sidebar dark:bg-[#252525] mb-4">
                              <svg className="h-8 w-8 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-sm font-medium">No Activities</p>
                            </div>
                          )}
                            </CardContent>
                          </Card>
                    </div>

                    {/* Row 2-3: Chart Area */}
                    <div className="flex-shrink-0">
                      <Card className="@container/card h-full">
                        <CardContent className="p-0">
                          <ChartAreaInteractive />
                        </CardContent>
                        <CardHeader className="pt-0">
                          <CardTitle>Analytics Overview</CardTitle>
                          <CardDescription>Administrative trends and performance metrics</CardDescription>
                        </CardHeader>
                      </Card>
                    </div>

                    {/* Row 3: Quick Actions */}
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      {/* Quick Actions */}
                      <Card className="@container/card">
                        <CardHeader className="relative">
                          <CardDescription>Quick Actions</CardDescription>
                          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 text-primary">⚡</div>
                              Actions
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1 text-sm">
                          <div className="line-clamp-1 flex gap-2 font-medium">
                            Available
                          </div>
                          <div className="text-muted-foreground text-xs">Quick access to common administrative tasks</div>
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleCardClick('/admin/tickets')}>
                              <TicketIcon className="h-4 w-4 mr-1" />
                              Tickets
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCardClick('/admin/announcements')}>
                              <Megaphone className="h-4 w-4 mr-1" />
                              Announce
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>

                      {/* System Health */}
                      <Card className="@container/card">
                        <CardHeader className="relative">
                          <CardDescription>System Health</CardDescription>
                          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 text-primary">💚</div>
                              Healthy
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1 text-sm">
                          <div className="line-clamp-1 flex gap-2 font-medium">
                            All Systems
                          </div>
                          <div className="text-muted-foreground text-xs">All administrative systems are running smoothly</div>
                        </CardFooter>
                      </Card>
                    </div>

                  </div>

              </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
