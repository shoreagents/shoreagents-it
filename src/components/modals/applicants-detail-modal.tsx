"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconVideo, IconCash, IconClockHour4, IconExternalLink, IconSun, IconMoon } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { EditableField, DataFieldRow } from "@/components/ui/fields"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTheme } from "next-themes"
import { useRealtimeApplicants } from "@/hooks/use-realtime-applicants"

interface ApplicantsDetailModalProps {
  applicant: Applicant | null
  isOpen: boolean
  onClose: () => void
  onStatusUpdate?: (applicantId: string, jobIndex: number, newStatus: string) => void
}

interface StatusOption {
  value: string
  label: string
  icon: string
  color: string
}

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
  status: string
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
  resume_slug_recruits?: string | null
  status_recruits?: string | null
  created_at_recruits?: string | null
  updated_at_recruits?: string | null
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

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture: string;
  };
}

const getStatusColor = (status: string) => {
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
    case "not qualifies":
      return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
    case "failed":
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
    case "submitted":
      return <IconCircle className="h-4 w-4 fill-blue-500 stroke-none" />
    case "qualified":
      return <IconCircle className="h-4 w-4 fill-yellow-500 stroke-none" />
    case "for verification":
      return <IconCircle className="h-4 w-4 fill-teal-500 stroke-none" />
    case "verified":
      return <IconCircle className="h-4 w-4 fill-purple-500 stroke-none" />
    case "initial interview":
      return <IconCircle className="h-4 w-4 fill-amber-500 stroke-none" />
    case "final interview":
      return <IconCircle className="h-4 w-4 fill-pink-500 stroke-none" />
    case "not qualifies":
      return <IconCircle className="h-4 w-4 fill-red-500 stroke-none" />
    case "failed":
      return <IconCircle className="h-4 w-4 fill-red-500 stroke-none" />
    case "not qualified":
      return <IconCircle className="h-4 w-4 fill-red-500 stroke-none" />
    case "passed":
      return <IconCircle className="h-4 w-4 fill-green-500 stroke-none" />
    // BPOC final statuses
    case "withdrawn":
      return <IconCircle className="h-4 w-4 fill-gray-500 stroke-none" />
    case "hired":
      return <IconCircle className="h-4 w-4 fill-orange-500 stroke-none" />
    default:
      return <IconCircle className="h-4 w-4 fill-gray-500 stroke-none" />
  }
}

