const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

// Check if we're in development mode
const isDev = !app.isPackaged;

// Store references to chat windows
const chatWindows = new Map();
// Store references to ticket detail windows
const ticketDetailWindows = new Map();
// Store references to file windows
const fileWindows = new Map();
// Store references to job detail windows
const jobDetailWindows = new Map();

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,  // Minimum window width
    minHeight: 800, // Minimum window height
    resizable: true, // Allow window resizing
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'), // Add preload script
    },
    icon: path.join(__dirname, '../public/icon.png'), // Optional: add an icon
  });

  // Load the app
  if (isDev) {
    // In development, load from the custom server
    console.log('Loading from development server: http://localhost:3001');
            mainWindow.loadURL('http://localhost:3001');
    // Open DevTools in development (commented out to prevent auto-opening)
    // mainWindow.webContents.openDevTools();
    
    // Handle load errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorCode, errorDescription);
      // Retry after a short delay
        setTimeout(() => {
          mainWindow.loadURL('http://localhost:3001');
      }, 2000);
    });
  } else {
    // In production, load the built Next.js app
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

function createChatWindow(ticketId, ticketData) {
  // Check if chat window already exists for this ticket
  if (chatWindows.has(ticketId)) {
    const existingWindow = chatWindows.get(ticketId);
    if (!existingWindow.isDestroyed()) {
      existingWindow.focus();
      return;
    }
  }

  // Create new chat window
  const chatWindow = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.png'),
    title: `Chat - Ticket ${ticketData.ticket_id}`,
  });

  // Load chat page
  if (isDev) {
          chatWindow.loadURL(`http://localhost:3001/global/chat/${ticketId}`);
    // chatWindow.webContents.openDevTools();
  } else {
    chatWindow.loadFile(path.join(__dirname, `../out/global/chat/${ticketId}/index.html`));
  }

  // Store reference to chat window
  chatWindows.set(ticketId, chatWindow);

  // Handle chat window closed
  chatWindow.on('closed', () => {
    chatWindows.delete(ticketId);
  });

  return chatWindow;
}

function createTicketDetailWindow(ticketId, ticketData) {
  // Check if ticket detail window already exists for this ticket
  if (ticketDetailWindows.has(ticketId)) {
    const existingWindow = ticketDetailWindows.get(ticketId);
    if (!existingWindow.isDestroyed()) {
      existingWindow.focus();
      return;
    }
  }

  // Create new ticket detail window
  const ticketDetailWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    maximizable: true,
    fullscreenable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.png'),
    title: `Ticket Detail - ${ticketData.ticket_id}`,
  });

  // Load ticket detail page
  if (isDev) {
          ticketDetailWindow.loadURL(`http://localhost:3001/ticket-detail/${ticketId}`);
    // ticketDetailWindow.webContents.openDevTools();
  } else {
    ticketDetailWindow.loadFile(path.join(__dirname, `../out/ticket-detail/${ticketId}/index.html`));
  }

  // Store reference to ticket detail window
  ticketDetailWindows.set(ticketId, ticketDetailWindow);

  // Handle ticket detail window closed
  ticketDetailWindow.on('closed', () => {
    ticketDetailWindows.delete(ticketId);
  });

  return ticketDetailWindow;
}

function createFileWindow(fileUrl, fileName) {
  // Create a stable key for the file window based on URL and filename
  const fileKey = `${fileUrl}-${fileName}`;
  
  // Check if file window already exists for this file
  if (fileWindows.has(fileKey)) {
    const existingWindow = fileWindows.get(fileKey);
    if (!existingWindow.isDestroyed()) {
      existingWindow.focus();
      return existingWindow;
    }
  }

  // Create new file window
  const fileWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    maximizable: true,
    fullscreenable: true, // Enable fullscreen mode
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.png'),
    title: `File Viewer - ${fileName}`,
  });

  // Load the file viewer page with file URL and filename as search params
  const encodedUrl = encodeURIComponent(fileUrl);
  const encodedFileName = encodeURIComponent(fileName);
  
  if (isDev) {
          fileWindow.loadURL(`http://localhost:3001/global/file-viewer?url=${encodedUrl}&filename=${encodedFileName}`);
    // fileWindow.webContents.openDevTools();
  } else {
    fileWindow.loadFile(path.join(__dirname, `../out/global/file-viewer/index.html?url=${encodedUrl}&filename=${encodedFileName}`));
  }

  // Store reference to file window
  fileWindows.set(fileKey, fileWindow);

  // Handle file window closed
  fileWindow.on('closed', () => {
    fileWindows.delete(fileKey);
  });

  return fileWindow;
}

