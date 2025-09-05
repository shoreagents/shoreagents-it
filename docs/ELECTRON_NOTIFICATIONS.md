# Electron Notifications System

This document explains how to use the system notification functionality in the ShoreAgents AI Electron application.

## Overview

The notification system allows you to show native OS notifications that appear outside the application window. These notifications can be used to alert users about important events, updates, or actions that require their attention.

## Features

- ✅ Native OS notifications (Windows, macOS, Linux)
- ✅ Permission handling
- ✅ Multiple notification types (success, error, warning, info)
- ✅ Interactive notifications with action buttons
- ✅ Reply functionality
- ✅ Event callbacks (click, close, reply, action)
- ✅ Custom icons and sounds
- ✅ Urgency levels (critical, normal, low)
- ✅ Timeout control

## Quick Start

### 1. Basic Usage

```tsx
import { useElectronNotifications } from '@/hooks/use-electron-notifications';

function MyComponent() {
  const { showNotification, isSupported } = useElectronNotifications();

  const handleShowNotification = async () => {
    if (!isSupported) {
      console.log('Not running in Electron');
      return;
    }

    await showNotification({
      title: 'Hello!',
      body: 'This is a notification from ShoreAgents AI',
    });
  };

  return (
    <button onClick={handleShowNotification}>
      Show Notification
    </button>
  );
}
```

### 2. Using Convenience Methods

```tsx
import { useElectronNotifications } from '@/hooks/use-electron-notifications';

function MyComponent() {
  const {
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  } = useElectronNotifications();

  const handleSuccess = async () => {
    await showSuccessNotification('Success!', 'Operation completed successfully.');
  };

  const handleError = async () => {
    await showErrorNotification('Error!', 'Something went wrong.');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

### 3. Permission Handling

```tsx
import { useElectronNotifications } from '@/hooks/use-electron-notifications';

function MyComponent() {
  const { checkPermission, requestPermission } = useElectronNotifications();
  const [permission, setPermission] = useState('unknown');

  useEffect(() => {
    const checkStatus = async () => {
      const result = await checkPermission();
      if (result.success) {
        setPermission(result.permission || 'unknown');
      }
    };
    checkStatus();
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result.success) {
      setPermission(result.permission || 'unknown');
    }
  };

  return (
    <div>
      <p>Permission: {permission}</p>
      {permission !== 'granted' && (
        <button onClick={handleRequestPermission}>
          Request Permission
        </button>
      )}
    </div>
  );
}
```

## API Reference

### useElectronNotifications Hook

#### Properties

- `isSupported: boolean` - Whether notifications are supported (true in Electron)
- `checkPermission()` - Check current notification permission
- `requestPermission()` - Request notification permission
- `showNotification(options)` - Show a custom notification
- `setCallbacks(callbacks)` - Set event callbacks
- `showSuccessNotification(title, body, options?)` - Show success notification
- `showErrorNotification(title, body, options?)` - Show error notification
- `showWarningNotification(title, body, options?)` - Show warning notification
- `showInfoNotification(title, body, options?)` - Show info notification

#### NotificationOptions Interface

```typescript
interface NotificationOptions {
  title?: string;                    // Notification title
  body?: string;                     // Notification body text
  icon?: string;                     // Path to custom icon
  silent?: boolean;                  // Whether to play sound
  urgency?: 'critical' | 'normal' | 'low';  // Urgency level
  timeoutType?: 'default' | 'never'; // When to auto-dismiss
  actions?: Array<{ type: 'button'; text: string }>;  // Action buttons
  hasReply?: boolean;                // Enable reply functionality
  replyPlaceholder?: string;         // Placeholder text for reply
  sound?: string;                    // Custom sound
  id?: string;                       // Unique identifier
  onClick?: boolean;                 // Enable click events
  onClose?: boolean;                 // Enable close events
  onReply?: boolean;                 // Enable reply events
  onAction?: boolean;                // Enable action events
}
```

## Examples

### 1. Basic Notification

```tsx
await showNotification({
  title: 'New Message',
  body: 'You have received a new message from John Doe',
  id: 'message-123',
});
```

### 2. Interactive Notification with Actions

```tsx
await showNotification({
  title: 'New Ticket',
  body: 'A new support ticket has been assigned to you',
  id: 'ticket-456',
  actions: [
    { type: 'button', text: 'View Ticket' },
    { type: 'button', text: 'Mark as Read' },
  ],
  hasReply: true,
  replyPlaceholder: 'Add a quick note...',
  onClick: true,
  onAction: true,
  onReply: true,
});
```

### 3. Critical Alert

```tsx
await showNotification({
  title: 'System Alert',
  body: 'Server is experiencing high CPU usage',
  urgency: 'critical',
  timeoutType: 'never',
  silent: false,
  id: 'alert-789',
});
```

### 4. Event Handling

```tsx
const { setCallbacks } = useElectronNotifications();

