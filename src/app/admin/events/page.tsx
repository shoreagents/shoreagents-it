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

interface Event {
  id: number
  title: string
  description: string | null
  event_date: string
  start_time: string
  end_time: string
  location: string | null
  status: string
  event_type: string
  created_by: number
  created_at: string
  updated_at: string
  first_name: string | null
  last_name: string | null
  participants_count: number
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        sortField: 'event_date',
        sortDirection: 'asc'
      })
      if (search.trim()) params.append('search', search.trim())
      
      const res = await fetch(`/api/events?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to fetch events")
      }
      const data = await res.json()
      setEvents(data.events || [])
      setTotalCount(data.pagination?.totalCount || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (e: any) {
      setError(e?.message || "Failed to fetch events")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [currentPage, search])

  const getTypeBadgeClass = (type: string): string => {
    const t = type.toLowerCase()
    if (t === 'event') {
      return 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20'
    }
    if (t === 'activity') {
      return 'text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20'
    }
    return 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
  }

  const getStatusBadgeClass = (status: string): string => {
    const s = status.toLowerCase()
    if (s === 'upcoming') {
      return 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20'
    }
    if (s === 'today') {
      return 'text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20'
    }
    if (s === 'ended') {
      return 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
    }
    if (s === 'cancelled') {
      return 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20'
    }
    return 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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

  // Filter events based on search (now handled by API)
  const filteredEvents = events

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
                    <h1 className="text-2xl font-bold">Events</h1>
                    <p className="text-sm text-muted-foreground">Directory of company events</p>
                  </div>
                  <div className="flex gap-2">
                    <ReloadButton onReload={fetchEvents} loading={loading} className="flex-1" />
                  </div>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by event title, description, location, or type..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {/* Add event functionality */}} 
                  >
                    <IconPlus className="h-4 w-4" />
                    Add Event
                  </Button>
                </div>
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredEvents.map((event) => (
                        <Card key={event.id} className="h-full cursor-pointer hover:border-primary/50 hover:text-primary transition-all duration-200">
                          <CardContent className="p-4 h-full flex flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate max-w-[14rem]">{event.title}</div>
                                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {event.description || 'No description available'}
                                </div>
                              </div>
                              {event.status === 'today' && (
                                <Badge 
                                  variant="outline" 
                                  className="px-2 py-1 text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                                >
                                  Today
                                </Badge>
                              )}
                            </div>
                            
                            <div className="mt-3 space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground truncate">
                                <IconCalendar className="h-4 w-4" />
                                <span className="truncate">{formatDate(event.event_date)} at {formatTimeRange(event.start_time, event.end_time)}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2 text-muted-foreground truncate">
                                  <IconMapPin className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-muted-foreground truncate">
                                <IconUsers className="h-4 w-4" />
                                <span className="truncate">{event.participants_count} participants</span>
                              </div>
                              {(event.first_name || event.last_name) && (
                                <div className="flex items-center gap-2 text-muted-foreground truncate">
                                  <span className="text-xs">Created by: {event.first_name} {event.last_name}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-auto pt-4">
                              <div className="h-px bg-border mb-3" />
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`px-2 py-1 font-medium ${getTypeBadgeClass(event.event_type)}`}
                                  >
                                    {event.event_type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`px-2 py-1 font-medium ${getStatusBadgeClass(event.status)}`}
                                  >
                                    {event.status}
                                  </Badge>
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
                          {totalCount > 0
                            ? <>Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} Events</>
                            : <>Showing 0 to 0 of 0 Events</>
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
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <IconCalendar className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No events found</h3>
                        <p className="text-sm">Try adjusting your search or add a new event</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
