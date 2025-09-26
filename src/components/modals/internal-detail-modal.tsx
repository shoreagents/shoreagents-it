"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconGlobe, IconCreditCard, IconPlus, IconUpload, IconX, IconSearch, IconLink, IconMinus, IconCheck, IconGenderMale, IconGenderFemale, IconGenderNeutrois, IconHelp, IconSun, IconMoon, IconClockHour4, IconUsers, IconHome, IconDeviceLaptop } from "@tabler/icons-react"
import { useRealtimeMembers } from '@/hooks/use-realtime-members'
import { SendHorizontal, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataFieldRow, EditableField } from "@/components/ui/fields"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedTabs } from "@/components/ui/animated-tabs"

import { Popover, PopoverContent, PopoverTrigger, PopoverItem } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { ColorPicker } from "@/components/ui/color-picker"
import { LinkPreview } from "@/components/ui/link-preview"
import { MembersActivityLog } from "@/components/members-activity-log"
import { Comment } from "@/components/ui/comment"

interface InternalDetailModalProps {
  isOpen: boolean
  onClose: () => void
  internalUserId?: string
  internalUserData?: InternalRecord
}

interface InternalRecord {
  user_id: number
  email: string
  user_type: string
  // Personal Info fields
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  nickname: string | null
  profile_picture: string | null
  phone: string | null
  birthday: string | null
  city: string | null
  address: string | null
  gender: string | null
  // Job Info fields
  employee_id: string | null
  job_title: string | null
  work_email: string | null
  shift_period: string | null
  shift_schedule: string | null
  shift_time: string | null
  work_setup: string | null
  employment_status: string | null
  hire_type: string | null
  staff_source: string | null
  start_date: string | null
  exit_date: string | null
  // Internal specific fields
  station_id: string | null
  // Additional fields that might be available from API
  member_id?: number | null
  member_company?: string | null
  member_badge_color?: string | null
  department_name?: string | null
}

// Helper function to get company badge styling based on badge color
const getCompanyBadgeClass = (badgeColor: string | null): string => {
  if (!badgeColor) {
    return 'bg-gray-50 dark:bg-gray-600/20 border-gray-300 dark:border-gray-600/20'
  }
  
  // Convert hex to RGB and create light/dark variants
  const hex = badgeColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Create light mode background (20% opacity)
  const lightBg = `rgba(${r}, ${g}, ${b}, 0.1)`
  // Create dark mode background (20% opacity)
  const darkBg = `rgba(${r}, ${g}, ${b}, 0.2)`
  // Create border color (40% opacity)
  const borderColor = `rgba(${r}, ${g}, ${b}, 0.4)`
  
  return `border-[${borderColor}]`
}


