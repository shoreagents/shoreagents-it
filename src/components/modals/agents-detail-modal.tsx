"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconGlobe, IconCreditCard, IconPlus, IconUpload, IconX, IconSearch, IconLink, IconMinus, IconCheck, IconGenderMale, IconGenderFemale, IconGenderNeutrois, IconHelp } from "@tabler/icons-react"
import { useRealtimeMembers } from '@/hooks/use-realtime-members'
import { SendHorizontal } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataFieldRow } from "@/components/ui/fields"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedTabs } from "@/components/ui/animated-tabs"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

// Static agent data for fallback
const staticAgentData = {
  id: "AG001",
  first_name: "John",
  middle_name: "Michael",
  last_name: "Smith",
  nickname: "Johnny",
  profile_picture: null,
  employee_id: "EMP-2024-001",
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
  const [activeTab, setActiveTab] = React.useState("information")
  const [comment, setComment] = React.useState("")
  const [isCommentFocused, setIsCommentFocused] = React.useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
      const [commentsList, setCommentsList] = React.useState<Array<{id: string, comment: string, user_name: string, created_at: string}>>([])
    const [localGender, setLocalGender] = React.useState<string | null>(null)
    const [localBirthday, setLocalBirthday] = React.useState<Date | undefined>(undefined)

      // Initialize local gender when modal opens
    React.useEffect(() => {
      if (isOpen && agentData) {
        setLocalGender(agentData.gender)
        // Initialize birthday date
        if (agentData.birthday) {
          setLocalBirthday(new Date(agentData.birthday))
        } else {
          setLocalBirthday(undefined)
        }
      }
    }, [isOpen, agentData])

  // Use agent data if provided, otherwise use static data
  const displayData = agentData ? {
    id: agentData.user_id.toString(),
    first_name: agentData.first_name || "Unknown",
    middle_name: agentData.middle_name || null,
    last_name: agentData.last_name || "Agent",
    nickname: agentData.nickname || null,
    profile_picture: agentData.profile_picture || null,
    employee_id: agentData.employee_id || "N/A",
    job_title: agentData.job_title || "Not specified",
    department: agentData.department_name || "Not specified",
    email: agentData.work_email || agentData.email || "No email",
    phone: agentData.phone || "No phone",
          birthday: localBirthday ? localBirthday.toISOString().split('T')[0] : (agentData.birthday || null),
    city: agentData.city || null,
    address: agentData.address || null,
    gender: localGender !== null ? localGender : (agentData.gender || null),
    start_date: agentData.start_date || "Not specified",
    exit_date: agentData.exit_date || null,
    work_email: agentData.work_email || null,
    shift_period: agentData.shift_period || null,
    shift_schedule: agentData.shift_schedule || null,
    shift_time: agentData.shift_time || null,
    work_setup: agentData.work_setup || null,
    employment_status: agentData.employment_status || null,
    hire_type: agentData.hire_type || null,
    staff_source: agentData.staff_source || null,
    status: agentData.exit_date ? "Inactive" : "Active"
  } : staticAgentData

  const handleClose = () => {
    onClose()
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
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
        <DialogTitle className="sr-only">Agent Details</DialogTitle>
        <div className="flex h-[95vh]">
          {/* Left Panel - Form */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
              <div className="flex items-center gap-3">
                <Badge className="text-xs h-6 flex items-center rounded-[6px] bg-blue-100 text-blue-800 border-blue-200">
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
              <div className="grid grid-cols-3 gap-4 text-sm">
                {/* Job Title */}
                <div className="flex items-center gap-2">
                  <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Job Title:</span>
                  <span className="font-medium">{displayData.job_title}</span>
                </div>
                
                {/* Status */}
                <div className="flex items-center gap-2">
                  {displayData.status === 'Active' ? (
                    <IconCircle className="h-4 w-4 fill-green-500 stroke-none" />
                  ) : (
                    <IconCircle className="h-4 w-4 fill-red-500 stroke-none" />
                  )}
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

                {/* Department */}
                <div className="flex items-center gap-2">
                  <IconBuilding className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{displayData.department}</span>
                </div>
              </div>
            </div>
            
            <div className="px-6">
              <Separator />
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
                         value={displayData.first_name}
                         onSave={() => {}}
                         placeholder="-"
                       />

                       {/* Middle Name */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Middle Name"
                         fieldName="middle_name"
                         value={displayData.middle_name}
                         onSave={() => {}}
                         placeholder="-"
                       />

                       {/* Last Name */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Last Name"
                         fieldName="last_name"
                         value={displayData.last_name}
                         onSave={() => {}}
                         placeholder="-"
                       />

                       {/* Nickname */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Nickname"
                         fieldName="nickname"
                         value={displayData.nickname}
                         onSave={() => {}}
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
                       />

                       {/* Phone */}
                       <DataFieldRow
                         icon={<IconPhone className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Phone"
                         fieldName="phone"
                         value={displayData.phone}
                         onSave={() => {}}
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
                                 className="h-[33px] w-full justify-between font-normal border-0 bg-transparent dark:bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none hover:bg-muted/50"
                               >
                                 {localBirthday ? localBirthday.toLocaleDateString() : "Select date"}
                                 <IconCalendar className="h-4 w-4 opacity-50" />
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Calendar
                                 mode="single"
                                 selected={localBirthday}
                                 onSelect={(date) => {
                                   setLocalBirthday(date)
                                   // TODO: Implement API call to update birthday in database
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
                                  <span className="text-sm">{displayData.gender || '-'}</span>
                                </div>
                             </PopoverTrigger>
                             <PopoverContent className="w-48 p-2" align="start" side="bottom" sideOffset={4}>
                               <div className="space-y-1">
                                 {[
                                   { value: 'Male', icon: <IconGenderMale className="h-4 w-4 text-muted-foreground" /> },
                                   { value: 'Female', icon: <IconGenderFemale className="h-4 w-4 text-muted-foreground" /> },
                                   { value: 'Other', icon: <IconUser className="h-4 w-4 text-muted-foreground" /> },
                                   { value: 'Prefer Not To Say', icon: <IconMinus className="h-4 w-4 text-muted-foreground" /> }
                                 ].map((genderOption) => {
                                   const isCurrentGender = displayData.gender === genderOption.value;
                                   return (
                                     <div 
                                       key={genderOption.value}
                                       className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                         isCurrentGender 
                                           ? 'bg-primary/10 text-primary border border-primary/20 cursor-default' 
                                           : 'hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground cursor-pointer'
                                       }`}
                                       onClick={isCurrentGender ? undefined : () => {
                                         // Update the gender value
                                         if (displayData.gender !== genderOption.value) {
                                           setLocalGender(genderOption.value)
                                           // TODO: Implement API call to update gender in database
                                           console.log('Gender changed to:', genderOption.value)
                                         }
                                       }}
                                     >
                                       <span className="text-sm">{genderOption.icon}</span>
                                       <span className="text-sm font-medium">{genderOption.value}</span>
                                     </div>
                                   );
                                 })}
                               </div>
                             </PopoverContent>
                           </Popover>
                         }
                       />

                       {/* Address */}
                       <DataFieldRow
                         icon={<IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Address"
                         fieldName="address"
                         value={displayData.address}
                         onSave={() => {}}
                         placeholder="-"
                       />

                       {/* City */}
                       <DataFieldRow
                         icon={<IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="City"
                         fieldName="city"
                         value={displayData.city}
                         onSave={() => {}}
                         placeholder="-"
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
                         value={displayData.employee_id}
                         onSave={() => {}}
                         placeholder="-"
                       />

                       {/* Job Title */}
                       <DataFieldRow
                         icon={<IconBriefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Job Title"
                         fieldName="job_title"
                         value={displayData.job_title}
                         onSave={() => {}}
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
                       />

                       {/* Shift Period */}
                       <DataFieldRow
                         icon={<IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Shift Period"
                         fieldName="shift_period"
                         value={displayData.shift_period}
                         onSave={() => {}}
                         placeholder="-"
                       />

                       {/* Shift Schedule */}
                       <DataFieldRow
                         icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Shift Schedule"
                         fieldName="shift_schedule"
                         value={displayData.shift_schedule}
                         onSave={() => {}}
                         placeholder="-"
                       />

                       {/* Shift Time */}
                       <DataFieldRow
                         icon={<IconClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Shift Time"
                         fieldName="shift_time"
                         value={displayData.shift_time}
                         onSave={() => {}}
                         placeholder="-"
                       />

                       {/* Work Setup */}
                       <DataFieldRow
                         icon={<IconBuilding className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Work Setup"
                         fieldName="work_setup"
                         value={displayData.work_setup}
                         onSave={() => {}}
                         placeholder="-"
                       />

                       {/* Employment Status */}
                       <DataFieldRow
                         icon={<IconCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Employment Status"
                         fieldName="employment_status"
                         value={displayData.employment_status}
                         onSave={() => {}}
                         placeholder="-"
                       />

                       {/* Hire Type */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Hire Type"
                         fieldName="hire_type"
                         value={displayData.hire_type}
                         onSave={() => {}}
                         placeholder="-"
                       />

                       {/* Staff Source */}
                       <DataFieldRow
                         icon={<IconUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Staff Source"
                         fieldName="staff_source"
                         value={displayData.staff_source}
                         onSave={() => {}}
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
                       />

                       {/* Exit Date */}
                       <DataFieldRow
                         icon={<IconCalendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                         label="Exit Date"
                         fieldName="exit_date"
                         value={displayData.exit_date}
                         onSave={() => {}}
                         placeholder="-"
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
              <h3 className="font-medium">Activity</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 bg-[#ebebeb] dark:bg-[#0a0a0a]">
              {/* Activity Content - Shows agent activity and recent changes */}
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
            </div>

            {/* Comment Input Section */}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
