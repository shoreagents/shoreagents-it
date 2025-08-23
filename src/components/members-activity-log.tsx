'use client'

import React, { useState, useEffect } from 'react'

interface ActivityLogEntry {
  id: number
  action: string
  fieldName: string
  oldValue: string | null
  newValue: string | null
  createdAt: string
  userName: string | null
}

interface ActivityLogProps {
  memberId: number
  companyName: string
}

export function MembersActivityLog({ memberId, companyName }: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchActivities = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20'
      })
      
      const response = await fetch(`/api/members/${memberId}/activity?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity log')
      }
      
      const data = await response.json()
      setActivities(data.activities)
      setTotalPages(data.pagination.totalPages)
      setTotalCount(data.pagination.totalCount)
      setPage(pageNum)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities(1)
  }, [memberId])

  const handlePageChange = (newPage: number) => {
    fetchActivities(newPage)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} mins`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const renderActivityText = (activity: ActivityLogEntry) => {
    const fieldDisplayName = getFieldDisplayName(activity.fieldName);
    
    // Helper function to format values
    const formatValue = (value: string | null, fieldName: string) => {
      if (!value || value.trim() === '') return '-';
      
      // Special formatting for service field
      if (fieldName === 'service') {
        return formatServiceValue(value);
      }
      
      return value;
    };
    
    if (activity.action === 'created') {
      return `${activity.userName} set ${fieldDisplayName} to ${formatValue(activity.newValue, activity.fieldName)}`;
    } else if (activity.action === 'updated') {
      return `${activity.userName} changed ${fieldDisplayName} from ${formatValue(activity.oldValue, activity.fieldName)} to ${formatValue(activity.newValue, activity.fieldName)}`;
    } else if (activity.action === 'deleted') {
      return `${activity.userName} changed ${fieldDisplayName} from ${formatValue(activity.oldValue, activity.fieldName)} to -`;
    }
    
    return 'Unknown action';
  };

  const getFieldDisplayName = (fieldName: string) => {
    const fieldNames: Record<string, string> = {
      'company': 'Name',
      'address': 'Address',
      'phone': 'Phone',
      'country': 'Country',
      'service': 'Service',
      'website': 'Website'
    }
    return fieldNames[fieldName] || fieldName
  }

  // Helper function to format service values in title case
  const formatServiceValue = (value: string | null) => {
    if (!value || value.trim() === '') return '-'
    
    // Convert service values to title case
    const serviceMap: Record<string, string> = {
      'one agent': 'One Agent',
      'team': 'Team',
      'workforce': 'Workforce'
    }
    
    return serviceMap[value.toLowerCase()] || value
  }

  if (loading && activities.length === 0) {
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
      <div className="text-red-600 dark:text-red-400 text-sm">
        {error}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No activities found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Activity List */}
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          {/* Bullet point */}
          <div className="w-2 h-2 bg-foreground rounded-full mt-2 flex-shrink-0"></div>
          
          {/* Activity text and timestamp */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-foreground leading-relaxed">
                {renderActivityText(activity)}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                {formatDate(activity.createdAt)}
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {/* Simple pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
