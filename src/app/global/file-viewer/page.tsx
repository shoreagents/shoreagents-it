"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { IconPhoto, IconDeviceFloppy, IconArrowsMaximize, IconZoomIn, IconZoomOut } from "@tabler/icons-react"
import { X } from "lucide-react"

interface FileViewerPageProps {
  searchParams: {
    url?: string
    filename?: string
  }
}

export default function FileViewerPage({ searchParams }: FileViewerPageProps) {
  const [fileUrl, setFileUrl] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")
  const [fileType, setFileType] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [fileSize, setFileSize] = useState<string>("")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDualMonitorFullscreen, setIsDualMonitorFullscreen] = useState(false)
  const [hasMultipleMonitors, setHasMultipleMonitors] = useState(false)

  useEffect(() => {
    // Get file URL and filename from search params
    const url = searchParams.url || ""
    const filename = searchParams.filename || "Unknown File"
    
    setFileUrl(url)
    setFileName(filename)
    
    // Determine file type
    const extension = filename.split('.').pop()?.toLowerCase() || ""
    setFileType(extension)
    setLoading(false)

    // Get file size
    if (url) {
      fetch(url, { method: 'HEAD' })
        .then(response => {
          const size = response.headers.get('content-length')
          if (size) {
            const bytes = parseInt(size)
            const kb = (bytes / 1024).toFixed(1)
            setFileSize(`${kb} KB`)
          }
        })
        .catch(() => {
          setFileSize("Unknown")
        })
    }

    // Check for multiple monitors
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.checkMultipleMonitors()
        .then((result: any) => {
          if (result.success) {
            setHasMultipleMonitors(result.hasMultipleMonitors)
            console.log(`Detected ${result.monitorCount} monitor(s)`)
          }
        })
        .catch((error: any) => {
          console.error('Error checking monitors:', error)
          setHasMultipleMonitors(false)
        })
    }
  }, [searchParams])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
  }

  const handleCloseWindow = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.closeCurrentWindow()
        .then((result: any) => {
          if (result.success) {
            console.log('File window closed successfully')
          } else {
            console.error('Failed to close file window:', result.error)
            // Fallback to window.close()
            window.close()
          }
        })
        .catch((error: any) => {
          console.error('Error closing file window:', error)
          // Fallback to window.close()
          window.close()
        })
    } else {
      window.close()
    }
  }

  const handleFullscreenToggle = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.toggleFullscreen()
        .then((result: any) => {
          if (result.success) {
            setIsFullscreen(!isFullscreen)
            setIsDualMonitorFullscreen(false) // Exit dual monitor mode when regular fullscreen is toggled
            console.log('Fullscreen toggled successfully')
          } else {
            console.error('Failed to toggle fullscreen:', result.error)
          }
        })
        .catch((error: any) => {
          console.error('Error toggling fullscreen:', error)
        })
    } else {
      // Fallback to browser fullscreen API
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err)
        })
      } else {
        document.exitFullscreen().catch(err => {
          console.error('Error attempting to exit fullscreen:', err)
        })
      }
    }
  }, [isFullscreen])

  const handleDualMonitorFullscreenToggle = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      if (isDualMonitorFullscreen) {
        // Exit dual monitor fullscreen
        (window as any).electronAPI.exitDualMonitorFullscreen()
          .then((result: any) => {
            if (result.success) {
              setIsDualMonitorFullscreen(false)
              setIsFullscreen(false)
              console.log('Dual monitor fullscreen deactivated')
            } else {
              console.error('Failed to exit dual monitor fullscreen:', result.error)
            }
          })
          .catch((error: any) => {
            console.error('Error exiting dual monitor fullscreen:', error)
          })
      } else {
        // Enter dual monitor fullscreen
        (window as any).electronAPI.toggleDualMonitorFullscreen()
          .then((result: any) => {
            if (result.success) {
              setIsDualMonitorFullscreen(true)
              setIsFullscreen(false)
              console.log('Dual monitor fullscreen activated')
            } else {
              console.error('Failed to activate dual monitor fullscreen:', result.error)
              // Show user-friendly error message
              if (result.error === 'Only one monitor detected') {
                alert('Dual monitor fullscreen requires at least 2 monitors')
              } else if (result.error === 'Could not identify primary and secondary displays') {
                alert('Failed to identify monitor configuration. Please check your display settings.')
              } else if (result.error === 'Display configuration is invalid') {
                alert('Monitor configuration appears to be invalid. Please check your display settings.')
              } else if (result.error === 'Screen module not available') {
                alert('Screen detection is not available. Please restart the application.')
              } else {
                alert(`Failed to activate dual monitor fullscreen: ${result.error}`)
              }
            }
          })
          .catch((error: any) => {
            console.error('Error activating dual monitor fullscreen:', error)
            alert('Error activating dual monitor fullscreen')
          })
      }
    } else {
      // Fallback to regular fullscreen for browser
      handleFullscreenToggle()
    }
  }, [isDualMonitorFullscreen, handleFullscreenToggle])

  const handleHeaderDoubleClick = useCallback(() => {
    if (isDualMonitorFullscreen) {
      handleDualMonitorFullscreenToggle()
    } else if (isFullscreen) {
      handleFullscreenToggle()
    }
  }, [isDualMonitorFullscreen, isFullscreen, handleFullscreenToggle, handleDualMonitorFullscreenToggle])

  const handleSaveFile = () => {
    if (fileUrl) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = fileName
      link.target = '_blank'
      
      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileType)
  const isPdf = fileType === 'pdf'
  const isVideo = ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(fileType)
  const isAudio = ['mp3', 'wav', 'ogg', 'aac'].includes(fileType)

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1))
  }

  const handleResetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleFitToContainer = () => {
    if (imageDimensions.width > 0 && imageDimensions.height > 0) {
      const containerWidth = window.innerWidth
      const containerHeight = window.innerHeight - 120 // Account for header and footer
      
      const scaleX = containerWidth / imageDimensions.width
      const scaleY = containerHeight / imageDimensions.height
      const scale = Math.min(scaleX, scaleY, 1) // Don't zoom in beyond 100%
      
      setZoom(scale)
      setPan({ x: 0, y: 0 })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isImage) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && isImage) {
      e.preventDefault()
      e.stopPropagation()
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      
      // Calculate boundaries based on zoom level
      const containerWidth = window.innerWidth
      const containerHeight = window.innerHeight - 60 // Account for header height
      
      // Get image dimensions (you might need to adjust this based on actual image size)
      const imageWidth = 800 // Approximate, you can make this dynamic
      const imageHeight = 600 // Approximate, you can make this dynamic
      
      const scaledWidth = imageWidth * zoom
      const scaledHeight = imageHeight * zoom
      
      // Calculate boundaries
      const maxX = Math.max(0, (scaledWidth - containerWidth) / 2)
      const minX = -Math.max(0, (scaledWidth - containerWidth) / 2)
      const maxY = Math.max(0, (scaledHeight - containerHeight) / 2)
      const minY = -Math.max(0, (scaledHeight - containerHeight) / 2)
      
      setPan({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY))
      })
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isImage) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (isImage) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom(prev => Math.min(Math.max(prev * delta, 0.1), 5))
    }
  }

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const slider = e.currentTarget as HTMLElement
    
    const handleSliderMouseMove = (e: MouseEvent) => {
      const rect = slider.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newZoom = 0.1 + (percentage * (5 - 0.1))
      setZoom(newZoom)
    }

    const handleSliderMouseUp = () => {
      document.removeEventListener('mousemove', handleSliderMouseMove)
      document.removeEventListener('mouseup', handleSliderMouseUp)
    }

    document.addEventListener('mousemove', handleSliderMouseMove)
    document.addEventListener('mouseup', handleSliderMouseUp)
  }

  // Prevent default drag behavior on the entire document when dragging image
  useEffect(() => {
    const preventDefaultDrag = (e: DragEvent) => {
      if (isDragging) {
        e.preventDefault()
      }
    }

    document.addEventListener('dragstart', preventDefaultDrag)
    document.addEventListener('drag', preventDefaultDrag)

    return () => {
      document.removeEventListener('dragstart', preventDefaultDrag)
      document.removeEventListener('drag', preventDefaultDrag)
    }
  }, [isDragging])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        // In Electron, we can check if the window is fullscreen
        // For now, we'll use a simple approach and let the user toggle
        // The actual state will be managed by the main process
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable all keyboard keys when in fullscreen modes
      if (isFullscreen || isDualMonitorFullscreen) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      
      // Only allow specific keys when not in fullscreen
      if (e.key === 'F11') {
        e.preventDefault()
        handleFullscreenToggle()
      } else if (e.key === 'F10') {
        e.preventDefault()
        handleDualMonitorFullscreenToggle()
      }
    }

    // Global keyboard event listener to block all keys in fullscreen
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen || isDualMonitorFullscreen) {
        // Block ALL keyboard input including browser shortcuts
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        return false
      }
    }

    // Global keyboard event listener to block all keys in fullscreen
    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (isFullscreen || isDualMonitorFullscreen) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        return false
      }
    }

    // Global keyboard event listener to block all keys in fullscreen
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      if (isFullscreen || isDualMonitorFullscreen) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        return false
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyDown)
    
    // Add global event listeners with capture phase to intercept all keyboard events
    document.addEventListener('keydown', handleGlobalKeyDown, true)
    document.addEventListener('keyup', handleGlobalKeyUp, true)
    document.addEventListener('keypress', handleGlobalKeyPress, true)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleGlobalKeyDown, true)
      document.removeEventListener('keyup', handleGlobalKeyUp, true)
      document.removeEventListener('keypress', handleGlobalKeyPress, true)
    }
  }, [handleFullscreenToggle, handleDualMonitorFullscreenToggle, isFullscreen, isDualMonitorFullscreen])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading file...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-screen w-full ${
      isDualMonitorFullscreen 
        ? 'bg-black' 
        : 'bg-background'
    }`}
    style={{
      minHeight: '100vh',
      minWidth: '100vw'
    } as React.CSSProperties}
    >
      {/* Draggable Header */}
             <div 
         className={`flex items-center justify-between transition-all duration-300 ${
           isDualMonitorFullscreen
             ? 'p-2 bg-black/20 border-b border-white/10 cursor-default' 
             : isFullscreen 
               ? 'p-2 bg-primary/5 border-b border-primary/10 cursor-default' 
               : 'p-3 border-b border-border bg-sidebar cursor-move'
         }`}
         style={{ 
           WebkitAppRegion: (isFullscreen || isDualMonitorFullscreen) ? 'no-drag' : 'drag',
           cursor: (isFullscreen || isDualMonitorFullscreen) ? 'default' : 'move'
         } as React.CSSProperties}
         onDoubleClick={handleHeaderDoubleClick}
       >
         <div className="flex items-center gap-2 flex-1 min-w-0">
           <div className="min-w-0 flex-1">
             <h1 className={`font-semibold truncate ${
               isDualMonitorFullscreen ? 'text-sm text-white' : isFullscreen ? 'text-sm' : 'text-base'
             }`}
             style={{ cursor: 'default' }}
             >
               {fileName}
               {isDualMonitorFullscreen && (
                 <span className="ml-2 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                   ALL MONITORS
                 </span>
               )}
               {isFullscreen && !isDualMonitorFullscreen && (
                 <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                   FS
                 </span>
               )}

             </h1>
           </div>
         </div>
         {/* Close Window Button */}
         <button
           onClick={handleCloseWindow}
           className="h-6 w-6 p-0 rounded-sm transition-all duration-300 flex-shrink-0 flex items-center justify-center opacity-70 hover:opacity-100 text-muted-foreground hover:text-foreground"
           style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
           title="Close Window"
         >
           <X className="h-6 w-6" />
         </button>
       </div>

             {/* File Content */}
       <div className="flex-1 overflow-hidden">
                  {isImage ? (
                        <div 
               className={`h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none ${
                 isDualMonitorFullscreen ? 'bg-black' : 'bg-background'
               }`}
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               onWheel={handleWheel}
               style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
               draggable={false}
             >
                           <img 
                src={fileUrl} 
                alt={fileName}
                className={`select-none ${!isDragging ? 'transition-transform duration-200' : ''}`}
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
                draggable={false}
                onLoad={handleImageLoad}
               onError={(e) => {
                 const target = e.currentTarget as HTMLImageElement;
                 target.style.display = 'none';
                 const errorDiv = document.createElement('div');
                 errorDiv.className = 'text-center text-muted-foreground p-4';
                 errorDiv.innerHTML = `
                   <div class="mb-2">⚠️</div>
                   <p>Failed to load image</p>
                   <p class="text-sm">${fileName}</p>
                 `;
                 target.parentNode?.appendChild(errorDiv);
               }}
             />
           </div>
        ) : isPdf ? (
          <div className="h-full">
            <iframe 
              src={fileUrl}
              className="w-full h-full border-0"
              title={fileName}
            />
          </div>
        ) : isVideo ? (
          <div className="h-full flex items-center justify-center bg-background">
            <video 
              src={fileUrl}
              controls
              className="max-w-full max-h-full"
              onError={(e) => {
                const target = e.currentTarget as HTMLVideoElement;
                target.style.display = 'none';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'text-center text-muted-foreground p-4';
                errorDiv.innerHTML = `
                  <div class="mb-2">⚠️</div>
                  <p>Failed to load video</p>
                  <p class="text-sm">${fileName}</p>
                `;
                target.parentNode?.appendChild(errorDiv);
              }}
            />
          </div>
        ) : isAudio ? (
          <div className="h-full flex items-center justify-center bg-muted/20">
            <div className="text-center p-6">
              <div className="mb-4 text-4xl">🎵</div>
              <audio 
                src={fileUrl}
                controls
                className="mb-4"
                onError={(e) => {
                  const target = e.currentTarget as HTMLAudioElement;
                  target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'text-center text-muted-foreground';
                  errorDiv.innerHTML = `
                    <div class="mb-2">⚠️</div>
                    <p>Failed to load audio</p>
                    <p class="text-sm">${fileName}</p>
                  `;
                  target.parentNode?.appendChild(errorDiv);
                }}
              />
              <p className="text-sm text-muted-foreground">{fileName}</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-muted/20">
            <div className="text-center p-6">
              <div className="mb-4 text-4xl">📄</div>
              <p className="text-lg font-medium mb-2">{fileName}</p>
              <p className="text-sm text-muted-foreground mb-4">
                This file type cannot be previewed
              </p>
              <Button 
                onClick={() => window.open(fileUrl, '_blank')}
                variant="outline"
                size="sm"
              >
                Open in Browser
              </Button>
            </div>
          </div>
        )}
       </div>

       {/* Footer Bar */}
       <div className={`flex items-center justify-between px-6 py-3 bg-sidebar border-t border-border transition-all duration-300 ${
         (isFullscreen || isDualMonitorFullscreen) ? 'opacity-0 pointer-events-none' : 'opacity-100'
       }`}>
                    {/* Left side - File info and actions */}
           <div className="flex items-center gap-4">
            <IconPhoto className="h-5 w-5 text-muted-foreground" />
            {isImage && (
              <>
                <span className="text-xs text-muted-foreground">
                  {imageDimensions.width > 0 ? `${imageDimensions.width} x ${imageDimensions.height}` : ''}
                </span>
              </>
            )}
          </div>

         {/* Right side - Zoom controls */}
         <div className="flex items-center gap-3">
           <div className="flex items-center gap-1">
             <div className="flex items-center gap-1 bg-muted/50 rounded px-3 py-1.5">
               <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
             </div>
           </div>
           <IconZoomOut 
             className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" 
             onClick={handleZoomOut}
           />
           <div 
             className="w-20 h-1.5 bg-muted rounded-full relative cursor-pointer"
             onMouseDown={handleSliderMouseDown}
           >
             <div 
               className="absolute top-0 left-0 h-full bg-teal-500 rounded-full"
               style={{ width: `${(zoom - 0.1) / (5 - 0.1) * 100}%` }}
             ></div>
             <div 
               className="absolute top-1/2 w-3.5 h-3.5 bg-teal-500 rounded-full transform -translate-y-1/2 cursor-pointer hover:bg-teal-400 transition-colors"
               style={{ left: `calc(${(zoom - 0.1) / (5 - 0.1) * 100}% - 7px)` }}
             ></div>
           </div>
           <IconZoomIn 
             className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" 
             onClick={handleZoomIn}
           />
           <div className="w-px h-4 bg-border mx-2"></div>
           <IconArrowsMaximize 
             className={`h-5 w-5 transition-colors ${
               !hasMultipleMonitors 
                 ? 'text-muted-foreground/50 cursor-not-allowed' 
                 : isDualMonitorFullscreen
                   ? 'text-white hover:text-white/80 cursor-pointer' 
                   : isFullscreen 
                     ? 'text-primary hover:text-primary/80 cursor-pointer' 
                     : 'text-muted-foreground hover:text-primary cursor-pointer'
             }`}
             onClick={hasMultipleMonitors ? handleDualMonitorFullscreenToggle : undefined}
             title={!hasMultipleMonitors 
               ? "Dual monitor fullscreen requires multiple monitors" 
               : isDualMonitorFullscreen 
                 ? "Exit Dual Monitor Fullscreen (F10)" 
                 : "Enter Dual Monitor Fullscreen (F10)"
             }
             style={{ 
               cursor: hasMultipleMonitors ? 'pointer' : 'not-allowed',
               transform: (isFullscreen || isDualMonitorFullscreen) ? 'rotate(180deg)' : 'rotate(0deg)',
               transition: 'transform 0.3s ease'
             }}
           />
           <div className="w-px h-4 bg-border mx-2"></div>
           <IconArrowsMaximize 
             className={`h-5 w-5 cursor-pointer transition-colors ${
               isFullscreen 
                 ? 'text-primary hover:text-primary/80' 
                 : 'text-muted-foreground hover:text-primary'
             }`}
             onClick={handleFullscreenToggle}
             title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
             style={{ 
               cursor: 'pointer',
               transform: isFullscreen ? 'rotate(180deg)' : 'rotate(0deg)',
               transition: 'transform 0.3s ease'
             }}
           />
         </div>
       </div>
     </div>
   )
} 