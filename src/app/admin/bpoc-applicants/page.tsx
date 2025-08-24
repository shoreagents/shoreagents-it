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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { IconSearch, IconGripVertical, IconCalendar, IconClock, IconEye, IconFileText, IconCircle } from "@tabler/icons-react"
import { ReloadButton } from "@/components/ui/reload-button"
import { useAuth } from "@/contexts/auth-context"
import { ApplicantsDetailModal } from "@/components/modals/applicants-detail-modal"
import { useRealtimeApplicants } from "@/hooks/use-realtime-applicants"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ApplicantStatus = 'submitted' | 'qualified' | 'for verification' | 'verified' | 'initial interview' | 'final interview' | 'not qualified' | 'not qualifies' | 'passed'

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
  // Additional fields from recruits table
  bpoc_application_ids?: string[] | null
  applicant_id?: string | null
  job_ids?: number[] | null
  video_introduction_url?: string | null
  current_salary?: number | null
  expected_monthly_salary?: number | null
  shift?: string | null
  // Arrays of all job information
  all_job_titles?: string[]
  all_companies?: string[]
  all_job_statuses?: string[]
  all_job_timestamps?: string[]
}

interface SortableApplicantProps {
  applicant: Applicant
  isLast?: boolean
  isExpanded: boolean
  onToggleExpanded: (applicantId: string) => void
  onViewAll: (applicant: Applicant) => void
  onStatusUpdate: (applicantId: string, jobIndex: number, newStatus: string) => void
}

// Category badge removed for Applicants

