import pool from './database'

export type TicketStatus = 'On Hold' | 'In Progress' | 'Approved' | 'Stuck' | 'Actioned' | 'Closed'

export interface TicketCategory {
  id: number
  name: string
}

export interface Role {
  id: number
  name: string
  description: string | null
}

export interface AgentRecord {
  user_id: number
  email: string
  user_type: string
  first_name: string | null
  last_name: string | null
  profile_picture: string | null
  phone: string | null
  employee_id: string | null
  job_title: string | null
  work_email: string | null
  start_date: string | null
  exit_date: string | null
  exp_points: number
  member_id: number | null
  member_company: string | null
  member_badge_color: string | null
  department_id: number | null
  department_name: string | null
  station_id: string | null
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
  role_id: number | null
  station_id: string | null
  profile_picture: string | null
  first_name: string | null
  last_name: string | null
  employee_id: string | null
  resolver_first_name?: string | null
  resolver_last_name?: string | null
  user_type?: string | null
  member_name?: string | null
  member_color?: string | null
  supporting_files?: string[]
  file_count?: number
}

// Get all tickets (filtered by IT role, excluding For Approval)
export async function getAllTickets(): Promise<Ticket[]> {
  const result = await pool.query(`
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
           t.role_id, pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name,
           ji.employee_id,
           resolver_pi.first_name as resolver_first_name, resolver_pi.last_name as resolver_last_name,
           u.user_type,
           t.supporting_files, t.file_count,
           CASE 
             WHEN u.user_type = 'Internal' THEN 'Internal'
             WHEN a.member_id IS NOT NULL THEN m.company
             WHEN c.member_id IS NOT NULL THEN m.company
             ELSE NULL
           END as member_name,
           CASE 
             WHEN u.user_type = 'Internal' THEN NULL
             WHEN a.member_id IS NOT NULL THEN m.badge_color
             WHEN c.member_id IS NOT NULL THEN m.badge_color
             ELSE NULL
           END as member_color
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
    LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
    LEFT JOIN public.users u ON t.user_id = u.id
    LEFT JOIN public.agents a ON t.user_id = a.user_id
    LEFT JOIN public.clients c ON t.user_id = c.user_id
    LEFT JOIN public.members m ON (a.member_id = m.id) OR (c.member_id = m.id)
    WHERE t.role_id = 1 AND (t.status != 'Closed' OR t.resolved_at >= NOW() - INTERVAL '7 days')
    ORDER BY t.status, t.position ASC, t.created_at DESC
  `)
  return result.rows
}

// Get all tickets for Admin (no role filter, includes 'For Approval')
export async function getAllTicketsAdmin(): Promise<Ticket[]> {
  const result = await pool.query(`
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
           t.role_id, pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name,
           ji.employee_id,
           resolver_pi.first_name as resolver_first_name, resolver_pi.last_name as resolver_last_name,
           u.user_type,
           t.supporting_files, t.file_count,
           CASE 
             WHEN u.user_type = 'Internal' THEN 'Internal'
             WHEN a.member_id IS NOT NULL THEN m.company
             WHEN c.member_id IS NOT NULL THEN m.company
             ELSE NULL
           END as member_name,
           CASE 
             WHEN u.user_type = 'Internal' THEN NULL
             WHEN a.member_id IS NOT NULL THEN m.badge_color
             WHEN c.member_id IS NOT NULL THEN m.badge_color
             ELSE NULL
           END as member_color
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
    LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
    LEFT JOIN public.users u ON t.user_id = u.id
    LEFT JOIN public.agents a ON t.user_id = a.user_id
    LEFT JOIN public.clients c ON t.user_id = c.user_id
    LEFT JOIN public.members m ON (a.member_id = m.id) OR (c.member_id = m.id)
    WHERE (t.status != 'Closed' OR t.resolved_at >= NOW() - INTERVAL '7 days')
    ORDER BY t.status, t.position ASC, t.created_at DESC
  `)
  return result.rows
}

// Get tickets by status (filtered by IT role)
export async function getTicketsByStatus(status: string, past: boolean = false): Promise<Ticket[]> {
  let whereConditions = ['t.status = $1', 't.role_id = 1']
  let queryParams = [status]
  let paramIndex = 2
  
  // Add 7-day filter for closed/completed tickets based on resolved_at
  if (status === 'Closed' || status === 'Completed') {
    whereConditions.push(`t.resolved_at >= NOW() - INTERVAL '7 days'`)
  }
  
  const whereClause = whereConditions.join(' AND ')
  
  console.log('getTicketsByStatus: Status:', status, 'Where clause:', whereClause, 'Params:', queryParams)
  
  const result = await pool.query(`
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
           t.role_id, pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name,
           ji.employee_id,
           resolver_pi.first_name as resolver_first_name, resolver_pi.last_name as resolver_last_name,
           u.user_type,
           t.supporting_files, t.file_count,
           CASE 
             WHEN u.user_type = 'Internal' THEN 'Internal'
             WHEN a.member_id IS NOT NULL THEN m.company
             WHEN c.member_id IS NOT NULL THEN m.company
             ELSE NULL
           END as member_name,
           CASE 
             WHEN u.user_type = 'Internal' THEN NULL
             WHEN a.member_id IS NOT NULL THEN m.badge_color
             WHEN c.member_id IS NOT NULL THEN m.badge_color
             ELSE NULL
           END as member_color
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
    LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
    LEFT JOIN public.users u ON t.user_id = u.id
    LEFT JOIN public.agents a ON t.user_id = a.user_id
    LEFT JOIN public.clients c ON t.user_id = c.user_id
    LEFT JOIN public.members m ON (a.member_id = m.id) OR (c.member_id = m.id)
    WHERE ${whereClause}
    ORDER BY t.position ASC, t.created_at DESC
  `, queryParams)
  
  console.log('getTicketsByStatus: Query result rows:', result.rows.length)
  return result.rows
}

// Get tickets by status for Admin (no role filter, includes 'For Approval')
export async function getTicketsByStatusAdmin(status: string): Promise<Ticket[]> {
  let whereConditions = ['t.status = $1']
  let queryParams = [status]
  
  // Add 7-day filter for closed/completed tickets based on resolved_at
  if (status === 'Closed' || status === 'Completed') {
    whereConditions.push(`t.resolved_at >= NOW() - INTERVAL '7 days'`)
  }
  
  const whereClause = whereConditions.join(' AND ')
  
  const result = await pool.query(`
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
           t.role_id, pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name,
           ji.employee_id,
           resolver_pi.first_name as resolver_first_name, resolver_pi.last_name as resolver_last_name,
           u.user_type,
           t.supporting_files, t.file_count,
           CASE 
             WHEN u.user_type = 'Internal' THEN 'Internal'
             WHEN a.member_id IS NOT NULL THEN m.company
             WHEN c.member_id IS NOT NULL THEN m.company
             ELSE NULL
           END as member_name,
           CASE 
             WHEN u.user_type = 'Internal' THEN NULL
             WHEN a.member_id IS NOT NULL THEN m.badge_color
             WHEN c.member_id IS NOT NULL THEN m.badge_color
             ELSE NULL
           END as member_color
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
    LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
    LEFT JOIN public.users u ON t.user_id = u.id
    LEFT JOIN public.agents a ON t.user_id = a.user_id
    LEFT JOIN public.clients c ON t.user_id = c.user_id
    LEFT JOIN public.members m ON (a.member_id = m.id) OR (c.member_id = m.id)
    WHERE ${whereClause}
    ORDER BY t.position ASC, t.created_at DESC
  `, queryParams)
  
  console.log('getTicketsByStatusAdmin: Query result rows:', result.rows.length)
  return result.rows
}

// Roles
export async function getAllRoles(): Promise<Role[]> {
  const result = await pool.query(`
    SELECT id, name, description
    FROM public.roles
    ORDER BY name
  `)
  return result.rows
}

