"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getStorageUrl } from "@/lib/supabase"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { SendHorizontal } from "lucide-react"

interface TicketDetailModalProps {
  ticket: Ticket | null
  isOpen: boolean
  onClose: () => void
}

interface StatusOption {
  value: string
  label: string
  icon: string
  color: string
}

interface Ticket {
  id: number
  ticket_id: string
  user_id: number
  concern: string
  details: string | null
  category: string
  category_id: number | null
  category_name?: string
  status: TicketStatus
  position: number
  resolved_by: number | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  sector: string
  station_id: string | null
  profile_picture: string | null
  first_name: string | null
  last_name: string | null
  employee_id: string | null
  supporting_files?: string[]
  file_count?: number
  // Additional fields from joins
  user_email?: string
  user_type?: string
  member_company?: string
  member_name?: string
  member_color?: string
  member_address?: string
  member_phone?: string
  department_name?: string

  job_title?: string
  shift_period?: string
  shift_schedule?: string
  shift_time?: string
  work_setup?: string
  employment_status?: string
  hire_type?: string
  staff_source?: string
  start_date?: string
  exit_date?: string
  resolver_first_name?: string | null
  resolver_last_name?: string | null
}

type TicketStatus = 'For Approval' | 'On Hold' | 'In Progress' | 'New' | 'Approved' | 'Stuck' | 'Actioned' | 'Closed'

const getStatusColor = (status: TicketStatus) => {
  switch (status) {
    case "For Approval":
      return "text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20"
    case "On Hold":
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
    case "In Progress":
      return "text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20"
    case "New":
    case "Approved":
      return "text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20"
    case "Stuck":
      return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
    case "Actioned":
      return "text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20"
    case "Closed":
      return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
    default:
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
  }
}

const getStatusIcon = (status: TicketStatus) => {
  switch (status) {
    case "For Approval":
      return <IconCircle className="h-4 w-4 fill-yellow-500 stroke-none" />
    case "On Hold":
      return <IconCircle className="h-4 w-4 fill-gray-500 stroke-none" />
    case "In Progress":
      return <IconCircle className="h-4 w-4 fill-orange-500 stroke-none" />
    case "New":
    case "Approved":
      return <IconCircle className="h-4 w-4 fill-blue-500 stroke-none" />
    case "Stuck":
      return <IconCircle className="h-4 w-4 fill-red-500 stroke-none" />
    case "Actioned":
      return <IconCircle className="h-4 w-4 fill-purple-500 stroke-none" />
    case "Closed":
      return <IconCircle className="h-4 w-4 fill-green-500 stroke-none" />
    default:
      return <IconCircle className="h-4 w-4 fill-gray-500 stroke-none" />
  }
}

const getCategoryBadge = (ticket: Ticket) => {
  const categoryColors: Record<string, string> = {
    'Computer & Equipment': 'bg-blue-100 text-blue-800',
    'Network & Internet': 'bg-cyan-100 text-cyan-800',
    'Station': 'bg-purple-100 text-purple-800',
    'Surroundings': 'bg-green-100 text-green-800',
    'Schedule': 'bg-yellow-100 text-yellow-800',
    'Compensation': 'bg-orange-100 text-orange-800',
    'Transport': 'bg-indigo-100 text-indigo-800',
    'Suggestion': 'bg-pink-100 text-pink-800',
    'Check-in': 'bg-gray-100 text-gray-800'
  }
  
  return {
    name: ticket.category_name || ticket.category,
    color: categoryColors[ticket.category_name || ticket.category] || 'bg-gray-100 text-gray-800'
  }
}

const formatDate = (dateString: string) => {
  // Parse the UTC timestamp and convert to Asia/Manila timezone
  const date = new Date(dateString)
  return {
    date: date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      timeZone: 'Asia/Manila'
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    }),
    full: date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    })
  }
}

const getDisplayStatus = (status: string, isAdmin?: boolean) => {
  // For IT, display "New" for DB status "Approved".
  // For Admin, display the actual DB status "Approved".
  if (status === 'Approved') return isAdmin ? 'Approved' : 'New'
  return status
}

