'use client';

import React, { useState } from 'react';
import { useElectronNotifications } from '@/hooks/use-electron-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';

export const TicketNotificationTest: React.FC = () => {
  const { isSupported, showInfoNotification, checkPermission, requestPermission } = useElectronNotifications();
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  const checkNotificationPermission = async () => {
    const result = await checkPermission();
    setPermissionStatus(result.granted ? 'granted' : 'denied');
  };

  const requestNotificationPermission = async () => {
    const result = await requestPermission();
    setPermissionStatus(result.granted ? 'granted' : 'denied');
  };

  const testTicketNotification = async () => {
    if (!isSupported) {
      alert('Notifications are only available in the Electron desktop application.');
      return;
    }

    const mockTicket = {
      id: Math.floor(Math.random() * 1000),
      title: 'Test Ticket Notification',
      description: 'This is a test notification for a new ticket. It simulates what you would see when a real ticket is created.',
      status: 'For Approval',
      priority: 'High',
      created_at: new Date().toISOString()
    };

    await showInfoNotification(
      `New Ticket: ${mockTicket.title}`,
      mockTicket.description,
      {
        id: `test-ticket-${mockTicket.id}-${Date.now()}`,
        urgency: 'normal',
        onClick: true
      }
    );
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Notifications Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notifications are only available in the Electron desktop application.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Ticket Notification Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Test the notification system for new tickets.
          </p>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Permission Status:</span>
            <span className={`text-sm ${
              permissionStatus === 'granted' ? 'text-green-600' : 
              permissionStatus === 'denied' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {permissionStatus === 'granted' ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Granted
                </span>
              ) : permissionStatus === 'denied' ? (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Denied
                </span>
              ) : (
                'Unknown'
              )}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={checkNotificationPermission}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Check Permission
          </Button>
          
          {permissionStatus !== 'granted' && (
            <Button 
              onClick={requestNotificationPermission}
              variant="default"
              size="sm"
              className="w-full"
            >
              Request Permission
            </Button>
          )}
          
          <Button 
            onClick={testTicketNotification}
            variant="default"
            size="sm"
            className="w-full"
            disabled={permissionStatus !== 'granted'}
          >
            Test Ticket Notification
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>When enabled, you'll receive notifications when new tickets are created in the system.</p>
        </div>
      </CardContent>
    </Card>
  );
};
