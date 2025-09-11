
"use client"

import * as React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { TicketDetailModal } from "@/components/modals/ticket-detail-modal"
import {
  SidebarInset,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ReloadButton } from "@/components/ui/reload-button"
import { Skeleton } from "@/components/ui/skeleton"


import { IconSearch, IconFilter, IconGripVertical, IconCalendar, IconClock, IconEye, IconMessage } from "@tabler/icons-react"
import { useRealtimeTickets } from "@/hooks/use-realtime-tickets"
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"

type TicketStatus = 'On Hold' | 'In Progress' | 'Approved' | 'Stuck' | 'Actioned' | 'Closed'
interface TicketCategory {
  id: number
  name: string
}

interface Ticket {
  id: number
  ticket_id: string
  user_id: number
  concern: string
  details: string | null
  category: string
  category_id: number | null
  category_name?: string
  status: TicketStatus
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

interface SortableTicketProps {
  ticket: Ticket
  isLast?: boolean
  isExpanded: boolean
  onToggleExpanded: (ticketId: string) => void
  onViewAll: (ticket: Ticket) => void
  user: any
}

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
    name: ticket.category_name || ticket.category,
    color: categoryColors[ticket.category_name || ticket.category] || 'bg-gray-100 text-gray-800'
  }
}

const SortableTicket = React.memo(function SortableTicket({ ticket, isLast = false, isExpanded, onToggleExpanded, onViewAll, user }: SortableTicketProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id.toString() })

  const style = useMemo(() => {
    return {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }
  }, [transform, transition, isDragging])

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    
    // Check if the click target is an interactive element that should not trigger card expansion
    if (target.closest('[data-drag-handle]') || 
        target.closest('.cursor-grab') ||
        target.closest('[data-radix-popover-trigger]') ||
        target.closest('[role="button"]') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('[data-state]') ||
        target.closest('[aria-expanded]') ||
        target.closest('[aria-haspopup]') ||
        target.closest('[aria-controls]') ||
        target.closest('.popover-trigger') ||
        target.closest('.status-badge') ||
        target.closest('.interactive-element')) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    // Additional check: if the target has any data-* attributes, it's likely interactive
    if (target.hasAttribute('data-') || target.closest('[data-]')) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    onToggleExpanded(ticket.id.toString())
  }, [onToggleExpanded, ticket.id])


  const handleChatClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if we're in Electron environment
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.openChatWindow(ticket.id, ticket)
        .then((result: any) => {
          if (result.success) {
            console.log('Chat window opened successfully')
          } else {
            console.error('Failed to open chat window:', result.error)
          }
        })
        .catch((error: any) => {
          console.error('Error opening chat window:', error)
        })
    } else {
      // Fallback for web environment - could open in new tab or modal
      console.log('Opening chat for ticket:', ticket.id)
      // You could implement a web fallback here
    }
  }, [ticket])



  // Cleanup effect for animations
  useEffect(() => {
    return () => {
      // Ensure animations are properly cleaned up when component unmounts
      // No need to clean up expanded state as it's managed globally
    }
  }, [])

  const categoryBadge = useMemo(() => getCategoryBadge(ticket), [ticket.category, ticket.category_name])

  const cardClassName = useMemo(() => {
    return `${isLast ? '' : 'mb-3'} p-4 transition-all duration-200 cursor-pointer overflow-hidden bg-sidebar dark:bg-[#252525] ticket-card w-full hover:border-primary/50 hover:text-primary ${
      isDragging ? 'opacity-50' : ''
    }`
  }, [isDragging, isLast])

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cardClassName}
      onClick={handleCardClick}
    >
      <div className="flex flex-col mb-3">
        <div className="flex-1 min-w-0 relative">
          <div 
            className="cursor-grab active:cursor-grabbing transition-colors duration-200 absolute top-0 right-0"
            data-drag-handle
            {...attributes}
            {...listeners}
          >
            <IconGripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col text-xs text-muted-foreground py-1 rounded-none mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-[6px] h-6 flex items-center">
                  {ticket.ticket_id}
                </span>
                <Badge variant="secondary" className={`text-xs h-6 flex items-center ${categoryBadge?.color || 'bg-gray-100 text-gray-800'}`}>
                  {categoryBadge?.name || 'General'}
                </Badge>
              </div>
            </div>
          </div>
                      <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={ticket.profile_picture || ''} alt={`User ${ticket.user_id}`} />
                <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                  {ticket.first_name && ticket.last_name 
                    ? `${ticket.first_name[0]}${ticket.last_name[0]}`
                    : String(ticket.user_id).split(' ').map(n => n[0]).join('')
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-foreground truncate">
                  {ticket.first_name && ticket.last_name 
                    ? `${ticket.first_name} ${ticket.last_name}`
                    : `User ${ticket.user_id}`
                  }
                </span>
              </div>

            </div>
          <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mt-6">
            <span className="text-xs font-medium text-muted-foreground/70">Concern:</span>
            <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">{ticket.concern}</h4>
          </div>
        </div>
      </div>
                    <AnimatePresence>
         {isExpanded && (
           <motion.div
             initial={{ height: 0 }}
             animate={{ height: "auto" }}
             exit={{ height: 0 }}
             transition={{ duration: 0.1, ease: "easeOut" }}
             className="mt-3 overflow-hidden"
           >
                           <div className="space-y-3">
                                {ticket.details && (
                  <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mb-6">
                    <span className="text-xs font-medium text-muted-foreground/70">Additional Details:</span>
                    <p className="text-sm text-primary leading-relaxed break-words mt-1">{ticket.details}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                 <Button 
                   size="sm" 
                   variant="muted" 
                   className="text-sm h-8 flex-1 rounded-lg inline-flex items-center"
                   onClick={handleChatClick}
                 >
                   <IconMessage className="h-4 w-4 mr-px" />
                   <span>Chat</span>
                 </Button>
                 <Button 
                   size="sm" 
                   variant="muted" 
                   className="text-sm h-8 flex-1 rounded-lg inline-flex items-center"
                   onClick={(e) => {
                     e.preventDefault()
                     e.stopPropagation()
                     onViewAll(ticket)
                   }}
                 >
                    <IconEye className="h-4 w-4 mr-px" />
                   <span>View All</span>
                 </Button>
               </div>
             </div>
           </motion.div>
                  )}
       </AnimatePresence>
      <div className="pt-3 mt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground/70 truncate">
            <span>Filed at:</span>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">
              {new Date(ticket.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              })}
            </span>
            <span className="text-muted-foreground/70">•</span>
            <IconClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {new Date(ticket.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </div>
          {ticket.status === 'Closed' && ticket.resolved_at && (
            <span className="text-xs font-medium text-muted-foreground/70 truncate">
              Resolved by: <span className="text-foreground font-medium">
                {ticket.resolved_by === parseInt(user?.id || '0') 
                  ? 'You'
                  : (ticket.resolver_first_name && ticket.resolver_last_name 
                      ? `${ticket.resolver_first_name}`
                      : (ticket.resolved_by ? `User ${ticket.resolved_by}` : 'Unknown')
                    )
                }
              </span>
            </span>
          )}
        </div>
      </div>
      </Card>
  )
})

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case "On Hold":
        return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
      case "In Progress":
        return "text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20"
      case "Approved":
        return "text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20"
      case "Stuck":
        return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
      case "Actioned":
        return "text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20"
      case "Closed":
        return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
      default:
        return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
    }
  }

  const getCircleColor = (status: TicketStatus) => {
    switch (status) {
      case "On Hold":
        return "bg-gray-600/20 dark:bg-gray-600/40 text-gray-700 dark:text-white"
      case "In Progress":
        return "bg-orange-600/20 dark:bg-orange-600/40 text-orange-700 dark:text-white"
      case "Approved":
        return "bg-blue-600/20 dark:bg-blue-600/40 text-blue-700 dark:text-white"
      case "Stuck":
        return "bg-red-600/20 dark:bg-red-600/40 text-red-700 dark:text-white"
      case "Actioned":
        return "bg-purple-600/20 dark:bg-purple-600/40 text-purple-700 dark:text-white"
      case "Closed":
        return "bg-green-600/20 dark:bg-green-600/40 text-green-700 dark:text-white"
      default:
        return "bg-gray-600/20 dark:bg-gray-600/40 text-gray-700 dark:text-white"
    }
  }