export function InternalDetailModal({ isOpen, onClose, internalUserId, internalUserData }: InternalDetailModalProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  
  // Helper function to create colors with alpha transparency
  function withAlpha(hex: string, alpha: number): string {
    const clean = hex?.trim() || ''
    const match = /^#([A-Fa-f0-9]{6})$/.exec(clean)
    if (!match) return hex || 'transparent'
    const r = parseInt(clean.slice(1, 3), 16)
    const g = parseInt(clean.slice(3, 5), 16)
    const b = parseInt(clean.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const [activeTab, setActiveTab] = React.useState("information")
  const [comment, setComment] = React.useState("")
  const [isCommentFocused, setIsCommentFocused] = React.useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
      const [commentsList, setCommentsList] = React.useState<Array<{id: string, comment: string, user_name: string, created_at: string}>>([])
    const [localGender, setLocalGender] = React.useState<string | null>(null)
    const [localBirthday, setLocalBirthday] = React.useState<Date | undefined>(undefined)
    const [localStartDate, setLocalStartDate] = React.useState<Date | undefined>(undefined)
    const [localExitDate, setLocalExitDate] = React.useState<Date | undefined>(undefined)
    const [localShiftPeriod, setLocalShiftPeriod] = React.useState<string | null>(null)
    const [localEmploymentStatus, setLocalEmploymentStatus] = React.useState<string | null>(null)
    
    const [isHovered, setIsHovered] = React.useState(false)
    const [isWorkEmailHovered, setIsWorkEmailHovered] = React.useState(false)
    const [localInternalData, setLocalInternalData] = React.useState<InternalRecord | null>(null)

    // Add local state for editable text fields
    const [inputValues, setInputValues] = React.useState<Record<string, string>>({
      first_name: '',
      middle_name: '',
      last_name: '',
      nickname: '',
      phone: '',
      address: '',
      city: '',
      employee_id: '',
      job_title: '',
      work_email: '',
      shift_schedule: '',
      shift_time: '',
      work_setup: '',
      hire_type: '',
      staff_source: ''
    })

    // Add original values for change tracking
    const [originalValues, setOriginalValues] = React.useState<Record<string, string>>({
      first_name: '',
      middle_name: '',
      last_name: '',
      nickname: '',
      phone: '',
      address: '',
      city: '',
      employee_id: '',
      job_title: '',
      work_email: '',
      shift_schedule: '',
      shift_time: '',
      work_setup: '',
      hire_type: '',
      staff_source: ''
    })

    // Add change tracking state
    const [hasChanges, setHasChanges] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)

    // Initialize input values when modal opens
    React.useEffect(() => {
      if (isOpen && internalUserData) {
        // Reset active tab to Personal Info when modal opens
        setActiveTab("information")
        
        // Initialize local internal data
        setLocalInternalData(internalUserData)
        
        setLocalGender(internalUserData.gender)
                  // Initialize birthday date - parse date string directly to avoid timezone issues
          if (internalUserData.birthday) {
            const [year, month, day] = internalUserData.birthday.split('-').map(Number)
            const date = new Date(year, month - 1, day)
            setLocalBirthday(!isNaN(date.getTime()) ? date : undefined)
          } else {
            setLocalBirthday(undefined)
          }
          // Initialize start date - parse date string directly to avoid timezone issues
          if (internalUserData.start_date) {
            const [year, month, day] = internalUserData.start_date.split('-').map(Number)
            const date = new Date(year, month - 1, day)
            setLocalStartDate(!isNaN(date.getTime()) ? date : undefined)
          } else {
            setLocalStartDate(undefined)
          }
          // Initialize exit date - parse date string directly to avoid timezone issues
          if (internalUserData.exit_date) {
            const [year, month, day] = internalUserData.exit_date.split('-').map(Number)
            const date = new Date(year, month - 1, day)
            setLocalExitDate(!isNaN(date.getTime()) ? date : undefined)
          } else {
            setLocalExitDate(undefined)
          }
        // Initialize shift period
        setLocalShiftPeriod(internalUserData.shift_period)
        // Initialize employment status
        setLocalEmploymentStatus(internalUserData.employment_status)

        // Initialize input values for editable fields
        const initialValues = {
          first_name: internalUserData.first_name || '',
          middle_name: internalUserData.middle_name || '',
          last_name: internalUserData.last_name || '',
          nickname: internalUserData.nickname || '',
          phone: internalUserData.phone || '',
          address: internalUserData.address || '',
          city: internalUserData.city || '',
          employee_id: internalUserData.employee_id || '',
          job_title: internalUserData.job_title || '',
          work_email: internalUserData.work_email || '',
          shift_schedule: internalUserData.shift_schedule || '',
          shift_time: internalUserData.shift_time || '',
          work_setup: internalUserData.work_setup || '',
          hire_type: internalUserData.hire_type || '',
          staff_source: internalUserData.staff_source || ''
        }
        setInputValues(initialValues)
        setOriginalValues(initialValues)
        setHasChanges(false)
      }
    }, [isOpen, internalUserData])



  // Use local internal data if available, otherwise use original internal data, fallback to static data
  const currentInternalData = localInternalData || internalUserData
  
  // Debug: Log the current internal data and display data
  console.log('🔄 Current internal data:', {
    user_id: currentInternalData?.user_id,
    station_id: currentInternalData?.station_id,
    member_company: currentInternalData?.member_company
  })
  
  const displayData = currentInternalData ? {
    id: currentInternalData.user_id.toString(),
    first_name: inputValues.first_name || currentInternalData.first_name || "Unknown",
    middle_name: inputValues.middle_name || currentInternalData.middle_name || null,
    last_name: inputValues.last_name || currentInternalData.last_name || "User",
    nickname: inputValues.nickname || currentInternalData.nickname || null,
    profile_picture: currentInternalData.profile_picture || null,
    employee_id: inputValues.employee_id || currentInternalData.employee_id || "N/A",
    station_id: currentInternalData.station_id || null,
    member_company: currentInternalData.member_company || null,
    member_badge_color: currentInternalData.member_badge_color || null,
    member_name: (inputValues.first_name || currentInternalData.first_name) && (inputValues.last_name || currentInternalData.last_name) ? `${inputValues.first_name || currentInternalData.first_name} ${inputValues.last_name || currentInternalData.last_name}` : null,
    job_title: inputValues.job_title || currentInternalData.job_title || "Not Specified",
    department: currentInternalData.department_name || "Not Specified",
    email: currentInternalData.email || "No email",
    phone: inputValues.phone || currentInternalData.phone || "No phone",
          birthday: localBirthday && !isNaN(localBirthday.getTime()) ? `${localBirthday.getFullYear()}-${String(localBirthday.getMonth() + 1).padStart(2, '0')}-${String(localBirthday.getDate()).padStart(2, '0')}` : (currentInternalData.birthday || null),
    city: inputValues.city || currentInternalData.city || null,
    address: inputValues.address || currentInternalData.address || null,
    gender: localGender !== null ? localGender : (currentInternalData.gender || null),
          start_date: localStartDate && !isNaN(localStartDate.getTime()) ? `${localStartDate.getFullYear()}-${String(localStartDate.getMonth() + 1).padStart(2, '0')}-${String(localStartDate.getDate()).padStart(2, '0')}` : (currentInternalData.start_date || null),
          exit_date: localExitDate && !isNaN(localExitDate.getTime()) ? `${localExitDate.getFullYear()}-${String(localExitDate.getMonth() + 1).padStart(2, '0')}-${String(localExitDate.getDate()).padStart(2, '0')}` : (currentInternalData.exit_date || null),
    work_email: inputValues.work_email || currentInternalData.work_email || null,
    shift_period: localShiftPeriod !== null ? localShiftPeriod : (currentInternalData.shift_period || null),
    shift_schedule: inputValues.shift_schedule || currentInternalData.shift_schedule || null,
    shift_time: inputValues.shift_time || currentInternalData.shift_time || null,
    work_setup: inputValues.work_setup || currentInternalData.work_setup || null,
    employment_status: localEmploymentStatus !== null ? localEmploymentStatus : (currentInternalData.employment_status || null),
    hire_type: inputValues.hire_type || currentInternalData.hire_type || null,
    staff_source: inputValues.staff_source || currentInternalData.staff_source || null,
    status: currentInternalData.exit_date ? "Inactive" : "Active"
  } : {
    id: "N/A",
    first_name: "Unknown",
    middle_name: null,
    last_name: "User",
    nickname: null,
    profile_picture: null,
    employee_id: "N/A",
    station_id: null,
    member_company: null,
    member_badge_color: null,
    member_name: null,
    job_title: "Not Specified",
    department: "Not Specified",
    email: "No email",
    phone: "No phone",
    birthday: null,
    city: null,
    address: null,
    gender: null,
    start_date: null,
    exit_date: null,
    work_email: null,
    shift_period: null,
    shift_schedule: null,
    shift_time: null,
    work_setup: null,
    employment_status: null,
    hire_type: null,
    staff_source: null,
    status: "Unknown"
  }
  
  console.log('🔄 Internal user data prop:', internalUserData)
  console.log('🔄 Local internal data:', localInternalData)
  console.log('🔄 Display data:', displayData)

  // Check if there are unsaved changes
  const hasUnsavedChanges = React.useMemo(() => {
    if (!localInternalData) return false
    
    // Check for input field changes
    const hasFieldChanges = Object.keys(inputValues).some(fieldName => {
      const currentValue = inputValues[fieldName]
      const originalValue = originalValues[fieldName]
      return currentValue !== originalValue
    })
    
    // Check for other field changes by comparing with original values
    const hasOtherChanges = 
      localGender !== (internalUserData?.gender || null) ||
      (localBirthday?.toISOString().split('T')[0] || null) !== (internalUserData?.birthday || null) ||
      (localStartDate?.toISOString().split('T')[0] || null) !== (internalUserData?.start_date || null) ||
      (localExitDate?.toISOString().split('T')[0] || null) !== (internalUserData?.exit_date || null) ||
      localShiftPeriod !== (internalUserData?.shift_period || null) ||
      localEmploymentStatus !== (internalUserData?.employment_status || null)
    
    const hasChanges = hasFieldChanges || hasOtherChanges
    
    // Debug logging
    if (hasChanges) {
      console.log('🔄 Changes detected:', {
        hasFieldChanges,
        hasOtherChanges,
        fieldChanges: Object.keys(inputValues).filter(fieldName => {
          const currentValue = inputValues[fieldName]
          const originalValue = originalValues[fieldName]
          return currentValue !== originalValue
        }),
        otherChanges: {
          gender: { current: localGender, original: internalUserData?.gender },
          birthday: { current: localBirthday && !isNaN(localBirthday.getTime()) ? localBirthday.toISOString().split('T')[0] : null, original: internalUserData?.birthday },
          startDate: { current: localStartDate && !isNaN(localStartDate.getTime()) ? localStartDate.toISOString().split('T')[0] : null, original: internalUserData?.start_date },
          exitDate: { current: localExitDate && !isNaN(localExitDate.getTime()) ? localExitDate.toISOString().split('T')[0] : null, original: internalUserData?.exit_date },
          shiftPeriod: { current: localShiftPeriod, original: internalUserData?.shift_period },
          employmentStatus: { current: localEmploymentStatus, original: internalUserData?.employment_status }
        }
      })
    }
    
    return hasChanges
  }, [inputValues, originalValues, localInternalData, internalUserData, localGender, localBirthday, localStartDate, localExitDate, localShiftPeriod, localEmploymentStatus])

  // Auto-save function that can be called before closing
  const autoSaveBeforeClose = async (): Promise<boolean> => {
    if (!localInternalData || !hasUnsavedChanges) {
      console.log('🔄 No changes to save, closing directly')
      return true // No need to save, can close
    }

    try {
      console.log('🔄 Auto-saving changes before closing...')
      console.log('🔄 Current state:', {
        localInternalData: localInternalData?.user_id,
        hasUnsavedChanges,
        inputValues,
        originalValues,
        localGender,
        localBirthday: localBirthday && !isNaN(localBirthday.getTime()) ? localBirthday.toISOString().split('T')[0] : null,
        localStartDate: localStartDate && !isNaN(localStartDate.getTime()) ? localStartDate.toISOString().split('T')[0] : null,
        localExitDate: localExitDate && !isNaN(localExitDate.getTime()) ? localExitDate.toISOString().split('T')[0] : null,
        localShiftPeriod,
        localEmploymentStatus
      })
      
      setIsSaving(true)
      
      // Prepare all updates in one object
      const allUpdates: Record<string, any> = {}
      
      // Add input field changes
      Object.keys(inputValues).forEach(fieldName => {
        const currentValue = inputValues[fieldName]
        const originalValue = originalValues[fieldName]
        if (currentValue !== originalValue) {
          allUpdates[fieldName] = currentValue || null
          console.log(`🔄 Field change detected: ${fieldName}`, { current: currentValue, original: originalValue })
        }
      })
      
      // Add other field changes
      if (localGender !== internalUserData?.gender) {
        allUpdates.gender = localGender
        console.log(`🔄 Gender change detected:`, { current: localGender, original: internalUserData?.gender })
      }
      if (localBirthday) {
        const birthdayStr = `${localBirthday.getFullYear()}-${String(localBirthday.getMonth() + 1).padStart(2, '0')}-${String(localBirthday.getDate()).padStart(2, '0')}`
        if (birthdayStr !== internalUserData?.birthday) {
          allUpdates.birthday = birthdayStr
          console.log(`🔄 Birthday change detected:`, { current: birthdayStr, original: internalUserData?.birthday })
        }
      }
      if (localStartDate) {
        const startDateStr = `${localStartDate.getFullYear()}-${String(localStartDate.getMonth() + 1).padStart(2, '0')}-${String(localStartDate.getDate()).padStart(2, '0')}`
        if (startDateStr !== internalUserData?.start_date) {
          allUpdates.start_date = startDateStr
          console.log(`🔄 Start date change detected:`, { current: startDateStr, original: internalUserData?.start_date })
        }
      }
      if (localExitDate) {
        const exitDateStr = `${localExitDate.getFullYear()}-${String(localExitDate.getMonth() + 1).padStart(2, '0')}-${String(localExitDate.getDate()).padStart(2, '0')}`
        if (exitDateStr !== internalUserData?.exit_date) {
          allUpdates.exit_date = exitDateStr
          console.log(`🔄 Exit date change detected:`, { current: exitDateStr, original: internalUserData?.exit_date })
        }
      }
      if (localShiftPeriod !== internalUserData?.shift_period) {
        allUpdates.shift_period = localShiftPeriod
        console.log(`🔄 Shift period change detected:`, { current: localShiftPeriod, original: internalUserData?.shift_period })
      }
      if (localEmploymentStatus !== internalUserData?.employment_status) {
        allUpdates.employment_status = localEmploymentStatus
        console.log(`🔄 Employment status change detected:`, { current: localEmploymentStatus, original: internalUserData?.employment_status })
      }
      
      console.log('🔄 All updates to send:', allUpdates)
      
      // Send all updates to the consolidated endpoint
      if (Object.keys(allUpdates).length > 0) {
        console.log('🔄 Sending update request to:', `/api/internal/${localInternalData.user_id}/update/`)
        
        const response = await fetch(`/api/internal/${localInternalData.user_id}/update/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(allUpdates)
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Update failed:', response.status, errorText)
          throw new Error(`Failed to update agent: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('✅ Agent updated successfully:', result)
        
        // Update original values after successful save
        const changedInputFields = Object.keys(inputValues).filter(fieldName => {
          const currentValue = inputValues[fieldName]
          const originalValue = originalValues[fieldName]
          return currentValue !== originalValue
        })
        
        if (changedInputFields.length > 0) {
          setOriginalValues(prev => {
            const updated = { ...prev }
            changedInputFields.forEach(fieldName => {
              updated[fieldName] = inputValues[fieldName]
            })
            return updated
          })
        }
      } else {
        console.log('🔄 No updates to send')
      }
      
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
      internalUser: localInternalData?.user_id, 
      hasUnsavedChanges, 
      isOpen,
      localInternalData: !!localInternalData
    })
    
    if (localInternalData && hasUnsavedChanges) {
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
      console.log('🔒 Debug info:', {
        hasLocalInternal: !!localInternalData,
        hasUnsavedChanges,
        inputValues,
        originalValues
      })
      onClose() // Call the original onClose prop
    }
  }



  // Real-time updates for all internal user changes
  console.log('🔄 Initializing real-time hook for internal users modal (all changes)')
  const { isConnected: isRealtimeConnected } = useRealtimeMembers({
    onPersonalInfoChanged: async (personalInfo, oldPersonalInfo, notificationData) => {
      console.log('🔄 Real-time: Personal info change received in modal:', { 
        personalInfo, 
        oldPersonalInfo, 
        currentInternalUserId: localInternalData?.user_id,
        modalIsOpen: isOpen,
        hasLocalInternal: !!localInternalData
      })
      
      // Only process updates for the current internal user
      if (localInternalData && personalInfo.user_id === localInternalData.user_id) {
        console.log('🔄 Real-time: Processing personal info change for current internal user:', personalInfo)
        
        // Update local internal data with new personal info
        setLocalInternalData(prevInternal => {
          if (!prevInternal) return prevInternal
          
          return {
            ...prevInternal,
            first_name: personalInfo.first_name,
            middle_name: personalInfo.middle_name,
            last_name: personalInfo.last_name,
            nickname: personalInfo.nickname,
            phone: personalInfo.phone,
            address: personalInfo.address,
            city: personalInfo.city,
            gender: personalInfo.gender,
            birthday: personalInfo.birthday
          }
        })
        
        // Update input values if they haven't been changed locally
        setInputValues(prev => ({
          ...prev,
          first_name: personalInfo.first_name || '',
          middle_name: personalInfo.middle_name || '',
          last_name: personalInfo.last_name || '',
          nickname: personalInfo.nickname || '',
          phone: personalInfo.phone || '',
          address: personalInfo.address || '',
          city: personalInfo.city || ''
        }))
        
        // Update local state for fields that have their own state
        if (personalInfo.gender !== oldPersonalInfo?.gender) {
          setLocalGender(personalInfo.gender)
        }
        if (personalInfo.birthday !== oldPersonalInfo?.birthday) {
          if (personalInfo.birthday) {
            const [year, month, day] = personalInfo.birthday.split('-').map(Number)
            setLocalBirthday(new Date(year, month - 1, day))
          } else {
            setLocalBirthday(undefined)
          }
        }
        
        console.log('🔄 Updated internal user personal info in real-time')
      } else {
        console.log('🔄 Real-time: Personal info update not for current internal user, skipping')
      }
    },
    onJobInfoChanged: async (jobInfo, oldJobInfo, notificationData) => {
      console.log('🔄 Real-time: Job info change received in modal:', { 
        jobInfo, 
        oldJobInfo, 
        currentInternalUserId: localInternalData?.user_id,
        modalIsOpen: isOpen,
        hasLocalInternal: !!localInternalData
      })
      
      // Only process updates for the current internal user
      if (localInternalData && jobInfo.user_id === localInternalData.user_id) {
        console.log('🔄 Real-time: Processing job info change for current internal user:', jobInfo)
        
        // Update local internal data with new job info
        setLocalInternalData(prevInternal => {
          if (!prevInternal) return prevInternal
          
          return {
            ...prevInternal,
            employee_id: jobInfo.employee_id,
            job_title: jobInfo.job_title,
            shift_period: jobInfo.shift_period,
            shift_schedule: jobInfo.shift_schedule,
            shift_time: jobInfo.shift_time,
            work_setup: jobInfo.work_setup,
            employment_status: jobInfo.employment_status,
            hire_type: jobInfo.hire_type,
            staff_source: jobInfo.staff_source,
            start_date: jobInfo.start_date,
            exit_date: jobInfo.exit_date,
            work_email: jobInfo.work_email
          }
        })
        
        // Update input values if they haven't been changed locally
        setInputValues(prev => ({
          ...prev,
          employee_id: jobInfo.employee_id || '',
          job_title: jobInfo.job_title || '',
          shift_schedule: jobInfo.shift_schedule || '',
          shift_time: jobInfo.shift_time || '',
          work_setup: jobInfo.work_setup || '',
          hire_type: jobInfo.hire_type || '',
          staff_source: jobInfo.staff_source || ''
        }))
        
        // Update local state for fields that have their own state
        if (jobInfo.shift_period !== oldJobInfo?.shift_period) {
          setLocalShiftPeriod(jobInfo.shift_period)
        }
        if (jobInfo.employment_status !== oldJobInfo?.employment_status) {
          setLocalEmploymentStatus(jobInfo.employment_status)
        }
        if (jobInfo.start_date !== oldJobInfo?.start_date) {
          if (jobInfo.start_date) {
            const [year, month, day] = jobInfo.start_date.split('-').map(Number)
            setLocalStartDate(new Date(year, month - 1, day))
          } else {
            setLocalStartDate(undefined)
          }
        }
        if (jobInfo.exit_date !== oldJobInfo?.exit_date) {
          if (jobInfo.exit_date) {
            const [year, month, day] = jobInfo.exit_date.split('-').map(Number)
            setLocalExitDate(new Date(year, month - 1, day))
          } else {
            setLocalExitDate(undefined)
          }
        }
        
        console.log('🔄 Updated internal user job info in real-time')
      } else {
        console.log('🔄 Real-time: Job info update not for current internal user, skipping')
      }
    }
  })

  // Handle input changes for editable fields
  const handleInputChange = (fieldName: string, value: string) => {
    console.log(`🔄 Input change for ${fieldName}:`, value)
    
    // For phone and employee_id fields, only allow numbers
    if (fieldName === 'phone' || fieldName === 'employee_id') {
      // Remove all non-numeric characters
      const numericValue = value.replace(/[^0-9]/g, '')
      setInputValues(prev => ({ ...prev, [fieldName]: numericValue }))
    } else {
      // For other fields, allow any input
      setInputValues(prev => ({ ...prev, [fieldName]: value }))
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !internalUserData?.user_id || isSubmittingComment) return

    setIsSubmittingComment(true)

    // Create the comment object
    const newComment = {
      id: Date.now().toString(),
      comment: comment.trim(),
      user_name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Unknown User',
      created_at: new Date().toISOString()
    }

    // Add to local state immediately for responsive UI
    setCommentsList((prev) => [newComment, ...prev])
    setComment("")

    // Save comment to database (you'll need to implement this API endpoint)
    try {
      const response = await fetch(`/api/agents/${internalUserData.user_id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: newComment.comment,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save comment')
      }

      console.log('✅ Comment saved successfully')
    } catch (error) {
      console.error('❌ Failed to save comment:', error)
      // Remove from local state if save failed
      setCommentsList((prev) => prev.filter(c => c.id !== newComment.id))
    } finally {
      setIsSubmittingComment(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
              <DialogContent
          className="max-w-7xl max-h-[95vh] overflow-hidden p-0 rounded-xl"
          style={{ backgroundColor: theme === 'dark' ? '#111111' : '#f8f9fa' }}
        >
        <DialogTitle className="sr-only">Internal Details</DialogTitle>
        <div className="flex h-[95vh]">
          {/* Left Panel - Form */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
              <div className="flex items-center gap-3">
                <Badge className="text-xs h-6 flex items-center rounded-[6px]">
                  Internal
                </Badge>

              </div>
            </div>

            {/* Internal User Header */}
            <div className="px-6 py-5">
              {/* Avatar and Internal User Name */}
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={internalUserData?.profile_picture || "/avatars/shadcn.svg"} alt="Internal Avatar" />
                  <AvatarFallback className="text-2xl">
                    {(displayData.first_name?.[0] || '?')}{(displayData.last_name?.[0] || '?')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-2xl font-semibold mb-2">
                    {displayData.first_name || 'Unknown'} {displayData.last_name || 'User'}
                  </div>
                </div>
              </div>
              
              {/* Internal User Metadata Grid */}
              <div className="grid grid-cols-1 gap-4 text-sm">


                {/* Status */}
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status:</span>
                  <Badge 
                    variant="outline" 
                    className={`px-3 py-1 font-medium ${
                      displayData.status === 'Active' 
                        ? 'text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20' 
                        : 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20'
                    }`}
                  >
                    {displayData.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </div>
            


            {/* Scrollable Form Content */}
            <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                <div className="mb-6 flex-shrink-0">
                  <div className={`rounded-xl p-1 w-fit ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-gray-100/80 border border-gray-200'
                  }`}>
                    <AnimatedTabs
                      tabs={[
                        { title: "Personal Info", value: "information" },
                        { title: "Job Info", value: "ai-analysis" }
                      ]}
                      containerClassName="grid grid-cols-2 w-fit"
                      onTabChange={(tab) => setActiveTab(tab.value)}
                    />
                  </div>
                </div>

                 {/* Information Tab */}
                 <TabsContent value="information" className="space-y-6">
                   <div>
                     <div className="flex items-center justify-between min-h-[40px]">
                       <h3 className="text-lg font-medium text-muted-foreground">Personal Information</h3>
                     </div>
                     <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                                              {/* First Name */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="First Name"
                         fieldName="first_name"
                         value={inputValues.first_name}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Middle Name */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Middle Name"
                         fieldName="middle_name"
                         value={inputValues.middle_name}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Last Name */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Last Name"
                         fieldName="last_name"
                         value={inputValues.last_name}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Nickname */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Nickname"
                         fieldName="nickname"
                         value={inputValues.nickname}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Personal Email */}
                       <DataFieldRow
                         icon={<IconMail className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Personal Email"
                         fieldName="email"
                         value={displayData.email}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <div 
                             className="h-[33px] w-full text-sm flex items-center justify-between"
                             onMouseEnter={() => setIsHovered(true)}
                             onMouseLeave={() => setIsHovered(false)}
                           >
                             <span className={displayData.email ? 'text-foreground' : 'text-muted-foreground'}>
                               {displayData.email || '-'}
                             </span>
                             {displayData.email && (
                               <div className={`flex items-center gap-2 transition-all duration-200 ease-in-out ${
                                 isHovered 
                                   ? 'opacity-100 translate-x-0' 
                                   : 'opacity-0 translate-x-2 pointer-events-none'
                               }`}>
                                 <button
                                   onClick={(e) => {
                                     e.preventDefault()
                                     e.stopPropagation()
                                     navigator.clipboard.writeText(displayData.email)
                                   }}
                                   className="p-0 hover:text-foreground rounded transition-colors text-muted-foreground"
                                   title="Copy email"
                                   tabIndex={-1}
                                 >
                                   <IconCopy className="h-4 w-4" />
                                 </button>
                               </div>
                             )}
                           </div>
                         }
                       />

                       {/* Phone */}
                       <DataFieldRow
                         icon={<IconPhone className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Phone"
                         fieldName="phone"
                         value={inputValues.phone}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Birthday */}
                       <DataFieldRow
                         icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Birthday"
                         fieldName="birthday"
                         value={displayData.birthday}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="outline"
                                 className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                   localBirthday ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                               >
                                 {localBirthday ? localBirthday.toLocaleDateString() : "-"}
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Calendar
                                 mode="single"
                                 selected={localBirthday}
                                 onSelect={(date) => {
                                   setLocalBirthday(date)
                                   console.log('Birthday changed to:', date)
                                 }}
                                 captionLayout="dropdown"
                               />
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* Gender */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Gender"
                         fieldName="gender"
                         value={displayData.gender}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                                                               <div 
                                  className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                    displayData.gender ? 'text-foreground' : 'text-muted-foreground'
                                  }`}
                                  style={{ backgroundColor: 'transparent' }}
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                    }
                                  }}
                                >
                                  <span className="text-sm">
                                    {(() => {
                                      const genderOption = [
                                        { value: 'Male', label: 'Male' },
                                        { value: 'Female', label: 'Female' },
                                        { value: 'Other', label: 'Other' },
                                        { value: 'Prefer not to say', label: 'Prefer Not To Say' }
                                      ].find(option => option.value === displayData.gender);
                                      return genderOption ? genderOption.label : (displayData.gender || '-');
                                    })()}
                                  </span>
                                </div>
                             </PopoverTrigger>
                             <PopoverContent className="w-48 p-2" align="start" side="bottom" sideOffset={4}>
                               {[
                                   { value: 'Male', label: 'Male', icon: <IconGenderMale className="h-4 w-4 text-muted-foreground" /> },
                                   { value: 'Female', label: 'Female', icon: <IconGenderFemale className="h-4 w-4 text-muted-foreground" /> },
                                   { value: 'Other', label: 'Other', icon: <IconUser className="h-4 w-4 text-muted-foreground" /> },
                                   { value: 'Prefer not to say', label: 'Prefer Not To Say', icon: <IconMinus className="h-4 w-4 text-muted-foreground" /> }
                                 ].map((genderOption) => {
                                   const isCurrentGender = displayData.gender === genderOption.value;
                                   return (
                                     <PopoverItem
                                       key={genderOption.value}
                                       isSelected={isCurrentGender}
                                                                        onClick={() => {
                                   // Update the gender value
                                   if (displayData.gender !== genderOption.value) {
                                     setLocalGender(genderOption.value)
                                     console.log('Gender changed to:', genderOption.value)
                                   }
                                 }}
                                     >
                                       <span className="text-sm">{genderOption.icon}</span>
                                       <span className="text-sm font-medium">{genderOption.label || genderOption.value}</span>
                                     </PopoverItem>
                                   );
                                 })}
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* Address */}
                       <DataFieldRow
                         icon={<IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Address"
                         fieldName="address"
                         value={inputValues.address}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* City */}
                       <DataFieldRow
                         icon={<IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="City"
                         fieldName="city"
                         value={inputValues.city}
                         onSave={handleInputChange}
                         placeholder="-"
                         isLast={true}
                       />


                     </div>
                   </div>
                 </TabsContent>

                                 {/* Job Info Tab */}
                 <TabsContent value="ai-analysis" className="space-y-6 overflow-y-auto flex-1 min-h-0">
                   <div>
                     <div className="flex items-center justify-between min-h-[40px]">
                       <h3 className="text-lg font-medium text-muted-foreground">Job Information</h3>
                     </div>
                     <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                       {/* Employee ID */}
                       <DataFieldRow
                         icon={<IconId className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Employee ID"
                         fieldName="employee_id"
                         value={inputValues.employee_id}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Job Title */}
                       <DataFieldRow
                         icon={<IconBriefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Job Title"
                         fieldName="job_title"
                         value={inputValues.job_title}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Work Email */}
                       <DataFieldRow
                         icon={<IconMail className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Work Email"
                         fieldName="work_email"
                         value={inputValues.work_email}
                         onSave={handleInputChange}
                         placeholder="-"
                         customInput={
                           <div 
                             className="flex items-center gap-2 w-full"
                             onMouseEnter={() => setIsWorkEmailHovered(true)}
                             onMouseLeave={() => setIsWorkEmailHovered(false)}
                           >
                             <EditableField 
                               fieldName="work_email"
                               value={inputValues.work_email || ''}
                               placeholder="-"
                               onSave={handleInputChange}
                             />
                             {inputValues.work_email && inputValues.work_email.trim() !== '' && (
                               <div className={`flex items-center gap-2 transition-all duration-200 ease-in-out ${
                                 isWorkEmailHovered 
                                   ? 'opacity-100 translate-x-0' 
                                   : 'opacity-0 translate-x-2 pointer-events-none'
                               }`}>
                                 <button
                                   onClick={(e) => {
                                     e.preventDefault()
                                     e.stopPropagation()
                                     navigator.clipboard.writeText(inputValues.work_email)
                                   }}
                                   className="p-0 hover:text-foreground rounded transition-colors text-muted-foreground"
                                   title="Copy work email"
                                   tabIndex={-1}
                                 >
                                   <IconCopy className="h-4 w-4" />
                                 </button>
                                 <button
                                   onClick={(e) => {
                                     e.preventDefault()
                                     e.stopPropagation()
                                     handleInputChange('work_email', '')
                                   }}
                                   className="p-0 hover:text-0 hover:text-foreground rounded transition-colors text-muted-foreground"
                                   title="Clear work email"
                                   tabIndex={-1}
                                 >
                                   <IconX className="h-4 w-4" />
                                 </button>
                               </div>
                             )}
                           </div>
                         }
                       />

                       {/* Shift Period */}
                       <DataFieldRow
                         icon={<IconClockHour4 className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Shift Period"
                         fieldName="shift_period"
                         value={displayData.shift_period}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <div 
                                 className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                   displayData.shift_period ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                                 style={{ backgroundColor: 'transparent' }}
                                 tabIndex={0}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' || e.key === ' ') {
                                     e.preventDefault()
                                   }
                                 }}
                               >
                                 {displayData.shift_period || '-'}
                               </div>
                             </PopoverTrigger>
                             <PopoverContent className="w-32 p-1" align="start" side="bottom" sideOffset={4}>
                               {[
                                 { value: 'Day', icon: <IconSun className="h-4 w-4 text-muted-foreground" /> },
                                 { value: 'Night', icon: <IconMoon className="h-4 w-4 text-muted-foreground" /> }
                               ].map((shiftOption) => (
                                   <PopoverItem
                                     key={shiftOption.value}
                                     isSelected={displayData.shift_period === shiftOption.value}
                                                                      onClick={() => {
                                   // Update the shift period value
                                   if (displayData.shift_period !== shiftOption.value) {
                                     setLocalShiftPeriod(shiftOption.value)
                                     console.log('Shift period changed to:', shiftOption.value)
                                   }
                                 }}
                                   >
                                     <span className="text-sm">{shiftOption.icon}</span>
                                     <span className="text-sm font-medium">{shiftOption.value}</span>
                                   </PopoverItem>
                                 ))}
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* Shift Schedule */}
                       <DataFieldRow
                         icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Shift Schedule"
                         fieldName="shift_schedule"
                         value={inputValues.shift_schedule}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Shift Time */}
                       <DataFieldRow
                         icon={<IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Shift Time"
                         fieldName="shift_time"
                         value={inputValues.shift_time}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Work Setup */}
                       <DataFieldRow
                         icon={<IconBuilding className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Work Setup"
                         fieldName="work_setup"
                         value={inputValues.work_setup}
                         onSave={handleInputChange}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <div 
                                 className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                   inputValues.work_setup ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                                 style={{ backgroundColor: 'transparent' }}
                                 tabIndex={0}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' || e.key === ' ') {
                                     e.preventDefault()
                                   }
                                 }}
                               >
                                 {inputValues.work_setup || '-'}
                               </div>
                             </PopoverTrigger>
                             <PopoverContent className="w-48 p-1" align="start" side="bottom" sideOffset={4}>
                               {[
                                 { value: 'On-site', icon: <IconBuilding className="h-4 w-4 text-muted-foreground" /> },
                                 { value: 'Hybrid', icon: <IconDeviceLaptop className="h-4 w-4 text-muted-foreground" /> },
                                 { value: 'Work From Home', icon: <IconHome className="h-4 w-4 text-muted-foreground" /> }
                               ].map((setupOption) => (
                                   <PopoverItem
                                     key={setupOption.value}
                                     isSelected={inputValues.work_setup === setupOption.value}
                                                                      onClick={() => {
                                   // Update the work setup value
                                   if (inputValues.work_setup !== setupOption.value) {
                                     setInputValues(prev => ({ ...prev, work_setup: setupOption.value }))
                                     console.log('Work setup changed to:', setupOption.value)
                                   }
                                 }}
                                   >
                                     <span className="text-sm">{setupOption.icon}</span>
                                     <span className="text-sm font-medium">{setupOption.value}</span>
                                   </PopoverItem>
                                 ))}
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* Employment Status */}
                       <DataFieldRow
                         icon={<IconId className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Employment Status"
                         fieldName="employment_status"
                         value={displayData.employment_status}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <div 
                                 className={`h-[33px] w-full text-sm border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none justify-start text-left font-normal cursor-pointer select-none flex items-center ${
                                   displayData.employment_status ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                                 style={{ backgroundColor: 'transparent' }}
                                 tabIndex={0}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' || e.key === ' ') {
                                     e.preventDefault()
                                   }
                                 }}
                               >
                                 {displayData.employment_status || '-'}
                               </div>
                             </PopoverTrigger>
                             <PopoverContent className="w-40 p-1" align="start" side="bottom" sideOffset={4}>
                               {[
                                 { value: 'Regular', icon: <IconCheck className="h-4 w-4 text-muted-foreground" /> },
                                 { value: 'Probationary', icon: <IconClock className="h-4 w-4 text-muted-foreground" /> }
                               ].map((statusOption) => (
                                   <PopoverItem
                                     key={statusOption.value}
                                     isSelected={displayData.employment_status === statusOption.value}
                                                                      onClick={() => {
                                   // Update the employment status value
                                   if (displayData.employment_status !== statusOption.value) {
                                     setLocalEmploymentStatus(statusOption.value)
                                     console.log('Employment status changed to:', statusOption.value)
                                   }
                                 }}
                                   >
                                     <span className="text-sm">{statusOption.icon}</span>
                                     <span className="text-sm font-medium">{statusOption.value}</span>
                                   </PopoverItem>
                                 ))}
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* Hire Type */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Hire Type"
                         fieldName="hire_type"
                         value={inputValues.hire_type}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Staff Source */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Staff Source"
                         fieldName="staff_source"
                         value={inputValues.staff_source}
                         onSave={handleInputChange}
                         placeholder="-"
                       />

                       {/* Start Date */}
                       <DataFieldRow
                         icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Start Date"
                         fieldName="start_date"
                         value={displayData.start_date}
                         onSave={() => {}}
                         placeholder="-"
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="outline"
                                 className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                   localStartDate ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                               >
                                 {localStartDate ? localStartDate.toLocaleDateString() : "-"}
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Calendar
                                 mode="single"
                                 selected={localStartDate}
                                 onSelect={(date) => {
                                   setLocalStartDate(date)
                                   console.log('Start date changed to:', date)
                                 }}
                                 captionLayout="dropdown"
                               />
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* Exit Date */}
                       <DataFieldRow
                         icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Exit Date"
                         fieldName="exit_date"
                         value={displayData.exit_date}
                         onSave={() => {}}
                         placeholder="-"
                         isLast={true}
                         customInput={
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="outline"
                                 className={`h-[33px] w-full justify-start font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50 ${
                                   localExitDate ? 'text-foreground' : 'text-muted-foreground'
                                 }`}
                               >
                                 {localExitDate ? localExitDate.toLocaleDateString() : "-"}
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Calendar
                                 mode="single"
                                 selected={localExitDate}
                                 onSelect={(date) => {
                                   setLocalExitDate(date)
                                   console.log('Exit date changed to:', date)
                                 }}
                                 captionLayout="dropdown"
                               />
                             </PopoverContent>
                           </Popover>
                         }
                       />
                     </div>
                   </div>
                 </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Panel - Activity & Comments */}
          <div className="w-96 flex flex-col border-l border-[#cecece99] dark:border-border h-full bg-[#ebebeb] dark:bg-[#0a0a0a]">
                          <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border flex-shrink-0">
                <h3 className="font-medium">
                  Activity
                </h3>

            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 bg-[#ebebeb] dark:bg-[#0a0a0a]">
              {/* Activity Content - Shows internal user activity and recent changes */}
              <div className="space-y-4">
                {internalUserData?.user_id ? (
                  <MembersActivityLog 
                    memberId={internalUserData.user_id} 
                    companyName={internalUserData.first_name && internalUserData.last_name ? `${internalUserData.first_name} ${internalUserData.last_name}` : 'Unknown Internal'} 
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
            </div>

            {/* Comment Input Section - Outside main content */}
            <div className="px-3 pb-3 bg-[#ebebeb] dark:bg-[#0a0a0a]">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
