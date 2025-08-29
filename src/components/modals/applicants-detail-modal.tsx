"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconVideo, IconCash, IconClockHour4, IconExternalLink, IconSun, IconMoon, IconAward, IconCode, IconSparkles } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { EditableField, DataFieldRow } from "@/components/ui/fields"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTheme } from "next-themes"
import { useRealtimeApplicants } from "@/hooks/use-realtime-applicants"
import { useRealtimeBpocJobStatus } from "@/hooks/use-realtime-bpoc-job-status"

import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ApplicantsDetailModalProps {
  applicant: Applicant | null
  isOpen: boolean
  onClose: () => void
  onStatusUpdate?: (applicantId: string, jobIndex: number, newStatus: string) => void
  pageContext?: 'talent-pool' | 'bpoc-recruits' | 'applicants-records'
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
  // Skills data from BPOC database
  skills?: string[]
  originalSkillsData?: any
  // Summary from BPOC database
  summary?: string | null
  // Email from BPOC database
  email?: string | null
  // Phone and address from BPOC database
  phone?: string | null
  address?: string | null
  // AI analysis data from BPOC database
  aiAnalysis?: {
    overall_score?: number
    key_strengths?: any[]
    strengths_analysis?: any
    improvements?: any[]
    recommendations?: any[]
    improved_summary?: string
    salary_analysis?: any
    career_path?: any
    section_analysis?: any
  } | null
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

const getStatusColor = (status: string, isJobStatus: boolean = false) => {
  // For job statuses, "passed" should be gray
  if (isJobStatus && status.toLowerCase() === 'passed') {
    return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
  }
  
  switch (status.toLowerCase()) {
    case "rejected":
      return "text-rose-700 dark:text-white border-rose-600/20 bg-rose-50 dark:bg-rose-600/20"
    case "submitted":
      return "text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20"
    case "for verification":
      return "text-teal-700 dark:text-white border-teal-600/20 bg-teal-50 dark:bg-teal-600/20"
    case "verified":
      return "text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20"
    case "initial interview":
      return "text-amber-700 dark:text-white border-amber-600/20 bg-amber-50 dark:bg-amber-600/20"
    case "passed":
      return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
    case "hired":
      return "text-pink-700 dark:text-white border-pink-600/20 bg-pink-50 dark:bg-pink-600/20"
    case "failed":
      return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
    case "withdrawn":
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
    case "qualified":
      return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
    case "final interview":
      return "text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20"
    case "not qualified":
      return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
    default:
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
  }
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "rejected":
      return <IconCircle className="h-4 w-4 fill-rose-500 stroke-none" />
    case "submitted":
      return <IconCircle className="h-4 w-4 fill-blue-500 stroke-none" />
    case "for verification":
      return <IconCircle className="h-4 w-4 fill-teal-500 stroke-none" />
    case "verified":
      return <IconCircle className="h-4 w-4 fill-purple-500 stroke-none" />
    case "initial interview":
      return <IconCircle className="h-4 w-4 fill-amber-500 stroke-none" />
    case "passed":
      return <IconCircle className="h-4 w-4 fill-green-500 stroke-none" />
    case "hired":
      return <IconCircle className="h-4 w-4 fill-pink-500 stroke-none" />
    case "failed":
      return <IconCircle className="h-4 w-4 fill-red-500 stroke-none" />
    case "withdrawn":
      return <IconCircle className="h-4 w-4 fill-gray-500 stroke-none" />
    default:
      return <IconCircle className="h-4 w-4 fill-gray-500 stroke-none" />
  }
}

