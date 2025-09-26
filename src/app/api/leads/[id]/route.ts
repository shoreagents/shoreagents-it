import { NextRequest, NextResponse } from 'next/server'
import { createLeadsClient } from '@/lib/supabase-leads/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createLeadsClient()
    const leadId = params.id

    const { data: lead, error } = await supabase
      .from('leads')
      .select(`
        *,
        lead_status:lead_statuses(name),
        lead_source:lead_sources(name),
        assigned_to:users(first_name, last_name, profile_picture)
      `)
      .eq('id', leadId)
      .single()

    if (error) {
      console.error('Error fetching lead:', error)
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error in lead GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createLeadsClient()
    const leadId = params.id
    const body = await request.json()

    const { data: lead, error } = await supabase
      .from('leads')
      .update(body)
      .eq('id', leadId)
      .select(`
        *,
        lead_status:lead_statuses(name),
        lead_source:lead_sources(name),
        assigned_to:users(first_name, last_name, profile_picture)
      `)
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error in lead PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createLeadsClient()
    const leadId = params.id

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)

    if (error) {
      console.error('Error deleting lead:', error)
      return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in lead DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