useEffect(() => {
  setCallbacks({
    onClick: (notificationId) => {
      console.log('Notification clicked:', notificationId);
      // Focus the app window or navigate to relevant page
    },
    onClose: (notificationId) => {
      console.log('Notification closed:', notificationId);
    },
    onReply: (data) => {
      console.log('Reply received:', data.reply);
      // Handle the reply
    },
    onAction: (data) => {
      console.log('Action clicked:', data.actionIndex);
      // Handle the action button click
    },
  });
}, [setCallbacks]);
```

## Integration Examples

### 1. Ticket System Notifications

```tsx
// In your ticket component
const { showNotification } = useElectronNotifications();

const handleNewTicket = async (ticket) => {
  await showNotification({
    title: 'New Ticket',
    body: `Ticket #${ticket.id}: ${ticket.title}`,
    id: `ticket-${ticket.id}`,
    actions: [
      { type: 'button', text: 'View' },
      { type: 'button', text: 'Assign' },
    ],
    onClick: true,
    onAction: true,
  });
};
```

### 2. Real-time Updates

```tsx
// In your real-time hook
const { showInfoNotification } = useElectronNotifications();

useEffect(() => {
  // Listen for real-time updates
  socket.on('member-updated', (member) => {
    showInfoNotification(
      'Member Updated',
      `${member.name} has been updated`,
      { id: `member-${member.id}` }
    );
  });
}, []);
```

### 3. Error Handling

```tsx
const { showErrorNotification } = useElectronNotifications();

const handleApiError = async (error) => {
  await showErrorNotification(
    'API Error',
    `Failed to ${error.operation}: ${error.message}`,
    { id: `error-${Date.now()}` }
  );
};
```

## Best Practices

1. **Always check if notifications are supported** before using them
2. **Request permission** before showing notifications
3. **Use appropriate urgency levels** (critical for important alerts)
4. **Provide meaningful titles and body text**
5. **Use unique IDs** for notifications to avoid duplicates
6. **Handle notification events** appropriately (clicks, replies, actions)
7. **Don't spam users** with too many notifications
8. **Test on different operating systems** as behavior may vary

## Troubleshooting

### Notifications not showing
- Check if running in Electron (not in browser)
- Verify notification permission is granted
- Check if notifications are supported on the system

### Permission denied
- Call `requestPermission()` before showing notifications
- Handle the permission request result appropriately

### Events not firing
- Ensure you've set up event callbacks with `setCallbacks()`
- Check that the notification options have the appropriate event flags set

## Platform Differences

- **Windows**: Full support for all features
- **macOS**: Full support, may require additional permissions
- **Linux**: Support depends on desktop environment (GNOME, KDE, etc.)

## Security Considerations

- Notifications are handled by the OS, not the web browser
- No sensitive data should be included in notification content
- Users can disable notifications at the OS level
- Always provide fallback behavior when notifications are not available
