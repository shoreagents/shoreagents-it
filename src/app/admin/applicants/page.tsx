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
import { ApplicantsDetailModal } from "@/components/modals/applicants-detail-modal"
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

type ApplicantStatus = 'submitted' | 'screened' | 'for verification' | 'verified' | 'initial interview' | 'final interview' | 'failed' | 'passed'

interface Applicant {
  id: string
  ticket_id: string
  user_id: string
  resume_slug?: string | null
  concern: string
  details: string | null
  category: string
  category_id: number | null
  category_name?: string
  status: ApplicantStatus
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

interface SortableApplicantProps {
  applicant: Applicant
  isLast?: boolean
  isExpanded: boolean
  onToggleExpanded: (applicantId: string) => void
  onViewAll: (applicant: Applicant) => void
}

// Category badge removed for Applicants

const SortableApplicant = React.memo(function SortableApplicant({ applicant, isLast = false, isExpanded, onToggleExpanded, onViewAll }: SortableApplicantProps) {
  const [isHovered, setIsHovered] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: applicant.id.toString() })

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
    onToggleExpanded(applicant.id.toString())
  }, [onToggleExpanded, applicant.id])

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  const categoryBadge = null

  const cardClassName = useMemo(() => {
    return `${isLast ? '' : 'mb-3'} p-4 transition-colors duration-150 cursor-pointer overflow-hidden bg-sidebar dark:bg-[#252525] applicant-card w-full ${
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
                  {new Date(applicant.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </span>
                <span className="text-muted-foreground/70">•</span>
                <IconClock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">
                  {new Date(applicant.created_at).toLocaleTimeString('en-US', {
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
              <AvatarImage src={applicant.profile_picture || ''} alt={`User ${applicant.user_id}`} />
              <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                {applicant.first_name && applicant.last_name 
                  ? `${applicant.first_name[0]}${applicant.last_name[0]}`
                  : String(applicant.user_id).split(' ').map(n => n[0]).join('')
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-foreground truncate">
                {applicant.full_name || (applicant.first_name && applicant.last_name 
                  ? `${applicant.first_name} ${applicant.last_name}`
                  : `User ${applicant.user_id}`)}
              </span>
              {applicant.user_type === 'Internal' ? (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">
                  Internal
                </span>
              ) : applicant.member_name && (
                <span 
                  className="text-xs font-medium truncate"
                  style={{ color: applicant.member_color || undefined }}
                >
                  {applicant.member_name}
                </span>
              )}
            </div>
            
          </div>
          <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mt-6">
            <span className="text-xs font-medium text-muted-foreground/70">Position:</span>
            <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">
              {applicant.job_title || applicant.concern}
            </h4>
            {applicant.company_name ? (
              <>
                <span className="text-xs font-medium text-muted-foreground/70 mt-3">Member:</span>
                <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">
                  {applicant.company_name}
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
              {applicant.details && (
                <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mb-6">
                  <span className="text-xs font-medium text-muted-foreground/70">Additional Details:</span>
                  <p className="text-sm text-primary leading-relaxed break-words mt-1">{applicant.details}</p>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-sm h-8 flex-1 rounded-lg shadow-none bg-[#f4f4f4] dark:bg-[#363636] text-gray-700 dark:text-white border-[#cecece99] dark:border-[#4f4f4f99] hover:bg-[#e8e8e8] dark:hover:bg-[#404040]"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewAll(applicant) }}
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
                    href={`https://www.bpoc.io/${applicant.resume_slug || applicant.ticket_id}`}
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

const getStatusColor = (status: ApplicantStatus) => {
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

const getCircleColor = (status: ApplicantStatus) => {
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

function ApplicantSkeleton() {
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

function DraggingApplicant({ applicant, isExpanded }: { applicant: Applicant; isExpanded: boolean }) {
  
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
                  {new Date(applicant.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </span>
                <span className="text-muted-foreground/70">•</span>
                <IconClock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">
                  {new Date(applicant.created_at).toLocaleTimeString('en-US', {
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
              <AvatarImage src={applicant.profile_picture || ''} alt={`User ${applicant.user_id}`} />
              <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                {applicant.first_name && applicant.last_name 
                  ? `${applicant.first_name[0]}${applicant.last_name[0]}`
                  : String(applicant.user_id).split(' ').map(n => n[0]).join('')
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-foreground truncate">
                {applicant.full_name || (applicant.first_name && applicant.last_name 
                  ? `${applicant.first_name} ${applicant.last_name}`
                  : `User ${applicant.user_id}`)}
              </span>
              {applicant.user_type === 'Internal' ? (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">
                  Internal
                </span>
              ) : applicant.member_name && (
                <span 
                  className="text-xs font-medium truncate"
                  style={{ color: applicant.member_color || undefined }}
                >
                  {applicant.member_name}
                </span>
              )}
            </div>
            
          </div>
          <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mt-6">
            <span className="text-xs font-medium text-muted-foreground/70">Position:</span>
            <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">
              {applicant.job_title || applicant.concern}
            </h4>
            {applicant.company_name ? (
              <>
                <span className="text-xs font-medium text-muted-foreground/70 mt-3">Member:</span>
                <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">
                  {applicant.company_name}
                </h4>
              </>
            ) : null}
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-3 overflow-hidden">
          <div className="space-y-3">
            {applicant.details && (
              <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mb-6">
                <span className="text-xs font-medium text-muted-foreground/70">Additional Details:</span>
                <p className="text-sm text-primary leading-relaxed break-words mt-1">{applicant.details}</p>
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-sm h-8 flex-1 rounded-lg shadow-none bg-[#f4f4f4] dark:bg-[#363636] text-gray-700 dark:text-white border-[#cecece99] dark:border-[#4f4f4f99] hover:bg-[#e8e8e8] dark:hover:bg-[#404040]"
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
                  href={`https://www.bpoc.io/${applicant.resume_slug || applicant.ticket_id}`}
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
                    <Badge variant="outline" className={`${getStatusColor(status as ApplicantStatus)} px-3 py-1 font-medium rounded-xl`}>
                      {getStatusDisplayLabel(status)} <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xl text-xs ml-1 ${getCircleColor(status as ApplicantStatus)}`}>
                        <Skeleton className="h-3 w-3 rounded-xl" />
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex-1 px-4 pb-4 cards-container">
                {Array.from({ length: 3 }).map((_, index) => (
                  <ApplicantSkeleton key={index} />
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
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [originalStatuses, setOriginalStatuses] = useState<Map<string, ApplicantStatus>>(new Map())
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Disable body scroll when on applicants page
  useEffect(() => {
    document.body.classList.add('no-scroll')
    return () => {
      document.body.classList.remove('no-scroll')
    }
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
      const mapped: Applicant[] = data.map((a, index) => ({
        id: a.id,
        ticket_id: a.resume_slug || a.id,
        user_id: a.user_id,
        resume_slug: a.resume_slug,
        concern: a.job_title ? `Applied for ${a.job_title}` : `Applied for Job #${a.job_id}`,
        details: null,
        category: 'Application',
        category_id: null,
        category_name: 'Application',
        status: a.status as ApplicantStatus,
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
      setApplicants(mapped)
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
    
    // Store the original status of the applicant being dragged
    const activeApplicant = applicants.find((item) => item.id.toString() === active.id)
    if (activeApplicant) {
      setOriginalStatuses(prev => new Map(prev).set(active.id as string, activeApplicant.status))
      console.log('🎯 Drag started, storing original status:', { 
        applicantId: active.id, 
        originalStatus: activeApplicant.status 
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
    const activeApplicant = applicants.find((item) => item.id.toString() === active.id)
    if (!activeApplicant) return
    
    console.log('🔄 DragOver event:', { 
      activeId: active.id, 
      overId: over.id, 
      activeApplicantStatus: activeApplicant.status 
    })
    
    if (over.id.toString().startsWith('droppable-')) {
      const targetStatus = over.id.toString().replace('droppable-', '') as ApplicantStatus
      console.log('🎯 Target status from droppable:', targetStatus)
      if (activeApplicant.status !== targetStatus) {
        console.log('📝 Updating local state during drag...')
        setApplicants(prevApplicants => prevApplicants.map((item) => item.id.toString() === active.id ? { ...item, status: targetStatus } : item))
      }
      return
    }
    
    const overApplicant = applicants.find((item) => item.id.toString() === over.id)
    if (overApplicant && activeApplicant.id !== overApplicant.id) {
      if (activeApplicant.status !== overApplicant.status) {
        console.log('📝 Updating local state during drag (over applicant):', overApplicant.status)
        setApplicants(prevApplicants => prevApplicants.map((item) => item.id.toString() === active.id ? { ...item, status: overApplicant.status as ApplicantStatus } : item))
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
    
    const activeApplicant = applicants.find((item) => item.id.toString() === active.id)
    if (!activeApplicant) {
      console.log('❌ Active applicant not found')
      return
    }
    
    // Get the original status that was stored when drag started
    const originalStatus = originalStatuses.get(active.id as string)
    if (!originalStatus) {
      console.log('❌ Original status not found for applicant:', active.id)
      return
    }
    
    console.log('🎯 Active applicant found:', { 
      id: activeApplicant.id, 
      currentStatus: activeApplicant.status,
      originalStatus: originalStatus
    })
    
    // Check if the status actually changed during the drag operation
    if (activeApplicant.status !== originalStatus) {
      console.log('🔄 Status changed during drag:', { 
        from: originalStatus, 
        to: activeApplicant.status, 
        applicationId: activeApplicant.id 
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
            id: activeApplicant.id,
            status: activeApplicant.status,
            previousStatus: originalStatus,
            recruiterId: user?.id || null
          })
        })
        
        console.log('📡 API Response status:', response.status)
        
        if (!response.ok) {
          // Revert local state if database update failed
          setApplicants((items) => items.map((item) => item.id.toString() === active.id ? { ...item, status: originalStatus } : item))
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ Failed to update application status:', errorData.error)
        } else {
          const result = await response.json()
          console.log('✅ Database update successful:', result)
        }
      } catch (error) {
        // Revert local state if database update failed
        setApplicants((items) => items.map((item) => item.id.toString() === active.id ? { ...item, status: originalStatus } : item))
        console.error('❌ Error updating application status:', error)
      }
    } else {
      console.log('ℹ️ No status change detected during drag')
      
      // Handle reordering within the same status
      const overApplicant = applicants.find((item) => item.id.toString() === over.id)
      if (overApplicant && activeApplicant.id !== overApplicant.id && activeApplicant.status === overApplicant.status) {
        const oldIndex = applicants.findIndex((item) => item.id.toString() === active.id)
        const newIndex = applicants.findIndex((item) => item.id.toString() === over.id)
        
        if (oldIndex !== newIndex) {
          console.log('🔄 Reordering applicants within same status:', activeApplicant.status)
          console.log('📊 Old index:', oldIndex, 'New index:', newIndex)
          
          // Reorder the applicants and update positions
          setApplicants(prevApplicants => {
            const reorderedApplicants = arrayMove(prevApplicants, oldIndex, newIndex)
            const statusApplicants = reorderedApplicants.filter(t => t.status === activeApplicant.status)
            const positionUpdates = statusApplicants.map((applicant, index) => ({
              id: applicant.id,
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
            
            // Return updated applicants with new positions
            return reorderedApplicants.map((item) => {
              const statusIndex = statusApplicants.findIndex(t => t.id === item.id)
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

  const getApplicantsByStatus = (status: ApplicantStatus) => {
    const filteredApplicants = applicants.filter(applicant => applicant.status === status)
    return filteredApplicants.sort((a, b) => a.position - b.position)
  }



  const handleViewAllClick = useCallback((applicant: Applicant) => {
    setSelectedApplicant(applicant)
    setIsModalOpen(true)
  }, [])

  const statuses: ApplicantStatus[] = ["submitted", "screened", "for verification", "verified", "initial interview", "passed", "final interview", "failed"]

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
                    <div className="px-3 py-1 border-x border-border">
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
                      msOverflowStyle: 'none',
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'top left',
                      width: `${100 / zoomLevel}%`,
                      height: `${100 / zoomLevel}%`
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
                        <div className="bg-card border border-border rounded-xl transition-all duration-200 flex flex-col shadow-sm status-cell" style={{
                          minHeight: `${200 / zoomLevel}px`,
                          maxHeight: `calc(${94 / zoomLevel}vh - ${200 / zoomLevel}px)`
                        }}>
                          <div className="flex-shrink-0 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={`${getStatusColor(status as ApplicantStatus)} px-3 py-1 font-medium rounded-xl`}>
                                  {getStatusDisplayLabel(status)} <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xl text-xs ml-1 ${getCircleColor(status as ApplicantStatus)}`}>{getApplicantsByStatus(status as ApplicantStatus).length}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <DroppableContainer status={status}>
                            <div className="flex-1 px-4 pb-4 cards-container">
                              <SortableContext
                                items={getApplicantsByStatus(status as ApplicantStatus).map(applicant => applicant.id.toString())}
                                strategy={verticalListSortingStrategy}
                              >
                                {getApplicantsByStatus(status as ApplicantStatus).map((applicant, index, array) => (
                                  <SortableApplicant 
                                    key={applicant.id} 
                                    applicant={applicant}
                                    isLast={index === array.length - 1}
                                    isExpanded={expandedTickets.has(applicant.id.toString())}
                                    onToggleExpanded={(applicantId) => {
                                      setExpandedTickets(prev => {
                                        const newSet = new Set(prev)
                                        if (newSet.has(applicantId)) {
                                          newSet.delete(applicantId)
                                        } else {
                                          newSet.add(applicantId)
                                        }
                                        return newSet
                                      })
                                    }}
                                    onViewAll={handleViewAllClick}
                                  />
                                ))}
                                {getApplicantsByStatus(status as ApplicantStatus).length === 0 && (
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
                    <div style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'top left',
                      width: '366px'
                    }}>
                      <DraggingApplicant 
                        applicant={applicants.find(applicant => applicant.id.toString() === activeId)!}
                        isExpanded={expandedTickets.has(activeId)}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Applicants Detail Modal */}
      <ApplicantsDetailModal
        applicant={selectedApplicant}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedApplicant(null)
        }}
      />
    </>
  )
}


