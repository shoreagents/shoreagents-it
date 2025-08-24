import { Pool, Client } from 'pg'
import { WebSocketServer } from 'ws'
import { NextApiRequest } from 'next'
import { NextApiResponse } from 'next'

// Create a separate client for listening to notifications
const notificationClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

let wss: WebSocketServer | null = null
let isListening = false

// Initialize WebSocket server
export function initializeWebSocketServer(server: any) {
  if (wss) return wss

  wss = new WebSocketServer({ server })
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket')
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket')
    })
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  })
  
  return wss
}

// Start listening to PostgreSQL notifications
export async function startListening() {
  if (isListening) return
  
  try {
    await notificationClient.connect()
    console.log('Connected to PostgreSQL for notifications')
    
    // Listen for ticket changes
    await notificationClient.query('LISTEN ticket_changes')
    
    // Listen for applicant changes
    await notificationClient.query('LISTEN applicant_changes')
    
    // Listen for member changes
    await notificationClient.query('LISTEN member_changes')
    
    // Listen for member comment changes
    await notificationClient.query('LISTEN member_comment_changes')
    
    notificationClient.on('notification', (msg: any) => {
      try {
        const payload = JSON.parse(msg.payload)
        console.log('Received notification:', payload)
        
        // Determine message type based on channel
        let messageType = 'ticket_update'
        if (msg.channel === 'applicant_changes') {
          messageType = 'applicant_update'
        } else if (msg.channel === 'member_changes') {
          messageType = 'member_update'
        } else if (msg.channel === 'member_comment_changes') {
          messageType = 'member_comment_update'
        }
        
        // Broadcast to all connected WebSocket clients
        if (wss) {
          wss.clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
              client.send(JSON.stringify({
                type: messageType,
                data: payload
              }))
            }
          })
        }
      } catch (error) {
        console.error('Error parsing notification:', error)
      }
    })
    
    isListening = true
    console.log('Started listening for PostgreSQL notifications (tickets & applicants)')
  } catch (error) {
    console.error('Error starting notification listener:', error)
  }
}

// Stop listening to notifications
export async function stopListening() {
  try {
    await notificationClient.query('UNLISTEN ticket_changes')
    await notificationClient.query('UNLISTEN applicant_changes')
    await notificationClient.query('UNLISTEN member_changes')
    await notificationClient.query('UNLISTEN member_comment_changes')
    await notificationClient.end()
    isListening = false
    console.log('Stopped listening for PostgreSQL notifications (tickets, applicants, members & comments)')
  } catch (error) {
    console.error('Error stopping notification listener:', error)
  }
}

// Get WebSocket server instance
export function getWebSocketServer() {
  return wss
}

// Check if listening
export function isListeningToNotifications() {
  return isListening
}

// Comment utility functions
export async function getMemberComments(memberId: number) {
  try {
    const result = await notificationClient.query(
      'SELECT * FROM get_member_comments($1)',
      [memberId]
    )
    return result.rows
  } catch (error) {
    console.error('Failed to get member comments:', error)
    throw error
  }
}

export async function addMemberComment(memberId: number, userId: number, comment: string) {
  try {
    const result = await notificationClient.query(
      'SELECT add_member_comment($1, $2, $3)',
      [memberId, userId, comment]
    )
    return result.rows[0].add_member_comment
  } catch (error) {
    console.error('Failed to add member comment:', error)
    throw error
  }
}

export async function deleteMemberComment(commentId: number, userId: number) {
  try {
    const result = await notificationClient.query(
      'SELECT delete_member_comment($1, $2)',
      [commentId, userId]
    )
    return result.rows[0].delete_member_comment
  } catch (error) {
    console.error('Failed to delete member comment:', error)
    throw error
  }
}

export async function getMemberCommentCount(memberId: number) {
  try {
    const result = await notificationClient.query(
      'SELECT get_member_comment_count($1)',
      [memberId]
    )
    return result.rows[0].get_member_comment_count
  } catch (error) {
    console.error('Failed to get member comment count:', error)
    throw error
  }
} 