export function TicketDetailModal({ ticket, isOpen, onClose }: TicketDetailModalProps) {
  const { theme } = useTheme()
  const [comment, setComment] = React.useState("")
  const [currentStatus, setCurrentStatus] = React.useState<TicketStatus | null>(null)
  const [statusOptions, setStatusOptions] = React.useState<StatusOption[]>([])
  const [comments, setComments] = React.useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = React.useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
  const { user } = useAuth()
  const isAdmin = ((user as any)?.roleName || '').toLowerCase() === 'admin'
  const [isCommentFocused, setIsCommentFocused] = React.useState<boolean>(false)
  const commentTextareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Define status options based on application usage
  const getStatusOptions = (): StatusOption[] => {
    const options: StatusOption[] = [
      { value: 'Approved', label: isAdmin ? 'Approved' : 'New', icon: 'blue', color: 'blue' },
      { value: 'In Progress', label: 'In Progress', icon: 'orange', color: 'orange' },
      { value: 'Stuck', label: 'Stuck', icon: 'red', color: 'red' },
      { value: 'Actioned', label: 'Actioned', icon: 'purple', color: 'purple' },
      { value: 'Closed', label: 'Closed', icon: 'green', color: 'green' },
      { value: 'On Hold', label: 'On Hold', icon: 'gray', color: 'gray' },
    ]
    // Include For Approval only for Admin
    if (isAdmin) {
      options.unshift({ value: 'For Approval', label: 'For Approval', icon: 'yellow', color: 'yellow' })
    }
    return options
  }

  React.useEffect(() => {
    if (ticket) {
      setCurrentStatus(ticket.status)
      fetchComments()
      // Reset comment state when ticket changes
      setIsCommentFocused(false)
      setComment("")
      // Ensure textarea is not focused
      if (commentTextareaRef.current) {
        commentTextareaRef.current.blur()
      }
    }
    setStatusOptions(getStatusOptions())
  }, [ticket])

  // Reset comment focus state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, resetting comment state')
      setIsCommentFocused(false)
      setComment("")
      // Ensure textarea is not focused
      if (commentTextareaRef.current) {
        commentTextareaRef.current.blur()
      }
    }
  }, [isOpen])

  // Debug state changes
  React.useEffect(() => {
    console.log('State changed - isCommentFocused:', isCommentFocused, 'comment:', comment, 'comment.trim():', comment.trim())
  }, [isCommentFocused, comment])

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

  const fetchComments = async () => {
    if (!ticket) return
    
    setIsLoadingComments(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.ticket_id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      } else {
        console.error('Failed to fetch comments')
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  if (!ticket) return null

  const categoryBadge = getCategoryBadge(ticket)
  const createdDate = formatDate(ticket.created_at)
  const updatedDate = ticket.updated_at && ticket.updated_at !== ticket.created_at ? formatDate(ticket.updated_at) : null
  const resolvedDate = ticket.resolved_at ? formatDate(ticket.resolved_at) : null

  const hasAttachments = ticket.supporting_files && Array.isArray(ticket.supporting_files) && ticket.supporting_files.length > 0

  const copyTicketId = () => {
    navigator.clipboard.writeText(ticket.ticket_id)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !ticket || isSubmittingComment) return
    
    setIsSubmittingComment(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.ticket_id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: comment.trim(), userId: user ? parseInt(user.id) : undefined })
      })
      
      if (response.ok) {
        const data = await response.json()
        setComments(prev => [...prev, data.comment])
        setComment("")
      } else {
        const errorData = await response.json()
        console.error('Failed to submit comment:', errorData)
        alert(`Failed to submit comment: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setCurrentStatus(newStatus as TicketStatus)
    if (!ticket) return
    try {
      // Map display status to database status
      let dbStatus = newStatus === 'New' ? 'Approved' : newStatus
      // Admin can set For Approval explicitly
      if (isAdmin && newStatus === 'For Approval') {
        dbStatus = 'For Approval'
      }
      const requestBody: any = { status: dbStatus }
      if (newStatus === 'Closed' && user?.id) {
        requestBody.resolvedBy = parseInt(user.id)
      }
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to update ticket status from modal:', errorData)
        // Revert local status on failure
        setCurrentStatus(ticket.status)
      }
    } catch (error) {
      console.error('Error updating ticket status from modal:', error)
      // Revert local status on error
      setCurrentStatus(ticket.status)
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0 rounded-xl" style={{ 
          backgroundColor: theme === 'dark' ? '#111111' : '#f8f9fa' 
        }}>
          <DialogTitle className="sr-only">Ticket Details</DialogTitle>
          <DialogDescription className="sr-only">View and manage ticket information</DialogDescription>
          <div className="flex h-[95vh]">
            {/* Left Panel - Task Details */}
            <div className="flex-1 flex flex-col">
                                                           {/* Top Navigation Bar */}
                <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
                                                     <div className="flex items-center gap-3">
                    <Badge className="text-xs h-6 flex items-center rounded-[6px]">
                      Ticket
                    </Badge>
                  </div>
               </div>

                                                {/* Task Header */}
                 <div className="px-6 py-5">
                   {/* Task Title */}
                   <h1 className="text-2xl font-semibold mb-4">
                     {ticket.concern}
                   </h1>
                   
                   {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {/* 1. Employee */}
                      <div className="flex items-center gap-2">
                        <IconUser className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Employee:</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={ticket.profile_picture || ''} alt="User" />
                            <AvatarFallback className="text-xs">
                              {ticket.first_name && ticket.last_name 
                                ? `${ticket.first_name[0]}${ticket.last_name[0]}`
                                : 'U'
                              }
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {ticket.first_name && ticket.last_name 
                              ? `${ticket.first_name} ${ticket.last_name}`
                              : `User ${ticket.user_id}`
                            }
                          </span>
                        </div>
                      </div>
                      
                      {/* 2. Ticket ID */}
                      <div className="flex items-center gap-2">
                        <IconId className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Ticket ID:</span>
                        <span className="font-mono font-medium text-primary">
                          {ticket.ticket_id}
                        </span>
                      </div>
                      
                      {/* 3. Filed at */}
                      <div className="flex items-center gap-2">
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Filed at:</span>
                        <span className="font-medium">{createdDate.date} • {createdDate.time}</span>
                      </div>
                      
                      {/* 4. Category */}
                      <div className="flex items-center gap-2">
                        <IconTag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Category:</span>
                        <Badge variant="secondary" className={`text-xs h-6 flex items-center justify-center ${categoryBadge.color}`}>
                          {categoryBadge.name}
                        </Badge>
                      </div>
                      
                      {/* 5. Status */}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(currentStatus || ticket.status)}
                        <span className="text-muted-foreground">Status:</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className={`${getStatusColor(currentStatus || ticket.status)} px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center`}
                            >
                              {getDisplayStatus(currentStatus || ticket.status, isAdmin)}
                            </Badge>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2">
                            <div className="space-y-1">
                              {statusOptions.map((option) => {
                                const isCurrentStatus = getDisplayStatus(currentStatus || ticket.status, isAdmin) === option.label;
                                return (
                                  <div 
                                    key={option.value}
                                    className={`flex items-center gap-3 p-1.5 rounded-md transition-all duration-200 ${
                                      isCurrentStatus 
                                        ? 'bg-primary/10 text-primary border border-primary/20 cursor-default' 
                                        : 'hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground cursor-pointer'
                                    }`}
                                    onClick={isCurrentStatus ? undefined : () => handleStatusChange(option.value)}
                                  >
                                    {option.icon === 'yellow' ? (
                                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    ) : option.icon === 'orange' ? (
                                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                    ) : option.icon === 'blue' ? (
                                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    ) : option.icon === 'green' ? (
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    ) : option.icon === 'red' ? (
                                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    ) : option.icon === 'purple' ? (
                                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
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
                      
                      {/* 6. Resolved by */}
                      {ticket.status === 'Closed' && ticket.resolved_by && (
                        <div className="flex items-center gap-2">
                          <IconUser className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Resolved by:</span>
                          <span className="font-medium">
                            {ticket.resolved_by === parseInt(user?.id || '0') 
                              ? 'You' 
                              : (ticket.resolver_first_name && ticket.resolver_last_name 
                                  ? `${ticket.resolver_first_name} ${ticket.resolver_last_name}`
                                  : `User ${ticket.resolved_by}`
                                )
                            }
                          </span>
                        </div>
                      )}
                      
                      {/* 7. Resolved at */}
                      {ticket.status === 'Closed' && ticket.resolved_at && (
                        <div className="flex items-center gap-2">
                          <IconClock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Resolved at:</span>
                          <span className="font-medium">
                            {new Date(ticket.resolved_at).toLocaleDateString('en-US', { 
                              year: 'numeric',
                              month: 'short', 
                              day: 'numeric',
                              timeZone: 'Asia/Manila'
                            })} • {new Date(ticket.resolved_at).toLocaleTimeString('en-US', { 
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Asia/Manila'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                </div>
                <div className="px-6">
                  <Separator />
                </div>

              {/* Task Description */}
              <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0">
                  <div className="space-y-6 flex flex-col min-h-full">
                  {/* Additional Details Section */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-lg font-medium mb-2 text-muted-foreground">Additional Details</h3>
                    <div className="rounded-lg p-6 text-sm leading-relaxed border border-[#cecece99] dark:border-border flex-1 min-h-0">
                      {ticket.details || "No additional details provided."}
                    </div>
                  </div>

                  

                  {/* Attachments Section */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-lg font-medium mb-2 text-muted-foreground">Attachments</h3>
                    <div className={`rounded-lg p-6 text-sm leading-relaxed border border-[#cecece99] dark:border-border flex-1 min-h-0 ${!hasAttachments ? 'flex items-center justify-center' : ''}`}> 
                      {hasAttachments ? (
                        <div className="grid grid-cols-4 gap-3">
                          {(ticket.supporting_files || []).map((file, index) => {
                            // Get proper Supabase Storage URL for full quality
                            const fileUrl = getStorageUrl(file);
                            // Get optimized URL for preview
                            const previewUrl = getStorageUrl(file, true);
                            // Extract filename from Supabase Storage URL
                            const fileName = file.split('/').pop() || file;
                            
                            // Debug logging
                            console.log('File processing:', { 
                              originalFile: file, 
                              fileUrl, 
                              fileName,
                              supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL 
                            });
                            const fileExtension = fileName.split('.').pop()?.toLowerCase();
                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                            const isPdf = fileExtension === 'pdf';
                            const isArchive = ['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExtension || '');
                            
                            let gradientClass = 'from-blue-500/20 to-purple-500/20';
                            let iconColor = 'text-blue-600 dark:text-blue-400';
                            let bgColor = 'bg-blue-100 dark:bg-blue-900/20';
                            
                            if (isImage) {
                              gradientClass = 'from-green-500/20 to-blue-500/20';
                              iconColor = 'text-green-600 dark:text-green-400';
                              bgColor = 'bg-green-100 dark:bg-green-900/20';
                            } else if (isPdf) {
                              gradientClass = 'from-red-500/20 to-orange-500/20';
                              iconColor = 'text-red-600 dark:text-red-400';
                              bgColor = 'bg-red-100 dark:bg-red-900/20';
                            } else if (isArchive) {
                              gradientClass = 'from-purple-500/20 to-pink-500/20';
                              iconColor = 'text-purple-600 dark:text-purple-400';
                              bgColor = 'bg-purple-100 dark:bg-purple-900/20';
                            }
                            
                            return (
                              <div 
                                key={index} 
                                className="rounded-lg overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                                style={{ 
                                  backgroundColor: theme === 'dark' ? '#252525' : '#ffffff',
                                  border: theme === 'dark' ? '1px solid #333333' : '1px solid #e5e7eb'
                                }}
                                onClick={() => {
                                  if (typeof window !== 'undefined' && (window as any).electronAPI) {
                                    (window as any).electronAPI.openFileWindow(fileUrl, fileName)
                                      .then((result: any) => {
                                        if (result.success) {
                                          console.log('File window opened successfully')
                                        } else {
                                          console.error('Failed to open file window:', result.error)
                                          // Fallback to browser window if Electron fails
                                          window.open(fileUrl, '_blank')
                                        }
                                      })
                                      .catch((error: any) => {
                                        console.error('Error opening file window:', error)
                                        // Fallback to browser window if Electron fails
                                        window.open(fileUrl, '_blank')
                                      })
                                  } else {
                                    // Fallback to browser window if not in Electron
                                    window.open(fileUrl, '_blank')
                                  }
                                }}
                                title={`Click to view ${fileName}`}
                              >
                                <div className={`w-full h-20 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                                  {isImage ? (
                                    <img 
                                      src={previewUrl} 
                                      alt={fileName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback to icon if image fails to load
                                        const target = e.currentTarget as HTMLImageElement;
                                        target.style.display = 'none';
                                        const nextSibling = target.nextElementSibling as HTMLElement;
                                        if (nextSibling) {
                                          nextSibling.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center ${isImage ? 'hidden' : ''}`}>
                                    <IconFile className={`h-4 w-4 ${iconColor}`} />
                                  </div>
                                </div>
                                <div className="p-2">
                                  <div className="text-xs font-medium truncate">{fileName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {ticket.created_at ? formatDate(ticket.created_at).full : 'Unknown date'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                          <IconFile className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No Attachments</p>
                        </div>
                      )}
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
                      comments.map((comment) => {
                        const userName = comment.first_name && comment.last_name
                          ? `${comment.first_name} ${comment.last_name}`.trim()
                          : comment.email || 'Unknown User'
                        
                        const userInitials = comment.first_name && comment.last_name
                          ? `${comment.first_name[0]}${comment.last_name[0]}`.toUpperCase()
                          : comment.email?.[0]?.toUpperCase() || 'U'
                        
                        const commentDate = formatDate(comment.created_at)
                        
                        return (
                          <div key={comment.id} className="rounded-lg p-4 bg-sidebar border">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    {comment.profile_picture ? (
                                      <img 
                                        src={comment.profile_picture} 
                                        alt={userName}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-xs font-medium text-primary">
                                        {userInitials}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm font-medium truncate">{userName}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-3">{commentDate.date} • {commentDate.time}</span>
                              </div>
                              <div className="text-sm text-foreground leading-relaxed mt-1 whitespace-pre-wrap break-words">
                                {comment.comment}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No Comments Yet</p>
                      </div>
                    )}
                  </div>
                </div>

              {/* Comment Input */}
              <div className="px-3 pb-3 bg-[#ebebeb] dark:bg-[#0a0a0a]">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <form onSubmit={handleCommentSubmit}>
                      <div className={`border rounded-lg bg-sidebar overflow-hidden transition-all duration-300 ease-in-out [&>*]:border-none [&>*]:outline-none [&>textarea]:transition-all [&>textarea]:duration-300 [&>textarea]:ease-in-out ${
                        (isCommentFocused || comment.trim()) 
                          ? 'border-muted-foreground' 
                          : 'border-border'
                      }`}>
                        <textarea 
                          ref={commentTextareaRef}
                          placeholder="Write a comment..." 
                          value={comment}
                          onChange={(e) => {
                            setComment(e.target.value)
                            // Auto-resize the textarea
                            e.target.style.height = 'auto'
                            e.target.style.height = e.target.scrollHeight + 'px'
                          }}
                          onFocus={(e) => {
                            console.log('Comment focused, setting isCommentFocused to true')
                            setIsCommentFocused(true)
                          }}
                          onBlur={(e) => {
                            console.log('Comment blurred, setting isCommentFocused to false')
                            setIsCommentFocused(false)
                          }}
                          className="w-full resize-none border-0 bg-transparent text-foreground px-3 py-2 shadow-none text-sm focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 dark:text-foreground placeholder:text-muted-foreground align-middle transition-all duration-300 ease-in-out min-h-[36px] overflow-hidden"
                          disabled={isSubmittingComment}
                          rows={1}
                          tabIndex={-1}
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
    </TooltipProvider>
  )
} 