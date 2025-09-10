"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconGlobe, IconWorld, IconCreditCard, IconPlus, IconUpload, IconX, IconSearch, IconLink, IconMinus, IconCheck, IconSun, IconMoon, IconCalendarEvent, IconX as IconCancel, IconCheck as IconDone, IconCalendarPlus, IconX as IconClose } from "@tabler/icons-react"
// import { useRealtimeMembers } from '@/hooks/use-realtime-members'
import { SendHorizontal, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataFieldRow } from "@/components/ui/fields"

import { Popover, PopoverContent, PopoverTrigger, PopoverItem } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Calendar } from "@/components/ui/calendar"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { EventsActivityLog } from "@/components/events-activity-log"
import { Comment, CommentData } from "@/components/ui/comment"
import { AgentSelection, type Agent } from "@/components/agent-selection"

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventAdded?: (event: EventData) => void
  eventToEdit?: EventData & { id?: number } | null
}

interface EventData {
  id?: number
  title: string
  description: string | null
  event_date: string // date format YYYY-MM-DD
  start_time: string // time format HH:MM
  end_time: string // time format HH:MM
  location: string | null
  status: 'upcoming' | 'today' | 'cancelled' | 'ended'
  created_by: number
  created_at?: string
  updated_at?: string
  event_type: 'event' | 'activity' | string
}

const eventTypeOptions = [
  { value: 'event', label: 'Event' },
  { value: 'activity', label: 'Activity' }
]

const eventStatusOptions = [
  { value: 'upcoming', label: 'Upcoming', icon: 'blue', color: 'blue' },
  { value: 'today', label: 'Today', icon: 'orange', color: 'orange' },
  { value: 'cancelled', label: 'Cancelled', icon: 'red', color: 'red' },
  { value: 'ended', label: 'Ended', icon: 'green', color: 'green' }
]


// Badge helper functions for events
const getEventTypeBadgeClass = (eventType: string | null): string => {
  const s = eventType || ''
  if (s === 'event') {
    return 'text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20'
  }
  if (s === 'activity') {
    return 'text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20'
  }
  return 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
}

const getEventStatusBadgeClass = (status: string | null): string => {
  const s = status || ''
  switch (s) {
    case 'upcoming':
      return 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20'
    case 'today':
      return 'text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20'
    case 'cancelled':
      return 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20'
    case 'ended':
      return 'text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20'
    default:
      return 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
  }
}

const getEventStatusIcon = (status: string | null) => {
  return <Target className="h-4 w-4 text-muted-foreground" />
}


