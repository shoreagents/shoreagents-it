import { NextRequest, NextResponse } from 'next/server'
import { getAllTickets, getAllTicketsAdmin, createTicket, getTicketsByStatus, getTicketsByStatusAdmin, getTicketsByStatusWithPagination, getTicketsResolvedByUserCount, getAllRoles, assignRoleToInternalUser, updateTicket } from '@/lib/db-utils'
import { generateTicketId } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    const status: string | undefined = statusParam === null ? undefined : statusParam
    const past = searchParams.get('past')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const sortField = searchParams.get('sortField') || 'resolved_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    const categoryId = searchParams.get('categoryId') || ''
    const userId = searchParams.get('userId') ?? ''
    
    console.log('API Request params:', { status, past, page, limit, search, sortField, sortDirection, categoryId, userId })
    
    let tickets
    let totalCount = 0
    let resolvedByUserCount = 0
    
    if (search && !status) {
      // Search across all tickets when no status is specified
      console.log('Searching across all tickets with:', { 
        page, 
        limit, 
        search, 
        sortField, 
        sortDirection, 
        categoryId 
      })
      const result = await getTicketsByStatusWithPagination('', false, page, limit, search, sortField, sortDirection, categoryId, userId)
      tickets = result.tickets
      totalCount = result.totalCount
    } else if ((status === 'Completed' || status === 'Closed') && (past === 'true' || page > 1 || search || categoryId)) {
      // Fetch completed tickets with pagination and sorting (for past dates or when pagination/search is needed)
      console.log('Calling getTicketsByStatusWithPagination with:', { 
        status, 
        past: past === 'true', 
        page, 
        limit, 
        search, 
        sortField, 
        sortDirection, 
        categoryId 
      })
      const isAdminPaginated = ((searchParams.get('admin') ?? '') === 'true')
      const result = await getTicketsByStatusWithPagination(status as string, past === 'true', page, limit, search, sortField, sortDirection, categoryId, userId, isAdminPaginated)
      tickets = result.tickets
      totalCount = result.totalCount
      
      // Get count of tickets resolved by current user
      if (userId) {
        resolvedByUserCount = await getTicketsResolvedByUserCount(parseInt(userId), status as string, isAdminPaginated, past === 'true')
      }
    } else if (status !== undefined) {
      // Admin flag to include For Approval and remove role filter
      const adminParam = searchParams.get('admin')
      const isAdmin = (adminParam ?? '') === 'true'
      console.log('API: Status requested:', status, 'IsAdmin:', isAdmin)
      if (isAdmin) {
        tickets = await getTicketsByStatusAdmin(status as string)
      } else {
        tickets = await getTicketsByStatus(status as string)
      }
      console.log('API: Tickets returned:', tickets.length)
    } else {
      // Admin flag to include all statuses including For Approval
      const adminParam2 = searchParams.get('admin')
      const isAdmin = (adminParam2 ?? '') === 'true'
      tickets = isAdmin ? await getAllTicketsAdmin() : await getAllTickets()
    }
    
    // Return paginated response for search across all tickets or completed tickets with pagination
    if ((search && !status) || ((status === 'Completed' || status === 'Closed') && (past === 'true' || page > 1 || search || categoryId))) {
      return NextResponse.json({
        tickets,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        resolvedByUserCount
      })
    }
    
    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error in tickets API:', error)
    console.error('Error stack:', (error as Error).stack)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Two modes: create ticket (default) or assign role (admin action)
    if (body && body.action === 'assignRole') {
      const { userId, roleId, ticketId } = body
      if (!userId || !roleId) {
        return NextResponse.json({ error: 'Missing userId or roleId' }, { status: 400 })
      }
      const parsedUserId = parseInt(String(userId))
      const parsedRoleId = parseInt(String(roleId))
      await assignRoleToInternalUser(parsedUserId, parsedRoleId)
      let updated: any = null
      if (ticketId) {
        const parsedTicketId = parseInt(String(ticketId))
        updated = await updateTicket(parsedTicketId, { role_id: parsedRoleId })
      }
      return NextResponse.json({ success: true, ticket: updated })
    }

    const { user_id, concern, details, category_id, status = 'For Approval' } = body
    
    // ticket_id will be auto-generated by database trigger
    const newTicket = await createTicket({
      ticket_id: '', // Will be auto-generated by database trigger
      user_id,
      concern,
      details,
      category: '', // Not used in new schema
      category_id,
      status,
      position: 0,
      role_id: 1, // IT role
      station_id: null,
      profile_picture: null,
      first_name: null,
      last_name: null,
      employee_id: null,
    })
    
    return NextResponse.json(newTicket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}

// Roles endpoint (admin)
export async function OPTIONS() {
  return NextResponse.json({ ok: true })
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    if (resource === 'roles') {
      const roles = await getAllRoles()
      return NextResponse.json(roles)
    }
    return NextResponse.json({ error: 'Unknown resource' }, { status: 400 })
  } catch (error) {
    console.error('Error in roles fetch:', error)
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }
}