function createJobDetailWindow(jobId, jobData) {
  // Check if job detail window already exists for this job
  if (jobDetailWindows.has(jobId)) {
    const existingWindow = jobDetailWindows.get(jobId);
    if (!existingWindow.isDestroyed()) {
      existingWindow.focus();
      return existingWindow;
    }
  }

  // Create new job detail window
  const jobDetailWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    maximizable: true,
    fullscreenable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.png'),
    title: `Job Details - ${jobData.title || jobData.job_title || 'Unknown Job'}`,
  });

  // Load the job details React component
  if (isDev) {
    const encodedJobData = encodeURIComponent(JSON.stringify(jobData))
    jobDetailWindow.loadURL(`http://localhost:3001/global/job-details?jobId=${jobId}&jobData=${encodedJobData}`)
    // jobDetailWindow.webContents.openDevTools()
  } else {
    // For production, we'll need to build and serve the static files
    jobDetailWindow.loadFile(path.join(__dirname, `../out/global/job-details/index.html?jobId=${jobId}&jobData=${encodeURIComponent(JSON.stringify(jobData))}`))
  }

  // Store reference to job detail window
  jobDetailWindows.set(jobId, jobDetailWindow);

  // Handle job detail window closed
  jobDetailWindow.on('closed', () => {
    jobDetailWindows.delete(jobId);
  });

  return jobDetailWindow;
}

