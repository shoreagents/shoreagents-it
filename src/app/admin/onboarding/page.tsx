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

type OnboardingStatus = 'New' | 'In Progress' | 'Day 1' | 'Completed'

interface OnboardingItem {
  id: number
  onboarding_id: string
  user_id: number
  title: string
  description: string | null
  status: OnboardingStatus
  position: number
  completed_by: number | null
  completed_at: string | null
  created_at: string
  updated_at: string
  profile_picture: string | null
  first_name: string | null
  last_name: string | null
  employee_id: string | null
  completed_first_name?: string | null
  completed_last_name?: string | null
  completed_profile_picture?: string | null
}

interface SortableOnboardingItemProps {
  item: OnboardingItem
  isLast?: boolean
  isExpanded: boolean
  onToggleExpanded: (itemId: string) => void
  onViewAll: (item: OnboardingItem) => void
  user: any
}

const SortableOnboardingItem = React.memo(function SortableOnboardingItem({ item, isLast = false, isExpanded, onToggleExpanded, onViewAll, user }: SortableOnboardingItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id.toString() })

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
    
    onToggleExpanded(item.id.toString())
  }, [onToggleExpanded, item.id])

  // Cleanup effect for animations
  useEffect(() => {
    return () => {
      // Ensure animations are properly cleaned up when component unmounts
    }
  }, [])

  const cardClassName = useMemo(() => {
    return `${isLast ? '' : 'mb-3'} p-4 transition-all duration-200 cursor-pointer overflow-hidden bg-sidebar dark:bg-[#252525] onboarding-card w-full hover:border-primary/50 hover:text-primary ${
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
                  {item.onboarding_id}
                </span>
                <Badge variant="secondary" className="text-xs h-6 flex items-center bg-blue-100 text-blue-800">
                  Onboarding
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={item.profile_picture || ''} alt={`User ${item.user_id}`} />
              <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                {item.first_name && item.last_name 
                  ? `${item.first_name[0]}${item.last_name[0]}`
                  : String(item.user_id).split(' ').map(n => n[0]).join('')
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-foreground truncate">
                {item.first_name && item.last_name 
                  ? `${item.first_name} ${item.last_name}`
                  : `User ${item.user_id}`
                }
              </span>
            </div>
          </div>
          <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mt-6">
            <span className="text-xs font-medium text-muted-foreground/70">Task:</span>
            <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">{item.title}</h4>
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
              {item.description && (
                <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mb-6">
                  <span className="text-xs font-medium text-muted-foreground/70">Description:</span>
                  <p className="text-sm text-primary leading-relaxed break-words mt-1">{item.description}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="muted" 
                  className="text-sm h-8 flex-1 rounded-lg inline-flex items-center"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewAll(item) }}
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
            <span>Created at:</span>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              })}
            </span>
            <span className="text-muted-foreground/70">•</span>
            <IconClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {new Date(item.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </div>
          {item.status === 'Completed' && item.completed_at && (
            <span className="text-xs font-medium text-muted-foreground/70 truncate">
              Completed by: <span className="text-foreground font-medium">
                {item.completed_by === parseInt(user?.id || '0') 
                  ? 'You'
                  : (item.completed_first_name && item.completed_last_name 
                      ? `${item.completed_first_name}`
                      : (item.completed_by ? `User ${item.completed_by}` : 'Unknown')
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

const getStatusColor = (status: OnboardingStatus) => {
  switch (status) {
    case "New":
      return "text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20"
    case "In Progress":
      return "text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20"
    case "Day 1":
      return "text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20"
    case "Completed":
      return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
    default:
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
  }
}

const getCircleColor = (status: OnboardingStatus) => {
  switch (status) {
    case "New":
      return "bg-blue-600/20 dark:bg-blue-600/40 text-blue-700 dark:text-white"
    case "In Progress":
      return "bg-orange-600/20 dark:bg-orange-600/40 text-orange-700 dark:text-white"
    case "Day 1":
      return "bg-purple-600/20 dark:bg-purple-600/40 text-purple-700 dark:text-white"
    case "Completed":
      return "bg-green-600/20 dark:bg-green-600/40 text-green-700 dark:text-white"
    default:
      return "bg-gray-600/20 dark:bg-gray-600/40 text-gray-700 dark:text-white"
  }
}

function OnboardingItemSkeleton() {
  return (
    <Card className="mb-3 p-4 overflow-hidden bg-sidebar dark:bg-[#252525] onboarding-card w-full rounded-xl">
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

function DraggingOnboardingItem({ item, isExpanded, user }: { item: OnboardingItem; isExpanded: boolean; user: any }) {
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
                  {item.onboarding_id}
                </span>
                <Badge variant="secondary" className="text-xs h-6 flex items-center bg-blue-100 text-blue-800">
                  Onboarding
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={item.profile_picture || ''} alt={`User ${item.user_id}`} />
              <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                {item.first_name && item.last_name 
                  ? `${item.first_name[0]}${item.last_name[0]}`
                  : String(item.user_id).split(' ').map(n => n[0]).join('')
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-foreground truncate">
                {item.first_name && item.last_name 
                  ? `${item.first_name} ${item.last_name}`
                  : `User ${item.user_id}`
                }
              </span>
            </div>
          </div>
          <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mt-6">
            <span className="text-xs font-medium text-muted-foreground/70">Task:</span>
            <h4 className="font-normal text-sm text-primary leading-tight break-words mt-1">{item.title}</h4>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-3 overflow-hidden">
          <div className="space-y-3">
            {item.description && (
              <div className="border border-gray-300 dark:border-[#84848440] rounded-lg p-3 text-left flex flex-col justify-center mb-6">
                <span className="text-xs font-medium text-muted-foreground/70">Description:</span>
                <p className="text-sm text-primary leading-relaxed break-words mt-1">{item.description}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
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
            <span>Created at:</span>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              })}
            </span>
            <span className="text-muted-foreground/70">•</span>
            <IconClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {new Date(item.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </div>
          {item.status === 'Completed' && item.completed_at && (
            <span className="text-xs font-medium text-muted-foreground/70 truncate">
              Completed by: <span className="text-foreground font-medium">{item.completed_by === parseInt(user?.id || '0') ? 'You' : (item.completed_first_name && item.completed_last_name ? `${item.completed_first_name}` : (item.completed_by ? `User ${item.completed_by}` : 'Unknown'))}</span>
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

function OnboardingSkeleton() {
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
        {["New", "In Progress", "Day 1", "Completed"].map((status) => (
          <div key={status} className="flex-shrink-0 w-[400px]">
            <div className="bg-card border border-border rounded-xl transition-all duration-200 flex flex-col shadow-sm min-h-[200px] max-h-[calc(94vh-200px)] status-cell">
              <div className="flex-shrink-0 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`px-3 py-1 font-medium rounded-xl ${
                      status === 'New' ? 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20' :
                      status === 'In Progress' ? 'text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20' :
                      status === 'Day 1' ? 'text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20' :
                      status === 'Completed' ? 'text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20' :
                      'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
                    }`}>
                      {status} <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xl text-xs ml-1 ${
                        status === 'New' ? 'bg-blue-600/20 dark:bg-blue-600/40 text-blue-700 dark:text-white' :
                        status === 'In Progress' ? 'bg-orange-600/20 dark:bg-orange-600/40 text-orange-700 dark:text-white' :
                        status === 'Day 1' ? 'bg-purple-600/20 dark:bg-purple-600/40 text-purple-700 dark:text-white' :
                        status === 'Completed' ? 'bg-green-600/20 dark:bg-green-600/40 text-green-700 dark:text-white' :
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
                  <OnboardingItemSkeleton key={index} />
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

export default function OnboardingPage() {
  const [mounted, setMounted] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [items, setItems] = useState<OnboardingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<OnboardingItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const { user } = useAuth()

  // Mock data for demonstration
  const mockItems: OnboardingItem[] = [
    {
      id: 1,
      onboarding_id: "ONB-001",
      user_id: 1,
      title: "Complete HR Documentation",
      description: "Fill out all required HR forms and submit necessary documents",
      status: "New",
      position: 1,
      completed_by: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile_picture: null,
      first_name: "John",
      last_name: "Doe",
      employee_id: "EMP001"
    },
    {
      id: 2,
      onboarding_id: "ONB-002",
      user_id: 2,
      title: "IT Setup and Access",
      description: "Configure computer, email, and system access",
      status: "In Progress",
      position: 2,
      completed_by: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile_picture: null,
      first_name: "Jane",
      last_name: "Smith",
      employee_id: "EMP002"
    },
    {
      id: 3,
      onboarding_id: "ONB-003",
      user_id: 3,
      title: "First Day Orientation",
      description: "Attend orientation session and meet the team",
      status: "Day 1",
      position: 3,
      completed_by: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile_picture: null,
      first_name: "Mike",
      last_name: "Johnson",
      employee_id: "EMP003"
    },
    {
      id: 4,
      onboarding_id: "ONB-004",
      user_id: 4,
      title: "Training Completion",
      description: "Complete all required training modules",
      status: "Completed",
      position: 4,
      completed_by: 1,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile_picture: null,
      first_name: "Sarah",
      last_name: "Wilson",
      employee_id: "EMP004",
      completed_first_name: "Admin",
      completed_last_name: "User"
    }
  ]

  useEffect(() => {
    setMounted(true)
    fetchItems()
  }, [])

  // Disable body scroll when on onboarding page
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

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)
      // For now, use mock data
      setTimeout(() => {
        setItems(mockItems)
        setLoading(false)
      }, 1000)
    } catch (error) {
      setError('Network error - please check your connection')
      console.error('Error fetching onboarding items:', error)
      setLoading(false)
    }
  }

  // Reload function
  const handleReload = async () => {
    setReloading(true)
    try {
      setError(null)
      // For now, use mock data
      setTimeout(() => {
        setItems(mockItems)
        setError(null)
        setReloading(false)
      }, 500)
    } catch (error) {
      setError('Network error - please check your connection')
      console.error('Error fetching onboarding items:', error)
      setReloading(false)
    }
  }

  const updateItemStatus = async (itemId: number, newStatus: string) => {
    try {
      const requestBody: any = { status: newStatus }
      
      // If the status is being changed to 'Completed', include the current user as completedBy
      if (newStatus === 'Completed' && user?.id) {
        requestBody.completedBy = parseInt(user.id)
      }
      
      // For now, just update local state
      setItems(prevItems => prevItems.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          status: newStatus as OnboardingStatus,
          completed_by: newStatus === 'Completed' ? parseInt(user?.id || '0') : null,
          completed_at: newStatus === 'Completed' ? new Date().toISOString() : null
        }
      }))
    } catch (error) {
      console.error('Error updating item status:', error)
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
        const scrollAmount = e.deltaY * 3;
        container.scrollLeft -= scrollAmount;
      }
    };
    
    document.addEventListener('wheel', handleWheel, { passive: false });
    (window as any).dragWheelHandler = handleWheel;
  }

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event

    if (!active || !over) return

    const activeItem = items.find((item) => item.id.toString() === active.id)
    if (!activeItem) return

    // Handle dropping on a droppable zone (status column)
    if (over.id.toString().startsWith('droppable-')) {
      const targetStatus = over.id.toString().replace('droppable-', '') as OnboardingStatus
      if (activeItem.status !== targetStatus) {
        // Update local state immediately for UI responsiveness
        setItems(prevItems => {
          return prevItems.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: targetStatus }
              : item
          )
        })
        
        // Update database
        updateItemStatus(activeItem.id, targetStatus)
      }
      return
    }

    // Handle dropping on another item
    const overItem = items.find((item) => item.id.toString() === over.id)
    if (overItem && activeItem.id !== overItem.id) {
      // If dropping on an item in a different status, move to that status
      if (activeItem.status !== overItem.status) {
        // Update local state immediately for UI responsiveness
        setItems(prevItems => {
          return prevItems.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: overItem.status as OnboardingStatus }
              : item
          )
        })
        
        // Update database
        updateItemStatus(activeItem.id, overItem.status)
      }
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

    const activeItem = items.find((item) => item.id.toString() === active.id)
    if (!activeItem) return

    // Handle dropping on a droppable zone (status column)
    if (over.id.toString().startsWith('droppable-')) {
      const targetStatus = over.id.toString().replace('droppable-', '') as OnboardingStatus
      
      if (activeItem.status !== targetStatus) {
        // Update local state immediately for UI responsiveness
        setItems((items) => {
          return items.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: targetStatus }
              : item
          )
        })
        
        // Update database
        await updateItemStatus(activeItem.id, targetStatus)
      }
      return
    }

    // Handle dropping on another item
    const overItem = items.find((item) => item.id.toString() === over.id)
    if (overItem && activeItem.id !== overItem.id) {
      // If dropping on an item in a different status, move to that status
      if (activeItem.status !== overItem.status) {
        // Update local state immediately for UI responsiveness
        setItems((items) => {
          return items.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: overItem.status as OnboardingStatus }
              : item
          )
        })
        
        // Update database
        await updateItemStatus(activeItem.id, overItem.status)
      }
    }
  }

  const getItemsByStatus = (status: OnboardingStatus) => {
    const filteredItems = items.filter(item => item.status === status)
    return filteredItems.sort((a, b) => a.position - b.position)
  }

  const getStatusDisplayLabel = (status: string) => {
    return status
  }

  const handleViewAllClick = useCallback((item: OnboardingItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }, [])

  const statuses = ["New", "In Progress", "Day 1", "Completed"]

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
                    <h1 className="text-2xl font-bold">Onboarding</h1>
                    <p className="text-sm text-muted-foreground">Drag and drop onboarding items to manage their status.</p>
                  </div>
                  <div className="flex gap-2">
                    <ReloadButton onReload={handleReload} loading={reloading} className="flex-1" />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search onboarding items..."
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
                <OnboardingSkeleton />
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-red-600 mb-2">{error}</p>
                    <Button onClick={fetchItems} variant="outline">
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
                          const scrollAmount = e.deltaY * 3;
                          container.scrollLeft -= scrollAmount;
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
                                  <Badge variant="outline" className={`${getStatusColor(status as OnboardingStatus)} px-3 py-1 font-medium rounded-xl`}>
                                    {getStatusDisplayLabel(status)} <span className={`inline-flex items-center justify-center w-5 h-5 rounded-xl text-xs ml-1 ${getCircleColor(status as OnboardingStatus)}`}>{getItemsByStatus(status as OnboardingStatus).length}</span>
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <DroppableContainer status={status}>
                              <div className="flex-1 px-4 pb-4 cards-container">
                                <SortableContext
                                  items={getItemsByStatus(status as OnboardingStatus).map(item => item.id.toString())}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {getItemsByStatus(status as OnboardingStatus).map((item, index, array) => (
                                    <SortableOnboardingItem 
                                      key={item.id} 
                                      item={item}
                                      isLast={index === array.length - 1}
                                      isExpanded={expandedItems.has(item.id.toString())}
                                      onToggleExpanded={(itemId) => {
                                        setExpandedItems(prev => {
                                          const newSet = new Set(prev)
                                          if (newSet.has(itemId)) {
                                            newSet.delete(itemId)
                                          } else {
                                            newSet.add(itemId)
                                          }
                                          return newSet
                                        })
                                      }}
                                      onViewAll={handleViewAllClick}
                                      user={user}
                                    />
                                  ))}
                                  
                                  {getItemsByStatus(status as OnboardingStatus).length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20">
                                      <p className="text-sm font-medium">No Items</p>
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
                        <DraggingOnboardingItem 
                          item={items.find(item => item.id.toString() === activeId)!}
                          isExpanded={expandedItems.has(activeId)}
                          user={user}
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              ) : (
                <OnboardingSkeleton />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