const SortableApplicant = React.memo(function SortableApplicant({ applicant, isLast = false, isExpanded, onToggleExpanded, onViewAll, onStatusUpdate }: SortableApplicantProps) {
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
      <div className="flex flex-col">
        <div className="flex-1 min-w-0 relative">
          <div 
            className="cursor-grab active:cursor-grabbing transition-colors duration-200 absolute top-0 right-0"
            data-drag-handle
            {...attributes}
            {...listeners}
          >
            <IconGripVertical className="h-5 w-5 text-muted-foreground" />
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
          <div className={`border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mt-6 ${isExpanded ? 'mb-6' : 'mb-3'}`}>

            <div className="flex flex-col gap-3">
                {applicant.all_job_titles && applicant.all_job_titles.length > 0 ? (
                <>
                  <span className="text-xs font-medium text-muted-foreground/70">Applied for:</span>
                  <div className="flex flex-col gap-2">
                    {applicant.all_job_titles.map((jobTitle, index) => (
                      <div key={index} className="rounded-lg p-3 bg-gray-100 dark:bg-[#1a1a1a] hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-primary leading-tight break-words flex-1">
                        {jobTitle}
                      </h4>
                          {(() => {
                            const status = applicant.all_job_statuses?.[index] || applicant.status;
                            const showStatus = ['withdrawn', 'not qualified', 'failed', 'qualified', 'final interview', 'hired'].includes(status.toLowerCase());
                            
                            // Show status badge if job has final status
                            if (showStatus) {
                              // Make badge clickable only when main status is "passed"
                              if (applicant.status.toLowerCase() === 'passed') {
                                return (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Badge 
                                        variant="outline" 
                                        className={`${getStatusColor(status as ApplicantStatus)} px-2 py-0.5 text-xs font-medium rounded-md cursor-pointer hover:opacity-80 transition-opacity popover-trigger status-badge`}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {getStatusDisplayLabel(status)}
                                      </Badge>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-2" align="start" side="bottom" sideOffset={4}>
                                      <div className="space-y-1">
                                        {['withdrawn', 'not qualified', 'qualified', 'final interview', 'hired'].map((statusOption) => (
                                          <div 
                                            key={statusOption}
                                            className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                              status.toLowerCase() === statusOption 
                                                ? 'bg-primary/10 text-primary border border-primary/20 pointer-events-none cursor-default' 
                                                : 'cursor-pointer hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground'
                                            }`}
                                            onClick={async () => {
                                              if (status.toLowerCase() === statusOption) return;
                                              try {
                                                console.log(`Updating BPOC job ${index} status to:`, statusOption);
                                              console.log('Request payload:', { applicantId: applicant.id, jobIndex: index, newStatus: statusOption });
                                                
                                                const response = await fetch('/api/bpoc/update-job-status/', {
                                                  method: 'PATCH',
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                  },
                                                  body: JSON.stringify({
                                                    applicantId: applicant.id,
                                                    jobIndex: index,
                                                    newStatus: statusOption
                                                  })
                                                });
                                                
                                                if (response.ok) {
                                                  const result = await response.json();
                                                  console.log('✅ BPOC job status updated successfully:', result);
                                                  
                                                  // Immediately update the frontend state
                                                  onStatusUpdate(applicant.id, index, statusOption);
                                                } else {
                                                  const error = await response.json();
                                                  console.error('❌ Failed to update BPOC job status:', error);
                                                }
                                              } catch (error) {
                                                console.error('❌ Error updating BPOC job status:', error);
                                              }
                                            }}
                                          >
                                            {getStatusIcon(statusOption)}
                                            <span className="text-sm font-medium">{getStatusDisplayLabel(statusOption)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                );
                              }
                              
                              // Non-clickable badge when main status is not "passed"
                              return (
                                <Badge variant="outline" className={`${getStatusColor(status as ApplicantStatus)} px-2 py-0.5 text-xs font-medium rounded-md`}>
                                  {getStatusDisplayLabel(status)}
                                </Badge>
                              );
                            }
                            
                            // Show "Set Status" button when main status is "passed"
                            if (applicant.status.toLowerCase() === 'passed') {
                              return (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Badge 
                                      variant="outline" 
                                      className="px-2 py-0.5 text-xs font-medium rounded-md cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 border-dashed text-muted-foreground border-muted-foreground/30 popover-trigger status-badge"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Set Status
                                    </Badge>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-2" align="start" side="bottom" sideOffset={4}>
                                    <div className="space-y-1">

                                      {['withdrawn', 'not qualified', 'qualified', 'final interview', 'hired'].map((statusOption) => (
                                        <div 
                                          key={statusOption}
                                          className="flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 cursor-pointer hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground"
                                          onClick={async () => {
                                            const current = (applicant.all_job_statuses?.[index] || applicant.status).toLowerCase();
                                            if (current === statusOption) return;
                                            try {
                                              console.log(`Updating BPOC job ${index} status to:`, statusOption);
                                              console.log('Request payload:', { applicantId: applicant.id, jobIndex: index, newStatus: statusOption });
                                              
                                              const response = await fetch('/api/bpoc/update-job-status/', {
                                                method: 'PATCH',
                                                headers: {
                                                  'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                  applicantId: applicant.id,
                                                  jobIndex: index,
                                                  newStatus: statusOption
                                                })
                                              });
                                              
                                              if (response.ok) {
                                                const result = await response.json();
                                                console.log('✅ BPOC job status updated successfully:', result);
                                                
                                                // Immediately update the frontend state
                                                onStatusUpdate(applicant.id, index, statusOption);
                                              } else {
                                                const error = await response.json();
                                                console.error('❌ Failed to update BPOC job status:', error);
                                                console.error('❌ Response status:', response.status);
                                                console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
                                              }
                                            } catch (error) {
                                              console.error('❌ Error updating BPOC job status:', error);
                                            }
                                          }}
                                        >
                                          {getStatusIcon(statusOption)}
                                          <span className="text-sm font-medium">{getStatusDisplayLabel(statusOption)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              );
                            }
                            
                            return null;
                          })()}
                        </div>
                        <div className="flex items-center justify-between">
                          {applicant.all_companies && applicant.all_companies[index] ? (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <p className="text-xs text-muted-foreground font-medium">
                                {applicant.all_companies[index]}
                              </p>
                  </div>
                ) : (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs text-muted-foreground/50 italic">
                                Company not specified
                              </p>
                            </div>
                          )}
                          {applicant.all_job_timestamps && applicant.all_job_timestamps[index] && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-pointer">
                                    <IconCalendar className="h-4 w-4 text-muted-foreground/70 hover:text-muted-foreground transition-colors" />
              </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="flex items-center gap-0 text-xs">
                                    <span>
                                      {new Date(applicant.all_job_timestamps[index]).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                    <span className="text-muted-foreground/50 mx-1">•</span>
                                    <span>
                                      {new Date(applicant.all_job_timestamps[index]).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </span>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                      ))}
                    </div>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-muted-foreground/70">Applied for:</span>
                  <div className="rounded-lg p-3 bg-gray-100 dark:bg-[#1a1a1a] hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-primary leading-tight break-words flex-1">
                        {applicant.job_title || applicant.concern}
                    </h4>
                      {(() => {
                        const status = applicant.all_job_statuses?.[0] || applicant.status;
                        const showStatus = ['withdrawn', 'not qualified', 'failed', 'qualified', 'final interview', 'hired'].includes(status.toLowerCase());
                        return showStatus ? (
                          <Badge variant="outline" className={`${getStatusColor(status as ApplicantStatus)} px-2 py-0.5 text-xs font-medium rounded-md`}>
                            {getStatusDisplayLabel(status)}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex items-center justify-between">
                      {applicant.company_name && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <p className="text-xs text-muted-foreground font-medium">
                            {applicant.company_name}
                          </p>
                        </div>
                      )}
                      {applicant.all_job_timestamps && applicant.all_job_timestamps[0] && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-pointer">
                                <IconCalendar className="h-4 w-4 text-muted-foreground/70 hover:text-muted-foreground transition-colors" />
                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="flex items-center gap-1 text-xs">
                                <span>
                                  {new Date(applicant.all_job_timestamps[0]).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="text-muted-foreground/50 mx-1">•</span>
                                <span>
                                  {new Date(applicant.all_job_timestamps[0]).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
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
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {applicant.details && (
                <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mb-6">
                  <span className="text-xs font-medium text-muted-foreground/70">Additional Details:</span>
                  <p className="text-sm text-primary leading-relaxed break-words mt-1">{applicant.details}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-sm h-8 flex-1 rounded-lg shadow-none bg-[#f4f4f4] dark:bg-[#363636] text-gray-700 dark:text-white border-[#cecece99] dark:border-[#4f4f4f99] hover:bg-[#e8e8e8] dark:hover:bg-[#404040] hover:border-[#cecece99] dark:hover:border-[#4f4f4f99]"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewAll(applicant) }}
                >
                  <IconEye className="h-4 w-4 mr-px" />
                  <span>View All</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-sm h-8 flex-1 rounded-lg shadow-none bg-[#f4f4f4] dark:bg-[#363636] text-gray-700 dark:text-white border-[#cecece99] dark:border-[#4f4f4f99] hover:bg-[#e8e8e8] dark:hover:bg-[#404040] hover:border-[#cecece99] dark:hover:border-[#4f4f4f99]"
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

const getStatusColor = (status: ApplicantStatus | string) => {
  switch (status.toLowerCase()) {
    case "submitted":
      return "text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20"
    case "qualified":
      return "text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20"
    case "for verification":
      return "text-teal-700 dark:text-white border-teal-600/20 bg-teal-50 dark:bg-teal-600/20"
    case "verified":
      return "text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20"
    case "initial interview":
      return "text-amber-700 dark:text-white border-amber-600/20 bg-amber-50 dark:bg-amber-600/20"
    case "final interview":
      return "text-pink-700 dark:text-white border-pink-600/20 bg-pink-50 dark:bg-pink-600/20"
    case "failed":
      return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
    case "not qualifies":
      return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
    case "not qualified":
      return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
    case "passed":
      return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
    // BPOC final statuses
    case "withdrawn":
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
    case "hired":
      return "text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20"
    default:
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
  }
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'withdrawn':
      return <IconCircle className="h-4 w-4 fill-gray-500 stroke-none" />
    case 'qualified':
      return <IconCircle className="h-4 w-4 fill-yellow-500 stroke-none" />
    case 'failed':
      return <IconCircle className="h-4 w-4 fill-red-500 stroke-none" />
    case 'not qualifies':
      return <IconCircle className="h-4 w-4 fill-red-500 stroke-none" />
    case 'not qualified':
      return <IconCircle className="h-4 w-4 fill-red-500 stroke-none" />
    case 'final interview':
      return <IconCircle className="h-4 w-4 fill-pink-500 stroke-none" />
    case 'hired':
      return <IconCircle className="h-4 w-4 fill-orange-500 stroke-none" />
    default:
      return <IconCircle className="h-4 w-4 fill-gray-500 stroke-none" />
  }
}

const getCircleColor = (status: ApplicantStatus) => {
  switch (status) {
    case "submitted":
      return "bg-blue-600/20 dark:bg-blue-600/40 text-blue-700 dark:text-white"
    case "qualified":
      return "bg-yellow-600/20 dark:bg-yellow-600/40 text-yellow-700 dark:text-white"
    case "for verification":
      return "bg-teal-600/20 dark:bg-teal-600/40 text-teal-700 dark:text-white"
    case "verified":
      return "bg-purple-600/20 dark:bg-purple-600/40 text-purple-700 dark:text-white"
    case "initial interview":
      return "bg-amber-600/20 dark:bg-amber-600/40 text-amber-700 dark:text-white"
    case "final interview":
      return "bg-pink-600/20 dark:bg-pink-600/40 text-pink-700 dark:text-white"
    case "not qualifies":
      return "bg-red-600/20 dark:bg-red-600/40 text-red-700 dark:text-white"
    case "not qualified":
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

function DraggingApplicant({ applicant, isExpanded, onStatusUpdate }: { applicant: Applicant; isExpanded: boolean; onStatusUpdate: (applicantId: string, jobIndex: number, newStatus: string) => void }) {
  
  return (
    <Card className="mb-3 p-4 cursor-grabbing overflow-hidden bg-sidebar dark:bg-[#252525] border-primary">
      <div className="flex flex-col">
        <div className="flex-1 min-w-0 relative">
          <div className="cursor-grab active:cursor-grabbing transition-colors duration-200 absolute top-0 right-0">
            <IconGripVertical className="h-5 w-5 text-muted-foreground" />
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
          <div className={`border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mt-6 ${isExpanded ? 'mb-6' : 'mb-3'}`}>

            <div className="flex flex-col gap-3">
                {applicant.all_job_titles && applicant.all_job_titles.length > 0 ? (
                <>
                  <span className="text-xs font-medium text-muted-foreground/70">Applied for:</span>
                  <div className="flex flex-col gap-2">
                    {applicant.all_job_titles.map((jobTitle, index) => (
                      <div key={index} className="rounded-lg p-3 bg-gray-100 dark:bg-[#1a1a1a] hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-primary leading-tight break-words flex-1">
                        {jobTitle}
                      </h4>
                          {(() => {
                            const status = applicant.all_job_statuses?.[index] || applicant.status;
                            const showStatus = ['withdrawn', 'not qualified', 'failed', 'qualified', 'final interview', 'hired'].includes(status.toLowerCase());
                            
                            // Show status badge if job has final status
                            if (showStatus) {
                              // Make badge clickable only when main status is "passed"
                              if (applicant.status.toLowerCase() === 'passed') {
                                return (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Badge 
                                        variant="outline" 
                                        className={`${getStatusColor(status as ApplicantStatus)} px-2 py-0.5 text-xs font-medium rounded-md cursor-pointer hover:opacity-80 transition-opacity popover-trigger status-badge`}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {getStatusDisplayLabel(status)}
                                      </Badge>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-2" align="start" side="bottom" sideOffset={4}>
                                      <div className="space-y-1">
                                        {['withdrawn', 'not qualified', 'qualified', 'final interview', 'hired'].map((statusOption) => (
                                          <div 
                                            key={statusOption}
                                            className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                              status.toLowerCase() === statusOption 
                                                ? 'bg-primary/10 text-primary border border-primary/20 pointer-events-none cursor-default' 
                                                : 'cursor-pointer hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground'
                                            }`}
                                            onClick={async () => {
                                              if (status.toLowerCase() === statusOption) return;
                                              try {
                                                console.log(`Updating BPOC job ${index} status to:`, statusOption);
                                              console.log('Request payload:', { applicantId: applicant.id, jobIndex: index, newStatus: statusOption });
                                                
                                                const response = await fetch('/api/bpoc/update-job-status/', {
                                                  method: 'PATCH',
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                  },
                                                  body: JSON.stringify({
                                                    applicantId: applicant.id,
                                                    jobIndex: index,
                                                    newStatus: statusOption
                                                  })
                                                });
                                                
                                                if (response.ok) {
                                                  const result = await response.json();
                                                  console.log('✅ BPOC job status updated successfully:', result);
                                                  
                                                  // Immediately update the frontend state
                                                  onStatusUpdate(applicant.id, index, statusOption);
                                                } else {
                                                  const error = await response.json();
                                                  console.error('❌ Failed to update BPOC job status:', error);
                                                }
                                              } catch (error) {
                                                console.error('❌ Error updating BPOC job status:', error);
                                              }
                                            }}
                                          >
                                            {getStatusIcon(statusOption)}
                                            <span className="text-sm font-medium">{getStatusDisplayLabel(statusOption)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                );
                              }
                              
                              // Non-clickable badge when main status is not "passed"
                              return (
                                <Badge variant="outline" className={`${getStatusColor(status as ApplicantStatus)} px-2 py-0.5 text-xs font-medium rounded-md`}>
                                  {getStatusDisplayLabel(status)}
                                </Badge>
                              );
                            }
                            
                            // Show "Set Status" button when main status is "passed"
                            if (applicant.status.toLowerCase() === 'passed') {
                              return (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Badge 
                                      variant="outline" 
                                      className="px-2 py-0.5 text-xs font-medium rounded-md cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 border-dashed text-muted-foreground border-muted-foreground/30 popover-trigger status-badge"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Set Status
                                    </Badge>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-2" align="start" side="bottom" sideOffset={4}>
                                    <div className="space-y-1">

                                      {['withdrawn', 'not qualified', 'qualified', 'final interview', 'hired'].map((statusOption) => (
                                        <div 
                                          key={statusOption}
                                          className="flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 cursor-pointer hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground"
                                          onClick={async () => {
                                            const current = (applicant.all_job_statuses?.[index] || applicant.status).toLowerCase();
                                            if (current === statusOption) return;
                                            try {
                                              console.log(`Updating BPOC job ${index} status to:`, statusOption);
                                              console.log('Request payload:', { applicantId: applicant.id, jobIndex: index, newStatus: statusOption });
                                              
                                              const response = await fetch('/api/bpoc/update-job-status/', {
                                                method: 'PATCH',
                                                headers: {
                                                  'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                  applicantId: applicant.id,
                                                  jobIndex: index,
                                                  newStatus: statusOption
                                                })
                                              });
                                              
                                              if (response.ok) {
                                                const result = await response.json();
                                                console.log('✅ BPOC job status updated successfully:', result);
                                                
                                                // Immediately update the frontend state
                                                onStatusUpdate(applicant.id, index, statusOption);
                                              } else {
                                                const error = await response.json();
                                                console.error('❌ Failed to update BPOC job status:', error);
                                                console.error('❌ Response status:', response.status);
                                                console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
                                              }
                                            } catch (error) {
                                              console.error('❌ Error updating BPOC job status:', error);
                                            }
                                          }}
                                        >
                                          {getStatusIcon(statusOption)}
                                          <span className="text-sm font-medium">{getStatusDisplayLabel(statusOption)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              );
                            }
                            
                            return null;
                          })()}
                        </div>
                        <div className="flex items-center justify-between">
                          {applicant.all_companies && applicant.all_companies[index] ? (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <p className="text-xs text-muted-foreground font-medium">
                                {applicant.all_companies[index]}
                              </p>
                  </div>
                ) : (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs text-muted-foreground/50 italic">
                                Company not specified
                              </p>
                            </div>
                          )}
                          {applicant.all_job_timestamps && applicant.all_job_timestamps[index] && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-pointer">
                                    <IconCalendar className="h-4 w-4 text-muted-foreground/70 hover:text-muted-foreground transition-colors" />
              </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="flex items-center gap-1 text-xs">
                                    <span>
                                      {new Date(applicant.all_job_timestamps[index]).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                    <span className="text-muted-foreground/50 mx-1">•</span>
                                    <span>
                                      {new Date(applicant.all_job_timestamps[index]).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </span>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                      ))}
                    </div>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-muted-foreground/70">Applied for:</span>
                  <div className="rounded-lg p-3 bg-gray-100 dark:bg-[#1a1a1a] hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-primary leading-tight break-words flex-1">
                        {applicant.job_title || applicant.concern}
                    </h4>
                      {(() => {
                        const status = applicant.all_job_statuses?.[0] || applicant.status;
                        const showStatus = ['withdrawn', 'qualified', 'failed', 'final interview', 'hired'].includes(status.toLowerCase());
                        return showStatus ? (
                          <Badge variant="outline" className={`${getStatusColor(status as ApplicantStatus)} px-2 py-0.5 text-xs font-medium rounded-md`}>
                            {getStatusDisplayLabel(status)}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex items-center justify-between">
                      {applicant.company_name && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <p className="text-xs text-muted-foreground font-medium">
                            {applicant.company_name}
                          </p>
                        </div>
                      )}
                      {applicant.all_job_timestamps && applicant.all_job_timestamps[0] && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-pointer">
                                <IconCalendar className="h-4 w-4 text-muted-foreground/70 hover:text-muted-foreground transition-colors" />
                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="flex items-center gap-1 text-xs">
                                <span>
                                  {new Date(applicant.all_job_timestamps[0]).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="text-muted-foreground/50 mx-1">•</span>
                                <span>
                                  {new Date(applicant.all_job_timestamps[0]).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="overflow-hidden">
          <div className="space-y-3">
            {applicant.details && (
              <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mb-6">
                <span className="text-xs font-medium text-muted-foreground/70">Additional Details:</span>
                <p className="text-sm text-primary leading-relaxed break-words mt-1">{applicant.details}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-sm h-8 flex-1 rounded-lg shadow-none bg-[#f4f4f4] dark:bg-[#363636] text-gray-700 dark:text-white border-[#cecece99] dark:border-[#4f4f4f99] hover:bg-[#e8e8e8] dark:hover:bg-[#404040] hover:border-[#cecece99] dark:hover:border-[#4f4f4f99]"
              >
                <IconEye className="h-4 w-4 mr-px" />
                <span>View All</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-sm h-8 flex-1 rounded-lg shadow-none bg-[#f4f4f4] dark:bg-[#363636] text-gray-700 dark:text-white border-[#cecece99] dark:border-[#4f4f4f99] hover:bg-[#e8e8e8] dark:hover:bg-[#404040] hover:border-[#cecece99] dark:hover:border-[#4f4f4f99]"
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
    'qualified': 'Qualified',
    'for verification': 'For Verification',
    'verified': 'Verified',
    'initial interview': 'Initial Interview',
    'final interview': 'Final Interview',
    'failed': 'Not Qualified',
    'not qualified': 'Not Qualified',
    'passed': 'Ready for Sale',
    // Additional possible BPOC status values
    'pending': 'Pending',
    'reviewing': 'Reviewing',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'interview': 'Interview',
    'hired': 'Hired'
  }
  return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
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
        {["submitted", "for verification", "verified", "initial interview", "passed", "final interview", "not qualified"].map((status) => (
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

export default function BPOCApplicantsPage() {
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

  // Helper function to map raw database records to Applicant objects
  const mapApplicantData = useCallback((rawData: any, index: number = 0): Applicant => ({
    id: rawData.id,
    ticket_id: rawData.resume_slug || rawData.id,
    user_id: rawData.user_id || rawData.applicant_id,
    resume_slug: rawData.resume_slug,
    concern: rawData.job_title ? `Applied for ${rawData.job_title}` : `Applied for Job #${rawData.job_id}`,
    details: null,
    category: 'Application',
    category_id: null,
    category_name: 'Application',
    status: rawData.status as ApplicantStatus,
    position: rawData.position || index,
    resolved_by: null,
    resolved_at: null,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at || rawData.created_at,
    role_id: null,
    station_id: null,
    profile_picture: rawData.profile_picture || null,
    first_name: rawData.first_name || null,
    last_name: rawData.last_name || null,
    full_name: rawData.full_name || null,
    employee_id: null,
    resolver_first_name: null,
    resolver_last_name: null,
    user_type: 'External',
    member_name: null,
    member_color: null,
    job_title: rawData.job_title || null,
    company_name: rawData.company_name || null,
    // Add recruits data fields
    bpoc_application_ids: rawData.bpoc_application_ids,
    applicant_id: rawData.applicant_id,
    job_ids: rawData.job_ids,
    video_introduction_url: rawData.video_introduction_url,
    current_salary: rawData.current_salary,
    expected_monthly_salary: rawData.expected_monthly_salary,
    shift: rawData.shift,
    // Arrays of all job information (from API enrichment)
    all_job_titles: rawData.all_job_titles,
    all_companies: rawData.all_companies,
    all_job_statuses: rawData.all_job_statuses,
    all_job_timestamps: rawData.all_job_timestamps,
  }), [])

  // Helper function to update job status in local state
  const updateJobStatusInLocalState = useCallback((applicantId: string, jobIndex: number, newStatus: string) => {
    setApplicants(prev => prev.map(app => {
      if (app.id === applicantId && app.all_job_statuses) {
        const updatedStatuses = [...app.all_job_statuses];
        updatedStatuses[jobIndex] = newStatus;
        return {
          ...app,
          all_job_statuses: updatedStatuses
        };
      }
      return app;
    }));

    // Also update the selectedApplicant shown in the modal (if open)
    setSelectedApplicant(prev => {
      if (prev && prev.id === applicantId && prev.all_job_statuses) {
        const updatedStatuses = [...prev.all_job_statuses];
        updatedStatuses[jobIndex] = newStatus;
        return { ...prev, all_job_statuses: updatedStatuses };
      }
      return prev;
    });
  }, []);

  // Helper function to enrich real-time data with BPOC information
  const enrichApplicantData = useCallback(async (rawData: any): Promise<any> => {
    try {
      // Fetch enrichment data from the API for this specific applicant
              const response = await fetch(`/api/bpoc?id=${rawData.id}`)
      if (response.ok) {
        const enrichedData = await response.json()
        // Find the matching applicant in the enriched data
        const enriched = enrichedData.find((app: any) => app.id === rawData.id)
        if (enriched) {
          return enriched
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to enrich real-time data:', error)
    }
    // Return original data if enrichment fails
    return rawData
  }, [])

          // Real-time updates for BPOC applications
  const { isConnected: isRealtimeConnected } = useRealtimeApplicants({
    onApplicantCreated: async (newApplicant) => {
      console.log('🆕 Real-time: New applicant created:', newApplicant)
      // Enrich and map the raw data to Applicant format
      const enrichedData = await enrichApplicantData(newApplicant)
      const mappedApplicant = mapApplicantData(enrichedData)
      setApplicants(prev => [...prev, mappedApplicant])
    },
    onApplicantUpdated: async (updatedApplicant, oldApplicant) => {
      console.log('📝 Real-time: Applicant updated:', updatedApplicant, 'Old:', oldApplicant)
      // Enrich and map the raw data to Applicant format
      const enrichedData = await enrichApplicantData(updatedApplicant)
      const mappedApplicant = mapApplicantData(enrichedData)
      setApplicants(prev => prev.map(applicant => 
        applicant.id === updatedApplicant.id ? mappedApplicant : applicant
      ))
    },
    onApplicantDeleted: (deletedApplicant) => {
      console.log('🗑️ Real-time: Applicant deleted:', deletedApplicant)
      // Remove applicant from the list
      setApplicants(prev => prev.filter(applicant => applicant.id !== deletedApplicant.id))
    }
  })

          // Disable body scroll when on BPOC page
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

          // Load BPOC applications from main database (bpoc_recruits table)
  const fetchApplicants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
              const res = await fetch('/api/bpoc')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to fetch applicants (${res.status})`)
      }
      const data: any[] = await res.json()
              // Map BPOC applications from main database into board items with proper status mapping
      const mapped: Applicant[] = data.map((a, index) => mapApplicantData(a))
      setApplicants(mapped)
    } catch (e: any) {
      setError(e?.message || 'Failed to load applicants')
    } finally {
      setLoading(false)
    }
  }, [mapApplicantData])



  useEffect(() => {
    fetchApplicants()
  }, [fetchApplicants])

  // Auto-save new applications when page loads
  useEffect(() => {
    const autoSaveOnLoad = async () => {
      try {
        console.log('🔄 Auto-saving new applications on page load...')
        console.log('📊 Current BPOC applications count:', applicants.length)
        
        const response = await fetch('/api/bpoc/auto-save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const result = await response.json()
          console.log('📊 Auto-save result:', result)
          
          if (result.savedCount > 0) {
            console.log(`✅ Auto-saved ${result.savedCount} new applications on page load`)
            // Refresh data to show newly saved records
            await fetchApplicants()
          } else {
            console.log('✅ No new applications to save on page load')
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.warn('⚠️ Auto-save on page load failed:', errorData)
        }
      } catch (error) {
        console.warn('⚠️ Auto-save on page load failed, but continuing:', error)
        // Don't block the page load if auto-save fails
      }
    }

    // Run auto-save after initial data fetch (even if no applicants yet)
    if (!loading) {
      autoSaveOnLoad()
    }
  }, [loading, applicants.length, fetchApplicants])

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

  // Helper: compute fractional insert position for precise ordering
  const calculateInsertPosition = (targetApplicants: any[], dropIndex: number) => {
    const sorted = [...targetApplicants].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
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
        const response = await fetch('/api/bpoc', {
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
          // Compute fractional position in target column and persist
          const isOverContainer = over.id.toString().startsWith('droppable-')
          const targetList = applicants
            .filter(a => a.status === activeApplicant.status && a.id !== activeApplicant.id)
          let dropIndex = 0
          if (!isOverContainer) {
            const overApplicant = applicants.find((item) => item.id.toString() === over.id)
            const idx = targetList.findIndex(t => t.id === overApplicant?.id)
            dropIndex = idx === -1 ? targetList.length : idx
          }
          const newPos = calculateInsertPosition(targetList, dropIndex)
          try {
            await fetch('/api/bpoc/positions', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ positions: [{ id: activeApplicant.id, position: newPos }] }),
            })
          } catch {}
          // Update local state with new status and position
          setApplicants(items => items.map(item => 
            item.id === activeApplicant.id 
              ? { ...item, status: activeApplicant.status, position: newPos }
              : item
          ))
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
          console.log('🔄 Reordering BPOC applications within same status:', activeApplicant.status)
          console.log('📊 Old index:', oldIndex, 'New index:', newIndex)
          
          // Reorder within the same status using fractional position for the moved item only
          setApplicants(prev => {
            const targetList = prev.filter(t => t.status === activeApplicant.status && t.id !== activeApplicant.id)
            const isOverContainer = over.id.toString().startsWith('droppable-')
            let dropIndex = 0
            if (!isOverContainer) {
              const overApplicant = prev.find((item) => item.id.toString() === over.id)
              const idx = targetList.findIndex(t => t.id === overApplicant?.id)
              dropIndex = idx === -1 ? targetList.length : idx
            }
            const newPos = calculateInsertPosition(targetList, dropIndex)
            // Persist only the moved item's position
            fetch('/api/bpoc/positions', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ positions: [{ id: activeApplicant.id, position: newPos }] }),
            }).catch(() => {})
            // Update local state for the moved item
            return prev.map(item => item.id === activeApplicant.id ? { ...item, position: newPos } : item)
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

  const statuses: ApplicantStatus[] = ["submitted", "for verification", "verified", "initial interview", "passed"]

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
                            <h1 className="text-2xl font-bold">BPOC Applicants</h1>
        <p className="text-sm text-muted-foreground">Manage and track applicant applications through the recruitment pipeline.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search BPOC applications..."
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



                  <ReloadButton 
                    onReload={fetchApplicants}
                    loading={loading}
                  />
                  
                  {/* Real-time connection indicator removed */}
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
                                    onStatusUpdate={updateJobStatusInLocalState}
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
                        onStatusUpdate={updateJobStatusInLocalState}
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
        onStatusUpdate={updateJobStatusInLocalState}
      />
    </>
  )
}



