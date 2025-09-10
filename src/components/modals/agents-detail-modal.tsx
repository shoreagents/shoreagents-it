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
import { DataFieldRow } from "@/components/ui/fields"
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

interface AgentsDetailModalProps {
  isOpen: boolean
  onClose: () => void
  agentId?: string
  agentData?: AgentRecord
}

interface AgentRecord {
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
  // Agent specific fields
  member_id: number | null
  member_company: string | null
  member_badge_color: string | null
  department_id: number | null
  department_name: string | null
  station_id: string | null
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

// Static agent data for fallback
const staticAgentData = {
  id: "AG001",
  first_name: "John",
  middle_name: "Michael",
  last_name: "Smith",
  nickname: "Johnny",
  profile_picture: null,
  employee_id: "EMP-2024-001",
  member_id: 12345,
  member_company: "TechCorp Solutions",
  member_badge_color: "#3B82F6",
  member_name: "John Smith",
  job_title: "Senior Software Engineer",
  department: "Engineering",
  email: "john.smith@company.com",
  phone: "+1 (555) 123-4567",
  birthday: "1990-05-15",
  address: "123 Main Street, Suite 100",
  city: "San Francisco",
  state: "CA",
  country: "United States",
  postal_code: "94105",
  gender: "Male",
  hire_date: "2024-01-15",
  start_date: "2024-01-15",
  exit_date: null,
  work_email: "john.smith@company.com",
  shift_period: "Day",
  shift_schedule: "Monday-Friday",
  shift_time: "9:00 AM - 6:00 PM",
  work_setup: "On-site",
  employment_status: "Full-time",
  hire_type: "Direct Hire",
  staff_source: "Internal",
  status: "Active"
}

export function AgentsDetailModal({ isOpen, onClose, agentId, agentData }: AgentsDetailModalProps) {
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
    const [showCompanySelection, setShowCompanySelection] = React.useState(false)
    const [companySearch, setCompanySearch] = React.useState("")
    const [companies, setCompanies] = React.useState<Array<{id: number, company: string, badge_color: string | null}>>([])
    const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [localAgentData, setLocalAgentData] = React.useState<AgentRecord | null>(null)

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
      if (isOpen && agentData) {
        // Reset active tab to Personal Info when modal opens
        setActiveTab("information")
        
        // Initialize local agent data
        setLocalAgentData(agentData)
        
        setLocalGender(agentData.gender)
        // Initialize birthday date - parse date string directly to avoid timezone issues
        if (agentData.birthday) {
          const [year, month, day] = agentData.birthday.split('-').map(Number)
          setLocalBirthday(new Date(year, month - 1, day))
        } else {
          setLocalBirthday(undefined)
        }
        // Initialize start date - parse date string directly to avoid timezone issues
        if (agentData.start_date) {
          const [year, month, day] = agentData.start_date.split('-').map(Number)
          setLocalStartDate(new Date(year, month - 1, day))
        } else {
          setLocalStartDate(undefined)
        }
        // Initialize exit date - parse date string directly to avoid timezone issues
        if (agentData.exit_date) {
          const [year, month, day] = agentData.exit_date.split('-').map(Number)
          setLocalExitDate(new Date(year, month - 1, day))
        } else {
          setLocalExitDate(undefined)
        }
        // Initialize shift period
        setLocalShiftPeriod(agentData.shift_period)
        // Initialize employment status
        setLocalEmploymentStatus(agentData.employment_status)

        // Initialize input values for editable fields
        const initialValues = {
          first_name: agentData.first_name || '',
          middle_name: agentData.middle_name || '',
          last_name: agentData.last_name || '',
          nickname: agentData.nickname || '',
          phone: agentData.phone || '',
          address: agentData.address || '',
          city: agentData.city || '',
          employee_id: agentData.employee_id || '',
          job_title: agentData.job_title || '',
          shift_schedule: agentData.shift_schedule || '',
          shift_time: agentData.shift_time || '',
          work_setup: agentData.work_setup || '',
          hire_type: agentData.hire_type || '',
          staff_source: agentData.staff_source || ''
        }
        setInputValues(initialValues)
        setOriginalValues(initialValues)
        setHasChanges(false)
      }
    }, [isOpen, agentData])

  // Fetch companies when company selection is opened
  React.useEffect(() => {
    if (showCompanySelection) {
      fetchCompanies(companySearch)
    }
  }, [showCompanySelection, companySearch])

  // Use local agent data if available, otherwise use original agent data, fallback to static data
  const currentAgentData = localAgentData || agentData
  
  // Debug: Log the current agent data and display data
  console.log('🔄 Current agent data:', {
    member_id: currentAgentData?.member_id,
    member_company: currentAgentData?.member_company,
    member_badge_color: currentAgentData?.member_badge_color
  })
  
  const displayData = currentAgentData ? {
    id: currentAgentData.user_id.toString(),
    first_name: inputValues.first_name || currentAgentData.first_name || "Unknown",
    middle_name: inputValues.middle_name || currentAgentData.middle_name || null,
    last_name: inputValues.last_name || currentAgentData.last_name || "Agent",
    nickname: inputValues.nickname || currentAgentData.nickname || null,
    profile_picture: currentAgentData.profile_picture || null,
    employee_id: inputValues.employee_id || currentAgentData.employee_id || "N/A",
    member_id: currentAgentData.member_id || null,
    member_company: currentAgentData.member_company || null,
    member_badge_color: currentAgentData.member_badge_color || null,
    member_name: (inputValues.first_name || currentAgentData.first_name) && (inputValues.last_name || currentAgentData.last_name) ? `${inputValues.first_name || currentAgentData.first_name} ${inputValues.last_name || currentAgentData.last_name}` : null,
    job_title: inputValues.job_title || currentAgentData.job_title || "Not Specified",
    department: currentAgentData.department_name || "Not Specified",
    email: currentAgentData.work_email || currentAgentData.email || "No email",
    phone: inputValues.phone || currentAgentData.phone || "No phone",
          birthday: localBirthday ? `${localBirthday.getFullYear()}-${String(localBirthday.getMonth() + 1).padStart(2, '0')}-${String(localBirthday.getDate()).padStart(2, '0')}` : (currentAgentData.birthday || null),
    city: inputValues.city || currentAgentData.city || null,
    address: inputValues.address || currentAgentData.address || null,
    gender: localGender !== null ? localGender : (currentAgentData.gender || null),
    start_date: localStartDate ? `${localStartDate.getFullYear()}-${String(localStartDate.getMonth() + 1).padStart(2, '0')}-${String(localStartDate.getDate()).padStart(2, '0')}` : (currentAgentData.start_date || null),
    exit_date: localExitDate ? `${localExitDate.getFullYear()}-${String(localExitDate.getMonth() + 1).padStart(2, '0')}-${String(localExitDate.getDate()).padStart(2, '0')}` : (currentAgentData.exit_date || null),
    work_email: currentAgentData.work_email || null,
    shift_period: localShiftPeriod !== null ? localShiftPeriod : (currentAgentData.shift_period || null),
    shift_schedule: inputValues.shift_schedule || currentAgentData.shift_schedule || null,
    shift_time: inputValues.shift_time || currentAgentData.shift_time || null,
    work_setup: inputValues.work_setup || currentAgentData.work_setup || null,
    employment_status: localEmploymentStatus !== null ? localEmploymentStatus : (currentAgentData.employment_status || null),
    hire_type: inputValues.hire_type || currentAgentData.hire_type || null,
    staff_source: inputValues.staff_source || currentAgentData.staff_source || null,
    status: currentAgentData.exit_date ? "Inactive" : "Active"
  } : staticAgentData

  // Check if there are unsaved changes
  const hasUnsavedChanges = React.useMemo(() => {
    if (!localAgentData) return false
    
    // Check for input field changes
    const hasFieldChanges = Object.keys(inputValues).some(fieldName => {
      const currentValue = inputValues[fieldName]
      const originalValue = originalValues[fieldName]
      return currentValue !== originalValue
    })
    
    // Check for other field changes by comparing with original values
    const hasOtherChanges = 
      localGender !== (agentData?.gender || null) ||
      (localBirthday?.toISOString().split('T')[0] || null) !== (agentData?.birthday || null) ||
      (localStartDate?.toISOString().split('T')[0] || null) !== (agentData?.start_date || null) ||
      (localExitDate?.toISOString().split('T')[0] || null) !== (agentData?.exit_date || null) ||
      localShiftPeriod !== (agentData?.shift_period || null) ||
      localEmploymentStatus !== (agentData?.employment_status || null)
    
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
          gender: { current: localGender, original: agentData?.gender },
          birthday: { current: localBirthday?.toISOString().split('T')[0], original: agentData?.birthday },
          startDate: { current: localStartDate?.toISOString().split('T')[0], original: agentData?.start_date },
          exitDate: { current: localExitDate?.toISOString().split('T')[0], original: agentData?.exit_date },
          shiftPeriod: { current: localShiftPeriod, original: agentData?.shift_period },
          employmentStatus: { current: localEmploymentStatus, original: agentData?.employment_status }
        }
      })
    }
    
    return hasChanges
  }, [inputValues, originalValues, localAgentData, agentData, localGender, localBirthday, localStartDate, localExitDate, localShiftPeriod, localEmploymentStatus])

  // Auto-save function that can be called before closing
  const autoSaveBeforeClose = async (): Promise<boolean> => {
    if (!localAgentData || !hasUnsavedChanges) {
      console.log('🔄 No changes to save, closing directly')
      return true // No need to save, can close
    }

    try {
      console.log('🔄 Auto-saving changes before closing...')
      console.log('🔄 Current state:', {
        localAgentData: localAgentData?.user_id,
        hasUnsavedChanges,
        inputValues,
        originalValues,
        localGender,
        localBirthday: localBirthday?.toISOString().split('T')[0],
        localStartDate: localStartDate?.toISOString().split('T')[0],
        localExitDate: localExitDate?.toISOString().split('T')[0],
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
      if (localGender !== agentData?.gender) {
        allUpdates.gender = localGender
        console.log(`🔄 Gender change detected:`, { current: localGender, original: agentData?.gender })
      }
      if (localBirthday) {
        const birthdayStr = `${localBirthday.getFullYear()}-${String(localBirthday.getMonth() + 1).padStart(2, '0')}-${String(localBirthday.getDate()).padStart(2, '0')}`
        if (birthdayStr !== agentData?.birthday) {
          allUpdates.birthday = birthdayStr
          console.log(`🔄 Birthday change detected:`, { current: birthdayStr, original: agentData?.birthday })
        }
      }
      if (localStartDate) {
        const startDateStr = `${localStartDate.getFullYear()}-${String(localStartDate.getMonth() + 1).padStart(2, '0')}-${String(localStartDate.getDate()).padStart(2, '0')}`
        if (startDateStr !== agentData?.start_date) {
          allUpdates.start_date = startDateStr
          console.log(`🔄 Start date change detected:`, { current: startDateStr, original: agentData?.start_date })
        }
      }
      if (localExitDate) {
        const exitDateStr = `${localExitDate.getFullYear()}-${String(localExitDate.getMonth() + 1).padStart(2, '0')}-${String(localExitDate.getDate()).padStart(2, '0')}`
        if (exitDateStr !== agentData?.exit_date) {
          allUpdates.exit_date = exitDateStr
          console.log(`🔄 Exit date change detected:`, { current: exitDateStr, original: agentData?.exit_date })
        }
      }
      if (localShiftPeriod !== agentData?.shift_period) {
        allUpdates.shift_period = localShiftPeriod
        console.log(`🔄 Shift period change detected:`, { current: localShiftPeriod, original: agentData?.shift_period })
      }
      if (localEmploymentStatus !== agentData?.employment_status) {
        allUpdates.employment_status = localEmploymentStatus
        console.log(`🔄 Employment status change detected:`, { current: localEmploymentStatus, original: agentData?.employment_status })
      }
      
      console.log('🔄 All updates to send:', allUpdates)
      
      // Send all updates to the consolidated endpoint
      if (Object.keys(allUpdates).length > 0) {
        console.log('🔄 Sending update request to:', `/api/agents/${localAgentData.user_id}/update/`)
        
        const response = await fetch(`/api/agents/${localAgentData.user_id}/update/`, {
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
      agent: localAgentData?.user_id, 
      hasUnsavedChanges, 
      isOpen,
      localAgentData: !!localAgentData
    })
    
    if (localAgentData && hasUnsavedChanges) {
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
        hasLocalAgent: !!localAgentData,
        hasUnsavedChanges,
        inputValues,
        originalValues
      })
      onClose() // Call the original onClose prop
    }
  }

  // Helper functions to manage company selection panel
  const openCompanySelection = () => {
    setShowCompanySelection(true)
    console.log('🔍 Company selection opened:', true)
  }

  const closeCompanySelection = () => {
    setShowCompanySelection(false)
    console.log('📝 Company selection closed')
  }

  // Fetch companies from members table
  const fetchCompanies = async (searchTerm: string = "", page: number = 1) => {
    try {
      setIsLoadingCompanies(true)
      console.log('🔍 Fetching companies with search term:', searchTerm)
      
      const params = new URLSearchParams({
        page: String(page),
        limit: '1000', // Get all companies for selection
        search: searchTerm,
        sortField: 'company',
        sortDirection: 'asc'
      })
      
      const url = `/api/members?${params.toString()}`
      console.log('🔍 API URL:', url)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch companies')
      }
      
      const data = await response.json()
      console.log('🔍 API response:', data)
      console.log('🔍 Companies found:', data.members?.length || 0)
      
      setCompanies(data.members || [])
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  // Handle company selection
  const handleCompanySelect = async (companyId: number, companyName: string, badgeColor: string | null) => {
    try {
      if (!agentData?.user_id) {
        console.error('No agent user_id available')
        return
      }

      console.log('🔄 Assigning agent to company:', { companyId, companyName, badgeColor })
      
      // API call to update agent's member_id in database
      const response = await fetch(`/api/agents/${agentData.user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: companyId
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update agent company: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Agent company updated successfully:', result)

      // Update local state to reflect the change
      if (localAgentData) {
        // Update the local agent data with new company info
        const updatedAgentData = {
          ...localAgentData,
          member_id: companyId,
          member_company: companyName,
          member_badge_color: badgeColor
        }
        
        // Update local state so UI reflects the change immediately
        setLocalAgentData(updatedAgentData)
        console.log('🔄 Local agent data updated with new company:', updatedAgentData)
      }

      // Reset shift period and employment status when company changes
      setLocalShiftPeriod(null)
      setLocalEmploymentStatus(null)
      
      // Close company selection
      closeCompanySelection()
      
    } catch (error) {
      console.error('❌ Failed to update agent company:', error)
      // You could add a toast notification here for user feedback
    }
  }

  // Real-time updates for all agent changes
  console.log('🔄 Initializing real-time hook for agents modal (all changes)')
  const { isConnected: isRealtimeConnected } = useRealtimeMembers({
    onAgentMemberChanged: async (updatedAgent, oldAgent, notificationData) => {
      console.log('🔄 Real-time: Agent member assignment change received in modal:', { 
        updatedAgent, 
        oldAgent, 
        currentAgentId: localAgentData?.user_id,
        modalIsOpen: isOpen,
        hasLocalAgent: !!localAgentData
      })
      
      // Only process updates for the current agent
      if (localAgentData && updatedAgent.user_id === localAgentData.user_id) {
        console.log('🔄 Real-time: Processing member assignment change for current agent:', updatedAgent)
        
        // Update the member_id immediately
        setLocalAgentData(prevAgent => {
          if (!prevAgent) return prevAgent
          
          return {
            ...prevAgent,
            member_id: updatedAgent.member_id
          }
        })
        
        // If member_id changed, fetch the updated company information
        if (updatedAgent.member_id !== oldAgent?.member_id) {
          try {
            console.log('🔄 Fetching updated company information for member_id:', updatedAgent.member_id)
            const response = await fetch(`/api/agents/${updatedAgent.user_id}`)
            if (response.ok) {
              const responseData = await response.json()
              const freshAgentData = responseData.agent // Extract agent from response
              console.log('🔄 Fetched fresh agent data with company info:', freshAgentData)
              console.log('🔄 Company info from API:', {
                member_id: freshAgentData.member_id,
                member_company: freshAgentData.member_company,
                member_badge_color: freshAgentData.member_badge_color
              })
              
              // Update local agent data with fresh company information
              setLocalAgentData(prevAgent => {
                if (!prevAgent) return prevAgent
                
                const updatedAgent = {
                  ...prevAgent,
                  member_id: freshAgentData.member_id,
                  member_company: freshAgentData.member_company,
                  member_badge_color: freshAgentData.member_badge_color
                }
                
                console.log('🔄 Updated localAgentData with company info:', {
                  member_id: updatedAgent.member_id,
                  member_company: updatedAgent.member_company,
                  member_badge_color: updatedAgent.member_badge_color
                })
                
                return updatedAgent
              })
            }
          } catch (error) {
            console.error('❌ Failed to fetch updated agent data:', error)
          }
        }
        
        console.log('🔄 Updated agent member assignment in real-time')

      } else {
        console.log('🔄 Real-time: Update not for current agent, skipping')
      }
    },
    onPersonalInfoChanged: async (personalInfo, oldPersonalInfo, notificationData) => {
      console.log('🔄 Real-time: Personal info change received in modal:', { 
        personalInfo, 
        oldPersonalInfo, 
        currentAgentId: localAgentData?.user_id,
        modalIsOpen: isOpen,
        hasLocalAgent: !!localAgentData
      })
      
      // Only process updates for the current agent
      if (localAgentData && personalInfo.user_id === localAgentData.user_id) {
        console.log('🔄 Real-time: Processing personal info change for current agent:', personalInfo)
        
        // Update local agent data with new personal info
        setLocalAgentData(prevAgent => {
          if (!prevAgent) return prevAgent
          
          return {
            ...prevAgent,
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
        
        console.log('🔄 Updated agent personal info in real-time')
      } else {
        console.log('🔄 Real-time: Personal info update not for current agent, skipping')
      }
    },
    onJobInfoChanged: async (jobInfo, oldJobInfo, notificationData) => {
      console.log('🔄 Real-time: Job info change received in modal:', { 
        jobInfo, 
        oldJobInfo, 
        currentAgentId: localAgentData?.user_id,
        modalIsOpen: isOpen,
        hasLocalAgent: !!localAgentData
      })
      
      // Only process updates for the current agent
      if (localAgentData && jobInfo.user_id === localAgentData.user_id) {
        console.log('🔄 Real-time: Processing job info change for current agent:', jobInfo)
        
        // Update local agent data with new job info
        setLocalAgentData(prevAgent => {
          if (!prevAgent) return prevAgent
          
          return {
            ...prevAgent,
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
        
        console.log('🔄 Updated agent job info in real-time')
      } else {
        console.log('🔄 Real-time: Job info update not for current agent, skipping')
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
    if (!comment.trim() || !agentData?.user_id || isSubmittingComment) return

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
      const response = await fetch(`/api/agents/${agentData.user_id}/comments`, {
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
        <DialogTitle className="sr-only">Agent Details</DialogTitle>
        <div className="flex h-[95vh]">
          {/* Left Panel - Form */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
              <div className="flex items-center gap-3">
                <Badge className="text-xs h-6 flex items-center rounded-[6px]">
                  Agent
                </Badge>
              </div>
            </div>

            {/* Agent Header */}
            <div className="px-6 py-5">
              {/* Avatar and Agent Name */}
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={agentData?.profile_picture || "/avatars/shadcn.svg"} alt="Agent Avatar" />
                  <AvatarFallback className="text-2xl">
                    {displayData.first_name[0]}{displayData.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-2xl font-semibold mb-2">
                    {displayData.first_name} {displayData.last_name}
                  </div>
                </div>
              </div>
              
              {/* Agent Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Member */}
                <div className="flex items-center gap-2">
                  <IconBuilding className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Member:</span>
                  {displayData.member_company ? (
                    <Badge
                      variant="outline"
                      className="border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={openCompanySelection}
                      style={{
                        backgroundColor: withAlpha(displayData.member_badge_color || '#999999', 0.2),
                        borderColor: withAlpha(displayData.member_badge_color || '#999999', 0.4),
                        color: theme === 'dark' ? '#ffffff' : (displayData.member_badge_color || '#6B7280'),
                      }}
                    >
                      <span className="truncate inline-block max-w-[16rem] align-bottom">{displayData.member_company}</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20 px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center border-dashed"
                      onClick={openCompanySelection}
                    >
                      Select Company
                    </Badge>
                  )}
                </div>

                {/* Department */}
                <div className="flex items-center gap-2">
                  <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{displayData.department}</span>
                </div>

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
                    {displayData.status}
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

                       {/* Contact Information */}
                       <DataFieldRow
                         icon={<IconMail className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Email"
                         fieldName="email"
                         value={displayData.email}
                         onSave={() => {}}
                         placeholder="-"
                         readOnly={true}
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
                         value={displayData.work_email}
                         onSave={() => {}}
                         placeholder="-"
                         readOnly={true}
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
                  {showCompanySelection ? 'Select Companies' : 'Activity'}
                </h3>
              {!showCompanySelection && (
                <button
                  type="button"
                  onClick={openCompanySelection}
                  className="text-sm text-primary hover:text-primary/80 transition-all duration-300 cursor-pointer flex items-center gap-2 group"
                >


                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 bg-[#ebebeb] dark:bg-[#0a0a0a]">
              {showCompanySelection ? (
                /* Company Selection Content */
                <div className="flex flex-col h-full">
                  {/* Search Input */}
                  <div className="space-y-3 flex-shrink-0">
                    <div className="relative">
                      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search companies..."
                        value={companySearch}
                        onChange={(e) => {
                          console.log('🔍 Search input changed:', e.target.value)
                          setCompanySearch(e.target.value)
                        }}
                        className="pl-9"
                      />
                      {companySearch && (
                        <button
                          onClick={() => setCompanySearch('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <IconX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Companies List */}
                  <div 
                    className="space-y-3 flex-1 overflow-y-auto min-h-0 px-2 py-4"
                  >
                    {isLoadingCompanies ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, index) => (
                          <div key={index} className="flex items-center gap-3 p-4 border bg-muted/20 dark:bg-muted/30 border-border rounded-lg">
                            <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : companies.length > 0 ? (
                      (() => {
                        console.log('🔍 Rendering companies:', companies)
                        return companies.map((company) => (
                          <div
                            key={company.id}
                            onClick={() => handleCompanySelect(company.id, company.company, company.badge_color)}
                            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 ${
                              !company.badge_color ? 'bg-gray-50 dark:bg-gray-600/20 border-gray-300 dark:border-gray-600/20 text-gray-700 dark:text-gray-300' : ''
                            }`}
                            style={{
                              backgroundColor: company.badge_color ? `${company.badge_color}20` : undefined,
                              borderColor: company.badge_color ? `${company.badge_color}40` : undefined,
                              color: theme === 'dark' ? '#ffffff' : (company.badge_color || undefined)
                            }}
                          >
                            <span className="text-sm font-medium truncate">{company.company}</span>
                          </div>
                        ))
                      })()
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No Companies Found</p>
                      </div>
                    )}
                  </div>

                  {/* Done Button */}
                  <div className="flex-shrink-0">
                    <Button
                      onClick={closeCompanySelection}
                      className="w-full"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                /* Activity Content - Shows agent activity and recent changes */
                <div className="space-y-4">
                  {agentData?.user_id ? (
                    <MembersActivityLog 
                      memberId={agentData.user_id} 
                      companyName={agentData.first_name && agentData.last_name ? `${agentData.first_name} ${agentData.last_name}` : 'Unknown Agent'} 
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
            {!showCompanySelection && (
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
    </Dialog>
  )
}
