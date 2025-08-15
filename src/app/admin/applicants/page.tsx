"use client"

import * as React from "react"
import { useState, useMemo, useCallback, useEffect, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import {
  SidebarInset,
} from "@/components/ui/sidebar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

import { IconSearch, IconGripVertical, IconCalendar, IconClock, IconEye, IconFileText } from "@tabler/icons-react"
import { ReloadButton } from "@/components/ui/reload-button"
import { useAuth } from "@/contexts/auth-context"
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
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type TicketStatus = 'submitted' | 'screened' | 'for verification' | 'verified' | 'initial interview' | 'final interview' | 'failed' | 'passed'

interface Ticket {
  id: string
  ticket_id: string
  user_id: string
  resume_slug?: string | null
  concern: string
  details: string | null
  category: string
  category_id: number | null
  category_name?: string
  status: TicketStatus
  position: number
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  role_id: number | null
  station_id: string | null
  profile_picture: string | null
  first_name: string | null
  last_name: string | null
  full_name?: string | null
  employee_id: string | null
  resolver_first_name?: string | null
  resolver_last_name?: string | null
  user_type?: string | null
  member_name?: string | null
  member_color?: string | null
  job_title?: string | null
  company_name?: string | null
}

interface SortableTicketProps {
  ticket: Ticket
  isLast?: boolean
  isExpanded: boolean
  onToggleExpanded: (ticketId: string) => void
  onViewAll: (ticket: Ticket) => void
}

// Category badge removed for Applicants

const SortableTicket = React.memo(function SortableTicket({ ticket, isLast = false, isExpanded, onToggleExpanded, onViewAll }: SortableTicketProps) {
  const [isHovered, setIsHovered] = useState(false)
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
    if (target.closest('[data-drag-handle]') || target.closest('.cursor-grab')) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    onToggleExpanded(ticket.id.toString())
  }, [onToggleExpanded, ticket.id])

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  const categoryBadge = null

  const cardClassName = useMemo(() => {
    return `${isLast ? '' : 'mb-3'} p-4 transition-colors duration-150 cursor-pointer overflow-hidden bg-sidebar dark:bg-[#252525] ticket-card w-full ${
      isDragging ? 'opacity-50' : ''
    } ${
      isHovered ? 'border-primary' : 'hover:border-primary/50'
    }`
  }, [isDragging, isHovered, isLast])

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cardClassName}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs font-medium text-muted-foreground/70 mr-2">Submitted at:</span>
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </span>
                <span className="text-muted-foreground/70">•</span>
                <IconClock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
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
                {ticket.full_name || (ticket.first_name && ticket.last_name 
                  ? `${ticket.first_name} ${ticket.last_name}`
                  : `User ${ticket.user_id}`)}
              </span>
              {ticket.user_type === 'Internal' ? (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">
                  Internal
                </span>
              ) : ticket.member_name && (
                <span 
                  className="text-xs font-medium truncate"
                  style={{ color: ticket.member_color || undefined }}
                >
                  {ticket.member_name}
                </span>
              )}
            </div>
            
          </div>
          <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mt-6">
            <span className="text-xs font-medium text-muted-foreground/70">Position:</span>
            <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">
              {ticket.job_title || ticket.concern}
            </h4>
            {ticket.company_name ? (
              <>
                <span className="text-xs font-medium text-muted-foreground/70 mt-3">Member:</span>
                <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">
                  {ticket.company_name}
                </h4>
              </>
            ) : null}
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
              <div className="flex items-center gap-2 mb-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-sm h-8 flex-1 rounded-lg shadow-none bg-[#f4f4f4] dark:bg-[#363636] text-gray-700 dark:text-white border-[#cecece99] dark:border-[#4f4f4f99] hover:bg-[#e8e8e8] dark:hover:bg-[#404040]"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewAll(ticket) }}
                >
                  <IconEye className="h-4 w-4 mr-px" />
                  <span>View All</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-sm h-8 flex-1 rounded-lg shadow-none bg-[#f4f4f4] dark:bg-[#363636] text-gray-700 dark:text-white border-[#cecece99] dark:border-[#4f4f4f99] hover:bg-[#e8e8e8] dark:hover:bg-[#404040]"
                  asChild
                >
                  <a
                    href={`https://www.bpoc.io/${ticket.resume_slug || ticket.ticket_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation() }}
                  >
                    <IconFileText className="h-4 w-4 mr-px" />
                    <span>View Resume</span>
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </Card>
  )
})

const getStatusColor = (status: TicketStatus) => {
  switch (status) {
    case "submitted":
      return "text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20"
    case "screened":
      return "text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20"
    case "for verification":
      return "text-teal-700 dark:text-white border-teal-600/20 bg-teal-50 dark:bg-teal-600/20"
    case "verified":
      return "text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20"
    case "initial interview":
      return "text-indigo-700 dark:text-white border-indigo-600/20 bg-indigo-50 dark:bg-indigo-600/20"
    case "final interview":
      return "text-violet-700 dark:text-white border-violet-600/20 bg-violet-50 dark:bg-violet-600/20"
    case "failed":
      return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
    case "passed":
      return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
    default:
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
  }
}

const getCircleColor = (status: TicketStatus) => {
  switch (status) {
    case "submitted":
      return "bg-blue-600/20 dark:bg-blue-600/40 text-blue-700 dark:text-white"
    case "screened":
      return "bg-orange-600/20 dark:bg-orange-600/40 text-orange-700 dark:text-white"
    case "for verification":
      return "bg-teal-600/20 dark:bg-teal-600/40 text-teal-700 dark:text-white"
    case "verified":
      return "bg-purple-600/20 dark:bg-purple-600/40 text-purple-700 dark:text-white"
    case "initial interview":
      return "bg-indigo-600/20 dark:bg-indigo-600/40 text-indigo-700 dark:text-white"
    case "final interview":
      return "bg-violet-600/20 dark:bg-violet-600/40 text-violet-700 dark:text-white"
    case "failed":
      return "bg-red-600/20 dark:bg-red-600/40 text-red-700 dark:text-white"
    case "passed":
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

function DraggingTicket({ ticket, isExpanded }: { ticket: Ticket; isExpanded: boolean }) {
  
  return (
    <Card className="mb-3 p-4 cursor-grabbing overflow-hidden bg-sidebar dark:bg-[#252525] border-primary">
      <div className="flex flex-col mb-3">
        <div className="flex-1 min-w-0 relative">
          <div className="cursor-grab active:cursor-grabbing transition-colors duration-200 absolute top-0 right-0">
            <IconGripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col text-xs text-muted-foreground py-1 rounded-none mb-3">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs font-medium text-muted-foreground/70 mr-2">Submitted at:</span>
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </span>
                <span className="text-muted-foreground/70">•</span>
                <IconClock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
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
                {ticket.full_name || (ticket.first_name && ticket.last_name 
                  ? `${ticket.first_name} ${ticket.last_name}`
                  : `User ${ticket.user_id}`)}
              </span>
              {ticket.user_type === 'Internal' ? (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">
                  Internal
                </span>
              ) : ticket.member_name && (
                <span 
                  className="text-xs font-medium truncate"
                  style={{ color: ticket.member_color || undefined }}
                >
                  {ticket.member_name}
                </span>
              )}
            </div>
            
          </div>
          <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mt-6">
            <span className="text-xs font-medium text-muted-foreground/70">Position:</span>
            <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">
              {ticket.job_title || ticket.concern}
            </h4>
            {ticket.company_name ? (
              <>
                <span className="text-xs font-medium text-muted-foreground/70 mt-3">Member:</span>
                <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">
                  {ticket.company_name}
                </h4>
              </>
            ) : null}
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
            <div className="flex items-center gap-2 mb-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-sm h-8 flex-1 rounded-lg shadow-none bg-[#f4f4f4] dark:bg-[#363636] text-gray-700 dark:text-white border-[#4f4f4f99] hover:bg-[#e8e8e8] dark:hover:bg-[#404040]"
              >
                <IconEye className="h-4 w-4 mr-1" />
                <span>View All</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

const getStatusDisplayLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    'submitted': 'New',
    'screened': 'Screened',
    'for verification': 'For Verification',
    'verified': 'Verified',
    'initial interview': 'Initial Interview',
    'final interview': 'Final Interview',
    'failed': 'Failed',
    'passed': 'Ready for Sale'
  }
  return statusMap[status] || status
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
        {["submitted", "screened", "for verification", "verified", "initial interview", "passed", "final interview", "failed"].map((status) => (
          <div key={status} className="flex-shrink-0 w-[400px]">
            <div className="bg-card border border-border rounded-xl transition-all duration-200 flex flex-col shadow-sm min-h-[200px] max-h-[calc(94vh-200px)] status-cell">
              <div className="flex-shrink-0 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`${getStatusColor(status as TicketStatus)} px-3 py-1 font-medium rounded-xl`}>
                      {getStatusDisplayLabel(status)} <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xl text-xs ml-1 ${getCircleColor(status as TicketStatus)}`}>
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
  const { setNodeRef } = useDroppable({
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

export default function ApplicantsPage() {
  const { user } = useAuth()
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set())
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [originalStatuses, setOriginalStatuses] = useState<Map<string, TicketStatus>>(new Map())

  // Load applicants from BPOC applications table
  const fetchApplicants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/applicants')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to fetch applicants (${res.status})`)
      }
      const data: any[] = await res.json()
      // Map BPOC applications into board items with proper status mapping
      const mapped: Ticket[] = data.map((a, index) => ({
        id: a.id,
        ticket_id: a.resume_slug || a.id,
        user_id: a.user_id,
        resume_slug: a.resume_slug,
        concern: a.job_title ? `Applied for ${a.job_title}` : `Applied for Job #${a.job_id}`,
        details: null,
        category: 'Application',
        category_id: null,
        category_name: 'Application',
        status: a.status as TicketStatus,
        position: a.position || index, // Use position from API or fallback to index
        resolved_by: null,
        resolved_at: null,
        created_at: a.created_at,
        updated_at: a.created_at,
        role_id: null,
        station_id: null,
        profile_picture: a.avatar_url || null,
        first_name: a.first_name || null,
        last_name: a.last_name || null,
        full_name: a.full_name || null,
        employee_id: null,
        resolver_first_name: null,
        resolver_last_name: null,
        user_type: 'External',
        member_name: null,
        member_color: null,
        job_title: a.job_title || null,
        company_name: a.company_name || null,
      }))
      setTickets(mapped)
    } catch (e: any) {
      setError(e?.message || 'Failed to load applicants')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplicants()
  }, [fetchApplicants])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    // Store the original status of the ticket being dragged
    const activeTicket = tickets.find((item) => item.id.toString() === active.id)
    if (activeTicket) {
      setOriginalStatuses(prev => new Map(prev).set(active.id as string, activeTicket.status))
      console.log('🎯 Drag started, storing original status:', { 
        ticketId: active.id, 
        originalStatus: activeTicket.status 
      })
    }
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const container = document.querySelector('.scroll-container') as HTMLElement;
      if (container) {
        const scrollAmount = e.deltaY * 3;
        container.scrollLeft -= scrollAmount;
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: false });
    ;(window as any).dragWheelHandler = handleWheel;
  }

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event
    if (!active || !over) return
    const activeTicket = tickets.find((item) => item.id.toString() === active.id)
    if (!activeTicket) return
    
    console.log('🔄 DragOver event:', { 
      activeId: active.id, 
      overId: over.id, 
      activeTicketStatus: activeTicket.status 
    })
    
    if (over.id.toString().startsWith('droppable-')) {
      const targetStatus = over.id.toString().replace('droppable-', '') as TicketStatus
      console.log('🎯 Target status from droppable:', targetStatus)
      if (activeTicket.status !== targetStatus) {
        console.log('📝 Updating local state during drag...')
        setTickets(prevTickets => prevTickets.map((item) => item.id.toString() === active.id ? { ...item, status: targetStatus } : item))
      }
      return
    }
    
    const overTicket = tickets.find((item) => item.id.toString() === over.id)
    if (overTicket && activeTicket.id !== overTicket.id) {
      if (activeTicket.status !== overTicket.status) {
        console.log('📝 Updating local state during drag (over ticket):', overTicket.status)
        setTickets(prevTickets => prevTickets.map((item) => item.id.toString() === active.id ? { ...item, status: overTicket.status as TicketStatus } : item))
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    console.log('🎯 DragEnd event:', { activeId: active.id, overId: over?.id })
    
    setActiveId(null)
    if ((window as any).dragWheelHandler) {
      document.removeEventListener('wheel', (window as any).dragWheelHandler);
      (window as any).dragWheelHandler = null;
    }
    if (!active || !over) {
      console.log('❌ No active or over element in DragEnd')
      return
    }
    
    const activeTicket = tickets.find((item) => item.id.toString() === active.id)
    if (!activeTicket) {
      console.log('❌ Active ticket not found')
      return
    }
    
    // Get the original status that was stored when drag started
    const originalStatus = originalStatuses.get(active.id as string)
    if (!originalStatus) {
      console.log('❌ Original status not found for ticket:', active.id)
      return
    }
    
    console.log('🎯 Active ticket found:', { 
      id: activeTicket.id, 
      currentStatus: activeTicket.status,
      originalStatus: originalStatus
    })
    
    // Check if the status actually changed during the drag operation
    if (activeTicket.status !== originalStatus) {
      console.log('🔄 Status changed during drag:', { 
        from: originalStatus, 
        to: activeTicket.status, 
        applicationId: activeTicket.id 
      })
      
      // Update database
      try {
        console.log('📡 Sending API request to update status...')
        console.log('👤 Current user ID:', user?.id)
        const response = await fetch('/api/applicants', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: activeTicket.id,
            status: activeTicket.status,
            previousStatus: originalStatus,
            recruiterId: user?.id || null
          })
        })
        
        console.log('📡 API Response status:', response.status)
        
        if (!response.ok) {
          // Revert local state if database update failed
          setTickets((items) => items.map((item) => item.id.toString() === active.id ? { ...item, status: originalStatus } : item))
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ Failed to update application status:', errorData.error)
        } else {
          const result = await response.json()
          console.log('✅ Database update successful:', result)
        }
      } catch (error) {
        // Revert local state if database update failed
        setTickets((items) => items.map((item) => item.id.toString() === active.id ? { ...item, status: originalStatus } : item))
        console.error('❌ Error updating application status:', error)
      }
    } else {
      console.log('ℹ️ No status change detected during drag')
      
      // Handle reordering within the same status
      const overTicket = tickets.find((item) => item.id.toString() === over.id)
      if (overTicket && activeTicket.id !== overTicket.id && activeTicket.status === overTicket.status) {
        const oldIndex = tickets.findIndex((item) => item.id.toString() === active.id)
        const newIndex = tickets.findIndex((item) => item.id.toString() === over.id)
        
        if (oldIndex !== newIndex) {
          console.log('🔄 Reordering applicants within same status:', activeTicket.status)
          console.log('📊 Old index:', oldIndex, 'New index:', newIndex)
          
          // Reorder the tickets and update positions
          setTickets(prevTickets => {
            const reorderedTickets = arrayMove(prevTickets, oldIndex, newIndex)
            const statusTickets = reorderedTickets.filter(t => t.status === activeTicket.status)
            const positionUpdates = statusTickets.map((ticket, index) => ({
              id: ticket.id,
              position: index
            }))
            
            console.log('📊 Position updates:', positionUpdates)
            
            // Update positions in database
            console.log('📡 Sending position updates to API:', positionUpdates)
            fetch('/api/applicants/positions', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ positions: positionUpdates }),
            }).then(response => {
              if (response.ok) {
                console.log('✅ Applicant positions updated successfully')
                // Refresh the data to get updated positions
                fetchApplicants()
              } else {
                console.error('❌ Failed to update applicant positions')
                // Revert on error
                fetchApplicants()
              }
            }).catch(error => {
              console.error('❌ Error updating applicant positions:', error)
              // Revert on error
              fetchApplicants()
            })
            
            // Return updated tickets with new positions
            return reorderedTickets.map((item) => {
              const statusIndex = statusTickets.findIndex(t => t.id === item.id)
              if (statusIndex !== -1) {
                return { ...item, position: statusIndex }
              }
              return item
            })
          })
        }
      }
    }
    
    // Clean up the stored original status
    setOriginalStatuses(prev => {
      const newMap = new Map(prev)
      newMap.delete(active.id as string)
      return newMap
    })
  }

  const getTicketsByStatus = (status: TicketStatus) => {
    const filteredTickets = tickets.filter(ticket => ticket.status === status)
    return filteredTickets.sort((a, b) => a.position - b.position)
  }



  const handleViewAllClick = useCallback((ticket: Ticket) => {
    // Placeholder: No modal/details for Applicants yet
    console.log('View applicant', ticket.id)
  }, [])

  const statuses: TicketStatus[] = ["submitted", "screened", "for verification", "verified", "initial interview", "passed", "final interview", "failed"]

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
                    <h1 className="text-2xl font-bold">Applicants</h1>
                    <p className="text-sm text-muted-foreground">Drag and drop applicants to manage their status.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search applicants..."
                      className="pl-8"
                    />
                  </div>
                  <ReloadButton 
                    onReload={fetchApplicants}
                    loading={loading}
                  />
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="w-full h-[calc(100vh-240px)] px-4 lg:px-6">
                  {loading ? (
                    <TicketsSkeleton />
                  ) : error ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <p className="text-red-600 mb-2">{error}</p>
                        <Button onClick={() => location.reload()} variant="outline">
                          Retry
                        </Button>
                      </div>
                    </div>
                  ) : (
                  <div 
                    className="flex gap-4 pb-4 overflow-x-auto overflow-y-auto w-full h-full scroll-container" 
                    style={{ 
                      scrollBehavior: 'smooth',
                      scrollbarWidth: 'thin',
                      msOverflowStyle: 'none'
                    }}
                    onWheel={(e) => {
                      const target = e.target as HTMLElement;
                      const isOverCardsContainer = target.closest('.cards-container');
                      const container = e.currentTarget as HTMLElement;
                      const rect = container.getBoundingClientRect();
                      const mouseX = e.clientX;
                      const isNearLeftEdge = mouseX < rect.left + 100;
                      const isNearRightEdge = mouseX > rect.right - 100;
                      if (!isOverCardsContainer || activeId || isNearLeftEdge || isNearRightEdge) {
                        e.preventDefault();
                        const scrollAmount = e.deltaY * 3;
                        container.scrollLeft -= scrollAmount;
                      }
                    }}
                  >
                    {statuses.map((status) => (
                      <div key={status} className="flex-shrink-0 w-[400px]">
                        <div className="bg-card border border-border rounded-xl transition-all duration-200 flex flex-col shadow-sm min-h-[200px] max-h-[calc(94vh-200px)] status-cell">
                          <div className="flex-shrink-0 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={`${getStatusColor(status as TicketStatus)} px-3 py-1 font-medium rounded-xl`}>
                                  {getStatusDisplayLabel(status)} <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xl text-xs ml-1 ${getCircleColor(status as TicketStatus)}`}>{getTicketsByStatus(status as TicketStatus).length}</span>
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
                                  />
                                ))}
                                {getTicketsByStatus(status as TicketStatus).length === 0 && (
                                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20">
                                    <p className="text-sm font-medium">No Applicants</p>
                                  </div>
                                )}
                              </SortableContext>
                            </div>
                          </DroppableContainer>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>

                <DragOverlay>
                  {activeId ? (
                    <DraggingTicket 
                      ticket={tickets.find(ticket => ticket.id.toString() === activeId)!}
                      isExpanded={expandedTickets.has(activeId)}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}


