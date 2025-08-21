"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCalendar, IconClock, IconUser, IconBuilding, IconMapPin, IconFile, IconMessage, IconEdit, IconTrash, IconShare, IconCopy, IconDownload, IconEye, IconTag, IconPhone, IconMail, IconId, IconBriefcase, IconCalendarTime, IconCircle, IconAlertCircle, IconInfoCircle, IconGlobe, IconCreditCard, IconBell } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getStorageUrl } from "@/lib/supabase"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"

interface MemberDetailModalProps {
  member: Member | null
  isOpen: boolean
  onClose: () => void
}

interface Member {
  id: string
  member_id: string
  first_name: string | null
  last_name: string | null
  full_name?: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  company_address: string | null
  company_phone: string | null
  company_email: string | null
  company_website: string | null
  member_type: string | null
  membership_status: MembershipStatus
  membership_tier: string | null
  join_date: string | null
  expiry_date: string | null
  profile_picture: string | null
  bio: string | null
  social_media: {
    linkedin?: string
    twitter?: string
    facebook?: string
    instagram?: string
  } | null
  preferences: {
    newsletter: boolean
    notifications: boolean
    marketing: boolean
  } | null
  created_at: string
  updated_at: string
}

type MembershipStatus = 'Active' | 'Inactive' | 'Pending' | 'Suspended' | 'Expired'

const getStatusColor = (status: MembershipStatus) => {
  switch (status) {
    case "Active":
      return "text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20"
    case "Inactive":
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
    case "Pending":
      return "text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20"
    case "Suspended":
      return "text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20"
    case "Expired":
      return "text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20"
    default:
      return "text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20"
  }
}

const getStatusIcon = (status: MembershipStatus) => {
  switch (status) {
    case "Active":
      return <IconCircle className="h-4 w-4 text-green-500" />
    case "Inactive":
      return <IconClock className="h-4 w-4 text-gray-500" />
    case "Pending":
      return <IconAlertCircle className="h-4 w-4 text-yellow-500" />
    case "Suspended":
      return <IconAlertCircle className="h-4 w-4 text-red-500" />
    case "Expired":
      return <IconClock className="h-4 w-4 text-orange-500" />
    default:
      return <IconInfoCircle className="h-4 w-4 text-gray-500" />
  }
}

