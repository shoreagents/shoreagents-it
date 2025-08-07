"use client"

import { useState, useEffect, useMemo } from "react"
import { TrendingDownIcon, TrendingUpIcon, TicketIcon } from "lucide-react"
import { IconCalendar, IconClock } from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NumberFlow from '@number-flow/react'

import { motion, AnimatePresence } from "framer-motion"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { CardStack } from "@/components/ui/card-stack"
import { TicketDetailModal } from "@/components/modals/ticket-detail-modal"

import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Ticket {
  id: number
  ticket_id: string
  user_id: number
  concern: string
  details: string | null
  category: string
  category_id: number | null
  category_name?: string
  status: string
  position: number
  resolved_by: number | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  role_id: number | null
  station_id: string | null
  profile_picture: string | null
  first_name: string | null
  last_name: string | null
  employee_id: string | null
  resolver_first_name?: string | null
  resolver_last_name?: string | null
  user_type?: string | null
  member_name?: string | null
  member_color?: string | null
}

interface TicketStats {
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

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [prevDirection, setPrevDirection] = useState<'positive' | 'negative' | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedTicket(null)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tickets
        const ticketsResponse = await fetch('/api/tickets')
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json()
          setTickets(ticketsData)
        }

        // Fetch stats if user is available
        if (user?.id) {
          console.log('Fetching stats for user:', user.id)
          const statsResponse = await fetch(`/api/tickets/stats?userId=${user.id}`)
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            console.log('Fetched stats:', statsData)
            setStats(statsData)
          } else {
            console.error('Stats response not ok:', statsResponse.status)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  // Calculate active tickets (all tickets except closed ones and For Approval)
  const activeTickets = tickets.filter(ticket => ticket.status !== 'Closed' && ticket.status !== 'For Approval')
  const activeTicketsCount = activeTickets.length
  
  // Calculate all closed tickets
  const allClosedTickets = tickets.filter(ticket => ticket.status === 'Closed')
  const allClosedTicketsCount = allClosedTickets.length

  console.log('Ticket counts:', {
    totalTickets: tickets.length,
    allClosedTickets: allClosedTicketsCount,
    activeTickets: activeTicketsCount,
    userId: user?.id
  })
  
  // Get the current closed tickets value based on viewMode
  const getCurrentClosedTicketsValue = () => {
    if (stats) {
      switch (viewMode) {
        case 'daily':
          return stats.daily.current
        case 'weekly':
          return stats.weekly.current
        case 'monthly':
          return stats.monthly.current
        default:
          return stats.daily.current
      }
    }
    // If no stats available, show 0 for all periods
    return 0
  }

  // Memoize the closed tickets value to prevent unnecessary re-renders
  const currentClosedTicketsValue = useMemo(() => getCurrentClosedTicketsValue(), [stats, viewMode, allClosedTicketsCount])

  // Get current direction and check if it changed
  const getCurrentDirection = () => {
    if (!stats) return 'positive'
    switch (viewMode) {
      case 'daily':
        return stats.daily.change >= 0 ? 'positive' : 'negative'
      case 'weekly':
        return stats.weekly.change >= 0 ? 'positive' : 'negative'
      case 'monthly':
        return stats.monthly.change >= 0 ? 'positive' : 'negative'
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
  
  // Calculate tickets by status (excluding For Approval)
  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status && ticket.status !== 'For Approval').length
  }
  
  const statusCounts = {
    approved: getTicketsByStatus('Approved'),
    inProgress: getTicketsByStatus('In Progress'),
    stuck: getTicketsByStatus('Stuck'),
    actioned: getTicketsByStatus('Actioned'),
    onHold: getTicketsByStatus('On Hold'),
    closed: getTicketsByStatus('Closed')
  }
  
  // Get status colors (same as tickets page)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20"
      case "In Progress":
        return "text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20"
      case "Stuck":
        return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
      case "Actioned":
        return "text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20"
      case "On Hold":
        return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
      case "Closed":
        return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
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
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Overview of your IT support system and metrics.</p>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
                  {/* Recent Tickets Skeleton */}
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
                  
                  {/* Column 1: Recent Tickets and Internet Speed - smaller width */}
                  <div className="flex flex-col gap-4 md:col-span-1 h-full">
                    {/* Recent Tickets - takes up 2 rows worth of space */}
                    <div className="flex-1">
                      <Card className="@container/card h-full flex flex-col">
                        <CardHeader className="relative flex-shrink-0">
                          <CardDescription>New Tickets</CardDescription>
                        </CardHeader>
                        <CardContent className="px-2 sm:px-6 flex-1 overflow-hidden">
                          <div className="space-y-3 h-full max-h-[500px] overflow-y-auto">
                            {(() => {
                              const approvedTickets = tickets.filter(ticket => ticket.status === 'Approved')

                              const getCategoryBadge = (ticket: Ticket) => {
                                const categoryColors: Record<string, string> = {
                                  'Computer & Equipment': 'bg-blue-100 text-blue-800',
                                  'Network & Internet': 'bg-cyan-100 text-cyan-800',
                                  'Station': 'bg-purple-100 text-purple-800',
                                  'Surroundings': 'bg-green-100 text-green-800',
                                  'Schedule': 'bg-yellow-100 text-yellow-800',
                                  'Compensation': 'bg-orange-100 text-orange-800',
                                  'Transport': 'bg-indigo-100 text-indigo-800',
                                  'Suggestion': 'bg-pink-100 text-pink-800',
                                  'Check-in': 'bg-gray-100 text-gray-800'
                                }
                                
                                return {
                                  name: ticket.category_name || 'Technical Issue',
                                  color: categoryColors[ticket.category_name || ''] || 'bg-gray-100 text-gray-800'
                                }
                              }
                              
                              if (approvedTickets.length === 0) {
                                return (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <TicketIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No approved tickets found</p>
                                  </div>
                                )
                              }
                             
                              return approvedTickets.map((ticket, index) => {
                                const categoryBadge = getCategoryBadge(ticket)
                                return (
                                <div key={ticket.id} className="rounded-xl border bg-sidebar dark:bg-[#252525] p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src="" alt={`User ${ticket.id}`} />
                                        <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                                          {ticket.first_name && ticket.last_name 
                                            ? `${ticket.first_name[0]}${ticket.last_name[0]}`
                                            : String(ticket.id).split('').map(n => n[0]).join('')
                                          }
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm font-medium text-foreground">
                                        {ticket.first_name && ticket.last_name ? `${ticket.first_name} ${ticket.last_name}` : `User ${ticket.id}`}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 min-w-0">
                                      <div className="flex justify-end">
                                        <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-[6px] h-6 flex items-center">
                                          #{ticket.ticket_id || ticket.id}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground min-w-0">
                                        <div className="flex items-center gap-1">
                                          <IconCalendar className="size-3 text-muted-foreground" />
                                          <span className="whitespace-nowrap font-medium text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <span className="text-muted-foreground">•</span>
                                        <div className="flex items-center gap-1">
                                          <IconClock className="size-3 text-muted-foreground" />
                                          <span className="whitespace-nowrap font-mono text-muted-foreground">{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                              })
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Internet Speed - Row 3 */}
                    <div className="flex-1">
                      <Card className="@container/card h-full">
                        <CardHeader className="relative">
                          <CardDescription>Internet Speed</CardDescription>
                          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 text-primary">🌐</div>
                              150 Mbps
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1 text-sm">
                          <div className="line-clamp-1 flex gap-2 font-medium mb-2">
                            Network Status
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs rounded-xl text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20">
                              Excellent <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600/20 dark:bg-green-600/40 text-green-700 dark:text-white text-xs ml-1">✓</span>
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
                    
                    {/* Row 1: Active, Closed Tickets, and New Card */}
                    <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                      {/* Active Tickets */}
                      <Card className="@container/card">
                        <CardHeader className="relative h-32">
                          <CardDescription>Active Tickets</CardDescription>
                          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                            <div className="flex items-center gap-2">
                              <TicketIcon className="h-6 w-6 text-primary" />
                              {activeTicketsCount}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        {(statusCounts.approved > 0 || statusCounts.inProgress > 0 || statusCounts.stuck > 0 || statusCounts.actioned > 0 || statusCounts.onHold > 0) && (
                          <CardFooter className="flex-col items-start gap-1 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium mb-2">
                              Status Breakdown
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {statusCounts.approved > 0 && (
                                <Badge variant="outline" className={`text-xs rounded-xl ${getStatusColor('Approved')}`}>
                                  New <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/20 dark:bg-blue-600/40 text-blue-700 dark:text-white text-xs ml-1">{statusCounts.approved}</span>
                                </Badge>
                              )}
                              {statusCounts.inProgress > 0 && (
                                <Badge variant="outline" className={`text-xs rounded-xl ${getStatusColor('In Progress')}`}>
                                  In Progress <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-600/20 dark:bg-orange-600/40 text-orange-700 dark:text-white text-xs ml-1">{statusCounts.inProgress}</span>
                                </Badge>
                              )}
                              {statusCounts.stuck > 0 && (
                                <Badge variant="outline" className={`text-xs rounded-xl ${getStatusColor('Stuck')}`}>
                                  Stuck <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600/20 dark:bg-red-600/40 text-red-700 dark:text-white text-xs ml-1">{statusCounts.stuck}</span>
                                </Badge>
                              )}
                              {statusCounts.actioned > 0 && (
                                <Badge variant="outline" className={`text-xs rounded-xl ${getStatusColor('Actioned')}`}>
                                  Actioned <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600/20 dark:bg-purple-600/40 text-purple-700 dark:text-white text-xs ml-1">{statusCounts.actioned}</span>
                                </Badge>
                              )}
                              {statusCounts.onHold > 0 && (
                                <Badge variant="outline" className={`text-xs rounded-xl ${getStatusColor('On Hold')}`}>
                                  On Hold <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-600/20 dark:bg-gray-600/40 text-gray-700 dark:text-white text-xs ml-1">{statusCounts.onHold}</span>
                                </Badge>
                              )}
                            </div>
                          </CardFooter>
                        )}
                      </Card>

                      {/* Closed Tickets */}
                      <Card className="@container/card">
                        <CardHeader className="relative h-32">
                          <CardDescription>Closed Tickets</CardDescription>
                          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                            <div className="flex items-center gap-2">
                              <TicketIcon className="h-6 w-6 text-primary" />
                              <NumberFlow 
                                value={currentClosedTicketsValue}
                                transformTiming={{ duration: 750, easing: 'ease-out' }}
                                spinTiming={{ duration: 750, easing: 'ease-out' }}
                                opacityTiming={{ duration: 350, easing: 'ease-out' }}
                                className="tabular-nums"
                                style={{ '--number-flow-mask-height': '0.1em' } as React.CSSProperties}
                              />
                            </div>
                          </CardTitle>
                          <div className="absolute right-4 top-4">
                            <motion.div
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className={`grid grid-cols-3 gap-1 rounded-lg text-xs bg-sidebar dark:bg-[#252525] transition-all duration-500 ease-out px-1.5 py-0.5 border w-20 h-6 items-center ${
                                stats ? (
                                  viewMode === 'daily' ? (stats.daily.change >= 0 ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-600/30' : 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-600/30') :
                                  viewMode === 'weekly' ? (stats.weekly.change >= 0 ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-600/30' : 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-600/30') :
                                  (stats.monthly.change >= 0 ? 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-600/30' : 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-600/30')
                                ) : 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-600/30'
                              }`}
                            >
                              {stats ? (
                                <>
                                  {viewMode === 'daily' ? (
                                    <>
                                      <motion.div
                                        key="daily-icon"
                                        layoutId="daily-icon"
                                        className="flex items-center justify-center"
                                      >
                                        {stats.daily.change >= 0 ? (
                                          <motion.div
                                            key="up"
                                            initial={directionChanged ? { opacity: 0, rotate: -90 } : { opacity: 1, rotate: 0 }}
                                            animate={{ opacity: 1, rotate: 0 }}
                                            transition={{ duration: directionChanged ? 0.3 : 0, ease: "easeOut" }}
                                          >
                                            <TrendingUpIcon className="size-3" />
                                          </motion.div>
                                        ) : (
                                          <motion.div
                                            key="down"
                                            initial={directionChanged ? { opacity: 0, rotate: 90 } : { opacity: 1, rotate: 0 }}
                                            animate={{ opacity: 1, rotate: 0 }}
                                            transition={{ duration: directionChanged ? 0.3 : 0, ease: "easeOut" }}
                                          >
                                            <TrendingDownIcon className="size-3" />
                                          </motion.div>
                                        )}
                                      </motion.div>
                                      <div className="flex items-center justify-center">
                                        <AnimatePresence mode="wait">
                                          {stats.daily.change >= 0 ? (
                                            <motion.span
                                              key="plus"
                                              initial={{ opacity: 0, scale: 0.8 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              exit={{ opacity: 0, scale: 0.8 }}
                                              transition={{ duration: 0.2, ease: "easeOut" }}
                                            >
                                              +
                                            </motion.span>
                                          ) : (
                                            <motion.span
                                              key="minus"
                                              initial={{ opacity: 0, scale: 0.8 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              exit={{ opacity: 0, scale: 0.8 }}
                                              transition={{ duration: 0.2, ease: "easeOut" }}
                                            >
                                              -
                                            </motion.span>
                                          )}
                                        </AnimatePresence>
                                        <NumberFlow 
                                          value={Math.round(Math.abs(stats.daily.change))}
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
                                    </>
                                  ) : viewMode === 'weekly' ? (
                                    <>
                                      <motion.div
                                        key="weekly-icon"
                                        layoutId="weekly-icon"
                                        className="flex items-center justify-center"
                                      >
                                        {stats.weekly.change >= 0 ? (
                                          <motion.div
                                            key="up"
                                            initial={directionChanged ? { opacity: 0, rotate: -90 } : { opacity: 1, rotate: 0 }}
                                            animate={{ opacity: 1, rotate: 0 }}
                                            transition={{ duration: directionChanged ? 0.3 : 0, ease: "easeOut" }}
                                          >
                                            <TrendingUpIcon className="size-3" />
                                          </motion.div>
                                        ) : (
                                          <motion.div
                                            key="down"
                                            initial={directionChanged ? { opacity: 0, rotate: 90 } : { opacity: 1, rotate: 0 }}
                                            animate={{ opacity: 1, rotate: 0 }}
                                            transition={{ duration: directionChanged ? 0.3 : 0, ease: "easeOut" }}
                                          >
                                            <TrendingDownIcon className="size-3" />
                                          </motion.div>
                                        )}
                                      </motion.div>
                                      <div className="flex items-center justify-center">
                                        <AnimatePresence mode="wait">
                                          {stats.weekly.change >= 0 ? (
                                            <motion.span
                                              key="plus"
                                              initial={{ opacity: 0, scale: 0.8 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              exit={{ opacity: 0, scale: 0.8 }}
                                              transition={{ duration: 0.2, ease: "easeOut" }}
                                            >
                                              +
                                            </motion.span>
                                          ) : (
                                            <motion.span
                                              key="minus"
                                              initial={{ opacity: 0, scale: 0.8 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              exit={{ opacity: 0, scale: 0.8 }}
                                              transition={{ duration: 0.2, ease: "easeOut" }}
                                            >
                                              -
                                            </motion.span>
                                          )}
                                        </AnimatePresence>
                                        <NumberFlow 
                                          value={Math.round(Math.abs(stats.weekly.change))}
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
                                    </>
                                  ) : (
                                    <>
                                      <motion.div
                                        key="monthly-icon"
                                        layoutId="monthly-icon"
                                        className="flex items-center justify-center"
                                      >
                                        {stats.monthly.change >= 0 ? (
                                          <motion.div
                                            key="up"
                                            initial={directionChanged ? { opacity: 0, rotate: -90 } : { opacity: 1, rotate: 0 }}
                                            animate={{ opacity: 1, rotate: 0 }}
                                            transition={{ duration: directionChanged ? 0.3 : 0, ease: "easeOut" }}
                                          >
                                            <TrendingUpIcon className="size-3" />
                                          </motion.div>
                                        ) : (
                                          <motion.div
                                            key="down"
                                            initial={directionChanged ? { opacity: 0, rotate: 90 } : { opacity: 1, rotate: 0 }}
                                            animate={{ opacity: 1, rotate: 0 }}
                                            transition={{ duration: directionChanged ? 0.3 : 0, ease: "easeOut" }}
                                          >
                                            <TrendingDownIcon className="size-3" />
                                          </motion.div>
                                        )}
                                      </motion.div>
                                      <div className="flex items-center justify-center">
                                        <AnimatePresence mode="wait">
                                          {stats.monthly.change >= 0 ? (
                                            <motion.span
                                              key="plus"
                                              initial={{ opacity: 0, scale: 0.8 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              exit={{ opacity: 0, scale: 0.8 }}
                                              transition={{ duration: 0.2, ease: "easeOut" }}
                                            >
                                              +
                                            </motion.span>
                                          ) : (
                                            <motion.span
                                              key="minus"
                                              initial={{ opacity: 0, scale: 0.8 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              exit={{ opacity: 0, scale: 0.8 }}
                                              transition={{ duration: 0.2, ease: "easeOut" }}
                                            >
                                              -
                                            </motion.span>
                                          )}
                                        </AnimatePresence>
                                        <NumberFlow 
                                          value={Math.round(Math.abs(stats.monthly.change))}
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
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <motion.div
                                    key="fallback-icon"
                                    animate={{ rotate: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="flex items-center justify-center"
                                  >
                                    <TrendingUpIcon className="size-3" />
                                  </motion.div>
                                  <div className="flex items-center justify-center">
                                    <motion.span
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.2, ease: "easeOut" }}
                                    >
                                      +
                                    </motion.span>
                                    <NumberFlow 
                                      value={0}
                                      transformTiming={{ duration: 500, easing: 'ease-out' }}
                                      spinTiming={{ duration: 500, easing: 'ease-out' }}
                                      opacityTiming={{ duration: 250, easing: 'ease-out' }}
                                      className="tabular-nums"
                                      style={{ '--number-flow-mask-height': '0.05em' } as React.CSSProperties}
                                    />
                                  </div>
                                  <div className="flex items-center justify-center">
                                    %
                                  </div>
                                </>
                              )}
                            </motion.div>
                          </div>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1 text-sm">
                          <div className="line-clamp-1 flex gap-2 font-medium">
                            {stats ? (
                              viewMode === 'daily' ? (stats.daily.change >= 0 ? 'Uptrend Today' : 'Downtrend Today') :
                              viewMode === 'weekly' ? (stats.weekly.change >= 0 ? 'Uptrend This Week' : 'Downtrend This Week') :
                              (stats.monthly.change >= 0 ? 'Uptrend This Month' : 'Downtrend This Month')
                            ) : 'Resolved Requests'}
                          </div>
                          <div className="text-muted-foreground text-xs">Total tickets that have been resolved.</div>
                          <div className="mt-2">
                            <AnimatedTabs
                              tabs={[
                                { title: "Today", value: "daily" },
                                { title: "This Week", value: "weekly" },
                                { title: "This Month", value: "monthly" }
                              ]}
                              containerClassName="bg-sidebar/20 rounded-lg"
                              activeTabClassName="bg-sidebar-accent"
                              tabClassName="text-xs text-muted-foreground hover:text-foreground"
                              onTabChange={(tab) => setViewMode(tab.value as 'daily' | 'weekly' | 'monthly')}
                            />
                          </div>
                        </CardFooter>
                      </Card>

                      {/* Card Stack */}
                      <Card className="@container/card h-full flex flex-col">
                                                  <CardHeader className={`relative flex-shrink-0 ${tickets.filter(ticket => ticket.status === 'Approved').length > 0 ? 'pb-0' : 'pb-3'}`}>
                            <CardDescription>Recent Tickets</CardDescription>
                            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                              
                            </CardTitle>
                          </CardHeader>

                        <CardContent className="px-2 sm:px-6 flex-1 overflow-visible flex items-center justify-center min-h-[220px] pb-0">
                          {tickets.filter(ticket => ticket.status === 'Approved').length > 0 ? (
                                                      <CardStack
                            items={tickets
                              .filter(ticket => ticket.status === 'Approved')
                              .slice(0, 3)
                              .map((ticket) => ({
                                id: ticket.id,
                                name: ticket.first_name && ticket.last_name 
                                  ? `${ticket.first_name} ${ticket.last_name}` 
                                  : `User ${ticket.user_id}`,
                                designation: `${ticket.ticket_id}`,
                                content: ticket.concern || "No concern details",
                                created_at: ticket.created_at,
                                ticket: ticket
                              }))}
                            offset={6}
                            scaleFactor={0.04}
                            onViewTicket={handleViewTicket}
                          />
                          ) : (
                            <div className="w-full h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-xl bg-sidebar dark:bg-[#252525] mb-4">
                              <svg className="h-8 w-8 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-sm font-medium">No Tickets</p>
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
                          <CardDescription>Ticket trends and performance metrics</CardDescription>
                        </CardHeader>
                      </Card>
                    </div>

                    {/* Row 3: Two new cards */}
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      {/* New Card 1 */}
                      <Card className="@container/card">
                        <CardHeader className="relative">
                          <CardDescription>New Card 1</CardDescription>
                          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 text-primary">📊</div>
                              Data
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1 text-sm">
                          <div className="line-clamp-1 flex gap-2 font-medium">
                            Status
                          </div>
                          <div className="text-muted-foreground text-xs">Description for new card 1</div>
                        </CardFooter>
                      </Card>

                      {/* New Card 2 */}
                      <Card className="@container/card">
                        <CardHeader className="relative">
                          <CardDescription>New Card 2</CardDescription>
                          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 text-primary">⚡</div>
                              Metrics
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1 text-sm">
                          <div className="line-clamp-1 flex gap-2 font-medium">
                            Performance
                          </div>
                          <div className="text-muted-foreground text-xs">Description for new card 2</div>
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
      
      <TicketDetailModal 
        ticket={selectedTicket as any}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </>
  )
} 