// Get status display label based on status value
const getStatusLabel = (status: string, isJobStatus: boolean = false) => {
  // For job statuses, "passed" should show as "Set Status"
  if (isJobStatus && status.toLowerCase() === 'passed') {
    return 'Set Status'
  }
  
  const statusOptions = [
    { value: 'rejected', label: 'Reject' },
    { value: 'submitted', label: 'New' },
    { value: 'for verification', label: 'For Verification' },
    { value: 'verified', label: 'Verified' },
    { value: 'initial interview', label: 'Initial Interview' },
    { value: 'passed', label: 'For Sale' },
    { value: 'hired', label: 'Hired' },
    { value: 'failed', label: 'Failed' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'final interview', label: 'Client Interview' },
    { value: 'not qualified', label: 'Not Qualified' }
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

export function ApplicantsDetailModal({ applicant, isOpen, onClose, onStatusUpdate, pageContext = 'bpoc-recruits' }: ApplicantsDetailModalProps) {
  const { theme } = useTheme()
  const [comment, setComment] = useState("")
  const [currentStatus, setCurrentStatus] = useState<string>('')
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const [activeTab, setActiveTab] = useState("information")
  
  // Local state for applicant data to handle realtime updates
  const [localApplicant, setLocalApplicant] = useState<Applicant | null>(null)
  
  // Editable input values
  const [inputValues, setInputValues] = useState<Record<string, string>>({
    shift: '',
    current_salary: '',
    expected_monthly_salary: '',
    video_introduction_url: ''
  })
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({
    shift: '',
    current_salary: '',
    expected_monthly_salary: '',
    video_introduction_url: ''
  })
  
  // Status change tracking
  const [pendingStatusChanges, setPendingStatusChanges] = useState<{
    mainStatus?: string;
    jobStatuses?: Record<number, string>;
  }>({})
  
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [showSaveMessage, setShowSaveMessage] = useState(false)
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!localApplicant) return false
    
    // Check for field changes
    const hasFieldChanges = Object.keys(inputValues).some(fieldName => {
      const currentValue = inputValues[fieldName]
      const originalValue = originalValues[fieldName]
      
      if (fieldName === 'current_salary' || fieldName === 'expected_monthly_salary') {
        // For salary fields, compare numeric values
        const currentNumeric = currentValue === '' ? null : parseFloat(currentValue)
        const originalNumeric = originalValue === '' ? null : parseFloat(originalValue)
        return currentNumeric !== originalNumeric
      } else {
        // For other fields, compare string values
        return currentValue !== originalValue
      }
    })
    
    // Check for status changes
    const hasStatusChanges = pendingStatusChanges.mainStatus !== undefined || 
                           (pendingStatusChanges.jobStatuses && Object.keys(pendingStatusChanges.jobStatuses).length > 0)
    
    return hasFieldChanges || hasStatusChanges
  }, [inputValues, originalValues, localApplicant, pendingStatusChanges])
  
  // Real-time updates for applicant data (separate from BPOC job status updates)
  const { isConnected: isRealtimeConnected } = useRealtimeApplicants({
    onApplicantUpdated: (updatedApplicant, oldApplicant) => {
      console.log('🔄 Real-time: Applicant update received in modal:', { 
        updatedApplicant, 
        oldApplicant, 
        currentApplicantId: localApplicant?.id,
        modalIsOpen: isOpen,
        hasLocalApplicant: !!localApplicant
      })
      
      // Only process updates for the current applicant
      if (localApplicant && updatedApplicant.id === localApplicant.id) {
        console.log('🔄 Real-time: Processing update for current applicant:', updatedApplicant)
        
        // Update the local applicant state with new data
        setLocalApplicant(prevApplicant => {
          if (!prevApplicant) return prevApplicant
          
          const updatedLocalApplicant = { ...prevApplicant }
          
          // Update all fields from the realtime update
          Object.keys(updatedApplicant).forEach(fieldName => {
            if (fieldName in updatedLocalApplicant) {
              (updatedLocalApplicant as any)[fieldName] = updatedApplicant[fieldName]
            }
          })
          
          console.log('🔄 Updated local applicant:', updatedLocalApplicant)
          return updatedLocalApplicant
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
        
        // Update original values to reflect the new data
        setOriginalValues(newValues)
        
        // Update current status if it changed
        if (updatedApplicant.status !== currentStatus) {
          setCurrentStatus(updatedApplicant.status)
        }

      } else {
        console.log('🔄 Real-time: Update not for current applicant, skipping')
      }
    }
  })

  // Real-time updates for BPOC job status changes
  const { isConnected: isBpocJobStatusConnected } = useRealtimeBpocJobStatus({
    onJobStatusUpdate: (jobStatusUpdate) => {
      console.log('🔄 Real-time: BPOC job status update received in modal:', { 
        jobStatusUpdate, 
        currentApplicantId: localApplicant?.id,
        modalIsOpen: isOpen,
        hasLocalApplicant: !!localApplicant
      })
      
      // Only process updates if modal is open and we have a local applicant
      if (isOpen && localApplicant) {
        // Check if this job status update affects the current applicant
        // We need to check if the job_id is in the applicant's job_ids array
        if (localApplicant.job_ids && localApplicant.job_ids.includes(jobStatusUpdate.job_id)) {
          console.log('🔄 Real-time: Job status update affects current applicant, updating local state...')
          
          // Update the local applicant's job statuses array
          setLocalApplicant(prevApplicant => {
            if (!prevApplicant) return prevApplicant
            
            // Find the index of the updated job status
            const jobIndex = prevApplicant.all_job_statuses?.findIndex((_, index) => 
              prevApplicant.job_ids?.[index] === jobStatusUpdate.job_id
            )
            
            if (jobIndex !== undefined && jobIndex !== -1 && prevApplicant.all_job_statuses) {
              const updatedJobStatuses = [...prevApplicant.all_job_statuses]
              updatedJobStatuses[jobIndex] = jobStatusUpdate.new_status
              
              return {
                ...prevApplicant,
                all_job_statuses: updatedJobStatuses
              }
            }
            
            return prevApplicant
          })
        } else {
          console.log('🔄 Real-time: Job status update does not affect current applicant, skipping')
        }
      }
    }
  })

  // Log connection status for debugging
  console.log('🔍 Modal connection status:', { 
    isRealtimeConnected,
    isBpocJobStatusConnected,
    applicantId: localApplicant?.id
  })

  // Update local applicant when prop changes
  useEffect(() => {
    if (applicant) {
      console.log('🔍 Modal Loading Applicant Data:', {
        id: applicant.id,
        status: applicant.status,
        all_job_statuses: applicant.all_job_statuses,
        all_job_titles: applicant.all_job_titles,
        all_companies: applicant.all_companies,
        job_ids: applicant.job_ids,
        bpoc_application_ids: applicant.bpoc_application_ids
      })
      
      setLocalApplicant(applicant)
      // Reset input values when applicant changes
      const initialValues = {
        shift: String(applicant.shift || ''),
        current_salary: String(applicant.current_salary || ''),
        expected_monthly_salary: String(applicant.expected_monthly_salary || ''),
        video_introduction_url: String(applicant.video_introduction_url || '')
      }
      setInputValues(initialValues)
      setOriginalValues(initialValues)
      setCurrentStatus(applicant.status)
      setPendingStatusChanges({}) // Reset pending status changes
      setHasChanges(false)
    }
  }, [applicant])





  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      // No debounced save to clear
    }
  }, [])











  // Handle job click to show job details
  const handleJobClick = async (jobIndex: number) => {
    try {
      // Get job ID from the applicant's job_ids array
      const jobId = localApplicant?.job_ids?.[jobIndex]
      
      if (!jobId) {
        console.error('No job ID found for index:', jobIndex)
        return
      }

      // Debug: Log the mapping to verify accuracy
      console.log('🔍 Job Click Debug:', {
        jobIndex,
        jobId,
        jobTitle: localApplicant?.all_job_titles?.[jobIndex],
        company: localApplicant?.all_companies?.[jobIndex],
        status: localApplicant?.all_job_statuses?.[jobIndex],
        timestamp: localApplicant?.all_job_timestamps?.[jobIndex],
        allJobIds: localApplicant?.job_ids,
        allJobTitles: localApplicant?.all_job_titles,
        allCompanies: localApplicant?.all_companies,
        allJobStatuses: localApplicant?.all_job_statuses
      })

      // Fetch detailed job data from BPOC database first
      const response = await fetch(`/api/bpoc/job-details/${jobId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.statusText}`)
      }

      const jobData = await response.json()
      
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI) {
        // Open Electron window with real job data from the API
        const result = await window.electronAPI.openJobDetailWindow(jobId, jobData)
        if (result.success) {
          console.log('✅ Job detail window opened successfully:', result)
        } else {
          console.error('❌ Failed to open job detail window:', result.error)
        }
      } else {
        // Not in Electron environment - show error or fallback
        console.error('❌ Electron environment not available')
        alert('Job details can only be viewed in the desktop application.')
      }
    } catch (error) {
      console.error('Error handling job click:', error)
      alert('Failed to load job details. Please try again.')
    }
  }

  // Define status options for applicants based on page context
  const getStatusOptions = (): StatusOption[] => {
    if (pageContext === 'talent-pool') {
      // Talent pool page - limited status options
      return [
        { value: 'rejected', label: 'Reject', icon: 'rose', color: 'rose' },
        { value: 'passed', label: 'For Sale', icon: 'green', color: 'green' },
        { value: 'hired', label: 'Hired', icon: 'pink', color: 'pink' },
        { value: 'withdrawn', label: 'Withdrawn', icon: 'gray', color: 'gray' }
      ]
    } else if (pageContext === 'applicants-records') {
      // Applicants records page - full status options including Hired
      return [
        { value: 'rejected', label: 'Reject', icon: 'rose', color: 'rose' },
        { value: 'submitted', label: 'New', icon: 'blue', color: 'blue' },
        { value: 'for verification', label: 'For Verification', icon: 'teal', color: 'teal' },
        { value: 'verified', label: 'Verified', icon: 'purple', color: 'purple' },
        { value: 'initial interview', label: 'Initial Interview', icon: 'amber', color: 'amber' },
        { value: 'passed', label: 'For Sale', icon: 'green', color: 'green' },
        { value: 'hired', label: 'Hired', icon: 'pink', color: 'pink' },
        { value: 'failed', label: 'Failed', icon: 'red', color: 'red' },
        { value: 'withdrawn', label: 'Withdrawn', icon: 'gray', color: 'gray' }
      ]
    } else {
      // BPOC recruits page - full status options (NO Hired status)
      return [
        { value: 'rejected', label: 'Reject', icon: 'rose', color: 'rose' },
        { value: 'submitted', label: 'New', icon: 'blue', color: 'blue' },
        { value: 'for verification', label: 'For Verification', icon: 'teal', color: 'teal' },
        { value: 'verified', label: 'Verified', icon: 'purple', color: 'purple' },
        { value: 'initial interview', label: 'Initial Interview', icon: 'amber', color: 'amber' },
        { value: 'passed', label: 'For Sale', icon: 'green', color: 'green' },
        { value: 'failed', label: 'Failed', icon: 'red', color: 'red' },
        { value: 'withdrawn', label: 'Withdrawn', icon: 'gray', color: 'gray' }
      ]
    }
  }

  React.useEffect(() => {
    // Set status options when component mounts
    setStatusOptions(getStatusOptions())
  }, [])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '0px'
      document.documentElement.style.overflow = 'hidden'
      document.body.classList.add('overflow-hidden')
      document.body.style.cssText += '; overflow: hidden !important; position: fixed; width: 100%;'
    } else {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = ''
      document.documentElement.style.overflow = ''
      document.body.classList.remove('overflow-hidden')
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.cssText = document.body.style.cssText.replace(/overflow:\s*hidden\s*!important;?\s*/g, '')
    }
  }, [isOpen])

  // Cleanup function to restore scroll when component unmounts
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = ''
      document.documentElement.style.overflow = ''
      document.body.classList.remove('overflow-hidden')
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.cssText = document.body.style.cssText.replace(/overflow:\s*hidden\s*!important;?\s*/g, '')
    }
  }, [])

  // TODO: Implement comment fetching when API is ready
  const fetchComments = async () => {
    // Placeholder for future implementation
    setIsLoadingComments(false)
    setComments([])
  }

  // Handle status updates - store locally, don't update database yet
  const handleStatusUpdate = (newStatus: string) => {
    console.log(`🔄 Storing status change locally:`, newStatus);
    
    // Store the pending status change
    setPendingStatusChanges(prev => ({
      ...prev,
      mainStatus: newStatus
    }))
    
    // Update local state for immediate UI feedback
    setCurrentStatus(newStatus)
    
    // Update local applicant state for immediate feedback
    if (localApplicant) {
      setLocalApplicant(prev => prev ? { ...prev, status: newStatus } : null)
    }
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
      
      // Also update the local applicant state for instant feedback
      if (localApplicant) {
        setLocalApplicant(prev => ({
          ...prev!,
          [fieldName]: numericValue
        }))
      }
    } else {
      // For non-salary fields, allow any input
    setInputValues(prev => ({ ...prev, [fieldName]: value }))
      
      // Also update the local applicant state for instant feedback
      if (localApplicant) {
        setLocalApplicant(prev => ({
          ...prev!,
          [fieldName]: value
        }))
      }
    }
    
    // No auto-save while typing - only save on blur or Enter
  }

  // Handle saving input values



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

  if (!localApplicant) return null

  const createdDate = formatDate(localApplicant.created_at)
  const updatedDate = localApplicant.updated_at && localApplicant.updated_at !== localApplicant.created_at ? formatDate(localApplicant.updated_at) : null





  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !localApplicant || isSubmittingComment) return
    
    // TODO: Implement comment submission when API is ready
    setIsSubmittingComment(true)
    setTimeout(() => {
      setComment("")
      setIsSubmittingComment(false)
    }, 1000)
  }



  // Auto-save function that can be called before closing
  const autoSaveBeforeClose = async (): Promise<boolean> => {
    if (!localApplicant || !hasUnsavedChanges) {
      return true // No need to save, can close
    }

    try {
      console.log('🔄 Auto-saving changes before closing...')
      setIsSaving(true)
      
      // Get all fields that have been changed
      const changedFields: Record<string, string> = {}
      Object.keys(inputValues).forEach(fieldName => {
        const currentValue = inputValues[fieldName]
        const originalValue = originalValues[fieldName]
        
        if (fieldName === 'current_salary' || fieldName === 'expected_monthly_salary') {
          // For salary fields, compare numeric values
          const currentNumeric = currentValue === '' ? null : parseFloat(currentValue)
          const originalNumeric = originalValue === '' ? null : parseFloat(originalValue)
          if (currentNumeric !== originalNumeric) {
            changedFields[fieldName] = currentValue
          }
        } else {
          // For other fields, compare string values
          if (currentValue !== originalValue) {
            changedFields[fieldName] = currentValue
          }
        }
      })
      
      // Convert salary fields to numbers for the API
      const processedUpdates: Record<string, any> = {}
      Object.entries(changedFields).forEach(([key, value]) => {
        if (key === 'current_salary' || key === 'expected_monthly_salary') {
          // Convert empty string to null, otherwise to number
          const numValue = value === '' ? null : parseFloat(value)
          processedUpdates[key] = numValue
        } else {
          processedUpdates[key] = value
        }
      })
      
      // Handle status updates
      if (pendingStatusChanges.mainStatus) {
        console.log('🔄 Updating main status to:', pendingStatusChanges.mainStatus)
        
        // Update main database status
        const statusResponse = await fetch('/api/bpoc', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: localApplicant.id,
            status: pendingStatusChanges.mainStatus,
            previousStatus: localApplicant.status
          })
        })
        
        if (!statusResponse.ok) {
          throw new Error(`Failed to update main status: ${statusResponse.statusText}`)
        }
        
        console.log('✅ Main status updated successfully')
        
        // Call parent callback if provided
        if (onStatusUpdate) {
          onStatusUpdate(localApplicant.id, 0, pendingStatusChanges.mainStatus)
        }
        
        // Refresh applicant data to get updated status
        try {
          console.log('🔄 Refreshing applicant data after main status update...')
          const refreshResponse = await fetch(`/api/bpoc/${localApplicant.id}`)
          if (refreshResponse.ok) {
            const refreshedData = await refreshResponse.json()
            if (refreshedData.applicant) {
              const refreshedApplicant = refreshedData.applicant
              console.log('✅ Applicant data refreshed:', refreshedApplicant)
              
              // Update local applicant with refreshed data
              setLocalApplicant(prev => prev ? {
                ...prev,
                status: refreshedApplicant.status,
                all_job_statuses: refreshedApplicant.all_job_statuses,
                all_job_titles: refreshedApplicant.all_job_titles,
                all_companies: refreshedApplicant.all_companies,
                all_job_timestamps: refreshedApplicant.all_job_timestamps
              } : null)
              
              // Update current status
              setCurrentStatus(refreshedApplicant.status)
            }
          }
        } catch (refreshError) {
          console.warn('⚠️ Failed to refresh applicant data:', refreshError)
        }
      }
      
      // Handle job status updates
      if (pendingStatusChanges.jobStatuses && Object.keys(pendingStatusChanges.jobStatuses).length > 0) {
        console.log('🔄 Updating job statuses:', pendingStatusChanges.jobStatuses)
        
        // Update each job status
        for (const [jobIndex, newStatus] of Object.entries(pendingStatusChanges.jobStatuses)) {
          const response = await fetch('/api/bpoc/update-job-status/', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              applicantId: localApplicant.id,
              jobIndex: parseInt(jobIndex),
              newStatus: newStatus
            })
          })
          
          if (!response.ok) {
            throw new Error(`Failed to update job ${jobIndex} status: ${response.statusText}`)
          }
          
          console.log(`✅ Job ${jobIndex} status updated successfully`)
          
          // Call parent callback if provided
          if (onStatusUpdate) {
            onStatusUpdate(localApplicant.id, parseInt(jobIndex), newStatus)
          }
          
          // Refresh applicant data to get updated job statuses
          try {
            console.log('🔄 Refreshing applicant data after job status update...')
            const refreshResponse = await fetch(`/api/bpoc/${localApplicant.id}`)
            if (refreshResponse.ok) {
              const refreshedData = await refreshResponse.json()
              if (refreshedData.applicant) {
                const refreshedApplicant = refreshedData.applicant
                console.log('✅ Applicant data refreshed:', refreshedApplicant)
                
                // Update local applicant with refreshed data
                setLocalApplicant(prev => prev ? {
                  ...prev,
                  all_job_statuses: refreshedApplicant.all_job_statuses,
                  all_job_titles: refreshedApplicant.all_job_titles,
                  all_companies: refreshedApplicant.all_companies,
                  all_job_timestamps: refreshedApplicant.all_job_timestamps
                } : null)
              }
            }
          } catch (refreshError) {
            console.warn('⚠️ Failed to refresh applicant data:', refreshError)
          }
        }
      }
      
      // Call API to update multiple fields at once (only if there are field changes)
      if (Object.keys(processedUpdates).length > 0) {
        const response = await fetch(`/api/bpoc`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: localApplicant.id,
            ...processedUpdates
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to update fields: ${response.statusText}`)
        }

        const result = await response.json()
        console.log(`✅ Field updates completed successfully:`, result)
        
        // Update local applicant with the complete data returned from the API
        if (result.applicant) {
          console.log('🔄 Updating local applicant with refreshed data from API')
          setLocalApplicant(prev => prev ? {
            ...prev,
            ...result.applicant
          } : null)
          
          // Update original values after successful save
          setOriginalValues(prev => ({
            ...prev,
            ...changedFields
          }))
        } else {
          // Fallback: just update original values
          setOriginalValues(prev => ({
            ...prev,
            ...changedFields
          }))
        }
      }
      
      // Clear pending status changes after successful save
      setPendingStatusChanges({})
      
      return true
    } catch (error) {
      console.error(`❌ Auto-save failed:`, error)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Modified close handler with auto-save
  const handleClose = async () => {
    console.log('🔒 handleClose called:', { 
      applicant: localApplicant?.id, 
      hasUnsavedChanges, 
      isOpen
    })
    
    if (localApplicant && hasUnsavedChanges) {
      // Auto-save changes before closing
      try {
        console.log('🔄 Auto-saving changes before close...')
        const saveSuccess = await autoSaveBeforeClose()
        
        if (saveSuccess) {
          console.log('✅ Changes saved successfully, closing modal')
          onClose() // Call the original onClose prop
        } else {
          // Don't close if save failed
          console.error('❌ Failed to save changes')
          alert('Failed to save changes. Please try again.')
          return
        }
      } catch (error) {
        // Don't close if save failed
        console.error('❌ Failed to save changes:', error)
        alert('Failed to save changes. Please try again.')
        return
      }
    } else {
      // No unsaved changes, just close
      console.log('🔒 Closing without auto-save - no changes detected')
      onClose() // Call the original onClose prop
    }
  }





  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={handleClose}>
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
                  <Badge className="text-xs h-6 flex items-center rounded-[6px]">
                    Applicant
                  </Badge>

                </div>
              </div>

              {/* Applicant Header */}
              <div className="px-6 py-5">
                {/* Avatar and Applicant Name */}
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={localApplicant.profile_picture || "/avatars/shadcn.svg"} alt="Applicant Avatar" />
                    <AvatarFallback className="text-2xl">
                      {localApplicant.first_name && localApplicant.last_name 
                        ? `${localApplicant.first_name[0]}${localApplicant.last_name[0]}`
                        : String(localApplicant.user_id).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-2xl font-semibold">
                      {localApplicant.full_name || (localApplicant.first_name && localApplicant.last_name 
                        ? `${localApplicant.first_name} ${localApplicant.last_name}`
                        : `User ${localApplicant.user_id}`)}
                    </div>
                    <p className="text-base text-muted-foreground">
                      {localApplicant.job_title || 'No Job Title'}
                      {localApplicant.company_name && ` • ${localApplicant.company_name}`}
                    </p>
                  </div>
                </div>
                
                {/* Applicant Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Email */}
                  {localApplicant.email && (
                    <div className="flex items-center gap-2">
                      <IconMail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{localApplicant.email}</span>
                    </div>
                  )}
                  
                  {/* Phone */}
                  {localApplicant.phone && (
                    <div className="flex items-center gap-2">
                      <IconPhone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{localApplicant.phone}</span>
                    </div>
                  )}
                  
                  {/* Address */}
                  {localApplicant.address && (
                    <div className="flex items-center gap-2">
                      <IconMapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium">{localApplicant.address}</span>
                    </div>
                  )}
                  
                  {/* Status - Moved to last */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(currentStatus || localApplicant.status)}
                    <span className="text-muted-foreground">Status:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(currentStatus || localApplicant.status)} px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center`}
                        >
                          {getStatusLabel(currentStatus || localApplicant.status)}
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2">
                        <div className="space-y-1">
                          {statusOptions.map((option) => {
                            const isCurrentStatus = (currentStatus || localApplicant.status) === option.value;
                            return (
                              <div 
                                key={option.value}
                                className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                  isCurrentStatus 
                                    ? 'bg-primary/10 text-primary border border-primary/20 cursor-default' 
                                    : 'hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground cursor-pointer'
                                }`}
                                onClick={isCurrentStatus ? undefined : () => handleStatusUpdate(option.value)}
                              >
                                {option.icon === 'rose' ? (
                                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                ) : option.icon === 'blue' ? (
                                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                ) : option.icon === 'teal' ? (
                                  <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                                ) : option.icon === 'purple' ? (
                                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                ) : option.icon === 'amber' ? (
                                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                ) : option.icon === 'green' ? (
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                ) : option.icon === 'pink' ? (
                                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                                ) : option.icon === 'red' ? (
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                ) : option.icon === 'gray' ? (
                                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                                ) : (
                                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                                )}
                                <span className="text-sm font-medium">{option.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  


                </div>
              </div>
              
              <div className="px-6">
                <Separator />
              </div>

              {/* Applicant Details with Tabs */}
              <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                  {/* Job Application Section - Always Visible */}
                  {/* 
                    CRITICAL: The index here MUST correspond to localApplicant.job_ids[index]
                    The arrays all_job_titles, all_companies, all_job_statuses, all_job_timestamps
                    are mapped 1:1 with the job_ids array from the main database.
                  */}
                  <div className="flex flex-col mb-6">
                    <div className="flex items-center justify-between min-h-[40px]">
                      <h3 className="text-lg font-medium text-muted-foreground">Job Application</h3>
                    </div>
                    <div className="rounded-lg border p-6 shadow-sm">
                      <div className="space-y-2">
                        {localApplicant.all_job_titles && localApplicant.all_job_titles.length > 0 ? (
                          <>
                              {localApplicant.all_job_titles.map((jobTitle, index) => (
                              <div 
                                key={index} 
                                className="rounded-lg p-4 border bg-card cursor-pointer hover:bg-accent/50 transition-colors relative"
                                onClick={() => handleJobClick(index)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1">
                                    <h4 className="font-medium text-foreground">
                                      {jobTitle}
                                    </h4>
                                  </div>
                                  
                                  {/* Applied Date and Time - Top Right */}
                                  {localApplicant.all_job_timestamps && localApplicant.all_job_timestamps[index] && (
                                    <div className="flex items-center gap-1 text-right flex-shrink-0">
                                      <IconCalendar className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-muted-foreground text-xs">
                                        {new Date(localApplicant.all_job_timestamps[index]).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric',
                                          timeZone: 'Asia/Manila'
                                        })}
                                      </span>
                                      <span className="text-muted-foreground/70 text-xs">•</span>
                                      <IconClock className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-muted-foreground text-xs">
                                        {new Date(localApplicant.all_job_timestamps[index]).toLocaleTimeString('en-US', { 
                                          hour: '2-digit', 
                                          minute: '2-digit', 
                                          hour12: true, 
                                          timeZone: 'Asia/Manila'
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Company Name and Status Badge Container - Only show when there's company data or in talent pool */}
                                {(() => {
                                  const hasCompany = localApplicant?.all_companies && localApplicant.all_companies[index];
                                  const isTalentPool = pageContext === 'talent-pool';
                                  
                                  // Only show container if there's company data OR we're in talent pool (for status editing)
                                  if (!hasCompany && !isTalentPool) {
                                    return null;
                                  }
                                  
                                  return (
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        {hasCompany ? (
                                          <p className="text-sm text-muted-foreground">{localApplicant?.all_companies?.[index]}</p>
                                        ) : (
                                          // Only show placeholder in talent pool when we might add company data
                                          isTalentPool ? <div className="h-5"></div> : null
                                        )}
                                      </div>
                                      
                                      {/* Status Badge - Right side of company container */}
                                      {(() => {
                                        // Only show job statuses when in talent pool page
                                        if (!isTalentPool) {
                                          return null;
                                        }
                                        
                                        const status = localApplicant.all_job_statuses?.[index] || localApplicant.status;
                                        // Only show statuses that can be edited in the popover
                                        const showStatus = ['not qualified', 'qualified', 'final interview'].includes(status.toLowerCase());
                                        
                                        // Debug: Log status for each job
                                        console.log(`🔍 Job ${index} Status Debug:`, {
                                          jobIndex: index,
                                          jobTitle: localApplicant.all_job_titles?.[index],
                                          company: localApplicant.all_companies?.[index],
                                          jobStatus: localApplicant.all_job_statuses?.[index],
                                          fallbackStatus: localApplicant.status,
                                          finalStatus: status,
                                          showStatus,
                                          pageContext
                                        })
                                        
                                        if (showStatus) {
                                          return (
                                            <div className="flex-shrink-0">
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <Badge 
                                                    variant="outline" 
                                                    className={`${getStatusColor(status, true)} px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center mt-1`}
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                    }}
                                                  >
                                                    {getStatusLabel(status, true)}
                                                  </Badge>
                                                </PopoverTrigger>
                                                                                              <PopoverContent className="w-48 p-2" align="end" side="top" sideOffset={4}>
                                                <div className="space-y-1">
                                                  {['not qualified', 'qualified', 'final interview'].map((statusOption) => (
                                                  <div 
                                                    key={statusOption}
                                                    className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                                      status.toLowerCase() === statusOption 
                                                        ? 'bg-primary/10 text-primary border border-primary/20 pointer-events-none cursor-default' 
                                                        : 'cursor-pointer hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground'
                                                    }`}
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      console.log(`🔄 Storing job ${index} status change locally:`, statusOption);
                                                      
                                                      // Store the pending job status change
                                                      setPendingStatusChanges(prev => ({
                                                        ...prev,
                                                        jobStatuses: {
                                                          ...prev.jobStatuses,
                                                          [index]: statusOption
                                                        }
                                                      }))
                                                      
                                                      // Update local applicant state for immediate feedback
                                                      if (localApplicant) {
                                                        const updatedJobStatuses = [...(localApplicant.all_job_statuses || [])]
                                                        updatedJobStatuses[index] = statusOption
                                                        setLocalApplicant(prev => prev ? {
                                                          ...prev,
                                                          all_job_statuses: updatedJobStatuses
                                                        } : null)
                                                      }
                                                    }}
                                                  >
                                                    {/* Colored status indicator */}
                                                    <div className={`w-3 h-3 rounded-full ${
                                                      statusOption === 'qualified' ? 'bg-green-500' :
                                                      statusOption === 'final interview' ? 'bg-blue-500' :
                                                      statusOption === 'not qualified' ? 'bg-red-500' :
                                                      'bg-gray-500'
                                                    }`}></div>
                                                    <span className="text-sm font-medium">{getStatusLabel(statusOption)}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </PopoverContent>
                                          </Popover>
                                        </div>
                                      );
                                    } else {
                                      // Show "Set Status" button when no status is set
                                      return (
                                        <div className="flex-shrink-0">
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Badge 
                                                variant="outline" 
                                                className={`text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20 px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center border-dashed mt-1`}
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                }}
                                              >
                                                Set Status
                                              </Badge>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-48 p-2" align="end" side="top" sideOffset={4}>
                                              <div className="space-y-1">
                                                {['not qualified', 'qualified', 'final interview'].map((statusOption) => (
                                                <div 
                                                  key={statusOption}
                                                  className="flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 cursor-pointer hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground"
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    console.log(`🔄 Setting initial job ${index} status:`, statusOption);
                                                    
                                                    // Store the pending job status change
                                                    setPendingStatusChanges(prev => ({
                                                      ...prev,
                                                      jobStatuses: {
                                                        ...prev.jobStatuses,
                                                        [index]: statusOption
                                                      }
                                                    }))
                                                    
                                                    // Update local applicant state for immediate feedback
                                                    if (localApplicant) {
                                                      const updatedJobStatuses = [...(localApplicant.all_job_statuses || [])]
                                                      updatedJobStatuses[index] = statusOption
                                                      setLocalApplicant(prev => prev ? {
                                                        ...prev,
                                                        all_job_statuses: updatedJobStatuses
                                                      } : null)
                                                    }
                                                  }}
                                                >
                                                  {/* Colored status indicator */}
                                                  <div className={`w-3 h-3 rounded-full ${
                                                    statusOption === 'qualified' ? 'bg-green-500' :
                                                    statusOption === 'final interview' ? 'bg-blue-500' :
                                                    statusOption === 'not qualified' ? 'bg-red-500' :
                                                    'bg-gray-500'
                                                  }`}></div>
                                                  <span className="text-sm font-medium">{getStatusLabel(statusOption)}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                    );
                                  }
                                    
                                  return null;
                                  })()}
                                    </div>
                                  );
                                })()}
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <IconBriefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No job applications found</p>
                            <p className="text-xs">This applicant hasn't applied for any specific positions yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 flex-shrink-0">
                    <div className={`rounded-xl p-1 w-fit ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-gray-100/80 border border-gray-200'
                    }`}>
                      <AnimatedTabs
                        tabs={[
                          { title: "Summary", value: "information" },
                          { title: "AI Analysis", value: "ai-analysis" }
                        ]}
                        containerClassName="grid grid-cols-2 w-fit"
                        activeTabClassName={`rounded-xl ${
                          theme === 'dark' 
                            ? 'bg-zinc-800' 
                            : 'bg-[#ebebeb]'
                        }`}
                        onTabChange={(tab) => setActiveTab(tab.value)}
                      />
                    </div>
                  </div>

                  {/* Information Tab */}
                  <TabsContent value="information" className="space-y-6">
                                          {/* Bio Section */}
                      <div>
                        <div className="flex items-center justify-between min-h-[40px]">
                          <h3 className="text-lg font-medium text-muted-foreground">Bio</h3>
                        </div>
                        <div className="rounded-lg p-6 text-sm leading-relaxed border shadow-sm">
                          {localApplicant.summary || localApplicant.details || "No summary provided."}
                        </div>
                      </div>

                      {/* Additional Information Section */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between min-h-[40px]">
                          <h3 className="text-lg font-medium text-muted-foreground">Additional Information</h3>
                        </div>
                        <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                          {/* Shift */}
                          <DataFieldRow
                            icon={<IconClockHour4 className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                            label="Shift"
                            fieldName="shift"
                            value={inputValues.shift || ''}
                            onSave={() => {}}
                            customInput={
                              <Popover>
                                <PopoverTrigger asChild>
                                  <div 
                                    className="h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center"
                                    style={{ backgroundColor: 'transparent' }}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
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
                            }
                          />
                          
                          {/* Current Salary */}
                          <DataFieldRow
                            icon={<IconCash className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                            label="Current Salary"
                            fieldName="current_salary"
                            value={formatNumber(inputValues.current_salary)}
                            onSave={handleInputChange}
                          />
                          
                          {/* Expected Salary */}
                          <DataFieldRow
                            icon={<IconCash className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                            label="Expected Salary"
                            fieldName="expected_monthly_salary"
                            value={formatNumber(inputValues.expected_monthly_salary)}
                            onSave={handleInputChange}
                          />
                          
                          {/* Video Introduction */}
                          <DataFieldRow
                            icon={<IconVideo className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                            label="Video Introduction"
                            fieldName="video_introduction_url"
                            value={inputValues.video_introduction_url || ''}
                            onSave={handleInputChange}
                            isLast={true}
                          />
                        </div>
                      </div>

                      {/* Skills and BPOC Section - 2 Columns */}
                      <div className="mt-8 grid grid-cols-2 gap-6">
                        {/* Skills Section */}
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between min-h-[40px]">
                            <h3 className="text-lg font-medium text-muted-foreground">Skills</h3>
                          </div>
                          <div className="rounded-lg p-6 border flex-1 shadow-sm">
                            <div className="space-y-4">
                              {/* Dynamic Skills Categories */}
                              {(() => {
                                // First priority: Check if we have structured skills data with categories
                                const originalSkillsData = (localApplicant as any).originalSkillsData
                                if (originalSkillsData && typeof originalSkillsData === 'object' && !Array.isArray(originalSkillsData)) {
                                  // Check if we have a skills object with categories (like your sample data)
                                  if (originalSkillsData.skills && typeof originalSkillsData.skills === 'object') {
                                    const skillsCategories = originalSkillsData.skills
                                    const validCategories = Object.keys(skillsCategories).filter(cat => 
                                      Array.isArray(skillsCategories[cat]) && skillsCategories[cat].length > 0
                                  )
                                  
                                  if (validCategories.length > 0) {
                                    return validCategories.map((category) => (
                                      <div key={category}>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                   {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {skillsCategories[category].map((skill: string, index: number) => (
                                            <Badge key={index} className="text-xs bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border-0">
                                              {skill}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    ))
                                  }
                                }
                                
                                  // Fallback: Look for individual skills arrays
                                  const skillsData = originalSkillsData.skills || originalSkillsData.technical_skills || originalSkillsData.soft_skills || originalSkillsData.languages
                                  
                                  if (skillsData && Array.isArray(skillsData) && skillsData.length > 0) {
                                    return (
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {skillsData.map((skill: string, index: number) => (
                                            <Badge key={index} className="text-xs bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border-0">
                                              {skill}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )
                                  }
                                  
                                  // If no skills array found, try to find any array data that might be skills
                                  const arrayKeys = Object.keys(originalSkillsData).filter(key => 
                                    Array.isArray(originalSkillsData[key]) && 
                                    originalSkillsData[key].length > 0 &&
                                    typeof originalSkillsData[key][0] === 'string'
                                  )
                                  
                                  if (arrayKeys.length > 0) {
                                    return arrayKeys.map((key) => (
                                      <div key={key}>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                          {originalSkillsData[key].map((skill: string, index: number) => (
                                            <Badge key={index} className="text-xs bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border-0">
                                              {skill}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    ))
                                  }
                                }
                                
                                // Second priority: Use the extracted skills array if no structured data found
                                if (Array.isArray(localApplicant.skills) && localApplicant.skills.length > 0) {
                                  return (
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground mb-2">All Skills</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {localApplicant.skills.map((skill: string, index: number) => (
                                          <Badge key={index} className="text-xs bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border-0">
                                            {skill}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                }
                                
                                // Applied Positions fallback
                                if (localApplicant.all_job_titles && localApplicant.all_job_titles.length > 0) {
                                  return (
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Applied Positions</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {localApplicant.all_job_titles.map((jobTitle, index) => (
                                          <Badge key={index} className="text-xs bg-gray-200 text-black dark:bg-zinc-800 dark:text-white border-0">
                                            {jobTitle}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                }
                                
                                // No skills fallback
                                return (
                                  <span className="text-sm text-muted-foreground">No skills data available</span>
                                )
                              })()}
                            </div>
                          </div>
                        </div>

                                                {/* Resume Score Container */}
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between min-h-[40px]">
                            <h3 className="text-lg font-medium text-muted-foreground">Resume Score</h3>
                          </div>
                          <div className="rounded-lg p-6 border flex-1 shadow-sm">
                            {/* Overall Resume Score with View Resume Button */}
                            {localApplicant.aiAnalysis?.overall_score ? (
                              <div className="space-y-4">
                                <div className="text-3xl font-bold text-foreground">
                                  {localApplicant.aiAnalysis.overall_score}/100
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  AI-powered resume quality assessment
                                </p>
                                
                                {/* View Resume Button */}
                                {localApplicant.resume_slug && (
                                  <div className="mt-4">
                                    <Button 
                                      onClick={() => window.open(`https://www.bpoc.io/${localApplicant.resume_slug}`, '_blank')}
                                      className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white border-0"
                                      size="sm"
                                    >
                                      <IconFile className="h-4 w-4 mr-2" />
                                      View Resume
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                <p className="text-sm">No resume score available</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Work Experience, Education, and Projects Section */}
                      <div className="mt-8 space-y-6">
                                                {/* Work Experience Section */}
                        {(() => {
                          const originalSkillsData = (localApplicant as any).originalSkillsData
                          if (originalSkillsData?.experience && Array.isArray(originalSkillsData.experience) && originalSkillsData.experience.length > 0) {
                            return (
                              <div>
                                <div className="flex items-center justify-between min-h-[40px]">
                            <h3 className="text-lg font-medium text-muted-foreground">Work Experience</h3>
                          </div>
                                <div className="rounded-lg p-6 border flex-1 shadow-sm">
                                  <div>
                                    {originalSkillsData.experience.map((exp: any, index: number) => (
                                      <div key={index}>
                                        <div className="space-y-2">
                                          <div className="flex items-start justify-between">
                                            <div>
                                              <h4 className="font-medium text-foreground">{exp.title}</h4>
                                              <p className="text-sm text-muted-foreground">{exp.company}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                              {exp.duration}
                                            </Badge>
                                          </div>
                                          {exp.achievements && Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                                            <div className="mt-3">
                                              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                <IconAward className="h-4 w-4" />
                                                Key Achievements:
                                              </p>
                                              <ul className="space-y-1">
                                                {exp.achievements.map((achievement: string, achievementIndex: number) => (
                                                  <li key={achievementIndex} className="text-sm text-foreground flex items-center gap-2">
                                                    <span className="text-primary flex-shrink-0">•</span>
                                                    <span>{achievement}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                        {index < originalSkillsData.experience.length - 1 && (
                                          <div className="mt-4 pt-4 border-t border-border/50" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        })()}

                        {/* Education Section */}
                        {(() => {
                          const originalSkillsData = (localApplicant as any).originalSkillsData
                          if (originalSkillsData?.education && Array.isArray(originalSkillsData.education) && originalSkillsData.education.length > 0) {
                            return (
                              <div>
                                <div className="flex items-center justify-between min-h-[40px]">
                            <h3 className="text-lg font-medium text-muted-foreground">Education</h3>
                          </div>
                                <div className="rounded-lg p-6 border flex-1 shadow-sm">
                                  <div>
                                    {originalSkillsData.education.map((edu: any, index: number) => (
                                      <div key={index}>
                                        <div className="space-y-2">
                                          <div className="flex items-start justify-between">
                                            <div>
                                              <h4 className="font-medium text-foreground">{edu.degree}</h4>
                                              <p className="text-sm text-muted-foreground">{edu.institution}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                              {edu.year}
                                            </Badge>
                                          </div>
                                          {edu.highlights && Array.isArray(edu.highlights) && edu.highlights.length > 0 && (
                                            <div className="mt-3">
                                              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                <IconSparkles className="h-4 w-4" />
                                                Highlights:
                                              </p>
                                              <ul className="space-y-1">
                                                {edu.highlights.map((highlight: string, highlightIndex: number) => (
                                                  <li key={highlightIndex} className="text-sm text-foreground flex items-center gap-2">
                                                    <span className="text-primary flex-shrink-0">•</span>
                                                    <span>{highlight}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                        {index < originalSkillsData.education.length - 1 && (
                                          <div className="mt-4 pt-4 border-t border-border/50" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        })()}

                        {/* Projects Section */}
                        {(() => {
                          const originalSkillsData = (localApplicant as any).originalSkillsData
                          if (originalSkillsData?.projects && Array.isArray(originalSkillsData.projects) && originalSkillsData.projects.length > 0) {
                            return (
                              <div>
                                <div className="flex items-center justify-between min-h-[40px]">
                            <h3 className="text-lg font-medium text-muted-foreground">Projects</h3>
                          </div>
                                <div className="rounded-lg p-6 border flex-1 shadow-sm">
                                  <div>
                                    {originalSkillsData.projects.map((project: any, index: number) => (
                                      <div key={index}>
                                        <div className="space-y-2">
                                          <div className="mb-2">
                                            <h4 className="font-medium text-foreground">{project.title}</h4>
                                            {project.description && (
                                              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                                            )}
                                          </div>
                                          {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                                            <div className="mt-3">
                                              <p className="text-sm font-medium text-muted-foreground mb-2">Technologies:</p>
                                              <div className="flex flex-wrap gap-2">
                                                {project.technologies.map((tech: string, techIndex: number) => (
                                                  <Badge key={techIndex} variant="secondary" className="text-xs">
                                                    {tech}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          {project.impact && (
                                            <div className="mt-3">
                                              <p className="text-sm font-medium text-muted-foreground mb-2">Impact:</p>
                                              <p className="text-sm text-foreground">{project.impact}</p>
                                            </div>
                                          )}
                                        </div>
                                        {index < originalSkillsData.projects.length - 1 && (
                                          <div className="mt-4 pt-4 border-t border-border/50" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>

                  {/* Additional Details Section */}
                  {localApplicant.details && (
                    <div>
                                              <div className="flex items-center justify-between min-h-[40px]">
                          <h3 className="text-lg font-medium text-muted-foreground">Additional Details</h3>
                        </div>
                      <div className="rounded-lg p-6 text-sm leading-relaxed border border-[#cecece99] dark:border-border">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">
                          {localApplicant.details}
                        </p>
                      </div>
                    </div>
                  )}
                  </TabsContent>

                  {/* AI Analysis Tab */}
                  <TabsContent value="ai-analysis" className="space-y-6 overflow-y-auto flex-1 min-h-0">
                    {(() => {
                      // Debug: Check what data we have
                      console.log('🔍 AI Analysis Debug:', { 
                        applicantId: localApplicant?.id, 
                        hasAiAnalysis: !!localApplicant?.aiAnalysis, 
                        aiAnalysisData: localApplicant?.aiAnalysis 
                      })
                      return null
                    })()}
                    
                    {!localApplicant?.aiAnalysis ? (
                      // No analysis state
                      <div className="flex flex-col h-full">
                        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 flex-1 flex items-center justify-center">
                          <div>
                            <p className="text-sm font-medium">No AI Analysis</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Analysis results display
                      <div className="space-y-6">
                                                

                        {/* All Analysis Cards in Single Grid */}
                        {(() => {
                          const strengths = localApplicant.aiAnalysis?.strengths_analysis
                          if (!strengths) return null
                          
                          const categories = [
                            { key: 'topStrengths', label: 'Top Strengths', icon: '⭐' },
                            { key: 'coreStrengths', label: 'Core Strengths', icon: '💪' },
                            { key: 'technicalStrengths', label: 'Technical Strengths', icon: '⚙️' },
                            { key: 'achievements', label: 'Notable Achievements', icon: '🏆' },
                            { key: 'marketAdvantage', label: 'Market Advantages', icon: '📈' },
                            { key: 'uniqueValue', label: 'Unique Value Proposition', icon: '💎' },
                            { key: 'areasToHighlight', label: 'Areas to Highlight', icon: '✨' }
                          ]
                          
                          // Get data for special cards
                          const topStrengthsData = strengths.topStrengths
                          const keyStrengthsData = localApplicant.aiAnalysis?.key_strengths
                          const aiEnhancedSummary = localApplicant.aiAnalysis?.improved_summary
                          
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                              {/* AI-Enhanced Summary Card - First, spans full width */}
                                {aiEnhancedSummary && (
                                  <Card className="h-full col-span-2 border bg-transparent">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-base text-muted-foreground flex items-center gap-2">
                                        <span>✍️</span>
                                        AI-Enhanced Summary
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-foreground/90">
                                      <p className="leading-relaxed">{aiEnhancedSummary}</p>
                                    </CardContent>
                                  </Card>
                                )}
                                
                                {/* Top Strengths Card */}
                                {topStrengthsData && (
                                  <Card className="h-full border bg-transparent">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-base text-muted-foreground flex items-center gap-2">
                                        <span>⭐</span>
                                        Top Strengths
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-foreground/90">
                                      {Array.isArray(topStrengthsData) ? (
                                        <ol className="list-decimal ml-4 space-y-1">
                                          {topStrengthsData.map((item: any, idx: number) => (
                                            <li key={idx}>
                                              {typeof item === 'string' ? item : item?.title || item?.name || item?.description || 'Item'}
                                            </li>
                                          ))}
                                        </ol>
                                      ) : typeof topStrengthsData === 'string' ? (
                                        <ol className="list-decimal ml-4 space-y-1">
                                          <li>{topStrengthsData}</li>
                                        </ol>
                                      ) : (
                                        <ol className="list-decimal ml-4 space-y-1">
                                          <li>{JSON.stringify(topStrengthsData)}</li>
                                        </ol>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}
                                
                                {/* Key Strengths Card */}
                                {Array.isArray(keyStrengthsData) && keyStrengthsData.length > 0 && (
                                  <Card className="h-full border bg-transparent">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-base text-muted-foreground flex items-center gap-2">
                                        <span>🎯</span>
                                        Key Strengths
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-foreground/90">
                                      <ol className="list-decimal ml-4 space-y-1">
                                        {keyStrengthsData.map((strength: any, idx: number) => (
                                          <li key={idx}>
                                            {typeof strength === 'string' ? strength : strength?.title || strength?.name || 'Strength'}
                                          </li>
                                        ))}
                                      </ol>
                                    </CardContent>
                                  </Card>
                                )}
                                
                                {/* Other categories */}
                                {categories.filter(({ key }) => key !== 'topStrengths').map(({ key, label, icon }) => {
                                  const data = strengths[key]
                                  if (!data) return null
                                  
                                  let displayValue = ''
                                  if (Array.isArray(data)) {
                                    displayValue = data.map((item: any) => 
                                      typeof item === 'string' ? item : item?.title || item?.name || item?.description || 'Item'
                                    ).join(', ')
                                  } else if (typeof data === 'string') {
                                    displayValue = data
                                  } else {
                                    return null
                                  }
                                  
                                  if (!displayValue.trim()) return null
                                  
                                  return (
                                    <Card key={key} className="h-full border bg-transparent">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-base text-muted-foreground flex items-center gap-2">
                                          <span>{icon}</span>
                                          {label}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="text-sm text-foreground/90">
                                        {Array.isArray(data) ? (
                                          <ol className="list-decimal ml-4 space-y-1">
                                            {data.map((item: any, idx: number) => (
                                              <li key={idx}>
                                                {typeof item === 'string' ? item : item?.title || item?.name || item?.description || 'Item'}
                                              </li>
                                            ))}
                                          </ol>
                                        ) : typeof data === 'string' ? (
                                          <ol className="list-decimal ml-4 space-y-1">
                                            <li>{data}</li>
                                          </ol>
                                        ) : (
                                          <ol className="list-decimal ml-4 space-y-1">
                                            <li>{JSON.stringify(data)}</li>
                                          </ol>
                                        )}
                                      </CardContent>
                                    </Card>
                                  )
                                }).filter(Boolean)}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
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
