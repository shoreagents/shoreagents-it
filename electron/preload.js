const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openChatWindow: (ticketId, ticketData) => ipcRenderer.invoke('open-chat-window', ticketId, ticketData),
  openTicketDetailWindow: (ticketId, ticketData) => ipcRenderer.invoke('open-ticket-detail-window', ticketId, ticketData),
  openFileWindow: (fileUrl, fileName) => ipcRenderer.invoke('open-file-window', fileUrl, fileName),
  openJobDetailWindow: (jobId, jobData) => ipcRenderer.invoke('open-job-detail-window', jobId, jobData),
  closeChatWindow: (ticketId) => ipcRenderer.invoke('close-chat-window', ticketId),
  closeCurrentWindow: () => ipcRenderer.invoke('close-current-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  toggleDualMonitorFullscreen: () => ipcRenderer.invoke('toggle-dual-monitor-fullscreen'),
  exitDualMonitorFullscreen: () => ipcRenderer.invoke('exit-dual-monitor-fullscreen'),
  checkMultipleMonitors: () => ipcRenderer.invoke('check-multiple-monitors'),
  
  // Notification API
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  requestNotificationPermission: () => ipcRenderer.invoke('request-notification-permission'),
  checkNotificationPermission: () => ipcRenderer.invoke('check-notification-permission'),
  
  // Notification event listeners
  onNotificationClicked: (callback) => ipcRenderer.on('notification-clicked', callback),
  onNotificationClosed: (callback) => ipcRenderer.on('notification-closed', callback),
  onNotificationReply: (callback) => ipcRenderer.on('notification-reply', callback),
  onNotificationAction: (callback) => ipcRenderer.on('notification-action', callback),
  
  // Remove notification event listeners
  removeNotificationListeners: () => {
    ipcRenderer.removeAllListeners('notification-clicked');
    ipcRenderer.removeAllListeners('notification-closed');
    ipcRenderer.removeAllListeners('notification-reply');
    ipcRenderer.removeAllListeners('notification-action');
  },
  
  isElectron: true,
}); 