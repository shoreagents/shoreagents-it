const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')
const { Pool, Client } = require('pg')
const path = require('path')

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3002

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// PostgreSQL notification client
const notificationClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

let wss = null
let isListening = false

// Start listening to PostgreSQL notifications
async function startListening() {
  if (isListening) return
  
  try {
    await notificationClient.connect()
    console.log('Connected to PostgreSQL for notifications')
    
    // Listen for ticket changes
    await notificationClient.query('LISTEN ticket_changes')
    
    // Listen for applicant changes
    await notificationClient.query('LISTEN applicant_changes')
    
    // Listen for member/company changes
    await notificationClient.query('LISTEN member_changes')
    
    // Listen for member comment changes
    await notificationClient.query('LISTEN member_comment_changes')
    
    // Listen for member activity changes
    await notificationClient.query('LISTEN member_activity_changes')
    
    // Listen for agent member changes
    await notificationClient.query('LISTEN agent_assignment_changes')
    
    // Listen for client member changes
    await notificationClient.query('LISTEN client_assignment_changes')
    
    notificationClient.on('notification', (msg) => {
      try {
        const payload = JSON.parse(msg.payload)
        console.log('Received notification:', payload)
        
        // Determine message type based on channel
        let messageType = 'ticket_update'
        if (msg.channel === 'applicant_changes') {
          messageType = 'applicant_update'
        } else if (msg.channel === 'member_changes') {
          messageType = 'member_update'
        } else if (msg.channel === 'member_detail_changes') {
          messageType = 'member_update'
        } else if (msg.channel === 'member_comment_changes') {
          messageType = 'member_comment_update' // Separate message type for comments
        } else if (msg.channel === 'member_activity_changes') {
          messageType = 'member_activity_update' // Separate message type for activity logs
        } else if (msg.channel === 'agent_assignment_changes') {
          messageType = 'agent_update'
        } else if (msg.channel === 'client_assignment_changes') {
          messageType = 'client_update'
        }
        
        // Broadcast to all connected WebSocket clients
        if (wss) {
          const message = JSON.stringify({
            type: messageType,
            data: payload
          })
          console.log('Broadcasting WebSocket message:', message)
          console.log('Message type:', messageType)
          console.log('Channel:', msg.channel)
          console.log('Connected clients:', wss.clients.size)
          
          wss.clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
              client.send(message)
            }
          })
        }
      } catch (error) {
        console.error('Error parsing notification:', error)
      }
    })
    
    isListening = true
    console.log('Started listening for PostgreSQL notifications (tickets, applicants, members, member comments, member activities, agents & clients)')
  } catch (error) {
    console.error('Error starting notification listener:', error)
  }
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // Handle API routes and other Next.js routes
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize WebSocket server with path
  wss = new WebSocketServer({ 
    server,
    path: '/ws'
  })
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket')
    
    // Send a ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.ping()
      }
    }, 30000)
    
    ws.on('pong', () => {
      // Client responded to ping
    })
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket')
      clearInterval(pingInterval)
    })
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      clearInterval(pingInterval)
    })
  })

  // Start listening to PostgreSQL notifications
  startListening()

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
}) 