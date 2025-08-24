'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/auth-context'
import { Comment } from '@/components/ui/comment'

interface ActivityLogEntry {
  id: string
  type: 'activity'
  action: string
  fieldName: string
  oldValue: string | null
  newValue: string | null
  createdAt: string
  userName: string | null
  userId: number | null
}

interface CommentEntry {
  id: string
  type: 'comment'
  comment: string
  createdAt: string
  userName: string | null
  userId: number | null
}

type ActivityLogItem = ActivityLogEntry | CommentEntry

interface ActivityLogProps {
  memberId: number
  companyName: string
  onRefresh?: () => void
}

export function MembersActivityLog({ memberId, companyName, onRefresh }: ActivityLogProps) {
  const { user: currentUser, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<ActivityLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  // Debug: Log auth context state
  console.log('🔍 Auth context state:', {
    currentUser: currentUser,
    currentUserId: currentUser?.id,
    currentUserType: typeof currentUser?.id,
    authLoading: authLoading
  });

  const fetchActivities = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
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
      
      if (append) {
        // Append new entries to existing ones
        setEntries(prev => [...prev, ...(data.entries || [])])
      } else {
        // Replace entries for first page
        setEntries(data.entries || [])
      }
      
      setTotalCount(data.pagination?.totalCount || 0)
      setCurrentPage(pageNum)
      setHasMore(pageNum < (data.pagination?.totalPages || 1))
      
      // Call onRefresh callback if provided (only for first page)
      if (onRefresh && pageNum === 1) {
        onRefresh()
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity log')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Load more activities when scrolling
  const loadMoreActivities = () => {
    console.log('loadMoreActivities called:', { hasMore, loadingMore, currentPage })
    if (hasMore && !loadingMore) {
      console.log('Fetching next page:', currentPage + 1)
      fetchActivities(currentPage + 1, true)
    } else {
      console.log('Cannot load more:', { hasMore, loadingMore })
    }
  }

  // Check if more content is needed for scrolling
  const checkAndLoadMoreIfNeeded = async () => {
    const container = document.querySelector('[data-activity-list]') as HTMLElement
    if (!container) return
    
    const { scrollHeight, clientHeight } = container
    const needsMoreContent = scrollHeight <= clientHeight + 100 // Add 100px buffer
    
    console.log('Activity scroll check:', {
      scrollHeight,
      clientHeight,
      needsMoreContent,
      hasMore,
      loadingMore
    })
    
    if (needsMoreContent && hasMore && !loadingMore) {
      console.log('Activity content too short, auto-loading more...')
      await fetchActivities(currentPage + 1, true)
    }
  }

  useEffect(() => {
    fetchActivities(1)
  }, [memberId])
  
  // Debug: Monitor auth context changes
  useEffect(() => {
    console.log('🔍 Auth context changed:', {
      currentUser: currentUser,
      currentUserId: currentUser?.id,
      currentUserType: typeof currentUser?.id
    });
  }, [currentUser]);

  // Auto-refresh every 30 seconds when component is mounted
  useEffect(() => {
    const interval = setInterval(() => {
      if (entries.length > 0) {
        fetchActivities(1) // Refresh first page to get latest entries
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [entries.length])

  // Auto-load more pages if content height is too short for scrolling
  useEffect(() => {
    if (entries.length > 0 && hasMore && !loadingMore) {
      setTimeout(() => {
        checkAndLoadMoreIfNeeded()
      }, 300)
    }
  }, [entries.length, hasMore, loadingMore])

  // Scroll to bottom when new entries are added (for chronological order)
  useEffect(() => {
    if (entries.length > 0) {
      const container = document.querySelector('[data-activity-list]') as HTMLElement
      if (container) {
        // Scroll to bottom to show latest entries
        container.scrollTop = container.scrollHeight
      }
    }
  }, [entries.length])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    
    // Convert to Manila timezone (Asia/Manila)
    const manilaDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Manila"}))
    
    const datePart = manilaDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
    const timePart = manilaDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    })
    return `${datePart} • ${timePart}`
  }

  const renderActivityText = (activity: ActivityLogEntry) => {
    const fieldDisplayName = getFieldDisplayName(activity.fieldName);
    
    // Helper function to format values
    const formatValue = (value: string | null, fieldName: string) => {
      if (!value || (typeof value === 'string' && value.trim() === '')) return '-';
      
      // Special formatting for service field
      if (fieldName === 'service') {
        return formatServiceValue(value);
      }
      
      return value;
    };
    
    // Check if current user performed this action
    const isCurrentUser = currentUser && activity.userId && currentUser.id === activity.userId.toString();
    const userName = isCurrentUser ? 'You' : (activity.userName || 'Unknown User');
    
    // Debug logging
    console.log('🔍 Activity user check:', {
      currentUserId: currentUser?.id,
      currentUserIdType: typeof currentUser?.id,
      activityUserId: activity.userId,
      activityUserIdType: typeof activity.userId,
      comparison: currentUser?.id === activity.userId?.toString(),
      isCurrentUser,
      finalUserName: userName,
      hasCurrentUser: !!currentUser,
      hasActivityUserId: !!activity.userId
    });
    
    if (activity.action === 'created') {
      return `${userName} created ${activity.newValue || '-'}`;
    } else if (activity.action === 'set') {
      return `${userName} set ${fieldDisplayName} to ${formatValue(activity.newValue, activity.fieldName)}`;
    } else if (activity.action === 'updated') {
      return `${userName} changed ${fieldDisplayName} from ${formatValue(activity.oldValue, activity.fieldName)} to ${formatValue(activity.newValue, activity.fieldName)}`;
    } else if (activity.action === 'removed') {
      return `${userName} removed ${fieldDisplayName} from ${formatValue(activity.oldValue, activity.fieldName)}`;
    } else if (activity.action === 'selected') {
      return `${userName} added ${formatValue(activity.newValue, activity.fieldName)} to ${fieldDisplayName}`;
    } else if (activity.action === 'deselected') {
      return `${userName} removed ${formatValue(activity.oldValue, activity.fieldName)} from ${fieldDisplayName}`;
    }
    
    return 'Unknown action';
  };

  const getFieldDisplayName = (fieldName: string) => {
    const fieldNames: Record<string, string> = {
      'company': 'Name',
      'Company Name': 'Name',
      'address': 'Address',
      'Address': 'Address',
      'phone': 'Phone',
      'Phone': 'Phone',
      'country': 'Country',
      'Country': 'Country',
      'service': 'Service',
      'Service': 'Service',
      'website': 'Website',
      'Website': 'Website',
      'logo': 'Logo',
      'Logo': 'Logo',
      'badge_color': 'Badge Color',
      'Badge Color': 'Badge Color',
      'status': 'Status',
      'Status': 'Status',
      'Agent Assignments': 'Agent Assignments',
      'Client Assignments': 'Client Assignments'
    }
    return fieldNames[fieldName] || fieldName
  }

  // Helper function to format service values in title case
  const formatServiceValue = (value: string | null) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) return '-'
    
    // Convert service values to title case
    const serviceMap: Record<string, string> = {
      'one agent': 'One Agent',
      'team': 'Team',
      'workforce': 'Workforce'
    }
    
    return serviceMap[value.toLowerCase()] || value
  }

  // Show loading state while auth is loading or entries are loading
  if (authLoading || (loading && entries.length === 0)) {
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

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No Activities Found</p>
      </div>
    )
  }

  return (
    <div 
      data-activity-list
      className="space-y-3 h-full overflow-y-auto overflow-x-hidden"
      onScroll={(e) => {
        const target = e.target as HTMLDivElement
        const { scrollTop, scrollHeight, clientHeight } = target
        
        // Debug scroll values
        console.log('Activity Scroll Debug:', {
          scrollTop,
          scrollHeight,
          clientHeight,
          threshold: scrollHeight * 0.8,
          shouldLoad: scrollTop + clientHeight >= scrollHeight * 0.8,
          hasMore,
          loadingMore
        })
        
        // Load more when user scrolls to top (for chronological order - oldest first)
        if (scrollTop <= scrollHeight * 0.2 && hasMore && !loadingMore) {
          console.log('Loading more entries...')
          loadMoreActivities()
        }
      }}
    >
      {/* Entries List */}
      {entries.map((entry) => {
        if (entry.type === 'activity') {
          const activity = entry as ActivityLogEntry
          return (
            <div key={entry.id} className="flex items-center gap-3">
              {/* Bullet point */}
              <div className="w-1 h-1 bg-muted-foreground rounded-full flex-shrink-0"></div>
              
              {/* Activity text and timestamp */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {renderActivityText(activity)}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )
        } else {
          const comment = entry as CommentEntry
          return (
            <div className="overflow-hidden">
              <Comment
                key={entry.id}
                comment={{
                  id: comment.id,
                  comment: comment.comment,
                  created_at: comment.createdAt,
                  user_name: (currentUser && comment.userId && currentUser.id === comment.userId.toString()) ? 'You' : (comment.userName || 'Unknown User'),
                  avatar_name: comment.userName || 'Unknown User'
                }}
                showDeleteButton={true}
                onDelete={(commentId) => {
                  // Handle comment deletion here
                  console.log('Delete comment:', commentId)
                  // You can add the actual deletion logic here
                }}
                className="border border-border p-2"
              />
            </div>
          )
        }
      })}
      
      {/* Loading more indicator */}
      {loadingMore && (
        <div className="text-center pt-2">
          <div className="text-xs text-muted-foreground">
            Loading more entries...
          </div>
        </div>
      )}
      
      {/* End of entries indicator */}
      {!hasMore && entries.length > 0 && (
        <div className="text-center pt-2">
          <div className="text-xs text-muted-foreground">
            All Activities Loaded
          </div>
        </div>
      )}
    </div>
  )
}
