import pool, { bpocPool } from './database'

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
  clear?: boolean
}

export interface TalentPoolRecord {
  id: number
  applicant_id: string
  interested_clients: number[]
  last_contact_date: string | null
  created_at: string
  updated_at: string
  applicant_name?: string | null
  applicant_email?: string | null
  applicant_avatar?: string | null
  applicant_summary?: string | null
  applicant_skills?: string[]
  comment: {
    id: number
    text: string
    type: string
    created_by: number | null
    created_at: string
    creator: {
      email: string | null
      user_type: string | null
    }
  } | null
  applicant: {
    applicant_id: string | null
    resume_slug: string | null
    status: string
    video_introduction_url: string | null
    current_salary: number | null
    expected_monthly_salary: number | null
    shift: string | null
    position: number
    job_ids: number[]
    bpoc_application_ids: string[]
    created_at: string | null
  }
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
    WHERE t.role_id = 1 AND NOT (t.status = 'Closed' AND t.clear = true)
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
    WHERE NOT (t.status = 'Closed' AND t.clear = true)
    ORDER BY t.status, t.position ASC, t.created_at DESC
  `)
  return result.rows
}

// Get tickets by status (filtered by IT role)
export async function getTicketsByStatus(status: string, past: boolean = false): Promise<Ticket[]> {
  let whereConditions = ['t.status = $1', 't.role_id = 1']
  let queryParams = [status]
  let paramIndex = 2
  
  // Add filter to hide cleared closed tickets
  if (status === 'Closed') {
    whereConditions.push('t.clear = false')
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
  
  // Add filter to hide cleared closed tickets
  if (status === 'Closed') {
    whereConditions.push('t.clear = false')
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
  
  // Add filter to hide cleared closed tickets, but show them in past tickets
  if (status === 'Closed' && !past) {
    whereParts.push('t.clear = false')
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
    
    // Add filter to hide cleared closed tickets, but show them in past tickets
    if (status === 'Closed' && !past) {
      whereConditions.push('t.clear = false')
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
        OR COALESCE(ji.employee_id,'') ILIKE ${t}
        OR COALESCE(ji.job_title,'') ILIKE ${t}
        OR COALESCE(m.company,'') ILIKE ${t}
        OR COALESCE(pi.phone,'') ILIKE ${t}
        OR u.email ILIKE ${t}
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

// Update agent member_id assignment
export async function updateAgentMember(userId: number, memberId: number | null): Promise<any> {
  try {
    const query = `
      UPDATE public.agents 
      SET member_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING *
    `
    const result = await pool.query(query, [memberId, userId])
    
    if (result.rows.length === 0) {
      throw new Error(`Agent with user_id ${userId} not found`)
    }
    
    return result.rows[0]
  } catch (error) {
    console.error('Error updating agent member:', error)
    throw error
  }
}

// Get agent by user_id with full details
export async function getAgentById(userId: number): Promise<any> {
  try {
    const query = `
      SELECT 
        a.user_id,
        a.member_id,
        a.department_id,
        a.created_at,
        a.updated_at,
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
        m.company AS member_company,
        m.badge_color AS member_badge_color,
        d.name AS department_name
      FROM public.agents a
      INNER JOIN public.users u ON a.user_id = u.id
      LEFT JOIN public.personal_info pi ON a.user_id = pi.user_id
      LEFT JOIN public.job_info ji ON a.user_id = ji.agent_user_id
      LEFT JOIN public.members m ON a.member_id = m.id
      LEFT JOIN public.departments d ON a.department_id = d.id
      WHERE a.user_id = $1
    `
    
    const result = await pool.query(query, [userId])
    
    if (result.rows.length === 0) {
      return null
    }
    
    return result.rows[0]
  } catch (error) {
    console.error('Error fetching agent by ID:', error)
    throw error
  }
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
        OR COALESCE(m.company,'') ILIKE ${t}
        OR u.email ILIKE ${t}
        OR COALESCE(pi.phone,'') ILIKE ${t}
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

// Update client member_id assignment
export async function updateClientMember(userId: number, memberId: number | null): Promise<any> {
  try {
    const query = `
      UPDATE public.clients 
      SET member_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING *
    `
    const result = await pool.query(query, [memberId, userId])
    
    if (result.rows.length === 0) {
      throw new Error(`Client with user_id ${userId} not found`)
    }
    
    return result.rows[0]
  } catch (error) {
    console.error('Error updating client member:', error)
    throw error
  }
}

// Get client by user_id with full details
export async function getClientById(userId: number): Promise<any> {
  try {
    const query = `
      SELECT 
        c.user_id,
        c.member_id,
        c.department_id,
        c.created_at,
        c.updated_at,
        u.email,
        u.user_type,
        pi.first_name,
        pi.last_name,
        pi.profile_picture,
        pi.phone,
        ji.employee_id,
        ji.job_title,
        ji.work_email,
        m.company AS member_company,
        m.badge_color AS member_badge_color
      FROM public.clients c
      INNER JOIN public.users u ON c.user_id = u.id
      LEFT JOIN public.personal_info pi ON c.user_id = pi.user_id
      LEFT JOIN public.job_info ji ON c.user_id = ji.agent_user_id
      LEFT JOIN public.stations s ON u.id = s.assigned_user_id
      LEFT JOIN public.members m ON c.member_id = m.id
      WHERE c.user_id = $1
    `
    
    const result = await pool.query(query, [userId])
    
    if (result.rows.length === 0) {
      return null
    }
    
    return result.rows[0]
  } catch (error) {
    console.error('Error fetching client by ID:', error)
    throw error
  }
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

  const whereParts: string[] = []
  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    params.push(term)
    const t = `$${paramIndex++}`
    whereParts.push(
      `(
        m.company ILIKE ${t} OR
        COALESCE(m.service,'') ILIKE ${t} OR
        COALESCE(m.country,'') ILIKE ${t} OR
        COALESCE(m.phone,'') ILIKE ${t} OR
        COALESCE(m.address,'') ILIKE ${t} OR
        COALESCE(m.website::text,'') ILIKE ${t}
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

// Get all clients for a specific member with full details
export async function getClientsForMember(memberId: number): Promise<any[]> {
  try {
    const { agents } = await getClientsPaginated({ 
      memberId, 
      limit: 1000 
    })
    return agents
  } catch (error) {
    console.error('Error fetching clients for member:', error)
    throw error
  }
}

export async function getTalentPoolData({
  search = '',
  category = 'All',
  sortBy = 'rating',
}: {
  search?: string
  category?: string
  sortBy?: 'rating' | 'rate' | 'jobs' | 'newest'
}): Promise<TalentPoolRecord[]> {
  const commentsExistsResult = await pool.query("SELECT to_regclass('public.bpoc_comments') IS NOT NULL AS exists")
  const hasBpocComments = Boolean(commentsExistsResult?.rows?.[0]?.exists)
 
  const selectCommon = `
    SELECT 
      tp.id,
      tp.applicant_id,
      tp.interested_clients,
      tp.last_contact_date,
      tp.created_at,
      tp.updated_at,
      br.applicant_id as recruit_applicant_id,
      br.resume_slug,
      br.status,
      br.video_introduction_url,
      br.current_salary,
      br.expected_monthly_salary,
      br.shift,
      br.position,
      br.job_ids,
      br.bpoc_application_ids,
      br.created_at as recruit_created_at`;
 
  const selectWithComments = `
      , rc.id as comment_id,
      rc.comment as comment_text,
      rc.comment_type,
      rc.created_by,
      rc.created_at as comment_created_at,
      u.email as creator_email,
      u.user_type as creator_user_type`;
 
  const fromBase = `
    FROM public.talent_pool tp
    LEFT JOIN public.bpoc_recruits br ON tp.applicant_id = br.applicant_id`;
 
  const joinComments = `
    LEFT JOIN public.bpoc_comments rc ON rc.id = tp.comment_id
    LEFT JOIN public.users u ON rc.created_by = u.id`;
 
  const orderBy = `
    ORDER BY tp.created_at DESC`;
 
  const query = `${selectCommon}${hasBpocComments ? selectWithComments : ''}
${fromBase}${hasBpocComments ? joinComments : ''}
${orderBy}`
 
  const result = await pool.query(query)
 
  const talentMap = new Map<number, TalentPoolRecord>()
  for (const row of result.rows) {
    if (!talentMap.has(row.id)) {
      talentMap.set(row.id, {
        id: row.id,
        applicant_id: row.applicant_id,
        interested_clients: row.interested_clients || [],
        last_contact_date: row.last_contact_date,
        created_at: row.created_at,
        updated_at: row.updated_at,
        comment: null,
        applicant: {
          applicant_id: row.recruit_applicant_id,
          resume_slug: row.resume_slug,
          status: row.status || 'unknown',
          video_introduction_url: row.video_introduction_url,
          current_salary: row.current_salary,
          expected_monthly_salary: row.expected_monthly_salary,
          shift: row.shift,
          position: row.position || 0,
          job_ids: row.job_ids || [],
          bpoc_application_ids: row.bpoc_application_ids || [],
          created_at: row.recruit_created_at,
        },
      })
    }
    if (hasBpocComments && row.comment_id && !talentMap.get(row.id)!.comment) {
      talentMap.get(row.id)!.comment = {
        id: row.comment_id,
        text: row.comment_text,
        type: row.comment_type,
        created_by: row.created_by,
        created_at: row.comment_created_at,
        creator: {
          email: row.creator_email,
          user_type: row.creator_user_type,
        },
      }
    }
  }
 
  const data: TalentPoolRecord[] = Array.from(talentMap.values())
 
  // Enrich from BPOC DB if configured
  if (bpocPool && data.length > 0) {
    try {
      const applicantIds: string[] = Array.from(
        new Set(
          data.map((t) => t.applicant_id).filter((id) => Boolean(id))
        )
      ) as string[]
 
      if (applicantIds.length > 0) {
        const bpocResult = await bpocPool.query(
          `SELECT u.id, u.email, u.full_name, u.avatar_url FROM users u WHERE u.id = ANY($1::uuid[])`,
          [applicantIds]
        )
        const bpocMap = new Map<string, any>()
        for (const row of bpocResult.rows) bpocMap.set(row.id, row)
 
        for (const t of data) {
          const user = bpocMap.get(t.applicant_id)
          if (!user) continue
          t.applicant_name = user.full_name
          t.applicant_email = user.email
          t.applicant_avatar = user.avatar_url
        }
      }
    } catch {}
 
    try {
      const applicantIds: string[] = Array.from(
        new Set(
          data.map((t) => t.applicant_id).filter((id) => Boolean(id))
        )
      ) as string[]
 
      if (applicantIds.length > 0) {
        const skillsResult = await bpocPool.query(
          `SELECT rg.user_id, rg.generated_resume_data FROM resumes_generated rg WHERE rg.user_id = ANY($1::uuid[])`,
          [applicantIds]
        )
        const skillsMap = new Map<string, any>()
        const summaryMap = new Map<string, string>()
        for (const row of skillsResult.rows) {
          const resumeData = row.generated_resume_data
          skillsMap.set(row.user_id, resumeData)
          if (resumeData.summary && typeof resumeData.summary === 'string') {
            summaryMap.set(row.user_id, resumeData.summary)
          }
        }
 
        for (const t of data) {
          const resumeData = skillsMap.get(t.applicant_id)
          if (!resumeData) continue
          let allSkills: string[] = []
          if (resumeData.skills && typeof resumeData.skills === 'object') {
            if (Array.isArray(resumeData.skills.technical)) allSkills = allSkills.concat(resumeData.skills.technical)
            if (Array.isArray(resumeData.skills.soft)) allSkills = allSkills.concat(resumeData.skills.soft)
            if (Array.isArray(resumeData.skills.languages)) allSkills = allSkills.concat(resumeData.skills.languages)
          } else if (Array.isArray(resumeData.skills)) {
            allSkills = resumeData.skills
          } else if (resumeData.sections && resumeData.sections.skills) {
            allSkills = resumeData.sections.skills
          }
          t.applicant_skills = allSkills
          const summary = summaryMap.get(t.applicant_id)
          if (summary) t.applicant_summary = summary
        }
      }
    } catch {}
  }
 
  // Apply filters
  let filtered = data
  const term = (search || '').toLowerCase()
  if (term) {
    filtered = filtered.filter((t) => {
      const haystack: string[] = []
      if (t.applicant_id) haystack.push(String(t.applicant_id))
      if (t.applicant_name) haystack.push(String(t.applicant_name))
      if (t.applicant_email) haystack.push(String(t.applicant_email))
      if (t.applicant?.status) haystack.push(String(t.applicant.status))
      if (t.comment?.text) haystack.push(String(t.comment.text))
      if (Array.isArray(t.applicant_skills)) haystack.push(...t.applicant_skills.map(String))
      return haystack.some((s) => s.toLowerCase().includes(term))
    })
  }
  if (category && category !== 'All') {
    // Placeholder: no category field in schema yet
  }
 
  if (sortBy === 'rate') {
    filtered.sort((a, b) => {
      const ar = Number(a.applicant?.expected_monthly_salary ?? Infinity)
      const br = Number(b.applicant?.expected_monthly_salary ?? Infinity)
      return ar - br
    })
  } else if (sortBy === 'jobs') {
    filtered.sort((a, b) => {
      const ac = Array.isArray(a.interested_clients) ? a.interested_clients.length : 0
      const bc = Array.isArray(b.interested_clients) ? b.interested_clients.length : 0
      return bc - ac
    })
  } else if (sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
 
  return filtered
}

// Ticket stats
export async function countClosedTickets(): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM public.tickets WHERE status = 'Closed' AND role_id = 1`
  )
  return parseInt(rows[0]?.count || '0', 10)
}

export async function countClosedTicketsWithResolvedAt(): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM public.tickets WHERE status = 'Closed' AND role_id = 1 AND resolved_at IS NOT NULL`
  )
  return parseInt(rows[0]?.count || '0', 10)
}

export async function countClosedTicketsBetween(startISO: string, endISO: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM public.tickets WHERE status = 'Closed' AND role_id = 1 AND resolved_at >= $1 AND resolved_at < $2`,
    [startISO, endISO]
  )
  return parseInt(rows[0]?.count || '0', 10)
}

// Resolver stats
export async function getResolverDataSample(limit: number = 10) {
  const { rows } = await pool.query(`
    SELECT DATE(resolved_at) as date, COUNT(*) as total_resolved, MIN(resolved_at) as earliest, MAX(resolved_at) as latest
    FROM public.tickets
    WHERE status = 'Closed' AND role_id = 1 AND resolved_at IS NOT NULL
    GROUP BY DATE(resolved_at)
    ORDER BY date DESC
    LIMIT $1
  `, [limit])
  return rows
}

export async function getResolverStatsRange(startISO?: string, endISO?: string) {
  let query = `
    SELECT DATE(t.resolved_at) as date, t.resolved_by, CONCAT(pi.first_name, ' ', pi.last_name) as resolver_name, COUNT(*) as resolved_count
    FROM public.tickets t
    LEFT JOIN public.personal_info pi ON t.resolved_by = pi.user_id
    WHERE t.status = 'Closed' AND t.role_id = 1 AND t.resolved_at IS NOT NULL AND t.resolved_by IS NOT NULL AND pi.first_name IS NOT NULL AND pi.last_name IS NOT NULL
  `
  const params: string[] = []
  if (startISO && endISO) {
    query += ` AND t.resolved_at >= $1 AND t.resolved_at < $2`
    params.push(startISO, endISO)
  }
  query += ` GROUP BY DATE(t.resolved_at), t.resolved_by, pi.first_name, pi.last_name ORDER BY date ASC, t.resolved_by ASC`
  const { rows } = await pool.query(query, params)
  return rows
}

// Ticket comments
export async function getTicketIdByTicketId(ticketId: string): Promise<number | null> {
  const { rows } = await pool.query(`SELECT id FROM public.tickets WHERE ticket_id = $1`, [ticketId])
  return rows[0]?.id ?? null
}

export async function getCommentsByTicketId(ticketNumericId: number) {
  const { rows } = await pool.query(`
    SELECT tc.id, tc.ticket_id, tc.user_id, tc.comment, tc.created_at, tc.updated_at,
           u.email, pi.first_name, pi.last_name, pi.profile_picture
    FROM public.ticket_comments tc
    LEFT JOIN public.users u ON tc.user_id = u.id
    LEFT JOIN public.personal_info pi ON u.id = pi.user_id
    WHERE tc.ticket_id = $1
    ORDER BY tc.created_at ASC
  `, [ticketNumericId])
  return rows
}

export async function insertTicketComment(ticketNumericId: number, userId: number, comment: string) {
  const { rows } = await pool.query(
    `INSERT INTO public.ticket_comments (ticket_id, user_id, comment) VALUES ($1, $2, $3) RETURNING id, ticket_id, user_id, comment, created_at, updated_at`,
    [ticketNumericId, userId, comment]
  )
  return rows[0]
}

export async function getUserBasicProfile(userId: number) {
  const { rows } = await pool.query(`
    SELECT u.id, u.email, pi.first_name, pi.last_name, pi.profile_picture
    FROM public.users u
    LEFT JOIN public.personal_info pi ON u.id = pi.user_id
    WHERE u.id = $1
  `, [userId])
  return rows[0] || null
}

// Companies
export interface NewCompanyInput {
  company: string
  address: string
  phone: string
  country: string
  service: string | null
  website: string[]
  logo: string | null
  badge_color?: string
  status?: 'Current Client' | 'Lost Client'
  created_by?: number
}

export async function createMemberCompany(input: NewCompanyInput) {
  const insertColumns = ['company', 'address', 'phone', 'country', 'service', 'website', 'logo', 'company_id', 'badge_color', 'status']
  const companyId = (globalThis.crypto?.randomUUID?.() || undefined) as unknown as string || Math.random().toString(36).slice(2)
  const insertValues: any[] = [
    input.company,
    input.address,
    input.phone,
    input.country,
    input.service,
    input.website,
    input.logo,
    companyId,
    input.badge_color, // Use the form's badge color (including default)
    input.status, // Use the form's status (including default)
  ]
  
  // Add created_by if provided
  if (input.created_by) {
    insertColumns.push('created_by')
    insertValues.push(input.created_by)
  }
  
  const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ')
  const result = await pool.query(
    `INSERT INTO public.members (${insertColumns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    insertValues
  )
  const created = result.rows[0]
  // Optional BPOC sync
  if (bpocPool) {
    try {
      await bpocPool.query(
        `INSERT INTO public.members (company, company_id) VALUES ($1, $2)
         ON CONFLICT (company_id) DO UPDATE SET company = EXCLUDED.company, updated_at = CURRENT_TIMESTAMP`,
        [input.company, companyId]
      )
    } catch {}
  }
  return created
}

// Get a single member by ID
export async function getMemberById(id: number) {
  const result = await pool.query(
    'SELECT * FROM public.members WHERE id = $1',
    [id]
  )
  return result.rows[0] || null
}

// Update a member by ID
export async function updateMember(id: number, updates: Partial<NewCompanyInput>) {
  const updateColumns = Object.keys(updates).filter(key => updates[key as keyof NewCompanyInput] !== undefined)
  const updateValues = Object.values(updates).filter(value => value !== undefined)
  
  if (updateColumns.length === 0) {
    throw new Error('No valid updates provided')
  }
  
  const placeholders = updateColumns.map((_, i) => `${updateColumns[i]} = $${i + 2}`).join(', ')
  
  const query = `
    UPDATE public.members 
    SET ${placeholders}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $1 
    RETURNING *
  `
  
  const result = await pool.query(query, [id, ...updateValues])
  
  if (result.rows.length === 0) {
    throw new Error(`Member with ID ${id} not found`)
  }
  
  // BPOC sync for company name updates
  if (bpocPool && updates.company) {
    try {
      const companyIdResult = await pool.query('SELECT company_id FROM public.members WHERE id = $1', [id])
      if (companyIdResult.rows.length > 0) {
        const companyId = companyIdResult.rows[0].company_id
        await bpocPool.query(
          `UPDATE public.members SET company = $1, updated_at = CURRENT_TIMESTAMP WHERE company_id = $2`,
          [updates.company, companyId]
        )
      }
    } catch (error) {
      console.warn('BPOC sync failed for member update:', error)
    }
  }
  
  return result.rows[0]
}

// Delete a member by ID
export async function deleteMember(id: number): Promise<void> {
  // Get company_id before deletion for BPOC sync
  let companyId: string | null = null
  if (bpocPool) {
    try {
      const companyIdResult = await pool.query('SELECT company_id FROM public.members WHERE id = $1', [id])
      if (companyIdResult.rows.length > 0) {
        companyId = companyIdResult.rows[0].company_id
      }
    } catch (error) {
      console.warn('Failed to get company_id for BPOC sync:', error)
    }
  }
  
  const result = await pool.query(
    'DELETE FROM public.members WHERE id = $1 RETURNING id',
    [id]
  )
  
  if (result.rowCount === 0) {
    throw new Error(`Member with ID ${id} not found`)
  }
  
  // BPOC sync for member deletion
  if (bpocPool && companyId) {
    try {
      await bpocPool.query(
        'DELETE FROM public.members WHERE company_id = $1',
        [companyId]
      )
    } catch (error) {
      console.warn('BPOC sync failed for member deletion:', error)
    }
  }
}

// BPOC positions utilities
export async function ensureRecruitsPositionColumn() {
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'bpoc_recruits' AND column_name = 'position'
      ) THEN
        ALTER TABLE public.bpoc_recruits ADD COLUMN position INTEGER DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_bpoc_recruits_status_position ON public.bpoc_recruits(status, position);
      END IF;
    END$$;
  `)
}

export async function ensureBpocApplicationsPositionColumn() {
  if (!bpocPool) return
  await bpocPool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'position'
      ) THEN
        ALTER TABLE public.applications ADD COLUMN position INTEGER DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_applications_status_position ON public.applications(status, position);
      END IF;
    END$$;
  `)
}

