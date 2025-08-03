const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Check if we're in development mode
const isDev = !app.isPackaged;

// Store references to chat windows
const chatWindows = new Map();

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
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
    
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
    chatWindow.loadURL(`http://localhost:3001/chat/${ticketId}`);
    chatWindow.webContents.openDevTools();
  } else {
    chatWindow.loadFile(path.join(__dirname, `../out/chat/${ticketId}/index.html`));
  }

  // Store reference to chat window
  chatWindows.set(ticketId, chatWindow);

  // Handle chat window closed
  chatWindow.on('closed', () => {
    chatWindows.delete(ticketId);
  });

  return chatWindow;
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