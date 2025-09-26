const { app, nativeImage } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Requests a circular image from the renderer process using Canvas API
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string|null>} - Returns base64 data URL or null if failed
 */
async function requestCircularImage(imagePath) {
  try {
    // Read the image file as base64
    const imageBuffer = await fs.readFile(imagePath);
    const imageDataUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    // Send to renderer process for circular processing
    const { ipcMain } = require('electron');
    
    // We'll need to get the main window to send IPC
    const { BrowserWindow } = require('electron');
    const mainWindow = BrowserWindow.getAllWindows()[0];
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      const result = await mainWindow.webContents.executeJavaScript(`
        new Promise((resolve) => {
          // Create circular image using Canvas API
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 64; // Notification icon size
            
            canvas.width = size;
            canvas.height = size;
            
            // Create circular clipping path
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
            ctx.clip();
            
            // Draw image
            ctx.drawImage(img, 0, 0, size, size);
            
            // Return data URL
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(null);
          img.src = '${imageDataUrl}';
        });
      `);
      
      console.log(`🔄 Circular image processing result: ${result ? 'success' : 'failed'}`);
      return result;
    } else {
      console.warn(`⚠️ Main window not available for circular image processing`);
      return null;
    }
  } catch (error) {
    console.warn(`⚠️ Error requesting circular image: ${error.message}`);
    return null;
  }
}


/**
 * Downloads an image from a URL and saves it locally
 * @param {string} imageUrl - The URL of the image to download
 * @param {string} localPath - The local path where to save the image
 * @returns {Promise<boolean>} - Returns true if download was successful
 */
