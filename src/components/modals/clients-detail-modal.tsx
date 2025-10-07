"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconCalendar, IconUser, IconBuilding, IconMapPin, IconPhone, IconMail, IconId, IconBriefcase, IconCircle, IconSearch, IconX, IconGenderMale, IconGenderFemale, IconMinus, IconClock } from "@tabler/icons-react"
import { useRealtimeMembers } from '@/hooks/use-realtime-members'
import { SendHorizontal, Target } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DataFieldRow } from "@/components/ui/fields"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { Popover, PopoverContent, PopoverTrigger, PopoverItem } from "@/components/ui/popover"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { MembersActivityLog } from "@/components/members-activity-log"

interface ClientsDetailModalProps {
  isOpen: boolean
  onClose: () => void
  clientId?: string
  clientData?: ClientRecord
}

interface ClientRecord {
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
  // Client specific fields
  member_id: number | null
  member_company: string | null
  member_badge_color: string | null
  station_id: string | null
  department_id: number | null
  department_name: string | null
}


export function ClientsDetailModal({ isOpen, onClose, clientId, clientData }: ClientsDetailModalProps) {
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
  const [showCompanySelection, setShowCompanySelection] = React.useState(false)
  const [companySearch, setCompanySearch] = React.useState("")
  const [companies, setCompanies] = React.useState<Array<{id: number, company: string, badge_color: string | null}>>([])
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(false)
  const [localClientData, setLocalClientData] = React.useState<ClientRecord | null>(null)

  // Add local state for editable text fields
  const [inputValues, setInputValues] = React.useState<Record<string, string>>({
    first_name: '',
    middle_name: '',
    last_name: '',
    nickname: '',
    phone: '',
    address: '',
    city: ''
  })

  // Add original values for change tracking
  const [originalValues, setOriginalValues] = React.useState<Record<string, string>>({
    first_name: '',
    middle_name: '',
    last_name: '',
    nickname: '',
    phone: '',
    address: '',
    city: ''
  })

  // Add change tracking state
  const [hasChanges, setHasChanges] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Realtime functionality - using useRealtimeMembers for specific callbacks
  const { isConnected: isRealtimeConnected } = useRealtimeMembers({
    onClientMemberChanged: async (updatedClient, oldClient, notificationData) => {
      console.log('🔄 Real-time: Client member assignment change received in modal:', { 
        updatedClient, 
        oldClient, 
        currentClientId: localClientData?.user_id,
        modalIsOpen: isOpen,
        hasLocalClient: !!localClientData
      })
      
      // Only process updates for the current client
      if (localClientData && updatedClient.user_id === localClientData.user_id) {
        console.log('🔄 Real-time: Processing member assignment change for current client:', updatedClient)
        
        // Update the member_id immediately
        setLocalClientData(prevClient => {
          if (!prevClient) return prevClient
          
          return {
            ...prevClient,
            member_id: updatedClient.member_id
          }
        })
        
        // If member_id changed, fetch the updated company information
        if (updatedClient.member_id !== oldClient?.member_id) {
          try {
            console.log('🔄 Fetching updated company information for member_id:', updatedClient.member_id)
            const response = await fetch(`/api/clients/${updatedClient.user_id}`)
            if (response.ok) {
              const responseData = await response.json()
              const freshClientData = responseData.client // Extract client from response
              console.log('🔄 Fetched fresh client data with company info:', freshClientData)
              console.log('🔄 Company info from API:', {
                member_id: freshClientData.member_id,
                member_company: freshClientData.member_company,
                member_badge_color: freshClientData.member_badge_color
              })
              
              // Update local client data with fresh company information
              setLocalClientData(prevClient => {
                if (!prevClient) return prevClient
                
                const updatedClient = {
                  ...prevClient,
                  member_id: freshClientData.member_id,
                  member_company: freshClientData.member_company,
                  member_badge_color: freshClientData.member_badge_color
                }
                
                console.log('🔄 Updated localClientData with company info:', {
                  member_id: updatedClient.member_id,
                  member_company: updatedClient.member_company,
                  member_badge_color: updatedClient.member_badge_color
                })
                
                return updatedClient
              })
            }
          } catch (error) {
            console.error('❌ Failed to fetch updated client data:', error)
          }
        }
        
        console.log('🔄 Updated client member assignment in real-time')
      } else {
        console.log('🔄 Real-time: Update not for current client, skipping')
      }
    },
    onPersonalInfoChanged: async (personalInfo, oldPersonalInfo, notificationData) => {
      console.log('🔄 Real-time: Personal info change received in modal:', { 
        personalInfo, 
        oldPersonalInfo, 
        currentClientId: localClientData?.user_id,
        modalIsOpen: isOpen,
        hasLocalClient: !!localClientData
      })
      
      // Only process updates for the current client
      if (localClientData && personalInfo.user_id === localClientData.user_id) {
        console.log('🔄 Real-time: Processing personal info change for current client:', personalInfo)
        
        // Update local client data with new personal info
        setLocalClientData(prevClient => {
          if (!prevClient) return prevClient
          
          return {
            ...prevClient,
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
        
        console.log('🔄 Updated client personal info in real-time')
      } else {
        console.log('🔄 Real-time: Personal info update not for current client, skipping')
      }
    }
  })

  // Initialize input values when modal opens
  React.useEffect(() => {
    if (isOpen && clientData) {
      // Reset active tab to Personal Info when modal opens
      setActiveTab("information")
      
      // Initialize local client data
      setLocalClientData(clientData)
      
      setLocalGender(clientData.gender)
      // Initialize birthday date - parse date string directly to avoid timezone issues
      if (clientData.birthday) {
        const [year, month, day] = clientData.birthday.split('-').map(Number)
        setLocalBirthday(new Date(year, month - 1, day))
      } else {
        setLocalBirthday(undefined)
      }

      // Initialize input values for editable fields
      const initialValues = {
        first_name: clientData.first_name || '',
        middle_name: clientData.middle_name || '',
        last_name: clientData.last_name || '',
        nickname: clientData.nickname || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        city: clientData.city || ''
      }
      setInputValues(initialValues)
      setOriginalValues(initialValues)
      setHasChanges(false)
    }
  }, [isOpen, clientData])

  // Fetch companies when company selection is opened
  React.useEffect(() => {
    if (showCompanySelection) {
      fetchCompanies(companySearch)
    }
  }, [showCompanySelection, companySearch])

  // Use local client data if available, otherwise use original client data, fallback to static data
  const currentClientData = localClientData || clientData
  
  const displayData = currentClientData ? {
    id: currentClientData.user_id.toString(),
    first_name: inputValues.first_name || currentClientData.first_name || "Unknown",
    middle_name: inputValues.middle_name || currentClientData.middle_name || null,
    last_name: inputValues.last_name || currentClientData.last_name || "Client",
    nickname: inputValues.nickname || currentClientData.nickname || null,
    profile_picture: currentClientData.profile_picture || null,
    member_id: currentClientData.member_id || null,
    member_company: currentClientData.member_company || null,
    member_badge_color: currentClientData.member_badge_color || null,
    member_name: (inputValues.first_name || currentClientData.first_name) && (inputValues.last_name || currentClientData.last_name) ? `${inputValues.first_name || currentClientData.first_name} ${inputValues.last_name || currentClientData.last_name}` : null,
    department: currentClientData.department_name || "Not Specified",
    email: currentClientData.email || "No email",
    phone: inputValues.phone || currentClientData.phone || "No phone",
    birthday: (localBirthday && !isNaN(localBirthday.getTime())) ? `${localBirthday.getFullYear()}-${String(localBirthday.getMonth() + 1).padStart(2, '0')}-${String(localBirthday.getDate()).padStart(2, '0')}` : (currentClientData.birthday || null),
    city: inputValues.city || currentClientData.city || null,
    address: inputValues.address || currentClientData.address || null,
    gender: localGender !== null ? localGender : (currentClientData.gender || null),
    status: "Active"
  } : {
    id: "N/A",
    first_name: "Unknown",
    middle_name: null,
    last_name: "Client",
    nickname: null,
    profile_picture: null,
    member_id: null,
    member_company: null,
    member_badge_color: null,
    member_name: null,
    department: "Not Specified",
    email: "No email",
    phone: "No phone",
    birthday: null,
    city: null,
    address: null,
    gender: null,
    status: "Unknown"
  }

  // Check if there are unsaved changes
  const hasUnsavedChanges = React.useMemo(() => {
    if (!localClientData) return false
    
    // Check for input field changes
    const hasFieldChanges = Object.keys(inputValues).some(fieldName => {
      const currentValue = inputValues[fieldName]
      const originalValue = originalValues[fieldName]
      return currentValue !== originalValue
    })
    
    // Check for other field changes by comparing with original values
    const hasOtherChanges = 
      localGender !== (clientData?.gender || null) ||
      (localBirthday && !isNaN(localBirthday.getTime()) ? localBirthday.toISOString().split('T')[0] : null) !== (clientData?.birthday || null)
    
    const hasChanges = hasFieldChanges || hasOtherChanges
    
    return hasChanges
  }, [inputValues, originalValues, localClientData, clientData, localGender, localBirthday])

  // Auto-save function that can be called before closing
  const autoSaveBeforeClose = async (): Promise<boolean> => {
    if (!localClientData || !hasUnsavedChanges) {
      console.log('🔄 No changes to save, closing directly')
      return true // No need to save, can close
    }

    try {
      console.log('🔄 Auto-saving changes before closing...')
      setIsSaving(true)
      
      // Prepare all updates in one object
      const allUpdates: Record<string, any> = {}
      
      // Add input field changes
      Object.keys(inputValues).forEach(fieldName => {
        const currentValue = inputValues[fieldName]
        const originalValue = originalValues[fieldName]
        if (currentValue !== originalValue) {
          allUpdates[fieldName] = currentValue || null
        }
      })
      
      // Add other field changes
      if (localGender !== clientData?.gender) {
        allUpdates.gender = localGender
      }
      if (localBirthday && !isNaN(localBirthday.getTime())) {
        const birthdayStr = `${localBirthday.getFullYear()}-${String(localBirthday.getMonth() + 1).padStart(2, '0')}-${String(localBirthday.getDate()).padStart(2, '0')}`
        if (birthdayStr !== clientData?.birthday) {
          allUpdates.birthday = birthdayStr
        }
      }
      
      // Send all updates to the consolidated endpoint
      if (Object.keys(allUpdates).length > 0) {
        const response = await fetch(`/api/clients/${localClientData.user_id}/update/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(allUpdates)
        })
        
        if (!response.ok) {
          throw new Error(`Failed to update client: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('✅ Client updated successfully:', result)
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
    if (localClientData && hasUnsavedChanges) {
      try {
        const saveSuccess = await autoSaveBeforeClose()
        if (saveSuccess) {
          onClose()
        } else {
          alert('Failed to save changes. Please try again.')
          return
        }
      } catch (error) {
        alert('Failed to save changes. Please try again.')
        return
      }
    } else {
      onClose()
    }
  }

  // Helper functions to manage company selection panel
  const openCompanySelection = () => {
    setShowCompanySelection(true)
  }

  const closeCompanySelection = () => {
    setShowCompanySelection(false)
  }

  // Fetch companies from members table
  const fetchCompanies = async (searchTerm: string = "", page: number = 1) => {
    try {
      setIsLoadingCompanies(true)
      const params = new URLSearchParams({
        page: String(page),
        limit: '1000',
        search: searchTerm,
        sortField: 'company',
        sortDirection: 'asc'
      })
      
      const response = await fetch(`/api/members?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch companies')
      }
      
      const data = await response.json()
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
      if (!clientData?.user_id) {
        console.error('No client user_id available')
        return
      }

      const response = await fetch(`/api/clients/${clientData.user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: companyId
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update client company: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Client company updated successfully:', result)

      // Update local state to reflect the change
      if (localClientData) {
        const updatedClientData = {
          ...localClientData,
          member_id: companyId,
          member_company: companyName,
          member_badge_color: badgeColor
        }
        setLocalClientData(updatedClientData)
      }
      
      closeCompanySelection()
      
    } catch (error) {
      console.error('❌ Failed to update client company:', error)
    }
  }

  // Handle input changes for editable fields
  const handleInputChange = (fieldName: string, value: string) => {
    if (fieldName === 'phone') {
      const numericValue = value.replace(/[^0-9]/g, '')
      setInputValues(prev => ({ ...prev, [fieldName]: numericValue }))
    } else {
      setInputValues(prev => ({ ...prev, [fieldName]: value }))
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !clientData?.user_id || isSubmittingComment) return

    setIsSubmittingComment(true)

    const newComment = {
      id: Date.now().toString(),
      comment: comment.trim(),
      user_name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Unknown User',
      created_at: new Date().toISOString()
    }

    setCommentsList((prev) => [newComment, ...prev])
    setComment("")

    try {
      const response = await fetch(`/api/clients/${clientData.user_id}/comments`, {
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
        <DialogTitle className="sr-only">Client Details</DialogTitle>
        <div className="flex h-[95vh]">
          {/* Left Panel - Form */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
              <div className="flex items-center gap-3">
                <Badge className="text-xs h-6 flex items-center rounded-[6px]">
                  Client
                </Badge>
              </div>
            </div>

            {/* Client Header */}
            <div className="px-6 py-5">
              {/* Avatar and Client Name */}
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={clientData?.profile_picture || "/avatars/shadcn.svg"} alt="Client Avatar" />
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
              
              {/* Client Metadata Grid */}
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
                    className="px-3 py-1 font-medium text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
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
                        { title: "Additional Info", value: "additional" }
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
                                      if (displayData.gender !== genderOption.value) {
                                        setLocalGender(genderOption.value)
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

                {/* Additional Info Tab */}
                <TabsContent value="additional" className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between min-h-[40px]">
                      <h3 className="text-lg font-medium text-muted-foreground">Additional Information</h3>
                    </div>
                    <div className="rounded-lg border border-[#cecece99] dark:border-border overflow-hidden">
                      {/* Client ID */}
                      <DataFieldRow
                        icon={<IconId className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Client ID"
                        fieldName="client_id"
                        value={displayData.id}
                        onSave={() => {}}
                        placeholder="-"
                        readOnly={true}
                      />

                      {/* User Type */}
                      <DataFieldRow
                        icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="User Type"
                        fieldName="user_type"
                        value="Client"
                        onSave={() => {}}
                        placeholder="-"
                        readOnly={true}
                      />

                      {/* Member ID */}
                      <DataFieldRow
                        icon={<IconBuilding className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Member ID"
                        fieldName="member_id"
                        value={displayData.member_id ? displayData.member_id.toString() : "-"}
                        onSave={() => {}}
                        placeholder="-"
                        readOnly={true}
                      />

                      {/* Department ID */}
                      <DataFieldRow
                        icon={<IconBriefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Department ID"
                        fieldName="department_id"
                        value={currentClientData?.department_id ? currentClientData.department_id.toString() : "-"}
                        onSave={() => {}}
                        placeholder="-"
                        readOnly={true}
                      />

                      {/* Station ID */}
                      <DataFieldRow
                        icon={<IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Station ID"
                        fieldName="station_id"
                        value={currentClientData?.station_id || "-"}
                        onSave={() => {}}
                        placeholder="-"
                        readOnly={true}
                      />

                      {/* Registration Date */}
                      <DataFieldRow
                        icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Registration Date"
                        fieldName="registration_date"
                        value="2024-01-15"
                        onSave={() => {}}
                        placeholder="-"
                        readOnly={true}
                      />

                      {/* Last Login */}
                      <DataFieldRow
                        icon={<IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Last Login"
                        fieldName="last_login"
                        value="2024-12-19 14:30:00"
                        onSave={() => {}}
                        placeholder="-"
                        readOnly={true}
                      />

                      {/* Account Status */}
                      <DataFieldRow
                        icon={<IconCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Account Status"
                        fieldName="account_status"
                        value="Active"
                        onSave={() => {}}
                        placeholder="-"
                        readOnly={true}
                      />

                      {/* Profile Picture URL */}
                      <DataFieldRow
                        icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        label="Profile Picture"
                        fieldName="profile_picture"
                        value={displayData.profile_picture || "No profile picture"}
                        onSave={() => {}}
                        placeholder="-"
                        readOnly={true}
                        isLast={true}
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
                      companies.map((company) => (
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
                /* Activity Content - Shows client activity and recent changes */
                <div className="space-y-4">
                  {clientData?.user_id ? (
                    <MembersActivityLog 
                      memberId={clientData.user_id} 
                      companyName={clientData.first_name && clientData.last_name ? `${clientData.first_name} ${clientData.last_name}` : 'Unknown Client'} 
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
    </Dialog>
  )
}