// Handle IPC messages
ipcMain.handle('open-chat-window', async (event, ticketId, ticketData) => {
  try {
    const chatWindow = createChatWindow(ticketId, ticketData);
    return { success: true, windowId: chatWindow.id };
  } catch (error) {
    console.error('Error creating chat window:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-ticket-detail-window', async (event, ticketId, ticketData) => {
  try {
    const ticketDetailWindow = createTicketDetailWindow(ticketId, ticketData);
    return { success: true, windowId: ticketDetailWindow.id };
  } catch (error) {
    console.error('Error creating ticket detail window:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-file-window', async (event, fileUrl, fileName) => {
  try {
    const fileWindow = createFileWindow(fileUrl, fileName);
    return { success: true, windowId: fileWindow.id };
  } catch (error) {
    console.error('Error creating file window:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-job-detail-window', async (event, jobId, jobData) => {
  try {
    const jobDetailWindow = createJobDetailWindow(jobId, jobData);
    return { success: true, windowId: jobDetailWindow.id };
  } catch (error) {
    console.error('Error creating job detail window:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('close-chat-window', async (event, ticketId) => {
  try {
    const chatWindow = chatWindows.get(ticketId);
    if (chatWindow && !chatWindow.isDestroyed()) {
      chatWindow.close();
      chatWindows.delete(ticketId);
    }
    return { success: true };
  } catch (error) {
    console.error('Error closing chat window:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('close-current-window', async (event) => {
  try {
    const currentWindow = BrowserWindow.fromWebContents(event.sender);
    if (currentWindow && !currentWindow.isDestroyed()) {
      currentWindow.close();
    }
    return { success: true };
  } catch (error) {
    console.error('Error closing current window:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('maximize-window', async (event) => {
  try {
    const currentWindow = BrowserWindow.fromWebContents(event.sender);
    if (currentWindow && !currentWindow.isDestroyed()) {
      if (currentWindow.isMaximized()) {
        currentWindow.unmaximize();
      } else {
        currentWindow.maximize();
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error maximizing window:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-fullscreen', async (event) => {
  try {
    const currentWindow = BrowserWindow.fromWebContents(event.sender);
    if (currentWindow && !currentWindow.isDestroyed()) {
      if (currentWindow.isFullScreen()) {
        currentWindow.setFullScreen(false);
      } else {
        currentWindow.setFullScreen(true);
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error toggling fullscreen:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-dual-monitor-fullscreen', async (event) => {
  try {
    // Verify screen module is available
    if (!screen || typeof screen.getAllDisplays !== 'function') {
      console.error('Screen module not available');
      return { success: false, error: 'Screen module not available' };
    }
    
    const currentWindow = BrowserWindow.fromWebContents(event.sender);
    if (currentWindow && !currentWindow.isDestroyed()) {
      const displays = screen.getAllDisplays();
      console.log('Available displays:', displays.map(d => ({ id: d.id, bounds: d.bounds, size: d.size })));
      
      if (displays.length > 1) {
        // Get the primary display using the proper API
        const primaryDisplay = screen.getPrimaryDisplay();
        console.log('Primary display:', { id: primaryDisplay.id, bounds: primaryDisplay.bounds, size: primaryDisplay.size });
        
        const secondaryDisplay = displays.find(display => display.id !== primaryDisplay.id);
        console.log('Secondary display:', secondaryDisplay ? { id: secondaryDisplay.id, bounds: secondaryDisplay.bounds, size: secondaryDisplay.size } : 'Not found');
        
        if (primaryDisplay && secondaryDisplay) {
          // Additional validation to ensure displays are valid
          if (!primaryDisplay.bounds || !secondaryDisplay.bounds || 
              !primaryDisplay.size || !secondaryDisplay.size) {
            console.error('Display bounds or size are invalid:', { 
              primary: { bounds: primaryDisplay.bounds, size: primaryDisplay.size },
              secondary: { bounds: secondaryDisplay.bounds, size: secondaryDisplay.size }
            });
            return { success: false, error: 'Display configuration is invalid' };
          }
          // Create a black window on secondary monitor
          const blackWindow = new BrowserWindow({
            width: secondaryDisplay.size.width,
            height: secondaryDisplay.size.height,
            x: secondaryDisplay.bounds.x,
            y: secondaryDisplay.bounds.y,
            frame: false,
            fullscreen: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            webPreferences: {
              nodeIntegration: false,
              contextIsolation: true,
              enableRemoteModule: false,
            }
          });
          
          // Load a simple black HTML page
          blackWindow.loadURL('data:text/html,<html><body style="background-color: black; margin: 0; padding: 0; width: 100vw; height: 100vh;"></body></html>');
          
          // Store reference to black window
          if (!currentWindow.blackWindow) {
            currentWindow.blackWindow = blackWindow;
          }
          
          // Set current window to fullscreen on primary monitor
          currentWindow.setFullScreen(true);
          
          // Handle black window close
          blackWindow.on('closed', () => {
            if (currentWindow.blackWindow === blackWindow) {
              currentWindow.blackWindow = null;
            }
          });
          
          console.log('Dual monitor fullscreen activated successfully');
          return { success: true, message: 'Dual monitor fullscreen activated' };
        } else {
          console.error('Failed to identify displays using primary method, trying fallback...');
          
          // Fallback: try using first two displays
          if (displays.length >= 2) {
            const fallbackPrimary = displays[0];
            const fallbackSecondary = displays[1];
            
            console.log('Fallback - Display 1:', { id: fallbackPrimary.id, bounds: fallbackPrimary.bounds, size: fallbackPrimary.size });
            console.log('Fallback - Display 2:', { id: fallbackSecondary.id, bounds: fallbackSecondary.bounds, size: fallbackSecondary.size });
            
            if (fallbackPrimary.bounds && fallbackSecondary.bounds && 
                fallbackPrimary.size && fallbackSecondary.size) {
              
              // Create a black window on second display
              const blackWindow = new BrowserWindow({
                width: fallbackSecondary.size.width,
                height: fallbackSecondary.size.height,
                x: fallbackSecondary.bounds.x,
                y: fallbackSecondary.bounds.y,
                frame: false,
                fullscreen: true,
                alwaysOnTop: true,
                skipTaskbar: true,
                webPreferences: {
                  nodeIntegration: false,
                  contextIsolation: true,
                  enableRemoteModule: false,
                }
              });
              
              // Load a simple black HTML page
              blackWindow.loadURL('data:text/html,<html><body style="background-color: black; margin: 0; padding: 0; width: 100vw; height: 100vh;"></body></html>');
              
              // Store reference to black window
              if (!currentWindow.blackWindow) {
                currentWindow.blackWindow = blackWindow;
              }
              
              // Set current window to fullscreen on first display
              currentWindow.setFullScreen(true);
              
              // Handle black window close
              blackWindow.on('closed', () => {
                if (currentWindow.blackWindow === blackWindow) {
                  currentWindow.blackWindow = null;
                }
              });
              
              console.log('Dual monitor fullscreen activated using fallback method');
              return { success: true, message: 'Dual monitor fullscreen activated (fallback method)' };
            }
          }
          
          console.error('All methods failed to identify displays');
          return { success: false, error: 'Could not identify primary and secondary displays' };
        }
      } else {
        console.log('Only one monitor detected:', displays.length);
        return { success: false, error: 'Only one monitor detected' };
      }
    }
    return { success: false, error: 'Window not found' };
  } catch (error) {
    console.error('Error toggling dual monitor fullscreen:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('exit-dual-monitor-fullscreen', async (event) => {
  try {
    const currentWindow = BrowserWindow.fromWebContents(event.sender);
    if (currentWindow && !currentWindow.isDestroyed()) {
      // Close black window if it exists
      if (currentWindow.blackWindow && !currentWindow.blackWindow.isDestroyed()) {
        currentWindow.blackWindow.close();
        currentWindow.blackWindow = null;
      }
      
      // Exit fullscreen on current window
      currentWindow.setFullScreen(false);
      
      return { success: true, message: 'Dual monitor fullscreen deactivated' };
    }
    return { success: false, error: 'Window not found' };
  } catch (error) {
    console.error('Error exiting dual monitor fullscreen:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-multiple-monitors', async (event) => {
  try {
    // Verify screen module is available
    if (!screen || typeof screen.getAllDisplays !== 'function') {
      console.error('Screen module not available');
      return { success: false, error: 'Screen module not available' };
    }
    
    const displays = screen.getAllDisplays();
    console.log('Monitor check - Available displays:', displays.length);
    
    return { 
      success: true, 
      hasMultipleMonitors: displays.length > 1,
      monitorCount: displays.length
    };
  } catch (error) {
    console.error('Error checking monitors:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-multi-monitor-fullscreen', async (event) => {
  try {
    const currentWindow = BrowserWindow.fromWebContents(event.sender);
    if (currentWindow && !currentWindow.isDestroyed()) {
      if (currentWindow.isFullScreen()) {
        // Exit multi-monitor fullscreen
        currentWindow.setFullScreen(false);
        currentWindow.setResizable(true);
        currentWindow.setMovable(true);
        currentWindow.setAlwaysOnTop(false);
        currentWindow.setVisibleOnAllWorkspaces(false);
        currentWindow.setBounds({ x: 0, y: 0, width: 800, height: 600 });
      } else {
        // Enter multi-monitor fullscreen - create a truly borderless window covering all displays
        const { screen } = require('electron');
        const displays = screen.getAllDisplays();
        
        // Calculate bounds to cover all displays
        let minX = 0, minY = 0, maxX = 0, maxY = 0;
        displays.forEach(display => {
          minX = Math.min(minX, display.bounds.x);
          minY = Math.min(minY, display.bounds.y);
          maxX = Math.max(maxX, display.bounds.x + display.bounds.width);
          maxY = Math.max(maxY, display.bounds.y + display.bounds.height);
        });
        
        // Set window to cover all displays with no borders
        currentWindow.setBounds({
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        });
        
        // Make it truly fullscreen across all monitors
        currentWindow.setFullScreen(true);
        
        // Force the window to be on top and cover everything
        currentWindow.setAlwaysOnTop(true, 'screen-saver');
        currentWindow.setVisibleOnAllWorkspaces(true);
        
        // Ensure it covers the entire screen area
        currentWindow.setResizable(false);
        currentWindow.setMovable(false);
        
        // Set the window to be borderless and truly fullscreen
        currentWindow.setMenuBarVisibility(false);
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error toggling multi-monitor fullscreen:', error);
    return { success: false, error: error.message };
  }
});

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 