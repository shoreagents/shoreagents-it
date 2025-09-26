"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { IconCalendar, IconClock, IconUser, IconUsers, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconGlobe, IconWorld, IconCreditCard, IconPlus, IconUpload, IconX, IconSearch, IconLink, IconMinus, IconCheck, IconSun, IconMoon, IconCalendarEvent, IconX as IconCancel, IconCheck as IconDone, IconCalendarPlus, IconX as IconClose } from "@tabler/icons-react"
// import { useRealtimeMembers } from '@/hooks/use-realtime-members'
import { SendHorizontal, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataFieldRow } from "@/components/ui/fields"

import { Popover, PopoverContent, PopoverTrigger, PopoverItem } from "@/components/ui/popover"
import { UserTooltip } from "@/components/ui/user-tooltip"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Calendar } from "@/components/ui/calendar"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { EventsActivityLog } from "@/components/events-activity-log"
import { Comment, CommentData } from "@/components/ui/comment"
import { AgentSelection, type Agent } from "@/components/agent-selection"
import { useRealtimeEvents } from "@/hooks/use-realtime-events"

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
  participants_count?: number
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

// Format date consistently without timezone conversion
const formatDateForDisplay = (date: Date | undefined): string => {
  if (!date || isNaN(date.getTime())) return ''
  
  // Format date as MM/DD/YYYY to avoid timezone conversion issues
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  
  return `${month}/${day}/${year}`
}


