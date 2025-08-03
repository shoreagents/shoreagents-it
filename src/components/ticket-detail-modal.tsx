"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TicketDetailModalProps {
  ticket: Ticket | null
  isOpen: boolean
  onClose: () => void
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
  member_address?: string
  member_phone?: string
  department_name?: string
  agent_exp_points?: number
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
  resolved_by_name?: string
  resolved_by_email?: string
}

type TicketStatus = 'For Approval' | 'On Hold' | 'In Progress' | 'Approved' | 'Stuck' | 'Actioned' | 'Closed'

const getStatusColor = (status: TicketStatus) => {
  switch (status) {
    case "For Approval":
      return "text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20"
    case "On Hold":
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
    case "In Progress":
      return "text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20"
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
      return <IconAlertCircle className="h-4 w-4" />
    case "On Hold":
      return <IconClock className="h-4 w-4" />
    case "In Progress":
      return <IconEdit className="h-4 w-4" />
    case "Approved":
      return <IconCircle className="h-4 w-4" />
    case "Stuck":
      return <IconAlertCircle className="h-4 w-4" />
    case "Actioned":
      return <IconCircle className="h-4 w-4" />
    case "Closed":
      return <IconCircle className="h-4 w-4" />
    default:
      return <IconInfoCircle className="h-4 w-4" />
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
  const date = new Date(dateString)
  return {
    date: date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
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

export function TicketDetailModal({ ticket, isOpen, onClose }: TicketDetailModalProps) {
  const [comment, setComment] = React.useState("")

  if (!ticket) return null

  const categoryBadge = getCategoryBadge(ticket)
  const createdDate = formatDate(ticket.created_at)
  const updatedDate = ticket.updated_at && ticket.updated_at !== ticket.created_at ? formatDate(ticket.updated_at) : null
  const resolvedDate = ticket.resolved_at ? formatDate(ticket.resolved_at) : null

  const copyTicketId = () => {
    navigator.clipboard.writeText(ticket.ticket_id)
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (comment.trim()) {
      // TODO: Implement comment submission
      console.log('Comment submitted:', comment)
      setComment("")
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono text-primary bg-primary/10 px-3 py-1 rounded-md">
                    {ticket.ticket_id}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={copyTicketId} className="h-6 w-6 p-0">
                        <IconCopy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy ticket ID</TooltipContent>
                  </Tooltip>
                </div>
                <Badge variant="outline" className={`${getStatusColor(ticket.status)} px-3 py-1 font-medium rounded-xl flex items-center gap-1`}>
                  {getStatusIcon(ticket.status)}
                  {ticket.status === 'Approved' ? 'New' : ticket.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <IconShare className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share ticket</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <IconDownload className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export details</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-y-auto">
            {/* Left Column: Ticket Information */}
            <div className="space-y-6">
              {/* Basic Information Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconInfoCircle className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Created</div>
                      <div className="font-medium">{createdDate.date}</div>
                      <div className="text-xs text-muted-foreground">{createdDate.time}</div>
                    </div>
                    {updatedDate && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Last Updated</div>
                        <div className="font-medium">{updatedDate.date}</div>
                        <div className="text-xs text-muted-foreground">{updatedDate.time}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-xs ${categoryBadge?.color || 'bg-gray-100 text-gray-800'}`}>
                      {categoryBadge?.name || 'General'}
                    </Badge>
                    {ticket.station_id && (
                      <Badge variant="outline" className="text-xs">
                        <IconMapPin className="h-3 w-3 mr-1" />
                        {ticket.station_id}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Issue Details Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconMessage className="h-5 w-5" />
                    Issue Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Concern</h4>
                    <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">{ticket.concern}</p>
                  </div>
                  {ticket.details && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Additional Details</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{ticket.details}</p>
                      </div>
                    </>
                  )}
                  {ticket.supporting_files && ticket.supporting_files.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <IconFile className="h-4 w-4" />
                          Supporting Files ({ticket.file_count || ticket.supporting_files.length})
                        </h4>
                        <div className="space-y-2">
                          {ticket.supporting_files.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                              <IconFile className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{file}</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                                <IconDownload className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Resolution Information Card */}
              {ticket.resolved_by && ticket.resolved_at && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconCircle className="h-5 w-5 text-green-600" />
                      Resolution Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Resolved</div>
                        <div className="font-medium">{resolvedDate?.date}</div>
                        <div className="text-xs text-muted-foreground">{resolvedDate?.time}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Resolved by</div>
                        <div className="font-medium">{ticket.resolved_by_name || `User ${ticket.resolved_by}`}</div>
                        {ticket.resolved_by_email && (
                          <div className="text-xs text-muted-foreground">{ticket.resolved_by_email}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: User Information & Comments */}
            <div className="space-y-6">
              {/* User Information Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconUser className="h-5 w-5" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={ticket.profile_picture || ''} alt={`User ${ticket.user_id}`} />
                      <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                        {ticket.first_name && ticket.last_name 
                          ? `${ticket.first_name[0]}${ticket.last_name[0]}`
                          : String(ticket.user_id).split(' ').map(n => n[0]).join('')
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">
                        {ticket.first_name && ticket.last_name 
                          ? `${ticket.first_name} ${ticket.last_name}`
                          : `User ${ticket.user_id}`
                        }
                      </div>
                      {ticket.employee_id && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <IconId className="h-3 w-3" />
                          {ticket.employee_id}
                        </div>
                      )}
                      {ticket.user_email && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <IconMail className="h-3 w-3" />
                          {ticket.user_email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company and Department Info */}
                  {(ticket.member_company || ticket.department_name) && (
                    <div className="grid grid-cols-1 gap-3 pt-2">
                      {ticket.member_company && (
                        <div className="flex items-center gap-2 text-sm">
                          <IconBuilding className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Company:</span>
                          <span className="font-medium">{ticket.member_company}</span>
                        </div>
                      )}
                      {ticket.department_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <IconMapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Department:</span>
                          <span className="font-medium">{ticket.department_name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Job Information */}
                  {(ticket.job_title || ticket.shift_period || ticket.work_setup || ticket.employment_status || ticket.start_date) && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <IconBriefcase className="h-4 w-4" />
                          Job Information
                        </h4>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          {ticket.job_title && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Title:</span>
                              <span className="font-medium">{ticket.job_title}</span>
                            </div>
                          )}
                          {ticket.shift_period && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Shift:</span>
                              <span className="font-medium">{ticket.shift_period}</span>
                            </div>
                          )}
                          {ticket.work_setup && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Setup:</span>
                              <span className="font-medium">{ticket.work_setup}</span>
                            </div>
                          )}
                          {ticket.employment_status && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Status:</span>
                              <span className="font-medium">{ticket.employment_status}</span>
                            </div>
                          )}
                          {ticket.start_date && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Start Date:</span>
                              <span className="font-medium">
                                {new Date(ticket.start_date).toLocaleDateString('en-US', { 
                                  year: 'numeric',
                                  month: 'long', 
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Comments Card */}
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconMessage className="h-5 w-5" />
                      Comments
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <IconMessage className="h-3 w-3" />
                      </div>
                      <span className="text-sm text-muted-foreground">0 comments</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Messages Area */}
                  <div className="border rounded-lg h-[300px] flex flex-col bg-background">
                    <div className="flex-1 p-4 overflow-y-auto">
                      {/* Empty State */}
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                            <IconMessage className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-medium mb-1">No comments yet</p>
                          <p className="text-xs">Start the conversation</p>
                        </div>
                      </div>
                    </div>

                    {/* Input Area */}
                    <div className="border-t p-4 bg-background">
                      <form onSubmit={handleCommentSubmit} className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src="" alt="Current User" />
                          <AvatarFallback className="text-xs">CU</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Input 
                            placeholder="Comment or type '/' for commands..." 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm"
                          />
                        </div>
                      </form>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>Press Enter to send</span>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <IconFile className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <IconMessage className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
} 