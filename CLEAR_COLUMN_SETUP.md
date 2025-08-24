# Clear Column Setup for Tickets

This document explains the new `clear` column functionality added to the tickets system.

## Overview

The `clear` column is a boolean field that allows you to hide closed tickets from the main tickets pages while keeping them in the database for record-keeping purposes.

## Database Changes

### 1. Run the SQL Script

Execute the SQL script to add the clear column:

```bash
psql -d your_database -f scripts/add-clear-column-to-tickets.sql
```

This script will:
- Add a `clear` boolean column (default: false)
- Create an index for performance
- Add a check constraint to ensure `clear` is only true for closed tickets
- Create a trigger to automatically handle clear column updates
- Set existing closed tickets to `clear = false`

### 2. Column Details

- **Column Name**: `clear`
- **Type**: `boolean`
- **Default**: `false`
- **Constraint**: Can only be `true` when status is 'Closed'
- **Purpose**: When `true` and status is 'Closed', the ticket will not appear on main tickets pages

## How It Works

### Automatic Behavior

1. **When a ticket is closed**: `clear` is automatically set to `false`
2. **When a ticket status changes from 'Closed'**: `clear` is automatically set to `false`
3. **Only closed tickets can be marked as cleared**: The constraint prevents invalid states

### Filtering Logic

The system now filters tickets using this logic:
```sql
WHERE NOT (t.status = 'Closed' AND t.clear = true)
```

This means:
- ✅ **Active tickets** (Open, In Progress, Approved, etc.) are always shown
- ✅ **Closed tickets with `clear = false`** are shown on main pages
- ❌ **Closed tickets with `clear = true`** are hidden from main pages
- 📋 **All tickets** are still available on the Past Tickets page

## API Endpoints

### Mark Ticket as Cleared

```http
POST /api/tickets/clear
Content-Type: application/json

{
  "ticketId": 123,
  "action": "clear"
}
```

### Unmark Ticket as Cleared

```http
POST /api/tickets/clear
Content-Type: application/json

{
  "ticketId": 123,
  "action": "unclear"
}
```

## Database Functions

### New Functions Added

1. **`markTicketAsCleared(ticketId: number)`**: Sets `clear = true` for a closed ticket
2. **`unmarkTicketAsCleared(ticketId: number)`**: Sets `clear = false` for a closed ticket
3. **`getClearedTickets()`**: Retrieves all cleared tickets for admin review

### Updated Functions

All existing ticket retrieval functions now automatically filter out cleared tickets:
- `getAllTickets()`
- `getAllTicketsAdmin()`
- `getTicketsByStatus()`
- `getTicketsByStatusAdmin()`
- `getTicketsByStatusWithPagination()`
- `getTicketsResolvedByUserCount()`

## Use Cases

### 1. Clean Main Pages
- Mark old closed tickets as cleared to keep the main tickets page focused on recent activity
- Maintain a clean, uncluttered interface

### 2. Record Keeping
- Cleared tickets remain in the database for audit purposes
- Can be accessed through the Past Tickets page or admin functions

### 3. Gradual Cleanup
- Instead of deleting tickets, mark them as cleared
- Reversible action - can unmark tickets if needed

### 4. Performance
- Reduces the number of tickets loaded on main pages
- Improves page load times for users

## Implementation Notes

### Frontend Integration

The clear functionality is transparent to users - they won't see cleared tickets on the main pages, but the system maintains all existing functionality.

### Backward Compatibility

- Existing closed tickets automatically have `clear = false`
- All existing queries continue to work
- No breaking changes to the current system

### Security

- Only closed tickets can be marked as cleared
- The constraint prevents manipulation of active tickets
- Clear status is automatically managed by triggers

## Maintenance

### Monitoring Cleared Tickets

Use the `getClearedTickets()` function to review which tickets have been cleared:

```typescript
import { getClearedTickets } from '@/lib/db-utils'

const clearedTickets = await getClearedTickets()
console.log(`Found ${clearedTickets.length} cleared tickets`)
```

### Cleanup Strategy

Consider implementing a cleanup strategy:
1. **Immediate**: Mark tickets as cleared when manually reviewed
2. **Scheduled**: Automatically clear tickets older than X days
3. **Bulk**: Provide admin interface for bulk clearing operations

## Troubleshooting

### Common Issues

1. **Ticket not appearing after clearing**: Ensure the ticket status is 'Closed'
2. **Constraint violation**: The system prevents setting `clear = true` for non-closed tickets
3. **Performance**: The new index should maintain good query performance

### Debug Queries

```sql
-- Check cleared tickets
SELECT COUNT(*) FROM tickets WHERE clear = true AND status = 'Closed';

-- Check constraint violations
SELECT * FROM tickets WHERE clear = true AND status != 'Closed';

-- Verify index usage
EXPLAIN ANALYZE SELECT * FROM tickets WHERE NOT (status = 'Closed' AND clear = true);
```
