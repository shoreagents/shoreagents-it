"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconVideo, IconCash, IconClockHour4 } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTheme } from "next-themes"

interface RecruitsDetailModalProps {
  recruit: Recruit | null
  isOpen: boolean
  onClose: () => void
}

interface StatusOption {
  value: string
  label: string
  icon: string
  color: string
}

interface Recruit {
  id: number
  bpoc_application_id: string
  applicant_id: string
  job_id: number
  resume_slug: string
  status: string
  previous_status: string
  status_changed_at: string
  created_at: string
  updated_at: string
  video_introduction_url: string | null
  current_salary: number | null
  expected_monthly_salary: number | null
  shift: string | null
  recruiter_id: number | null
  // Additional fields from joins
  applicant_name?: string
  applicant_email?: string
  job_title?: string
  company_name?: string
  recruiter_name?: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "submitted":
      return "text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20"
    case "screened":
      return "text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20"
    case "for verification":
      return "text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20"
    case "verified":
      return "text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20"
    case "initial interview":
      return "text-indigo-700 dark:text-white border-indigo-600/20 bg-indigo-50 dark:bg-indigo-600/20"
    case "final interview":
      return "text-cyan-700 dark:text-white border-cyan-600/20 bg-cyan-50 dark:bg-cyan-600/20"
    case "failed":
      return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
    case "passed":
      return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
    case "rejected":
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
    case "withdrawn":
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
    default:
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "submitted":
      return <IconCircle className="h-4 w-4" />
    case "screened":
      return <IconEye className="h-4 w-4" />
    case "for verification":
      return <IconAlertCircle className="h-4 w-4" />
    case "verified":
      return <IconCircle className="h-4 w-4" />
    case "initial interview":
      return <IconUser className="h-4 w-4" />
    case "final interview":
      return <IconUser className="h-4 w-4" />
    case "failed":
      return <IconAlertCircle className="h-4 w-4" />
    case "passed":
      return <IconCircle className="h-4 w-4" />
    case "rejected":
      return <IconCircle className="h-4 w-4" />
    case "withdrawn":
      return <IconCircle className="h-4 w-4" />
    default:
      return <IconInfoCircle className="h-4 w-4" />
  }
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

const formatSalary = (salary: number | null) => {
  if (salary === null) return 'Not specified'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(salary)
}

