"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { IconSearch, IconRefresh, IconHistory } from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type TicketStatus = 'For Approval' | 'On Hold' | 'In Progress' | 'Approved' | 'Stuck' | 'Actioned' | 'Closed'
interface TicketCategory {
  id: number
  name: string
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
}

function PastTicketsTable({ tickets }: { tickets: Ticket[] }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    return `${dateStr} • ${timeStr}`
  }

  const getStatusDisplayLabel = (status: string) => {
    return status
  }

  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      'Computer & Equipment': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'Network & Internet': 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
      'Station': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'Surroundings': 'bg-green-100 text-green-800 hover:bg-green-200',
      'Schedule': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'Compensation': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'Transport': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      'Suggestion': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      'Check-in': 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
    
    return (
      <Badge variant="secondary" className={`text-xs ${categoryColors[category] || 'bg-gray-100 text-gray-800'}`}>
        {category}
      </Badge>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket ID</TableHead>
            <TableHead>Concern</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Filed at</TableHead>
            <TableHead>Resolved at</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-mono text-sm">
                {ticket.ticket_id}
              </TableCell>
              <TableCell className="max-w-[200px]">
                <div className="truncate" title={ticket.concern}>
                  {ticket.concern}
                </div>
              </TableCell>
              <TableCell>
                {getCategoryBadge(ticket.category_name || ticket.category)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={ticket.profile_picture || ''} alt={`User ${ticket.user_id}`} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                      {ticket.first_name && ticket.last_name 
                        ? `${ticket.first_name[0]}${ticket.last_name[0]}`
                        : String(ticket.user_id).split(' ').map(n => n[0]).join('')
                      }
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {ticket.first_name && ticket.last_name 
                      ? `${ticket.first_name} ${ticket.last_name}`
                      : `User ${ticket.user_id}`
                    }
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(ticket.created_at)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {ticket.resolved_at ? formatDate(ticket.resolved_at) : '-'}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  {getStatusDisplayLabel('Closed')}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PastTicketsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PastTicketsPage() {
  const [mounted, setMounted] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setMounted(true)
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/tickets?status=Completed&past=true')
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to fetch tickets')
        console.error('Failed to fetch tickets:', response.status, errorData)
      }
    } catch (error) {
      setError('Network error - please check your connection')
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPastTickets = () => {
    let filteredTickets = tickets

    // Apply search filter
    if (searchTerm) {
      filteredTickets = filteredTickets.filter(ticket =>
        ticket.concern.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.first_name && ticket.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ticket.last_name && ticket.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Sort by resolved_at or created_at in descending order (most recent first)
    return filteredTickets.sort((a, b) => {
      const dateA = a.resolved_at ? new Date(a.resolved_at) : new Date(a.created_at)
      const dateB = b.resolved_at ? new Date(b.resolved_at) : new Date(b.created_at)
      return dateB.getTime() - dateA.getTime()
    })
  }

  const pastTickets = getPastTickets()

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">Past Tickets</h1>
                    <p className="text-muted-foreground">View completed tickets from previous dates</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="text-sm h-8 flex-1 rounded-xl shadow-none"
                      onClick={fetchTickets}
                      disabled={loading}
                    >
                      <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      Reload
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search past tickets..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-10 px-3 flex items-center">
                      {pastTickets.length} tickets
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                {loading ? (
                  <PastTicketsSkeleton />
                ) : error ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <p className="text-red-600 mb-2">{error}</p>
                      <Button onClick={fetchTickets} variant="outline">
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : mounted ? (
                  <>
                    {pastTickets.length > 0 ? (
                      <PastTicketsTable tickets={pastTickets} />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20">
                        <IconHistory className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm font-medium">No past tickets found</p>
                        <p className="text-xs text-muted-foreground/70">
                          {searchTerm ? 'No tickets match your search criteria' : 'Completed tickets from previous dates will appear here'}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading...</p>
                    </div>
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