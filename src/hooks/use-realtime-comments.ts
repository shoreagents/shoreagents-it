import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  getWebSocketServer, 
  getMemberComments, 
  addMemberComment, 
  deleteMemberComment, 
  getMemberCommentCount 
} from '@/lib/realtime'

export interface CommentData {
  id: number
  member_id: number
  user_id: number
  comment: string
  created_at: string
  updated_at: string
  first_name: string | null
  last_name: string | null
  profile_picture: string | null
  user_name: string
}

export interface CommentNotification {
  table: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  record: any
  old_record: any
  timestamp: string
}

export function useRealtimeComments(memberId: number) {
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  // Load initial comments
  const loadComments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to use real-time functions first, fallback to API
      try {
        const initialComments = await getMemberComments(memberId)
        setComments(initialComments)
      } catch (err) {
        // Fallback to regular API if real-time is not connected
        const response = await fetch(`/api/members/${memberId}/comments`)
        if (response.ok) {
          const data = await response.json()
          setComments(data.comments || [])
        } else {
          throw new Error('Failed to load comments')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments')
      console.error('Error loading comments:', err)
    } finally {
      setLoading(false)
    }
  }, [memberId])

  // Handle real-time notifications via WebSocket
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data)
      
      if (message.type === 'member_comment_update') {
        const { action, record, old_record } = message.data
        
        if (record && record.member_id === memberId) {
          setComments(prevComments => {
            switch (action) {
              case 'INSERT':
                // Add new comment
                return [record, ...prevComments]
                
              case 'UPDATE':
                // Update existing comment
                return prevComments.map(comment => 
                  comment.id === record.id ? record : comment
                )
                
              case 'DELETE':
                // Remove deleted comment
                return prevComments.filter(comment => comment.id !== old_record.id)
                
              default:
                return prevComments
            }
          })
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }, [memberId])

  // Setup WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('✅ WebSocket connected for comments')
      setIsConnected(true)
      setError(null)
      
      // Load initial comments when connected
      loadComments()
    }

    ws.onmessage = handleWebSocketMessage

    ws.onclose = () => {
      console.log('❌ WebSocket disconnected for comments')
      setIsConnected(false)
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket error for comments:', error)
      setError('WebSocket connection error')
      setIsConnected(false)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [loadComments, handleWebSocketMessage])

  // Add a new comment
  const addComment = useCallback(async (commentText: string, userId: number) => {
    try {
      setError(null)
      
      // Try to use real-time function first
      try {
        const newCommentId = await addMemberComment(memberId, userId, commentText)
        
        // The comment will be added via WebSocket notification, but we can add it optimistically
        const newComment: CommentData = {
          id: newCommentId,
          member_id: memberId,
          user_id: userId,
          comment: commentText,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          first_name: null, // Will be populated by the notification
          last_name: null,
          profile_picture: null,
          user_name: 'You' // Temporary, will be updated by notification
        }
        
        setComments(prev => [newComment, ...prev])
        return newCommentId
      } catch (err) {
        // Fallback to regular API
        const response = await fetch(`/api/members/${memberId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment: commentText, user_id: userId })
        })
        
        if (!response.ok) {
          throw new Error('Failed to add comment')
        }
        
        const data = await response.json()
        
        // Reload comments to get the updated list
        await loadComments()
        
        return data.comment_id
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
      throw err
    }
  }, [memberId, loadComments])

  // Delete a comment
  const deleteComment = useCallback(async (commentId: number, userId: number) => {
    try {
      setError(null)
      
      // Try to use real-time function first
      try {
        const success = await deleteMemberComment(commentId, userId)
        
        if (success) {
          // The comment will be removed via WebSocket notification, but we can remove it optimistically
          setComments(prev => prev.filter(comment => comment.id !== commentId))
        }
        
        return success
      } catch (err) {
        // Fallback to regular API
        const response = await fetch(`/api/members/${memberId}/comments/${commentId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete comment')
        }
        
        // Reload comments to get the updated list
        await loadComments()
        
        return true
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment')
      throw err
    }
  }, [memberId, loadComments])

  // Refresh comments manually
  const refreshComments = useCallback(() => {
    loadComments()
  }, [loadComments])

  return {
    comments,
    loading,
    error,
    isConnected,
    addComment,
    deleteComment,
    refreshComments
  }
}
