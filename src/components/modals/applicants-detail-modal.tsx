"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconVideo, IconCash, IconClockHour4, IconExternalLink } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTheme } from "next-themes"

interface ApplicantsDetailModalProps {
  applicant: Applicant | null
  isOpen: boolean
  onClose: () => void
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
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "submitted":
      return "text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20"
    case "screened":
      return "text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20"
    case "for verification":
      return "text-teal-700 dark:text-white border-teal-600/20 bg-teal-50 dark:bg-teal-600/20"
    case "verified":
      return "text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20"
    case "initial interview":
      return "text-indigo-700 dark:text-white border-indigo-600/20 bg-indigo-50 dark:bg-indigo-600/20"
    case "final interview":
      return "text-violet-700 dark:text-white border-violet-600/20 bg-violet-600/20"
    case "failed":
      return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
    case "passed":
      return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
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

export function ApplicantsDetailModal({ applicant, isOpen, onClose }: ApplicantsDetailModalProps) {
  const { theme } = useTheme()
  const [comment, setComment] = React.useState("")
  const [currentStatus, setCurrentStatus] = React.useState<string | null>(null)
  const [statusOptions, setStatusOptions] = React.useState<StatusOption[]>([])
  const [comments, setComments] = React.useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = React.useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)

  // Define status options for applicants
  const getStatusOptions = (): StatusOption[] => {
    return [
      { value: 'submitted', label: 'New', icon: 'blue', color: 'blue' },
      { value: 'screened', label: 'Screened', icon: 'orange', color: 'orange' },
      { value: 'for verification', label: 'For Verification', icon: 'teal', color: 'teal' },
      { value: 'verified', label: 'Verified', icon: 'purple', color: 'purple' },
      { value: 'initial interview', label: 'Initial Interview', icon: 'indigo', color: 'indigo' },
      { value: 'final interview', label: 'Final Interview', icon: 'violet', color: 'violet' },
      { value: 'failed', label: 'Failed', icon: 'red', color: 'red' },
      { value: 'passed', label: 'Ready for Sale', icon: 'green', color: 'green' }
    ]
  }

  React.useEffect(() => {
    if (applicant) {
      setCurrentStatus(applicant.status)
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

  if (!applicant) return null

  const createdDate = formatDate(applicant.created_at)
  const updatedDate = applicant.updated_at && applicant.updated_at !== applicant.created_at ? formatDate(applicant.updated_at) : null

  const copyApplicationId = () => {
    navigator.clipboard.writeText(applicant.ticket_id)
  }

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
    setCurrentStatus(newStatus)
    // TODO: Implement status change when API is ready
    console.log('Status change requested:', newStatus)
  }

  const openResume = () => {
    if (applicant.resume_slug) {
      window.open(`https://www.bpoc.io/${applicant.resume_slug}`, '_blank')
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0 rounded-xl" style={{ 
          backgroundColor: theme === 'dark' ? '#111111' : '#f8f9fa' 
        }}>
          <div className="flex h-[95vh]">
            {/* Left Panel - Applicant Details */}
            <div className="flex-1 flex flex-col">
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs h-6 flex items-center bg-primary/10 text-primary rounded-[6px]">
                    Applicant
                  </Badge>
                  <span className="text-lg font-mono text-primary">
                    {applicant.ticket_id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyApplicationId}
                    className="text-xs"
                  >
                    <IconCopy className="h-3 w-3 mr-1" />
                    Copy ID
                  </Button>
                </div>
              </div>

              {/* Applicant Header */}
              <div className="px-6 py-5">
                {/* Applicant Title */}
                <h1 className="text-2xl font-semibold mb-4">
                  {applicant.job_title ? `Applied for ${applicant.job_title}` : `Application #${applicant.id}`}
                </h1>
                
                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Applicant */}
                  <div className="flex items-center gap-2">
                    <IconUser className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Applicant:</span>
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
                    <IconCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Status:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-auto p-0 hover:bg-muted/50 active:bg-muted/70 transition-colors">
                          <Badge variant="outline" className={`${getStatusColor(currentStatus || applicant.status)} px-2 py-1 text-xs cursor-pointer hover:opacity-80 transition-opacity`}>
                            {currentStatus || applicant.status}
                          </Badge>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2">
                        <div className="space-y-1">
                          {statusOptions.map((option) => (
                            <div 
                              key={option.value}
                              className={`flex items-center gap-3 p-1.5 rounded-md cursor-pointer transition-all duration-200 ${
                                (currentStatus || applicant.status) === option.value 
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
                  {applicant.company_name && (
                    <div className="flex items-center gap-2">
                      <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Company:</span>
                      <span className="font-medium">
                        {applicant.company_name}
                      </span>
                    </div>
                  )}
                  
                  {/* User Type */}
                  <div className="flex items-center gap-2">
                    <IconTag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">User Type:</span>
                    <span className="font-medium">
                      {applicant.user_type === 'Internal' ? 'Internal' : 'External'}
                    </span>
                  </div>
                  
                  {/* Resume Slug */}
                  <div className="flex items-center gap-2">
                    <IconFile className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Resume:</span>
                    <span className="font-medium">{applicant.resume_slug || 'Not available'}</span>
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

              {/* Applicant Details */}
              <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0">
                <div className="space-y-6 flex flex-col min-h-full">
                  {/* Position Information Section */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-lg font-medium mb-2 text-muted-foreground">Position Information</h3>
                    <div className="rounded-lg p-6 text-sm leading-relaxed border border-[#cecece99] dark:border-border flex-1 min-h-0">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-2">
                          <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Position:</span>
                          <span className="font-medium">{applicant.job_title || applicant.concern}</span>
                        </div>
                        {applicant.company_name && (
                          <div className="flex items-center gap-2">
                            <IconBuilding className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Company:</span>
                            <span className="font-medium">{applicant.company_name}</span>
                          </div>
                        )}
                      </div>
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

                  {/* Resume Section */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-lg font-medium mb-2 text-muted-foreground">Resume</h3>
                    <div className={`rounded-lg p-6 text-sm leading-relaxed border border-[#cecece99] dark:border-border flex-1 min-h-0 ${!applicant.resume_slug ? 'flex items-center justify-center' : ''}`}> 
                      {applicant.resume_slug ? (
                        <div className="flex items-center gap-3">
                          <IconFile className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium">Resume Available</p>
                            <p className="text-muted-foreground">Click to view the applicant's resume on BPOC</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={openResume}>
                            <IconExternalLink className="h-4 w-4 mr-2" />
                            View Resume
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                          <IconFile className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No Resume Available</p>
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
                          <span className="text-muted-foreground">Current Status:</span>
                          <Badge variant="outline" className="px-2 py-1 text-xs">
                            {applicant.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Last Updated:</span>
                          <span className="font-medium">
                            {updatedDate ? `${updatedDate.date} • ${updatedDate.time}` : 'Not available'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Position:</span>
                          <span className="font-medium">{applicant.position}</span>
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
