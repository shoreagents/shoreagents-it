"use client"

import * as React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import {
  SidebarInset,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ReloadButton } from "@/components/ui/reload-button"
import { Skeleton } from "@/components/ui/skeleton"

import { IconSearch, IconFilter, IconGripVertical, IconCalendar, IconClock, IconEye, IconUserCheck, IconChevronDown, IconCheck, IconDots, IconTrash } from "@tabler/icons-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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

type VisitStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'No Show'
interface VisitCategory {
  id: number
  name: string
}

interface Visit {
  id: number
  visit_id: string
  user_id: number
  purpose: string
  details: string | null
  category: string
  category_id: number | null
  category_name?: string
  status: VisitStatus
  position: number
  completed_by: number | null
  completed_at: string | null
  created_at: string
  updated_at: string
  role_id: number | null
  station_id: string | null
  profile_picture: string | null
  first_name: string | null
  last_name: string | null
  employee_id: string | null
  completer_first_name?: string | null
  completer_last_name?: string | null
  completer_profile_picture?: string | null
  user_type?: string | null
  member_name?: string | null
  member_color?: string | null
  clear?: boolean
}

interface SortableVisitProps {
  visit: Visit
  isLast?: boolean
  isExpanded: boolean
  onToggleExpanded: (visitId: string) => void
  onViewAll: (visit: Visit) => void
  roleNameById?: Record<number, string>
  user: any
}

const getCategoryBadge = (visit: Visit) => {
  const categoryColors: Record<string, string> = {
    'Meeting': 'bg-blue-100 text-blue-800',
    'Inspection': 'bg-cyan-100 text-cyan-800',
    'Maintenance': 'bg-purple-100 text-purple-800',
    'Delivery': 'bg-green-100 text-green-800',
    'Training': 'bg-yellow-100 text-yellow-800',
    'Consultation': 'bg-orange-100 text-orange-800',
    'Audit': 'bg-indigo-100 text-indigo-800',
    'Support': 'bg-pink-100 text-pink-800',
    'Check-in': 'bg-gray-100 text-gray-800'
  }
  
  return {
    name: visit.category_name || visit.category,
    color: categoryColors[visit.category_name || visit.category] || 'bg-gray-100 text-gray-800'
  }
}