export async function ensureInternalUser(userId: number): Promise<void> {
  await pool.query(
    `INSERT INTO public.internal (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  )
}

export async function assignRoleToInternalUser(userId: number, roleId: number): Promise<void> {
  // Ensure internal record exists
  await ensureInternalUser(userId)
  // Assign role (idempotent)
  await pool.query(
    `INSERT INTO public.internal_roles (internal_user_id, role_id)
     VALUES ($1, $2)
     ON CONFLICT (internal_user_id, role_id) DO NOTHING`,
    [userId, roleId]
  )
}

// Create new ticket
export async function createTicket(ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'resolved_by' | 'resolved_at'>): Promise<Ticket> {
  const result = await pool.query(
    'INSERT INTO public.tickets (ticket_id, user_id, concern, details, category_id, status, role_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [ticket.ticket_id, ticket.user_id, ticket.concern, ticket.details, ticket.category_id, ticket.status, 1] // role_id = 1 for IT
  )
  return result.rows[0]
}

// Update ticket status
export async function updateTicketStatus(id: number, status: string, resolvedBy?: number): Promise<Ticket> {
  try {
    // First perform the update
    if (status === 'Completed' || status === 'Closed') {
      // When marking as completed or closed, set resolved_at timestamp and resolved_by
      if (resolvedBy) {
        await pool.query(
          'UPDATE public.tickets SET status = $1, resolved_at = NOW(), resolved_by = $3 WHERE id = $2',
          [status, id, resolvedBy]
        )
      } else {
        await pool.query(
          'UPDATE public.tickets SET status = $1, resolved_at = NOW() WHERE id = $2',
          [status, id]
        )
      }
    } else {
      // For other status changes, clear resolved_at and resolved_by fields
      await pool.query(
        'UPDATE public.tickets SET status = $1, resolved_at = NULL, resolved_by = NULL WHERE id = $2',
        [status, id]
      )
    }
    
    // Then fetch the complete ticket data with all JOINs
    const result = await pool.query(`
      SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
             t.role_id, pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name,
             ji.employee_id,
             resolver_pi.first_name as resolver_first_name, resolver_pi.last_name as resolver_last_name,
             u.user_type,
             t.supporting_files, t.file_count,
             CASE 
               WHEN u.user_type = 'Internal' THEN 'Internal'
               WHEN a.member_id IS NOT NULL THEN m.company
               WHEN c.member_id IS NOT NULL THEN m.company
               ELSE NULL
             END as member_name,
             CASE 
               WHEN u.user_type = 'Internal' THEN NULL
               WHEN a.member_id IS NOT NULL THEN m.badge_color
               WHEN c.member_id IS NOT NULL THEN m.badge_color
               ELSE NULL
             END as member_color
      FROM public.tickets t
      LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
      LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
      LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
      LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
      LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
      LEFT JOIN public.users u ON t.user_id = u.id
      LEFT JOIN public.agents a ON t.user_id = a.user_id
      LEFT JOIN public.clients c ON t.user_id = c.user_id
      LEFT JOIN public.members m ON (a.member_id = m.id) OR (c.member_id = m.id)
      WHERE t.id = $1
    `, [id])
    
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
  
  if (fields.length === 0) {
    // No valid fields to update, just return the current ticket
    return await getTicketById(id) as Ticket
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
  
  // First perform the update
  await pool.query(
    `UPDATE public.tickets SET ${setClause} WHERE id = $1`,
    [id, ...values]
  )
  
  // Then fetch the complete ticket data with all JOINs
  const result = await pool.query(`
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
           t.role_id, pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name,
           ji.employee_id,
           resolver_pi.first_name as resolver_first_name, resolver_pi.last_name as resolver_last_name,
           u.user_type,
           t.supporting_files, t.file_count,
           CASE 
             WHEN u.user_type = 'Internal' THEN 'Internal'
             WHEN a.member_id IS NOT NULL THEN m.company
             WHEN c.member_id IS NOT NULL THEN m.company
             ELSE NULL
           END as member_name,
           CASE 
             WHEN u.user_type = 'Internal' THEN NULL
             WHEN a.member_id IS NOT NULL THEN m.badge_color
             WHEN c.member_id IS NOT NULL THEN m.badge_color
             ELSE NULL
           END as member_color
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
    LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
    LEFT JOIN public.users u ON t.user_id = u.id
    LEFT JOIN public.agents a ON t.user_id = a.user_id
    LEFT JOIN public.clients c ON t.user_id = c.user_id
    LEFT JOIN public.members m ON (a.member_id = m.id) OR (c.member_id = m.id)
    WHERE t.id = $1
  `, [id])
  
  return result.rows[0]
}

// Delete ticket
export async function deleteTicket(id: number): Promise<void> {
  await pool.query('DELETE FROM public.tickets WHERE id = $1', [id])
}


// Get ticket by ID
export async function getTicketById(id: number): Promise<Ticket | null> {
  const result = await pool.query(`
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
           t.role_id, pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name,
           ji.employee_id,
           resolver_pi.first_name as resolver_first_name, resolver_pi.last_name as resolver_last_name,
           t.supporting_files, t.file_count,
           u.user_type,
           CASE 
             WHEN u.user_type = 'Internal' THEN 'Internal'
             WHEN a.member_id IS NOT NULL THEN m.company
             WHEN c.member_id IS NOT NULL THEN m.company
             ELSE NULL
           END as member_name,
           CASE 
             WHEN u.user_type = 'Internal' THEN NULL
             WHEN a.member_id IS NOT NULL THEN m.badge_color
             WHEN c.member_id IS NOT NULL THEN m.badge_color
             ELSE NULL
           END as member_color
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
    LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
    LEFT JOIN public.users u ON t.user_id = u.id
    LEFT JOIN public.agents a ON t.user_id = a.user_id
    LEFT JOIN public.clients c ON t.user_id = c.user_id
    LEFT JOIN public.members m ON (a.member_id = m.id) OR (c.member_id = m.id)
    WHERE t.id = $1 AND t.role_id = 1
  `, [id])
  return result.rows[0] || null
}

// Get ticket by ticket_id
export async function getTicketByTicketId(ticketId: string): Promise<Ticket | null> {
  const result = await pool.query(`
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
           t.role_id, pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name,
           ji.employee_id,
           resolver_pi.first_name as resolver_first_name, resolver_pi.last_name as resolver_last_name,
           t.supporting_files, t.file_count
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
    LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
    WHERE t.ticket_id = $1 AND t.role_id = 1
  `, [ticketId])
  return result.rows[0] || null
}

// Search tickets
export async function searchTickets(searchTerm: string): Promise<Ticket[]> {
  const result = await pool.query(`
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
           t.role_id, pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name,
           ji.employee_id,
           resolver_pi.first_name as resolver_first_name, resolver_pi.last_name as resolver_last_name
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
    LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
    WHERE (t.concern ILIKE $1 OR t.details ILIKE $1 OR t.ticket_id ILIKE $1) AND t.role_id = 1 AND t.status != 'For Approval' AND (t.status != 'Closed' OR t.resolved_at >= NOW() - INTERVAL '7 days')
    ORDER BY t.created_at DESC
  `, [`%${searchTerm}%`])
  return result.rows
}

// Resolve ticket
export async function resolveTicket(id: number, resolvedBy: number): Promise<Ticket> {
  const result = await pool.query(
    'UPDATE public.tickets SET status = $1, resolved_by = $2, resolved_at = (NOW() AT TIME ZONE \'Asia/Manila\') WHERE id = $3 RETURNING *',
    ['Completed', resolvedBy, id]
  )
  return result.rows[0]
}

// Get tickets by user
export async function getTicketsByUser(userId: number): Promise<Ticket[]> {
  const result = await pool.query(`
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
           t.role_id, pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name,
           ji.employee_id,
           resolver_pi.first_name as resolver_first_name, resolver_pi.last_name as resolver_last_name
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
    LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
    WHERE t.user_id = $1 AND t.role_id = 1 AND (t.status != 'Closed' OR t.resolved_at >= NOW() - INTERVAL '7 days')
    ORDER BY t.created_at DESC
  `, [userId])
  return result.rows
}

// Generate unique ticket ID using existing database sequence
export async function generateTicketId(): Promise<string> {
  const result = await pool.query('SELECT nextval(\'ticket_id_seq\') as next_id')
  const nextId = result.rows[0].next_id
  return `TKT-${nextId.toString().padStart(6, '0')}`
}

// Update ticket position (for reordering within same status)
export async function updateTicketPosition(id: number, position: number): Promise<Ticket> {
  try {
    // First perform the update
    await pool.query(
      'UPDATE public.tickets SET position = $1 WHERE id = $2',
      [position, id]
    )
    
    // Then fetch the complete ticket data with all JOINs
    const result = await pool.query(`
      SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
             t.role_id, pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name,
             ji.employee_id,
             resolver_pi.first_name as resolver_first_name, resolver_pi.last_name as resolver_last_name,
             u.user_type,
             t.supporting_files, t.file_count,
             CASE 
               WHEN u.user_type = 'Internal' THEN 'Internal'
               WHEN a.member_id IS NOT NULL THEN m.company
               WHEN c.member_id IS NOT NULL THEN m.company
               ELSE NULL
             END as member_name,
             CASE 
               WHEN u.user_type = 'Internal' THEN NULL
               WHEN a.member_id IS NOT NULL THEN m.badge_color
               WHEN c.member_id IS NOT NULL THEN m.badge_color
               ELSE NULL
             END as member_color
      FROM public.tickets t
      LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
      LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
      LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
      LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
      LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
      LEFT JOIN public.users u ON t.user_id = u.id
      LEFT JOIN public.agents a ON t.user_id = a.user_id
      LEFT JOIN public.clients c ON t.user_id = c.user_id
      LEFT JOIN public.members m ON (a.member_id = m.id) OR (c.member_id = m.id)
      WHERE t.id = $1
    `, [id])
    
    return result.rows[0]
  } catch (error) {
    console.error('Database position update failed:', error)
    throw error
  }
}

// Update ticket positions for reordering within same status
export async function updateTicketPositions(tickets: { id: number, position: number }[]): Promise<void> {
  try {
    if (tickets.length === 0) return
    
    console.log('🗄️ DATABASE - Starting batch position updates:', tickets)
    
    // Use a single SQL query with CASE statements for batch update
    const ids = tickets.map(t => t.id)
    const caseStatements = tickets.map(t => `WHEN ${t.id} THEN ${t.position}`).join(' ')
    
    const query = `
      UPDATE public.tickets 
      SET position = CASE id 
        ${caseStatements}
        ELSE position 
      END
      WHERE id = ANY($1::int[])
    `
    
    const result = await pool.query(query, [ids])
    console.log(`🗄️ DATABASE - Batch updated ${result.rowCount} ticket positions`)
  } catch (error) {
    console.error('Database batch positions update failed:', error)
    throw error
  }
}

// Get user's assigned station
export async function getUserStation(userId: number): Promise<string | null> {
  const result = await pool.query(`
    SELECT station_id
    FROM public.stations
    WHERE assigned_user_id = $1
  `, [userId])
  return result.rows[0]?.station_id || null
}

// Assign user to station
export async function assignUserToStation(userId: number, stationId: string): Promise<void> {
  // First, remove any existing assignment for this user
  await pool.query(`
    UPDATE public.stations
    SET assigned_user_id = NULL
    WHERE assigned_user_id = $1
  `, [userId])
  
  // Then assign to the new station
  await pool.query(`
    UPDATE public.stations
    SET assigned_user_id = $1
    WHERE station_id = $2
  `, [userId, stationId])
}

// Get all stations
export async function getAllStations(): Promise<{ id: number, station_id: string, assigned_user_id: number | null }[]> {
  const result = await pool.query(`
    SELECT id, station_id, assigned_user_id
    FROM public.stations
    ORDER BY station_id
  `)
  return result.rows
}

// Get all ticket categories
export async function getAllTicketCategories(): Promise<TicketCategory[]> {
  const result = await pool.query(`
    SELECT id, name
    FROM public.ticket_categories
    ORDER BY name
  `)
  return result.rows
}

// Get ticket category by ID
export async function getTicketCategoryById(id: number): Promise<TicketCategory | null> {
  const result = await pool.query(`
    SELECT id, name
    FROM public.ticket_categories
    WHERE id = $1
  `, [id])
  return result.rows[0] || null
}

// Create ticket category
export async function createTicketCategory(name: string): Promise<TicketCategory> {
  const result = await pool.query(`
    INSERT INTO public.ticket_categories (name)
    VALUES ($1)
    RETURNING id, name
  `, [name])
  return result.rows[0]
}

// Update ticket category
export async function updateTicketCategory(id: number, name: string): Promise<TicketCategory> {
  const result = await pool.query(`
    UPDATE public.ticket_categories
    SET name = $1
    WHERE id = $2
    RETURNING id, name
  `, [name, id])
  return result.rows[0]
}

// Delete ticket category
export async function deleteTicketCategory(id: number): Promise<void> {
  await pool.query(`
    DELETE FROM public.ticket_categories
    WHERE id = $1
  `, [id])
}

// Get count of tickets resolved by a specific user
export async function getTicketsResolvedByUserCount(userId: number, status: string = 'Closed', isAdmin: boolean = false, past: boolean = false): Promise<number> {
  const whereParts: string[] = [
    't.status = $1',
    "t.status != 'For Approval'",
    't.resolved_by = $2'
  ]
  
  // Add 7-day filter for closed/completed tickets based on resolved_at
  // BUT only when NOT fetching past tickets (past=false)
  if ((status === 'Closed' || status === 'Completed') && !past) {
    whereParts.push(`t.resolved_at >= NOW() - INTERVAL '7 days'`)
  }
  
  if (!isAdmin) {
    whereParts.push('t.role_id = 1')
  }
  const whereClause = whereParts.join(' AND ')
  const result = await pool.query(
    `SELECT COUNT(*) as total FROM public.tickets t WHERE ${whereClause}`,
    [status, userId]
  )
  
  return parseInt(result.rows[0]?.total || '0')
}

// Get tickets by status with pagination, sorting, and filtering
// Helper function to map frontend sort fields to database column names
function getSortField(sortField: string): string {
  const fieldMapping: Record<string, string> = {
    'ticket_id': 't.ticket_id',
    'category_name': 'tc.name',
    'first_name': 'pi.first_name',
    'concern': 't.concern',
    'details': 't.details',
    'created_at': 't.created_at',
    'resolved_at': 't.resolved_at',
    'resolver_first_name': 'resolver_pi.first_name'
  }
  return fieldMapping[sortField] || 't.resolved_at'
}

export async function getTicketsByStatusWithPagination(
  status: string, 
  past: boolean = false, 
  page: number = 1, 
  limit: number = 20, 
  search: string = '', 
  sortField: string = 'resolved_at', 
  sortDirection: string = 'desc', 
  categoryId: string = '',
  userId: string = '',
  isAdmin: boolean = false
): Promise<{ tickets: Ticket[], totalCount: number }> {
  const offset = (page - 1) * limit
  
  let whereConditions: string[] = []
  if (!isAdmin) {
    whereConditions.push('t.role_id = 1')
  }
  let queryParams: any[] = []
  let paramIndex = 1
  
  // Only add status condition if status is provided
  if (status) {
    whereConditions.push('t.status = $1')
    queryParams.push(status)
    paramIndex = 2
    
    // Add 7-day filter for closed/completed tickets based on resolved_at
    // BUT only when NOT fetching past tickets (past=false)
    if ((status === 'Closed' || status === 'Completed') && !past) {
      whereConditions.push(`t.resolved_at >= NOW() - INTERVAL '7 days'`)
    }
  }
  
  if (search) {
    // Handle special "you" search for current user's resolved tickets
    if (search.toLowerCase() === 'you' && userId) {
      whereConditions.push(`t.resolved_by = $${paramIndex}`)
      queryParams.push(parseInt(userId))
      paramIndex++
    } else {
      whereConditions.push(`(
        t.concern ILIKE $${paramIndex} OR 
        t.details ILIKE $${paramIndex} OR 
        t.ticket_id ILIKE $${paramIndex} OR
        pi.first_name ILIKE $${paramIndex} OR
        pi.last_name ILIKE $${paramIndex} OR
        ji.employee_id ILIKE $${paramIndex} OR
        s.station_id ILIKE $${paramIndex} OR
        resolver_pi.first_name ILIKE $${paramIndex} OR
        resolver_pi.last_name ILIKE $${paramIndex} OR
        tc.name ILIKE $${paramIndex}
      )`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }
  }
  
  if (categoryId) {
    whereConditions.push(`t.category_id = $${paramIndex}`)
    queryParams.push(categoryId)
    paramIndex++
  }
  
  if (past) {
    whereConditions.push('t.resolved_at IS NOT NULL')
  }
  
  const whereClause = whereConditions.join(' AND ')
  
  // Count total records
  const countQuery = `
    SELECT COUNT(*) as total
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
    LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
    WHERE ${whereClause}
  `
  
  const countResult = await pool.query(countQuery, queryParams)
  const totalCount = parseInt(countResult.rows[0]?.total || '0')
  
  // Get paginated results
  const dataQuery = `
    SELECT t.id, t.ticket_id, t.user_id, t.concern, t.details, t.status, t.position, t.created_at, t.resolved_at, t.resolved_by,
           t.role_id, pi.profile_picture, pi.first_name, pi.last_name, s.station_id, tc.name as category_name,
           ji.employee_id,
           resolver_pi.first_name as resolver_first_name, resolver_pi.last_name as resolver_last_name,
           t.supporting_files, t.file_count,
           CASE
             WHEN u.user_type = 'Internal' THEN 'Internal'
             WHEN a.member_id IS NOT NULL THEN m.company
             WHEN c.member_id IS NOT NULL THEN m.company
             ELSE NULL
           END as member_name,
           CASE
             WHEN u.user_type = 'Internal' THEN NULL
             WHEN a.member_id IS NOT NULL THEN m.badge_color
             WHEN c.member_id IS NOT NULL THEN m.badge_color
             ELSE NULL
           END as member_color,
           u.user_type
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.user_id = pi.user_id
    LEFT JOIN public.stations s ON t.user_id = s.assigned_user_id
    LEFT JOIN public.ticket_categories tc ON t.category_id = tc.id
    LEFT JOIN public.job_info ji ON t.user_id = ji.agent_user_id OR t.user_id = ji.internal_user_id
    LEFT JOIN public.personal_info resolver_pi ON t.resolved_by = resolver_pi.user_id
    LEFT JOIN public.users u ON t.user_id = u.id
    LEFT JOIN public.agents a ON t.user_id = a.user_id
    LEFT JOIN public.clients c ON t.user_id = c.user_id
    LEFT JOIN public.members m ON (a.member_id = m.id) OR (c.member_id = m.id)
    WHERE ${whereClause}
    ORDER BY ${getSortField(sortField)} ${sortDirection.toUpperCase()}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  const dataParams = [...queryParams, limit, offset]
  const dataResult = await pool.query(dataQuery, dataParams)
  
  return {
    tickets: dataResult.rows,
    totalCount
  }
}

// Get all agents with joined profile/job/member/department/station info
export async function getAllAgents(): Promise<AgentRecord[]> {
  const result = await pool.query(
    `SELECT 
        u.id AS user_id,
        u.email,
        u.user_type,
        pi.first_name,
        pi.last_name,
        pi.profile_picture,
        pi.phone,
        ji.employee_id,
        ji.job_title,
        ji.work_email,
        ji.start_date,
        ji.exit_date,
        a.exp_points,
        m.id AS member_id,
        m.company AS member_company,
        m.badge_color AS member_badge_color,
        d.id AS department_id,
        d.name AS department_name,
        s.station_id
     FROM public.users u
     INNER JOIN public.agents a ON u.id = a.user_id
     LEFT JOIN public.personal_info pi ON u.id = pi.user_id
     LEFT JOIN public.job_info ji ON a.user_id = ji.agent_user_id
     LEFT JOIN public.members m ON a.member_id = m.id
     LEFT JOIN public.departments d ON a.department_id = d.id
     LEFT JOIN public.stations s ON u.id = s.assigned_user_id
     WHERE u.user_type = 'Agent'
     ORDER BY COALESCE(pi.first_name, '') ASC, COALESCE(pi.last_name, '') ASC`
  )
  return result.rows
}

// Get agents with pagination and optional search
export async function getAgentsPaginated({
  search = "",
  page = 1,
  limit = 40,
  member,
  memberId,
  sortField = 'first_name',
  sortDirection = 'asc',
}: {
  search?: string
  page?: number
  limit?: number
  member?: 'with' | 'without'
  memberId?: number | 'none'
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}): Promise<{ agents: AgentRecord[]; totalCount: number }> {
  const offset = (Math.max(1, page) - 1) * Math.max(1, limit)

  const params: any[] = []
  let paramIndex = 1

  const whereParts: string[] = ["u.user_type = 'Agent'"]

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    params.push(term)
    const t = `$${paramIndex++}`
    whereParts.push(
      `(
        COALESCE(pi.first_name,'') || ' ' || COALESCE(pi.last_name,'') ILIKE ${t}
        OR u.email ILIKE ${t}
        OR COALESCE(ji.employee_id,'') ILIKE ${t}
        OR COALESCE(ji.job_title,'') ILIKE ${t}
        OR COALESCE(m.company,'') ILIKE ${t}
        OR COALESCE(d.name,'') ILIKE ${t}
        OR COALESCE(s.station_id,'') ILIKE ${t}
      )`
    )
  }

  if (memberId === 'none') {
    whereParts.push('a.member_id IS NULL')
  } else if (typeof memberId === 'number' && !Number.isNaN(memberId)) {
    params.push(memberId)
    const t = `$${paramIndex++}`
    whereParts.push(`a.member_id = ${t}`)
  } else {
    if (member === 'with') {
      whereParts.push('a.member_id IS NOT NULL')
    } else if (member === 'without') {
      whereParts.push('a.member_id IS NULL')
    }
  }

  const whereClause = whereParts.join(' AND ')

  const getSortField = (field: string): string => {
    switch (field) {
      case 'first_name':
        return 'COALESCE(pi.first_name, \'\') ASC, COALESCE(pi.last_name, \'\')'
      case 'job_title':
        return 'COALESCE(ji.job_title, \'\')'
      case 'member_company':
        return 'COALESCE(m.company, \'\')'
      case 'work_email':
        return 'COALESCE(ji.work_email, u.email, \'\')'
      default:
        return 'COALESCE(pi.first_name, \'\') ASC, COALESCE(pi.last_name, \'\')'
    }
  }

  // Count query
  const countQuery = `
    SELECT COUNT(*) AS count
    FROM public.users u
    INNER JOIN public.agents a ON u.id = a.user_id
    LEFT JOIN public.personal_info pi ON u.id = pi.user_id
    LEFT JOIN public.job_info ji ON a.user_id = ji.agent_user_id
    LEFT JOIN public.members m ON a.member_id = m.id
    LEFT JOIN public.departments d ON a.department_id = d.id
    LEFT JOIN public.stations s ON u.id = s.assigned_user_id
    WHERE ${whereClause}
  `
  const countResult = await pool.query(countQuery, params)
  const totalCount = parseInt(countResult.rows?.[0]?.count || '0', 10)

  // Data query
  const dataQuery = `
    SELECT 
        u.id AS user_id,
        u.email,
        u.user_type,
        pi.first_name,
        pi.last_name,
        pi.profile_picture,
        pi.phone,
        ji.employee_id,
        ji.job_title,
        ji.work_email,
        ji.start_date,
        ji.exit_date,
        a.exp_points,
        m.id AS member_id,
        m.company AS member_company,
        m.badge_color AS member_badge_color,
        d.id AS department_id,
        d.name AS department_name,
        s.station_id
     FROM public.users u
     INNER JOIN public.agents a ON u.id = a.user_id
     LEFT JOIN public.personal_info pi ON u.id = pi.user_id
     LEFT JOIN public.job_info ji ON a.user_id = ji.agent_user_id
     LEFT JOIN public.members m ON a.member_id = m.id
     LEFT JOIN public.departments d ON a.department_id = d.id
     LEFT JOIN public.stations s ON u.id = s.assigned_user_id
     WHERE ${whereClause}
     ORDER BY ${getSortField(sortField)} ${sortDirection.toUpperCase()}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  const dataParams = [...params, Math.max(1, limit), offset]
  const dataResult = await pool.query(dataQuery, dataParams)

  return { agents: dataResult.rows, totalCount }
}

export async function getAgentMembers(): Promise<{ id: number; company: string }[]> {
  const query = `
    SELECT DISTINCT m.id, m.company
    FROM public.members m
    INNER JOIN public.agents a ON a.member_id = m.id
    WHERE m.company IS NOT NULL AND m.company <> ''
    ORDER BY m.company ASC
  `
  const result = await pool.query(query)
  return result.rows
}

// Get clients with pagination and optional search
export async function getClientsPaginated({
  search = "",
  page = 1,
  limit = 40,
  member,
  memberId,
  sortField = 'first_name',
  sortDirection = 'asc',
}: {
  search?: string
  page?: number
  limit?: number
  member?: 'with' | 'without'
  memberId?: number | 'none'
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}): Promise<{ agents: AgentRecord[]; totalCount: number }> {
  const offset = (Math.max(1, page) - 1) * Math.max(1, limit)

  const params: any[] = []
  let paramIndex = 1

  const whereParts: string[] = ["u.user_type = 'Client'"]

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    params.push(term)
    const t = `$${paramIndex++}`
    whereParts.push(
      `(
        COALESCE(pi.first_name,'') || ' ' || COALESCE(pi.last_name,'') ILIKE ${t}
        OR u.email ILIKE ${t}
        OR COALESCE(m.company,'') ILIKE ${t}
        OR COALESCE(s.station_id,'') ILIKE ${t}
      )`
    )
  }

  if (memberId === 'none') {
    whereParts.push('c.member_id IS NULL')
  } else if (typeof memberId === 'number' && !Number.isNaN(memberId)) {
    params.push(memberId)
    const t = `$${paramIndex++}`
    whereParts.push(`c.member_id = ${t}`)
  } else {
    if (member === 'with') {
      whereParts.push('c.member_id IS NOT NULL')
    } else if (member === 'without') {
      whereParts.push('c.member_id IS NULL')
    }
  }

  const whereClause = whereParts.join(' AND ')

  const getSortField = (field: string): string => {
    switch (field) {
      case 'first_name':
        return "COALESCE(pi.first_name, '') ASC, COALESCE(pi.last_name, '')"
      case 'job_title':
        return "COALESCE(ji.job_title, '')"
      case 'member_company':
        return "COALESCE(m.company, '')"
      case 'work_email':
        return "COALESCE(ji.work_email, u.email, '')"
      default:
        return "COALESCE(pi.first_name, '') ASC, COALESCE(pi.last_name, '')"
    }
  }

  const countQuery = `
    SELECT COUNT(*) AS count
    FROM public.users u
    INNER JOIN public.clients c ON u.id = c.user_id
    LEFT JOIN public.personal_info pi ON u.id = pi.user_id
    LEFT JOIN public.members m ON c.member_id = m.id
    LEFT JOIN public.stations s ON u.id = s.assigned_user_id
    LEFT JOIN public.job_info ji ON c.user_id = ji.agent_user_id -- may be null for clients
    WHERE ${whereClause}
  `
  const countResult = await pool.query(countQuery, params)
  const totalCount = parseInt(countResult.rows?.[0]?.count || '0', 10)

  const dataQuery = `
    SELECT 
        u.id AS user_id,
        u.email,
        u.user_type,
        pi.first_name,
        pi.last_name,
        pi.profile_picture,
        pi.phone,
        ji.employee_id,
        ji.job_title,
        ji.work_email,
        NULL::date AS start_date,
        NULL::date AS exit_date,
        NULL::int AS exp_points,
        m.id AS member_id,
        m.company AS member_company,
        m.badge_color AS member_badge_color,
        NULL::int AS department_id,
        NULL::text AS department_name,
        s.station_id
     FROM public.users u
     INNER JOIN public.clients c ON u.id = c.user_id
     LEFT JOIN public.personal_info pi ON u.id = pi.user_id
     LEFT JOIN public.members m ON c.member_id = m.id
     LEFT JOIN public.stations s ON u.id = s.assigned_user_id
     LEFT JOIN public.job_info ji ON c.user_id = ji.agent_user_id -- may be null for clients
     WHERE ${whereClause}
     ORDER BY ${getSortField(sortField)} ${sortDirection.toUpperCase()}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  const dataParams = [...params, Math.max(1, limit), offset]
  const dataResult = await pool.query(dataQuery, dataParams)

  return { agents: dataResult.rows, totalCount }
}