// Get status display label based on status value
const getStatusLabel = (status: string) => {
  const statusOptions = [
    { value: 'submitted', label: 'New' },
          { value: 'qualified', label: 'Qualified' },
    { value: 'for verification', label: 'For Verification' },
    { value: 'verified', label: 'Verified' },
    { value: 'initial interview', label: 'Initial Interview' },
    { value: 'final interview', label: 'Final Interview' },
    { value: 'failed', label: 'Not Qualified' },
          { value: 'not qualified', label: 'Not Qualified' },
    { value: 'passed', label: 'Ready for Sale' },
    // Additional possible BPOC status values
    { value: 'pending', label: 'Pending' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'interview', label: 'Interview' },
    { value: 'hired', label: 'Hired' },
    { value: 'withdrawn', label: 'Withdrawn' }
  ]
  const statusOption = statusOptions.find(option => option.value === status.toLowerCase())
  return statusOption ? statusOption.label : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return {
    date: date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    full: date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
}

export function ApplicantsDetailModal({ applicant, isOpen, onClose, onStatusUpdate }: ApplicantsDetailModalProps) {
  const { theme } = useTheme()
  const [comment, setComment] = useState("")
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  
  // Editable input values
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [savedField, setSavedField] = useState<string | null>(null)
  
  // Track which field is being edited
  const [editingField, setEditingField] = useState<string | null>(null)
  
  // Track which fields were successfully saved
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set())
  
  // Store original values for change detection
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({})
  
  // Batch update functionality
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, string>>({})
  
  // Batch save function for immediate saves
  const handleBatchSave = async (updates: Record<string, string>) => {
    if (!applicant || isSaving) return
    
    try {
      setIsSaving(true)
      console.log('🔄 Starting batch save for fields:', Object.keys(updates))
      
      // Convert salary fields to numbers for the API
      const processedUpdates: Record<string, any> = {}
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'current_salary' || key === 'expected_monthly_salary') {
          // Convert empty string to null, otherwise to number
          const numValue = value === '' ? null : parseFloat(value)
          processedUpdates[key] = numValue
        } else {
          processedUpdates[key] = value
        }
      })
      
      // Call API to update multiple fields at once
      const response = await fetch(`/api/bpoc`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: applicant.id,
          ...processedUpdates
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update fields: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ Batch update successful:`, result)
      
      // Clear pending updates after successful save
      setPendingUpdates({})
      console.log('✅ Cleared pending updates')
      
      // Track which fields were successfully saved
      const updatedFieldNames = Object.keys(updates)
      setSavedFields(prev => new Set([...prev, ...updatedFieldNames]))
      
      // Update original values after successful save
      setOriginalValues(prev => ({
        ...prev,
        ...updates
      }))
      console.log('✅ Updated original values after save')
      
      // Show success feedback for all updated fields
      const fieldNames = Object.keys(updates).map(name => name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      setSavedField(fieldNames.join(', '))
      
      // Clear success states after 2 seconds
      setTimeout(() => {
        setSavedFields(prev => {
          const newSet = new Set(prev)
          updatedFieldNames.forEach(field => newSet.delete(field))
          return newSet
        })
        setSavedField(null)
      }, 2000)
      
    } catch (error) {
      console.error(`❌ Error in batch update:`, error)
      // Clear pending updates on error to stop showing spinners
      setPendingUpdates({})
      console.log('❌ Cleared pending updates due to error')
      
      // Revert the input values on error
      setInputValues(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.keys(updates).map(key => [key, (applicant as any)[key] || ''])
        )
      }))
    } finally {
      setIsSaving(false)
      console.log('✅ Batch save completed, isSaving set to false')
    }
  }
  
  // Real-time updates for applicant data
  const { isConnected: isRealtimeConnected } = useRealtimeApplicants({
    onApplicantUpdated: (updatedApplicant, oldApplicant) => {
      console.log('🔄 Real-time: Applicant update received in modal:', { updatedApplicant, oldApplicant, currentApplicantId: applicant?.id })
      
      // Only process updates for the current applicant
      if (applicant && updatedApplicant.id === applicant.id) {
        console.log('🔄 Real-time: Processing update for current applicant:', updatedApplicant)
        
        // Update the applicant object with new data
        Object.keys(updatedApplicant).forEach(fieldName => {
          if (fieldName in applicant) {
            (applicant as any)[fieldName] = updatedApplicant[fieldName]
          }
        })
        
        // Update input values to reflect the new data
        const newValues = {
          shift: String(updatedApplicant.shift || ''),
          current_salary: String(updatedApplicant.current_salary || ''),
          expected_monthly_salary: String(updatedApplicant.expected_monthly_salary || ''),
          video_introduction_url: String(updatedApplicant.video_introduction_url || '')
        }
        console.log('🔄 Setting new input values:', newValues)
        
        // Update input values immediately (no delay)
        setInputValues(newValues)
        
        // Show a notification that data was updated
        setSavedField('realtime_update')
        setTimeout(() => setSavedField(null), 3000)
      } else {
        console.log('🔄 Real-time: Update not for current applicant, skipping')
      }
    }
  })

  console.log('🔍 Modal real-time hook initialized:', { isRealtimeConnected, applicantId: applicant?.id })



  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      // No debounced save to clear
    }
  }, [])

  // Debug: Monitor pendingUpdates state changes
  useEffect(() => {
    console.log('📊 pendingUpdates state changed:', pendingUpdates)
  }, [pendingUpdates])

  // Debug: Monitor savedFields state changes
  useEffect(() => {
    console.log('📊 savedFields state changed:', Array.from(savedFields))
  }, [savedFields])

  // Immediate save function for instant saving
  const handleImmediateSave = useCallback((fieldName: string) => {
    const value = inputValues[fieldName]
    if (!applicant) return
    
    // Check if value has actually changed against original values
    const originalValue = originalValues[fieldName]
    let hasChanged = false
    
    if (fieldName === 'current_salary' || fieldName === 'expected_monthly_salary') {
      // For salary fields, compare numeric values
      const currentNumeric = value === '' ? null : parseFloat(value.replace(/,/g, ''))
      const originalNumeric = originalValue === '' ? null : parseFloat(originalValue.replace(/,/g, ''))
      hasChanged = currentNumeric !== originalNumeric
      console.log(`🔢 Salary comparison for ${fieldName}:`, { current: currentNumeric, original: originalNumeric, hasChanged })
    } else {
      // For other fields, compare string values
      const currentString = value || ''
      const originalString = originalValue || ''
      hasChanged = currentString !== originalString
      console.log(`📝 String comparison for ${fieldName}:`, { current: currentString, original: originalString, hasChanged })
    }
    
    if (!hasChanged) {
      console.log(`⏭️ Skipping save for ${fieldName} - value unchanged:`, { current: value, original: originalValue })
      return
    }
    
    console.log(`🚀 Immediate save triggered for ${fieldName}:`, value)
    
    // Add to pending updates to show spinner
    setPendingUpdates(prev => ({ ...prev, [fieldName]: value }))
    console.log(`📝 Added ${fieldName} to pending updates`)
    
    // Save immediately
    handleBatchSave({ [fieldName]: value })
  }, [inputValues, applicant, originalValues, pendingUpdates])

  // Save on blur function - saves immediately when leaving input
  const handleBlurSave = useCallback((fieldName: string) => {
    const value = inputValues[fieldName]
    if (!applicant) return
    
    // Check if value has actually changed against original values
    const originalValue = originalValues[fieldName]
    let hasChanged = false
    
    if (fieldName === 'current_salary' || fieldName === 'expected_monthly_salary') {
      // For salary fields, compare numeric values
      const currentNumeric = value === '' ? null : parseFloat(value.replace(/,/g, ''))
      const originalNumeric = originalValue === '' ? null : parseFloat(originalValue.replace(/,/g, ''))
      hasChanged = currentNumeric !== originalNumeric
      console.log(`🔢 Salary comparison for ${fieldName}:`, { current: currentNumeric, original: originalNumeric, hasChanged })
    } else {
      // For other fields, compare string values
      const currentString = value || ''
      const originalString = originalValue || ''
      hasChanged = currentString !== originalString
      console.log(`📝 String comparison for ${fieldName}:`, { current: currentString, original: originalString, hasChanged })
    }
    
    if (!hasChanged) {
      console.log(`⏭️ Skipping save for ${fieldName} - value unchanged:`, { current: value, original: originalValue })
      return
    }
    
    console.log(`👁️ Blur save triggered for ${fieldName}:`, value)
    
    // Add to pending updates to show spinner
    setPendingUpdates(prev => ({ ...prev, [fieldName]: value }))
    console.log(`📝 Added ${fieldName} to pending updates`)
    
    // Save immediately
    handleBatchSave({ [fieldName]: value })
  }, [inputValues, applicant, originalValues, pendingUpdates])


  // Define status options for applicants
  const getStatusOptions = (): StatusOption[] => {
    return [
      { value: 'submitted', label: 'New', icon: 'blue', color: 'blue' },
              { value: 'qualified', label: 'Qualified', icon: 'orange', color: 'orange' },
      { value: 'for verification', label: 'For Verification', icon: 'teal', color: 'teal' },
      { value: 'verified', label: 'Verified', icon: 'purple', color: 'purple' },
      { value: 'initial interview', label: 'Initial Interview', icon: 'indigo', color: 'indigo' },
      { value: 'final interview', label: 'Final Interview', icon: 'violet', color: 'violet' },
        { value: 'not qualified', label: 'Not Qualified', icon: 'red', color: 'red' },
      { value: 'passed', label: 'Ready for Sale', icon: 'green', color: 'green' }
    ]
  }

  React.useEffect(() => {
    if (applicant) {
      setCurrentStatus(applicant.status)
      // Initialize input values
      const initialValues = {
        shift: String(applicant.shift || ''),
        current_salary: String(applicant.current_salary || ''),
        expected_monthly_salary: String(applicant.expected_monthly_salary || ''),
        video_introduction_url: String(applicant.video_introduction_url || '')
      }
      setInputValues(initialValues)
      
      // Store original values for change detection
      setOriginalValues(initialValues)
      
      // TODO: Fetch comments when API is ready
      // fetchComments()
    }
    setStatusOptions(getStatusOptions())
  }, [applicant])

  // TODO: Implement comment fetching when API is ready
  const fetchComments = async () => {
    // Placeholder for future implementation
    setIsLoadingComments(false)
    setComments([])
  }

  // Handle input changes
  const handleInputChange = (fieldName: string, value: string) => {
    console.log(`🔄 Input change for ${fieldName}:`, value)
    
    // For salary fields, only allow numbers
    if (fieldName === 'current_salary' || fieldName === 'expected_monthly_salary') {
      // Remove all non-numeric characters except decimal point (including commas)
      let numericValue = value.replace(/[^0-9.]/g, '')
      console.log(`🔢 Filtered numeric value:`, numericValue)
      
      // Ensure only one decimal point
      const parts = numericValue.split('.')
      if (parts.length > 2) {
        // Keep only the first two parts (before and after first decimal)
        numericValue = parts[0] + '.' + parts.slice(1).join('')
        console.log(`🔢 Fixed multiple decimals:`, numericValue)
      }
      
      // Prevent extremely large numbers
      if (numericValue.length > 17) { // Max 17 characters for numeric(15,2): 999,999,999,999.99
        console.log(`⚠️ Number too long, truncating:`, numericValue)
        numericValue = numericValue.substring(0, 17)
      }
      
      // Update with filtered value
      setInputValues(prev => ({ ...prev, [fieldName]: numericValue }))
      console.log(`✅ Updated ${fieldName} to:`, numericValue)
      
      // Also update the applicant object for instant feedback
      if (applicant) {
        (applicant as any)[fieldName] = numericValue
      }
    } else {
      // For non-salary fields, allow any input
    setInputValues(prev => ({ ...prev, [fieldName]: value }))
      
      // Also update the applicant object for instant feedback
      if (applicant) {
        (applicant as any)[fieldName] = value
      }
    }
    
    // No auto-save while typing - only save on blur or Enter
  }

  // Handle saving input values
  const handleInputSave = async (fieldName: string) => {
    if (!applicant || isSaving) return
    
    const value = inputValues[fieldName]
    if (value === undefined) return
    
    try {
      setIsSaving(true)
      
      // Convert salary fields to numbers for the API
      let processedValue: any = value
      if (fieldName === 'current_salary' || fieldName === 'expected_monthly_salary') {
        processedValue = value === '' ? null : parseFloat(value)
      }
      
      // Debug: Log what we're sending
      const requestBody = {
        id: applicant.id, // Use the primary key ID
        [fieldName]: processedValue
      }
      console.log('🔍 Sending PUT request:', {
        url: '/api/bpoc',
        method: 'PUT',
        body: requestBody,
        applicantId: applicant.applicant_id,
        applicantPrimaryId: applicant.id
      })
      
      // Call API to update the field
      const response = await fetch(`/api/bpoc`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Response not OK:`, {
          status: response.status,
          statusText: response.statusText,
          errorText
        })
        throw new Error(`Failed to update ${fieldName}: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ ${fieldName} updated successfully:`, result)
      
      // Update local state with the updated applicant data
      if (applicant && result.applicant) {
        // Update the specific field in the applicant object
        (applicant as any)[fieldName] = processedValue
        
        // Also update the inputValues to reflect the saved state
        setInputValues(prev => ({
          ...prev,
          [fieldName]: value
        }))
      }
      
      // Show success feedback (you could add a toast notification here)
      setSavedField(fieldName)
      setTimeout(() => setSavedField(null), 2000) // Hide after 2 seconds
      
    } catch (error) {
      console.error(`❌ Error updating ${fieldName}:`, error)
      // Revert the input value on error
      setInputValues(prev => ({
        ...prev,
        [fieldName]: (applicant as any)[fieldName] || ''
      }))
      // You could show an error toast here
    } finally {
      setIsSaving(false)
    }
  }

  // Format number with commas and hide unnecessary decimals
  const formatNumber = (value: string | number | null): string => {
    if (value === null || value === undefined || value === '') return ''
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return String(value)
    
    // Format with commas and 2 decimal places
    const formatted = numValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
    
    return formatted
  }

  if (!applicant) return null

  const createdDate = formatDate(applicant.created_at)
  const updatedDate = applicant.updated_at && applicant.updated_at !== applicant.created_at ? formatDate(applicant.updated_at) : null





  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !applicant || isSubmittingComment) return
    
    // TODO: Implement comment submission when API is ready
    setIsSubmittingComment(true)
    setTimeout(() => {
      setComment("")
      setIsSubmittingComment(false)
    }, 1000)
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdatingStatus(true)
      setCurrentStatus(newStatus)
      
              // Call API to update status in both BPOC and main database
        const response = await fetch(`/api/bpoc`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: applicant.id, // Use the primary key ID
            status: newStatus
          })
        })

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Status updated successfully:', result)
      
      // Optionally refresh the applicant data or show success message
      // You could also trigger a refresh of the parent component
      
    } catch (error) {
      console.error('❌ Error updating status:', error)
      // Revert the local state change on error
      setCurrentStatus(applicant.status)
      // You could show an error toast here
    } finally {
      setIsUpdatingStatus(false)
    }
  }





  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-7xl max-h-[95vh] overflow-hidden p-0 rounded-xl" 
          style={{ 
          backgroundColor: theme === 'dark' ? '#111111' : '#f8f9fa' 
          }}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex h-[95vh]">
            {/* Left Panel - Applicant Details */}
            <div className="flex-1 flex flex-col">
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs h-6 flex items-center bg-primary/10 text-primary rounded-[6px]">
                    Applicant
                  </Badge>

                </div>
              </div>

              {/* Applicant Header */}
              <div className="px-6 py-5">
                
                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Name */}
                  <div className="flex items-center gap-2">
                    <IconUser className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Name:</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={applicant.profile_picture || ''} alt="Applicant" />
                        <AvatarFallback className="text-xs">
                          {applicant.first_name && applicant.last_name 
                            ? `${applicant.first_name[0]}${applicant.last_name[0]}`
                            : String(applicant.user_id).split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {applicant.full_name || (applicant.first_name && applicant.last_name 
                          ? `${applicant.first_name} ${applicant.last_name}`
                          : `User ${applicant.user_id}`)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(currentStatus || applicant.status)}
                    <span className="text-muted-foreground">Status:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-auto p-0 hover:bg-muted/50 active:bg-muted/70 transition-colors"
                          disabled={isUpdatingStatus}
                        >
                          <Badge variant="outline" className={`${getStatusColor(currentStatus || applicant.status)} px-2 py-1 text-xs cursor-pointer hover:opacity-80 transition-opacity ${isUpdatingStatus ? 'opacity-50' : ''}`}>
                            {isUpdatingStatus ? 'Updating...' : getStatusLabel(currentStatus || applicant.status)}
                          </Badge>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="start" side="bottom" sideOffset={4}>
                        <div className="space-y-1">
                          {statusOptions.map((option) => (
                            <div 
                              key={option.value}
                              className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                (currentStatus || applicant.status) === option.value 
                                  ? 'bg-primary/10 text-primary border border-primary/20 pointer-events-none cursor-default' 
                                  : isUpdatingStatus 
                                  ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                                  : 'cursor-pointer hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => !isUpdatingStatus && handleStatusChange(option.value)}
                            >
                              {getStatusIcon(option.value)}
                              <span className="text-sm font-medium">{option.label}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  

                  

                  


                </div>
              </div>
              
              <div className="px-6">
                <Separator />
              </div>

              {/* Applicant Details */}
              <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0">
                <div className="space-y-6 flex flex-col min-h-full">
                  {/* Job Application Section */}
                  <div className="flex flex-col">
                    <h3 className="text-lg font-medium mb-2 text-muted-foreground">Job Application</h3>
                    <div className="rounded-lg p-6 text-sm leading-relaxed border border-[#cecece99] dark:border-border">
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
                                                    className={`${getStatusColor(status)} px-2 py-0.5 text-xs font-medium rounded-md cursor-pointer hover:opacity-80 transition-opacity`}
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    {getStatusLabel(status)}
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
                                                            try {
                                                              console.log(`Updating BPOC job ${index} status to:`, statusOption);
                                                              
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
                                                                
                                                                // Update parent state if callback is provided
                                                                if (onStatusUpdate) {
                                                                  onStatusUpdate(applicant.id, index, statusOption);
                                                                }
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
                                                        <span className="text-sm font-medium">{getStatusLabel(statusOption)}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </PopoverContent>
                                              </Popover>
                                            );
                                          }
                                          
                                          // Non-clickable badge when main status is not "passed"
                                          return (
                                            <Badge variant="outline" className={`${getStatusColor(status)} px-2 py-0.5 text-xs font-medium rounded-md`}>
                                              {getStatusLabel(status)}
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
                                                  className="px-2 py-0.5 text-xs font-medium rounded-md cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 border-dashed text-muted-foreground border-muted-foreground/30"
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
                                                            
                                                            // Update parent state if callback is provided
                                                            if (onStatusUpdate) {
                                                              onStatusUpdate(applicant.id, index, statusOption);
                                                            }
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
                                                      <span className="text-sm font-medium">{getStatusLabel(statusOption)}</span>
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
                                        <IconBuilding className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground font-medium">
                                          {applicant.all_companies[index]}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <IconBuilding className="w-3 h-3 text-muted-foreground/50" />
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
                                    const showStatus = ['withdrawn', 'failed', 'final interview', 'hired'].includes(status.toLowerCase());
                                    
                                    // If BPOC recruits status is "passed", show popover for status selection
                                    if (applicant.status.toLowerCase() === 'passed') {
                                      return (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              className="h-auto p-0 hover:bg-muted/50 active:bg-muted/70 transition-colors"
                                            >
                                              <Badge variant="outline" className={`${getStatusColor(status)} px-2 py-0.5 text-xs font-medium rounded-md cursor-pointer hover:opacity-80 transition-opacity`}>
                                                {getStatusLabel(status)}
                                              </Badge>
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-48 p-2" align="start" side="bottom" sideOffset={4}>
                                            <div className="space-y-1">
                                              {['withdrawn', 'failed', 'final interview', 'hired'].map((statusOption) => (
                                                <div 
                                                  key={statusOption}
                                                  className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                                    status.toLowerCase() === statusOption 
                                                      ? 'bg-primary/10 text-primary border border-primary/20 pointer-events-none cursor-default' 
                                                      : 'cursor-pointer hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground'
                                                  }`}
                                                  onClick={() => {
                                                    // TODO: Implement status update for individual job
                                                    console.log(`Update job 0 status to:`, statusOption);
                                                  }}
                                                >
                                                  {getStatusIcon(statusOption)}
                                                  <span className="text-sm font-medium">{getStatusLabel(statusOption)}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      );
                                    }
                                    
                                    // Otherwise, show regular badge if status should be shown
                                    return showStatus ? (
                                      <Badge variant="outline" className={`${getStatusColor(status)} px-2 py-0.5 text-xs font-medium rounded-md`}>
                                        {getStatusLabel(status)}
                                      </Badge>
                                    ) : null;
                                })()}
                              </div>
                              <div className="flex items-center justify-between">
                                {applicant.company_name && (
                                  <div className="flex items-center gap-1">
                                    <IconBuilding className="w-3 h-3 text-muted-foreground" />
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
                                        <div className="flex items-center gap-0 text-xs">
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

                  {/* BPOC Recruits Database Information Section */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="rounded-lg border border-[#cecece99] dark:border-border">

                      


                      {/* Shift */}
                      <div className="grid grid-cols-[140px_auto_1fr] gap-2 h-[33px] items-center border-b border-[#cecece99] dark:border-border">
                        <div className="flex items-center gap-3 min-w-0 px-2">
                          <IconClockHour4 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground truncate">Shift</span>
                        </div>
                        <div className="w-px bg-[#cecece99] dark:bg-[#4f4f4f99] h-full"></div>
                        <div className="min-w-0 flex items-center relative">
                          <Popover>
                            <PopoverTrigger asChild>
                              <div 
                                className="h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center"
                                style={{ backgroundColor: 'transparent' }}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    // Trigger the popover programmatically if needed
                                  }
                                }}
                              >
                                {inputValues.shift || '-'}
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-32 p-1" align="start" side="bottom" sideOffset={4}>
                              <div className="space-y-1">
                                {[
                                  { value: 'Day', icon: <IconSun className="h-4 w-4 text-muted-foreground" /> },
                                  { value: 'Night', icon: <IconMoon className="h-4 w-4 text-muted-foreground" /> }
                                ].map((shiftOption) => (
                                  <div 
                                    key={shiftOption.value}
                                    className={`flex items-center gap-2 p-2 rounded-md transition-all duration-200 ${
                                      inputValues.shift === shiftOption.value 
                                        ? 'bg-primary/10 text-primary border border-primary/20 cursor-default opacity-75' 
                                        : 'cursor-pointer hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground'
                                    }`}
                                    onClick={() => {
                                      // Only allow clicking if it's a different value
                                      if (inputValues.shift !== shiftOption.value) {
                                        console.log(`🔄 Shift changing from "${inputValues.shift}" to "${shiftOption.value}"`)
                                        console.log(`🔍 Original value: "${originalValues.shift}"`)
                                        console.log(`🔍 Current value: "${inputValues.shift}"`)
                                        console.log(`🔍 New value: "${shiftOption.value}"`)
                                        
                                        // Update the input values first
                                        setInputValues(prev => ({ ...prev, shift: shiftOption.value }))
                                        
                                        // Save immediately with the new value
                                        const newValue = shiftOption.value
                                        console.log(`💾 Saving shift with new value: "${newValue}"`)
                                        
                                        // Add to pending updates to show spinner
                                        setPendingUpdates(prev => ({ ...prev, shift: newValue }))
                                        
                                        // Save immediately with the new value
                                        handleBatchSave({ shift: newValue })
                                      } else {
                                        console.log(`⏭️ Shift value unchanged: "${shiftOption.value}"`)
                                      }
                                    }}
                                  >
                                    <span className="text-sm">{shiftOption.icon}</span>
                                    <span className="text-sm font-medium">{shiftOption.value}</span>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          

                        </div>
                      </div>
                      
                      {/* Current Salary */}
                      <DataFieldRow
                        icon={<IconCash className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Current Salary"
                        fieldName="current_salary"
                        value={formatNumber(inputValues.current_salary)}
                        onSave={handleInputChange}
                        onBlur={() => handleBlurSave('current_salary')}
                        onKeyDown={(e) => e.key === 'Enter' && handleImmediateSave('current_salary')}
                      />
                      
                      {/* Expected Salary */}
                      <DataFieldRow
                        icon={<IconCash className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Expected Salary"
                        fieldName="expected_monthly_salary"
                        value={formatNumber(inputValues.expected_monthly_salary)}
                        onSave={handleInputChange}
                        onBlur={() => handleBlurSave('expected_monthly_salary')}
                        onKeyDown={(e) => e.key === 'Enter' && handleImmediateSave('expected_monthly_salary')}
                      />
                      
                      {/* Video Introduction */}
                      <DataFieldRow
                        icon={<IconVideo className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Video Introduction"
                        fieldName="video_introduction_url"
                        value={inputValues.video_introduction_url || ''}
                        onSave={handleInputChange}
                        onBlur={() => handleBlurSave('video_introduction_url')}
                        onKeyDown={(e) => e.key === 'Enter' && handleImmediateSave('video_introduction_url')}
                        isLast={true}
                      />
                    </div>
                  </div>

                  {/* Additional Details Section */}
                  {applicant.details && (
                    <div className="flex-1 flex flex-col min-h-0">
                      <h3 className="text-lg font-medium mb-2 text-muted-foreground">Additional Details</h3>
                      <div className="rounded-lg p-6 text-sm leading-relaxed border border-[#cecece99] dark:border-border flex-1 min-h-0">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">
                          {applicant.details}
                        </p>
                      </div>
                    </div>
                  )}


                </div>
              </div>
            </div>

            {/* Right Panel - Activity Log */}
            <div className="w-96 flex flex-col border-l border-[#cecece99] dark:border-border h-full bg-[#ebebeb] dark:bg-[#0a0a0a]">
              {/* Activity Header */}
              <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border flex-shrink-0">
                <h3 className="font-medium">Activity</h3>
              </div>

              {/* Activity Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 bg-[#ebebeb] dark:bg-[#0a0a0a]">
                <div className="space-y-4">
                  {isLoadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">Loading comments...</div>
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="rounded-lg p-4 bg-sidebar border">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-medium text-primary">
                                  CU
                                </span>
                              </div>
                              <span className="text-sm font-medium truncate">Commenter Name</span>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">Date • Time</span>
                          </div>
                          <div className="text-sm text-foreground leading-relaxed mt-1 whitespace-pre-wrap break-words">
                            {comment.comment}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <IconMessage className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No Comments Yet</p>
                      <p className="text-xs">Be the first to add a comment!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment Input */}
              <div className="px-3 pb-3 bg-[#ebebeb] dark:bg-[#0a0a0a]">
                <div className="flex gap-3 bg-sidebar rounded-lg p-4 border border-[#cecece99] dark:border-border">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src="" alt="Current User" />
                    <AvatarFallback className="text-xs">CU</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <form onSubmit={handleCommentSubmit}>
                      <Input 
                        placeholder="Write a comment..." 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="text-sm"
                        disabled={isSubmittingComment}
                      />
                    </form>
                  </div>
                  <Button 
                    size="sm" 
                    className="rounded-lg" 
                    onClick={handleCommentSubmit}
                    disabled={!comment.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
