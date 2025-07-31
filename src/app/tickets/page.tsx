"use client"

import * as React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { IconSearch, IconFilter, IconGripVertical, IconRefresh } from "@tabler/icons-react"
import { useRealtimeTickets } from "@/hooks/use-realtime-tickets"
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type TicketStatus = 'For Approval' | 'On Hold' | 'In Progress' | 'Approved' | 'Completed'
type TicketCategory = 'Computer & Equipment' | 'Station' | 'Surroundings' | 'Schedule' | 'Compensation' | 'Transport' | 'Suggestion' | 'Check-in'

interface Ticket {
  id: number
  ticket_id: string
  user_id: number
  concern: string
  details: string | null
  category: TicketCategory
  status: TicketStatus
  position: number
  resolved_by: number | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  station_id: string | null
  profile_picture: string | null
  first_name: string | null
  last_name: string | null
}

interface SortableTicketProps {
  ticket: Ticket
  isLast?: boolean
}

const getCategoryBadge = (ticket: Ticket) => {
  const categoryColors: Record<TicketCategory, string> = {
    'Computer & Equipment': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    'Station': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    'Surroundings': 'bg-green-100 text-green-800 hover:bg-green-200',
    'Schedule': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    'Compensation': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    'Transport': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
    'Suggestion': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
    'Check-in': 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
  
  return {
    name: ticket.category,
    color: categoryColors[ticket.category] || 'bg-gray-100 text-gray-800'
  }
}

const SortableTicket = React.memo(function SortableTicket({ ticket, isLast = false }: SortableTicketProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id.toString() })

  const style = useMemo(() => {
    return {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }
  }, [transform, transition, isDragging])

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-drag-handle]') || target.closest('.cursor-grab')) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    setIsExpanded(prev => !prev)
  }, [])

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  const handleChatClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if we're in Electron environment
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.openChatWindow(ticket.id, ticket)
        .then((result: any) => {
          if (result.success) {
            console.log('Chat window opened successfully')
          } else {
            console.error('Failed to open chat window:', result.error)
          }
        })
        .catch((error: any) => {
          console.error('Error opening chat window:', error)
        })
    } else {
      // Fallback for web environment - could open in new tab or modal
      console.log('Opening chat for ticket:', ticket.id)
      // You could implement a web fallback here
    }
  }, [ticket])

  // Cleanup effect for animations
  useEffect(() => {
    return () => {
      // Ensure animations are properly cleaned up when component unmounts
      setIsExpanded(false)
    }
  }, [])

  const categoryBadge = useMemo(() => getCategoryBadge(ticket), [ticket.category])

  const cardClassName = useMemo(() => {
    return `${isLast ? '' : 'mb-3'} p-4 transition-colors duration-150 cursor-pointer ${
      isDragging ? 'opacity-50' : ''
    } ${
      isHovered ? 'border-primary' : 'hover:border-primary/50'
    }`
  }, [isDragging, isHovered, isLast])

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cardClassName}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">
              {ticket.ticket_id}
            </div>
            <div className="flex flex-col text-xs text-muted-foreground px-2 py-1 rounded-md">
              <span className="text-xs font-medium text-muted-foreground/70">Filed at</span>
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {new Date(ticket.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="font-mono text-muted-foreground/70">
                  {new Date(ticket.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            </div>
          </div>
          <h4 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight">{ticket.concern}</h4>
          <div className="mb-2">
            <Badge variant="secondary" className={`text-xs ${categoryBadge?.color || 'bg-gray-100 text-gray-800'}`}>
              {categoryBadge?.name || 'General'}
            </Badge>
          </div>
        </div>
        <div 
          className="cursor-grab active:cursor-grabbing p-2 rounded-md transition-colors duration-200 flex-shrink-0"
          data-drag-handle
          {...attributes}
          {...listeners}
        >
          <IconGripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
                    <AnimatePresence>
         {isExpanded && (
           <motion.div
             initial={{ height: 0 }}
             animate={{ height: "auto" }}
             exit={{ height: 0 }}
             transition={{ duration: 0.1, ease: "easeOut" }}
             className="mt-3 pt-3 border-t border-border/50 overflow-hidden"
           >
             <div className="space-y-3">
               <div>
                 <p className="text-sm text-muted-foreground leading-relaxed">{ticket.details}</p>
               </div>
               <div className="flex items-center gap-2 mb-3">
                 <Button 
                   size="sm" 
                   variant="outline" 
                   className="text-sm h-8 flex-1 rounded-xl shadow-none"
                   onClick={handleChatClick}
                 >
                   Chat
                 </Button>
                 <Button size="sm" variant="outline" className="text-sm h-8 flex-1 rounded-xl shadow-none">
                   Documents
                 </Button>
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50">
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
          <span className="text-xs font-medium text-foreground">
            {ticket.first_name && ticket.last_name 
              ? `${ticket.first_name} ${ticket.last_name}`
              : `User ${ticket.user_id}`
            }
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {ticket.station_id || 'No Station'}
        </div>
      </div>
    </Card>
  )
})

const getStatusColor = (status: TicketStatus) => {
  switch (status) {
    case "For Approval":
      return "text-yellow-600 border-yellow-600/20 bg-yellow-600/5"
    case "On Hold":
      return "text-gray-600 border-gray-600/20 bg-gray-600/5"
    case "In Progress":
      return "text-purple-600 border-purple-600/20 bg-purple-600/5"
    case "Approved":
      return "text-blue-600 border-blue-600/20 bg-blue-600/5"
    case "Completed":
      return "text-green-600 border-green-600/20 bg-green-600/5"
    default:
      return "text-gray-600 border-gray-600/20 bg-gray-600/5"
  }
}

function DraggingTicket({ ticket }: { ticket: Ticket }) {
  const categoryBadge = getCategoryBadge(ticket)
  
  return (
    <Card className="mb-3 p-4 cursor-grabbing">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">
              {ticket.ticket_id}
            </div>
            <div className="flex flex-col text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
              <span className="font-medium">
                {new Date(ticket.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric'
                })}
              </span>
              <span className="font-mono text-muted-foreground/70">
                {new Date(ticket.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
          </div>
          <h4 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight">{ticket.concern}</h4>
          <div className="mb-2">
            <Badge variant="secondary" className={`text-xs ${categoryBadge?.color || 'bg-gray-100 text-gray-800'}`}>
              {categoryBadge?.name || 'General'}
            </Badge>
          </div>
        </div>
        <div className="p-2 rounded-md flex-shrink-0">
          <IconGripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
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
          <span className="text-xs font-medium text-foreground">
            {ticket.first_name && ticket.last_name 
              ? `${ticket.first_name} ${ticket.last_name}`
              : `User ${ticket.user_id}`
            }
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {ticket.station_id || 'No Station'}
        </div>
      </div>
    </Card>
  )
}

function TicketSkeleton() {
  return (
    <Card className="mb-3 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-16" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-3 w-20 mb-2" />
        </div>
        <Skeleton className="h-5 w-5 flex-shrink-0" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>
    </Card>
  )
}

function TicketsSkeleton() {
  return (
    <div className="w-full overflow-x-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {["On Hold", "For Approval", "Approved", "In Progress", "Completed"].map((status) => (
          <div key={status}>
            <div className="bg-gradient-to-br from-background to-muted/20 border border-border/50 rounded-xl p-4 shadow-sm transition-all duration-200 min-h-[500px] flex flex-col">
              <div className="flex-shrink-0 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`px-3 py-1 font-medium ${
                      status === 'On Hold' ? 'text-gray-600 border-gray-600/20 bg-gray-600/5' :
                      status === 'For Approval' ? 'text-yellow-600 border-yellow-600/20 bg-yellow-600/5' :
                      status === 'Approved' ? 'text-blue-600 border-blue-600/20 bg-blue-600/5' :
                      status === 'In Progress' ? 'text-purple-600 border-purple-600/20 bg-purple-600/5' :
                      status === 'Completed' ? 'text-green-600 border-green-600/20 bg-green-600/5' :
                      'text-gray-600 border-gray-600/20 bg-gray-600/5'
                    }`}>
                      {status === 'Completed' ? 'Closed' : status}
                    </Badge>
                    <Skeleton className="h-6 w-8" />
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                {Array.from({ length: 3 }).map((_, index) => (
                  <TicketSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface DroppableContainerProps {
  status: string
  children: React.ReactNode
}

function DroppableContainer({ status, children }: DroppableContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${status}`,
  })

  return (
    <div 
      ref={setNodeRef}
      className="h-full overflow-y-auto transition-colors duration-200"
    >
      {children}
    </div>
  )
}



export default function TicketsPage() {
  const [mounted, setMounted] = useState(false)
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set())
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Real-time updates
  const { isConnected: isRealtimeConnected } = useRealtimeTickets({
    onTicketCreated: (newTicket) => {
      console.log('🆕 New ticket created:', newTicket)
      setTickets(prev => [...prev, newTicket])
    },
    onTicketUpdated: (updatedTicket, oldTicket) => {
      console.log('🔄 Ticket updated:', updatedTicket, 'Old:', oldTicket)
      setTickets(prev => prev.map(ticket => 
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      ))
    },
    onTicketDeleted: (deletedTicket) => {
      console.log('🗑️ Ticket deleted:', deletedTicket)
      setTickets(prev => prev.filter(ticket => ticket.id !== deletedTicket.id))
    }
  })

  useEffect(() => {
    setMounted(true)
    fetchTickets()
  }, [])



  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/tickets')
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

  const updateTicketStatus = async (ticketId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        const result = await response.json()
        // Update local state with the complete updated ticket data
        setTickets(prevTickets => {
          return prevTickets.map((item) => 
            item.id === ticketId 
              ? { ...item, ...result }
              : item
          )
        })
      } else {
        const errorData = await response.json()
        console.error('Failed to update ticket status:', errorData)
        // Revert local state on error
        await fetchTickets()
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
      // Revert local state on error
      await fetchTickets()
    }
  }

  const updateTicketPosition = async (ticketId: number, newPosition: number) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/position`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position: newPosition }),
      })

      if (response.ok) {
        const result = await response.json()
        // Update local state instead of refetching
        setTickets(prevTickets => {
          return prevTickets.map((item) => 
            item.id === ticketId 
              ? { ...item, position: newPosition }
              : item
          )
        })
      } else {
        const errorData = await response.json()
        console.error('Failed to update ticket position:', errorData)
        // Revert local state on error
        await fetchTickets()
      }
    } catch (error) {
      console.error('Error updating ticket position:', error)
      // Revert local state on error
      await fetchTickets()
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event

    if (!active || !over) return

    const activeTicket = tickets.find((item) => item.id.toString() === active.id)
    if (!activeTicket) return

    // Handle dropping on a droppable zone (status column)
    if (over.id.toString().startsWith('droppable-')) {
      const targetStatus = over.id.toString().replace('droppable-', '') as TicketStatus
      if (activeTicket.status !== targetStatus) {
        // Update local state immediately for UI responsiveness
        setTickets(prevTickets => {
          return prevTickets.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: targetStatus }
              : item
          )
        })
        
        // Update database
        updateTicketStatus(activeTicket.id, targetStatus)
      }
      return
    }

    // Handle dropping on another ticket
    const overTicket = tickets.find((item) => item.id.toString() === over.id)
    if (overTicket && activeTicket.id !== overTicket.id) {
      // If dropping on a ticket in a different status, move to that status
      if (activeTicket.status !== overTicket.status) {
        // Update local state immediately for UI responsiveness
        setTickets(prevTickets => {
          return prevTickets.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: overTicket.status as TicketStatus }
              : item
          )
        })
        
        // Update database
        updateTicketStatus(activeTicket.id, overTicket.status)
      }
      // Note: For same status reordering, we let dnd-kit handle the visual reordering
      // and only update positions in handleDragEnd
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)

    if (!active || !over) return

    const activeTicket = tickets.find((item) => item.id.toString() === active.id)
    if (!activeTicket) return

    // Handle dropping on a droppable zone (status column)
    if (over.id.toString().startsWith('droppable-')) {
      const targetStatus = over.id.toString().replace('droppable-', '') as TicketStatus
      
      if (activeTicket.status !== targetStatus) {
        // Update local state immediately for UI responsiveness
        setTickets((items) => {
          return items.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: targetStatus }
              : item
          )
        })
        
        // Update database
        updateTicketStatus(activeTicket.id, targetStatus)
      } else {
        // Status unchanged - ticket already in targetStatus status
      }
      return
    }

    // Handle dropping on another ticket
    const overTicket = tickets.find((item) => item.id.toString() === over.id)
    if (overTicket && activeTicket.id !== overTicket.id) {
      // If dropping on a ticket in a different status, move to that status
      if (activeTicket.status !== overTicket.status) {
        // Update local state immediately for UI responsiveness
        setTickets((items) => {
          return items.map((item) => 
            item.id.toString() === active.id 
              ? { ...item, status: overTicket.status as TicketStatus }
              : item
          )
        })
        
        // Update database
        updateTicketStatus(activeTicket.id, overTicket.status)
      } else {
        // Same status, reordering - only update database since visual changes already happened
        const oldIndex = tickets.findIndex((item) => item.id.toString() === active.id)
        const newIndex = tickets.findIndex((item) => item.id.toString() === over.id)
        
        if (oldIndex !== newIndex) {
          console.log('🔄 Reordering tickets within same status:', activeTicket.status)
          console.log('📊 Old index:', oldIndex, 'New index:', newIndex)
          
          // Reorder the tickets and update positions
          setTickets(prevTickets => {
            const reorderedTickets = arrayMove(prevTickets, oldIndex, newIndex)
            const statusTickets = reorderedTickets.filter(t => t.status === activeTicket.status)
            const positionUpdates = statusTickets.map((ticket, index) => ({
              id: ticket.id,
              position: index
            }))
            
            console.log('📊 Position updates:', positionUpdates)
            
            // Update positions in database
            fetch('/api/tickets/positions', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ positions: positionUpdates }),
            }).then(response => {
              if (response.ok) {
                console.log('✅ Positions updated successfully')
              } else {
                console.error('❌ Failed to update ticket positions')
                // Revert on error
                fetchTickets()
              }
            }).catch(error => {
              console.error('❌ Error updating ticket positions:', error)
              // Revert on error
              fetchTickets()
            })
            
            // Return updated tickets with new positions
            return reorderedTickets.map((item) => {
              const statusIndex = statusTickets.findIndex(t => t.id === item.id)
              if (statusIndex !== -1) {
                return { ...item, position: statusIndex }
              }
              return item
            })
          })
        }
      }
    }
  }

  const getTicketsByStatus = (status: TicketStatus) => {
    let filteredTickets = tickets.filter(ticket => ticket.status === status)
    
    // For Completed status, only show tickets resolved today (not past tickets)
    if (status === 'Completed') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      filteredTickets = filteredTickets.filter(ticket => {
        // Check if resolved_at date is today
        if (ticket.resolved_at) {
          const resolvedDate = new Date(ticket.resolved_at)
          resolvedDate.setHours(0, 0, 0, 0)
          return resolvedDate.getTime() === today.getTime()
        }
        
        // Fallback to created_at if resolved_at is null
        const createdDate = new Date(ticket.created_at)
        createdDate.setHours(0, 0, 0, 0)
        return createdDate.getTime() === today.getTime()
      })
    }
    
    // Sort by position within the status
    return filteredTickets.sort((a, b) => a.position - b.position)
  }

  const getStatusDisplayLabel = (status: string) => {
    if (status === 'Completed') return 'Closed'
    return status
  }

  const statuses = ["On Hold", "For Approval", "Approved", "In Progress", "Completed"]

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
                    <h1 className="text-3xl font-bold mb-2">Tickets</h1>
                    <p className="text-base text-muted-foreground">Drag and drop tickets to manage their status</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets..."
                      className="pl-8"
                    />
                  </div>

                  <Button 
                    variant="outline" 
                    className="text-sm h-8 rounded-xl shadow-none"
                    onClick={fetchTickets}
                    disabled={loading}
                  >
                    <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Reload
                  </Button>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                {loading ? (
                  <TicketsSkeleton />
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="w-full overflow-x-auto">
                      <div className="flex gap-3">
                        {statuses.map((status) => (
                          <div key={status}>
                            <div className="bg-gradient-to-br from-background to-muted/20 border border-border/50 rounded-xl p-4 shadow-sm transition-all duration-200 h-[calc(100vh-260px)] w-[350px] flex flex-col">
                              <div className="flex-shrink-0 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={`${getStatusColor(status as TicketStatus)} px-3 py-1 font-medium`}>
                                      {getStatusDisplayLabel(status)}
                                    </Badge>
                                    <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                      {getTicketsByStatus(status as TicketStatus).length}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <DroppableContainer status={status}>
                                <div className="flex-1 overflow-y-auto">
                                  <SortableContext
                                    items={getTicketsByStatus(status as TicketStatus).map(ticket => ticket.id.toString())}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {getTicketsByStatus(status as TicketStatus).map((ticket, index, array) => (
                                      <SortableTicket 
                                        key={ticket.id} 
                                        ticket={ticket}
                                        isLast={index === array.length - 1}
                                      />
                                    ))}
                                  </SortableContext>
                                  
                                  {getTicketsByStatus(status as TicketStatus).length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20">
                                      <p className="text-sm font-medium">No tickets</p>
                                    </div>
                                  )}
                                </div>
                              </DroppableContainer>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <DragOverlay>
                      {activeId ? (
                        <DraggingTicket 
                          ticket={tickets.find(ticket => ticket.id.toString() === activeId)!} 
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
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
