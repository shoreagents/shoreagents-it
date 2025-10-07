"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { IconCalendar, IconClock, IconUser, IconUsers, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconGlobe, IconWorld, IconCreditCard, IconPlus, IconUpload, IconX, IconSearch, IconLink, IconMinus, IconCheck, IconSun, IconMoon, IconCalendarEvent, IconX as IconCancel, IconCheck as IconDone, IconCalendarPlus, IconX as IconClose, IconBell } from "@tabler/icons-react"
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

interface AddAnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  onAnnouncementAdded?: (announcement: AnnouncementData) => void
  announcementToEdit?: AnnouncementData & { id?: number } | null
}

interface AnnouncementData {
  id?: number
  title: string
  message: string | null // API uses 'message', not 'content'
  scheduled_at: string | null // API uses 'scheduled_at', not 'announcement_date'
  expires_at: string | null // API uses 'expires_at', not 'expiry_date'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled'
  created_by: number
  created_at?: string
  updated_at?: string
  sent_at?: string | null // When the announcement was sent
  assigned_user_ids: number[] | null // API uses 'assigned_user_ids', not 'assigned_user_ids'
  recipients_count?: number
}

const announcementTypeOptions = [
  { value: 'general', label: 'General' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'maintenance', label: 'Maintenance' }
]