export async function getClientMembers(): Promise<{ id: number; company: string }[]> {
  const query = `
    SELECT DISTINCT m.id, m.company
    FROM public.members m
    INNER JOIN public.clients c ON c.member_id = m.id
    WHERE m.company IS NOT NULL AND m.company <> ''
    ORDER BY m.company ASC
  `
  const result = await pool.query(query)
  return result.rows
}

// Members (Companies) pagination
export async function getMembersPaginated({
  search = "",
  page = 1,
  limit = 40,
  sortField = 'company',
  sortDirection = 'asc',
}: {
  search?: string
  page?: number
  limit?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}): Promise<{ members: any[]; totalCount: number }> {
  const offset = (Math.max(1, page) - 1) * Math.max(1, limit)

  const params: any[] = []
  let paramIndex = 1

  const whereParts: string[] = ["COALESCE(m.status::text, '') <> 'Lost Client'"]
  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    params.push(term)
    const t = `$${paramIndex++}`
    whereParts.push(
      `(
        m.company ILIKE ${t} OR
        COALESCE(m.service,'') ILIKE ${t} OR
        COALESCE(m.country,'') ILIKE ${t} OR
        COALESCE(m.phone,'') ILIKE ${t}
      )`
    )
  }
  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

  const mapSort = (field: string): string => {
    switch (field) {
      case 'company':
        return 'm.company'
      case 'service':
        return 'm.service'
      case 'status':
        return 'm.status'
      case 'country':
        return 'm.country'
      case 'created_at':
        return 'm.created_at'
      default:
        return 'm.company'
    }
  }

  const countQuery = `
    SELECT COUNT(*) AS count
    FROM public.members m
    ${whereClause}
  `
  const countResult = await pool.query(countQuery, params)
  const totalCount = parseInt(countResult.rows?.[0]?.count || '0', 10)

  const dataQuery = `
    SELECT 
      m.id,
      m.company,
      m.address,
      m.phone,
      m.logo,
      m.service,
      m.status,
      m.badge_color,
      m.country,
      m.website,
      m.company_id,
      m.created_at,
      m.updated_at,
      COALESCE(ag.agent_count, 0)::int AS employee_count,
      COALESCE(cl.client_count, 0)::int AS client_count
    FROM public.members m
    LEFT JOIN (
      SELECT a.member_id, COUNT(*) AS agent_count
      FROM public.agents a
      WHERE a.member_id IS NOT NULL
      GROUP BY a.member_id
    ) ag ON ag.member_id = m.id
    LEFT JOIN (
      SELECT c.member_id, COUNT(*) AS client_count
      FROM public.clients c
      WHERE c.member_id IS NOT NULL
      GROUP BY c.member_id
    ) cl ON cl.member_id = m.id
    ${whereClause}
    ORDER BY ${mapSort(sortField)} ${sortDirection.toUpperCase()}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  const dataParams = [...params, Math.max(1, limit), offset]
  const dataResult = await pool.query(dataQuery, dataParams)

  return { members: dataResult.rows, totalCount }
}
// Get internal users with pagination and optional search (mirrors agents but for user_type = 'Internal')
export async function getInternalPaginated({
  search = "",
  page = 1,
  limit = 40,
  sortField = 'first_name',
  sortDirection = 'asc',
}: {
  search?: string
  page?: number
  limit?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}): Promise<{ agents: AgentRecord[]; totalCount: number }> {
  const offset = (Math.max(1, page) - 1) * Math.max(1, limit)

  const params: any[] = []
  let paramIndex = 1

  const whereParts: string[] = ["u.user_type = 'Internal'"]

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    params.push(term)
    const t = `$${paramIndex++}`
    whereParts.push(
      `(
        COALESCE(pi.first_name,'') || ' ' || COALESCE(pi.last_name,'') ILIKE ${t}
        OR u.email ILIKE ${t}
        OR COALESCE(ji.employee_id,'') ILIKE ${t}
        OR COALESCE(ji.job_title,'') ILIKE ${t}
      )`
    )
  }

  const whereClause = whereParts.join(' AND ')

  const getSortField = (field: string): string => {
    switch (field) {
      case 'first_name':
        return "COALESCE(pi.first_name, '') ASC, COALESCE(pi.last_name, '')"
      case 'job_title':
        return "COALESCE(ji.job_title, '')"
      case 'work_email':
        return "COALESCE(ji.work_email, u.email, '')"
      default:
        return "COALESCE(pi.first_name, '') ASC, COALESCE(pi.last_name, '')"
    }
  }

  // Count query
  const countQuery = `
    SELECT COUNT(*) AS count
    FROM public.users u
    INNER JOIN public.internal i ON u.id = i.user_id
    LEFT JOIN public.personal_info pi ON u.id = pi.user_id
    LEFT JOIN public.job_info ji ON i.user_id = ji.internal_user_id
    LEFT JOIN public.stations s ON u.id = s.assigned_user_id
    WHERE ${whereClause}
  `
  const countResult = await pool.query(countQuery, params)
  const totalCount = parseInt(countResult.rows?.[0]?.count || '0', 10)

  // Data query
  const dataQuery = `
    SELECT 
        u.id AS user_id,
        u.email,
        u.user_type,
        pi.first_name,
        pi.last_name,
        pi.profile_picture,
        pi.phone,
        ji.employee_id,
        ji.job_title,
        ji.work_email,
        ji.start_date,
        ji.exit_date,
        NULL::int AS member_id,
        NULL::text AS member_company,
        NULL::text AS member_badge_color,
        s.station_id
     FROM public.users u
     INNER JOIN public.internal i ON u.id = i.user_id
     LEFT JOIN public.personal_info pi ON u.id = pi.user_id
     LEFT JOIN public.job_info ji ON i.user_id = ji.internal_user_id
     LEFT JOIN public.stations s ON u.id = s.assigned_user_id
     WHERE ${whereClause}
     ORDER BY ${getSortField(sortField)} ${sortDirection.toUpperCase()}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  const dataParams = [...params, Math.max(1, limit), offset]
  const dataResult = await pool.query(dataQuery, dataParams)

  return { agents: dataResult.rows, totalCount }
}

