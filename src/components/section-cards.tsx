import { useState, useEffect } from "react"
import { TrendingDownIcon, TrendingUpIcon, TicketIcon, CheckCircleIcon, CalendarIcon } from "lucide-react"
import NumberFlow, { NumberFlowGroup } from '@number-flow/react'
import { motion, AnimatePresence } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Ticket {
  id: number
  status: string
  created_at: string
  resolved_at: string | null
  resolved_by: number | null
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

interface SectionCardsProps {
  tickets?: Ticket[]
  currentUserId?: string
  stats?: TicketStats | null
}

export function SectionCards({ tickets = [], currentUserId, stats }: SectionCardsProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [prevDirection, setPrevDirection] = useState<'positive' | 'negative' | null>(null)
  
  // Calculate active tickets (all tickets except closed ones and For Approval)
  const activeTickets = tickets.filter(ticket => ticket.status !== 'Closed' && ticket.status !== 'For Approval')
  const activeTicketsCount = activeTickets.length
  
  // Calculate all closed tickets (not just by current user)
  const closedTickets = tickets.filter(ticket => ticket.status === 'Closed')
  const closedTicketsCount = closedTickets.length
  
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
    return closedTicketsCount
  }

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
      default:
        return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
    }
  }
  return (
    <div className="*:data-[slot=card]:shadow-xs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
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
      <Card className="@container/card">
        <NumberFlowGroup>
          <CardHeader className="relative">
            <CardDescription>Closed Tickets</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              <div className="flex items-center gap-2">
                <TicketIcon className="h-6 w-6 text-primary" />
                <NumberFlow 
                  value={getCurrentClosedTicketsValue()}
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
                className={`grid grid-cols-[40%_60%] rounded-lg text-xs bg-sidebar dark:bg-[#252525] transition-all duration-500 ease-out px-1.5 py-0.5 border w-20 h-6 items-center ${
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
                              value={Math.abs(stats.daily.change)}
                              transformTiming={{ duration: 500, easing: 'ease-out' }}
                              spinTiming={{ duration: 500, easing: 'ease-out' }}
                              opacityTiming={{ duration: 250, easing: 'ease-out' }}
                              className="tabular-nums"
                              style={{ '--number-flow-mask-height': '0.05em' } as React.CSSProperties}
                            />%
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
                              value={Math.abs(stats.weekly.change)}
                              transformTiming={{ duration: 500, easing: 'ease-out' }}
                              spinTiming={{ duration: 500, easing: 'ease-out' }}
                              opacityTiming={{ duration: 250, easing: 'ease-out' }}
                              className="tabular-nums"
                              style={{ '--number-flow-mask-height': '0.05em' } as React.CSSProperties}
                            />%
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
                              value={Math.abs(stats.monthly.change)}
                              transformTiming={{ duration: 500, easing: 'ease-out' }}
                              spinTiming={{ duration: 500, easing: 'ease-out' }}
                              opacityTiming={{ duration: 250, easing: 'ease-out' }}
                              className="tabular-nums"
                              style={{ '--number-flow-mask-height': '0.05em' } as React.CSSProperties}
                            />%
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
                        value={Math.round((closedTicketsCount / Math.max(activeTicketsCount, 1)) * 100)}
                        transformTiming={{ duration: 500, easing: 'ease-out' }}
                        spinTiming={{ duration: 500, easing: 'ease-out' }}
                        opacityTiming={{ duration: 250, easing: 'ease-out' }}
                        className="tabular-nums"
                        style={{ '--number-flow-mask-height': '0.05em' } as React.CSSProperties}
                      />%
                    </div>
                  </>
                )}
                </motion.div>
            </div>
          </CardHeader>
                  </NumberFlowGroup>
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
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            45,678
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              +12.5%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Engagement exceed targets</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            4.5%
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              +4.5%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady performance <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>
      </Card>
    </div>
  )
}
