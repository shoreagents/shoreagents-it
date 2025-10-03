"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus, IconEdit, IconTrash, IconBell, IconAlertCircle, IconCheck, IconEye, IconSend, IconUsers, IconSearch, IconCalendar, IconClock } from "@tabler/icons-react"
import AddAnnouncementModal from "@/components/modals/announcements-detail-modal"
import { ReloadButton } from "@/components/ui/reload-button"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { useTheme } from "next-themes"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserTooltip } from "@/components/ui/user-tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useRealtimeAnnouncements } from "@/hooks/use-realtime-announcements"

interface Announcement {
  id?: number
  title: string
  message: string | null // API returns 'message', not 'content'
  scheduled_at: string | null // date format from database
  expires_at: string | null // date format from database
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'draft' | 'scheduled' | 'active' | 'expired' | 'cancelled'
  created_by: number
  created_at?: string
  updated_at?: string
  sent_at?: string | null // When the announcement was sent
  assigned_user_ids: number[] | null // API returns 'assigned_user_ids', not 'target_user_ids'
  recipients_count?: number
}

const priorityConfig = {
  low: { 
    label: 'Low', 
    color: 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20',
    icon: IconBell
  },
  medium: { 
    label: 'Medium', 
    color: 'text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20',
    icon: IconBell
  },
  high: { 
    label: 'High', 
    color: 'text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20',
    icon: IconAlertCircle
  },
  urgent: { 
    label: 'Urgent', 
    color: 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20',
    icon: IconAlertCircle
  }
}

const statusConfig = {
  draft: { 
    label: 'Draft', 
    color: 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20',
    icon: IconEye
  },
  scheduled: { 
    label: 'Scheduled', 
    color: 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20',
    icon: IconBell
  },
    active: { 
      label: 'Active', 
      color: 'text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20',
      icon: IconCheck
    },
  expired: { 
    label: 'Expired', 
    color: 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20',
    icon: IconAlertCircle
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20',
    icon: IconAlertCircle
  }
}

