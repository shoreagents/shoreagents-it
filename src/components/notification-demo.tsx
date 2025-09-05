'use client';

import React from 'react';
import { useElectronNotifications } from '@/hooks/use-electron-notifications';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

interface NotificationDemoProps {
  title?: string;
  body?: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'basic';
  className?: string;
}

export const NotificationDemo: React.FC<NotificationDemoProps> = ({
  title = 'Test Notification',
  body = 'This is a test notification from ShoreAgents AI',
  type = 'basic',
  className = '',
}) => {
  const { isSupported, showNotification, showSuccessNotification, showErrorNotification, showWarningNotification, showInfoNotification } = useElectronNotifications();

  const handleShowNotification = async () => {
    if (!isSupported) {
      alert('Notifications are only available in the Electron desktop application.');
      return;
    }

    const notificationId = `${type}-${Date.now()}`;

    switch (type) {
      case 'success':
        await showSuccessNotification(title, body, { id: notificationId });
        break;
      case 'error':
        await showErrorNotification(title, body, { id: notificationId });
        break;
      case 'warning':
        await showWarningNotification(title, body, { id: notificationId });
        break;
      case 'info':
        await showInfoNotification(title, body, { id: notificationId });
        break;
      default:
        await showNotification({
          title,
          body,
          id: notificationId,
        });
        break;
    }
  };

  if (!isSupported) {
    return null; // Don't render anything if not in Electron
  }

  return (
    <Button
      onClick={handleShowNotification}
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 ${className}`}
    >
      <Bell className="h-4 w-4" />
      Test Notification
    </Button>
  );
};
