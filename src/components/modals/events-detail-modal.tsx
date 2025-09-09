"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  User, 
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
  Minus
} from "lucide-react"
import { Event } from "@/lib/db-utils"
import { formatDistanceToNow } from "date-fns"

interface EventsDetailModalProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
  onEdit?: (event: Event) => void
  onDelete?: (eventId: number) => void
  onJoin?: (eventId: number) => void
  onLeave?: (eventId: number) => void
}

export function EventsDetailModal({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
  onJoin,
  onLeave
}: EventsDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!event) return null

  const getTypeBadgeClass = (eventType: string): string => {
    const type = eventType.toLowerCase()
    if (type === 'meeting') {
    return 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20'
  }
    if (type === 'workshop') {
      return 'text-purple-700 dark:text-white border-purple-600/20 bg-purple-50 dark:bg-purple-600/20'
    }
    if (type === 'social') {
    return 'text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20'
  }
    if (type === 'training') {
      return 'text-orange-700 dark:text-white border-orange-600/20 bg-orange-50 dark:bg-orange-600/20'
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  const handleEdit = () => {
    if (onEdit) {
      onEdit(event)
    }
  }

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id)
    }
  }

  const handleJoin = () => {
    if (onJoin) {
      onJoin(event.id)
    }
  }

  const handleLeave = () => {
    if (onLeave) {
      onLeave(event.id)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Event Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{event.title}</h2>
                  {event.description && (
                    <p className="text-muted-foreground">{event.description}</p>
                  )}
                  </div>
                <div className="flex gap-2">
                      <Badge 
                        variant="outline" 
                    className={`px-3 py-1 font-medium ${getTypeBadgeClass(event.event_type)}`}
                      >
                    {event.event_type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                    className={`px-3 py-1 font-medium ${getStatusBadgeClass(event.status)}`}
                      >
                    {event.status}
                      </Badge>
                </div>
              </div>
            </div>
            
            <Separator />

            {/* Event Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Event Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Date & Time</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(event.event_date)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeRange(event.start_time, event.end_time)}
                        </p>
                          </div>
                          </div>
                  </CardContent>
                </Card>

                {event.location && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                            </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Participants</p>
                        <p className="text-sm text-muted-foreground">
                          {event.participants_count} people attending
                        </p>
                            </div>
                        </div>
                  </CardContent>
                </Card>

                {(event.first_name || event.last_name) && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                          <p className="text-sm font-medium">Created by</p>
                          <p className="text-sm text-muted-foreground">
                            {event.first_name} {event.last_name}
                          </p>
                    </div>
                                </div>
                    </CardContent>
                  </Card>
                )}
                  </div>
                </div>

            <Separator />

            {/* Event Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Actions</h3>
              
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleJoin} variant="default" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Join Event
              </Button>
                <Button onClick={handleLeave} variant="outline" size="sm">
                  <Minus className="h-4 w-4 mr-2" />
                  Leave Event
                </Button>
                {onEdit && (
                  <Button onClick={handleEdit} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Event
              </Button>
                )}
                {onDelete && (
                  <Button onClick={handleDelete} variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Event
                    </Button>
                      )}
                    </div>
                  </div>

            <Separator />

            {/* Event Metadata */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Event Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Event ID</p>
                  <p className="text-muted-foreground">#{event.id}</p>
                              </div>
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </p>
                            </div>
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-muted-foreground">
                    {formatDistanceToNow(new Date(event.updated_at), { addSuffix: true })}
                  </p>
                          </div>
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-muted-foreground capitalize">{event.status}</p>
                        </div>
                      </div>
                        </div>
                        </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