const SortableVisit = React.memo(function SortableVisit({ visit, isLast = false, isExpanded, onToggleExpanded, onViewAll, roleNameById, user }: SortableVisitProps) {
  const [roles, setRoles] = useState<Array<{ id: number; name: string; description: string | null }>>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: visit.id.toString() })

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
    
    onToggleExpanded(visit.id.toString())
  }, [onToggleExpanded, visit.id])

  const fetchRoles = useCallback(async () => {
    if (roles.length > 0 || rolesLoading) return
    setRolesLoading(true)
    try {
      const res = await fetch('/api/visits?resource=roles', { method: 'PUT' })
      if (res.ok) {
        const data = await res.json()
        setRoles(data)
      }
    } catch (e) {
      console.error('Failed to load roles', e)
    } finally {
      setRolesLoading(false)
    }
  }, [roles.length, rolesLoading])

  const handleAssignRole = useCallback(async (roleId: number) => {
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assignRole', userId: visit.user_id, roleId, visitId: visit.id })
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        console.log('Role assigned')
        setIsAssignOpen(false)
        // Update local visit with returned fields if present
        if (data.visit) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (visit as any).role_id = data.visit.role_id ?? roleId
        }
      } else {
        const err = await res.json().catch(() => ({}))
        console.error('Assign role failed', err)
        }
      } catch (e) {
        console.error('Assign role error', e)
      }
    }, [visit.user_id])

  // Cleanup effect for animations
  useEffect(() => {
    return () => {
      // Ensure animations are properly cleaned up when component unmounts
      // No need to clean up expanded state as it's managed globally
    }
  }, [])

  const categoryBadge = useMemo(() => getCategoryBadge(visit), [visit.category, visit.category_name])

  const cardClassName = useMemo(() => {
    return `${isLast ? '' : 'mb-3'} p-4 transition-all duration-200 cursor-pointer overflow-hidden bg-sidebar dark:bg-[#252525] visit-card w-full hover:border-primary/50 hover:text-primary ${
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
                  {visit.visit_id}
                </span>
                <Badge variant="secondary" className={`text-xs h-6 flex items-center ${categoryBadge?.color || 'bg-gray-100 text-gray-800'}`}>
                  {categoryBadge?.name || 'General'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={visit.profile_picture || ''} alt={`User ${visit.user_id}`} />
              <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                {visit.first_name && visit.last_name 
                  ? `${visit.first_name[0]}${visit.last_name[0]}`
                  : String(visit.user_id).split(' ').map(n => n[0]).join('')
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-foreground truncate">
                {visit.first_name && visit.last_name 
                  ? `${visit.first_name} ${visit.last_name}`
                  : `User ${visit.user_id}`
                }
              </span>
            </div>
          </div>
          <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mt-6">
            <span className="text-xs font-medium text-muted-foreground/70">Purpose:</span>
            <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">{visit.purpose}</h4>
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
              {visit.details && (
                <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mb-6">
                  <span className="text-xs font-medium text-muted-foreground/70">Additional Details:</span>
                  <p className="text-sm text-primary leading-relaxed break-words mt-1">{visit.details}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Popover open={isAssignOpen} onOpenChange={(open) => { setIsAssignOpen(open); if (open) fetchRoles() }}>
                  <PopoverTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-sm h-8 flex-1 rounded-lg shadow-none bg-[#f4f4f4] dark:bg-[#363636] text-gray-700 dark:text-white border-[#cecece99] dark:border-[#4f4f4f99] hover:bg-[#e8e8e8] dark:hover:bg-[#404040] hover:border-[#cecece99] dark:hover:border-[#4f4f4f99] inline-flex items-center"
                      onMouseDown={(e) => { e.stopPropagation() }}
                      onClick={(e) => { e.stopPropagation() }}
                    >
                      <IconUserCheck className="h-4 w-4 mr-px" />
                      <span>{roleNameById && visit.role_id ? (roleNameById[visit.role_id] || 'Assign Role') : 'Assign Role'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56 p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
                    {rolesLoading ? (
                      <div className="text-xs text-muted-foreground px-2 py-1.5">Loading...</div>
                    ) : roles.length === 0 ? (
                      <div className="text-xs text-muted-foreground px-2 py-1.5">No roles found</div>
                    ) : (
                      <div className="max-h-60 overflow-auto space-y-1">
                        {roles.map((role) => {
                          const isActiveRole = role.id === (visit as any).role_id
                          return (
                            <button
                              key={role.id}
                              data-state={isActiveRole ? 'checked' : undefined}
                              className={`relative w-full text-left text-sm py-1.5 pl-2 pr-8 rounded-lg transition-colors flex items-center hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent/90 ${
                                isActiveRole ? 'cursor-default' : ''
                              }`}
                              onClick={isActiveRole ? undefined : (e) => { e.preventDefault(); e.stopPropagation(); handleAssignRole(role.id) }}
                            >
                              <span>{role.name}</span>
                              {isActiveRole && (
                                <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                                  <IconCheck className="h-4 w-4" />
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                <Button 
                  size="sm" 
                  variant="muted" 
                  className="text-sm h-8 flex-1 rounded-lg inline-flex items-center"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewAll(visit) }}
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
            <span>Scheduled at:</span>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">
              {new Date(visit.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              })}
            </span>
            <span className="text-muted-foreground/70">•</span>
            <IconClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {new Date(visit.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </div>
          {visit.status === 'Completed' && visit.completed_at && (
            <span className="text-xs font-medium text-muted-foreground/70 truncate">
              Completed by: <span className="text-foreground font-medium">{visit.completed_by === parseInt(user?.id || '0') ? 'You' : (visit.completer_first_name && visit.completer_last_name ? `${visit.completer_first_name}` : (visit.completed_by ? `User ${visit.completed_by}` : 'Unknown'))}</span>
            </span>
          )}
        </div>
      </div>
    </Card>
  )
})

const getStatusColor = (status: VisitStatus) => {
  switch (status) {
    case "Scheduled":
      return "text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20"
    case "In Progress":
      return "text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20"
    case "Completed":
      return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
    case "Cancelled":
      return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
    case "Rescheduled":
      return "text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20"
    case "No Show":
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
    default:
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
  }
}

const getCircleColor = (status: VisitStatus) => {
  switch (status) {
    case "Scheduled":
      return "bg-blue-600/20 dark:bg-blue-600/40 text-blue-700 dark:text-white"
    case "In Progress":
      return "bg-orange-600/20 dark:bg-orange-600/40 text-orange-700 dark:text-white"
    case "Completed":
      return "bg-green-600/20 dark:bg-green-600/40 text-green-700 dark:text-white"
    case "Cancelled":
      return "bg-red-600/20 dark:bg-red-600/40 text-red-700 dark:text-white"
    case "Rescheduled":
      return "bg-yellow-600/20 dark:bg-yellow-600/40 text-yellow-700 dark:text-white"
    case "No Show":
      return "bg-gray-600/20 dark:bg-gray-600/40 text-gray-700 dark:text-white"
    default:
      return "bg-gray-600/20 dark:bg-gray-600/40 text-gray-700 dark:text-white"
  }
}

function VisitSkeleton() {
  return (
    <Card className="mb-3 p-4 overflow-hidden bg-sidebar dark:bg-[#252525] visit-card w-full rounded-xl">
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

function DraggingVisit({ visit, isExpanded, roleNameById, user }: { visit: Visit; isExpanded: boolean; roleNameById?: Record<number, string>; user: any }) {
  const categoryBadge = getCategoryBadge(visit)
  
  return (
    <Card className="mb-3 p-4 cursor-grabbing overflow-hidden bg-sidebar dark:bg-[#252525] border-primary">
      <div className="flex flex-col mb-3">
        <div className="flex-1 min-w-0 relative">
          <div className="cursor-grab active:cursor-grabbing transition-colors duration-200 absolute top-0 right-0">
            <IconGripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col text-xs text-muted-foreground py-1 rounded-none mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-[6px] h-6 flex items-center">
                  {visit.visit_id}
                </span>
                <Badge variant="secondary" className={`text-xs h-6 flex items-center ${categoryBadge?.color || 'bg-gray-100 text-gray-800'}`}>
                  {categoryBadge?.name || 'General'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={visit.profile_picture || ''} alt={`User ${visit.user_id}`} />
              <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                {visit.first_name && visit.last_name 
                  ? `${visit.first_name[0]}${visit.last_name[0]}`
                  : String(visit.user_id).split(' ').map(n => n[0]).join('')
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-foreground truncate">
                {visit.first_name && visit.last_name 
                  ? `${visit.first_name} ${visit.last_name}`
                  : `User ${visit.user_id}`
                }
              </span>
            </div>
          </div>
          <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mt-6">
            <span className="text-xs font-medium text-muted-foreground/70">Purpose:</span>
            <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">{visit.purpose}</h4>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-3 overflow-hidden">
          <div className="space-y-3">
            {visit.details && (
              <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mb-6">
                <span className="text-xs font-medium text-muted-foreground/70">Additional Details:</span>
                <p className="text-sm text-primary leading-relaxed break-words mt-1">{visit.details}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="muted" 
                className="text-sm h-8 flex-1 rounded-lg inline-flex items-center"
              >
                <IconUserCheck className="h-4 w-4 mr-px" />
                <span>{roleNameById && visit.role_id ? (roleNameById[visit.role_id] || 'Assign Role') : 'Assign Role'}</span>
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
              <span>Scheduled at:</span>
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">
                {new Date(visit.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric'
                })}
              </span>
              <span className="text-muted-foreground/70">•</span>
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {new Date(visit.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
          {visit.status === 'Completed' && visit.completed_at && (
            <span className="text-xs font-medium text-muted-foreground/70 truncate">
              Completed by: <span className="text-foreground font-medium">{visit.completed_by === parseInt(user?.id || '0') ? 'You' : (visit.completer_first_name && visit.completer_last_name ? `${visit.completer_first_name}` : (visit.completed_by ? `User ${visit.completed_by}` : 'Unknown'))}</span>
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

function VisitsSkeleton() {
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
        {["Scheduled", "In Progress", "Completed", "Cancelled", "Rescheduled", "No Show"].map((status) => (
          <div key={status} className="flex-shrink-0 w-[400px]">
            <div className="bg-card border border-border rounded-xl transition-all duration-200 flex flex-col shadow-sm min-h-[200px] max-h-[calc(94vh-200px)] status-cell">
              <div className="flex-shrink-0 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`px-3 py-1 font-medium rounded-xl ${
                      status === 'Scheduled' ? 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20' :
                      status === 'In Progress' ? 'text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20' :
                      status === 'Completed' ? 'text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20' :
                      status === 'Cancelled' ? 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20' :
                      status === 'Rescheduled' ? 'text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20' :
                      status === 'No Show' ? 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20' :
                      'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
                    }`}>
                      {status} <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xl text-xs ml-1 ${
                        status === 'Scheduled' ? 'bg-blue-600/20 dark:bg-blue-600/40 text-blue-700 dark:text-white' :
                        status === 'In Progress' ? 'bg-orange-600/20 dark:bg-orange-600/40 text-orange-700 dark:text-white' :
                        status === 'Completed' ? 'bg-green-600/20 dark:bg-green-600/40 text-green-700 dark:text-white' :
                        status === 'Cancelled' ? 'bg-red-600/20 dark:bg-red-600/40 text-red-700 dark:text-white' :
                        status === 'Rescheduled' ? 'bg-yellow-600/20 dark:bg-yellow-600/40 text-yellow-700 dark:text-white' :
                        status === 'No Show' ? 'bg-gray-600/20 dark:bg-gray-600/40 text-gray-700 dark:text-white' :
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
                  <VisitSkeleton key={index} />
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
      data-status={status}
      className="h-full overflow-y-auto transition-colors duration-200"
    >
      {children}
    </div>
  )
}

export default function VisitsPage() {
  const [mounted, setMounted] = useState(false)
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set())
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [roleNameById, setRoleNameById] = useState<Record<number, string>>({})
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const [clearStatus, setClearStatus] = useState<string>('')
  const [clearCount, setClearCount] = useState(0)
  const { user } = useAuth()

  // Track visits being manually updated to prevent real-time conflicts
  const [manuallyUpdatingVisits, setManuallyUpdatingVisits] = useState<Set<number>>(new Set())
  
  // Debounce state updates to prevent rapid re-renders
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null)

  // Function to clear all completed visits in a status column
  const clearAllCompletedVisitsInStatus = async (status: string) => {
    try {
      // Get all completed visits in this status column
      const completedVisitsInStatus = visits.filter(visit => visit.status === 'Completed')
      
      if (completedVisitsInStatus.length === 0) {
        console.log('No completed visits to clear in status:', status)
        return
      }

      // Clear all completed visits in this status
      const clearPromises = completedVisitsInStatus.map(visit => 
        fetch('/api/visits/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitId: visit.id, action: 'clear' })
        })
      )

      const responses = await Promise.all(clearPromises)
      const allSuccessful = responses.every(response => response.ok)

      if (allSuccessful) {
        // Realtime system will handle removing cleared visits from view
        console.log(`Cleared ${completedVisitsInStatus.length} visits from ${status} column`)
      } else {
        console.error('Failed to clear some visits')
      }
    } catch (error) {
      console.error('Error clearing visits:', error)
    }
  }

  // Function to show clear confirmation modal
  const showClearConfirmationModal = (status: string) => {
    const completedVisitsCount = visits.filter(v => v.status === 'Completed').length
    setClearStatus(status)
    setClearCount(completedVisitsCount)
    setShowClearConfirmation(true)
  }

  // Function to handle clear confirmation
  const handleClearConfirm = async () => {
    setShowClearConfirmation(false)
    if (clearStatus) {
      await clearAllCompletedVisitsInStatus(clearStatus)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchVisits()
    // Preload roles map for label display
    fetch('/api/visits?resource=roles', { method: 'PUT' })
      .then(res => res.ok ? res.json() : [])
      .then((roles: Array<{ id: number; name: string }>) => {
        const map: Record<number, string> = {}
        roles.forEach(r => { map[r.id] = r.name })
        setRoleNameById(map)
      })
      .catch(() => {})

  }, [])

  // Disable body scroll when on visits page
  useEffect(() => {
    document.body.classList.add('no-scroll')
    return () => {
      document.body.classList.remove('no-scroll')
    }
  }, [])

  // Cleanup manually updating visits on unmount
  useEffect(() => {
    return () => {
      setManuallyUpdatingVisits(new Set())
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
    }
  }, [updateTimeout])

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

  const fetchVisits = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/visits?admin=true')
      if (response.ok) {
        const data = await response.json()
        setVisits(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to fetch visits')
        console.error('Failed to fetch visits:', response.status, errorData)
      }
    } catch (error) {
      setError('Network error - please check your connection')
      console.error('Error fetching visits:', error)
    } finally {
      setLoading(false)
    }
  }

  // Reload function
  const handleReload = async () => {
    setReloading(true)
    try {
      // Don't set loading to true during reload to keep the UI visible
      setError(null)
      
      const response = await fetch('/api/visits?admin=true')
      if (response.ok) {
        const data = await response.json()
        setVisits(data)
        setError(null) // Clear any previous errors
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to fetch visits')
        console.error('Failed to fetch visits:', response.status, errorData)
      }
    } catch (error) {
      setError('Network error - please check your connection')
      console.error('Error fetching visits:', error)
    } finally {
      setReloading(false)
    }
  }

  const updateVisitStatus = async (visitId: number, newStatus: string) => {
    console.log('🔄 updateVisitStatus called for visit:', visitId, 'new status:', newStatus)
    try {
      // Mark this visit as being manually updated
      console.log('🔒 Marking visit as manually updating:', visitId)
      setManuallyUpdatingVisits(prev => new Set(prev).add(visitId))
      
      const requestBody: any = { status: newStatus }
      
      // If the status is being changed to 'Completed', include the current user as completedBy
      if (newStatus === 'Completed' && user?.id) {
        // Convert string ID to number for the database
        requestBody.completedBy = parseInt(user.id)
      }
      
      const response = await fetch(`/api/visits/${visitId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ updateVisitStatus successful:', result)
        // Update with complete visit data from server (no defensive merging needed)
        setVisits(prevVisits => prevVisits.map((item) => {
          if (item.id !== visitId) return item
          return result
        }))
        
        // Remove from manually updating set after successful update
        console.log('🔓 Removing visit from manually updating set (success):', visitId)
        setManuallyUpdatingVisits(prev => {
          const newSet = new Set(prev)
          newSet.delete(visitId)
          return newSet
        })
      } else {
        const errorData = await response.json()
        console.error('❌ updateVisitStatus failed:', errorData)
        // Remove from manually updating set on error
        console.log('🔓 Removing visit from manually updating set (error):', visitId)
        setManuallyUpdatingVisits(prev => {
          const newSet = new Set(prev)
          newSet.delete(visitId)
          return newSet
        })
        // Revert local state on error
        console.log('🔄 Reverting local state due to error...')
        await fetchVisits()
      }
    } catch (error) {
      console.error('❌ updateVisitStatus error:', error)
      // Remove from manually updating set on error
      setManuallyUpdatingVisits(prev => {
        const newSet = new Set(prev)
        newSet.delete(visitId)
        return newSet
      })
      // Revert local state on error
      console.log('🔄 Reverting local state due to error...')
      await fetchVisits()
    }
  }

  // Update all positions in a column to maintain proper sequential order
  const updateColumnPositions = async (status: VisitStatus, movedVisitId: number, insertIndex: number) => {
    try {
      console.log('🔄 Checking if column position update needed:', { status, movedVisitId, insertIndex })
      
      // Get all visits in this status (excluding the moved visit)
      const columnVisits = visits.filter(v => v.status === status && v.id !== movedVisitId)
      
      // Sort by current position to maintain relative order
      columnVisits.sort((a, b) => (a.position || 0) - (b.position || 0))
      
      // Insert the moved visit at the specified index
      const movedVisit = visits.find(v => v.id === movedVisitId)
      if (!movedVisit) {
        console.log('❌ Moved visit not found, skipping update')
        return
      }
      
      columnVisits.splice(insertIndex, 0, { ...movedVisit, status })
      
      // Calculate new sequential positions with overflow protection
      const basePosition = getStatusCode(status)
      const maxVisitsPerStatus = 999 // Maximum visits per status to prevent overflow
      
      if (columnVisits.length > maxVisitsPerStatus) {
        console.warn(`⚠️ Too many visits in ${status} (${columnVisits.length}). Maximum is ${maxVisitsPerStatus}`)
      }
      
      const positionUpdates = columnVisits.map((visit, index) => ({
        id: visit.id,
        position: basePosition + ((index + 1) * 10) // 10010, 10020, 10030, etc.
      }))
      
      console.log('📊 Column position updates:', {
        status,
        movedVisitId,
        insertIndex,
        totalVisits: columnVisits.length,
        positionUpdates: positionUpdates.map(u => ({ id: u.id, oldPos: visits.find(v => v.id === u.id)?.position, newPos: u.position }))
      })
      
      if (positionUpdates.length > 0) {
        // Update all positions in one API call
        const response = await fetch('/api/visits/positions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positions: positionUpdates })
        })
        
        if (response.ok) {
          console.log('✅ Column positions updated successfully')
          
          // Update local state with new positions
          setVisits(prevVisits => {
            return prevVisits.map(visit => {
              const update = positionUpdates.find(u => u.id === visit.id)
              return update ? { ...visit, position: update.position, status } : visit
            })
          })
        } else {
          const errorData = await response.json()
          console.error('❌ API response error:', errorData)
          throw new Error(`Failed to update column positions: ${errorData.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('❌ Column position update failed:', error)
      // Don't throw the error to prevent application crashes
      console.log('🔄 Continuing without position update...')
    }
  }

  const updateVisitPosition = async (visitId: number, newPosition: number, newStatus?: VisitStatus) => {
    try {
      // Mark this visit as being manually updated
      console.log('🔒 Marking visit as manually updating:', visitId)
      setManuallyUpdatingVisits(prev => new Set(prev).add(visitId))
      
      const requestBody = { 
        positions: [{ id: visitId, position: newPosition }] 
      }
      
      console.log('🌐 FRONTEND - Making API call to /api/visits/positions with:', requestBody)
      const response = await fetch(`/api/visits/positions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      console.log('🌐 FRONTEND - API response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Position updated successfully:', { visitId, newPosition, newStatus })
        
        // Update local state instead of refetching
        setVisits(prevVisits => {
          return prevVisits.map((item) => 
            item.id === visitId 
              ? { 
                  ...item, 
                  position: newPosition,
                  ...(newStatus && { status: newStatus })
                }
              : item
          )
        })
        
        // Remove from manually updating set after successful update
        console.log('🔓 Removing visit from manually updating set (success):', visitId)
        setManuallyUpdatingVisits(prev => {
          const newSet = new Set(prev)
          newSet.delete(visitId)
          return newSet
        })
      } else {
        const errorData = await response.json()
        console.warn('Position update failed (non-critical):', errorData)
        // Position updates are non-critical, don't trigger full refresh
        // Just remove from manually updating set
        setManuallyUpdatingVisits(prev => {
          const newSet = new Set(prev)
          newSet.delete(visitId)
          return newSet
        })
        // Throw error to be caught by caller
        throw new Error(`Position update failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.warn('Position update error (non-critical):', error)
      // Position updates are non-critical, don't trigger full refresh
      // Just remove from manually updating set
      setManuallyUpdatingVisits(prev => {
        const newSet = new Set(prev)
        newSet.delete(visitId)
        return newSet
      })
      // Re-throw error to be caught by caller
      throw error
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Helper function to get status code for position calculation
  const getStatusCode = (status: string): number => {
    const statusMap: Record<string, number> = {
      'Scheduled': 10000,    // 10,000 range (supports 999 visits)
      'In Progress': 20000,  // 20,000 range
      'Completed': 30000,    // 30,000 range  
      'Cancelled': 40000,    // 40,000 range
      'Rescheduled': 50000,  // 50,000 range
      'No Show': 60000       // 60,000 range
    }
    return statusMap[status] || 10000
  }

  // Compute integer position within a target list using status-based ranges
  const calculateInsertPosition = (targetVisits: any[], dropIndex: number, status?: string) => {
    const sorted = [...targetVisits].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    console.log('🧮 calculateInsertPosition:', { 
      targetVisitsLength: targetVisits.length, 
      sortedLength: sorted.length, 
      dropIndex, 
      status,
      sortedPositions: sorted.map(v => ({ id: v.id, position: v.position }))
    })
    
    // If no visits in this status, start with base position
    if (sorted.length === 0) {
      const basePos = status ? getStatusCode(status) : 1000
      const result = basePos + 10
      console.log('🧮 Empty list, returning:', result)
      return result
    }
    
    // Handle dropping at the very top
    if (dropIndex === 0) {
      const firstPos = Number(sorted[0]?.position ?? 1000)
      const basePos = status ? getStatusCode(status) : Math.floor(firstPos / 1000) * 1000
      return Math.max(basePos + 1, firstPos - 10)
    }
    
    // Handle dropping at the very bottom
    if (dropIndex >= sorted.length) {
      const lastPos = Number(sorted[sorted.length - 1]?.position ?? 0)
      return lastPos + 10
    }
    
    // Handle dropping in the middle
    const prevPos = Number(sorted[dropIndex - 1]?.position ?? 0)
    const nextPos = Number(sorted[dropIndex]?.position ?? prevPos + 20)
    
    // Calculate a position between the previous and next visits
    const gap = nextPos - prevPos
    let result
    if (gap >= 2) {
      // If there's enough space, place exactly in the middle
      result = Math.round(prevPos + (gap / 2))
    } else {
      // If positions are too close, place right after previous
      result = prevPos + 1
    }
    console.log('🧮 Final position calculated:', result)
    return result
  }

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

    const activeVisit = visits.find((item) => item.id.toString() === active.id)
    if (!activeVisit) return

    // Handle dropping on a droppable zone (status column)
    if (over.id.toString().startsWith('droppable-')) {
      const targetStatus = over.id.toString().replace('droppable-', '') as VisitStatus
      if (activeVisit.status !== targetStatus) {
        // Update local state immediately for UI responsiveness
        setVisits(prevVisits => {
          return prevVisits.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: targetStatus }
              : item
          )
        })
        
        // Update database
        updateVisitStatus(activeVisit.id, targetStatus)
      }
      return
    }

    // Handle dropping on another visit
    const overVisit = visits.find((item) => item.id.toString() === over.id)
    if (overVisit && activeVisit.id !== overVisit.id) {
      // If dropping on a visit in a different status, move to that status
      if (activeVisit.status !== overVisit.status) {
        // Update local state immediately for UI responsiveness
        setVisits(prevVisits => {
          return prevVisits.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: overVisit.status as VisitStatus }
              : item
          )
        })
        
        // Update database
        updateVisitStatus(activeVisit.id, overVisit.status)
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

    if (!active || !over) {
      console.log('🚫 Drag ended without valid active/over - no drop occurred')
      return
    }

    const activeVisit = visits.find((item) => item.id.toString() === active.id)
    if (!activeVisit) {
      console.log('🚫 Active visit not found:', active.id)
      return
    }

    // Check if dropping on the same visit (no change needed)
    if (active.id === over.id) {
      console.log('🚫 Dropped on same visit - no change needed')
      return
    }

    // Only proceed if there's a valid drop target
    console.log('✅ Valid drop detected:', { activeId: active.id, overId: over.id })

    console.log('🎯 Drag ended:', {
      activeVisit: activeVisit.id,
      activeStatus: activeVisit.status,
      overId: over.id,
      overType: over.id.toString().startsWith('droppable-') ? 'column' : 'visit'
    })

    // Handle dropping on a droppable zone (status column)
    if (over.id.toString().startsWith('droppable-')) {
      const targetStatus = over.id.toString().replace('droppable-', '') as VisitStatus
      console.log('🎯 Dropping on column:', { targetStatus, currentStatus: activeVisit.status })
      
      if (activeVisit.status !== targetStatus) {
        // Update local state immediately for UI responsiveness
        setVisits((items) => {
          return items.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: targetStatus }
              : item
          )
        })
        
        try {
          // Update database status first (critical)
          await updateVisitStatus(activeVisit.id, targetStatus)
          
          // Try to update position (non-critical, can fail gracefully)
          try {
            const targetList = visits.filter(v => v.status === targetStatus && v.id !== activeVisit.id)
            
            // Calculate drop index based on mouse position relative to the column
            const columnElement = document.querySelector(`[data-status="${targetStatus}"]`) as HTMLElement
            let dropIndex = targetList.length // Default to bottom
            
            if (columnElement) {
              const columnRect = columnElement.getBoundingClientRect()
              // Try to get mouse position from the event, fallback to center of column
              let mouseY = columnRect.top + (columnRect.height / 2) // Default to center
              
              // Check if we can get mouse position from the event
              if (event.activatorEvent && 'clientY' in event.activatorEvent) {
                mouseY = (event.activatorEvent as MouseEvent).clientY
              }
              
              const relativeY = mouseY - columnRect.top
              const columnHeight = columnRect.height
              
              // Determine drop position based on mouse location
              if (relativeY < columnHeight * 0.25) {
                dropIndex = 0 // Top quarter
              } else if (relativeY < columnHeight * 0.75) {
                dropIndex = Math.floor(targetList.length / 2) // Middle
              } else {
                dropIndex = targetList.length // Bottom quarter
              }
            }
            
            const newPos = calculateInsertPosition(targetList, dropIndex, targetStatus)
            console.log('📍 Calculated position for column drop:', { 
              targetStatus, 
              dropIndex, 
              targetListLength: targetList.length, 
              newPos 
            })
            
            // Update all positions in the target column to maintain proper order
            await updateColumnPositions(targetStatus, activeVisit.id, dropIndex)
            // Status update is handled separately
          } catch (positionError) {
            console.warn('Position update failed, but status change succeeded:', positionError)
            // Position update failed, but status change succeeded - this is acceptable
            // Don't trigger full refresh, just keep the current position
          }
        } catch (statusError) {
          console.error('Status update failed:', statusError)
          // Only revert on critical status failure
          setVisits((items) => {
            return items.map((item) => 
              item.id.toString() === active.id 
                ? { ...item, status: activeVisit.status } // Revert to original status
                : item
            )
          })
        }
      } else {
        // Same status drop on column - move to bottom of column
        console.log('🔄 Same status drop on column:', { status: activeVisit.status })
        try {
          const targetList = visits.filter(v => v.status === activeVisit.status && v.id !== activeVisit.id)
          
          // Calculate drop index based on mouse position relative to the column
          const columnElement = document.querySelector(`[data-status="${targetStatus}"]`) as HTMLElement
          let dropIndex = targetList.length // Default to bottom
          
          if (columnElement) {
            const columnRect = columnElement.getBoundingClientRect()
            // Try to get mouse position from the event, fallback to center of column
            let mouseY = columnRect.top + (columnRect.height / 2) // Default to center
            
            // Check if we can get mouse position from the event
            if (event.activatorEvent && 'clientY' in event.activatorEvent) {
              mouseY = (event.activatorEvent as MouseEvent).clientY
            }
            
            const relativeY = mouseY - columnRect.top
            const columnHeight = columnRect.height
            
            // Determine drop position based on mouse location
            if (relativeY < columnHeight * 0.25) {
              dropIndex = 0 // Top quarter
            } else if (relativeY < columnHeight * 0.75) {
              dropIndex = Math.floor(targetList.length / 2) // Middle
            } else {
              dropIndex = targetList.length // Bottom quarter
            }
          }
          
          // Check if the visit is already in the correct position
          const currentVisits = visits.filter(v => v.status === activeVisit.status)
          const sortedVisits = currentVisits.sort((a, b) => (a.position || 0) - (b.position || 0))
          const currentIndex = sortedVisits.findIndex(v => v.id === activeVisit.id)
          
          console.log('📍 Same status column drop calculation:', { 
            targetListLength: targetList.length, 
            dropIndex,
            currentIndex,
            needsReorder: currentIndex !== dropIndex
          })
          
          // Only update if the position actually needs to change
          if (currentIndex !== dropIndex) {
            // Update UI immediately for responsiveness (optimistic update)
            const basePosition = getStatusCode(activeVisit.status)
            const reorderedVisits = [...currentVisits]
            const movedVisit = reorderedVisits.find(v => v.id === activeVisit.id)!
            reorderedVisits.splice(currentIndex, 1) // Remove from current position
            reorderedVisits.splice(dropIndex, 0, movedVisit) // Insert at new position
            
            // Update positions optimistically
            const optimisticUpdates = reorderedVisits.map((visit, index) => ({
              ...visit,
              position: basePosition + ((index + 1) * 10)
            }))
            
            // Apply optimistic updates to UI
            setVisits(prev => prev.map(visit => {
              const optimisticUpdate = optimisticUpdates.find(u => u.id === visit.id)
              return optimisticUpdate || visit
            }))
            
            // Update all positions in the column to maintain proper order (background)
            await updateColumnPositions(activeVisit.status, activeVisit.id, dropIndex)
          } else {
            console.log('✅ Visit already in correct position, no update needed')
          }
          // Position update is handled inside updateColumnPositions function
        } catch (positionError) {
          console.warn('Position update failed during same status column drop:', positionError)
        }
      }
      return
    }

    // Handle dropping on another visit
    const overVisit = visits.find((item) => item.id.toString() === over.id)
    console.log('🎯 Dropping on visit:', { overVisit: overVisit?.id, overStatus: overVisit?.status, sameVisit: activeVisit.id === overVisit?.id })
    if (overVisit && activeVisit.id !== overVisit.id) {
      // If dropping on a visit in a different status, move to that status
      if (activeVisit.status !== overVisit.status) {
        console.log('🔄 Status change needed:', { from: activeVisit.status, to: overVisit.status })
        // Update local state immediately for UI responsiveness
        setVisits((items) => {
          return items.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: overVisit.status as VisitStatus }
              : item
          )
        })
        
        try {
          // Update database status first (critical)
          await updateVisitStatus(activeVisit.id, overVisit.status)
          
          // Try to update position (non-critical, can fail gracefully)
          try {
            const targetList = visits.filter(v => v.status === overVisit.status && v.id !== activeVisit.id)
            const idx = targetList.findIndex(v => v.id === overVisit.id)
            const dropIndex = idx === -1 ? targetList.length : idx
            // Update all positions in the target column to maintain proper order
            await updateColumnPositions(overVisit.status as VisitStatus, activeVisit.id, dropIndex)
            // Position and status update is handled inside updateColumnPositions function
          } catch (positionError) {
            console.warn('Position update failed, but status change succeeded:', positionError)
            // Position update failed, but status change succeeded - this is acceptable
            // Don't trigger full refresh, just keep the current position
          }
        } catch (statusError) {
          console.error('Status update failed:', statusError)
          // Only revert on critical status failure
          setVisits((items) => {
            return items.map((item) => 
              item.id.toString() === active.id 
                ? { ...item, status: activeVisit.status } // Revert to original status
                : item
            )
          })
        }
      } else {
        // Same status, reordering - compute a fractional position for the moved visit only
        console.log('🔄 Same status reordering:', { status: activeVisit.status })
        try {
          const targetList = visits.filter(v => v.status === activeVisit.status && v.id !== activeVisit.id)
          const overIdx = targetList.findIndex(v => v.id.toString() === over.id)
          const dropIndex = overIdx === -1 ? targetList.length : overIdx
          // Check if the visit is already in the correct position
          const currentVisits = visits.filter(v => v.status === activeVisit.status)
          const sortedVisits = currentVisits.sort((a, b) => (a.position || 0) - (b.position || 0))
          const currentIndex = sortedVisits.findIndex(v => v.id === activeVisit.id)
          
          console.log('📍 Reordering calculation:', { 
            targetListLength: targetList.length, 
            overIdx, 
            dropIndex,
            currentIndex,
            needsReorder: currentIndex !== dropIndex
          })
          
          // Only update if the position actually needs to change
          if (currentIndex !== dropIndex) {
            // Update UI immediately for responsiveness (optimistic update)
            const basePosition = getStatusCode(activeVisit.status)
            const reorderedVisits = [...currentVisits]
            const movedVisit = reorderedVisits.find(v => v.id === activeVisit.id)!
            reorderedVisits.splice(currentIndex, 1) // Remove from current position
            reorderedVisits.splice(dropIndex, 0, movedVisit) // Insert at new position
            
            // Update positions optimistically
            const optimisticUpdates = reorderedVisits.map((visit, index) => ({
              ...visit,
              position: basePosition + ((index + 1) * 10)
            }))
            
            // Apply optimistic updates to UI
            setVisits(prev => prev.map(visit => {
              const optimisticUpdate = optimisticUpdates.find(u => u.id === visit.id)
              return optimisticUpdate || visit
            }))
            
            // Update all positions in the column to maintain proper order (background)
            await updateColumnPositions(activeVisit.status, activeVisit.id, dropIndex)
          } else {
            console.log('✅ Visit already in correct position, no update needed')
          }
          // Position update is handled inside updateColumnPositions function
        } catch (positionError) {
          console.warn('Position update failed during reordering:', positionError)
          // Position update failed during reordering - this is acceptable
          // Don't trigger full refresh, just keep the current position
        }
      }
    } else if (overVisit) {
      // Handle dropping on the same visit or same status reordering
      console.log('🔄 Same visit or same status reordering detected')
      
      // Even if it's the same visit, we might need to update position based on drop location
      if (activeVisit.status === overVisit.status) {
        console.log('🔄 Same status reordering within column')
        try {
          const targetList = visits.filter(v => v.status === activeVisit.status && v.id !== activeVisit.id)
          const overIdx = targetList.findIndex(v => v.id === overVisit.id)
          const dropIndex = overIdx === -1 ? targetList.length : overIdx
          // Check if the visit is already in the correct position
          const currentVisits = visits.filter(v => v.status === activeVisit.status)
          const sortedVisits = currentVisits.sort((a, b) => (a.position || 0) - (b.position || 0))
          const currentIndex = sortedVisits.findIndex(v => v.id === activeVisit.id)
          
          console.log('📍 Same status reordering calculation:', { 
            targetListLength: targetList.length, 
            overIdx, 
            dropIndex,
            currentIndex,
            needsReorder: currentIndex !== dropIndex
          })
          
          // Only update if the position actually needs to change
          if (currentIndex !== dropIndex) {
            // Update UI immediately for responsiveness (optimistic update)
            const basePosition = getStatusCode(activeVisit.status)
            const reorderedVisits = [...currentVisits]
            const movedVisit = reorderedVisits.find(v => v.id === activeVisit.id)!
            reorderedVisits.splice(currentIndex, 1) // Remove from current position
            reorderedVisits.splice(dropIndex, 0, movedVisit) // Insert at new position
            
            // Update positions optimistically
            const optimisticUpdates = reorderedVisits.map((visit, index) => ({
              ...visit,
              position: basePosition + ((index + 1) * 10)
            }))
            
            // Apply optimistic updates to UI
            setVisits(prev => prev.map(visit => {
              const optimisticUpdate = optimisticUpdates.find(u => u.id === visit.id)
              return optimisticUpdate || visit
            }))
            
            // Update all positions in the column to maintain proper order (background)
            await updateColumnPositions(activeVisit.status, activeVisit.id, dropIndex)
          } else {
            console.log('✅ Visit already in correct position, no update needed')
          }
          // Position update is handled inside updateColumnPositions function
        } catch (positionError) {
          console.warn('Position update failed during same status reordering:', positionError)
        }
      }
    }
  }

  const getVisitsByStatus = (status: VisitStatus) => {
    const filteredVisits = visits.filter(visit => visit.status === status)
    return filteredVisits.sort((a, b) => a.position - b.position)
  }

  const getStatusDisplayLabel = (status: string) => {
    return status
  }

  const handleViewAllClick = useCallback((visit: Visit) => {
    setSelectedVisit(visit)
    setIsModalOpen(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
    setSelectedVisit(null)
  }, [])

  const statuses = ["Scheduled", "In Progress", "Completed", "Cancelled", "Rescheduled", "No Show"]

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
                    <h1 className="text-2xl font-bold">Visits</h1>
                    <p className="text-sm text-muted-foreground">Drag and drop visits to manage their status.</p>
                  </div>
                  <div className="flex gap-2">
                    <ReloadButton onReload={handleReload} loading={reloading} className="flex-1" />
                  </div>
                </div>
                

                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search visits..."
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
                <VisitsSkeleton />
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-red-600 mb-2">{error}</p>
                    <Button onClick={fetchVisits} variant="outline">
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
                                  <Badge variant="outline" className={`${getStatusColor(status as VisitStatus)} px-3 py-1 font-medium rounded-xl`}>
                                    {getStatusDisplayLabel(status)} <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xl text-xs ml-1 ${getCircleColor(status as VisitStatus)}`}>{getVisitsByStatus(status as VisitStatus).length}</span>
                                  </Badge>
                                </div>
                                {status === 'Completed' && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button 
                                        className="text-xs h-7 w-7 p-0 text-muted-foreground border-0 bg-transparent hover:bg-sidebar-accent focus:outline-none focus:ring-0 rounded-md transition-colors flex items-center justify-center group"
                                      >
                                        <IconDots className="h-5 w-5 text-muted-foreground group-hover:text-sidebar-accent-foreground transition-colors" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" className="w-32 p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
                                      <div>
                                        <button
                                          className="clear-all-button relative w-full text-left text-sm py-1.5 pl-2 pr-8 rounded-lg transition-colors flex items-center hover:bg-sidebar-accent active:bg-sidebar-accent/90"
                                          onClick={(e) => { 
                                            e.preventDefault(); 
                                            e.stopPropagation(); 
                                            showClearConfirmationModal(status);
                                          }}
                                        >
                                          <IconTrash className="h-4 w-4 mr-2" />
                                          Clear All
                                        </button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            </div>
                            <DroppableContainer status={status}>
                              <div className="flex-1 px-4 pb-4 cards-container">
                                <SortableContext
                                  items={getVisitsByStatus(status as VisitStatus).map(visit => visit.id.toString())}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {getVisitsByStatus(status as VisitStatus).map((visit, index, array) => (
                                    <SortableVisit 
                                      key={visit.id} 
                                      visit={visit}
                                      isLast={index === array.length - 1}
                                      isExpanded={expandedVisits.has(visit.id.toString())}
                                      onToggleExpanded={(visitId) => {
                                        setExpandedVisits(prev => {
                                          const newSet = new Set(prev)
                                          if (newSet.has(visitId)) {
                                            newSet.delete(visitId)
                                          } else {
                                            newSet.add(visitId)
                                          }
                                          return newSet
                                        })
                                      }}
                                      onViewAll={handleViewAllClick}
                                      roleNameById={roleNameById}
                                      user={user}
                                    />
                                  ))}
                                  
                                  {getVisitsByStatus(status as VisitStatus).length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20">
                                      <p className="text-sm font-medium">No Visits</p>
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
                        <DraggingVisit 
                          visit={visits.find(visit => visit.id.toString() === activeId)!}
                          isExpanded={expandedVisits.has(activeId)}
                          roleNameById={roleNameById}
                          user={user}
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              ) : (
                <VisitsSkeleton />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={showClearConfirmation} onOpenChange={setShowClearConfirmation}>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Clear All</h2>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">Clear all {clearCount} completed visits? You can still view them in the records page.</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowClearConfirmation(false)}
            >
              No
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearConfirm}
            >
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
