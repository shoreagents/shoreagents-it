'use client'

import { useEffect } from 'react'

import { useAuth } from '@/contexts/auth-context'
import { Comment } from '@/components/ui/comment'
import { useRealtimeActivityLogs, createMembersConfig } from '@/hooks/use-realtime-activity-logs'

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
  
  // Use realtime hook for activity logs and comments
  const {
    allEntries,
    loading,
    error,
    isConnected,
    addComment,
    deleteComment,
    refreshData
  } = useRealtimeActivityLogs(createMembersConfig(memberId))
  
  // Convert allEntries to the expected format
  const entries: ActivityLogItem[] = allEntries.map(entry => {
    // Debug each entry during mapping
    console.log('🔍 Mapping entry:', {
      id: entry.id,
      entryType: entry.entryType,
      created_at: entry.created_at,
      created_at_type: typeof entry.created_at,
      has_created_at: !!entry.created_at
    })
    
    // Use created_at field from realtime hook
    const createdAt = entry.created_at
    
    if (entry.entryType === 'comment') {
      const mappedEntry = {
        id: entry.id.toString(),
        type: 'comment' as const,
        comment: entry.comment,
        createdAt: createdAt,
        userName: entry.user_name || 'Unknown User',
        userId: entry.user_id
      }
      console.log('🔍 Mapped comment entry:', mappedEntry)
      return mappedEntry
    } else {
      const mappedEntry = {
        id: entry.id.toString(),
        type: 'activity' as const,
        action: entry.action,
        fieldName: entry.fieldName,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        createdAt: createdAt,
        userName: entry.user_name || 'Unknown User',
        userId: entry.user_id
      }
      console.log('🔍 Mapped activity entry:', mappedEntry)
      return mappedEntry
    }
  })
  
  // Debug: Log realtime hook state
  console.log('🔍 Realtime hook state:', {
    allEntries: allEntries,
    allEntriesLength: allEntries?.length,
    loading: loading,
    error: error,
    isConnected: isConnected,
    entries: entries,
    entriesLength: entries?.length
  });
  
  // Debug: Log raw allEntries structure
  if (allEntries && allEntries.length > 0) {
    console.log('🔍 Raw allEntries structure:', allEntries[0])
    console.log('🔍 Raw allEntries keys:', Object.keys(allEntries[0] || {}))
    console.log('🔍 Raw allEntries created_at value:', allEntries[0]?.created_at)
    console.log('🔍 Raw allEntries created_at type:', typeof allEntries[0]?.created_at)
    console.log('🔍 Raw allEntries entryType:', allEntries[0]?.entryType)
    console.log('🔍 Raw allEntries user_name:', allEntries[0]?.user_name)
    console.log('🔍 Raw allEntries user_id:', allEntries[0]?.user_id)
  }
  
  // Debug: Log date values from realtime hook
  if (allEntries && allEntries.length > 0) {
    console.log('🔍 Date values from realtime hook:', allEntries.slice(0, 3).map(entry => ({
      id: entry.id,
      entryType: entry.entryType,
      created_at: entry.created_at,
      created_at_type: typeof entry.created_at,
      created_at_valid: entry.created_at ? !isNaN(new Date(entry.created_at).getTime()) : false
    })))
  }
  
  // Initial load and refresh handling
  useEffect(() => {
    if (onRefresh) {
      onRefresh()
    }
  }, [onRefresh])
  
  // Auto-refresh when realtime connection is established
  useEffect(() => {
    if (isConnected && onRefresh) {
      onRefresh()
    }
  }, [isConnected, onRefresh])
  
  // Debug: Log auth context state
  console.log('🔍 Auth context state:', {
    currentUser: currentUser,
    currentUserId: currentUser?.id,
    currentUserType: typeof currentUser?.id
  });

  // Load more activities when scrolling (for realtime, we'll use refreshData)
  const loadMoreActivities = () => {
    console.log('loadMoreActivities called - refreshing data')
    refreshData()
  }

  // Debug: Monitor auth context changes
  useEffect(() => {
    console.log('🔍 Auth context changed:', {
      currentUser: currentUser,
      currentUserId: currentUser?.id,
      currentUserType: typeof currentUser?.id
    });
  }, [currentUser]);

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

  const formatDate = (dateString: string | null | undefined) => {
    // Debug the incoming date string
    console.log('🔍 formatDate called with:', {
      dateString,
      type: typeof dateString,
      isValid: dateString ? !isNaN(new Date(dateString).getTime()) : false
    })
    
    if (!dateString) {
      console.warn('⚠️ formatDate received null/undefined dateString')
      return 'Invalid Date • Invalid Date'
    }
    
    try {
      const date = new Date(dateString)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('⚠️ formatDate received invalid date string:', dateString)
        return 'Invalid Date • Invalid Date'
      }
      
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
    } catch (error) {
      console.error('❌ Error in formatDate:', error, 'for dateString:', dateString)
      return 'Invalid Date • Invalid Date'
    }
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
          shouldLoad: scrollTop + clientHeight >= scrollHeight * 0.8
        })
        
        // For realtime, we can refresh data when scrolling to top
        if (scrollTop <= scrollHeight * 0.2) {
          console.log('Refreshing data from scroll...')
          loadMoreActivities()
        }
      }}
    >
      {/* Entries List */}
      {entries.map((entry) => {
        // Debug each entry being rendered
        console.log('🔍 Rendering entry:', {
          id: entry.id,
          type: entry.type,
          createdAt: entry.createdAt,
          createdAtType: typeof entry.createdAt,
          hasCreatedAt: !!entry.createdAt
        })
        
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
      
      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="flex items-center justify-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0s' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      )}
      

    </div>
  )
}
