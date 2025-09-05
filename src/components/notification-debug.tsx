'use client';

import React, { useState, useEffect } from 'react';
import { useElectronNotifications } from '@/hooks/use-electron-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export const NotificationDebug: React.FC = () => {
  const { 
    isSupported, 
    checkPermission, 
    requestPermission, 
    showInfoNotification,
    showSuccessNotification,
    showErrorNotification 
  } = useElectronNotifications();
  
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkNotificationSupport = async () => {
    setIsLoading(true);
    addResult('Checking notification support...', 'info');
    
    if (!isSupported) {
      addResult('❌ Notifications not supported - not running in Electron', 'error');
      setIsLoading(false);
      return;
    }
    
    addResult('✅ Notifications supported - running in Electron', 'success');
    
    // Check permission
    const permissionResult = await checkPermission();
    addResult(`Permission check result: ${JSON.stringify(permissionResult)}`, 'info');
    
    if (permissionResult.granted) {
      setPermissionStatus('granted');
      addResult('✅ Notification permission granted', 'success');
    } else {
      setPermissionStatus('denied');
      addResult('❌ Notification permission denied', 'error');
    }
    
    setIsLoading(false);
  };

  const requestNotificationPermission = async () => {
    setIsLoading(true);
    addResult('Requesting notification permission...', 'info');
    
    const result = await requestPermission();
    addResult(`Permission request result: ${JSON.stringify(result)}`, 'info');
    
    if (result.granted) {
      setPermissionStatus('granted');
      addResult('✅ Notification permission granted', 'success');
    } else {
      setPermissionStatus('denied');
      addResult('❌ Notification permission denied', 'error');
    }
    
    setIsLoading(false);
  };

  const testBasicNotification = async () => {
    if (permissionStatus !== 'granted') {
      addResult('❌ Cannot test - permission not granted', 'error');
      return;
    }
    
    setIsLoading(true);
    addResult('Testing basic notification...', 'info');
    
    try {
      const result = await showInfoNotification(
        'Test Notification',
        'This is a test notification to verify the system is working.',
        {
          id: `test-${Date.now()}`,
          urgency: 'normal'
        }
      );
      
      addResult(`✅ Basic notification sent: ${JSON.stringify(result)}`, 'success');
    } catch (error) {
      addResult(`❌ Basic notification failed: ${error}`, 'error');
    }
    
    setIsLoading(false);
  };

  const testTicketNotification = async () => {
    if (permissionStatus !== 'granted') {
      addResult('❌ Cannot test - permission not granted', 'error');
      return;
    }
    
    setIsLoading(true);
    addResult('Testing ticket notification...', 'info');
    
    try {
      const mockTicket = {
        id: Math.floor(Math.random() * 1000),
        concern: 'Test Ticket Notification',
        details: 'This is a test notification for a new ticket. It simulates what you would see when a real ticket is created.',
        status: 'For Approval',
        member_name: 'Test User'
      };
      
      const result = await showInfoNotification(
        `TICKETS - ${mockTicket.member_name || 'Test User'}`,
        mockTicket.concern,
        {
          id: `ticket-${mockTicket.id}-${Date.now()}`,
          urgency: 'normal',
          onClick: true
        }
      );
      
      addResult(`✅ Ticket notification sent: ${JSON.stringify(result)}`, 'success');
    } catch (error) {
      addResult(`❌ Ticket notification failed: ${error}`, 'error');
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Notification System Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Support:</span>
            <Badge variant={isSupported ? "default" : "destructive"}>
              {isSupported ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Supported</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Not Supported</>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Permission:</span>
            <Badge variant={
              permissionStatus === 'granted' ? "default" : 
              permissionStatus === 'denied' ? "destructive" : 
              "secondary"
            }>
              {permissionStatus === 'granted' ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Granted</>
              ) : permissionStatus === 'denied' ? (
                <><XCircle className="h-3 w-3 mr-1" /> Denied</>
              ) : (
                <><AlertTriangle className="h-3 w-3 mr-1" /> Unknown</>
              )}
            </Badge>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={checkNotificationSupport}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            Check Support & Permission
          </Button>
          
          {permissionStatus !== 'granted' && (
            <Button 
              onClick={requestNotificationPermission}
              disabled={isLoading}
              variant="default"
              size="sm"
            >
              Request Permission
            </Button>
          )}
          
          <Button 
            onClick={testBasicNotification}
            disabled={isLoading || permissionStatus !== 'granted'}
            variant="outline"
            size="sm"
          >
            Test Basic Notification
          </Button>
          
          <Button 
            onClick={testTicketNotification}
            disabled={isLoading || permissionStatus !== 'granted'}
            variant="default"
            size="sm"
          >
            Test Ticket Notification
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Test Results:</span>
            <Button 
              onClick={clearResults}
              variant="ghost"
              size="sm"
            >
              Clear
            </Button>
          </div>
          
          <div className="bg-muted p-3 rounded-md max-h-48 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No test results yet. Run a test to see results.</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-xs font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Instructions:</strong></p>
          <p>1. Click "Check Support & Permission" first</p>
          <p>2. If permission is denied, click "Request Permission"</p>
          <p>3. Test both basic and ticket notifications</p>
          <p>4. Check your desktop for notifications</p>
        </div>
      </CardContent>
    </Card>
  );
};
