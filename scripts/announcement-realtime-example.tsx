// Example usage of useRealtimeAnnouncements hook
// This shows how to integrate announcement realtime functionality into components

import React, { useState, useEffect } from 'react'
import { useRealtimeAnnouncements } from '@/hooks/use-realtime-announcements'

export function AnnouncementRealtimeExample() {
  const [announcements, setAnnouncements] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  const { isConnected, error } = useRealtimeAnnouncements({
    onAnnouncementSent: (announcement) => {
      console.log('📢 New announcement sent:', announcement)
      setAnnouncements(prev => [...prev, announcement])
    },
    onAnnouncementExpired: (announcement) => {
      console.log('⏰ Announcement expired:', announcement)
      setAnnouncements(prev => 
        prev.filter(ann => ann.announcement_id !== announcement.announcement_id)
      )
    },
    onAnnouncementUpdated: (announcement, oldAnnouncement) => {
      console.log('🔄 Announcement updated:', announcement)
      setAnnouncements(prev => 
        prev.map(ann => 
          ann.announcement_id === announcement.announcement_id ? announcement : ann
        )
      )
    },
    enableNotifications: true // Enable desktop notifications
  })

  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected')
  }, [isConnected])

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Announcement Realtime Demo</h2>
      
      <div className="mb-4">
        <span className={`px-2 py-1 rounded text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          Status: {connectionStatus}
        </span>
        {error && (
          <span className="ml-2 px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
            Error: {error}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Active Announcements:</h3>
        {announcements.length === 0 ? (
          <p className="text-gray-500">No active announcements</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.announcement_id} className="p-3 border rounded">
              <h4 className="font-medium">{announcement.title}</h4>
              <p className="text-sm text-gray-600">{announcement.message}</p>
              <div className="flex justify-between items-center mt-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  announcement.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  announcement.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {announcement.priority}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(announcement.sent_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AnnouncementRealtimeExample
