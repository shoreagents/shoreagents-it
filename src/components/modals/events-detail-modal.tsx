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
  assigned_user_ids: number[] | null
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
    return 'bg-blue-100 text-blue-800'
    case 'today':
    return 'bg-yellow-100 text-yellow-800'
    case 'cancelled':
    return 'bg-red-100 text-red-800'
    case 'ended':
      return 'bg-green-100 text-green-800'
    default:
    return 'bg-gray-100 text-gray-800'
  }
}

const getEventStatusIcon = (status: string | null) => {
  return <Target className="h-4 w-4 text-muted-foreground" />
}

// Convert 24-hour time to 12-hour format
const convertTo12Hour = (time24: string): string => {
  if (!time24) return ''
  
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}


export function AddEventModal({ isOpen, onClose, onEventAdded, eventToEdit }: AddEventModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  
  // Real-time updates for member changes (not needed for events)
  // const { isConnected } = useRealtimeMembers()

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isCancelling, setIsCancelling] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isRescheduling, setIsRescheduling] = React.useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false)
  const [showRescheduleConfirmation, setShowRescheduleConfirmation] = React.useState(false)
  const [showCancelConfirmation, setShowCancelConfirmation] = React.useState(false)
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
    event_type: 'event',
    assigned_user_ids: []
  })
  
  // Event-specific state
  const [isLoadingEvent, setIsLoadingEvent] = React.useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)

  // Agent selection state
  const [showAgentSelection, setShowAgentSelection] = React.useState(false)
  const [agents, setAgents] = React.useState<Array<{user_id: number, first_name: string | null, last_name: string | null, employee_id: string | null, job_title: string | null, profile_picture: string | null, member_company: string | null, member_badge_color: string | null}>>([])
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
          event_type: 'event',
          assigned_user_ids: []
        })
        setLocalEventDate(undefined)
      } else {
        // When opening for editing an existing event, start in view mode
        console.log('🔄 Opening modal for editing event:', eventToEdit.id)
        setIsLoadingEvent(true)
        
        console.log('🔄 Setting form data for existing event:', {
          id: eventToEdit.id,
          event_date: eventToEdit.event_date,
          event_date_type: typeof eventToEdit.event_date
        })
        
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
          assigned_user_ids: eventToEdit.assigned_user_ids || [],
          created_at: eventToEdit.created_at,
          updated_at: eventToEdit.updated_at
        })
        // Load comments for existing event
        loadComments(eventToEdit.id)
        
        // Load assigned agents data
        if (eventToEdit.assigned_user_ids && eventToEdit.assigned_user_ids.length > 0) {
          loadAssignedAgentsData(eventToEdit.assigned_user_ids)
        }
      
      // Initialize local event date
        if (eventToEdit.event_date) {
          console.log('🔄 Parsing event date:', eventToEdit.event_date, 'Type:', typeof eventToEdit.event_date)
          try {
            // Use the same approach as the main page - create Date directly from string
            const parsedDate = new Date(eventToEdit.event_date)
            console.log('🔄 Created date object:', parsedDate)
            
            // Validate the created date
            if (isNaN(parsedDate.getTime())) {
              console.error('❌ Created date is invalid:', parsedDate)
              setLocalEventDate(undefined)
            } else {
              setLocalEventDate(parsedDate)
            }
          } catch (error) {
            console.error('❌ Error parsing event date:', error)
            setLocalEventDate(undefined)
          }
        } else {
          console.log('🔄 No event date provided, setting undefined')
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

  // Track form changes to determine if there are unsaved changes
  React.useEffect(() => {
    if (!eventToEdit?.id) {
      // For new events, check if any fields have been filled
      const hasContent = formData.title.trim() !== '' || 
                        (formData.description && formData.description.trim() !== '') || 
                        formData.event_date !== '' || 
                        formData.start_time !== '' || 
                        formData.end_time !== '' || 
                        (formData.location && formData.location.trim() !== '') ||
                        (formData.assigned_user_ids && formData.assigned_user_ids.length > 0) || false
      setHasUnsavedChanges(hasContent)
    } else {
      // For existing events, compare with original data
      const originalData = {
        title: eventToEdit.title || '',
        description: eventToEdit.description || '',
        event_date: eventToEdit.event_date || '',
        start_time: eventToEdit.start_time || '',
        end_time: eventToEdit.end_time || '',
        location: eventToEdit.location || '',
        status: eventToEdit.status || 'upcoming',
        event_type: eventToEdit.event_type || 'event',
        assigned_user_ids: eventToEdit.assigned_user_ids || []
      }
      
      // Normalize dates for comparison (timezone-safe)
      const normalizeDate = (dateStr: string) => {
        if (!dateStr) return ''
        try {
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) return dateStr
          // Use timezone-safe date formatting to avoid day shift
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        } catch {
          return dateStr
        }
      }
      
      const normalizedFormData = {
        ...formData,
        event_date: normalizeDate(formData.event_date)
      }
      
      const normalizedOriginalData = {
        ...originalData,
        event_date: normalizeDate(originalData.event_date)
      }
      
      const hasChanges = JSON.stringify(normalizedFormData) !== JSON.stringify(normalizedOriginalData)
      
      console.log('🔄 Change detection:', {
        formData: normalizedFormData,
        originalData: normalizedOriginalData,
        hasChanges
      })
      
      setHasUnsavedChanges(hasChanges)
    }
  }, [formData, eventToEdit])

  // Update database function
  const updateDatabase = async (data: EventData) => {
    if (!eventToEdit?.id) return
    
    try {
      console.log('🔄 Updating event in database...', data)
      
      // Normalize date format for database (timezone-safe)
      const normalizeDateForDB = (dateStr: string) => {
        if (!dateStr) return ''
        try {
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) return dateStr
          // Use timezone-safe date formatting to avoid day shift
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}` // Ensure YYYY-MM-DD format
        } catch {
          return dateStr
        }
      }
      
      const updateData = {
        title: data.title,
        description: data.description,
        event_date: normalizeDateForDB(data.event_date),
        start_time: data.start_time,
        end_time: data.end_time,
        location: data.location,
        status: data.status,
        event_type: data.event_type,
        assigned_user_ids: data.assigned_user_ids
      }
      
      console.log('🔄 Sending PATCH request with data:', updateData)
      console.log('🔄 Event date type:', typeof updateData.event_date, 'Value:', updateData.event_date)
      
      const response = await fetch(`/api/events/${eventToEdit.id}`, {
            method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
            body: JSON.stringify(updateData)
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

  const handleInputChange = (field: keyof EventData, value: string | null | number[]) => {
    console.log(`🔄 handleInputChange called with field: ${field}, value:`, value)
    console.log(`🔍 Current formData.${field}:`, formData[field])
    
    const newData = {
      ...formData,
      [field]: value
    }
    
    console.log(`📝 Setting new formData for ${field}:`, newData[field])
    setFormData(newData)
  }

  // Handle modal close with auto-save
  const handleClose = async () => {
    console.log('🔒 handleClose called:', { 
      eventToEdit: eventToEdit?.id, 
      hasUnsavedChanges, 
      isOpen
    })
    
    if (eventToEdit?.id && hasUnsavedChanges) {
      // Auto-save event data changes before closing
      try {
        console.log('🔄 Auto-saving event changes before close...')
        await updateDatabase(formData)
        console.log('✅ Event data saved successfully')
        setHasUnsavedChanges(false) // Reset unsaved changes flag
        
        // Notify parent of changes
        if (onEventAdded) {
          onEventAdded(eventToEdit)
        }
        onClose() // Call the original onClose prop
      } catch (error) {
        // Don't close if save failed
        console.error('❌ Failed to save event data:', error)
        alert('Failed to save event changes. Please try again.')
        return
      }
    } else {
      // No unsaved changes or not in edit mode, just close
      console.log('🔒 Closing without auto-save - no changes detected')
      onClose() // Call the original onClose prop
    }
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
        setHasUnsavedChanges(false) // Reset unsaved changes flag
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
        setHasUnsavedChanges(false) // Reset unsaved changes flag
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

  const handleCancel = async () => {
    if (!eventToEdit?.id) return
    
    setIsCancelling(true)
    
    try {
      // Use the existing updateDatabase function which handles all fields properly
      const updatedFormData = {
        ...formData,
        status: 'cancelled' as const
      }
      
      await updateDatabase(updatedFormData)
      
      console.log('✅ Event cancelled successfully')
      
      // Update the form data to reflect the cancelled status
      setFormData(prev => ({
        ...prev,
        status: 'cancelled'
      }))
      
      // Notify parent of changes
      if (onEventAdded) {
        onEventAdded({ ...eventToEdit, status: 'cancelled' })
      }
      
    } catch (error) {
      console.error('❌ Cancel error:', error)
    } finally {
      setIsCancelling(false)
    }
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

  const handleDeleteConfirm = async () => {
    await handleDelete()
    setShowDeleteConfirmation(false)
  }

  const handleReschedule = async () => {
    if (!eventToEdit?.id) return

    setIsRescheduling(true)
    try {
      const updatedFormData = {
        ...formData,
        status: 'upcoming' as const
      }

      await updateDatabase(updatedFormData)
      
      // Update local state
      setFormData(prev => ({ ...prev, status: 'upcoming' }))
      
    } catch (error) {
      console.error('Error rescheduling event:', error)
      alert('Failed to reschedule the event. Please try again.')
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleRescheduleConfirm = async () => {
    await handleReschedule()
    setShowRescheduleConfirmation(false)
  }

  const handleCancelConfirm = async () => {
    await handleCancel()
    setShowCancelConfirmation(false)
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

  // Load assigned agents data
  const loadAssignedAgentsData = async (userIds: number[]) => {
    try {
      console.log('🔄 Loading assigned agents data for IDs:', userIds)
      console.log('🔄 Making POST request to /api/agents/batch')
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch('/api/agents/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('🔄 Response status:', response.status)
      console.log('🔄 Response ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔄 Loaded agents data:', data.agents)
        setSelectedAgentsData(data.agents || [])
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to fetch assigned agents:', response.status, errorText)
        setSelectedAgentsData([])
      }
    } catch (error) {
      console.error('❌ Error loading assigned agents:', error)
      setSelectedAgentsData([])
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
                  <Badge 
                    className={`px-3 py-1 font-medium flex items-center justify-center ${
                      formData.status ? getEventStatusBadgeClass(formData.status) : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {formData.status ? eventStatusOptions.find(opt => opt.value === formData.status)?.label || formData.status : 'Set Status'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0">
              {isLoadingEvent ? (
                <div className="space-y-6">
                  {/* Description Section Skeleton */}
                  <div>
                    <div className="flex items-center justify-between min-h-[40px]">
                      <h3 className="text-lg font-medium text-muted-foreground">Description</h3>
                    </div>
                    <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                      <div className="p-6">
                        <Skeleton className="h-[120px] w-full rounded" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Details Section Skeleton */}
                  <div>
                    <div className="flex items-center justify-between min-h-[40px]">
                      <h3 className="text-lg font-medium text-muted-foreground">Details</h3>
                    </div>
                    <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                      {/* Event Date Skeleton */}
                      <div className="grid grid-cols-[180px_auto_1fr] gap-2 h-[33px] items-center border-b border-[#cecece99] dark:border-border">
                        <div className="flex items-center gap-3 min-w-0 px-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                        <div className="min-w-0 flex items-center relative px-2">
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      
                      {/* Start Time Skeleton */}
                      <div className="grid grid-cols-[180px_auto_1fr] gap-2 h-[33px] items-center border-b border-[#cecece99] dark:border-border">
                        <div className="flex items-center gap-3 min-w-0 px-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                        <div className="min-w-0 flex items-center relative px-2">
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                      
                      {/* End Time Skeleton */}
                      <div className="grid grid-cols-[180px_auto_1fr] gap-2 h-[33px] items-center border-b border-[#cecece99] dark:border-border">
                        <div className="flex items-center gap-3 min-w-0 px-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                        <div className="min-w-0 flex items-center relative px-2">
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                      
                      {/* Location Skeleton */}
                      <div className="grid grid-cols-[180px_auto_1fr] gap-2 h-[33px] items-center">
                        <div className="flex items-center gap-3 min-w-0 px-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                        <div className="min-w-0 flex items-center relative px-2">
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Invitees Section Skeleton */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between min-h-[40px]">
                      <h3 className="text-lg font-medium text-muted-foreground">
                        Invitees
                        <Skeleton className="inline-block h-4 w-6 ml-2" />
                      </h3>
                      <button
                        type="button"
                        className="text-sm text-primary hover:text-primary/80 transition-all duration-300 cursor-pointer flex items-center gap-2 group"
                        disabled
                      >
                        <IconPlus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="rounded-lg border border-[#cecece99] dark:border-border">
                      <div className="p-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {[...Array(3)].map((_, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                                <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <Skeleton className="h-3 w-16 mb-1" />
                                  <Skeleton className="h-2 w-12" />
                                </div>
                                <Skeleton className="w-3 h-3" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
              <form id="add-event-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Description Section */}
                 <div>
                   <div className="flex items-center justify-between min-h-[40px]">
                     <h3 className="text-lg font-medium text-muted-foreground">Description</h3>
                   </div>
                   <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                     <div className="p-6">
                       <Textarea
                         value={formData.description || ''}
                         onChange={(e) => handleInputChange('description', e.target.value)}
                         placeholder="Enter event description..."
                         tabIndex={-1}
                         className="min-h-[120px] resize-none border-0 bg-transparent dark:bg-transparent text-foreground placeholder:text-muted-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm leading-relaxed w-full rounded-none"
                       />
                     </div>
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
                      value={localEventDate && !isNaN(localEventDate.getTime()) ? localEventDate.toLocaleDateString() : ''}
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
                               {localEventDate && !isNaN(localEventDate.getTime()) ? localEventDate.toLocaleDateString() : "-"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={localEventDate}
                               onSelect={(date) => {
                                 console.log('🔄 Calendar onSelect triggered with date:', date)
                                 setLocalEventDate(date)
                                 if (date) {
                                   // Use timezone-safe date formatting to avoid day shift
                                   const year = date.getFullYear()
                                   const month = String(date.getMonth() + 1).padStart(2, '0')
                                   const day = String(date.getDate()).padStart(2, '0')
                                   const dateStr = `${year}-${month}-${day}`
                                   console.log('🔄 Converting date to string:', dateStr)
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
                        onSave={() => {}}
                        placeholder="-"
                        customInput={
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                tabIndex={-1}
                                className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                  formData.start_time ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                                onClick={() => {
                                  console.log('🔄 Start time popover opened, current value:', formData.start_time)
                                }}
                              >
                                {formData.start_time ? convertTo12Hour(formData.start_time) : "-"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Input
                                type="time"
                                value={formData.start_time || ''}
                                onChange={(e) => {
                                  console.log('🔄 Start time changed:', e.target.value)
                                  handleInputChange('start_time', e.target.value)
                                }}
                                className="w-full"
                                autoFocus
                                placeholder=""
                              />
                            </PopoverContent>
                          </Popover>
                        }
                      />

                      {/* End Time */}
                      <DataFieldRow
                        icon={<IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="End Time"
                        fieldName="end_time"
                        value={formData.end_time || ''}
                        onSave={() => {}}
                        placeholder="-"
                        customInput={
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                tabIndex={-1}
                                className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                  formData.end_time ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                                onClick={() => {
                                  console.log('🔄 End time popover opened, current value:', formData.end_time)
                                }}
                              >
                                {formData.end_time ? convertTo12Hour(formData.end_time) : "-"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Input
                                type="time"
                                value={formData.end_time || ''}
                                onChange={(e) => {
                                  console.log('🔄 End time changed:', e.target.value)
                                  handleInputChange('end_time', e.target.value)
                                }}
                                className="w-full"
                                autoFocus
                                placeholder=""
                              />
                            </PopoverContent>
                          </Popover>
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
                      Invitees
                       {formData.assigned_user_ids && formData.assigned_user_ids.length > 0 && (
                         <span className="ml-2 text-sm text-muted-foreground">
                           ({formData.assigned_user_ids.length})
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
                      {formData.assigned_user_ids && formData.assigned_user_ids.length > 0 ? (
                        <div className="space-y-4">
                          {/* Users Section */}
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Agents</h4>
                            <div className="flex flex-wrap gap-2">
                              {isLoadingAgents ? (
                                // Show skeleton when loading
                                [...Array(3)].map((_, index) => (
                                  <div key={index} className="flex items-center gap-2 p-2 px-3 bg-primary/5 border border-primary/20 rounded-lg min-w-0">
                                    <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
                                    <div className="min-w-0 max-w-[120px]">
                                      <Skeleton className="h-3 w-16 mb-1" />
                                      <Skeleton className="h-2 w-12" />
                                    </div>
                                  </div>
                                ))
                              ) : selectedAgentsData.length > 0 ? selectedAgentsData.map((agent) => (
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
                                      const newAssignedIds = formData.assigned_user_ids?.filter(id => id !== agent.user_id) || []
                                      
                                      // Update form data
                                      handleInputChange('assigned_user_ids', newAssignedIds)
                                      
                                      // Update local state immediately for responsive UI
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
                              )) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  <p className="text-sm">No agents found</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Companies Section */}
                          {(() => {
                            // Count agents per company
                            const companyCounts = selectedAgentsData.reduce((acc, agent) => {
                              if (agent.member_company && agent.member_company.trim() !== '') {
                                acc[agent.member_company] = (acc[agent.member_company] || 0) + 1
                              }
                              return acc
                            }, {} as Record<string, number>)
                            
                            const uniqueCompanies = Object.keys(companyCounts)
                            
                            return uniqueCompanies.length > 0 ? (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Companies</h4>
                                <div className="flex flex-wrap gap-2">
                                  {uniqueCompanies.map((company, index) => (
                                    <div key={index} className="relative flex items-center gap-2 p-2 px-3 bg-primary/5 border border-primary/20 rounded-lg min-w-0">
                                      <div className="min-w-0 max-w-[150px]">
                                        <h4 className="text-xs font-medium text-foreground truncate">
                                          {company}
                                        </h4>
                                      </div>
                                      <div className="flex-shrink-0">
                                        <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                          {companyCounts[company]}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null
                          })()}
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

                {/* Show Cancel/Delete button only when editing an existing event AND modal is open */}
                {isOpen && eventToEdit?.id && (
                  <div className="flex gap-2">
                    {formData.status === 'cancelled' && (
                      <Button 
                        type="button" 
                        variant="default" 
                        size="sm"
                        onClick={() => setShowRescheduleConfirmation(true)}
                        disabled={isRescheduling || isDeleting}
                      >
                        {isRescheduling ? 'Rescheduling...' : 'Reschedule'}
                      </Button>
                    )}
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={formData.status === 'cancelled' ? () => setShowDeleteConfirmation(true) : () => setShowCancelConfirmation(true)}
                      disabled={isCancelling || isDeleting || isRescheduling}
                    >
                      {isCancelling ? 'Cancelling...' : isDeleting ? 'Deleting...' : formData.status === 'cancelled' ? 'Delete' : 'Cancel Event'}
                    </Button>
                  </div>
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
                   selectedAgentIds={new Set(formData.assigned_user_ids || [])}
                   onSelectionChange={(agentId, isSelected) => {
                     const agent = agents.find(a => a.user_id === agentId)
                     if (!agent) return

                     const currentIds = formData.assigned_user_ids || []
                     let newAssignedIds: number[]
                     
                     if (isSelected) {
                       if (!currentIds.includes(agentId)) {
                         newAssignedIds = [...currentIds, agentId]
                         setSelectedAgentsData(prev => {
                           if (prev.some(a => a.user_id === agentId)) {
                             return prev
                           }
                           return [...prev, agent]
                         })
                       } else {
                         return // Already selected
                       }
                     } else {
                       newAssignedIds = currentIds.filter(id => id !== agentId)
                       setSelectedAgentsData(prev => prev.filter(a => a.user_id !== agentId))
                     }
                     
                     handleInputChange('assigned_user_ids', newAssignedIds)
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
                        </div>
                        </div>
                        </div>
            )}
                      </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Delete Event</h2>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">Are you sure you want to delete this event? This action cannot be undone and will permanently remove the event.</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowDeleteConfirmation(false)}
            >
              No
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Confirmation Dialog */}
      <Dialog open={showRescheduleConfirmation} onOpenChange={setShowRescheduleConfirmation}>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Reschedule Event</h2>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">Are you sure you want to reschedule this event? This will change the status from cancelled back to upcoming.</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowRescheduleConfirmation(false)}
            >
              No
            </Button>
            <Button 
              variant="default" 
              onClick={handleRescheduleConfirm}
              disabled={isRescheduling}
            >
              {isRescheduling ? 'Rescheduling...' : 'Yes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirmation} onOpenChange={setShowCancelConfirmation}>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Cancel Event</h2>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">Are you sure you want to cancel this event? This will change the status to cancelled.</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowCancelConfirmation(false)}
            >
              No
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelConfirm}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Yes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