export default function AnnouncementsPage() {
  const { theme, resolvedTheme } = useTheme()
  const { user } = useAuth()
  const [activeAnnouncementsCount, setActiveAnnouncementsCount] = useState<number>(0)
  const [mounted, setMounted] = useState(false)
  
  // Real-time announcements hook
  const { isConnected: announcementsConnected } = useRealtimeAnnouncements({
    onAnnouncementSent: (announcement) => {
      console.log('📢 New announcement sent:', announcement)
      // Update the announcements list directly instead of refreshing
      setAnnouncements(prev => {
        const exists = prev.find(a => a.id === announcement.announcement_id)
        if (!exists) {
          // Add new announcement to the list (for INSERT operations)
          const newAnnouncement = {
            id: announcement.announcement_id,
            title: announcement.title,
            message: announcement.message,
            priority: announcement.priority,
            status: announcement.status || 'draft',
            created_by: announcement.created_by,
            created_at: announcement.created_at,
            updated_at: announcement.updated_at,
            scheduled_at: announcement.scheduled_at,
            expires_at: announcement.expires_at,
            sent_at: announcement.sent_at,
            assigned_user_ids: announcement.assigned_user_ids || []
          }
          return [newAnnouncement, ...prev]
        }
        return prev.map(a => 
          a.id === announcement.announcement_id ? { 
            ...a, 
            ...announcement, 
            status: 'active',
            assigned_user_ids: announcement.assigned_user_ids || a.assigned_user_ids
          } : a
        )
      })
      // Refresh active count when new announcement is sent
      fetchActiveCount()
    },
    onAnnouncementExpired: (announcement) => {
      console.log('⏰ Announcement expired:', announcement)
      // Update the announcement status directly
      setAnnouncements(prev => 
        prev.map(a => 
          a.id === announcement.announcement_id ? { ...a, status: 'expired' } : a
        )
      )
      // Refresh active count when announcement expires
      fetchActiveCount()
    },
    onAnnouncementUpdated: (announcement, oldAnnouncement) => {
      console.log('🔄 Announcement updated:', announcement)
      // Update the announcement in the list directly
      setAnnouncements(prev => 
        prev.map(a => 
          a.id === announcement.announcement_id ? { 
            ...a, 
            ...announcement,
            assigned_user_ids: announcement.assigned_user_ids || a.assigned_user_ids
          } : a
        )
      )
      // Refresh active count when announcement status might have changed
      fetchActiveCount()
    },
    onAnnouncementDeleted: (announcement) => {
      console.log('🗑️ Announcement deleted:', announcement)
      // Remove the announcement from the list
      setAnnouncements(prev => 
        prev.filter(a => a.id !== announcement.announcement_id)
      )
      // Refresh active count when announcement is deleted
      fetchActiveCount()
    }
  })
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState<string>('scheduled')
  const [loadingUsersKey, setLoadingUsersKey] = useState<string | null>(null)
  const [announcementUsersCache, setAnnouncementUsersCache] = useState<Record<string, { users: { user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, employee_id: string | null }[] }>>({})
  const [reloading, setReloading] = useState(false)

  // Fetch active announcements count
  const fetchActiveCount = async () => {
    try {
      const res = await fetch('/api/announcements/counts')
      if (res.ok) {
        const data = await res.json()
        setActiveAnnouncementsCount(data.active || 0)
        console.log('Active announcements count fetched:', data.active)
      } else {
        console.warn('Failed to fetch active announcements count')
      }
    } catch (error) {
      console.error('Error fetching active announcements count:', error)
    }
  }

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First, update announcement statuses in database based on current date
      try {
        console.log('Updating announcement statuses based on current date...')
        
        // Get browser's current date to send to API
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const browserDate = `${year}-${month}-${day}` // YYYY-MM-DD format
        
        const updateResponse = await fetch('/api/announcements/update-statuses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ date: browserDate })
        })
        
        if (updateResponse.ok) {
          const updateData = await updateResponse.json()
          console.log('Announcement statuses updated successfully:', updateData)
          
          // Log detailed update information
          if (updateData.updates) {
            console.log('Update summary:', {
              activated: updateData.updates.activated,
              expired: updateData.updates.expired,
              quickExpired: updateData.updates.quickExpired,
              rescheduled: updateData.updates.rescheduled,
              date: updateData.date
            })
          }
        } else {
          const errorData = await updateResponse.json().catch(() => ({}))
          console.warn('Failed to update announcement statuses:', errorData)
        }
      } catch (updateError) {
        console.warn('Error updating announcement statuses:', updateError)
        // Continue with fetching announcements even if status update fails
      }
      
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        sortField: 'created_at',
        sortDirection: 'desc',
        status: selectedStatus
      })
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      
      console.log('Fetching announcements with params:', params.toString())
      const res = await fetch(`/api/announcements?${params.toString()}`)
      console.log('Announcements API response status:', res.status)
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Announcements API error:', err)
        throw new Error(err.error || "Failed to fetch announcements")
      }
      const data = await res.json()
      console.log('Announcements data received:', data)
      setAnnouncements(data.announcements || data || [])
      setTotalCount(data.pagination?.totalCount || data.length || 0)
      setTotalPages(data.pagination?.totalPages || 1)
      
      // Fetch active count after loading announcements
      fetchActiveCount()
    } catch (e: any) {
      console.error('Error fetching announcements:', e)
      setError(e?.message || "Failed to fetch announcements")
    } finally {
      setLoading(false)
    }
  }

  // Reload function
  const handleReload = async () => {
    setReloading(true)
    try {
      // Don't set loading to true during reload to keep the UI visible
      setError(null)
      
      // First, update announcement statuses in database based on current date
      try {
        console.log('Updating announcement statuses based on current date...')
        
        // Get browser's current date to send to API
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const browserDate = `${year}-${month}-${day}` // YYYY-MM-DD format
        
        const updateResponse = await fetch('/api/announcements/update-statuses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ date: browserDate })
        })
        
        if (updateResponse.ok) {
          const updateData = await updateResponse.json()
          console.log('Announcement statuses updated successfully:', updateData)
          
          // Log detailed update information
          if (updateData.updates) {
            console.log('Update summary:', {
              activated: updateData.updates.activated,
              expired: updateData.updates.expired,
              quickExpired: updateData.updates.quickExpired,
              rescheduled: updateData.updates.rescheduled,
              date: updateData.date
            })
          }
        } else {
          const errorData = await updateResponse.json().catch(() => ({}))
          console.warn('Failed to update announcement statuses:', errorData)
        }
      } catch (updateError) {
        console.warn('Error updating announcement statuses:', updateError)
        // Continue with fetching announcements even if status update fails
      }
      
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        sortField: 'created_at',
        sortDirection: 'desc',
        status: selectedStatus
      })
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      
      console.log('Fetching announcements with params:', params.toString())
      const res = await fetch(`/api/announcements?${params.toString()}`)
      console.log('Announcements API response status:', res.status)
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Announcements API error:', err)
        throw new Error(err.error || "Failed to fetch announcements")
      }
      const data = await res.json()
      console.log('Announcements data received:', data)
      setAnnouncements(data.announcements || data || [])
      setTotalCount(data.pagination?.totalCount || data.length || 0)
      setTotalPages(data.pagination?.totalPages || 1)
      
      // Fetch active count after loading announcements
      fetchActiveCount()
      setError(null) // Clear any previous errors
      
    } catch (err) {
      console.error('❌ Reload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to reload announcements')
    } finally {
      setReloading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [currentPage, searchTerm, selectedStatus])

  // Handle theme hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchUsersForAnnouncement = async (announcementId: number, targetUserIds: number[]) => {
    const key = `announcement:${announcementId}`
    if (announcementUsersCache[key]) return announcementUsersCache[key].users
    
    if (!targetUserIds || targetUserIds.length === 0) {
      return []
    }
    
    try {
      setLoadingUsersKey(key)
      const response = await fetch(`/api/users?ids=${targetUserIds.join(',')}`)
      if (response.ok) {
        const data = await response.json()
        const users = data.users || data || []
        setAnnouncementUsersCache(prev => ({
          ...prev,
          [key]: { users }
        }))
        return users
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsersKey(null)
    }
    return []
  }

  const handleTabChange = (tab: any) => {
    setSelectedStatus(tab.value)
    setCurrentPage(1) // Reset to first page when changing tabs
  }

  // Handle announcement added/updated from modal (modal already handles API calls)
  const handleAnnouncementAdded = async (announcement: Announcement) => {
    // Don't refresh announcements - real-time updates handle this automatically
    // The useRealtimeAnnouncements hook already updates the announcements list when changes occur
    console.log('Announcement saved, realtime updates will handle the refresh')
  }

  // Delete announcement
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Real-time hook will handle the removal automatically
      }
    } catch (error) {
      console.error("Error deleting announcement:", error)
    }
  }

  // Handle send announcement
  const handleSend = async (id: number) => {
    try {
      const response = await fetch(`/api/announcements/${id}/send`, {
        method: 'POST',
      })

      if (response.ok) {
        // Update the announcement status directly in the state
        setAnnouncements(prev => 
          prev.map(announcement => 
            announcement.id === id 
              ? { ...announcement, status: 'active' as const, sent_at: new Date().toISOString() }
              : announcement
          )
        )
      }
    } catch (error) {
      console.error("Error sending announcement:", error)
    }
  }

  // Handle view announcement
  const handleView = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setModalMode('view')
    setIsModalOpen(true)
  }

  // Handle edit announcement
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  // Handle create announcement
  const handleCreate = () => {
    setEditingAnnouncement(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAnnouncement(null)
  }

  // Filter announcements (now handled by API)
  const filteredAnnouncements = announcements


  // Create tabs configuration
  const tabs = [
    {
      title: 'Scheduled',
      value: 'scheduled',
      content: null
    },
    {
      title: 'Active',
      value: 'active',
      content: null,
      badge: activeAnnouncementsCount > 0 ? activeAnnouncementsCount : undefined
    },
    {
      title: 'Expired',
      value: 'expired',
      content: null
    },
    {
      title: 'Cancelled',
      value: 'cancelled',
      content: null
    },
    {
      title: 'Draft',
      value: 'draft',
      content: null
    }
  ]

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Announcements</h1>
                    <p className="text-sm text-muted-foreground">Manage system-wide announcements and notifications.</p>
                  </div>
                  <div className="flex gap-2">
                    <ReloadButton onReload={handleReload} loading={reloading} className="flex-1" />
                  </div>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title, message, or priority..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleCreate} 
                  >
                    <IconPlus className="h-4 w-4" />
                    Add New
                  </Button>
                </div>
              </div>

              {/* Animated Tabs */}
              <div className="px-4 lg:px-6">
                {mounted && (
                  <div className={`rounded-xl p-1 w-fit ${
                    resolvedTheme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-gray-100/80 border border-gray-200'
                  }`}>
                    <AnimatedTabs
                      tabs={tabs}
                      onTabChange={handleTabChange}
                      containerClassName="grid grid-cols-5 w-fit"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : error ? (
                  <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {filteredAnnouncements.map((announcement) => {
                        const PriorityIcon = priorityConfig[announcement.priority].icon
                        const StatusIcon = statusConfig[announcement.status].icon
                        const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date()
                        
                        return (
                          <Card 
                            key={announcement.id} 
                            className="h-full cursor-pointer hover:border-primary/50 hover:text-primary transition-all duration-200"
                            onClick={() => handleView(announcement)}
                          >
                            <CardContent className="p-4 h-full flex flex-col">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium truncate max-w-[14rem]">{announcement.title}</div>
                                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {announcement.message || 'No content available'}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                  <Badge 
                                    variant="outline" 
                                    className={`px-3 py-1 font-medium ${priorityConfig[announcement.priority].color}`}
                                  >
                                    {priorityConfig[announcement.priority].label}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="mt-3 space-y-1 text-sm">
                                {/* Schedule and Expiry in single row */}
                                <div className="flex items-center justify-between gap-2">
                                  {/* Scheduled At */}
                                  <div className="flex items-center gap-2 min-w-0 flex-1 text-muted-foreground">
                                    <IconCalendar className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm font-medium">
                                      {announcement.sent_at ? 'Sent:' : 'Scheduled:'}
                                    </span>
                                    <span className="text-sm truncate">
                                      {announcement.sent_at 
                                        ? format(new Date(announcement.sent_at), 'MMMM d')
                                        : announcement.scheduled_at 
                                        ? format(new Date(announcement.scheduled_at), 'MMMM d')
                                        : '-'
                                      }
                                    </span>
                                  </div>
                                  
                                   {/* Expires At */}
                                   {announcement.expires_at && (
                                     <div className="flex items-center gap-2 min-w-0 flex-1 text-muted-foreground">
                                       <IconClock className="h-4 w-4 flex-shrink-0" />
                                       <span className="text-sm font-medium">
                                         {isExpired ? 'Expired:' : 'Expires:'}
                                       </span>
                                       <span className="text-sm truncate">
                                         {format(new Date(announcement.expires_at), 'MMMM d')}
                                       </span>
                                     </div>
                                   )}
                                </div>
                                
                                {/* Show status indicator for expired announcements */}
                                {isExpired && (
                                  <div className="flex items-center gap-1 text-red-500 text-xs">
                                    <IconAlertCircle className="h-3 w-3" />
                                    <span className="font-medium">This announcement has expired</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-auto pt-4">
                                <div className="h-px bg-border mb-3" />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">Recipients</span>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button className="rounded-md border px-1.5 py-0.5 text-base font-semibold leading-none text-foreground/80 hover:bg-accent hover:border-primary/50 hover:text-primary transition-all duration-200 cursor-pointer" onClick={async (e) => { e.stopPropagation(); await fetchUsersForAnnouncement(announcement.id!, announcement.assigned_user_ids || []) }}>
                                          {announcement.assigned_user_ids ? announcement.assigned_user_ids.length : 0}
                                        </button>
                                      </PopoverTrigger>
                                    <PopoverContent align="end" sideOffset={6} className="w-80 p-2">
                                      <div className="flex flex-wrap gap-2 items-center justify-center min-h-10">
                                        {loadingUsersKey === `announcement:${announcement.id}` && !announcementUsersCache[`announcement:${announcement.id}`] && (
                                          <div className="w-full flex items-center justify-center py-2 gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0s' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.4s' }} />
                                          </div>
                                        )}
                                        {(announcementUsersCache[`announcement:${announcement.id}`]?.users || []).map(u => (
                                          <UserTooltip key={u.user_id} user={u} showEmployeeId={true} />
                                        ))}
                                        {loadingUsersKey !== `announcement:${announcement.id}` && (!announcementUsersCache[`announcement:${announcement.id}`]?.users || announcementUsersCache[`announcement:${announcement.id}`]?.users.length === 0) && (
                                          <div className="text-xs text-muted-foreground w-full text-center">No Users Assigned</div>
                                        )}
                                      </div>
                                    </PopoverContent>
                                    </Popover>
                                  </div>
                                </div>
                              </div>
                              
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-muted-foreground">
                          {filteredAnnouncements.length > 0
                            ? <>Showing {filteredAnnouncements.length} of {totalCount} Announcements (Status: {selectedStatus})</>
                            : <>No announcements found with status: {selectedStatus}</>
                          }
                        </div>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.max(1, p - 1)) }}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page) }} isActive={currentPage === page}>
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.min(totalPages, p + 1)) }}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                    {filteredAnnouncements.length === 0 && !loading && (
                      <div className="flex flex-col h-[75vh]">
                        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 flex-1 flex items-center justify-center">
                          <div>
                            <p className="text-sm font-medium">No Announcements Found</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Announcement Modal */}
      <AddAnnouncementModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAnnouncementAdded={handleAnnouncementAdded}
        announcementToEdit={editingAnnouncement}
      />
    </>
  )
}