// Fetch agents assigned to a specific member (for avatar popovers)
export async function getAgentsByMember(memberId: number): Promise<{ user_id: number; first_name: string | null; last_name: string | null; profile_picture: string | null; employee_id: string | null }[]> {
  const query = `
    SELECT 
      a.user_id,
      pi.first_name,
      pi.last_name,
      pi.profile_picture,
      ji.employee_id
    FROM public.agents a
    LEFT JOIN public.personal_info pi ON pi.user_id = a.user_id
    LEFT JOIN public.job_info ji ON ji.agent_user_id = a.user_id
    WHERE a.member_id = $1
    ORDER BY COALESCE(pi.first_name, ''), COALESCE(pi.last_name, '')
  `
  const result = await pool.query(query, [memberId])
  return result.rows
}

// Fetch clients for a specific member (for avatar popovers)
export async function getClientsByMember(memberId: number): Promise<{ user_id: number; first_name: string | null; last_name: string | null; profile_picture: string | null; employee_id: string | null }[]> {
  const query = `
    SELECT 
      c.user_id,
      pi.first_name,
      pi.last_name,
      pi.profile_picture,
      NULL::text AS employee_id
    FROM public.clients c
    LEFT JOIN public.personal_info pi ON pi.user_id = c.user_id
    WHERE c.member_id = $1
    ORDER BY COALESCE(pi.first_name, ''), COALESCE(pi.last_name, '')
  `
  const result = await pool.query(query, [memberId])
  return result.rows
}