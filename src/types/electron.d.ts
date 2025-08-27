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
      isElectron: boolean;
    };
  }
}

export {};
