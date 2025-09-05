declare global {
  interface Window {
    electronAPI: {
      openChatWindow: (ticketId: string, ticketData: any) => Promise<{ success: boolean; windowId?: number; error?: string }>;
      openTicketDetailWindow: (ticketId: string, ticketData: any) => Promise<{ success: boolean; windowId?: number; error?: string }>;
      openFileWindow: (fileUrl: string, fileName: string) => Promise<{ success: boolean; windowId?: number; error?: string }>;
      openJobDetailWindow: (jobId: string | number, jobData: any) => Promise<{ success: boolean; windowId?: number; error?: string }>;
      closeChatWindow: (ticketId: string) => Promise<{ success: boolean; error?: string }>;
      closeCurrentWindow: () => Promise<{ success: boolean; error?: string }>;
      maximizeWindow: () => Promise<{ success: boolean; error?: string }>;
      toggleFullscreen: () => Promise<{ success: boolean; error?: string }>;
      toggleDualMonitorFullscreen: () => Promise<{ success: boolean; error?: string }>;
      exitDualMonitorFullscreen: () => Promise<{ success: boolean; error?: string }>;
      checkMultipleMonitors: () => Promise<{ success: boolean; hasMultipleMonitors?: boolean; monitorCount?: number; error?: string }>;
      
      // Notification API
      showNotification: (options: any) => Promise<{ success: boolean; notificationId?: string | null; error?: string }>;
      requestNotificationPermission: () => Promise<{ success: boolean; permission?: string; granted?: boolean; error?: string }>;
      checkNotificationPermission: () => Promise<{ success: boolean; permission?: string; granted?: boolean; supported?: boolean; error?: string }>;
      
      // Notification event listeners
      onNotificationClicked: (callback: (event: any, notificationId: string | null) => void) => void;
      onNotificationClosed: (callback: (event: any, notificationId: string | null) => void) => void;
      onNotificationReply: (callback: (event: any, data: { id: string | null; reply: string }) => void) => void;
      onNotificationAction: (callback: (event: any, data: { id: string | null; actionIndex: number }) => void) => void;
      
      // Remove notification event listeners
      removeNotificationListeners: () => void;
      
      isElectron: boolean;
    };
  }
}

export {};