export function RecruitsDetailModal({ recruit, isOpen, onClose }: RecruitsDetailModalProps) {
  const { theme } = useTheme()
  const [comment, setComment] = React.useState("")
  const [currentStatus, setCurrentStatus] = React.useState<string | null>(null)
  const [statusOptions, setStatusOptions] = React.useState<StatusOption[]>([])
  const [comments, setComments] = React.useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = React.useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)

  // Define status options for recruits
  const getStatusOptions = (): StatusOption[] => {
    return [
      { value: 'submitted', label: 'New', icon: 'blue', color: 'blue' },
      { value: 'screened', label: 'Screened', icon: 'yellow', color: 'yellow' },
      { value: 'for verification', label: 'For Verification', icon: 'orange', color: 'orange' },
      { value: 'verified', label: 'Verified', icon: 'purple', color: 'purple' },
      { value: 'initial interview', label: 'Initial Interview', icon: 'indigo', color: 'indigo' },
      { value: 'final interview', label: 'Final Interview', icon: 'cyan', color: 'cyan' },
      { value: 'failed', label: 'Failed', icon: 'red', color: 'red' },
      { value: 'passed', label: 'Ready for Sale', icon: 'green', color: 'green' },
      { value: 'rejected', label: 'Rejected', icon: 'gray', color: 'gray' },
      { value: 'withdrawn', label: 'Withdrawn', icon: 'gray', color: 'gray' }
    ]
  }

  React.useEffect(() => {
    if (recruit) {
      setCurrentStatus(recruit.status)
      // TODO: Fetch comments when API is ready
      // fetchComments()
    }
    setStatusOptions(getStatusOptions())
  }, [recruit])

  // TODO: Implement comment fetching when API is ready
  const fetchComments = async () => {
    // Placeholder for future implementation
    setIsLoadingComments(false)
    setComments([])
  }

  if (!recruit) return null

  const createdDate = formatDate(recruit.created_at)
  const updatedDate = recruit.updated_at && recruit.updated_at !== recruit.created_at ? formatDate(recruit.updated_at) : null
  const statusChangedDate = recruit.status_changed_at ? formatDate(recruit.status_changed_at) : null

  const copyApplicationId = () => {
    navigator.clipboard.writeText(recruit.bpoc_application_id)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !recruit || isSubmittingComment) return
    
    // TODO: Implement comment submission when API is ready
    setIsSubmittingComment(true)
    setTimeout(() => {
      setComment("")
      setIsSubmittingComment(false)
    }, 1000)
  }

  const handleStatusChange = async (newStatus: string) => {
    setCurrentStatus(newStatus)
    // TODO: Implement status change when API is ready
    console.log('Status change requested:', newStatus)
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0 rounded-xl" style={{ 
          backgroundColor: theme === 'dark' ? '#111111' : '#f8f9fa' 
        }}>
          <div className="flex h-[95vh]">
            {/* Left Panel - Recruit Details */}
            <div className="flex-1 flex flex-col">
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs h-6 flex items-center bg-primary/10 text-primary rounded-[6px]">
                    Recruit
                  </Badge>
                  <span className="text-lg font-mono text-primary">
                    {recruit.bpoc_application_id}
                  </span>
                </div>
              </div>

              {/* Recruit Header */}
              <div className="px-6 py-5">
                {/* Recruit Title */}
                <h1 className="text-2xl font-semibold mb-4">
                  {recruit.job_title ? `Applied for ${recruit.job_title}` : `Application #${recruit.id}`}
                </h1>
                
                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Applicant */}
                  <div className="flex items-center gap-2">
                    <IconUser className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Applicant:</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="" alt="Applicant" />
                        <AvatarFallback className="text-xs">
                          {recruit.applicant_name ? recruit.applicant_name.split(' ').map(n => n[0]).join('') : 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {recruit.applicant_name || `Applicant ${recruit.applicant_id}`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <IconCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Status:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-auto p-0 hover:bg-muted/50 active:bg-muted/70 transition-colors">
                          <Badge variant="outline" className={`${getStatusColor(currentStatus || recruit.status)} px-2 py-1 text-xs cursor-pointer hover:opacity-80 transition-opacity`}>
                            {currentStatus || recruit.status}
                          </Badge>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2">
                        <div className="space-y-1">
                          {statusOptions.map((option) => (
                            <div 
                              key={option.value}
                              className={`flex items-center gap-3 p-1.5 rounded-md cursor-pointer transition-all duration-200 ${
                                (currentStatus || recruit.status) === option.value 
                                  ? 'bg-primary/10 text-primary border border-primary/20' 
                                  : 'hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => handleStatusChange(option.value)}
                            >
                              <div className={`w-3 h-3 rounded-full bg-${option.color}-500`}></div>
                              <span className="text-sm font-medium">{option.label}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Company */}
                  {recruit.company_name && (
                    <div className="flex items-center gap-2">
                      <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Company:</span>
                      <span className="font-medium">
                        {recruit.company_name}
                      </span>
                    </div>
                  )}
                  
                  {/* Job ID */}
                  <div className="flex items-center gap-2">
                    <IconTag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Job ID:</span>
                    <span className="font-medium">{recruit.job_id}</span>
                  </div>
                  
                  {/* Resume Slug */}
                  <div className="flex items-center gap-2">
                    <IconFile className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Resume:</span>
                    <span className="font-medium">{recruit.resume_slug}</span>
                  </div>
                  
                  {/* Dates */}
                  <div className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Applied at:</span>
                    <span className="font-medium">{createdDate.date} • {createdDate.time}</span>
                  </div>
                </div>
              </div>
              
              <div className="px-6">
                <Separator />
              </div>

              {/* Recruit Details */}
              <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0">
                <div className="space-y-6 flex flex-col min-h-full">
                  {/* Salary Information Section */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-lg font-medium mb-2 text-muted-foreground">Salary Information</h3>
                    <div className="rounded-lg p-6 text-sm leading-relaxed border border-[#cecece99] dark:border-border flex-1 min-h-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <IconCash className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Current Salary:</span>
                          <span className="font-medium">{formatSalary(recruit.current_salary)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconCash className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Expected Salary:</span>
                          <span className="font-medium">{formatSalary(recruit.expected_monthly_salary)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconClockHour4 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Shift:</span>
                          <span className="font-medium">{recruit.shift || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Introduction Section */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-lg font-medium mb-2 text-muted-foreground">Video Introduction</h3>
                    <div className={`rounded-lg p-6 text-sm leading-relaxed border border-[#cecece99] dark:border-border flex-1 min-h-0 ${!recruit.video_introduction_url ? 'flex items-center justify-center' : ''}`}> 
                      {recruit.video_introduction_url ? (
                        <div className="flex items-center gap-3">
                          <IconVideo className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium">Video Introduction Available</p>
                            <p className="text-muted-foreground">Click to view the applicant's video introduction</p>
                          </div>
                          <Button size="sm" variant="outline">
                            <IconEye className="h-4 w-4 mr-2" />
                            View Video
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                          <IconVideo className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No Video Introduction</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status History Section */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-lg font-medium mb-2 text-muted-foreground">Status History</h3>
                    <div className="rounded-lg p-6 text-sm leading-relaxed border border-[#cecece99] dark:border-border flex-1 min-h-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Previous Status:</span>
                          <Badge variant="outline" className="px-2 py-1 text-xs">
                            {recruit.previous_status || 'None'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status Changed:</span>
                          <span className="font-medium">
                            {statusChangedDate ? `${statusChangedDate.date} • ${statusChangedDate.time}` : 'Not available'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Last Updated:</span>
                          <span className="font-medium">
                            {updatedDate ? `${updatedDate.date} • ${updatedDate.time}` : 'Not available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
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
