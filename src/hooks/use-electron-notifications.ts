import { useEffect, useCallback, useRef } from 'react';

// Type definitions for the notification system
interface NotificationOptions {
  title?: string;
  body?: string;
  icon?: string;
  silent?: boolean;
  urgency?: 'critical' | 'normal' | 'low';
  timeoutType?: 'default' | 'never';
  actions?: Array<{ type: 'button'; text: string }>;
  hasReply?: boolean;
  replyPlaceholder?: string;
  sound?: string;
  id?: string;
  onClick?: boolean;
  onClose?: boolean;
  onReply?: boolean;
  onAction?: boolean;
}

interface NotificationPermission {
  success: boolean;
  permission?: 'default' | 'granted' | 'denied';
  granted?: boolean;
  supported?: boolean;
  error?: string;
}

interface NotificationResult {
  success: boolean;
  notificationId?: string | null;
  error?: string;
}

// Check if we're running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

export const useElectronNotifications = () => {
  const callbacksRef = useRef<{
    onClick?: (notificationId: string | null) => void;
    onClose?: (notificationId: string | null) => void;
    onReply?: (data: { id: string | null; reply: string }) => void;
    onAction?: (data: { id: string | null; actionIndex: number }) => void;
  }>({});

  // Set up event listeners when the hook is mounted
  useEffect(() => {
    if (!isElectron) return;

    const electronAPI = window.electronAPI;

    // Set up notification event listeners
    electronAPI.onNotificationClicked((event: any, notificationId: string | null) => {
      if (callbacksRef.current.onClick) {
        callbacksRef.current.onClick(notificationId);
      }
    });

    electronAPI.onNotificationClosed((event: any, notificationId: string | null) => {
      if (callbacksRef.current.onClose) {
        callbacksRef.current.onClose(notificationId);
      }
    });

    electronAPI.onNotificationReply((event: any, data: { id: string | null; reply: string }) => {
      if (callbacksRef.current.onReply) {
        callbacksRef.current.onReply(data);
      }
    });

    electronAPI.onNotificationAction((event: any, data: { id: string | null; actionIndex: number }) => {
      if (callbacksRef.current.onAction) {
        callbacksRef.current.onAction(data);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      electronAPI.removeNotificationListeners();
    };
  }, []);

  // Check if notifications are supported
  const isSupported = useCallback(() => {
    return isElectron;
  }, []);

  // Check notification permission
  const checkPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isElectron) {
      return { success: false, error: 'Not running in Electron' };
    }

    try {
      const result = await window.electronAPI.checkNotificationPermission();
      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isElectron) {
      return { success: false, error: 'Not running in Electron' };
    }

    try {
      const result = await window.electronAPI.requestNotificationPermission();
      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  // Show a notification
  const showNotification = useCallback(async (options: NotificationOptions): Promise<NotificationResult> => {
    if (!isElectron) {
      return { success: false, error: 'Not running in Electron' };
    }

    try {
      console.log('🔔 Frontend: Sending notification with options:', JSON.stringify(options, null, 2));
      const result = await window.electronAPI.showNotification(options);
      console.log('🔔 Frontend: Notification result:', result);
      return result;
    } catch (error) {
      console.error('🔔 Frontend: Notification error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  // Set notification event callbacks
  const setCallbacks = useCallback((callbacks: {
    onClick?: (notificationId: string | null) => void;
    onClose?: (notificationId: string | null) => void;
    onReply?: (data: { id: string | null; reply: string }) => void;
    onAction?: (data: { id: string | null; actionIndex: number }) => void;
  }) => {
    callbacksRef.current = callbacks;
  }, []);

  // Convenience methods for common notification types
  const showSuccessNotification = useCallback(async (title: string, body: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      title,
      body,
      urgency: 'normal',
      ...options
    });
  }, [showNotification]);

  const showErrorNotification = useCallback(async (title: string, body: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      title,
      body,
      urgency: 'critical',
      ...options
    });
  }, [showNotification]);

  const showWarningNotification = useCallback(async (title: string, body: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      title,
      body,
      urgency: 'normal',
      ...options
    });
  }, [showNotification]);

  const showInfoNotification = useCallback(async (title: string, body: string, options?: Partial<NotificationOptions>) => {
    return showNotification({
      title,
      body,
      urgency: 'low',
      ...options
    });
  }, [showNotification]);

  return {
    isSupported: isSupported(),
    checkPermission,
    requestPermission,
    showNotification,
    setCallbacks,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  };
};

// Export types for use in other components
export type { NotificationOptions, NotificationPermission, NotificationResult };
