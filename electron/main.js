const { app, BrowserWindow } = require('electron');
const path = require('path');

// Check if we're in development mode
const isDev = !app.isPackaged;

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
    },
    icon: path.join(__dirname, '../public/icon.png'), // Optional: add an icon
  });

  // Load the app
  if (isDev) {
    // In development, load from the Next.js dev server
    console.log('Loading from development server: http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
    
    // Handle load errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorCode, errorDescription);
      // Retry after a short delay
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:3000');
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