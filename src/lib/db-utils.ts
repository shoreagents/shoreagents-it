import { query } from './database'

export type TicketCategory = 'Computer & Equipment' | 'Station' | 'Surroundings' | 'Schedule' | 'Compensation' | 'Transport' | 'Suggestion' | 'Check-in'
export type TicketStatus = 'For Approval' | 'On Hold' | 'In Progress' | 'Approved' | 'Completed'

export interface Ticket {
  id: number
  ticket_id: string
  user_id: number
  concern: string
  details: string | null
  category: TicketCategory
  status: TicketStatus
  position: number
  resolved_by: number | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  profile_picture: string | null
  first_name: string | null
  last_name: string | null
}

// Get all tickets
export async function getAllTickets(): Promise<Ticket[]> {
  const result = await query(`
    SELECT t.*, pi.profile_picture, pi.first_name, pi.last_name
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    ORDER BY t.status, t.position ASC, t.created_at DESC
  `)
  return result.rows
}

// Get tickets by status
export async function getTicketsByStatus(status: string): Promise<Ticket[]> {
  const result = await query(`
    SELECT t.*, pi.profile_picture, pi.first_name, pi.last_name
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    WHERE t.status = $1 
    ORDER BY t.position ASC, t.created_at DESC
  `, [status])
  return result.rows
}

// Create new ticket
export async function createTicket(ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'resolved_by' | 'resolved_at'>): Promise<Ticket> {
  const result = await query(
    'INSERT INTO public.tickets (ticket_id, user_id, concern, details, category, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [ticket.ticket_id, ticket.user_id, ticket.concern, ticket.details, ticket.category, ticket.status]
  )
  return result.rows[0]
}

// Update ticket status
export async function updateTicketStatus(id: number, status: string): Promise<Ticket> {
  try {
    let result
    if (status === 'Completed') {
      // When marking as completed, set resolved_at timestamp
      result = await query(
        'UPDATE public.tickets SET status = $1, resolved_at = (now() AT TIME ZONE \'Asia/Manila\'::text) WHERE id = $2 RETURNING *',
        [status, id]
      )
    } else {
      // For other status changes, clear resolved_at and resolved_by fields
      result = await query(
        'UPDATE public.tickets SET status = $1, resolved_at = NULL, resolved_by = NULL WHERE id = $2 RETURNING *',
        [status, id]
      )
    }
    return result.rows[0]
  } catch (error) {
    console.error('Database update failed:', error)
    throw error
  }
}

// Update ticket
export async function updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket> {
  const fields = Object.keys(updates).filter(key => 
    key !== 'id' && 
    key !== 'created_at' && 
    key !== 'updated_at' && 
    key !== 'ticket_id'
  )
  const values = Object.values(updates).filter((_, index) => 
    fields[index] !== 'id' && 
    fields[index] !== 'created_at' && 
    fields[index] !== 'updated_at' && 
    fields[index] !== 'ticket_id'
  )
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
  const result = await query(
    `UPDATE public.tickets SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  )
  return result.rows[0]
}

// Delete ticket
export async function deleteTicket(id: number): Promise<void> {
  await query('DELETE FROM public.tickets WHERE id = $1', [id])
}

// Get ticket by ID
export async function getTicketById(id: number): Promise<Ticket | null> {
  const result = await query(`
    SELECT t.*, pi.profile_picture, pi.first_name, pi.last_name
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    WHERE t.id = $1
  `, [id])
  return result.rows[0] || null
}

// Get ticket by ticket_id
export async function getTicketByTicketId(ticketId: string): Promise<Ticket | null> {
  const result = await query(`
    SELECT t.*, pi.profile_picture, pi.first_name, pi.last_name
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    WHERE t.ticket_id = $1
  `, [ticketId])
  return result.rows[0] || null
}

// Search tickets
export async function searchTickets(searchTerm: string): Promise<Ticket[]> {
  const result = await query(`
    SELECT t.*, pi.profile_picture, pi.first_name, pi.last_name
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    WHERE t.concern ILIKE $1 OR t.details ILIKE $1 OR t.ticket_id ILIKE $1 
    ORDER BY t.created_at DESC
  `, [`%${searchTerm}%`])
  return result.rows
}

// Resolve ticket
export async function resolveTicket(id: number, resolvedBy: number): Promise<Ticket> {
  const result = await query(
    'UPDATE public.tickets SET status = $1, resolved_by = $2, resolved_at = (now() AT TIME ZONE \'Asia/Manila\'::text) WHERE id = $3 RETURNING *',
    ['Completed', resolvedBy, id]
  )
  return result.rows[0]
}

// Get tickets by user
export async function getTicketsByUser(userId: number): Promise<Ticket[]> {
  const result = await query('SELECT * FROM public.tickets WHERE user_id = $1 ORDER BY created_at DESC', [userId])
  return result.rows
}

// Generate unique ticket ID
export async function generateTicketId(): Promise<string> {
  const result = await query('SELECT COUNT(*) as count FROM public.tickets')
  const count = parseInt(result.rows[0].count) + 1
  return `TKT-${count.toString().padStart(6, '0')}`
}

// Update ticket position (for reordering within same status)
export async function updateTicketPosition(id: number, position: number): Promise<Ticket> {
  try {
    const result = await query(
      'UPDATE public.tickets SET position = $1 WHERE id = $2 RETURNING *',
      [position, id]
    )
    return result.rows[0]
  } catch (error) {
    console.error('Database position update failed:', error)
    throw error
  }
}

// Update ticket positions for reordering within same status
export async function updateTicketPositions(tickets: { id: number, position: number }[]): Promise<void> {
  try {
    for (const ticket of tickets) {
      await query(
        'UPDATE public.tickets SET position = $1 WHERE id = $2',
        [ticket.position, ticket.id]
      )
    }
  } catch (error) {
    console.error('Database positions update failed:', error)
    throw error
  }
}