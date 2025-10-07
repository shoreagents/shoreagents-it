"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ReloadButton } from "@/components/ui/reload-button"
import { IconSearch, IconMapPin, IconClock, IconUsers, IconPlus, IconCalendar } from "@tabler/icons-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { Event } from "@/lib/db-utils"
import { AddEventModal } from "@/components/modals/events-detail-modal"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { useTheme } from "next-themes"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserTooltip } from "@/components/ui/user-tooltip"
import { useRealtimeEvents } from "@/hooks/use-realtime-events"

export default function EventsPage() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('upcoming')
  const [loadingParticipantsKey, setLoadingParticipantsKey] = useState<string | null>(null)
  const [eventParticipantsCache, setEventParticipantsCache] = useState<Record<string, { users: { user_id: number, first_name: string | null, last_name: string | null, profile_picture: string | null, employee_id: string | null }[] }>>({})
  const [todayCount, setTodayCount] = useState<number>(0)
  const [reloading, setReloading] = useState(false)

  // Realtime events hook
  const { isConnected: isRealtimeConnected } = useRealtimeEvents({
    onEventCreated: (newEvent) => {
      console.log('🔄 New event created:', newEvent)
      setEvents(prev => [newEvent, ...prev])
      setTotalCount(prev => prev + 1)
      // Refresh today count when new event is created
      fetchTodayCount()
    },
    onEventUpdated: (updatedEvent, oldEvent) => {
      console.log('🔄 Event updated:', updatedEvent, 'Old:', oldEvent)
      setEvents(prev => prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      ))
      // Refresh today count when event status might have changed
      fetchTodayCount()
    },
    onEventDeleted: (deletedEvent) => {
      console.log('🔄 Event deleted:', deletedEvent)
      if (deletedEvent && deletedEvent.id) {
        setEvents(prev => prev.filter(event => event.id !== deletedEvent.id))
        setTotalCount(prev => Math.max(0, prev - 1))
        // Refresh today count when event is deleted
        fetchTodayCount()
      } else {
        console.warn('Received event deletion notification without valid event data:', deletedEvent)
        // Refresh the events list as fallback
        refreshEventsOnly()
        fetchTodayCount()
      }
    },
    onEventAttendanceChanged: (attendance) => {
      console.log('🔄 Event attendance changed:', attendance)
      // Refresh the events list to get updated participant counts
      refreshEventsOnly()
    },
    enableNotifications: true
  })


  const fetchTodayCount = async () => {
    try {
      const res = await fetch('/api/events/counts')
      if (res.ok) {
        const data = await res.json()
        setTodayCount(data.today)
        console.log('Today count fetched:', data.today)
      } else {
        console.warn('Failed to fetch today count')
      }
    } catch (error) {
      console.error('Error fetching today count:', error)
    }
  }

  const fetchEvents = async (status?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        sortField: 'event_date',
        sortDirection: 'asc'
      })
      
      // Add status filter for better performance
      const statusToFetch = status || selectedStatus
      if (statusToFetch) {
        params.append('status', statusToFetch)
      }
      
      if (search.trim()) params.append('search', search.trim())
      
      console.log('Fetching events with params:', params.toString())
      const res = await fetch(`/api/events?${params.toString()}`)
      console.log('Events API response status:', res.status)
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Events API error:', err)
        throw new Error(err.error || "Failed to fetch events")
      }
      const data = await res.json()
      console.log('Events data received:', data)
      setEvents(data.events || [])
      setTotalCount(data.pagination?.totalCount || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (e: any) {
      console.error('Error fetching events:', e)
      setError(e?.message || "Failed to fetch events")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [currentPage, search, selectedStatus])

  // Fetch today count on initial load
  useEffect(() => {
    fetchTodayCount()
  }, [])

  // Handle theme hydration
  useEffect(() => {
    setMounted(true)
  }, [])



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  const handleAddEvent = () => {
    setSelectedEvent(null)
    setIsModalOpen(true)
  }

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  const refreshEventsOnly = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        sortField: 'event_date',
        sortDirection: 'asc'
      })
      
      // Add status filter for better performance
      if (selectedStatus) {
        params.append('status', selectedStatus)
      }
      
      if (search.trim()) params.append('search', search.trim())
      
      console.log('Fetching events with params:', params.toString())
      const res = await fetch(`/api/events?${params.toString()}`)
      console.log('Events API response status:', res.status)
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Events API error:', err)
        throw new Error(err.error || "Failed to fetch events")
      }
      const data = await res.json()
      console.log('Events data received:', data)
      setEvents(data.events || [])
      setTotalCount(data.pagination?.totalCount || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (e: any) {
      console.error('Error fetching events:', e)
      setError(e?.message || "Failed to fetch events")
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
      
      // First, update event statuses in database based on current date
      try {
        console.log('Updating event statuses based on current date...')
        
        // Get browser's current date to send to API
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const browserDate = `${year}-${month}-${day}` // YYYY-MM-DD format
        
        const updateResponse = await fetch('/api/events/update-statuses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ date: browserDate })
        })
        
        if (updateResponse.ok) {
          const updateData = await updateResponse.json()
          console.log('Event statuses updated successfully:', updateData)
          
          // Log detailed update information
          if (updateData.updates) {
            console.log('Update summary:', {
              ended: updateData.updates.ended,
              today: updateData.updates.today,
              upcoming: updateData.updates.upcoming,
              date: updateData.date
            })
          }
        } else {
          const errorData = await updateResponse.json().catch(() => ({}))
          console.warn('Failed to update event statuses:', errorData)
        }
      } catch (updateError) {
        console.warn('Error updating event statuses:', updateError)
        // Continue with fetching events even if status update fails
      }
      
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        sortField: 'event_date',
        sortDirection: 'asc'
      })
      
      // Add status filter for better performance
      const statusToFetch = selectedStatus
      if (statusToFetch) {
        params.append('status', statusToFetch)
      }
      
      if (search.trim()) params.append('search', search.trim())
      
      console.log('Fetching events with params:', params.toString())
      const res = await fetch(`/api/events?${params.toString()}`)
      console.log('Events API response status:', res.status)
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Events API error:', err)
        throw new Error(err.error || "Failed to fetch events")
      }
      const data = await res.json()
      console.log('Events data received:', data)
      setEvents(data.events || [])
      setTotalCount(data.pagination?.totalCount || 0)
      setTotalPages(data.pagination?.totalPages || 1)
      
      // Fetch today count after loading events
      fetchTodayCount()
      setError(null) // Clear any previous errors
      
    } catch (err) {
      console.error('❌ Reload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to reload events')
    } finally {
      setReloading(false)
    }
  }

  const handleEventSaved = () => {
    // Don't refresh events - real-time updates handle this automatically
    // The useRealtimeEvents hook already updates the events list when changes occur
    // But we should refresh today count in case status changed
    fetchTodayCount()
  }

  const fetchParticipantsForEvent = async (eventId: number) => {
    const key = `event:${eventId}`
    if (eventParticipantsCache[key]) return eventParticipantsCache[key].users
    
    try {
      setLoadingParticipantsKey(key)
      const response = await fetch(`/api/events/${eventId}/participants`)
      if (response.ok) {
        const data = await response.json()
        const participants = data.participants || []
        setEventParticipantsCache(prev => ({
          ...prev,
          [key]: { users: participants }
        }))
        return participants
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
    } finally {
      setLoadingParticipantsKey(null)
    }
    return []
  }

  const fetchInviteesForEvent = async (eventId: number, assignedUserIds: number[]) => {
    const key = `invitees:${eventId}`
    if (eventParticipantsCache[key]) return eventParticipantsCache[key].users
    
    if (!assignedUserIds || assignedUserIds.length === 0) {
      return []
    }
    
    try {
      setLoadingParticipantsKey(key)
      const response = await fetch(`/api/events/${eventId}/invitees?userIds=${assignedUserIds.join(',')}`)
      if (response.ok) {
        const data = await response.json()
        const invitees = data.invitees || []
        setEventParticipantsCache(prev => ({
          ...prev,
          [key]: { users: invitees }
        }))
        return invitees
      }
    } catch (error) {
      console.error('Error fetching invitees:', error)
    } finally {
      setLoadingParticipantsKey(null)
    }
    return []
  }


  // Function to determine event status based on user's local timezone and event_date
  const getEventStatusByDate = (eventDate: string, currentStatus: string) => {
    // Don't change cancelled events - preserve manual cancellations
    if (currentStatus === 'cancelled') {
      return 'cancelled'
    }

    // Get current date in user's local timezone
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const today = `${year}-${month}-${day}` // YYYY-MM-DD format
    
    // Ensure eventDate is in YYYY-MM-DD format (remove any time component)
    const eventDateOnly = eventDate.split('T')[0]
    
    // Debug logging
    console.log('Date comparison:', {
      originalEventDate: eventDate,
      eventDateOnly,
      today,
      eventDateType: typeof eventDateOnly,
      todayType: typeof today,
      comparison: {
        'eventDateOnly > today': eventDateOnly > today,
        'eventDateOnly === today': eventDateOnly === today,
        'eventDateOnly < today': eventDateOnly < today
      }
    })
    
    // Compare event_date (from database) with today's date in Manila timezone
    if (eventDateOnly > today) {
      return 'upcoming'  // Future events
    } else if (eventDateOnly === today) {
      return 'today'     // Events happening today
    } else {
      return 'ended'     // Past events
    }
  }

  // No need for client-side filtering since API handles status filtering
  const filteredEvents = events

  // Calculate counts for each status - we'll fetch these separately for better performance
  const getEventCountByStatus = (status: string) => {
    // For now, return 0 - we'll implement a separate API call for counts
    // This prevents unnecessary filtering of all events
    return 0
  }

  // Create tabs configuration with today count only
  const tabs = [
    {
      title: 'Upcoming',
      value: 'upcoming',
      content: null
    },
    {
      title: 'Today',
      value: 'today',
      content: null,
      badge: todayCount > 0 ? todayCount : undefined
    },
    {
      title: 'Ended',
      value: 'ended',
      content: null
    },
    {
      title: 'Cancelled',
      value: 'cancelled',
      content: null
    }
  ]

  const handleTabChange = (tab: any) => {
    setSelectedStatus(tab.value)
    setCurrentPage(1) // Reset to first page when changing tabs
    // fetchEvents will be called automatically by useEffect when selectedStatus changes
  }

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
                    <h1 className="text-2xl font-bold">Events & Activities</h1>
                    <p className="text-sm text-muted-foreground">Discover and track all company events and activities in one place.</p>
                  </div>
                  <ReloadButton onReload={handleReload} loading={reloading} />
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by event/activity title, description, location, or type..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleAddEvent} 
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
                      containerClassName="grid grid-cols-4 w-fit"
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
                      {filteredEvents.map((event) => (
                        <Card 
                          key={event.id} 
                          className="h-full cursor-pointer hover:border-primary/50 hover:text-primary transition-all duration-200"
                          onClick={() => handleEditEvent(event)}
                        >
                          <CardContent className="p-4 h-full flex flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate max-w-[14rem]">{event.title}</div>
                                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {event.description || '-'}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                <Badge 
                                  variant="outline" 
                                  className={`px-3 py-1 font-medium ${
                                    event.event_type === 'event' 
                                      ? 'text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20'
                                      : 'text-yellow-700 dark:text-white border-yellow-600/20 bg-yellow-50 dark:bg-yellow-600/20'
                                  }`}
                                >
                                  {event.event_type === 'event' ? 'Event' : 'Activity'}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="mt-3 space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground truncate">
                                <IconCalendar className="h-4 w-4" />
                                <span className="truncate">{formatDate(event.event_date)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground truncate">
                                <IconClock className="h-4 w-4" />
                                <span className="truncate">{formatTimeRange(event.start_time, event.end_time)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground truncate">
                                <IconMapPin className="h-4 w-4" />
                                <span className="truncate">{event.location || '-'}</span>
                              </div>
                            </div>
                            
                            <div className="mt-auto pt-4">
                              <div className="h-px bg-border mb-3" />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">Invitees</span>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="rounded-md border px-1.5 py-0.5 text-base font-semibold leading-none text-foreground/80 hover:bg-accent hover:border-primary/50 hover:text-primary transition-all duration-200 cursor-pointer" onClick={async (e) => { e.stopPropagation(); await fetchInviteesForEvent(event.id, event.assigned_user_ids || []) }}>
                                        {event.assigned_user_ids ? event.assigned_user_ids.length : 0}
                                      </button>
                                    </PopoverTrigger>
                                  <PopoverContent align="end" sideOffset={6} className="w-80 p-2">
                                    <div className="flex flex-wrap gap-2 items-center justify-center min-h-10">
                                      {loadingParticipantsKey === `invitees:${event.id}` && !eventParticipantsCache[`invitees:${event.id}`] && (
                                        <div className="w-full flex items-center justify-center py-2 gap-1">
                                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0s' }} />
                                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.4s' }} />
                                        </div>
                                      )}
                                      {(eventParticipantsCache[`invitees:${event.id}`]?.users || []).map(u => (
                                        <UserTooltip key={u.user_id} user={u} showEmployeeId={true} />
                                      ))}
                                      {loadingParticipantsKey !== `invitees:${event.id}` && (!eventParticipantsCache[`invitees:${event.id}`]?.users || eventParticipantsCache[`invitees:${event.id}`]?.users.length === 0) && (
                                        <div className="text-xs text-muted-foreground w-full text-center">No Invitees</div>
                                      )}
                                    </div>
                                  </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            </div>
                            
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-muted-foreground">
                          {filteredEvents.length > 0
                            ? <>Showing {filteredEvents.length} of {totalCount} Events & Activities (Database Status: {selectedStatus})</>
                            : <>No events or activities found with database status: {selectedStatus}</>
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
                    {filteredEvents.length === 0 && !loading && (
                      <div className="flex flex-col h-[75vh]">
                        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 flex-1 flex items-center justify-center">
                          <div>
                            <p className="text-sm font-medium">No Events or Activities Found</p>
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

      {/* Event Modal */}
      <AddEventModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onEventAdded={handleEventSaved}
        eventToEdit={selectedEvent as any}
      />
    </>
  )
}
