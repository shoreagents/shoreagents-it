# Real-time Comments Implementation

This document explains how to implement real-time comments using PostgreSQL's `NOTIFY` and `LISTEN` functionality.

## Overview

The real-time comments system allows users to see new comments appear instantly without refreshing the page. It uses:

- **PostgreSQL NOTIFY/LISTEN**: For real-time database notifications
- **Node.js pg client**: To listen for database notifications
- **React hooks**: To integrate real-time functionality into the UI
- **Fallback API**: When real-time is not available

## Database Setup

### 1. Run the SQL Script

Execute the `scripts/implement-realtime-comments.sql` script in your PostgreSQL database:

```bash
psql -d your_database -f scripts/implement-realtime-comments.sql
```

This script creates:
- Notification function: `notify_member_comment_changes()`
- Triggers on `member_comments` table
- Helper functions for CRUD operations
- Optimized indexes

### 2. Verify Setup

Check that the triggers are created:

```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'member_comments';
```

## Server Setup

### 1. Install Dependencies

Make sure you have the `pg` package installed:

```bash
npm install pg
npm install --save-dev @types/pg
```

### 2. Environment Variables

Add your database connection string to `.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### 3. Initialize Real-time Services

In your server entry point (e.g., `server.js` or `next.config.js`):

```typescript
import { initializeRealtimeServices } from '@/lib/init-realtime'

// Initialize real-time services when server starts
initializeRealtimeServices().catch(console.error)
```

## Frontend Integration

### 1. Use the Hook

Replace your existing comment loading logic with the real-time hook:

```typescript
import { useRealtimeComments } from '@/hooks/use-realtime-comments'

function CommentSection({ memberId }: { memberId: number }) {
  const { 
    comments, 
    loading, 
    error, 
    isConnected, 
    addComment, 
    deleteComment 
  } = useRealtimeComments(memberId)

  // Your UI logic here
}
```

### 2. Update Comment Submission

```typescript
const handleSubmitComment = async (commentText: string) => {
  try {
    await addComment(commentText, currentUserId)
    // Comment will appear instantly via real-time updates
  } catch (error) {
    console.error('Failed to add comment:', error)
  }
}
```

### 3. Update Comment Deletion

```typescript
const handleDeleteComment = async (commentId: number) => {
  try {
    await deleteComment(commentId, currentUserId)
    // Comment will disappear instantly via real-time updates
  } catch (error) {
    console.error('Failed to delete comment:', error)
  }
}
```

## How It Works

### 1. Database Level
- When a comment is inserted/updated/deleted, PostgreSQL triggers fire
- Triggers call `notify_member_comment_changes()` function
- Function sends notification via `pg_notify()` to channel `member_comment_changes`

### 2. Server Level
- Node.js client connects to PostgreSQL and listens to notifications
- When notification arrives, it's parsed and distributed to subscribers
- Each member's comments are tracked separately

### 3. Frontend Level
- React hook subscribes to notifications for specific member
- When notification arrives, UI updates immediately
- Fallback to regular API calls if real-time is unavailable

## Benefits

- **Instant Updates**: Comments appear immediately without page refresh
- **Real-time Collaboration**: Multiple users see changes in real-time
- **Efficient**: Uses PostgreSQL's built-in notification system
- **Reliable**: Automatic reconnection and error handling
- **Fallback**: Works even when real-time is unavailable

## Troubleshooting

### 1. Check Database Connection

Verify PostgreSQL connection:

```sql
-- Check if triggers exist
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'member_comments';

-- Test notification manually
SELECT pg_notify('test_channel', 'test_message');
```

### 2. Check Server Logs

Look for connection and notification messages:

```
✅ Connected to PostgreSQL for real-time comments
🔔 Listening for member comment changes...
🔔 Comment INSERT: { record: {...}, timestamp: "..." }
```

### 3. Common Issues

- **Connection failed**: Check `DATABASE_URL` and PostgreSQL status
- **No notifications**: Verify triggers are created and working
- **Permission denied**: Ensure user has `LISTEN` permission

## Performance Considerations

- **Connection Pooling**: The system uses a single connection for notifications
- **Indexes**: Added indexes on `member_id` and `created_at` for performance
- **Efficient Queries**: Uses database functions for optimized comment retrieval
- **Memory Management**: Proper cleanup of listeners and connections

## Security

- **User Validation**: Functions validate user permissions before operations
- **Input Sanitization**: Comments are trimmed and validated
- **Permission Checks**: Users can only delete their own comments
- **SQL Injection Protection**: Uses parameterized queries

## Future Enhancements

- **WebSocket Support**: For browser-based real-time updates
- **Comment Editing**: Real-time comment modification
- **Reaction System**: Real-time likes/reactions on comments
- **Push Notifications**: Browser notifications for new comments
- **Offline Support**: Queue comments when offline, sync when reconnected
