'use client';

import React, { useEffect, useState } from 'react';
import { useElectronNotifications } from '@/hooks/use-electron-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Info, Bell, BellOff } from 'lucide-react';

export const NotificationExample: React.FC = () => {
  const {
    isSupported,
    checkPermission,
    requestPermission,
    showNotification,
    setCallbacks,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  } = useElectronNotifications();

  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'default'>('unknown');
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  // Check permission status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (isSupported) {
        const result = await checkPermission();
        if (result.success) {
          setPermissionStatus(result.permission || 'unknown');
        }
      }
    };
    checkStatus();
  }, [isSupported, checkPermission]);

  // Set up notification callbacks
  useEffect(() => {
    setCallbacks({
      onClick: (notificationId) => {
        console.log('Notification clicked:', notificationId);
        // You can add custom logic here, like focusing the app window
      },
      onClose: (notificationId) => {
        console.log('Notification closed:', notificationId);
      },
      onReply: (data) => {
        console.log('Notification reply received:', data);
        // Handle reply from notification
      },
      onAction: (data) => {
        console.log('Notification action clicked:', data);
        // Handle action button clicks
      },
    });
  }, [setCallbacks]);

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result.success) {
      setPermissionStatus(result.permission || 'unknown');
    }
  };

  const handleShowBasicNotification = async () => {
    const result = await showNotification({
      title: 'Basic Notification',
      body: 'This is a basic notification from ShoreAgents AI',
      id: 'basic-' + Date.now(),
    });
    if (result.success) {
      setLastNotificationId(result.notificationId || null);
    }
  };

  const handleShowSuccessNotification = async () => {
    const result = await showSuccessNotification(
      'Success!',
      'Your action was completed successfully.',
      { id: 'success-' + Date.now() }
    );
    if (result.success) {
      setLastNotificationId(result.notificationId || null);
    }
  };

  const handleShowErrorNotification = async () => {
    const result = await showErrorNotification(
      'Error!',
      'Something went wrong. Please try again.',
      { id: 'error-' + Date.now() }
    );
    if (result.success) {
      setLastNotificationId(result.notificationId || null);
    }
  };

  const handleShowWarningNotification = async () => {
    const result = await showWarningNotification(
      'Warning!',
      'Please check your input before proceeding.',
      { id: 'warning-' + Date.now() }
    );
    if (result.success) {
      setLastNotificationId(result.notificationId || null);
    }
  };

  const handleShowInfoNotification = async () => {
    const result = await showInfoNotification(
      'Information',
      'Here is some useful information for you.',
      { id: 'info-' + Date.now() }
    );
    if (result.success) {
      setLastNotificationId(result.notificationId || null);
    }
  };

  const handleShowInteractiveNotification = async () => {
    const result = await showNotification({
      title: 'Interactive Notification',
      body: 'This notification has action buttons and reply functionality.',
      id: 'interactive-' + Date.now(),
      actions: [
        { type: 'button', text: 'View Details' },
        { type: 'button', text: 'Dismiss' },
      ],
      hasReply: true,
      replyPlaceholder: 'Type your reply here...',
      onClick: true,
      onClose: true,
      onReply: true,
      onAction: true,
    });
    if (result.success) {
      setLastNotificationId(result.notificationId || null);
    }
  };

  const handleShowCriticalNotification = async () => {
    const result = await showNotification({
      title: 'Critical Alert',
      body: 'This is a critical notification that requires immediate attention.',
      id: 'critical-' + Date.now(),
      urgency: 'critical',
      timeoutType: 'never',
      silent: false,
    });
    if (result.success) {
      setLastNotificationId(result.notificationId || null);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications Not Supported
          </CardTitle>
          <CardDescription>
            This feature is only available in the Electron desktop application.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Electron Notifications
        </CardTitle>
        <CardDescription>
          Test system notifications that appear outside the application window.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Permission Status:</span>
          <Badge variant={
            permissionStatus === 'granted' ? 'default' :
            permissionStatus === 'denied' ? 'destructive' :
            'secondary'
          }>
            {permissionStatus === 'granted' && <CheckCircle className="h-3 w-3 mr-1" />}
            {permissionStatus === 'denied' && <AlertCircle className="h-3 w-3 mr-1" />}
            {permissionStatus === 'unknown' && <Info className="h-3 w-3 mr-1" />}
            {permissionStatus}
          </Badge>
        </div>

        {/* Request Permission Button */}
        {permissionStatus !== 'granted' && (
          <Button onClick={handleRequestPermission} className="w-full">
            Request Notification Permission
          </Button>
        )}

        {/* Notification Buttons */}
        {permissionStatus === 'granted' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button onClick={handleShowBasicNotification} variant="outline">
              Basic Notification
            </Button>
            <Button onClick={handleShowSuccessNotification} variant="outline" className="text-green-600">
              Success Notification
            </Button>
            <Button onClick={handleShowErrorNotification} variant="outline" className="text-red-600">
              Error Notification
            </Button>
            <Button onClick={handleShowWarningNotification} variant="outline" className="text-yellow-600">
              Warning Notification
            </Button>
            <Button onClick={handleShowInfoNotification} variant="outline" className="text-blue-600">
              Info Notification
            </Button>
            <Button onClick={handleShowInteractiveNotification} variant="outline" className="text-purple-600">
              Interactive Notification
            </Button>
            <Button onClick={handleShowCriticalNotification} variant="outline" className="text-red-800">
              Critical Notification
            </Button>
          </div>
        )}

        {/* Last Notification ID */}
        {lastNotificationId && (
          <div className="text-xs text-muted-foreground">
            Last notification ID: {lastNotificationId}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
