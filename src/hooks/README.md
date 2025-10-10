# Reusable Real-Time Hooks

This directory contains reusable React hooks for handling real-time data across different database tables.

## `use-realtime-activity-logs.ts`

A comprehensive hook that combines comments and activity logs functionality with real-time updates via WebSocket. This hook is designed to be reusable across any database table.

### Features

- ✅ **Real-time updates** via WebSocket
- ✅ **Combined data** - comments + activity logs in chronological order
- ✅ **Fallback support** - API fallback when WebSocket fails
- ✅ **Flexible configuration** - works with any table structure
- ✅ **Type-safe** - full TypeScript support
- ✅ **Error handling** - comprehensive error states and retry mechanisms

### Basic Usage

```tsx
import { useRealtimeActivityLogs, createCompaniesConfig } from '@/hooks/use-realtime-activity-logs'

function CompaniesComponent({ companyId }: { companyId: number }) {
  const { 
    comments, 
    activityLogs, 
    allEntries, 
    loading, 
    error, 
    isConnected, 
    addComment, 
    deleteComment, 
    refreshData 
  } = useRealtimeActivityLogs(createCompaniesConfig(companyId))

  // Use the data and functions...
}
```

### Pre-configured Configurations

The hook comes with several pre-configured setups for common tables:

#### 1. Companies Table
```tsx
const config = createCompaniesConfig(companyId)
```

#### 2. Tickets Table
```tsx
const config = createTicketsConfig(ticketId)
```

#### 3. Applicants Table
```tsx
const config = createApplicantsConfig(applicantId)
```

#### 4. Talent Pool Table
```tsx
const config = createTalentPoolConfig(talentId)
```

### Custom Configuration

For custom tables, create your own configuration:

```tsx
const customConfig: RealtimeTableConfig = {
  tableName: 'custom_table',
  recordId: 123,
  recordIdField: 'custom_id',
  messageType: 'custom_update',
  apiEndpoints: {
    comments: '/api/custom/{id}/comments',
    activityLogs: '/api/custom/{id}/activity'
  }
}

const { comments, activityLogs, allEntries } = useRealtimeActivityLogs(customConfig)
```

### Hook Return Values

| Property | Type | Description |
|----------|------|-------------|
| `comments` | `CommentRecord[]` | Array of comment records |
| `activityLogs` | `ActivityLogRecord[]` | Array of activity log records |
| `allEntries` | `Array<CommentRecord \| ActivityLogRecord>` | Combined and sorted entries |
| `loading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message if any |
| `isConnected` | `boolean` | WebSocket connection status |
| `addComment` | `(text: string, userId: number) => Promise<number>` | Add new comment |
| `deleteComment` | `(commentId: number, userId: number) => Promise<boolean>` | Delete comment |
| `refreshData` | `() => void` | Manual refresh function |

### Data Structure

#### CommentRecord
```tsx
interface CommentRecord {
  id: number
  comment: string
  created_at: string
  updated_at: string
  user_id: number
  first_name?: string | null
  last_name?: string | null
  profile_picture?: string | null
  user_name?: string
  [key: string]: any // Additional fields like company_id, ticket_id, etc.
}
```

#### ActivityLogRecord
```tsx
interface ActivityLogRecord {
  id: number
  action: string
  fieldName: string
  oldValue: string | null
  newValue: string | null
  created_at: string
  updated_at: string
  user_id: number
  first_name?: string | null
  last_name?: string | null
  profile_picture?: string | null
  user_name?: string
  [key: string]: any // Additional fields like company_id, ticket_id, etc.
}
```

### WebSocket Message Types

The hook expects WebSocket messages in this format:

```tsx
{
  type: 'your_message_type', // e.g., 'company_comment_update'
  data: {
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    record: CommentRecord | ActivityLogRecord,
    old_record?: CommentRecord | ActivityLogRecord,
    timestamp: string
  }
}
```

### API Endpoint Requirements

Your API endpoints should follow this pattern:

- **Comments**: `GET /api/table/{id}/comments` - Returns `{ comments: CommentRecord[] }`
- **Activity Logs**: `GET /api/table/{id}/activity` - Returns `{ entries: ActivityLogRecord[] }`
- **Add Comment**: `POST /api/table/{id}/comments` - Body: `{ comment: string, user_id: number }`
- **Delete Comment**: `DELETE /api/table/{id}/comments/{commentId}` - Body: `{ user_id: number }`

### Error Handling

The hook provides comprehensive error handling:

- **WebSocket errors** - Automatic fallback to API calls
- **API errors** - User-friendly error messages with retry options
- **Loading states** - Skeleton loaders during data fetching
- **Connection status** - Visual indicators for real-time connection state

### Performance Features

- **Optimistic updates** - Immediate UI feedback for user actions
- **Efficient re-renders** - Only updates changed data
- **Connection management** - Automatic WebSocket reconnection
- **Memory management** - Proper cleanup on unmount

### Migration from Old Hooks

If you're migrating from the old `use-realtime-comments.ts`:

1. **Replace the import**:
   ```tsx
   // Old
   import { useRealtimeComments } from '@/hooks/use-realtime-comments'
   
   // New
   import { useRealtimeActivityLogs, createCompaniesConfig } from '@/hooks/use-realtime-activity-logs'
   ```

2. **Update the hook call**:
   ```tsx
   // Old
   const { comments, loading, error } = useRealtimeComments(companyId)
   
   // New
   const { comments, activityLogs, allEntries, loading, error } = useRealtimeActivityLogs(
     createCompaniesConfig(companyId)
   )
   ```

3. **Use the new properties**:
   - `allEntries` instead of manually combining data
   - `activityLogs` for activity-specific data
   - `isConnected` for connection status

### Examples

See the component files for complete usage examples:
- `src/components/companies-activity-log.tsx` - Companies table usage
- Future components can use the same pattern for other tables