export function AddEventModal({ isOpen, onClose, onEventAdded, eventToEdit }: AddEventModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  
  // Real-time updates for member changes (not needed for events)
  // const { isConnected } = useRealtimeMembers()

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false)
  const [comment, setComment] = React.useState("")
  const [isCommentFocused, setIsCommentFocused] = React.useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
  const [commentsList, setCommentsList] = React.useState<CommentData[]>([])
  const [isLoadingComments, setIsLoadingComments] = React.useState(false)
  const [isEditingEvent, setIsEditingEvent] = React.useState(false)
  const [localEventDate, setLocalEventDate] = React.useState<Date | undefined>(undefined)
  
  // Database sync state
  const [lastDatabaseSync, setLastDatabaseSync] = React.useState<Date | null>(null)
  
  const [formData, setFormData] = React.useState<EventData>({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    status: 'upcoming',
    created_by: user?.id ? Number(user.id) : 0,
    event_type: 'event'
  })
  
  // Event-specific state
  const [isLoadingEvent, setIsLoadingEvent] = React.useState(false)

  // Agent selection state
  const [showAgentSelection, setShowAgentSelection] = React.useState(false)
  const [agents, setAgents] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, employee_id: string | null, job_title: string | null, profile_picture: string | null, member_company: string | null, member_badge_color: string | null}>>([])
  const [selectedAgents, setSelectedAgents] = React.useState<Set<number>>(new Set())
  const [selectedAgentsData, setSelectedAgentsData] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, employee_id: string | null, job_title: string | null, profile_picture: string | null, member_company: string | null, member_badge_color: string | null}>>([])
  const [isLoadingAgents, setIsLoadingAgents] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [totalCount, setTotalCount] = React.useState(0)
  const [agentSearch, setAgentSearch] = React.useState('')
  const [isAgentsHovered, setIsAgentsHovered] = React.useState(false)

  // Reset editing state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      // When opening for a new event, start in edit mode
      // When opening for an existing event, start in view mode
      setIsEditingEvent(!eventToEdit?.id)
      
      if (!eventToEdit?.id) {
        console.log('🔄 Opening modal for new event')
        setFormData({
          title: '',
          description: '',
          event_date: '',
          start_time: '',
          end_time: '',
          location: '',
          status: 'upcoming',
          created_by: user?.id ? Number(user.id) : 0,
          event_type: 'event'
        })
        setLocalEventDate(undefined)
      } else {
        // When opening for editing an existing event, start in view mode
        console.log('🔄 Opening modal for editing event:', eventToEdit.id)
        setIsLoadingEvent(true)
        
        setFormData({
          id: eventToEdit.id,
          title: eventToEdit.title || '',
          description: eventToEdit.description || '',
          event_date: eventToEdit.event_date || '',
          start_time: eventToEdit.start_time || '',
          end_time: eventToEdit.end_time || '',
          location: eventToEdit.location || '',
          status: (eventToEdit.status as 'upcoming' | 'today' | 'cancelled' | 'ended') || 'upcoming',
          created_by: eventToEdit.created_by || (user?.id ? Number(user.id) : 0),
          event_type: (eventToEdit.event_type as 'event' | 'activity') || 'event',
          created_at: eventToEdit.created_at,
          updated_at: eventToEdit.updated_at
        })
        // Load comments for existing event
        loadComments(eventToEdit.id)
      
      // Initialize local event date
        if (eventToEdit.event_date) {
          const [year, month, day] = eventToEdit.event_date.split('-').map(Number)
        setLocalEventDate(new Date(year, month - 1, day))
            } else {
        setLocalEventDate(undefined)
      }
        
        // Simulate loading time for skeleton effect
        setTimeout(() => {
          setIsLoadingEvent(false)
        }, 500)
      }
    }
  }, [isOpen, eventToEdit, user?.id])

  // Agent selection effects
  React.useEffect(() => {
    if (showAgentSelection) {
      console.log('🔍 Agent selection opened - resetting pagination state')
      setCurrentPage(1)
      setHasMore(true)
      setTotalCount(0)
      setAgentSearch('')
      setIsLoadingAgents(true)
      fetchAgents(1, false, '')
    }
  }, [showAgentSelection])

  // Debounced search effect
  React.useEffect(() => {
    if (!showAgentSelection) return

    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      setHasMore(true)
      setTotalCount(0)
      fetchAgents(1, false, agentSearch)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [agentSearch, showAgentSelection])

  // Cleanup effect to reset selection states when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setShowAgentSelection(false)
      console.log('🧹 Modal closed - resetting all selection states')
    }
  }, [isOpen])

  // Update database function
  const updateDatabase = async (data: EventData) => {
    if (!eventToEdit?.id) return
    
    try {
      console.log('🔄 Updating event in database...', data)
      
      const response = await fetch(`/api/events/${eventToEdit.id}`, {
            method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
            body: JSON.stringify({
          title: data.title,
          description: data.description,
          event_date: data.event_date,
          start_time: data.start_time,
          end_time: data.end_time,
          location: data.location,
          status: data.status,
          event_type: data.event_type
            })
          })
          
          if (!response.ok) {
        throw new Error(`Database update failed: ${response.status}`)
      }
      
      console.log('✅ Database updated successfully')
      
    } catch (error) {
      console.error('❌ Database update error:', error)
      throw error
    }
  }

  const handleInputChange = (field: keyof EventData, value: string | null) => {
    console.log(`🔄 handleInputChange called with field: ${field}, value:`, value)
    console.log(`🔍 Current formData.${field}:`, formData[field])
    
    const newData = {
      ...formData,
      [field]: value
    }
    
    console.log(`📝 Setting new formData for ${field}:`, newData[field])
    setFormData(newData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      console.log('🔄 Submitting event form...', formData)
      
      if (eventToEdit?.id) {
        // Update existing event
        await updateDatabase(formData)
        console.log('✅ Event updated successfully')
      } else {
        // Create new event
        const response = await fetch('/api/events', {
          method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
          body: JSON.stringify(formData)
        })
        
        if (!response.ok) {
          throw new Error(`Failed to create event: ${response.status}`)
        }
        
        const newEvent = await response.json()
        console.log('✅ Event created successfully:', newEvent)
        
        if (onEventAdded) {
          onEventAdded(newEvent)
        }
      }
      
      onClose()
      
        } catch (error) {
      console.error('❌ Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return formData.title.trim() !== '' && 
           formData.event_date !== '' && 
           formData.start_time !== '' && 
           formData.end_time !== ''
  }

  const handleDelete = async () => {
    if (!eventToEdit?.id) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/events/${eventToEdit.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.status}`)
      }
      
      console.log('✅ Event deleted successfully')
      onClose()
      
    } catch (error) {
      console.error('❌ Delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Load existing comments for the event
  const loadComments = async (eventId: number) => {
    try {
      setIsLoadingComments(true)
      const response = await fetch(`/api/events/${eventId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setCommentsList(data.comments || [])
      } else {
        console.error('Failed to fetch comments:', response.status)
        setCommentsList([])
      }
    } catch (error) {
      console.error('Error loading comments:', error)
      setCommentsList([])
    } finally {
      setIsLoadingComments(false)
    }
  }

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !eventToEdit?.id || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch(`/api/events/${eventToEdit.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: comment.trim(),
        }),
      })

      if (response.ok) {
        setComment('')
        // Reload comments to show the new one
        await loadComments(eventToEdit.id)
      } else {
        console.error('Failed to submit comment')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Handle comment deletion
  const handleCommentDelete = async (commentId: string) => {
    if (!eventToEdit?.id) return

    try {
      const response = await fetch(`/api/events/${eventToEdit.id}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Reload comments to reflect the deletion
        await loadComments(eventToEdit.id)
        } else {
        console.error('Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  // Event title editing handlers
  const handleEventEdit = () => {
    setIsEditingEvent(true)
  }

  const handleEventSave = (value: string) => {
    handleInputChange('title', value)
    setIsEditingEvent(false)
  }

  const handleEventCancel = () => {
    setIsEditingEvent(false)
  }

  // Agent selection functions
  const openAgentSelection = () => {
    setShowAgentSelection(true)
    console.log('🔍 Agent selection opened:', true)
  }

  const closeSelectionContainers = () => {
    setShowAgentSelection(false)
    console.log('📝 Selection containers closed')
  }

  // Fetch agents function
  const fetchAgents = async (page: number = 1, append: boolean = false, searchQuery: string = '') => {
    if (isLoadingMore) return
    
    try {
      if (page === 1) {
        setIsLoadingAgents(true)
      } else {
        setIsLoadingMore(true)
      }
      
      const response = await fetch(`/api/agents/modal?page=${page}&limit=20&search=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.status}`)
      }
      
      const data = await response.json()
      const newAgents = data.agents || []
      
      if (append) {
        setAgents(prev => [...prev, ...newAgents])
      } else {
        setAgents(newAgents)
      }
      
      setHasMore(data.hasMore || false)
      setTotalCount(data.totalCount || 0)
      setCurrentPage(page)
      
    } catch (error) {
      console.error('❌ Error fetching agents:', error)
    } finally {
      if (page === 1) {
        setIsLoadingAgents(false)
      } else {
        setIsLoadingMore(false)
      }
    }
  }

  // Load more agents function
  const loadMoreAgents = () => {
    if (hasMore && !isLoadingMore) {
      fetchAgents(currentPage + 1, true, agentSearch)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-7xl max-h-[95vh] overflow-hidden p-0 rounded-xl"
        style={{ backgroundColor: theme === 'dark' ? '#111111' : '#f8f9fa' }}
      >
        <DialogTitle className="sr-only">Add Event</DialogTitle>
        <div className="flex h-[95vh]">
          {/* Left Panel - Form */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
              <div className="flex items-center gap-3">
                <Badge className="text-xs h-6 flex items-center rounded-[6px]">
                  Event
                </Badge>
              </div>
            </div>

            {/* Event Header */}
            <div className="px-6 py-5">
              {/* Event Title - Editable Title */}
              {(!eventToEdit && isEditingEvent) || (eventToEdit && isEditingEvent) ? (
                <div className="mb-4">
                  <Input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Event Title"
                    autoFocus
                    className="text-2xl font-semibold h-auto px-3 py-0 !border !border-sidebar-border dark:!border-border !bg-[#ebebeb] dark:!bg-[#0a0a0a] rounded-lg transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                    style={{ minHeight: '2.5rem' }}
                    onBlur={() => {
                      if (eventToEdit) {
                        handleEventSave(formData.title || '')
                      } else {
                        // When adding new event, convert to text mode when losing focus
                        setIsEditingEvent(false)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (eventToEdit) {
                          handleEventSave(formData.title || '')
                        } else {
                          // When adding new event, convert to text mode on Enter
                          setIsEditingEvent(false)
                        }
                      } else if (e.key === 'Escape') {
                        if (eventToEdit) {
                          handleEventCancel()
                        } else {
                          // When adding new event, convert to text mode on Escape
                          setIsEditingEvent(false)
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="text-2xl font-semibold mb-4 px-3 py-0 cursor-pointer hover:bg-[#ebebeb] dark:hover:bg-[#0a0a0a] rounded-lg transition-colors duration-200 flex items-center border border-transparent"
                  style={{ minHeight: '2.5rem' }}
                  onClick={() => {
                    // Always allow editing when clicked
                    setIsEditingEvent(true)
                  }}
                >
                  {formData.title || 'Event Title'}
                </div>
              )}
              
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Event Type */}
                <div className="flex items-center gap-2">
                  <IconTag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Type:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className={`px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center ${
                          formData.event_type ? getEventTypeBadgeClass(formData.event_type) : 'text-muted-foreground'
                        }`}
                      >
                        {formData.event_type ? eventTypeOptions.find(opt => opt.value === formData.event_type)?.label || formData.event_type : 'Set Type'}
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-32 p-2">
                      {eventTypeOptions.map((option) => {
                        const isCurrentType = formData.event_type === option.value;
                        return (
                          <PopoverItem
                            key={option.value}
                            variant="primary"
                            isSelected={isCurrentType}
                            onClick={() => handleInputChange('event_type', option.value)}
                          >
                            {option.value === 'event' ? (
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            ) : option.value === 'activity' ? (
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                            )}
                            <span className="text-sm font-medium">{option.label}</span>
                          </PopoverItem>
                        );
                      })}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Event Status */}
                <div className="flex items-center gap-2">
                  {getEventStatusIcon(formData.status)}
                  <span className="text-muted-foreground">Status:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className={`px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center ${
                          formData.status ? getEventStatusBadgeClass(formData.status) : 'text-muted-foreground'
                        }`}
                      >
                        {formData.status ? eventStatusOptions.find(opt => opt.value === formData.status)?.label || formData.status : 'Set Status'}
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-2">
                      {eventStatusOptions.map((option) => {
                        const isCurrentStatus = formData.status === option.value;
                        return (
                          <PopoverItem
                            key={option.value}
                            variant="primary"
                            isSelected={isCurrentStatus}
                            onClick={() => handleInputChange('status', option.value)}
                          >
                            {option.icon === 'blue' ? (
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            ) : option.icon === 'orange' ? (
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            ) : option.icon === 'red' ? (
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            ) : option.icon === 'green' ? (
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                            )}
                            <span className="text-sm font-medium">{option.label}</span>
                          </PopoverItem>
                        );
                      })}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0">
              {isLoadingEvent ? (
                <div className="space-y-6">
                  {/* Description Section Skeleton */}
                  <div>
                    <Skeleton className="h-6 w-24 mb-4" />
                    <div className="rounded-lg p-6 text-sm leading-relaxed border border-[#cecece99] dark:border-border bg-transparent">
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Event Information Section Skeleton */}
                  <div>
                    <div className="flex items-center justify-between min-h-[40px]">
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className={`grid grid-cols-[180px_auto_1fr] gap-2 h-[33px] items-center ${index === 3 ? '' : 'border-b border-[#cecece99] dark:border-border'}`}>
                          <div className="flex items-center gap-3 min-w-0 px-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                          <div className="min-w-0 flex items-center relative">
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
              <form id="add-event-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Description Section */}
                <div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-4">Description</h3>
                    <div className="rounded-lg p-6 text-sm leading-relaxed border border-[#cecece99] dark:border-border bg-transparent">
                      <Textarea
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Enter event description..."
                        tabIndex={-1}
                        className="min-h-[120px] resize-none border-0 bg-transparent dark:bg-transparent text-foreground placeholder:text-muted-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm leading-relaxed w-full rounded-none"
                      />
                    </div>
                  </div>
                  
                {/* Event Information Section */}
                  <div>
                    <div className="flex items-center justify-between min-h-[40px]">
                    <h3 className="text-lg font-medium text-muted-foreground">Details</h3>
                    </div>
                    {/* Event Information Container */}
                    <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                    {/* Event Date */}
                    <DataFieldRow
                      icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Event Date"
                      fieldName="event_date"
                      value={localEventDate ? localEventDate.toLocaleDateString() : ''}
                      onSave={() => {}}
                      placeholder="-"
                      customInput={
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              tabIndex={-1}
                              className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                localEventDate ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {localEventDate ? localEventDate.toLocaleDateString() : "-"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={localEventDate}
                              onSelect={(date) => {
                                setLocalEventDate(date)
                                if (date) {
                                  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                                  handleInputChange('event_date', dateStr)
                                }
                                console.log('Event date changed to:', date)
                              }}
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                      }
                    />

                    {/* Start Time */}
                    <DataFieldRow
                      icon={<IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Start Time"
                      fieldName="start_time"
                      value={formData.start_time || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof EventData, value)}
                      placeholder="-"
                      customInput={
                        <Input
                          type="time"
                          value={formData.start_time || ''}
                          onChange={(e) => handleInputChange('start_time', e.target.value)}
                          tabIndex={-1}
                          className="h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none"
                        />
                      }
                    />

                    {/* End Time */}
                    <DataFieldRow
                      icon={<IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="End Time"
                      fieldName="end_time"
                      value={formData.end_time || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof EventData, value)}
                      placeholder="-"
                      customInput={
                        <Input
                          type="time"
                          value={formData.end_time || ''}
                          onChange={(e) => handleInputChange('end_time', e.target.value)}
                          tabIndex={-1}
                          className="h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none"
                        />
                      }
                    />

                    {/* Location */}
                    <DataFieldRow
                      icon={<IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Location"
                      fieldName="location"
                      value={formData.location || ''}
                      onSave={(fieldName, value) => handleInputChange(fieldName as keyof EventData, value)}
                      placeholder="-"
                      isLast={true}
                    />

                  </div>
                </div>

                {/* Invite Agents Section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between min-h-[40px]">
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Invite Agents
                      {selectedAgents.size > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({selectedAgents.size})
                        </span>
                      )}
                    </h3>
                    <button
                      type="button"
                      onClick={async () => {
                        // Force hover state to false immediately on click
                        setIsAgentsHovered(false)
                        // Small delay to ensure state update, then open selection
                        setTimeout(() => openAgentSelection(), 100)
                      }}
                      onMouseEnter={() => setIsAgentsHovered(true)}
                      onMouseLeave={() => setIsAgentsHovered(false)}
                      className="text-sm text-primary hover:text-primary/80 transition-all duration-300 cursor-pointer flex items-center gap-2 group"
                    >
                      <AnimatePresence>
                        {isAgentsHovered && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="whitespace-nowrap overflow-hidden flex items-center"
                          >
                            Add Agents
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <AnimatePresence mode="wait">
                        {!showAgentSelection && (
                          <motion.div
                            key="agent-icon"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          >
                            <IconPlus className="h-4 w-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                  
                  <div className="rounded-lg border border-[#cecece99] dark:border-border">
                    {/* Agent Fields */}
                    <div className="p-4">
                      {isLoadingEvent ? (
                        <div className="space-y-2">
                          {[...Array(2)].map((_, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                              <div className="flex-1">
                                <Skeleton className="h-3 w-20" />
                              </div>
                              <Skeleton className="w-3 h-3" />
                            </div>
                          ))}
                        </div>
                      ) : selectedAgents.size > 0 ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {selectedAgentsData.map((agent) => (
                              <div key={agent.user_id} className="relative flex items-center gap-2 p-2 px-3 bg-primary/5 border border-primary/20 rounded-lg min-w-0">
                                <Avatar className="w-6 h-6 flex-shrink-0">
                                  <AvatarImage src={agent.profile_picture || undefined} alt={agent.first_name || 'Agent'} />
                                  <AvatarFallback className="text-xs">
                                    {agent.first_name && agent.last_name 
                                      ? `${agent.first_name.charAt(0)}${agent.last_name.charAt(0)}`
                                      : agent.first_name?.charAt(0) || agent.last_name?.charAt(0) || 'A'
                                    }
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 max-w-[120px]">
                                  <h4 className="text-xs truncate">
                                    {agent.first_name && agent.last_name 
                                      ? `${agent.first_name} ${agent.last_name}` 
                                      : agent.first_name || agent.last_name || 'Unknown Name'
                                    }
                                  </h4>
                                  <span className="text-xs text-muted-foreground truncate block">
                                    {agent.employee_id || 'No ID'}
                                  </span>
                                </div>
                                <button
                                  onClick={async () => {
                                    const newSelected = new Set(selectedAgents)
                                    newSelected.delete(agent.user_id)
                                    
                                    // Update local state immediately for responsive UI
                                    setSelectedAgents(newSelected)
                                    setSelectedAgentsData(prev => prev.filter(a => a.user_id !== agent.user_id))
                                  }}
                                  className="absolute -top-2 -right-2 w-5 h-5 text-white rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0 shadow-sm border-0"
                                  style={{ backgroundColor: theme === 'dark' ? '#626262' : '#888787' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#7a7a7a' : '#9a9a9a'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#626262' : '#888787'}
                                >
                                  <IconMinus className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <p className="text-sm">No Agents Added</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                              </form>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-sidebar">
              <div className="flex items-center gap-3">
                {/* Show Save button only when adding a new event (not editing) AND modal is open */}
                {isOpen && !eventToEdit?.id && (
                  <Button type="submit" form="add-event-form" disabled={isSubmitting || !isFormValid()} size="sm">
                    {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
                )}

                {/* Show Delete button only when editing an existing event AND modal is open */}
                {isOpen && eventToEdit?.id && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-96 flex flex-col border-l border-[#cecece99] dark:border-border h-full bg-[#ececec] dark:bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border flex-shrink-0">
              <h3 className="font-medium">
                {showAgentSelection ? 'Select Agents' : 'Activity'}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 bg-[#ececec] dark:bg-[#0a0a0a]">
              {showAgentSelection ? (
                <AgentSelection
                  agents={agents}
                  selectedAgentIds={selectedAgents}
                  onSelectionChange={(agentId, isSelected) => {
                    const agent = agents.find(a => a.user_id === agentId)
                    if (!agent) return

                    const newSelected = new Set(selectedAgents)
                    if (isSelected) {
                      newSelected.add(agentId)
                      setSelectedAgentsData(prev => {
                        if (prev.some(a => a.user_id === agentId)) {
                          return prev
                        }
                        return [...prev, agent]
                      })
                    } else {
                      newSelected.delete(agentId)
                      setSelectedAgentsData(prev => prev.filter(a => a.user_id !== agentId))
                    }
                    
                    setSelectedAgents(newSelected)
                  }}
                  onSearchChange={setAgentSearch}
                  searchValue={agentSearch}
                  isLoading={isLoadingAgents}
                  isLoadingMore={isLoadingMore}
                  hasMore={hasMore}
                  onLoadMore={loadMoreAgents}
                  onDone={closeSelectionContainers}
                  showDisabledStyling={false}
                />
              ) : (
                // Activity Content - Shows event activity and recent changes
                <div>
                {eventToEdit?.id ? (
                  <EventsActivityLog 
                    eventId={eventToEdit.id} 
                    eventTitle={eventToEdit.title || 'Unknown Event'} 
                      onRefresh={() => {
                        // Real-time updates handle refresh automatically
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No Activities Found</p>
                        </div>
                  )}
                      </div>
              )}
                        </div>

            {/* Comment Input Section - Outside main content */}
            {!showAgentSelection && (
              <div className="px-3 pb-3 bg-[#ececec] dark:bg-[#0a0a0a]">
                <div className="flex gap-2">
                                      <div className="flex-1">
                    {isLoadingEvent ? (
                      <div className="border rounded-lg bg-sidebar p-3">
                        <Skeleton className="h-6 w-full" />
                      </div>
                    ) : (
                      <form onSubmit={handleCommentSubmit}>
                        <div className={`border rounded-lg bg-sidebar overflow-hidden transition-all duration-300 ease-in-out [&>*]:border-none [&>*]:outline-none [&>textarea]:transition-all [&>textarea]:duration-300 [&>textarea]:ease-in-out ${
                          isCommentFocused || comment.trim() 
                            ? 'border-muted-foreground' 
                            : 'border-border'
                        }`}>
                          <textarea 
                            placeholder="Write a comment..." 
                            value={comment}
                            onChange={(e) => {
                              setComment(e.target.value)
                              // Auto-resize the textarea
                              e.target.style.height = 'auto'
                              e.target.style.height = e.target.scrollHeight + 'px'
                            }}
                            onFocus={(e) => {
                              setIsCommentFocused(true)
                            }}
                            onBlur={(e) => {
                              setIsCommentFocused(false)
                            }}
                            className="w-full resize-none border-0 bg-transparent text-foreground px-3 py-2 shadow-none text-sm focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 dark:text-foreground placeholder:text-muted-foreground align-middle transition-all duration-300 ease-in-out min-h-[36px] overflow-hidden"
                            disabled={isSubmittingComment}
                            rows={1}
                          />
                          
                          {/* Send button - only show when expanded, inside the textarea container */}
                          {(isCommentFocused || comment.trim()) && (
                            <div className="p-1 flex justify-end animate-in fade-in duration-300">
                              <button
                                type="submit"
                                onClick={handleCommentSubmit}
                                disabled={!comment.trim() || isSubmittingComment}
                                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                {isSubmittingComment ? (
                                  <IconClock className="h-3 w-3 text-muted-foreground animate-spin" />
                                  ) : (
                                  <SendHorizontal className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                        </div>
                          )}
                      </div>
                      </form>
                    )}
                        </div>
                        </div>
                        </div>
            )}
                      </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