const announcementStatusOptions = [
  { value: 'draft', label: 'Draft', icon: 'gray', color: 'gray' },
  { value: 'scheduled', label: 'Scheduled', icon: 'blue', color: 'blue' },
  { value: 'active', label: 'Active', icon: 'green', color: 'green' },
  { value: 'expired', label: 'Expired', icon: 'red', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', icon: 'gray', color: 'gray' }
]

const announcementPriorityOptions = [
  { value: 'low', label: 'Low', icon: 'gray', color: 'gray' },
  { value: 'medium', label: 'Medium', icon: 'yellow', color: 'yellow' },
  { value: 'high', label: 'High', icon: 'orange', color: 'orange' },
  { value: 'urgent', label: 'Urgent', icon: 'red', color: 'red' }
]

// Badge helper functions for announcements
const getAnnouncementTypeBadgeClass = (announcementType: string | null): string => {
  const s = announcementType || ''
  if (s === 'general') {
    return 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20'
  }
  if (s === 'urgent') {
    return 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20'
  }
  if (s === 'maintenance') {
    return 'text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20'
  }
  return 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
}

const getAnnouncementStatusBadgeClass = (status: string | null): string => {
  const s = status || ''
  switch (s) {
    case 'draft':
      return 'bg-yellow-100 text-yellow-800'
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'expired':
      return 'bg-red-100 text-red-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getAnnouncementPriorityBadgeClass = (priority: string | null): string => {
  const s = priority || ''
  switch (s) {
    case 'low':
      return 'bg-gray-100 text-gray-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'high':
      return 'bg-orange-100 text-orange-800'
    case 'urgent':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getAnnouncementStatusIcon = (status: string | null) => {
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


export function AddAnnouncementModal({ isOpen, onClose, onAnnouncementAdded, announcementToEdit }: AddAnnouncementModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  
  // Real-time updates for member changes (not needed for announcements)
  // const { isConnected } = useRealtimeMembers()

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isArchiving, setIsArchiving] = React.useState(false)
  const [isRecovering, setIsRecovering] = React.useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false)
  const [showPublishConfirmation, setShowPublishConfirmation] = React.useState(false)
  const [showRecoverConfirmation, setShowRecoverConfirmation] = React.useState(false)
  const [showArchiveConfirmation, setShowArchiveConfirmation] = React.useState(false)
  const [showRequiredFieldsWarning, setShowRequiredFieldsWarning] = React.useState(false)
  const [missingFields, setMissingFields] = React.useState<string[]>([])
  const [comment, setComment] = React.useState("")
  const [isCommentFocused, setIsCommentFocused] = React.useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
  const [commentsList, setCommentsList] = React.useState<CommentData[]>([])
  const [isLoadingComments, setIsLoadingComments] = React.useState(false)
  const [isEditingAnnouncement, setIsEditingAnnouncement] = React.useState(false)
  const [localAnnouncementDate, setLocalAnnouncementDate] = React.useState<Date | undefined>(undefined)
  const [localExpiryDate, setLocalExpiryDate] = React.useState<Date | undefined>(undefined)
  
  // Announcement type selection state
  const [showAnnouncementTypeSelection, setShowAnnouncementTypeSelection] = React.useState(false)
  const [announcementType, setAnnouncementType] = React.useState<'quick' | 'scheduled' | null>(null)
  
  // Database sync state
  const [lastDatabaseSync, setLastDatabaseSync] = React.useState<Date | null>(null)
  
  const [formData, setFormData] = React.useState<AnnouncementData>({
    title: '',
    message: '',
    scheduled_at: '',
    expires_at: '',
    priority: 'medium',
    status: 'active' as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled', // Default to active for new announcements
    created_by: user?.id ? Number(user.id) : 0,
    sent_at: null,
    assigned_user_ids: []
  })
  
  // Announcement-specific state
  const [isLoadingAnnouncement, setIsLoadingAnnouncement] = React.useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  
  // Recipients state
  const [loadingRecipientsKey, setLoadingRecipientsKey] = React.useState<string | null>(null)
  const [announcementRecipientsCache, setAnnouncementRecipientsCache] = React.useState<Record<string, { users: { user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, employee_id: string | null }[] }>>({})

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
      
      // Show announcement type selection for new announcements
      if (!announcementToEdit?.id) {
        setShowAnnouncementTypeSelection(true)
        setAnnouncementType(null)
      } else {
        setShowAnnouncementTypeSelection(false)
        setAnnouncementType('scheduled') // Default for editing
      }
      
      // When opening for a new announcement, start in edit mode
      // When opening for an existing announcement, start in view mode
      setIsEditingAnnouncement(!announcementToEdit?.id)
      
      if (!announcementToEdit?.id) {
        console.log('🔄 Opening modal for new announcement')
        setFormData({
          title: '',
          message: '',
          scheduled_at: '',
          expires_at: '',
          priority: 'medium',
          status: 'active', // Default to active for new announcements
          created_by: user?.id ? Number(user.id) : 0,
          assigned_user_ids: []
        })
        setLocalAnnouncementDate(undefined)
        setLocalExpiryDate(undefined)
      } else {
        // When opening for editing an existing announcement, start in view mode
        console.log('🔄 Opening modal for editing announcement:', announcementToEdit.id)
        setIsLoadingAnnouncement(true)
        
        console.log('🔄 Setting form data for existing announcement:', {
          id: announcementToEdit.id,
          scheduled_at: announcementToEdit.scheduled_at,
          scheduled_at_type: typeof announcementToEdit.scheduled_at
        })
        
        setFormData({
          id: announcementToEdit.id,
          title: announcementToEdit.title || '',
          message: announcementToEdit.message || '',
          scheduled_at: announcementToEdit.scheduled_at || '',
          expires_at: announcementToEdit.expires_at || '',
          priority: (announcementToEdit.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          status: (announcementToEdit.status as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled') || 'draft',
          created_by: announcementToEdit.created_by || (user?.id ? Number(user.id) : 0),
          sent_at: (announcementToEdit as any).sent_at || null,
          assigned_user_ids: announcementToEdit.assigned_user_ids || [],
          created_at: announcementToEdit.created_at,
          updated_at: announcementToEdit.updated_at,
          recipients_count: (announcementToEdit as any).recipients_count || 0
        })
        // Load comments for existing announcement
        loadComments(announcementToEdit.id)
        
        // Load assigned agents data
        if (announcementToEdit.assigned_user_ids && announcementToEdit.assigned_user_ids.length > 0) {
          loadAssignedAgentsData(announcementToEdit.assigned_user_ids)
        }
      
      // Initialize local announcement date
        if (announcementToEdit.scheduled_at) {
          console.log('🔄 Parsing scheduled date:', announcementToEdit.scheduled_at, 'Type:', typeof announcementToEdit.scheduled_at)
          try {
            // Use the same approach as the main page - create Date directly from string
            const parsedDate = new Date(announcementToEdit.scheduled_at)
            console.log('🔄 Created date object:', parsedDate)
            
            // Validate the created date
            if (isNaN(parsedDate.getTime())) {
              console.error('❌ Created date is invalid:', parsedDate)
              setLocalAnnouncementDate(undefined)
            } else {
              setLocalAnnouncementDate(parsedDate)
            }
          } catch (error) {
            console.error('❌ Error parsing announcement date:', error)
            setLocalAnnouncementDate(undefined)
          }
        } else {
          console.log('🔄 No announcement date provided, setting undefined')
          setLocalAnnouncementDate(undefined)
        }

        // Initialize local expiry date
        if (announcementToEdit.expires_at) {
          console.log('🔄 Parsing expiry date:', announcementToEdit.expires_at, 'Type:', typeof announcementToEdit.expires_at)
          try {
            const parsedDate = new Date(announcementToEdit.expires_at)
            console.log('🔄 Created expiry date object:', parsedDate)
            
            if (isNaN(parsedDate.getTime())) {
              console.error('❌ Created expiry date is invalid:', parsedDate)
              setLocalExpiryDate(undefined)
            } else {
              setLocalExpiryDate(parsedDate)
            }
          } catch (error) {
            console.error('❌ Error parsing expiry date:', error)
            setLocalExpiryDate(undefined)
          }
        } else {
          console.log('🔄 No expiry date provided, setting undefined')
          setLocalExpiryDate(undefined)
        }
        
        // Simulate loading time for skeleton effect
        setTimeout(() => {
          setIsLoadingAnnouncement(false)
        }, 500)
      }
    }
  }, [isOpen, announcementToEdit, user?.id])

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
    if (!announcementToEdit?.id) {
      // For new announcements, check if any fields have been filled
      const hasContent = formData.title.trim() !== '' || 
                        (formData.message && formData.message.trim() !== '') || 
                        formData.scheduled_at !== '' || 
                        (formData.expires_at && formData.expires_at.trim() !== '') ||
                        (formData.assigned_user_ids && formData.assigned_user_ids.length > 0) || false
      setHasUnsavedChanges(hasContent)
    } else {
      // For existing announcements, compare with original data
      const originalData = {
        title: announcementToEdit.title || '',
        message: announcementToEdit.message || '',
        scheduled_at: announcementToEdit.scheduled_at || '',
        expires_at: announcementToEdit.expires_at || '',
        priority: announcementToEdit.priority || 'medium',
        status: announcementToEdit.status || 'draft',
        assigned_user_ids: announcementToEdit.assigned_user_ids || []
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
        scheduled_at: normalizeDate(formData.scheduled_at || ''),
        expires_at: normalizeDate(formData.expires_at || '')
      }
      
      const normalizedOriginalData = {
        ...originalData,
        scheduled_at: normalizeDate(originalData.scheduled_at || ''),
        expires_at: normalizeDate(originalData.expires_at || '')
      }
      
      const hasChanges = JSON.stringify(normalizedFormData) !== JSON.stringify(normalizedOriginalData)
      
      console.log('🔄 Change detection:', {
        formData: normalizedFormData,
        originalData: normalizedOriginalData,
        hasChanges
      })
      
      setHasUnsavedChanges(hasChanges)
    }
  }, [formData, announcementToEdit])

  // Update database function
  const updateDatabase = async (data: AnnouncementData) => {
    if (!announcementToEdit?.id) return
    
    try {
      console.log('🔄 Updating announcement in database...', data)
      
      // Normalize date format for database (timezone-safe)
      const normalizeDateForDB = (dateStr: string) => {
        if (!dateStr || dateStr.trim() === '') return null
        try {
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) return null
          // Convert to ISO string for timestamptz field
          return date.toISOString()
        } catch {
          return null
        }
      }
      
      const updateData = {
        title: data.title,
        message: data.message,
        scheduled_at: normalizeDateForDB(data.scheduled_at || ''),
        expires_at: data.expires_at ? normalizeDateForDB(data.expires_at) : null,
        priority: data.priority,
        status: data.status,
        assigned_user_ids: data.assigned_user_ids && data.assigned_user_ids.length > 0 ? data.assigned_user_ids : [1]
      }
      
      console.log('🔄 Sending PUT request with data:', updateData)
      console.log('🔄 Scheduled date type:', typeof updateData.scheduled_at, 'Value:', updateData.scheduled_at)
      
      const response = await fetch(`/api/announcements/${announcementToEdit.id}`, {
            method: 'PUT',
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

  // Function to determine announcement status based on Asia/Manila timezone and dates
  const getAnnouncementStatusByDate = (announcementDate: string, expiryDate: string | null, currentStatus: string) => {
    // Don't change cancelled announcements - preserve manual cancellation
    if (currentStatus === 'cancelled') {
      return 'cancelled'
    }

    // Get current date in Asia/Manila timezone
    const now = new Date()
    const manilaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}))
    const today = manilaTime.toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Ensure dates are in YYYY-MM-DD format (remove any time component)
    const announcementDateOnly = announcementDate.split('T')[0]
    const expiryDateOnly = expiryDate ? expiryDate.split('T')[0] : null
    
    // Check if announcement has expired
    if (expiryDateOnly && expiryDateOnly < today) {
      return 'expired'
    }
    
    // Check if announcement is active (published)
    if (announcementDateOnly <= today) {
      return 'active'
    } else {
      return 'scheduled'  // Future announcements are scheduled
    }
  }

  const handleInputChange = (field: keyof AnnouncementData, value: string | null | number[]) => {
    console.log(`🔄 handleInputChange called with field: ${field}, value:`, value)
    console.log(`🔍 Current formData.${field}:`, formData[field])
    
    let newData = {
      ...formData,
      [field]: value
    }
    
    // If announcement_date or expiry_date is being changed, automatically update the status based on the new dates
    // BUT only if the announcement is NOT in draft status AND it's a quick announcement (preserve draft status when editing dates)
    if ((field === 'scheduled_at' || field === 'expires_at') && typeof value === 'string' && formData.status !== 'draft' && announcementType === 'quick') {
      const scheduledDate = field === 'scheduled_at' ? value : (formData.scheduled_at || '')
      const expiryDate = field === 'expires_at' ? value : (formData.expires_at || '')
      const newStatus = getAnnouncementStatusByDate(scheduledDate, expiryDate, formData.status)
      console.log(`📅 Date changed for quick announcement, updating status from ${formData.status} to ${newStatus}`)
      newData.status = newStatus as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled'
    } else if ((field === 'scheduled_at' || field === 'expires_at') && typeof value === 'string' && (formData.status === 'draft' || announcementType === 'scheduled')) {
      console.log(`📅 Date changed for draft/scheduled announcement - keeping status as '${formData.status}'`)
    }
    
    console.log(`📝 Setting new formData for ${field}:`, newData[field])
    setFormData(newData)
  }

  // Handle modal close with auto-save
  const getMissingRequiredFields = () => {
    const missing: string[] = []
    
    if (!formData.title.trim()) {
      missing.push('Title')
    }
    if (!formData.message || !formData.message.trim()) {
      missing.push('Message')
    }
    if (!formData.assigned_user_ids || formData.assigned_user_ids.length === 0) {
      missing.push('Recipients')
    }
    
    return missing
  }

  const handleClose = async () => {
    console.log('🔒 handleClose called:', { 
      announcementToEdit: announcementToEdit?.id, 
      hasUnsavedChanges, 
      isOpen,
      currentStatus: formData.status
    })
    
    // Reset announcement type selection
    setShowAnnouncementTypeSelection(false)
    setAnnouncementType(null)
    
    if (announcementToEdit?.id) {
      // Skip auto-sync for cancelled or expired announcements since there's no new data to sync
      if (formData.status === 'cancelled' || formData.status === 'expired') {
        console.log('🔒 Skipping auto-sync for cancelled/expired announcement - no new data to sync')
        onClose() // Call the original onClose prop
        return
      }
      
      // Only check for missing required fields when editing an existing announcement
      // For new announcements, allow closing without validation
      const missingFields = getMissingRequiredFields()
      if (missingFields.length > 0) {
        setMissingFields(missingFields)
        setShowRequiredFieldsWarning(true)
        return
      }
    }
    
    if (announcementToEdit?.id && hasUnsavedChanges) {
      // Auto-save announcement data changes before closing
      try {
        console.log('🔄 Auto-saving announcement changes before close...')
        await updateDatabase(formData)
        console.log('✅ Announcement data saved successfully')
        setHasUnsavedChanges(false) // Reset unsaved changes flag
        
        // Notify parent of changes
        if (onAnnouncementAdded) {
          onAnnouncementAdded(announcementToEdit)
        }
        onClose() // Call the original onClose prop
      } catch (error) {
        // Don't close if save failed
        console.error('❌ Failed to save announcement data:', error)
        alert('Failed to save announcement changes. Please try again.')
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
    
    // Check for missing required fields
    const missingFields = getMissingRequiredFields()
    if (missingFields.length > 0) {
      setMissingFields(missingFields)
      setShowRequiredFieldsWarning(true)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      console.log('🔄 Submitting announcement form...', formData)
      
      if (announcementToEdit?.id) {
        // Update existing announcement
        await updateDatabase(formData)
        console.log('✅ Announcement updated successfully')
        setHasUnsavedChanges(false) // Reset unsaved changes flag
      } else {
        // Create new announcement
        // Normalize date format for database (timezone-safe)
        const normalizeDateForDB = (dateStr: string) => {
          if (!dateStr || dateStr.trim() === '') return null
          try {
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return null
            // Convert to ISO string for timestamptz field
            return date.toISOString()
          } catch {
            return null
          }
        }
        
        // Determine status and data based on announcement type
        let createData
        if (announcementType === 'quick') {
          // For quick announcements, don't set scheduled_at or expires_at
          createData = {
            title: formData.title,
            message: formData.message,
            scheduled_at: null, // No scheduled date for quick announcements
            expires_at: null,   // No expiry date for quick announcements
            priority: formData.priority,
            status: 'active',   // Quick announcements are immediately active
            assigned_user_ids: formData.assigned_user_ids && formData.assigned_user_ids.length > 0 ? formData.assigned_user_ids : [1],
            created_by: formData.created_by
          }
          console.log(`📅 Creating quick announcement - status: active`)
        } else {
          // For scheduled announcements, use date logic
          const scheduledDate = formData.scheduled_at || new Date().toISOString().split('T')[0]
          const expiryDate = formData.expires_at
          const autoStatus = getAnnouncementStatusByDate(scheduledDate, expiryDate, formData.status)
          
          console.log(`📅 Creating scheduled announcement - scheduled: ${scheduledDate}, auto-status: ${autoStatus}`)
          
          createData = {
            title: formData.title,
            message: formData.message,
            scheduled_at: normalizeDateForDB(formData.scheduled_at || ''), 
            expires_at: normalizeDateForDB(formData.expires_at || ''),
            priority: formData.priority,
            status: autoStatus,
            assigned_user_ids: formData.assigned_user_ids && formData.assigned_user_ids.length > 0 ? formData.assigned_user_ids : [1],
            created_by: formData.created_by
          }
        }
        
        const response = await fetch('/api/announcements', {
          method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
          body: JSON.stringify(createData)
        })
        
        if (!response.ok) {
          throw new Error(`Failed to create announcement: ${response.status}`)
        }
        
        const newAnnouncement = await response.json()
        console.log('✅ Announcement created successfully:', newAnnouncement)
        
        if (onAnnouncementAdded) {
          onAnnouncementAdded(newAnnouncement)
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

  const handleSaveAsDraft = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      console.log('🔄 Saving announcement as draft...', formData)
      
      if (announcementToEdit?.id) {
        // Update existing announcement as draft
        const draftData = {
          ...formData,
          status: 'draft' as const
        }
        await updateDatabase(draftData)
        console.log('✅ Announcement saved as draft successfully')
        setHasUnsavedChanges(false)
      } else {
        // Create new announcement as draft
        const normalizeDateForDB = (dateStr: string) => {
          if (!dateStr || dateStr.trim() === '') return null
          try {
            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return null
            return date.toISOString()
          } catch {
            return null
          }
        }
        
        const createData = {
          title: formData.title || 'Untitled',
          message: formData.message || '',
          scheduled_at: normalizeDateForDB(formData.scheduled_at || ''), 
          expires_at: normalizeDateForDB(formData.expires_at || ''),
          priority: formData.priority,
          status: 'draft' as const,
          assigned_user_ids: formData.assigned_user_ids || []
        }
        
        const response = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createData)
        })
        
        if (!response.ok) {
          throw new Error('Failed to create announcement')
        }
        
        const newAnnouncement = await response.json()
        console.log('✅ Announcement created as draft successfully')
        
        if (onAnnouncementAdded) {
          onAnnouncementAdded(newAnnouncement)
        }
        setHasUnsavedChanges(false)
      }
      
      onClose()
      
    } catch (error) {
      console.error('❌ Save as draft error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return formData.title.trim() !== '' && 
           formData.scheduled_at !== '' && 
           (formData.message && formData.message.trim() !== '') &&
           (formData.assigned_user_ids && formData.assigned_user_ids.length > 0)
  }

  const handleActivate = async () => {
    if (!announcementToEdit?.id) return
    
    setIsPublishing(true)
    
    try {
      // Determine status based on scheduled date
      const scheduledDate = formData.scheduled_at || new Date().toISOString().split('T')[0]
      const expiryDate = formData.expires_at
      const newStatus = getAnnouncementStatusByDate(scheduledDate, expiryDate, formData.status)
      
      console.log(`📅 Publishing announcement - scheduled: ${scheduledDate}, status: ${newStatus}`)
      
      // Use the existing updateDatabase function which handles all fields properly
      const updatedFormData = {
        ...formData,
        status: newStatus as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled'
      }
      
      await updateDatabase(updatedFormData)
      
      console.log(`✅ Announcement published successfully with status: ${newStatus}`)
      
      // Update the form data to reflect the new status
      setFormData(prev => ({
        ...prev,
        status: newStatus
      }))
      
      // Notify parent of changes
      if (onAnnouncementAdded) {
        onAnnouncementAdded({ ...announcementToEdit, status: newStatus })
      }
      
    } catch (error) {
      console.error('❌ Activate error:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (!announcementToEdit?.id) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/announcements/${announcementToEdit.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete announcement: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (formData.status === 'scheduled') {
        // Announcement was cancelled, update the form data
        console.log('✅ Scheduled announcement cancelled successfully')
        setFormData(prev => ({
          ...prev,
          status: 'cancelled'
        }))
        
        // Notify parent of changes
        if (onAnnouncementAdded) {
          onAnnouncementAdded({ ...announcementToEdit, status: 'cancelled' })
        }
      } else {
        // Announcement was deleted
        console.log('✅ Announcement deleted successfully')
        onClose()
      }
      
    } catch (error) {
      console.error('❌ Delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = async () => {
    if (!announcementToEdit?.id) return
    
    setIsArchiving(true)
    
    try {
      // Use the existing updateDatabase function which handles all fields properly
      const updatedFormData = {
        ...formData,
        status: 'cancelled' as const
      }
      
      await updateDatabase(updatedFormData)
      
      console.log('✅ Announcement cancelled successfully')
      
      // Update the form data to reflect the cancelled status
      setFormData(prev => ({
        ...prev,
        status: 'cancelled'
      }))
      
      // Notify parent of changes
      if (onAnnouncementAdded) {
        onAnnouncementAdded({ ...announcementToEdit, status: 'cancelled' })
      }
      
    } catch (error) {
      console.error('❌ Cancel error:', error)
    } finally {
      setIsArchiving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    await handleDelete()
    setShowDeleteConfirmation(false)
  }

  const handleActivateConfirm = async () => {
    await handleActivate()
    setShowPublishConfirmation(false)
  }

  const handleCancelConfirm = async () => {
    await handleCancel()
    setShowDeleteConfirmation(false)
  }

  const handleRecover = async () => {
    if (!announcementToEdit?.id) return

    setIsRecovering(true)
    try {
      // Get the correct status based on announcement date for recovery (ignores current cancelled status)
      const getRecoveryStatus = (scheduledDate: string, expiryDate: string | null) => {
        // Get current date in user's local timezone
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const today = `${year}-${month}-${day}` // YYYY-MM-DD format
        
        // Ensure scheduledDate is in YYYY-MM-DD format (remove any time component)
        const scheduledDateOnly = scheduledDate.split('T')[0]
        
        console.log('🔄 Recovery date comparison:', {
          scheduledDateOnly,
          today,
          expiryDate,
          comparison: {
            'scheduledDateOnly > today': scheduledDateOnly > today,
            'scheduledDateOnly === today': scheduledDateOnly === today,
            'scheduledDateOnly < today': scheduledDateOnly < today
          }
        })
        
        // Compare scheduled_date with today's date
        if (scheduledDateOnly > today) {
          return 'scheduled'  // Future announcements
        } else if (scheduledDateOnly === today) {
          return 'active'     // Today's announcements
        } else {
          // Check if expired
          if (expiryDate) {
            const expiryDateOnly = expiryDate.split('T')[0]
            if (expiryDateOnly < today) {
              return 'expired'  // Past announcements with expiry date
            }
          }
          return 'active'     // Past announcements without expiry or still active
        }
      }
      
      const correctStatus = getRecoveryStatus(formData.scheduled_at || '', formData.expires_at || '')
      
      console.log('🔄 Recovery debug:', {
        scheduledDate: formData.scheduled_at,
        expiryDate: formData.expires_at,
        currentStatus: formData.status,
        recoveredStatus: correctStatus,
        currentTime: new Date().toLocaleString(),
        currentDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
      })
      
      // Use the existing updateDatabase function to change status to the correct one
      const updatedFormData = {
        ...formData,
        status: correctStatus as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled'
      }
      
      await updateDatabase(updatedFormData)
      
      console.log('✅ Announcement recovered successfully with status:', correctStatus)
      
      // Update the form data to reflect the recovered status
      setFormData(prev => ({
        ...prev,
        status: correctStatus
      }))
      
      // Notify parent of changes
      if (onAnnouncementAdded) {
        onAnnouncementAdded({ ...announcementToEdit, status: correctStatus })
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

  // Handle announcement type selection
  const handleAnnouncementTypeSelect = (type: 'quick' | 'scheduled') => {
    setAnnouncementType(type)
    setShowAnnouncementTypeSelection(false)
    
    // Set default values based on type
    if (type === 'quick') {
      // For quick announcements, set immediate active status
      setFormData(prev => ({
        ...prev,
        status: 'active',
        scheduled_at: null // No scheduled date for immediate announcements
      }))
    } else {
      // For scheduled announcements, set scheduled status
      setFormData(prev => ({
        ...prev,
        status: 'scheduled'
      }))
    }
    
    // The main modal will now open because announcementType is set
  }


  const fetchRecipientsForAnnouncement = async (announcementId: number) => {
    const key = `announcement:${announcementId}`
    if (announcementRecipientsCache[key]) return announcementRecipientsCache[key].users
    
    try {
      setLoadingRecipientsKey(key)
      const response = await fetch(`/api/announcements/${announcementId}/recipients`)
      if (response.ok) {
        const data = await response.json()
        const recipients = data.recipients || []
        setAnnouncementRecipientsCache(prev => ({
          ...prev,
          [key]: { users: recipients }
        }))
        return recipients
      }
    } catch (error) {
      console.error('Error fetching recipients:', error)
    } finally {
      setLoadingRecipientsKey(null)
    }
    return []
  }

  // Load existing comments for the announcement
  const loadComments = async (announcementId: number) => {
    try {
      setIsLoadingComments(true)
      const response = await fetch(`/api/announcements/${announcementId}/comments`)
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
    if (!comment.trim() || !announcementToEdit?.id || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch(`/api/announcements/${announcementToEdit.id}/comments`, {
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
        await loadComments(announcementToEdit.id)
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
    if (!announcementToEdit?.id) return

    try {
      const response = await fetch(`/api/announcements/${announcementToEdit.id}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Reload comments to reflect the deletion
        await loadComments(announcementToEdit.id)
        } else {
        console.error('Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  // Announcement title editing handlers
  const handleAnnouncementEdit = () => {
    setIsEditingAnnouncement(true)
  }

  const handleAnnouncementSave = (value: string) => {
    handleInputChange('title', value)
    setIsEditingAnnouncement(false)
  }

  const handleAnnouncementCancel = () => {
    setIsEditingAnnouncement(false)
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
      const newTargetIds = [...new Set([...(formData.assigned_user_ids || []), ...allAgentIds])]
      
      // Update form data
      handleInputChange('assigned_user_ids', newTargetIds)
      
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
      const newTargetIds = [...new Set([...(formData.assigned_user_ids || []), ...allAgentIds])]
      handleInputChange('assigned_user_ids', newTargetIds)
      
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
          const newTargetIds = (formData.assigned_user_ids || []).filter(id => !allAgentIds.includes(id))
          
          // Update form data
          handleInputChange('assigned_user_ids', newTargetIds)
          
          // Update local state - remove all agents
          setSelectedAgentsData(prev => prev.filter(agent => !allAgentIds.includes(agent.user_id)))
        } else {
          // Fallback to current agents if API fails
          const currentAgentIds = agents.map(agent => agent.user_id)
          const newTargetIds = (formData.assigned_user_ids || []).filter(id => !currentAgentIds.includes(id))
          handleInputChange('assigned_user_ids', newTargetIds)
          setSelectedAgentsData(prev => prev.filter(agent => !currentAgentIds.includes(agent.user_id)))
        }
      } catch (error) {
        console.error('❌ Error deselecting all agents:', error)
        // Fallback to current agents
        const currentAgentIds = agents.map(agent => agent.user_id)
        const newTargetIds = (formData.assigned_user_ids || []).filter(id => !currentAgentIds.includes(id))
        handleInputChange('assigned_user_ids', newTargetIds)
        setSelectedAgentsData(prev => prev.filter(agent => !currentAgentIds.includes(agent.user_id)))
      }
    } else {
      // When in specific company filter, deselect only agents from that company
      const currentAgentIds = agents.map(agent => agent.user_id)
      
      // Remove only the current agents from selection, keep others
      const newTargetIds = (formData.assigned_user_ids || []).filter(id => !currentAgentIds.includes(id))
      
      // Update form data
      handleInputChange('assigned_user_ids', newTargetIds)
      
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
    
    // Remove these agents from the target user IDs
    const newTargetIds = formData.assigned_user_ids?.filter(id => !companyAgentIds.includes(id)) || []
    
    // Update form data
    handleInputChange('assigned_user_ids', newTargetIds)
    
    // Update local state immediately for responsive UI
    setSelectedAgentsData(prev => prev.filter(agent => agent.member_company !== companyName))
  }

  return (
    <>
      {/* Announcement Type Selection Modal */}
      <Dialog open={showAnnouncementTypeSelection} onOpenChange={(open) => {
        if (!open) {
          setShowAnnouncementTypeSelection(false)
          onClose() // Close the entire modal flow
        }
      }}>
        <DialogContent className="sm:max-w-[400px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Add New Announcement</h2>
            <p className="text-sm text-muted-foreground">Choose how you want to create your announcement.</p>
          </div>
          <div className="flex flex-col gap-4 pt-4">
            <div 
              onClick={() => handleAnnouncementTypeSelect('quick')}
              className="p-4 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors duration-200 group"
            >
              <div className="flex items-center gap-3">
                <IconBell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Quick Announcement</h3>
                  <p className="text-sm text-muted-foreground">Send immediately to selected users</p>
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => handleAnnouncementTypeSelect('scheduled')}
              className="p-4 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors duration-200 group"
            >
              <div className="flex items-center gap-3">
                <IconCalendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Schedule Announcement</h3>
                  <p className="text-sm text-muted-foreground">Set date and time for future delivery.</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Announcement Modal */}
      <Dialog open={isOpen && (announcementType !== null || !!announcementToEdit?.id)} onOpenChange={(open: boolean) => {
        if (!open) {
          handleClose()
        }
      }}>
        <DialogContent
          className="max-w-7xl max-h-[95vh] overflow-hidden p-0 rounded-xl"
          style={{ backgroundColor: theme === 'dark' ? '#111111' : '#f8f9fa' }}
        >
        <DialogTitle className="sr-only">Add Announcement</DialogTitle>
        <div className="flex h-[95vh]">
          {/* Left Panel - Form */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
              <div className="flex items-center gap-3">
                <Badge className="text-xs h-6 flex items-center rounded-[6px]">
                  Announcement
                </Badge>
                {announcementType === 'quick' && formData.sent_at && (
                  <div className="text-sm text-muted-foreground">
                    {new Date(formData.sent_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Announcement Header */}
            <div className="px-6 py-5">
              {/* Announcement Title - Editable Title */}
              {(!announcementToEdit && isEditingAnnouncement) || (announcementToEdit && isEditingAnnouncement) ? (
                <div className="mb-4">
                  <Input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Announcement Title"
                    autoFocus
                    readOnly={formData.status === 'cancelled' || formData.status === 'expired'}
                    className="text-2xl font-semibold h-auto px-3 py-0 !border !border-sidebar-border dark:!border-border !bg-[#ebebeb] dark:!bg-[#0a0a0a] rounded-lg transition-colors duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                    style={{ minHeight: '2.5rem' }}
                    onBlur={() => {
                      if (announcementToEdit) {
                        handleAnnouncementSave(formData.title || '')
                      } else {
                        // When adding new announcement, convert to text mode when losing focus
                        setIsEditingAnnouncement(false)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (announcementToEdit) {
                          handleAnnouncementSave(formData.title || '')
                        } else {
                          // When adding new announcement, convert to text mode on Enter
                          setIsEditingAnnouncement(false)
                        }
                      } else if (e.key === 'Escape') {
                        if (announcementToEdit) {
                          handleAnnouncementCancel()
                        } else {
                          // When adding new announcement, convert to text mode on Escape
                          setIsEditingAnnouncement(false)
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div 
                  className={`text-2xl font-semibold mb-4 px-3 py-0 rounded-lg transition-colors duration-200 flex items-center border border-transparent ${
                    formData.status === 'cancelled' || formData.status === 'expired'
                      ? 'cursor-default'
                      : 'cursor-pointer hover:bg-[#ebebeb] dark:hover:bg-[#0a0a0a]'
                  }`}
                  style={{ minHeight: '2.5rem' }}
                  onClick={() => {
                    if (formData.status !== 'cancelled' && formData.status !== 'expired') {
                      setIsEditingAnnouncement(true)
                    }
                  }}
                >
                  {formData.title || 'Announcement Title'}
                </div>
              )}
              
              {/* Announcement Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Announcement Priority */}
                <div className="flex items-center gap-2">
                  <IconAlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Priority:</span>
                  {formData.status === 'cancelled' || formData.status === 'expired' ? (
                    <Badge 
                      variant="outline" 
                      className={`px-3 py-1 font-medium flex items-center justify-center ${
                        formData.priority ? getAnnouncementPriorityBadgeClass(formData.priority) : 'text-muted-foreground'
                      }`}
                    >
                      {formData.priority ? announcementPriorityOptions.find(opt => opt.value === formData.priority)?.label || formData.priority : 'Set Priority'}
                    </Badge>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={`px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center ${
                            formData.priority ? getAnnouncementPriorityBadgeClass(formData.priority) : 'text-muted-foreground'
                          }`}
                        >
                          {formData.priority ? announcementPriorityOptions.find(opt => opt.value === formData.priority)?.label || formData.priority : 'Set Priority'}
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent className="w-32 p-2">
                        {announcementPriorityOptions.map((option) => {
                          const isCurrentPriority = formData.priority === option.value;
                          return (
                            <PopoverItem
                              key={option.value}
                              variant="primary"
                              isSelected={isCurrentPriority}
                              onClick={() => handleInputChange('priority', option.value)}
                            >
                              {option.value === 'low' ? (
                                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                              ) : option.value === 'medium' ? (
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              ) : option.value === 'high' ? (
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              ) : option.value === 'urgent' ? (
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
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

                {/* Announcement Status */}
                <div className="flex items-center gap-2">
                  {getAnnouncementStatusIcon(formData.status)}
                  <span className="text-muted-foreground">Status:</span>
                  <Badge 
                    className={`px-3 py-1 font-medium flex items-center justify-center ${
                      formData.status ? getAnnouncementStatusBadgeClass(formData.status) : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {formData.status ? announcementStatusOptions.find(opt => opt.value === formData.status)?.label || formData.status : 'Set Status'}
                  </Badge>
                </div>
              </div>

              {/* Sent at - Only show for active announcements with sent_at */}
              {formData.sent_at && (
                <div className="flex items-center gap-2 text-sm mt-3">
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Sent at:</span>
                  <span className="text-sm font-medium">
                    {new Date(formData.sent_at).toLocaleDateString()} {new Date(formData.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0">
              {isLoadingAnnouncement ? (
                <div className="space-y-6">
                  {/* Content Section Skeleton */}
                  <div>
                    <div className="flex items-center justify-between min-h-[40px]">
                      <h3 className="text-lg font-medium text-muted-foreground">Message</h3>
                    </div>
                    <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                      <div className="p-6">
                        <Skeleton className="h-[120px] w-full rounded" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Details Section Skeleton */}
                  {announcementType !== 'quick' && formData.status !== 'expired' && (
                  <div>
                    <div className="flex items-center justify-between min-h-[40px]">
                      <h3 className="text-lg font-medium text-muted-foreground">Schedule</h3>
                    </div>
                    <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                      {/* Announcement Date Skeleton */}
                      <div className="grid grid-cols-[180px_auto_1fr] gap-2 h-[33px] items-center border-b border-[#cecece99] dark:border-border">
                        <div className="flex items-center gap-3 min-w-0 px-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                        <div className="min-w-0 flex items-center relative px-2">
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      
                      {/* Expiry Date Skeleton */}
                      <div className="grid grid-cols-[180px_auto_1fr] gap-2 h-[33px] items-center">
                        <div className="flex items-center gap-3 min-w-0 px-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="w-px bg-[#cecece99] dark:bg-border h-full"></div>
                        <div className="min-w-0 flex items-center relative px-2">
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Recipients Section Skeleton */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between min-h-[40px]">
                      <h3 className="text-lg font-medium text-muted-foreground">
                        Recipients
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
              <form id="add-announcement-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Content Section */}
                 <div>
                   <div className="flex items-center justify-between min-h-[40px]">
                     <h3 className="text-lg font-medium text-muted-foreground">Message</h3>
                   </div>
                   <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                     <div className="p-6">
                       <Textarea
                         value={formData.message || ''}
                         onChange={(e) => handleInputChange('message', e.target.value)}
                         placeholder="Enter announcement content..."
                         tabIndex={-1}
                         readOnly={formData.status === 'cancelled' || formData.status === 'expired'}
                         className="min-h-[120px] resize-none border-0 bg-transparent dark:bg-transparent text-foreground placeholder:text-muted-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm leading-relaxed w-full rounded-none"
                       />
                     </div>
                   </div>
                 </div>
                  
                {/* Announcement Information Section - Only show for scheduled announcements */}
                  {announcementType !== 'quick' && formData.status !== 'expired' && (
                  <div>
                    <div className="flex items-center justify-between min-h-[40px]">
                    <h3 className="text-lg font-medium text-muted-foreground">Schedule</h3>
                    </div>
                    {/* Announcement Information Container */}
                    <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                    {/* Announcement Date */}
                    <DataFieldRow
                      icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      label="Announcement Date"
                      fieldName="announcement_date"
                      value={localAnnouncementDate && !isNaN(localAnnouncementDate.getTime()) ? localAnnouncementDate.toLocaleDateString() : ''}
                      onSave={() => {}}
                      placeholder="-"
                      readOnly={(formData.status as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled') === 'cancelled' || (formData.status as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled') === 'expired'}
                      customInput={(formData.status as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled') !== 'cancelled' && (formData.status as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled') !== 'expired' ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              tabIndex={-1}
                              className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                localAnnouncementDate ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                               {localAnnouncementDate && !isNaN(localAnnouncementDate.getTime()) ? localAnnouncementDate.toLocaleDateString() : "-"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={localAnnouncementDate}
                               onSelect={(date) => {
                                 console.log('🔄 Calendar onSelect triggered with date:', date)
                                 setLocalAnnouncementDate(date)
                                 if (date) {
                                   // Use timezone-safe date formatting to avoid day shift
                                   const year = date.getFullYear()
                                   const month = String(date.getMonth() + 1).padStart(2, '0')
                                   const day = String(date.getDate()).padStart(2, '0')
                                   const dateStr = `${year}-${month}-${day}`
                                   console.log('🔄 Converting date to string:', dateStr)
                                   handleInputChange('scheduled_at', dateStr)
                                 }
                                 console.log('Announcement date changed to:', date)
                               }}
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                      ) : undefined}
                    />

                      {/* Expiry Date */}
                      <DataFieldRow
                        icon={<IconCalendarTime className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Expiry Date"
                        fieldName="expiry_date"
                        value={localExpiryDate && !isNaN(localExpiryDate.getTime()) ? localExpiryDate.toLocaleDateString() : ''}
                        onSave={() => {}}
                        placeholder="-"
                        isLast={true}
                        readOnly={(formData.status as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled') === 'cancelled' || (formData.status as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled') === 'expired'}
                        customInput={(formData.status as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled') !== 'cancelled' && (formData.status as 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled') !== 'expired' ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                tabIndex={-1}
                                className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                  localExpiryDate ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                              >
                                 {localExpiryDate && !isNaN(localExpiryDate.getTime()) ? localExpiryDate.toLocaleDateString() : "-"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={localExpiryDate}
                                 onSelect={(date) => {
                                   console.log('🔄 Expiry Calendar onSelect triggered with date:', date)
                                   setLocalExpiryDate(date)
                                   if (date) {
                                     // Use timezone-safe date formatting to avoid day shift
                                     const year = date.getFullYear()
                                     const month = String(date.getMonth() + 1).padStart(2, '0')
                                     const day = String(date.getDate()).padStart(2, '0')
                                     const dateStr = `${year}-${month}-${day}`
                                     console.log('🔄 Converting expiry date to string:', dateStr)
                                     handleInputChange('expires_at', dateStr)
                                   } else {
                                     handleInputChange('expires_at', '')
                                   }
                                   console.log('Expiry date changed to:', date)
                                 }}
                                captionLayout="dropdown"
                              />
                            </PopoverContent>
                          </Popover>
                        ) : undefined}
                      />

                  </div>
                </div>
                  )}

                {/* Target Recipients Section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between min-h-[40px]">
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Recipients
                       {formData.assigned_user_ids && formData.assigned_user_ids.length > 0 && (
                         <span className="ml-2 text-sm text-muted-foreground">
                           ({formData.assigned_user_ids.length})
                         </span>
                       )}
                    </h3>
                    {(formData.status !== 'cancelled' && formData.status !== 'expired') && (
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
                    )}
                  </div>
                  
                  <div className="rounded-lg border border-[#cecece99] dark:border-border">
                    {/* Agent Fields */}
                    <div className="p-4">
                      {formData.assigned_user_ids && formData.assigned_user_ids.length > 0 ? (
                        <div className="space-y-4">
                          {/* Users Section */}
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Recipients</h4>
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
                                    <AvatarImage src={agent.profile_picture || undefined} alt={agent.first_name || 'Recipient'} />
                                    <AvatarFallback className="text-xs">
                                      {agent.first_name && agent.last_name 
                                        ? `${agent.first_name.charAt(0)}${agent.last_name.charAt(0)}`
                                        : agent.first_name?.charAt(0) || agent.last_name?.charAt(0) || 'R'
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
                                  {(formData.status !== 'cancelled' && formData.status !== 'expired') && (
                                    <button
                                      onClick={async (e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        
                                        const newTargetIds = formData.assigned_user_ids?.filter(id => id !== agent.user_id) || []
                                        
                                        // Update form data
                                        handleInputChange('assigned_user_ids', newTargetIds)
                                        
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
                                  <p className="text-sm">No recipients found</p>
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
                                      {(formData.status !== 'cancelled' && formData.status !== 'expired') && (
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
                          <p className="text-sm">No Recipients Added</p>
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
                {/* Show Save buttons only when adding a new announcement (not editing) AND modal is open */}
                {isOpen && !announcementToEdit?.id && (
                  <div className="flex gap-2">
                    <Button type="submit" form="add-announcement-form" disabled={isSubmitting || !isFormValid()} size="sm">
                      {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={handleSaveAsDraft}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save As Draft'}
                    </Button>
                  </div>
                )}

                {/* Show Publish/Save as Draft/Delete button only when editing an existing announcement AND modal is open */}
                {isOpen && announcementToEdit?.id && (
                  <div className="flex gap-2">
                    {formData.status === 'draft' && (
                      <Button 
                        type="button" 
                        variant="default" 
                        size="sm"
                        onClick={() => setShowPublishConfirmation(true)}
                        disabled={isPublishing || isDeleting || isArchiving || !isFormValid()}
                      >
                        {isPublishing ? 'Publishing...' : 'Publish Announcement'}
                      </Button>
                    )}
                    {formData.status === 'cancelled' && (
                      <Button 
                        type="button" 
                        variant="default" 
                        size="sm"
                        onClick={() => setShowRecoverConfirmation(true)}
                        disabled={isRecovering || isDeleting}
                      >
                        {isRecovering ? 'Recovering...' : 'Recover Announcement'}
                      </Button>
                    )}
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setShowDeleteConfirmation(true)}
                      disabled={isPublishing || isDeleting || isArchiving || isRecovering}
                    >
                      {isDeleting 
                        ? (formData.status === 'scheduled' || formData.status === 'active' ? 'Cancelling...' : 'Deleting...') 
                        : (formData.status === 'scheduled' || formData.status === 'active' ? 'Cancel Announcement' : 'Delete Announcement')
                      }
                    </Button>
                    {formData.status !== 'draft' && isEditingAnnouncement && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={handleSaveAsDraft}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Save as Draft'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-96 flex flex-col border-l border-[#cecece99] dark:border-border h-full bg-[#ececec] dark:bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border flex-shrink-0">
              <h3 className="font-medium">
                {showAgentSelection ? 'Select Recipients' : 'Activity'}
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
                     let newTargetIds: number[]
                     
                     if (isSelected) {
                       if (!currentIds.includes(agentId)) {
                         newTargetIds = [...currentIds, agentId]
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
                       newTargetIds = currentIds.filter(id => id !== agentId)
                       setSelectedAgentsData(prev => prev.filter(a => a.user_id !== agentId))
                     }
                     
                     handleInputChange('assigned_user_ids', newTargetIds)
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
                // Activity Content - Shows announcement activity and recent changes
                <div>
                {announcementToEdit?.id ? (
                  <EventsActivityLog 
                    eventId={announcementToEdit.id} 
                    eventTitle={announcementToEdit.title || 'Unknown Announcement'} 
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
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              {formData.status === 'scheduled' || formData.status === 'active' ? 'Cancel Announcement' : 'Delete Announcement'}
            </h2>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">
              {formData.status === 'scheduled' 
                ? 'Are you sure you want to cancel this scheduled announcement? This will change its status to cancelled and prevent it from being sent.'
                : formData.status === 'active'
                ? 'Are you sure you want to cancel this active announcement? This will change its status to cancelled and stop it from being displayed.'
                : 'Are you sure you want to delete this announcement? This action cannot be undone and will permanently remove the announcement.'
              }
            </p>
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
              onClick={formData.status === 'scheduled' || formData.status === 'active' ? handleCancelConfirm : handleDeleteConfirm}
              disabled={isDeleting || isArchiving}
            >
              {isDeleting || isArchiving
                ? (formData.status === 'scheduled' || formData.status === 'active' ? 'Cancelling...' : 'Deleting...') 
                : (formData.status === 'scheduled' || formData.status === 'active' ? 'Yes' : 'Yes')
              }
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
            <p className="text-muted-foreground">The following required fields are missing. Please fill in all required fields before saving this announcement.</p>
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

      {/* Activate Confirmation Dialog */}
      <Dialog open={showPublishConfirmation} onOpenChange={setShowPublishConfirmation}>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Publish Announcement</h2>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">Are you sure you want to publish this announcement? This will make it visible to all recipients.</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowPublishConfirmation(false)}
            >
              No
            </Button>
            <Button 
              variant="default"
              onClick={handleActivateConfirm}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publishing...' : 'Yes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showArchiveConfirmation} onOpenChange={setShowArchiveConfirmation}>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Cancel Announcement</h2>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">Are you sure you want to cancel this announcement? This will stop it from being visible to recipients.</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowArchiveConfirmation(false)}
            >
              No
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={isArchiving}
            >
              {isArchiving ? 'Cancelling...' : 'Yes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recover Confirmation Dialog */}
      <Dialog open={showRecoverConfirmation} onOpenChange={setShowRecoverConfirmation}>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-xl [&>button]:hidden">
          <div className="flex flex-col space-y-1.5 text-center sm:text-center">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Recover Announcement</h2>
          </div>
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">Are you sure you want to recover this announcement? This will change the status from cancelled to the appropriate status based on the announcement date.</p>
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
      </Dialog>
    </>
  )
}

export default AddAnnouncementModal

