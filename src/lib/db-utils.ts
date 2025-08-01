import { query } from './database'

export type TicketStatus = 'For Approval' | 'On Hold' | 'In Progress' | 'Approved' | 'Stuck' | 'Actioned' | 'Closed'

export interface TicketCategory {
  id: number
  name: string
}

export interface Ticket {
  id: number
  ticket_id: string
  user_id: number
  concern: string
  details: string | null
  category: string
  category_id: number | null
  status: TicketStatus
  position: number
  resolved_by: number | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  sector: string
  station_id: string | null
  profile_picture: string | null
  first_name: string | null
  last_name: string | null
}

// Get all tickets
export async function getAllTickets(): Promise<Ticket[]> {
  const result = await query(`
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, 
           pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    ORDER BY t.status, t.position ASC, t.created_at DESC
  `)
  return result.rows
}

// Get tickets by status
export async function getTicketsByStatus(status: string, past: boolean = false): Promise<Ticket[]> {
  if (status === 'Closed') {
    if (past) {
      // Return closed tickets from past dates (not today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = await query(`
        SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at,
               pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name
        FROM public.tickets t
        LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
        LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
        LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
        WHERE t.status = $1
          AND (
            (t.resolved_at < $2)
            OR (t.resolved_at IS NULL AND t.created_at < $2)
          )
        ORDER BY t.position ASC, t.created_at DESC
      `, [status, today.toISOString()]);
      return result.rows;
    } else {
      // Only return tickets resolved today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const result = await query(`
        SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at,
               pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name
        FROM public.tickets t
        LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
        LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
        LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
        WHERE t.status = $1
          AND (
            (t.resolved_at >= $2 AND t.resolved_at < $3)
            OR (t.resolved_at IS NULL AND t.created_at >= $2 AND t.created_at < $3)
          )
        ORDER BY t.position ASC, t.created_at DESC
      `, [status, today.toISOString(), tomorrow.toISOString()]);
      return result.rows;
    }
  } else {
    const result = await query(`
      SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at,
             pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name
      FROM public.tickets t
      LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
      LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
      LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
      WHERE t.status = $1
      ORDER BY t.position ASC, t.created_at DESC
    `, [status]);
    return result.rows;
  }
}

// Create new ticket
export async function createTicket(ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'resolved_by' | 'resolved_at'>): Promise<Ticket> {
  const result = await query(
    'INSERT INTO public.tickets (ticket_id, user_id, concern, details, category, category_id, status, sector) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [ticket.ticket_id, ticket.user_id, ticket.concern, ticket.details, ticket.category, ticket.category_id, ticket.status, ticket.sector || 'General']
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
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
           pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    WHERE t.id = $1
  `, [id])
  return result.rows[0] || null
}

// Get ticket by ticket_id
export async function getTicketByTicketId(ticketId: string): Promise<Ticket | null> {
  const result = await query(`
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
           pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    WHERE t.ticket_id = $1
  `, [ticketId])
  return result.rows[0] || null
}

// Search tickets
export async function searchTickets(searchTerm: string): Promise<Ticket[]> {
  const result = await query(`
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at,
           pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
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

// Generate unique ticket ID using existing database sequence
export async function generateTicketId(): Promise<string> {
  const result = await query('SELECT nextval(\'ticket_id_seq\') as next_id')
  const nextId = result.rows[0].next_id
  return `TKT-${nextId.toString().padStart(6, '0')}`
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

// Get user's assigned station
export async function getUserStation(userId: number): Promise<string | null> {
  const result = await query(`
    SELECT station_id
    FROM public.stations
    WHERE assigned_user_id = $1
  `, [userId])
  return result.rows[0]?.station_id || null
}

// Assign user to station
export async function assignUserToStation(userId: number, stationId: string): Promise<void> {
  // First, remove any existing assignment for this user
  await query(`
    UPDATE public.stations
    SET assigned_user_id = NULL
    WHERE assigned_user_id = $1
  `, [userId])
  
  // Then assign to the new station
  await query(`
    UPDATE public.stations
    SET assigned_user_id = $1
    WHERE station_id = $2
  `, [userId, stationId])
}

// Get all stations
export async function getAllStations(): Promise<{ id: number, station_id: string, assigned_user_id: number | null }[]> {
  const result = await query(`
    SELECT id, station_id, assigned_user_id
    FROM public.stations
    ORDER BY station_id
  `)
  return result.rows
}

// Get all ticket categories
export async function getAllTicketCategories(): Promise<TicketCategory[]> {
  const result = await query(`
    SELECT id, name
    FROM public.ticket_categories
    ORDER BY name
  `)
  return result.rows
}

// Get ticket category by ID
export async function getTicketCategoryById(id: number): Promise<TicketCategory | null> {
  const result = await query(`
    SELECT id, name
    FROM public.ticket_categories
    WHERE id = $1
  `, [id])
  return result.rows[0] || null
}

// Create ticket category
export async function createTicketCategory(name: string): Promise<TicketCategory> {
  const result = await query(`
    INSERT INTO public.ticket_categories (name)
    VALUES ($1)
    RETURNING id, name
  `, [name])
  return result.rows[0]
}

// Update ticket category
export async function updateTicketCategory(id: number, name: string): Promise<TicketCategory> {
  const result = await query(`
    UPDATE public.ticket_categories
    SET name = $1
    WHERE id = $2
    RETURNING id, name
  `, [name, id])
  return result.rows[0]
}

// Delete ticket category
export async function deleteTicketCategory(id: number): Promise<void> {
  await query(`
    DELETE FROM public.ticket_categories
    WHERE id = $1
  `, [id])
}