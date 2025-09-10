"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { IconClock, IconUser, IconCalendar, IconMapPin, IconMessage, IconEdit, IconTrash, IconPlus } from "@tabler/icons-react"
import { useTheme } from "next-themes"

interface EventsActivityLogProps {
  eventId: number
  eventTitle: string
  onRefresh?: () => void
}

interface ActivityItem {
  id: string
  action: string
  field_name?: string
  old_value?: string
  new_value?: string
  user_name: string
  created_at: string
}

export function EventsActivityLog({ eventId, eventTitle, onRefresh }: EventsActivityLogProps) {
  const { theme } = useTheme()
  const [activities, setActivities] = React.useState<ActivityItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/events/${eventId}/activities`)
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      
      const data = await response.json()
      setActivities(data.activities || [])
    } catch (err) {
      console.error('Error fetching activities:', err)
      setError('Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (eventId) {
      fetchActivities()
    }
  }, [eventId])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return <IconPlus className="h-4 w-4 text-green-600" />
      case 'updated':
        return <IconEdit className="h-4 w-4 text-blue-600" />
      case 'deleted':
        return <IconTrash className="h-4 w-4 text-red-600" />
      default:
        return <IconMessage className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionBadgeClass = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return 'text-green-700 dark:text-white border-green-600/20 bg-green-50 dark:bg-green-600/20'
      case 'updated':
        return 'text-blue-700 dark:text-white border-blue-600/20 bg-blue-50 dark:bg-blue-600/20'
      case 'deleted':
        return 'text-red-700 dark:text-white border-red-600/20 bg-red-50 dark:bg-red-600/20'
      default:
        return 'text-gray-700 dark:text-white border-gray-600/20 bg-gray-50 dark:bg-gray-600/20'
    }
  }

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 bg-muted rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="w-20 h-4 bg-muted rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchActivities}
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No Activities Found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center gap-3">
          {/* Bullet point */}
          <div className="w-1 h-1 bg-muted-foreground rounded-full flex-shrink-0"></div>
          
          {/* Activity text and timestamp */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium">{activity.user_name}</span>
                {activity.action === 'created' && ' created this event'}
                {activity.action === 'updated' && activity.field_name && ` updated ${formatFieldName(activity.field_name).toLowerCase()}`}
                {activity.action === 'deleted' && ' deleted this event'}
                {activity.old_value && activity.new_value && (
                  <span className="ml-1">
                    from <span className="line-through">{activity.old_value}</span> to <span className="font-medium">{activity.new_value}</span>
                  </span>
                )}
                {activity.new_value && !activity.old_value && activity.action === 'created' && (
                  <span className="ml-1">: {activity.new_value}</span>
                )}
              </span>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {formatTime(activity.created_at)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