function TicketSkeleton() {
  return (
    <Card className="mb-3 p-4 overflow-hidden bg-sidebar dark:bg-[#252525] ticket-card w-full rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-12 mt-1" />
        </div>
        <Skeleton className="h-6 w-14 rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </Card>
  )
}

function DraggingTicket({ ticket, isExpanded, user }: { ticket: Ticket; isExpanded: boolean; user: any }) {
  const categoryBadge = getCategoryBadge(ticket)
  
  return (
    <Card className="mb-3 p-4 cursor-grabbing overflow-hidden bg-sidebar dark:bg-[#252525] border-primary">
      <div className="flex flex-col mb-3">
        <div className="flex-1 min-w-0 relative">
          <div 
            className="cursor-grab active:cursor-grabbing transition-colors duration-200 absolute top-0 right-0"
            data-drag-handle
          >
            <IconGripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col text-xs text-muted-foreground py-1 rounded-none mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-[6px] h-6 flex items-center">
                  {ticket.ticket_id}
                </span>
                <Badge variant="secondary" className={`text-xs h-6 flex items-center ${categoryBadge?.color || 'bg-gray-100 text-gray-800'}`}>
                  {categoryBadge?.name || 'General'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={ticket.profile_picture || ''} alt={`User ${ticket.user_id}`} />
              <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                {ticket.first_name && ticket.last_name 
                  ? `${ticket.first_name[0]}${ticket.last_name[0]}`
                  : String(ticket.user_id).split(' ').map(n => n[0]).join('')
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-foreground truncate">
                {ticket.first_name && ticket.last_name 
                  ? `${ticket.first_name} ${ticket.last_name}`
                  : `User ${ticket.user_id}`
                }
              </span>

            </div>

          </div>
          <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mt-6">
            <span className="text-xs font-medium text-muted-foreground/70">Concern:</span>
            <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">{ticket.concern}</h4>
          </div>
        </div>
      </div>
      
        {isExpanded && (
          <div className="mt-3 overflow-hidden">
            <div className="space-y-3">
              {ticket.details && (
                <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mb-6">
                  <span className="text-xs font-medium text-muted-foreground/70">Additional Details:</span>
                  <p className="text-sm text-primary leading-relaxed break-words mt-1">{ticket.details}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="muted" 
                  className="text-sm h-8 flex-1 rounded-lg inline-flex items-center"
                >
                  <IconMessage className="h-4 w-4 mr-px" />
                  <span>Chat</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="muted" 
                  className="text-sm h-8 flex-1 rounded-lg inline-flex items-center"
                >
                  <IconEye className="h-4 w-4 mr-px" />
                  <span>View All</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      
      <div className="pt-3 mt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground/70 truncate">
            <span>Filed at:</span>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">
              {new Date(ticket.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              })}
            </span>
            <span className="text-muted-foreground/70">•</span>
            <IconClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {new Date(ticket.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </div>
          {ticket.status === 'Closed' && ticket.resolved_at && (
            <span className="text-xs font-medium text-muted-foreground/70 truncate">
              Resolved by: <span className="text-foreground font-medium">{ticket.resolved_by === parseInt(user?.id || '0') ? 'You' : (ticket.resolver_first_name && ticket.resolver_last_name ? `${ticket.resolver_first_name}` : (ticket.resolved_by ? `User ${ticket.resolved_by}` : 'Unknown'))}</span>
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

function TicketsSkeleton() {
  return (
    <div className="w-full h-[calc(100vh-240px)] px-4 lg:px-6">
      <div 
        className="flex gap-4 pb-4 overflow-x-auto overflow-y-auto w-full h-full scroll-container" 
        style={{ 
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          msOverflowStyle: 'none'
        }}
      >
        {["Approved", "In Progress", "Stuck", "Actioned", "Closed", "On Hold"].map((status) => (
          <div key={status} className="flex-shrink-0 min-w-[400px]">
            <div className="bg-card border border-border rounded-xl transition-all duration-200 flex flex-col shadow-sm min-h-[200px] max-h-[calc(94vh-200px)] status-cell">
              <div className="flex-shrink-0 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`px-3 py-1 font-medium rounded-xl ${
                      status === 'Approved' ? 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20' :
                      status === 'In Progress' ? 'text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20' :
                      status === 'Stuck' ? 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20' :
                      status === 'Actioned' ? 'text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20' :
                      status === 'Closed' ? 'text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20' :
                      status === 'On Hold' ? 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20' :
                      'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
                    }`}>
                      {status === 'Approved' ? 'New' : status} <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xl text-xs ml-1 ${
                        status === 'Approved' ? 'bg-blue-600/20 dark:bg-blue-600/40 text-blue-700 dark:text-white' :
                        status === 'In Progress' ? 'bg-orange-600/20 dark:bg-orange-600/40 text-orange-700 dark:text-white' :
                        status === 'Stuck' ? 'bg-red-600/20 dark:bg-red-600/40 text-red-700 dark:text-white' :
                        status === 'Actioned' ? 'bg-purple-600/20 dark:bg-purple-600/40 text-purple-700 dark:text-white' :
                        status === 'Closed' ? 'bg-green-600/20 dark:bg-green-600/40 text-green-700 dark:text-white' :
                        status === 'On Hold' ? 'bg-gray-600/20 dark:bg-gray-600/40 text-gray-700 dark:text-white' :
                        'bg-gray-600/20 dark:bg-gray-600/40 text-gray-700 dark:text-white'
                      }`}>
                        <Skeleton className="h-3 w-3 rounded-xl" />
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex-1 px-4 pb-4 cards-container">
                {Array.from({ length: 3 }).map((_, index) => (
                  <TicketSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface DroppableContainerProps {
  status: string
  children: React.ReactNode
}

function DroppableContainer({ status, children }: DroppableContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${status}`,
  })

  return (
    <div 
      ref={setNodeRef}
      className="h-full overflow-y-auto transition-colors duration-200"
    >
      {children}
    </div>
  )
}



export default function TicketsPage() {
  const [mounted, setMounted] = useState(false)
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set())
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  const { user } = useAuth()
  




  // Compute fractional insert position within a target list
  const calculateInsertPosition = (targetTickets: any[], dropIndex: number) => {
    const sorted = [...targetTickets].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    if (sorted.length === 0) return 1
    if (dropIndex <= 0) {
      const firstPos = sorted[0]?.position ?? 1
      return Math.max(0.1, Number(firstPos) / 2)
    }
    if (dropIndex >= sorted.length) {
      const lastPos = sorted[sorted.length - 1]?.position ?? 0
      return Number(lastPos) + 1
    }
    const prevPos = Number(sorted[dropIndex - 1].position ?? 0)
    const nextPos = Number(sorted[dropIndex].position ?? prevPos + 1)
    return Number(((prevPos + nextPos) / 2).toFixed(3))
  }

  // Disable body scroll when on tickets page
  useEffect(() => {
    document.body.classList.add('no-scroll')
    return () => {
      document.body.classList.remove('no-scroll')
    }
  }, [])

  // Real-time updates
  const { isConnected: isRealtimeConnected } = useRealtimeTickets({
    onTicketCreated: (newTicket) => {
      setTickets(prev => [...prev, newTicket])
    },
    onTicketUpdated: (updatedTicket, oldTicket) => {
      console.log('🔄 Real-time update received:', {
        ticketId: updatedTicket.id,
        changes: {
          status: oldTicket?.status !== updatedTicket.status ? `${oldTicket?.status} → ${updatedTicket.status}` : 'unchanged',
          position: oldTicket?.position !== updatedTicket.position ? `${oldTicket?.position} → ${updatedTicket.position}` : 'unchanged',
          clear: oldTicket?.clear !== updatedTicket.clear ? `${oldTicket?.clear} → ${updatedTicket.clear}` : 'unchanged'
        }
      })
      
      // Handle clear status changes - remove cleared tickets from view
      if (oldTicket?.clear !== updatedTicket.clear && updatedTicket.clear === true) {
        console.log('🧹 Ticket cleared - removing from view:', updatedTicket.id)
        setTickets(prev => prev.filter(ticket => ticket.id !== updatedTicket.id))
        return
      }
      
      // Handle unclear status changes - add uncleared tickets back to view if they should be visible
      if (oldTicket?.clear !== updatedTicket.clear && updatedTicket.clear === false) {
        console.log('🔄 Ticket uncleared - adding back to view:', updatedTicket.id)
        setTickets(prev => {
          const exists = prev.find(t => t.id === updatedTicket.id)
          if (!exists) {
            return [...prev, updatedTicket]
          }
          return prev
        })
        return
      }
      
      // For other updates, merge to preserve joined fields like member_name and user_type
      setTickets(prev => prev.map(ticket => 
        ticket.id === updatedTicket.id ? { ...ticket, ...updatedTicket } : ticket
      ))
    },
    onTicketDeleted: (deletedTicket) => {
      setTickets(prev => prev.filter(ticket => ticket.id !== deletedTicket.id))
    },
    roleFilter: 1,
    enableNotifications: true, // Enable notifications for new tickets
  })

  useEffect(() => {
    setMounted(true)
    fetchTickets()
  }, [])

  // Keyboard shortcuts for zooming
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault()
            setZoomLevel(prev => Math.min(1, prev + 0.1))
            break
          case '-':
            e.preventDefault()
            setZoomLevel(prev => Math.max(0.5, prev - 0.1))
            break
          case '0':
            e.preventDefault()
            setZoomLevel(1)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])




  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/tickets')
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to fetch tickets')
        console.error('Failed to fetch tickets:', response.status, errorData)
      }
    } catch (error) {
      setError('Network error - please check your connection')
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTicketStatus = async (ticketId: number, newStatus: string) => {
    try {
      const requestBody: any = { status: newStatus }
      
      // If the status is being changed to 'Closed', include the current user as resolvedBy
      if (newStatus === 'Closed' && user?.id) {
        // Convert string ID to number for the database
        requestBody.resolvedBy = parseInt(user.id)
      }
      
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      if (response.ok) {
        const result = await response.json()
        // Update with complete ticket data from server (no defensive merging needed)
        setTickets(prevTickets => prevTickets.map((item) => {
          if (item.id !== ticketId) return item
          return result
        }))
      } else {
        const errorData = await response.json()
        console.error('Failed to update ticket status:', errorData)
        // Don't refresh - optimistic update stays, user can retry if needed
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
      // Don't refresh - optimistic update stays, user can retry if needed
    }
  }

  const updateTicketPosition = async (ticketId: number, newPosition: number) => {
    try {
      const response = await fetch('/api/tickets/positions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          positions: [{ id: ticketId, position: newPosition }]
        }),
      })

      if (response.ok) {
        // Position already updated optimistically, no need to update again
        console.log('✅ Position updated successfully in database')
      } else {
        const errorData = await response.json()
        console.error('Failed to update ticket position:', errorData)
        // Don't refresh - optimistic update stays, user can retry if needed
      }
    } catch (error) {
      console.error('Error updating ticket position:', error)
      // Don't refresh - optimistic update stays, user can retry if needed
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    
    // Add global wheel listener for horizontal scroll during drag
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const container = document.querySelector('.scroll-container') as HTMLElement;
      if (container) {
        const scrollAmount = e.deltaY * 3; // Increased sensitivity for smoother scroll
        container.scrollLeft -= scrollAmount; // Reversed direction
      }
    };
    
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    // Store the handler to remove it later
    (window as any).dragWheelHandler = handleWheel;
  }

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event

    if (!active || !over) return

    const activeTicket = tickets.find((item) => item.id.toString() === active.id)
    if (!activeTicket) return



    // Handle dropping on a droppable zone (status column)
    if (over.id.toString().startsWith('droppable-')) {
      const targetStatus = over.id.toString().replace('droppable-', '') as TicketStatus
      if (activeTicket.status !== targetStatus) {
        // Update local state immediately for UI responsiveness
        setTickets(prevTickets => {
          return prevTickets.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: targetStatus }
              : item
          )
        })
        
        // Update database
        updateTicketStatus(activeTicket.id, targetStatus)
      }
      return
    }

    // Handle dropping on another ticket
    const overTicket = tickets.find((item) => item.id.toString() === over.id)
    if (overTicket && activeTicket.id !== overTicket.id) {
      // If dropping on a ticket in a different status, move to that status
      if (activeTicket.status !== overTicket.status) {
        // Update local state immediately for UI responsiveness
        setTickets(prevTickets => {
          return prevTickets.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: overTicket.status as TicketStatus }
              : item
          )
        })
        
        // Update database
        updateTicketStatus(activeTicket.id, overTicket.status)
      }
      // Note: For same status reordering, we let dnd-kit handle the visual reordering
      // and only update positions in handleDragEnd
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    
    // Remove wheel listener that was added during drag
    if ((window as any).dragWheelHandler) {
      document.removeEventListener('wheel', (window as any).dragWheelHandler);
      (window as any).dragWheelHandler = null;
    }

    if (!active || !over) return

    const activeTicket = tickets.find((item) => item.id.toString() === active.id)
    if (!activeTicket) return

    // Handle dropping on a droppable zone (status column)
    if (over.id.toString().startsWith('droppable-')) {
      const targetStatus = over.id.toString().replace('droppable-', '') as TicketStatus
      
      if (activeTicket.status !== targetStatus) {
        // Update local state immediately for UI responsiveness
        setTickets((items) => {
          return items.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: targetStatus }
              : item
          )
        })
        
        // Place at bottom of target column by default
        const targetList = tickets.filter(t => t.status === targetStatus && t.id !== activeTicket.id)
        const dropIndex = targetList.length
        const newPos = calculateInsertPosition(targetList, dropIndex)
        
        // Update UI immediately with both status and position (optimistic update)
        setTickets(items => items.map(it => it.id === activeTicket.id ? { ...it, position: newPos, status: targetStatus } : it))
        
        // Update database in background
        await updateTicketStatus(activeTicket.id, targetStatus)
        await updateTicketPosition(activeTicket.id, newPos)
      } else {
        // Status unchanged - ticket already in targetStatus status
      }
      return
    }

    // Handle dropping on another ticket
    const overTicket = tickets.find((item) => item.id.toString() === over.id)
    if (overTicket && activeTicket.id !== overTicket.id) {
      // If dropping on a ticket in a different status, move to that status
      if (activeTicket.status !== overTicket.status) {
        // Update local state immediately for UI responsiveness
        setTickets((items) => {
          return items.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: overTicket.status as TicketStatus }
              : item
          )
        })
        
        // Compute fractional position in the target column relative to the hovered ticket
        const targetList = tickets.filter(t => t.status === overTicket.status && t.id !== activeTicket.id)
        const idx = targetList.findIndex(t => t.id === overTicket.id)
        const dropIndex = idx === -1 ? targetList.length : idx
        const newPos = calculateInsertPosition(targetList, dropIndex)
        
        // Update UI immediately with both status and position (optimistic update)
        setTickets(items => items.map(it => it.id === activeTicket.id ? { ...it, position: newPos, status: overTicket.status as TicketStatus } : it))
        
        // Update database in background
        await updateTicketStatus(activeTicket.id, overTicket.status)
        await updateTicketPosition(activeTicket.id, newPos)
      } else {
        // Same status, reordering - compute a fractional position for the moved ticket only
        const targetList = tickets.filter(t => t.status === activeTicket.status && t.id !== activeTicket.id)
        const overIdx = targetList.findIndex(t => t.id.toString() === over.id)
        const dropIndex = overIdx === -1 ? targetList.length : overIdx
        const newPos = calculateInsertPosition(targetList, dropIndex)
        
        // Update UI immediately for responsiveness (optimistic update)
        setTickets(prev => prev.map(it => it.id === activeTicket.id ? { ...it, position: newPos } : it))
        
        // Update database in background
        await updateTicketPosition(activeTicket.id, newPos)
      }
    }
  }

  const getTicketsByStatus = (status: TicketStatus) => {
    let filteredTickets = tickets.filter(ticket => ticket.status === status && ticket.role_id === 1)
    
    // Sort by position within the status
    return filteredTickets.sort((a, b) => a.position - b.position)
  }

  const getStatusDisplayLabel = (status: string) => {
    return status
  }

  const handleViewAllClick = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsModalOpen(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
    setSelectedTicket(null)
  }, [])

  const statuses = ["Approved", "In Progress", "Stuck", "Actioned", "Closed", "On Hold"]

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-x-auto">
        <AppHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex-1 flex-col gap-2 @container/main">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">Tickets</h1>
                    <p className="text-sm text-muted-foreground">Drag and drop tickets to manage their status.</p>
                  </div>
                  <div className="flex gap-2">
                    <ReloadButton onReload={fetchTickets} loading={loading} className="flex-1" />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets..."
                      className="pl-8"
                    />
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center bg-muted/50 rounded-lg border border-border overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                      disabled={zoomLevel <= 0.5}
                      className="h-9 w-9 p-0 rounded-none hover:bg-muted/80"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </Button>
                    <div className="px-3 py-1">
                      <span className="text-sm font-medium text-foreground min-w-[50px] text-center block">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoomLevel(prev => Math.min(1, prev + 0.1))}
                      disabled={zoomLevel >= 1}
                      className="h-9 w-9 p-0 rounded-none hover:bg-muted/80"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoomLevel(1)}
                      className="h-9 px-2 text-xs border-l border-border rounded-none hover:bg-muted/80"
                    >
                      Reset
                    </Button>
                  </div>


                </div>
              </div>

              {loading ? (
                <TicketsSkeleton />
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-red-600 mb-2">{error}</p>
                    <Button onClick={fetchTickets} variant="outline">
                      Retry
                    </Button>
                  </div>
                </div>
              ) : mounted ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                >
                                                        <div className="w-full h-[calc(100vh-240px)] px-4 lg:px-6">
                    <div 
                      className="flex gap-4 pb-4 overflow-x-auto overflow-y-auto w-full h-full scroll-container" 
                      style={{ 
                        scrollBehavior: 'smooth',
                        scrollbarWidth: 'thin',
                        msOverflowStyle: 'none',
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top left',
                        width: `${100 / zoomLevel}%`,
                        height: `${100 / zoomLevel}%`
                      }}
                      onWheel={(e) => {
                        // Check if cursor is over the cards container
                        const target = e.target as HTMLElement;
                        const isOverCardsContainer = target.closest('.cards-container');
                        
                        // Check if cursor is near edges (100px from left or right)
                        const container = e.currentTarget as HTMLElement;
                        const rect = container.getBoundingClientRect();
                        const mouseX = e.clientX;
                        const isNearLeftEdge = mouseX < rect.left + 100;
                        const isNearRightEdge = mouseX > rect.right - 100;
                        
                        // Allow horizontal scroll if not over cards container, dragging, or near edges
                        if (!isOverCardsContainer || activeId || isNearLeftEdge || isNearRightEdge) {
                          e.preventDefault();
                          const scrollAmount = e.deltaY * 3; // Use deltaY for proper wheel scrolling
                          container.scrollLeft -= scrollAmount; // Reversed direction
                        }
                      }}

                    >
                       {statuses.map((status) => (
                         <div key={status} className="flex-shrink-0 w-[400px]" style={{ width: '400px' }}>
                          <div className="bg-card border border-border rounded-xl transition-all duration-200 flex flex-col shadow-sm status-cell" style={{
                            minHeight: `${200 / zoomLevel}px`,
                            maxHeight: `calc(${94 / zoomLevel}vh - ${200 / zoomLevel}px)`
                          }}>
                            <div className="flex-shrink-0 p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className={`${getStatusColor(status as TicketStatus)} px-3 py-1 font-medium rounded-xl`}>
                                    {getStatusDisplayLabel(status)} <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xl text-xs ml-1 ${
                                      getCircleColor(status as TicketStatus)
                                    }`}>{getTicketsByStatus(status as TicketStatus).length}</span>
                                  </Badge>
                                </div>

                              </div>
                            </div>
                            <DroppableContainer status={status}>
                              <div className="flex-1 px-4 pb-4 cards-container">
                                <SortableContext
                                  items={getTicketsByStatus(status as TicketStatus).map(ticket => ticket.id.toString())}
                                  strategy={verticalListSortingStrategy}
                                >
                                                                  {getTicketsByStatus(status as TicketStatus).map((ticket, index, array) => (
                                    <SortableTicket 
                                      key={ticket.id} 
                                      ticket={ticket}
                                      isLast={index === array.length - 1}
                                      isExpanded={expandedTickets.has(ticket.id.toString())}
                                      onToggleExpanded={(ticketId) => {
                                        setExpandedTickets(prev => {
                                          const newSet = new Set(prev)
                                          if (newSet.has(ticketId)) {
                                            newSet.delete(ticketId)
                                          } else {
                                            newSet.add(ticketId)
                                          }
                                          return newSet
                                        })
                                      }}
                                      onViewAll={handleViewAllClick}
                                      user={user}
                                    />
                                  ))}
                                  
                                  {getTicketsByStatus(status as TicketStatus).length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20">
                                      <p className="text-sm font-medium">No Tickets</p>
                                    </div>
                                  )}
                                  

                                </SortableContext>
                              </div>
                            </DroppableContainer>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <DragOverlay>
                    {activeId ? (
                      <div style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top left',
                        width: '366px'
                      }}>
                        <DraggingTicket 
                          ticket={tickets.find(ticket => ticket.id.toString() === activeId)!}
                          isExpanded={expandedTickets.has(activeId)}
                          user={user}
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              ) : (
                <TicketsSkeleton />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
      
      <TicketDetailModal 
        ticket={selectedTicket as any}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        isLoading={loading}
      />


    </>
  )
} 
