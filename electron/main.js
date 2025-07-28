const { app, BrowserWindow } = require('electron');
const path = require('path');

// Check if we're in development mode
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#ffffff', // Set background color to prevent white flash
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // Allow loading localhost in development
    },
    icon: path.join(__dirname, 'assets/icon.png'), // You can add an icon later
  });

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  if (isDev) {
    // In development, try to load from the Next.js dev server
    console.log('Loading from development server...');
    
    // Try multiple ports in case the server is on a different port
    const tryLoadFromPort = (port) => {
      const url = `http://localhost:${port}`;
      console.log(`Trying to load from ${url}`);
      mainWindow.loadURL(url);
    };

    // Try port 3000
    tryLoadFromPort(3000);
    
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
    
    // Handle load errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorCode, errorDescription);
      
      // Show error if connection fails
      console.error('Could not connect to development server');
      mainWindow.loadURL('data:text/html,<h1>Could not connect to development server</h1><p>Make sure Next.js is running on port 3000</p>');
    });

    // Add console message handler to see web app logs
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`Web Console [${level}]: ${message} (${sourceId}:${line})`);
    });
    
    // Handle successful load
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Successfully loaded the app');
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
app.whenReady().then(() => {
  createWindow();
  
  // Handle macOS activation
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app ready
app.on('ready', () => {
  console.log('Electron app is ready');
});

// Handle app errors
app.on('render-process-gone', (event, webContents, details) => {
  console.error('Render process gone:', details);
});

app.on('child-process-gone', (event, details) => {
  console.error('Child process gone:', details);
}); 