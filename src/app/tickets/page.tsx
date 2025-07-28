"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconSearch, IconFilter, IconGripVertical } from "@tabler/icons-react"
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
import {
  useDroppable,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

interface Ticket {
  id: string
  title: string
  description: string

  assignee: string
  status: "On Hold" | "For Approval" | "Approved" | "In Progress" | "Completed"
  createdAt: string
}

interface SortableTicketProps {
  ticket: Ticket
}

function SortableTicket({ ticket }: SortableTicketProps) {
  const [isHovered, setIsHovered] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-2 p-3 border transition-colors duration-200 ${
        isDragging ? 'opacity-0' : ''
      } ${
        isHovered || isDragging ? 'border-primary' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1">TKT-{ticket.id.padStart(6, '0')}</div>
          <h4 className="font-medium text-sm mb-0.5">{ticket.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
        </div>
        <div 
          className="cursor-grab active:cursor-grabbing p-1"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          {...attributes}
          {...listeners}
        >
          <IconGripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground">{ticket.assignee}</span>
      </div>
    </Card>
  )
}

function DraggingTicket({ ticket }: { ticket: Ticket }) {
  return (
    <Card className="mb-2 p-3 border-primary cursor-grabbing">
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1">TKT-{ticket.id.padStart(6, '0')}</div>
          <h4 className="font-medium text-sm mb-0.5">{ticket.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
        </div>
        <div className="p-1">
          <IconGripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground">{ticket.assignee}</span>
      </div>
    </Card>
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
      className={`h-full overflow-y-auto transition-colors duration-200 ${
        isOver ? 'bg-muted/50' : ''
      }`}
    >
      {children}
    </div>
  )
}

export default function TicketsPage() {
  const [mounted, setMounted] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "1",
      title: "Implement user authentication",
      description: "Add login and registration functionality with JWT tokens",
      assignee: "John Doe",
      status: "On Hold",
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      title: "Build contact us page",
      description: "Create a contact form with email integration",
      assignee: "Jane Smith",
      status: "For Approval",
      createdAt: "2024-01-16"
    },
    {
      id: "3",
      title: "Create product catalog",
      description: "Design and implement product listing with filters",
      assignee: "Mike Johnson",
      status: "For Approval",
      createdAt: "2024-01-17"
    },
    {
      id: "4",
      title: "Develop homepage layout",
      description: "Design responsive homepage with hero section",
      assignee: "Sarah Wilson",
      status: "In Progress",
      createdAt: "2024-01-14"
    },
    {
      id: "5",
      title: "Design color scheme and typography",
      description: "Establish design system with consistent colors and fonts",
      assignee: "Alex Brown",
      status: "In Progress",
      createdAt: "2024-01-13"
    },
    {
      id: "6",
      title: "Project initiation and planning",
      description: "Set up project structure and define requirements",
      assignee: "Project Manager",
      status: "Completed",
      createdAt: "2024-01-10"
    },
    {
      id: "7",
      title: "Gather requirements from stakeholders",
      description: "Conduct interviews and document user needs",
      assignee: "Business Analyst",
      status: "Completed",
      createdAt: "2024-01-11"
    },
    {
      id: "8",
      title: "Create wireframes and mockups",
      description: "Design UI/UX wireframes for all pages",
      assignee: "UX Designer",
      status: "Completed",
      createdAt: "2024-01-12"
    }
  ])

  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!active || !over) return

    const activeTicket = tickets.find((item) => item.id === active.id)
    if (!activeTicket) return

    // Handle dropping on a droppable zone (status column)
    if (over.id.toString().startsWith('droppable-')) {
      const targetStatus = over.id.toString().replace('droppable-', '')
      if (activeTicket.status !== targetStatus) {
        setTickets((items) => {
          return items.map((item) => 
            item.id === active.id 
              ? { ...item, status: targetStatus as any }
              : item
          )
        })
      }
      return
    }

    // Handle dropping on another ticket
    const overTicket = tickets.find((item) => item.id === over.id)
    if (overTicket && activeTicket.id !== overTicket.id) {
      // If dropping on a ticket in a different status, move to that status
      if (activeTicket.status !== overTicket.status) {
        setTickets((items) => {
          return items.map((item) => 
            item.id === active.id 
              ? { ...item, status: overTicket.status }
              : item
          )
        })
      } else {
        // If dropping on a ticket in the same status, reorder within that status
        const oldIndex = tickets.findIndex((item) => item.id === active.id)
        const newIndex = tickets.findIndex((item) => item.id === over.id)
        
        if (oldIndex !== newIndex) {
          setTickets((items) => arrayMove(items, oldIndex, newIndex))
        }
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)

    if (!active || !over) return

    const activeTicket = tickets.find((item) => item.id === active.id)
    if (!activeTicket) return

    // Handle dropping on a droppable zone (status column)
    if (over.id.toString().startsWith('droppable-')) {
      const targetStatus = over.id.toString().replace('droppable-', '')
      if (activeTicket.status !== targetStatus) {
        setTickets((items) => {
          return items.map((item) => 
            item.id === active.id 
              ? { ...item, status: targetStatus as any }
              : item
          )
        })
      }
      return
    }

    // Handle dropping on another ticket
    const overTicket = tickets.find((item) => item.id === over.id)
    if (overTicket && activeTicket.id !== overTicket.id) {
      // If dropping on a ticket in a different status, move to that status
      if (activeTicket.status !== overTicket.status) {
        setTickets((items) => {
          return items.map((item) => 
            item.id === active.id 
              ? { ...item, status: overTicket.status }
              : item
          )
        })
      } else {
        // If dropping on a ticket in the same status, reorder within that status
        const oldIndex = tickets.findIndex((item) => item.id === active.id)
        const newIndex = tickets.findIndex((item) => item.id === over.id)
        
        if (oldIndex !== newIndex) {
          setTickets((items) => arrayMove(items, oldIndex, newIndex))
        }
      }
    }
  }

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Hold":
        return "text-red-600"
      case "For Approval":
        return "text-yellow-600"
      case "Approved":
        return "text-blue-600"
      case "In Progress":
        return "text-purple-600"
      case "Completed":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
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
                    <h1 className="text-2xl font-bold mb-2">Tickets</h1>
                    <p className="text-muted-foreground">Drag and drop tickets to manage their status</p>
                  </div>
                </div>

                <div className="flex items-center py-3 gap-4 mb-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets..."
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    <IconFilter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                {mounted ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="h-[calc(100vh-400px)] w-full overflow-x-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 h-full">
                        {statuses.map((status) => (
                          <div key={status} className="h-full">
                            <div className="h-full pb-2 bg-muted/30 flex flex-col gap-4 border rounded-lg p-4">
                              <div className="pb-0 flex-shrink-0 gap-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={getStatusColor(status)}>
                                      {status}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      ({getTicketsByStatus(status).length})
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="pt-0 flex-1 overflow-hidden">
                                <DroppableContainer status={status}>
                                  <SortableContext
                                    items={getTicketsByStatus(status).map(ticket => ticket.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {getTicketsByStatus(status).map((ticket) => (
                                      <SortableTicket 
                                        key={ticket.id} 
                                        ticket={ticket} 
                                      />
                                    ))}
                                  </SortableContext>
                                  
                                  {getTicketsByStatus(status).length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg">
                                      <p className="text-sm">Drop tickets here to move to {status}</p>
                                    </div>
                                  )}
                                </DroppableContainer>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <DragOverlay>
                      {activeId ? (
                        <DraggingTicket 
                          ticket={tickets.find(ticket => ticket.id === activeId)!} 
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="h-[calc(100vh-400px)] w-full overflow-x-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 h-full">
                        {statuses.map((status) => (
                          <div key={status} className="h-full">
                            <div className="h-full pb-2 bg-muted/30 flex flex-col gap-4 border rounded-lg p-4">
                              <div className="pb-0 flex-shrink-0 gap-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={getStatusColor(status)}>
                                      {status}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      ({getTicketsByStatus(status).length})
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="pt-0 flex-1 overflow-hidden">
                                <div className="h-full overflow-y-auto">
                                  {getTicketsByStatus(status).map((ticket) => (
                                    <Card key={ticket.id} className="mb-2 p-3 border">
                                      <div className="flex items-start justify-between mb-1">
                                        <div className="flex-1">
                                          <div className="text-xs text-muted-foreground mb-1">TKT-{ticket.id.padStart(6, '0')}</div>
                                          <h4 className="font-medium text-sm mb-0.5">{ticket.title}</h4>
                                          <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
                                        </div>
                                        <div className="p-1">
                                          <IconGripVertical className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-end">
                                        <span className="text-xs text-muted-foreground">{ticket.assignee}</span>
                                      </div>
                                    </Card>
                                  ))}
                                  
                                  {getTicketsByStatus(status).length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg">
                                      <p className="text-sm">No tickets in {status}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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