export function AddEventModal({ isOpen, onClose, onEventAdded, eventToEdit }: AddEventModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  
  // Real-time updates for events
  const [currentEvent, setCurrentEvent] = React.useState<EventData | null>(eventToEdit || null)
  
  // Initialize currentEvent when eventToEdit changes
  React.useEffect(() => {
    if (eventToEdit) {
      setCurrentEvent(eventToEdit)
    }
  }, [eventToEdit])
  
  // Helper function to get the current event data (realtime or original)
  const getCurrentEvent = () => currentEvent || eventToEdit
  
  // Realtime events hook to update modal when event data changes
  useRealtimeEvents({
    onEventUpdated: (updatedEvent, oldEvent) => {
      // Only update if this is the event we're currently viewing
      if (eventToEdit && updatedEvent.id === eventToEdit.id) {
        console.log('🔄 Modal: Event updated in realtime:', updatedEvent)
        setCurrentEvent(updatedEvent)
      }
    },
    onEventDeleted: (deletedEvent) => {
      // Close modal if the event we're viewing was deleted
      if (eventToEdit && deletedEvent.id === eventToEdit.id) {
        console.log('🗑️ Modal: Event deleted, closing modal')
        onClose()
      }
    },
    onEventAttendanceChanged: (attendance) => {
      // Refresh event data if attendance changed for the current event
      if (eventToEdit && attendance.event_id === eventToEdit.id) {
        console.log('👥 Modal: Event attendance changed, refreshing data')
        // We could fetch fresh data here, but the parent component should handle this
      }
    },
    enableNotifications: false // Don't show notifications in modal
  })

  // Sync realtime updates to form data when currentEvent changes
  React.useEffect(() => {
    if (currentEvent && eventToEdit?.id) {
      console.log('🔄 Modal: Syncing realtime data to form:', currentEvent)
      setFormData(prev => ({
        ...prev,
        title: currentEvent.title || prev.title,
        description: currentEvent.description || prev.description,
        event_date: currentEvent.event_date || prev.event_date,
        start_time: currentEvent.start_time || prev.start_time,
        end_time: currentEvent.end_time || prev.end_time,
        location: currentEvent.location || prev.location,
        status: currentEvent.status || prev.status,
        event_type: currentEvent.event_type || prev.event_type,
        assigned_user_ids: currentEvent.assigned_user_ids || prev.assigned_user_ids,
        participants_count: (currentEvent as any).participants_count || prev.participants_count
      }))

      // Also update localEventDate for display
      if (currentEvent.event_date) {
        console.log('🔄 Modal: Updating localEventDate from realtime data:', currentEvent.event_date)
        try {
          // Parse date string without timezone conversion
          const dateStr = currentEvent.event_date.split('T')[0] // Remove time component if present
          const [year, month, day] = dateStr.split('-').map(Number)
          
          if (year && month && day) {
            // Create date in local timezone without conversion
            const parsedDate = new Date(year, month - 1, day) // month is 0-indexed
            console.log('🔄 Modal: Parsed realtime date:', parsedDate)
            setLocalEventDate(parsedDate)
          } else {
            console.error('❌ Modal: Invalid realtime date format:', currentEvent.event_date)
            setLocalEventDate(undefined)
          }
        } catch (error) {
          console.error('❌ Modal: Error parsing realtime date:', error)
          setLocalEventDate(undefined)
        }
      }
    }
  }, [currentEvent, eventToEdit?.id])

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isCancelling, setIsCancelling] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isRecovering, setIsRecovering] = React.useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false)
  const [showCancelConfirmation, setShowCancelConfirmation] = React.useState(false)
  const [showRecoverConfirmation, setShowRecoverConfirmation] = React.useState(false)
  const [showRequiredFieldsWarning, setShowRequiredFieldsWarning] = React.useState(false)
  const [missingFields, setMissingFields] = React.useState<string[]>([])
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
  
  // Participants state
  const [loadingParticipantsKey, setLoadingParticipantsKey] = React.useState<string | null>(null)
  const [eventParticipantsCache, setEventParticipantsCache] = React.useState<Record<string, { users: { user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, employee_id: string | null }[] }>>({})

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
  const [companyFilter, setCompanyFilter] = React.useState('all')
  const [companyOptions, setCompanyOptions] = React.useState<{ id: number; company: string }[]>([])

  // Reset editing state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      // Reset selected agents data when modal opens
      setSelectedAgentsData([])
      console.log('🧹 Reset selectedAgentsData when modal opens')
      
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
          updated_at: eventToEdit.updated_at,
          participants_count: (eventToEdit as any).participants_count || 0
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
            // Parse date string without timezone conversion
            // Assume event_date is in YYYY-MM-DD format
            const dateStr = eventToEdit.event_date.split('T')[0] // Remove time component if present
            const [year, month, day] = dateStr.split('-').map(Number)
            
            if (year && month && day) {
              // Create date in local timezone without conversion
              const parsedDate = new Date(year, month - 1, day) // month is 0-indexed
              console.log('🔄 Created date object (timezone-safe):', parsedDate)
              
              // Validate the created date
              if (isNaN(parsedDate.getTime())) {
                console.error('❌ Created date is invalid:', parsedDate)
                setLocalEventDate(undefined)
              } else {
                setLocalEventDate(parsedDate)
              }
            } else {
              console.error('❌ Invalid date format:', eventToEdit.event_date)
              setLocalEventDate(undefined)
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
      setCompanyFilter('all')
      setIsLoadingAgents(true)
      fetchAgents(1, false, '')
      
      // Fetch company options
      const fetchCompanyOptions = async () => {
        try {
          const res = await fetch('/api/agents', { method: 'OPTIONS' })
          const data = await res.json()
          setCompanyOptions(data.members || [])
        } catch (e) {
          setCompanyOptions([])
        }
      }
      fetchCompanyOptions()
    }
  }, [showAgentSelection])

  // Debounced search effect
  React.useEffect(() => {
    if (!showAgentSelection) return

    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      setHasMore(true)
      setTotalCount(0)
      fetchAgents(1, false, agentSearch, companyFilter)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [agentSearch, companyFilter, showAgentSelection])

  // Cleanup effect to reset selection states when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setShowAgentSelection(false)
      setSelectedAgentsData([])
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
          // Extract date part directly without creating Date object to avoid timezone conversion
          const dateMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
          if (dateMatch) {
            return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
          }
          // If no date pattern found, return the original string
          return dateStr
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
        
        // Extract date part from any format without timezone conversion
        const dateMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
        if (dateMatch) {
          return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
        }
        
        // If no date pattern found, return the original string
        return dateStr
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

  // Function to determine event status based on user's local timezone and event_date
  const getEventStatusByDate = (eventDate: string, currentStatus: string) => {
    // Don't change cancelled events - preserve manual cancellations
    if (currentStatus === 'cancelled') {
      return 'cancelled'
    }

    // Get current date in user's local timezone
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const today = `${year}-${month}-${day}` // YYYY-MM-DD format
    
    // Ensure eventDate is in YYYY-MM-DD format (remove any time component)
    const eventDateOnly = eventDate.split('T')[0]
    
    // Compare event_date with today's date
    if (eventDateOnly > today) {
      return 'upcoming'  // Future events
    } else if (eventDateOnly === today) {
      return 'today'     // Events happening today
    } else {
      return 'ended'     // Past events
    }
  }

  const handleInputChange = (field: keyof EventData, value: string | null | number[]) => {
    console.log(`🔄 handleInputChange called with field: ${field}, value:`, value)
    console.log(`🔍 Current formData.${field}:`, formData[field])
    
    let newData = {
      ...formData,
      [field]: value
    }
    
    // If event_date is being changed, automatically update the status based on the new date
    if (field === 'event_date' && typeof value === 'string' && value) {
      const newStatus = getEventStatusByDate(value, formData.status)
      console.log(`📅 Date changed to ${value}, updating status from ${formData.status} to ${newStatus}`)
      newData.status = newStatus as 'upcoming' | 'today' | 'cancelled' | 'ended'
    }
    
    console.log(`📝 Setting new formData for ${field}:`, newData[field])
    setFormData(newData)
  }

  // Handle modal close with auto-save
  const handleClose = async () => {
    console.log('🔒 handleClose called:', { 
      eventToEdit: eventToEdit?.id, 
      hasUnsavedChanges, 
      isOpen,
      currentStatus: formData.status
    })
    
    if (eventToEdit?.id) {
      // Skip auto-sync for cancelled or ended events since there's no new data to sync
      if (formData.status === 'cancelled' || formData.status === 'ended') {
        console.log('🔒 Skipping auto-sync for cancelled/ended event - no new data to sync')
        onClose() // Call the original onClose prop
        return
      }
      
      // For existing events, check for missing required fields (including invitees)
      const missingFields = getMissingRequiredFields()
      if (missingFields.length > 0) {
        setMissingFields(missingFields)
        setShowRequiredFieldsWarning(true)
        return
      }
      
      // For existing events, always update status based on current browser date and auto-save if needed
      try {
        // Calculate current status based on browser date
        const currentStatus = getEventStatusByDate(formData.event_date, formData.status)
        
        // Create updated form data with current status
        const updatedFormData = {
          ...formData,
          status: currentStatus as 'upcoming' | 'today' | 'cancelled' | 'ended'
        }
        
        // Check if status changed or there are other unsaved changes
        const statusChanged = currentStatus !== formData.status
        const needsUpdate = hasUnsavedChanges || statusChanged
        
        if (needsUpdate) {
          console.log('🔄 Auto-saving event changes and updating status before close...', {
            oldStatus: formData.status,
            newStatus: currentStatus,
            hasOtherChanges: hasUnsavedChanges
          })
          await updateDatabase(updatedFormData)
          console.log('✅ Event data and status saved successfully')
        }
        
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
      // New event or no existing event, just close
      console.log('🔒 Closing without auto-save - new event or no event')
      onClose() // Call the original onClose prop
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    // Check for missing required fields (including invitees)
    const missingFields = getMissingRequiredFields()
    if (missingFields.length > 0) {
      setMissingFields(missingFields)
      setShowRequiredFieldsWarning(true)
      return
    }
    
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

  const getMissingRequiredFields = () => {
    const missing: string[] = []
    
    if (!formData.title.trim()) {
      missing.push('Title')
    }
    if (!formData.event_date) {
      missing.push('Event Date')
    }
    if (!formData.start_time) {
      missing.push('Start Time')
    }
    if (!formData.end_time) {
      missing.push('End Time')
    }
    if (!formData.assigned_user_ids || formData.assigned_user_ids.length === 0) {
      missing.push('Invitees')
    }
    
    return missing
  }

  const isFormValid = () => {
    const basicValidation = formData.title.trim() !== '' && 
                           formData.event_date !== '' && 
                           formData.start_time !== '' && 
                           formData.end_time !== ''
    
    // For new events, require at least one invitee
    if (!eventToEdit?.id) {
      return basicValidation && 
             formData.assigned_user_ids && 
             formData.assigned_user_ids.length > 0
    }
    
    // For existing events, basic validation is enough
    return basicValidation
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


  const handleCancelConfirm = async () => {
    await handleCancel()
    setShowCancelConfirmation(false)
  }

  const handleRecover = async () => {
    if (!eventToEdit?.id) return

    setIsRecovering(true)
    try {
      // Get the correct status based on event date for recovery (ignores current cancelled status)
      const getRecoveryStatus = (eventDate: string) => {
        // Get current date in user's local timezone
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const today = `${year}-${month}-${day}` // YYYY-MM-DD format
        
        // Ensure eventDate is in YYYY-MM-DD format (remove any time component)
        const eventDateOnly = eventDate.split('T')[0]
        
        console.log('🔄 Recovery date comparison:', {
          eventDateOnly,
          today,
          comparison: {
            'eventDateOnly > today': eventDateOnly > today,
            'eventDateOnly === today': eventDateOnly === today,
            'eventDateOnly < today': eventDateOnly < today
          }
        })
        
        // Compare event_date with today's date
        if (eventDateOnly > today) {
          return 'upcoming'  // Future events
        } else if (eventDateOnly === today) {
          return 'today'     // Events happening today
        } else {
          return 'ended'     // Past events
        }
      }
      
      const correctStatus = getRecoveryStatus(formData.event_date)
      
      console.log('🔄 Recovery debug:', {
        eventDate: formData.event_date,
        currentStatus: formData.status,
        recoveredStatus: correctStatus,
        currentTime: new Date().toLocaleString(),
        currentDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
      })
      
      // Use the existing updateDatabase function to change status to the correct one
      const updatedFormData = {
        ...formData,
        status: correctStatus as 'upcoming' | 'today' | 'ended'
      }
      
      await updateDatabase(updatedFormData)
      
      console.log('✅ Event recovered successfully with status:', correctStatus)
      
      // Update the form data to reflect the recovered status
      setFormData(prev => ({
        ...prev,
        status: correctStatus
      }))
      
      // Notify parent of changes
      if (onEventAdded) {
        onEventAdded({ ...eventToEdit, status: correctStatus })
      }
      
    } catch (error) {
      console.error('❌ Recover error:', error)
    } finally {
      setIsRecovering(false)
    }
  }

  const handleRecoverConfirm = async () => {
    await handleRecover()
    setShowRecoverConfirmation(false)
  }

  const fetchParticipantsForEvent = async (eventId: number) => {
    const key = `event:${eventId}`
    if (eventParticipantsCache[key]) return eventParticipantsCache[key].users
    
    try {
      setLoadingParticipantsKey(key)
      const response = await fetch(`/api/events/${eventId}/participants`)
      if (response.ok) {
        const data = await response.json()
        const participants = data.participants || []
        setEventParticipantsCache(prev => ({
          ...prev,
          [key]: { users: participants }
        }))
        return participants
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
    } finally {
      setLoadingParticipantsKey(null)
    }
    return []
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
  const fetchAgents = async (page: number = 1, append: boolean = false, searchQuery: string = '', companyId: string = 'all') => {
    if (isLoadingMore) return
    
    try {
      if (page === 1) {
        setIsLoadingAgents(true)
      } else {
        setIsLoadingMore(true)
      }
      
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search: searchQuery
      })
      if (companyId !== 'all') {
        params.append('memberId', companyId)
      }
      
      const response = await fetch(`/api/agents/modal?${params.toString()}`)
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
      fetchAgents(currentPage + 1, true, agentSearch, companyFilter)
    }
  }

  // Handle company filter change
  const handleCompanyFilterChange = (companyId: string) => {
    setCompanyFilter(companyId)
    setCurrentPage(1)
    setHasMore(true)
    setTotalCount(0)
    fetchAgents(1, false, agentSearch, companyId)
  }

  // Select all agents function
  const handleSelectAllAgents = async () => {
    try {
      // Fetch all agents from the database (not just paginated ones)
      const params = new URLSearchParams({
        page: '1',
        limit: '1000',
        search: agentSearch
      })
      if (companyFilter !== 'all') {
        params.append('memberId', companyFilter)
      }
      
      const response = await fetch(`/api/agents/modal?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch all agents: ${response.status}`)
      }
      
      const data = await response.json()
      const allAgents = data.agents || []
      const allAgentIds = allAgents.map((agent: any) => agent.user_id)
      const newAssignedIds = [...new Set([...(formData.assigned_user_ids || []), ...allAgentIds])]
      
      // Update form data
      handleInputChange('assigned_user_ids', newAssignedIds)
      
      // Update local state immediately for responsive UI - merge with existing selected agents
      setSelectedAgentsData(prev => {
        const existingIds = new Set(prev.map(agent => agent.user_id))
        const newAgents = allAgents.filter((agent: any) => !existingIds.has(agent.user_id))
        return [...prev, ...newAgents]
      })
    } catch (error) {
      console.error('❌ Error selecting all agents:', error)
      // Fallback to selecting only currently loaded agents
      const allAgentIds = agents.map(agent => agent.user_id)
      const newAssignedIds = [...new Set([...(formData.assigned_user_ids || []), ...allAgentIds])]
      handleInputChange('assigned_user_ids', newAssignedIds)
      
      // Update local state - merge with existing selected agents
      setSelectedAgentsData(prev => {
        const existingIds = new Set(prev.map(agent => agent.user_id))
        const newAgents = agents.filter(agent => !existingIds.has(agent.user_id))
        return [...prev, ...newAgents]
      })
    }
  }

  // Deselect all agents function
  const handleDeselectAllAgents = async () => {
    if (companyFilter === 'all') {
      // When in "All Companies" filter, deselect ALL agents from database
      try {
        // Fetch all agents from the database to get complete list
        const params = new URLSearchParams({
          page: '1',
          limit: '1000',
          search: agentSearch
        })
        
        const response = await fetch(`/api/agents/modal?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          const allAgents = data.agents || []
          const allAgentIds = allAgents.map((agent: any) => agent.user_id)
          
          // Remove all agents from selection
          const newAssignedIds = (formData.assigned_user_ids || []).filter(id => !allAgentIds.includes(id))
          
          // Update form data
          handleInputChange('assigned_user_ids', newAssignedIds)
          
          // Update local state - remove all agents
          setSelectedAgentsData(prev => prev.filter(agent => !allAgentIds.includes(agent.user_id)))
        } else {
          // Fallback to current agents if API fails
          const currentAgentIds = agents.map(agent => agent.user_id)
          const newAssignedIds = (formData.assigned_user_ids || []).filter(id => !currentAgentIds.includes(id))
          handleInputChange('assigned_user_ids', newAssignedIds)
          setSelectedAgentsData(prev => prev.filter(agent => !currentAgentIds.includes(agent.user_id)))
        }
      } catch (error) {
        console.error('❌ Error deselecting all agents:', error)
        // Fallback to current agents
        const currentAgentIds = agents.map(agent => agent.user_id)
        const newAssignedIds = (formData.assigned_user_ids || []).filter(id => !currentAgentIds.includes(id))
        handleInputChange('assigned_user_ids', newAssignedIds)
        setSelectedAgentsData(prev => prev.filter(agent => !currentAgentIds.includes(agent.user_id)))
      }
    } else {
      // When in specific company filter, deselect only agents from that company
      const currentAgentIds = agents.map(agent => agent.user_id)
      
      // Remove only the current agents from selection, keep others
      const newAssignedIds = (formData.assigned_user_ids || []).filter(id => !currentAgentIds.includes(id))
      
      // Update form data
      handleInputChange('assigned_user_ids', newAssignedIds)
      
      // Update local state - remove only current agents
      setSelectedAgentsData(prev => prev.filter(agent => !currentAgentIds.includes(agent.user_id)))
    }
  }

  // Remove all agents from a specific company
  const handleRemoveCompanyAgents = (companyName: string) => {
    // Get all agents from the specified company
    const companyAgentIds = selectedAgentsData
      .filter(agent => agent.member_company === companyName)
      .map(agent => agent.user_id)
    
    // Remove these agents from the assigned user IDs
    const newAssignedIds = formData.assigned_user_ids?.filter(id => !companyAgentIds.includes(id)) || []
    
    // Update form data
    handleInputChange('assigned_user_ids', newAssignedIds)
    
    // Update local state immediately for responsive UI
    setSelectedAgentsData(prev => prev.filter(agent => agent.member_company !== companyName))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose()
      }
    }}>
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
                  Event & Activity
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
                    placeholder="Event/Activity Title"
                    autoFocus
                    readOnly={formData.status === 'cancelled' || formData.status === 'ended'}
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
                  className={`text-2xl font-semibold mb-4 px-3 py-0 rounded-lg transition-colors duration-200 flex items-center border border-transparent ${
                    formData.status === 'cancelled' || formData.status === 'ended'
                      ? 'cursor-default'
                      : 'cursor-pointer hover:bg-[#ebebeb] dark:hover:bg-[#0a0a0a]'
                  }`}
                  style={{ minHeight: '2.5rem' }}
                  onClick={() => {
                    if (formData.status !== 'cancelled' && formData.status !== 'ended') {
                      setIsEditingEvent(true)
                    }
                  }}
                >
                  {formData.title || 'Event/Activity Title'}
                </div>
              )}
              
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Event Type */}
                <div className="flex items-center gap-2">
                  <IconTag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Type:</span>
                  {formData.status === 'cancelled' || formData.status === 'ended' ? (
                    <Badge 
                      variant="outline" 
                      className={`px-3 py-1 font-medium flex items-center justify-center ${
                        formData.event_type ? getEventTypeBadgeClass(formData.event_type) : 'text-muted-foreground'
                      }`}
                    >
                      {formData.event_type ? eventTypeOptions.find(opt => opt.value === formData.event_type)?.label || formData.event_type : 'Set Type'}
                    </Badge>
                  ) : (
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
                  )}
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
                         placeholder="Enter event/activity description..."
                         tabIndex={-1}
                         readOnly={formData.status === 'cancelled' || formData.status === 'ended'}
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
                      value={formatDateForDisplay(localEventDate)}
                      onSave={() => {}}
                      placeholder="-"
                      readOnly={formData.status === 'cancelled' || formData.status === 'ended'}
                      customInput={formData.status !== 'cancelled' && formData.status !== 'ended' ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                tabIndex={-1}
                                className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                  localEventDate ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                              >
                                 {formatDateForDisplay(localEventDate) || "-"}
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
                                     // Extract date components directly to avoid timezone conversion
                                     const year = date.getFullYear()
                                     const month = String(date.getMonth() + 1).padStart(2, '0')
                                     const day = String(date.getDate()).padStart(2, '0')
                                     const dateStr = `${year}-${month}-${day}`
                                     console.log('🔄 Converting date to string (timezone-safe):', dateStr)
                                     handleInputChange('event_date', dateStr)
                                   }
                                   console.log('Event date changed to:', date)
                                 }}
                                captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                        ) : undefined}
                    />

                      {/* Start Time */}
                      <DataFieldRow
                        icon={<IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Start Time"
                        fieldName="start_time"
                        value={formData.start_time ? convertTo12Hour(formData.start_time) : ''}
                        onSave={() => {}}
                        placeholder="-"
                        readOnly={formData.status === 'cancelled' || formData.status === 'ended'}
                        customInput={formData.status !== 'cancelled' && formData.status !== 'ended' ? (
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
                          ) : undefined}
                      />

                      {/* End Time */}
                      <DataFieldRow
                        icon={<IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="End Time"
                        fieldName="end_time"
                        value={formData.end_time ? convertTo12Hour(formData.end_time) : ''}
                        onSave={() => {}}
                        placeholder="-"
                        readOnly={formData.status === 'cancelled' || formData.status === 'ended'}
                        customInput={formData.status !== 'cancelled' && formData.status !== 'ended' ? (
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
                          ) : undefined}
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
                      readOnly={formData.status === 'cancelled' || formData.status === 'ended'}
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
                    {(formData.status !== 'cancelled' && formData.status !== 'ended') && (
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
                        className="text-sm transition-all duration-300 flex items-center gap-2 group text-primary hover:text-primary/80 cursor-pointer"
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
                    )}
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
                                  {(formData.status !== 'cancelled' && formData.status !== 'ended') && (
                                    <button
                                      onClick={async (e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        
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
                                  )}
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
                                      {(formData.status !== 'cancelled' && formData.status !== 'ended') && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleRemoveCompanyAgents(company)
                                          }}
                                          className="absolute -top-2 -right-2 w-5 h-5 text-white rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0 shadow-sm border-0"
                                          style={{ backgroundColor: theme === 'dark' ? '#626262' : '#888787' }}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#7a7a7a' : '#9a9a9a'}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#626262' : '#888787'}
                                        >
                                          <IconMinus className="h-3 w-3" />
                                        </button>
                                      )}
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
                    {isSubmitting ? 'Saving...' : 'Add Event'}
              </Button>
                )}

                {/* Show Cancel/Delete/Recover button only when editing an existing event AND modal is open */}
                {isOpen && eventToEdit?.id && (
                  <div className="flex gap-2">
                    {formData.status === 'cancelled' && (
                      <Button 
                        type="button" 
                        variant="default" 
                        size="sm"
                        onClick={() => setShowRecoverConfirmation(true)}
                        disabled={isRecovering || isDeleting}
                      >
                        {isRecovering ? 'Recovering...' : 'Recover Event'}
                      </Button>
                    )}
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={formData.status === 'cancelled' || formData.status === 'ended' ? () => setShowDeleteConfirmation(true) : () => setShowCancelConfirmation(true)}
                      disabled={isCancelling || isDeleting || isRecovering}
                    >
                      {isCancelling ? 'Cancelling...' : isDeleting ? 'Deleting...' : formData.status === 'cancelled' || formData.status === 'ended' ? 'Delete Event' : 'Cancel Event'}
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
                  onSelectAll={handleSelectAllAgents}
                  onDeselectAll={handleDeselectAllAgents}
                  totalCount={totalCount}
                  companyFilter={companyFilter}
                  onCompanyFilterChange={handleCompanyFilterChange}
                  companyOptions={companyOptions}
                />
              ) : (
                // Activity Content - Shows event activity and recent changes
                <div>
                {eventToEdit?.id ? (
                  <EventsActivityLog 
                    eventId={eventToEdit.id} 
                    eventTitle={getCurrentEvent()?.title || 'Unknown Event'} 
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
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                if (comment.trim() && !isSubmittingComment) {
                                  handleCommentSubmit(e)
                                }
                              }
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

      {/* Recover Confirmation Dialog */}
      <Dialog open={showRecoverConfirmation} onOpenChange={setShowRecoverConfirmation}>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Recover Event</h2>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">Are you sure you want to recover this event? This will change the status from cancelled to the appropriate status based on the event date.</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowRecoverConfirmation(false)}
            >
              No
            </Button>
            <Button 
              variant="default"
              onClick={handleRecoverConfirm}
              disabled={isRecovering}
            >
              {isRecovering ? 'Recovering...' : 'Yes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Required Fields Warning Dialog */}
      <Dialog open={showRequiredFieldsWarning} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Missing Fields</h2>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">The following required fields are missing. Please fill in all required fields before saving this event.</p>
            <ul className="space-y-1">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-center gap-2">
                  <IconAlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{field} <span style={{ color: 'rgb(239, 68, 68)' }}>(Required)</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowRequiredFieldsWarning(false)}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