export async function updateApplicantPositions(positions: { id: number; position: number }[]) {
  await ensureRecruitsPositionColumn()
  for (const p of positions) {
    await pool.query('UPDATE public.bpoc_recruits SET position = $1 WHERE id = $2', [p.position, p.id])
  }
  if (bpocPool) {
    await ensureBpocApplicationsPositionColumn()
    for (const p of positions) {
      const { rows } = await pool.query('SELECT bpoc_application_ids FROM public.bpoc_recruits WHERE id = $1', [p.id])
      const ids: string[] = rows[0]?.bpoc_application_ids || []
      for (const appId of ids) {
        await bpocPool.query('UPDATE public.applications SET position = $1 WHERE id = $2', [p.position, appId])
      }
    }
  }
}

// BPOC application status update
export async function updateBpocApplicationStatus(applicantId: number, jobIndex: number, dbStatus: string) {
  const applicantResult = await pool.query(`
    SELECT bpoc_application_ids 
    FROM public.bpoc_recruits 
    WHERE id = $1
  `, [applicantId])
  if (applicantResult.rows.length === 0) {
    throw new Error('Applicant not found')
  }
  const bpocApplicationIds: string[] = applicantResult.rows[0].bpoc_application_ids || []
  if (!bpocApplicationIds || jobIndex < 0 || jobIndex >= bpocApplicationIds.length) {
    throw new Error('Invalid jobIndex or no applications')
  }
  const targetApplicationId = bpocApplicationIds[jobIndex]
  if (!bpocPool) throw new Error('BPOC database is not configured')
  const updateResult = await bpocPool.query(
    `UPDATE public.applications SET status = $1::application_status_enum, updated_at = NOW() WHERE id = $2::uuid RETURNING id, status, updated_at`,
    [dbStatus, targetApplicationId]
  )
  const updated = updateResult.rows[0]
  return { updated, targetApplicationId }
}