async function downloadImage(imageUrl, localPath) {
  return new Promise((resolve) => {
    try {
      const url = new URL(imageUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const request = client.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          console.error(`Failed to download image: ${response.statusCode}`);
          resolve(false);
          return;
        }

        const fileStream = require('fs').createWriteStream(localPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Image downloaded successfully: ${localPath}`);
          resolve(true);
        });

        fileStream.on('error', (error) => {
          console.error(`Error writing image file: ${error.message}`);
          require('fs').unlink(localPath, () => {}); // Delete partial file
          resolve(false);
        });
      });

      request.on('error', (error) => {
        console.error(`Error downloading image: ${error.message}`);
        resolve(false);
      });

      request.setTimeout(10000, () => {
        console.error('Image download timeout');
        request.destroy();
        resolve(false);
      });
    } catch (error) {
      console.error(`Invalid image URL: ${error.message}`);
      resolve(false);
    }
  });
}

/**
 * Checks if a remote image has changed using HTTP headers
 * @param {string} imageUrl - The URL of the image to check
 * @param {string} localPath - The local path of the cached image
 * @returns {Promise<boolean>} - Returns true if image has changed
 */
async function hasImageChanged(imageUrl, localPath) {
  return new Promise((resolve) => {
    try {
      const url = new URL(imageUrl);
      const client = url.protocol === 'https:' ? https : http;

      const request = client.request(imageUrl, { method: 'HEAD' }, (response) => {
        if (response.statusCode !== 200) {
          console.log('Could not check image headers, assuming unchanged');
          resolve(false);
          return;
        }

        // Get local file stats
        require('fs').stat(localPath, (err, stats) => {
          if (err) {
            console.log('Local file does not exist, needs download');
            resolve(true);
            return;
          }

          const remoteLastModified = response.headers['last-modified'];
          const remoteETag = response.headers['etag'];
          const localLastModified = stats.mtime.toUTCString();

          // Check Last-Modified header
          if (remoteLastModified && remoteLastModified !== localLastModified) {
            console.log('Image has changed (Last-Modified)');
            resolve(true);
            return;
          }

          // Check ETag header
          if (remoteETag) {
            const localETagPath = localPath + '.etag';
            require('fs').readFile(localETagPath, 'utf8', (err, localETag) => {
              if (err || localETag !== remoteETag) {
                console.log('Image has changed (ETag)');
                // Save new ETag
                require('fs').writeFile(localETagPath, remoteETag, () => {});
                resolve(true);
              } else {
                console.log('Image unchanged');
                resolve(false);
              }
            });
          } else {
            console.log('No ETag available, assuming unchanged');
            resolve(false);
          }
        });
      });

      request.on('error', (error) => {
        console.error(`Error checking image headers: ${error.message}`);
        resolve(false);
      });

      request.setTimeout(5000, () => {
        console.error('Header check timeout');
        request.destroy();
        resolve(false);
      });

      request.end();
    } catch (error) {
      console.error(`Invalid image URL for header check: ${error.message}`);
      resolve(false);
    }
  });
}

/**
 * Ensures the avatars directory exists
 * @returns {Promise<string>} - Returns the avatars directory path
 */
async function ensureAvatarsDirectory() {
  const userDataPath = app.getPath('userData');
  const avatarsDir = path.join(userDataPath, 'avatars');
  
  try {
    await fs.access(avatarsDir);
  } catch (error) {
    await fs.mkdir(avatarsDir, { recursive: true });
    console.log(`📁 Created avatars directory: ${avatarsDir}`);
  }
  
  return avatarsDir;
}

/**
 * Shows a notification with a cached profile picture
 * @param {string} title - The notification title
 * @param {string} body - The notification body
 * @param {string} imageUrl - The URL of the profile picture
 * @param {string|number} userId - The user ID for caching
 * @param {Object} options - Additional notification options
 * @returns {Promise<Object>} - Returns notification result
 */
async function showProfileNotification(title, body, imageUrl, userId, options = {}) {
  try {
    console.log(`🔔 Showing profile notification for user ${userId}`);
    console.log(`🔔 Image URL: ${imageUrl}`);
    console.log(`🔔 Title: ${title}`);
    console.log(`🔔 Body: ${body}`);
    
    // Ensure avatars directory exists
    const avatarsDir = await ensureAvatarsDirectory();
    
    // Detect file extension from URL or default to png
    let fileExtension = '.png';
    if (imageUrl) {
      const urlPath = new URL(imageUrl).pathname;
      const urlExtension = path.extname(urlPath).toLowerCase();
      if (urlExtension && ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(urlExtension)) {
        fileExtension = urlExtension;
      }
    }
    
    const localImagePath = path.join(avatarsDir, `${userId}${fileExtension}`);
    const etagPath = localImagePath + '.etag';
    
    console.log(`🔔 Detected file extension: ${fileExtension}`);
    console.log(`🔔 Avatars directory: ${avatarsDir}`);
    console.log(`🔔 Local image path: ${localImagePath}`);
    
    let shouldDownload = false;
    
    // Check if local file exists
    try {
      await fs.access(localImagePath);
      console.log(`📁 Local image exists: ${localImagePath}`);
      
      // Check if remote image has changed
      if (imageUrl) {
        shouldDownload = await hasImageChanged(imageUrl, localImagePath);
      }
    } catch (error) {
      console.log(`📁 Local image does not exist, will download`);
      shouldDownload = true;
    }
    
    // Download image if needed
    if (shouldDownload && imageUrl) {
      console.log(`⬇️ Downloading image from: ${imageUrl}`);
      console.log(`⬇️ Saving to: ${localImagePath}`);
      const downloadSuccess = await downloadImage(imageUrl, localImagePath);
      
      if (!downloadSuccess) {
        console.warn(`⚠️ Failed to download image, will show notification without icon`);
      } else {
        console.log(`✅ Image download successful`);
        
        // Note: WebP files will be handled in the icon loading section
      }
    } else if (!imageUrl) {
      console.log(`⚠️ No image URL provided, skipping download`);
    } else {
      console.log(`ℹ️ Image download not needed (already exists and unchanged)`);
    }
    
    // Create notification options
    const notificationOptions = {
      title: title || 'Notification',
      body: body || '',
      silent: options.silent || false,
      urgency: options.urgency || 'normal',
      timeoutType: options.timeoutType || 'default',
      actions: options.actions || [],
      hasReply: options.hasReply || false,
      replyPlaceholder: options.replyPlaceholder || 'Type a reply...',
      sound: options.sound || 'default',
      ...options
    };
    
    // Add icon if local image exists, otherwise use default fallback
    try {
      await fs.access(localImagePath);
      console.log(`🔍 Loading icon from: ${localImagePath}`);
      
      // Try different methods to load the image
      let iconImage = null;
      
      // Method 1: Try createFromPath
      iconImage = nativeImage.createFromPath(localImagePath);
      console.log(`🔍 createFromPath result - isEmpty: ${iconImage.isEmpty()}`);
      
      // Method 2: If empty and it's a WebP file, try createFromBuffer
      if (iconImage.isEmpty() && fileExtension === '.webp') {
        console.log(`🔄 Trying createFromBuffer for WebP file`);
        try {
          const imageBuffer = await fs.readFile(localImagePath);
          iconImage = nativeImage.createFromBuffer(imageBuffer);
          console.log(`🔍 createFromBuffer result - isEmpty: ${iconImage.isEmpty()}`);
        } catch (bufferError) {
          console.warn(`⚠️ createFromBuffer failed: ${bufferError.message}`);
        }
      }
      
      if (!iconImage.isEmpty()) {
        // Use Canvas API to create circular image
        console.log(`🔄 Requesting circular image from renderer process`);
        const circularImageData = await requestCircularImage(localImagePath);
        
        if (circularImageData) {
          const circularIcon = nativeImage.createFromDataURL(circularImageData);
          notificationOptions.icon = circularIcon;
          console.log(`✅ Using circular profile picture for notification`);
        } else {
          notificationOptions.icon = iconImage;
          console.log(`✅ Using cached profile picture for notification (fallback)`);
        }
      } else {
        console.warn(`⚠️ Cached image is empty, using default fallback`);
        // Use default fallback icon
        const defaultIconPath = path.join(__dirname, '../public/avatars/shadcn.png');
        console.log(`🔍 Loading default icon from: ${defaultIconPath}`);
        const defaultIcon = nativeImage.createFromPath(defaultIconPath);
        if (!defaultIcon.isEmpty()) {
          // Use Canvas API to create circular default icon
          console.log(`🔄 Requesting circular default icon from renderer process`);
          const circularDefaultData = await requestCircularImage(defaultIconPath);
          
          if (circularDefaultData) {
            const circularDefaultIcon = nativeImage.createFromDataURL(circularDefaultData);
            notificationOptions.icon = circularDefaultIcon;
            console.log(`✅ Using circular default fallback icon`);
          } else {
            notificationOptions.icon = defaultIcon;
            console.log(`✅ Using default fallback icon (fallback)`);
          }
        } else {
          console.warn(`⚠️ Default fallback icon is also empty`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not load cached image, using default fallback: ${error.message}`);
      // Use default fallback icon
      const defaultIconPath = path.join(__dirname, '../public/avatars/shadcn.png');
      console.log(`🔍 Loading default icon from: ${defaultIconPath}`);
      const defaultIcon = nativeImage.createFromPath(defaultIconPath);
      if (!defaultIcon.isEmpty()) {
        // Use Canvas API to create circular default icon
        console.log(`🔄 Requesting circular default icon from renderer process (catch)`);
        const circularDefaultData = await requestCircularImage(defaultIconPath);
        
        if (circularDefaultData) {
          const circularDefaultIcon = nativeImage.createFromDataURL(circularDefaultData);
          notificationOptions.icon = circularDefaultIcon;
          console.log(`✅ Using circular default fallback icon (catch)`);
        } else {
          notificationOptions.icon = defaultIcon;
          console.log(`✅ Using default fallback icon (catch fallback)`);
        }
      } else {
        console.warn(`⚠️ Default fallback icon is also empty`);
      }
    }
    
    // Create and show notification
    const { Notification } = require('electron');
    const notification = new Notification(notificationOptions);
    
    // Handle notification events
    notification.on('click', () => {
      if (options.onClick) {
        console.log(`🔔 Notification clicked: ${options.id || 'unknown'}`);
        // You can emit IPC events here if needed
      }
    });
    
    notification.on('close', () => {
      if (options.onClose) {
        console.log(`🔔 Notification closed: ${options.id || 'unknown'}`);
      }
    });
    
    notification.on('show', () => {
      console.log(`✅ Notification shown successfully`);
    });
    
    notification.on('failed', (event, error) => {
      console.error(`❌ Notification failed: ${error}`);
    });
    
    // Show the notification
    notification.show();
    
    return {
      success: true,
      notification: notification,
      iconPath: localImagePath
    };
    
  } catch (error) {
    console.error(`❌ Error in showProfileNotification: ${error.message}`);
    
    // Fallback: show notification with default icon
    try {
      const { Notification } = require('electron');
      
      // Try to use default fallback icon
      const defaultIconPath = path.join(__dirname, '../public/avatars/shadcn.png');
      const defaultIcon = nativeImage.createFromPath(defaultIconPath);
      
      const fallbackOptions = {
        title: title || 'Notification',
        body: body || '',
        silent: options.silent || false,
        urgency: options.urgency || 'normal',
        ...options
      };
      
      if (!defaultIcon.isEmpty()) {
        fallbackOptions.icon = defaultIcon;
        console.log(`✅ Fallback notification using default icon: ${defaultIconPath}`);
      } else {
        console.warn(`⚠️ Default fallback icon not available, showing without icon`);
      }
      
      const fallbackNotification = new Notification(fallbackOptions);
      fallbackNotification.show();
      
      return {
        success: true,
        notification: fallbackNotification,
        fallback: true
      };
    } catch (fallbackError) {
      console.error(`❌ Fallback notification also failed: ${fallbackError.message}`);
      return {
        success: false,
        error: fallbackError.message
      };
    }
  }
}

/**
 * Clears cached profile pictures for a specific user
 * @param {string|number} userId - The user ID
 * @returns {Promise<boolean>} - Returns true if successful
 */
async function clearUserCache(userId) {
  try {
    const avatarsDir = await ensureAvatarsDirectory();
    
    // Try to clear files with different extensions
    const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
    
    for (const ext of extensions) {
      const localImagePath = path.join(avatarsDir, `${userId}${ext}`);
      const etagPath = localImagePath + '.etag';
      
      await fs.unlink(localImagePath).catch(() => {}); // Ignore if file doesn't exist
      await fs.unlink(etagPath).catch(() => {}); // Ignore if file doesn't exist
    }
    
    console.log(`🗑️ Cleared cache for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error clearing cache for user ${userId}: ${error.message}`);
    return false;
  }
}

/**
 * Clears all cached profile pictures
 * @returns {Promise<boolean>} - Returns true if successful
 */
async function clearAllCache() {
  try {
    const avatarsDir = await ensureAvatarsDirectory();
    const files = await fs.readdir(avatarsDir);
    
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
    
    for (const file of files) {
      const isImageFile = imageExtensions.some(ext => file.endsWith(ext));
      const isEtagFile = file.endsWith('.etag');
      
      if (isImageFile || isEtagFile) {
        await fs.unlink(path.join(avatarsDir, file));
      }
    }
    
    console.log(`🗑️ Cleared all cached profile pictures`);
    return true;
  } catch (error) {
    console.error(`❌ Error clearing all cache: ${error.message}`);
    return false;
  }
}

module.exports = {
  showProfileNotification,
  clearUserCache,
  clearAllCache
};