const getMembershipTierColor = (tier: string | null) => {
  if (!tier) return 'bg-gray-100 text-gray-800'
  
  const tierColors: Record<string, string> = {
    'Basic': 'bg-blue-100 text-blue-800',
    'Premium': 'bg-purple-100 text-purple-800',
    'Gold': 'bg-yellow-100 text-yellow-800',
    'Platinum': 'bg-indigo-100 text-indigo-800',
    'Diamond': 'bg-pink-100 text-pink-800',
    'VIP': 'bg-red-100 text-red-800'
  }
  
  return tierColors[tier] || 'bg-gray-100 text-gray-800'
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return { date: 'N/A', time: 'N/A', full: 'N/A' }
  
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

export function MemberDetailModal({ member, isOpen, onClose }: MemberDetailModalProps) {
  const { theme } = useTheme()
  const [comment, setComment] = React.useState("")
  const [currentStatus, setCurrentStatus] = React.useState<MembershipStatus | null>(null)
  const [comments, setComments] = React.useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = React.useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
  const { user } = useAuth()

  React.useEffect(() => {
    if (member) {
      setCurrentStatus(member.membership_status)
    }
  }, [member])

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

  const handleStatusChange = async (newStatus: MembershipStatus) => {
    if (!member) return
    
    try {
      setCurrentStatus(newStatus)
      
      // Here you would typically make an API call to update the member status
      // const response = await fetch(`/api/members/${member.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ membership_status: newStatus })
      // })
      
      // if (!response.ok) throw new Error('Failed to update status')
      
      console.log('Member status updated to:', newStatus)
    } catch (error) {
      console.error('Error updating member status:', error)
      // Revert local status on error
      setCurrentStatus(member.membership_status)
    }
  }

  const handleCommentSubmit = async () => {
    if (!comment.trim() || !member) return
    
    try {
      setIsSubmittingComment(true)
      
      // Here you would typically make an API call to submit the comment
      // const response = await fetch('/api/member-comments', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     member_id: member.id, 
      //     comment: comment.trim(),
      //     user_id: user?.id 
      //   })
      // })
      
      // if (!response.ok) throw new Error('Failed to submit comment')
      
      // Add comment to local state
      const newComment = {
        id: Date.now().toString(),
        comment: comment.trim(),
        created_at: new Date().toISOString(),
        first_name: user?.first_name,
        last_name: user?.last_name,
        email: user?.email,
        profile_picture: user?.profile_picture
      }
      
      setComments(prev => [newComment, ...prev])
      setComment("")
      
      console.log('Comment submitted successfully')
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (!member) return null

  const joinDate = formatDate(member.join_date)
  const expiryDate = formatDate(member.expiry_date)

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0 rounded-xl" style={{ 
          backgroundColor: theme === 'dark' ? '#111111' : '#f8f9fa' 
        }}>
          <div className="flex h-[95vh]">
            {/* Left Panel - Member Details */}
            <div className="flex-1 flex flex-col">
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between px-6 py-5 bg-sidebar h-16 border-b border-[#cecece99] dark:border-border">
                <div className="flex items-center gap-3">
                  <Badge className="text-xs h-6 flex items-center rounded-[6px]">
                    Member
                  </Badge>
                  <span className="text-lg font-mono text-primary">
                    {member.member_id}
                  </span>
                </div>
              </div>

              {/* Member Header */}
              <div className="px-6 py-5">
                {/* Member Name */}
                <h1 className="text-2xl font-semibold mb-4">
                  {member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unnamed Member'}
                </h1>
                
                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Member ID */}
                  <div className="flex items-center gap-2">
                    <IconId className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Member ID:</span>
                    <span className="font-medium">{member.member_id}</span>
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <IconCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Status:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-auto p-0 hover:bg-muted/50 active:bg-muted/70 transition-colors">
                          <Badge variant="outline" className={`${getStatusColor(currentStatus || member.membership_status)} px-2 py-1 text-xs cursor-pointer hover:opacity-80 transition-opacity`}>
                            {currentStatus || member.membership_status}
                          </Badge>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2">
                        <div className="space-y-1">
                          {(['Active', 'Inactive', 'Pending', 'Suspended', 'Expired'] as MembershipStatus[]).map((status) => (
                            <div 
                              key={status}
                              className={`flex items-center gap-3 p-1.5 rounded-md cursor-pointer transition-all duration-200 ${
                                (currentStatus || member.membership_status) === status 
                                  ? 'bg-primary/10 text-primary border border-primary/20' 
                                  : 'hover:bg-muted/50 active:bg-muted/70 text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => handleStatusChange(status)}
                            >
                              {getStatusIcon(status)}
                              <span className="text-sm font-medium">{status}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Email */}
                  <div className="flex items-center gap-2">
                    <IconMail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{member.email || 'No email'}</span>
                  </div>
                  
                  {/* Phone */}
                  <div className="flex items-center gap-2">
                    <IconPhone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{member.phone || 'No phone'}</span>
                  </div>
                  
                  {/* Company */}
                  <div className="flex items-center gap-2">
                    <IconBuilding className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Company:</span>
                    <span className="font-medium">{member.company_name || 'No company'}</span>
                  </div>
                  
                  {/* Membership Tier */}
                  <div className="flex items-center gap-2">
                    <IconTag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Tier:</span>
                    <Badge variant="outline" className={`${getMembershipTierColor(member.membership_tier)} px-2 py-0.5 text-xs`}>
                      {member.membership_tier || 'Basic'}
                    </Badge>
                  </div>
                  
                  {/* Join Date */}
                  <div className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="font-medium">{joinDate.date}</span>
                  </div>
                  
                  {/* Expiry Date */}
                  <div className="flex items-center gap-2">
                    <IconCalendarTime className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium">{expiryDate.date}</span>
                  </div>
                </div>
              </div>

              {/* Member Information Cards */}
              <div className="px-6 pb-6 space-y-4">
                {/* Company Information */}
                {member.company_name && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <IconBuilding className="h-5 w-5" />
                        Company Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {member.company_address && (
                        <div className="flex items-start gap-2">
                          <IconMapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-sm">{member.company_address}</span>
                        </div>
                      )}
                      {member.company_phone && (
                        <div className="flex items-center gap-2">
                          <IconPhone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{member.company_phone}</span>
                        </div>
                      )}
                      {member.company_email && (
                        <div className="flex items-center gap-2">
                          <IconMail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{member.company_email}</span>
                        </div>
                      )}
                      {member.company_website && (
                        <div className="flex items-center gap-2">
                          <IconGlobe className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={member.company_website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {member.company_website}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Bio */}
                {member.bio && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <IconUser className="h-5 w-5" />
                        Biography
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground leading-relaxed">{member.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Social Media */}
                {member.social_media && Object.values(member.social_media).some(Boolean) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <IconShare className="h-5 w-5" />
                        Social Media
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {member.social_media.linkedin && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={member.social_media.linkedin} target="_blank" rel="noopener noreferrer">
                              LinkedIn
                            </a>
                          </Button>
                        )}
                        {member.social_media.twitter && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={member.social_media.twitter} target="_blank" rel="noopener noreferrer">
                              Twitter
                            </a>
                          </Button>
                        )}
                        {member.social_media.facebook && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={member.social_media.facebook} target="_blank" rel="noopener noreferrer">
                              Facebook
                            </a>
                          </Button>
                        )}
                        {member.social_media.instagram && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={member.social_media.instagram} target="_blank" rel="noopener noreferrer">
                              Instagram
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Preferences */}
                {member.preferences && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <IconTag className="h-5 w-5" />
                        Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <IconMessage className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Newsletter: {member.preferences.newsletter ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconBell className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Notifications: {member.preferences.notifications ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconCreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Marketing: {member.preferences.marketing ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">{commentDate.date} • {commentDate.time}</span>
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