export async function notifyApplicantChange(payload: any) {
  await pool.query('SELECT pg_notify($1, $2)', ['applicant_changes', JSON.stringify(payload)])
}

// Auto-save from BPOC applications into bpoc_recruits
export async function autoSaveSubmittedApplications() {
  if (!bpocPool) throw new Error('BPOC database is not configured')
  const applicationsQuery = `
    SELECT a.id::text, a.user_id::text, a.job_id, a.resume_slug, a.status::text, a.created_at,
           u.first_name, u.last_name, u.full_name, u.avatar_url, p.job_title, m.company AS company_name,
           COALESCE(a.position, 0) as position
    FROM public.applications a
    JOIN public.users u ON u.id = a.user_id
    LEFT JOIN public.processed_job_requests p ON p.id = a.job_id
    LEFT JOIN public.members m ON m.company_id = p.company_id
    WHERE a.status = 'submitted'
    ORDER BY a.created_at DESC
  `
  const { rows: applications } = await bpocPool.query(applicationsQuery)
  const { rows: existingRecruits } = await pool.query(`SELECT applicant_id, job_ids, bpoc_application_ids FROM public.bpoc_recruits`)
  const existingApplicants = new Map(existingRecruits.map((r: any) => [r.applicant_id, r]))
  const applicationsByApplicant = new Map<string, any[]>()
  for (const app of applications) {
    const key = app.user_id
    if (!applicationsByApplicant.has(key)) applicationsByApplicant.set(key, [])
    applicationsByApplicant.get(key)!.push(app)
  }
  let createdCount = 0
  let updatedCount = 0
  for (const [applicantId, apps] of applicationsByApplicant) {
    const existing = existingApplicants.get(applicantId)
    if (existing) {
      const newJobIds = apps.filter((a: any) => !existing.job_ids.includes(a.job_id)).map((a: any) => a.job_id)
      const newAppIds = apps.filter((a: any) => !existing.bpoc_application_ids.includes(a.id)).map((a: any) => a.id)
      if (newJobIds.length > 0 || newAppIds.length > 0) {
        await pool.query(`
          UPDATE public.bpoc_recruits 
          SET 
            job_ids = CASE WHEN $1::int[] IS NOT NULL AND array_length($1, 1) > 0 
              THEN (SELECT ARRAY(SELECT DISTINCT unnest(array_cat(job_ids, $1)))) ELSE job_ids END,
            bpoc_application_ids = CASE WHEN $2::uuid[] IS NOT NULL AND array_length($2, 1) > 0 
              THEN (SELECT ARRAY(SELECT DISTINCT unnest(array_cat(bpoc_application_ids, $2::uuid[])))) ELSE bpoc_application_ids END,
            updated_at = now()
          WHERE applicant_id = $3
        `, [newJobIds, newAppIds, applicantId])
        updatedCount++
      }
    } else {
      const uniqueJobIds = [...new Set(apps.map((a: any) => a.job_id))]
      const uniqueAppIds = [...new Set(apps.map((a: any) => a.id))]
      await pool.query(`
        INSERT INTO public.bpoc_recruits (applicant_id, job_ids, bpoc_application_ids, resume_slug, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [applicantId, uniqueJobIds, uniqueAppIds, apps[0].resume_slug, 'submitted', apps[0].created_at])
      createdCount++
    }
  }
  return { createdCount, updatedCount, totalApplicants: applicationsByApplicant.size, totalApplications: applications.length }
}

// Ticket positions migration
export async function migrateTicketPositions() {
  const { rows: tickets } = await pool.query(`
    SELECT id, status, created_at FROM public.tickets ORDER BY status, created_at ASC, id ASC
  `)
  const ticketsByStatus: Record<string, any[]> = {}
  for (const t of tickets) {
    if (!ticketsByStatus[t.status]) ticketsByStatus[t.status] = []
    ticketsByStatus[t.status].push(t)
  }
  const statusCodes: Record<string, number> = {
    'For Approval': 10000,
    'Approved': 20000,
    'In Progress': 30000,
    'Actioned': 40000,
    'Closed': 50000,
    'On Hold': 60000,
    'Stuck': 70000,
  }
  let totalUpdated = 0
  for (const [status, list] of Object.entries(ticketsByStatus)) {
    const base = statusCodes[status] || 1000
    for (let i = 0; i < list.length; i++) {
      const newPos = base + ((i + 1) * 10)
      await pool.query('UPDATE public.tickets SET position = $1 WHERE id = $2', [newPos, list[i].id])
      totalUpdated++
    }
  }
  return { totalUpdated, statusBreakdown: Object.fromEntries(Object.entries(ticketsByStatus).map(([s, l]) => [s, l.length])) }
}

// Internal user lookup
export async function getInternalUserByEmail(email: string, role: string = '') {
  const roleCondition = role === 'admin'
    ? `AND ir.role_id = (SELECT id FROM roles WHERE name = 'Admin')`
    : role === 'it'
      ? `AND (ir.role_id = 1 OR ir.role_id = (SELECT id FROM roles WHERE name = 'IT'))`
      : ''
  const { rows } = await pool.query(`
    SELECT u.id, u.email, u.user_type, pi.first_name, pi.last_name, pi.profile_picture, ir.role_id, r.name as role_name
    FROM public.users u
    LEFT JOIN public.personal_info pi ON u.id = pi.user_id
    LEFT JOIN public.internal i ON u.id = i.user_id
    LEFT JOIN public.internal_roles ir ON i.user_id = ir.internal_user_id
    LEFT JOIN public.roles r ON ir.role_id = r.id
    WHERE u.email = $1 AND i.user_id IS NOT NULL ${roleCondition}
    LIMIT 1
  `, [email])
  return rows[0] || null
}

// BPOC applicants: fetch with optional enrichment
export async function getApplicants({ status, diagnose = false }: { status?: string | null; diagnose?: boolean }) {
  if (!pool) throw new Error('Main database is not configured')
  let applicantsQuery = `
    SELECT 
      r.id,
      r.bpoc_application_ids,
      r.applicant_id,
      r.job_ids,
      r.resume_slug,
      r.status,
      r.created_at,
      r.updated_at,
      r.video_introduction_url,
      r.current_salary,
      r.expected_monthly_salary,
      r.shift,
      COALESCE(r.position, 0) as position
    FROM public.bpoc_recruits r
  `
  const params: any[] = []
  if (status) {
    applicantsQuery += ` WHERE r.status = $1`
    params.push(status)
  }
  applicantsQuery += ` ORDER BY COALESCE(r.position, 0), r.created_at DESC LIMIT 500`
  const { rows: applicants } = await pool.query(applicantsQuery, params)
  if (status) return applicants

  let enrichedData = applicants
  if (diagnose) {
    enrichedData = enrichedData.map((app: any) => ({
      ...app,
      _diagnostic: {
        job_ids_length: app.job_ids ? app.job_ids.length : 0,
        bpoc_app_ids_length: app.bpoc_application_ids ? app.bpoc_application_ids.length : 0,
        has_duplicates: (app.job_ids && app.job_ids.length > 1) || (app.bpoc_application_ids && app.bpoc_application_ids.length > 1)
      }
    }))
  }
  if (!bpocPool) return enrichedData

  try {
    const applicationIds = applicants.flatMap((app: any) => app.bpoc_application_ids || []).filter(Boolean)
    const jobIds = applicants.flatMap((app: any) => app.job_ids || []).filter(Boolean)
    let enrichmentData: any[] = []
    let jobData: any[] = []
    if (applicationIds.length > 0) {
      const enrichmentQuery = `
        SELECT a.id::text, a.user_id::text, u.first_name, u.last_name, u.full_name, u.avatar_url,
               p.job_title, m.company AS company_name, a.job_id, a.status::text as application_status,
               a.created_at as application_created_at
        FROM public.applications a
        JOIN public.users u ON u.id = a.user_id
        LEFT JOIN public.processed_job_requests p ON p.id = a.job_id
        LEFT JOIN public.members m ON m.company_id = p.company_id
        WHERE a.id IN (${applicationIds.map((_, i) => `$${i + 1}`).join(',')})
      `
      const { rows } = await bpocPool.query(enrichmentQuery, applicationIds)
      enrichmentData = rows
    }
    if (jobIds.length > 0) {
      const jobQuery = `
        SELECT p.id as job_id, p.job_title, m.company AS company_name
        FROM public.processed_job_requests p
        LEFT JOIN public.members m ON m.company_id = p.company_id
        WHERE p.id IN (${jobIds.map((_, i) => `$${i + 1}`).join(',')})
      `
      const { rows } = await bpocPool.query(jobQuery, jobIds)
      jobData = rows
    }
    enrichedData = applicants.map((applicant: any) => {
      const applicantApplications = enrichmentData.filter((e: any) => applicant.bpoc_application_ids?.includes(e.id))
      const applicantJobs = jobData.filter((j: any) => applicant.job_ids?.includes(j.job_id))
      const firstApplication = applicantApplications[0] || enrichmentData.find((e: any) => e.user_id === applicant.applicant_id)
      const applicationJobPairs = applicantApplications
        .filter((app: any) => app.job_title)
        .map((app: any) => ({
          job_title: app.job_title,
          company_name: app.company_name || null,
          application_status: app.application_status || 'submitted',
          application_created_at: app.application_created_at,
        }))
      const directJobPairs = applicantJobs
        .filter((job: any) => job.job_title)
        .map((job: any) => ({
          job_title: job.job_title,
          company_name: job.company_name || null,
          application_status: 'submitted',
          application_created_at: null,
        }))
      const allJobPairs = [...applicationJobPairs, ...directJobPairs]
      const uniqueJobPairs = allJobPairs.filter((pair, index, self) => index === self.findIndex(p => p.job_title === pair.job_title && p.company_name === pair.company_name))
      const allJobTitles = uniqueJobPairs.map(pair => pair.job_title)
      const allCompanies = uniqueJobPairs.map(pair => pair.company_name)
      const allJobStatuses = uniqueJobPairs.map(pair => pair.application_status || 'submitted')
      const allJobTimestamps = uniqueJobPairs.map(pair => pair.application_created_at)
      return {
        ...applicant,
        user_id: firstApplication?.user_id || applicant.applicant_id,
        first_name: firstApplication?.first_name || null,
        last_name: firstApplication?.last_name || null,
        full_name: firstApplication?.full_name || null,
        profile_picture: firstApplication?.avatar_url || null,
        job_title: allJobTitles[0] || null,
        company_name: allCompanies[0] || null,
        all_job_titles: allJobTitles,
        all_companies: allCompanies,
        all_job_statuses: allJobStatuses,
        all_job_timestamps: allJobTimestamps,
      }
    })
  } catch (e) {
    // fall back to basic data
    return enrichedData
  }
  return enrichedData
}

export async function updateRecruitStatusAndSyncBpoc(id: number, status: string) {
  const validStatuses = ['submitted', 'qualified', 'for verification', 'verified', 'initial interview', 'final interview', 'not qualified', 'passed']
  if (!validStatuses.includes(status)) throw new Error('Invalid status value')
  const { rows } = await pool.query(`
    UPDATE public.bpoc_recruits SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, status, updated_at, bpoc_application_ids
  `, [status, id])
  if (rows.length === 0) throw new Error('Failed to update applicant')
  const recruitRecord = rows[0]
  if (bpocPool && recruitRecord.bpoc_application_ids && recruitRecord.bpoc_application_ids.length > 0) {
    try {
      const statusCheck = await bpocPool.query(`
        SELECT id, status::text as current_status FROM public.applications WHERE id = ANY($1)
      `, [recruitRecord.bpoc_application_ids])
      const finalBpocStatuses = ['withdrawn', 'final interview', 'hired', 'failed']
      const applicationsToUpdate = statusCheck.rows.filter((row: any) => !finalBpocStatuses.includes(row.current_status.toLowerCase()))
      for (const application of applicationsToUpdate) {
        await bpocPool.query(`
          UPDATE public.applications SET status = $1::application_status_enum WHERE id = $2 RETURNING id
        `, [status, application.id])
      }
    } catch (e) {
      // fallback try to fetch ids from main db again
      try {
        const { rows: r } = await pool.query(`SELECT bpoc_application_ids FROM public.bpoc_recruits WHERE id = $1`, [id])
        const ids: string[] = r[0]?.bpoc_application_ids || []
        for (const appId of ids) {
          await bpocPool?.query(`UPDATE public.applications SET status = $1::application_status_enum WHERE id = $2 RETURNING id`, [status, appId])
        }
      } catch {}
    }
  }
  return recruitRecord
}

export async function updateRecruitFields(id: number, updates: Record<string, any>) {
  const allowedFields = ['resume_slug_recruits', 'shift', 'current_salary', 'expected_monthly_salary', 'video_introduction_url']
  const valid: any = {}
  for (const key of Object.keys(updates)) {
    if (allowedFields.includes(key) && updates[key] !== undefined) valid[key] = updates[key]
  }
  if (Object.keys(valid).length === 0) throw new Error('No valid fields to update')
  const setClause = Object.keys(valid).map((key, idx) => `${key} = $${idx + 2}`).join(', ')
  const params = [id, ...Object.values(valid)]
  const { rows } = await pool.query(`
    UPDATE public.bpoc_recruits SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING id, ${Object.keys(valid).join(', ')}, updated_at
  `, params)
  return rows[0]
}

export async function getRecruitById(id: number) {
  const { rows } = await pool.query(`
    SELECT id, resume_slug, shift, current_salary, expected_monthly_salary, video_introduction_url, updated_at, status
    FROM public.bpoc_recruits WHERE id = $1
  `, [id])
  return rows[0] || null
}

export async function cleanupBpocRecruitsDuplicates() {
  const { rows } = await pool.query(`
    UPDATE public.bpoc_recruits SET 
      job_ids = array_remove(array_remove(job_ids, NULL), job_ids[1]),
      bpoc_application_ids = array_remove(array_remove(bpoc_application_ids, NULL), bpoc_application_ids[1]),
      updated_at = now()
    WHERE (array_length(job_ids, 1) > 1 OR array_length(bpoc_application_ids, 1) > 1)
      AND (job_ids IS NOT NULL OR bpoc_application_ids IS NOT NULL)
    RETURNING id, job_ids, bpoc_application_ids
  `)
  return { cleanedRecords: rows.length, sample: rows.slice(0, 3) }
}

// BPOC debug helpers
export async function getBpocDebugInfo() {
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    BPOC_DATABASE_URL: process.env.BPOC_DATABASE_URL ? 'Set' : 'Not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
  }
  if (!bpocPool) return { error: 'BPOC pool is null', envInfo }
  const { rows: testRows } = await bpocPool.query('SELECT 1 as test')
  const { rows: appTbl } = await bpocPool.query(`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') as table_exists
  `)
  const { rows: usersTbl } = await bpocPool.query(`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') as table_exists
  `)
  const { rows: jobsTbl } = await bpocPool.query(`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'processed_job_requests') as table_exists
  `)
  const { rows: membersTbl } = await bpocPool.query(`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'members') as table_exists
  `)
  return {
    message: 'Debug successful',
    envInfo,
    tables: {
      applications: appTbl[0].table_exists,
      users: usersTbl[0].table_exists,
      processed_job_requests: jobsTbl[0].table_exists,
      members: membersTbl[0].table_exists,
    },
    test: testRows[0],
  }
}

export async function getBpocApplicationsCount() {
  if (!bpocPool) throw new Error('BPOC database is not configured')
  const { rows } = await bpocPool.query('SELECT COUNT(*) as count FROM public.applications')
  return parseInt(rows[0]?.count || '0', 10)
}

// Auth helpers
export async function getInternalLoginUserByEmail(email: string) {
  const { rows } = await pool.query(`
    SELECT u.id, u.email, u.user_type, pi.first_name, pi.last_name, pi.profile_picture, ir.role_id
    FROM public.users u
    LEFT JOIN public.personal_info pi ON u.id = pi.user_id
    LEFT JOIN public.internal i ON u.id = i.user_id
    LEFT JOIN public.internal_roles ir ON i.user_id = ir.internal_user_id
    WHERE u.email = $1 AND i.user_id IS NOT NULL AND (ir.role_id = 1 OR ir.role_id = (SELECT id FROM roles WHERE name = 'IT'))
  `, [email])
  return rows[0] || null
}

// Modal-specific search functions for quick selection (simplified search)
export async function getAgentsForModal(
  page: number = 1,
  limit: number = 20,
  search?: string,
  memberId?: string,
  sortField: string = 'first_name',
  sortDirection: 'asc' | 'desc' = 'asc'
): Promise<{ agents: any[], pagination: { totalCount: number, totalPages: number, currentPage: number } }> {
  const offset = (page - 1) * limit
  const params: any[] = []
  let paramIndex = 1
  const whereParts: string[] = []
  
  // Add member filter
  if (memberId && memberId !== 'all') {
    if (memberId === 'none') {
      whereParts.push('a.member_id IS NULL')
    } else {
      params.push(parseInt(memberId))
      whereParts.push(`a.member_id = $${paramIndex++}`)
    }
  }
  
  // Add simplified search filter for modal (name + employee ID only)
  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    params.push(term)
    const t = `$${paramIndex++}`
    whereParts.push(
      `(
        COALESCE(pi.first_name,'') || ' ' || COALESCE(pi.last_name,'') ILIKE ${t}
        OR COALESCE(ji.employee_id,'') ILIKE ${t}
      )`
    )
  }
  
  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''
  
  // Count total records
  const countQuery = `
    SELECT COUNT(*) as total
    FROM public.agents a
    LEFT JOIN public.personal_info pi ON a.user_id = pi.user_id
    LEFT JOIN public.job_info ji ON a.user_id = ji.agent_user_id
    LEFT JOIN public.members m ON a.member_id = m.id
    ${whereClause}
  `
  
  const countResult = await pool.query(countQuery, params)
  const totalCount = parseInt(countResult.rows[0]?.total || '0', 10)
  const totalPages = Math.ceil(totalCount / limit)
  
  // Get paginated results - only essential fields for modal selection
  const dataQuery = `
    SELECT 
      a.user_id,
      pi.first_name,
      pi.last_name,
      pi.profile_picture,
      ji.employee_id,
      ji.job_title,
      m.company as member_company,
      m.badge_color as member_badge_color
    FROM public.agents a
    LEFT JOIN public.personal_info pi ON a.user_id = pi.user_id
    LEFT JOIN public.job_info ji ON a.user_id = ji.agent_user_id
    LEFT JOIN public.members m ON a.member_id = m.id
    ${whereClause}
    ORDER BY ${sortField} ${sortDirection.toUpperCase()}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `
  
  params.push(limit, offset)
  const result = await pool.query(dataQuery, params)
  
  return {
    agents: result.rows,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page
    }
  }
}

export async function getClientsForModal(
  page: number = 1,
  limit: number = 20,
  search?: string,
  memberId?: string,
  sortField: string = 'first_name',
  sortDirection: 'asc' | 'desc' = 'asc'
): Promise<{ clients: any[], pagination: { totalCount: number, totalPages: number, currentPage: number } }> {
  const offset = (page - 1) * limit
  const params: any[] = []
  let paramIndex = 1
  const whereParts: string[] = []
  
  // Add member filter
  if (memberId && memberId !== 'all') {
    if (memberId === 'none') {
      whereParts.push('c.member_id IS NULL')
    } else {
      params.push(parseInt(memberId))
      whereParts.push(`c.member_id = $${paramIndex++}`)
    }
  }
  
  // Add simplified search filter for modal (name only)
  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    params.push(term)
    const t = `$${paramIndex++}`
          whereParts.push(
        `(
          COALESCE(pi.first_name,'') || ' ' || COALESCE(pi.last_name,'') ILIKE ${t}
        )`
      )
  }
  
  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''
  
  // Count total records
  const countQuery = `
    SELECT COUNT(*) as total
    FROM public.clients c
    LEFT JOIN public.personal_info pi ON c.user_id = pi.user_id
    LEFT JOIN public.members m ON c.member_id = m.id
    ${whereClause}
  `
  
  const countResult = await pool.query(countQuery, params)
  const totalCount = parseInt(countResult.rows[0].total || '0', 10)
  const totalPages = Math.ceil(totalCount / limit)
  
  // Get paginated results - only essential fields for modal selection
  const dataQuery = `
    SELECT 
      c.user_id,
      pi.first_name,
      pi.last_name,
      pi.profile_picture,
      m.company as member_company,
      m.badge_color as member_badge_color
    FROM public.clients c
    LEFT JOIN public.personal_info pi ON c.user_id = pi.user_id
    LEFT JOIN public.members m ON c.member_id = m.id
    ${whereClause}
    ORDER BY ${sortField} ${sortDirection.toUpperCase()}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `
  
  params.push(limit, offset)
  const result = await pool.query(dataQuery, params)
  
  return {
    clients: result.rows,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page
    }
  }
}

// Mark a ticket as cleared (hidden from main pages)
export async function markTicketAsCleared(ticketId: number): Promise<void> {
  await pool.query(`
    UPDATE public.tickets 
    SET clear = true 
    WHERE id = $1 AND status = 'Closed'
  `, [ticketId])
}

// Unmark a ticket as cleared (show on main pages again)
export async function unmarkTicketAsCleared(ticketId: number): Promise<void> {
  await pool.query(`
    UPDATE public.tickets 
    SET clear = false 
    WHERE id = $1 AND status = 'Closed'
  `, [ticketId])
}

// Get cleared tickets (for admin review)
export async function getClearedTickets(): Promise<Ticket[]> {
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
           END as member_color,
           t.clear
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
    WHERE t.status = 'Closed' AND t.clear = true
    ORDER BY t.resolved_at DESC
  `)
  return result.rows
}