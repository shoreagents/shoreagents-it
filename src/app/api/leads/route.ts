import { NextRequest, NextResponse } from 'next/server'
import { createLeadsClient } from '@/lib/supabase-leads/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createLeadsClient()
    const { searchParams } = new URL(request.url)
    const admin = searchParams.get('admin') === 'true'

    let query = supabase
      .from('leads')
      .select(`
        *,
        lead_status:lead_statuses(name),
        lead_source:lead_sources(name),
        assigned_to:users(first_name, last_name, profile_picture)
      `)
      .order('created_at', { ascending: false })

    // If admin view, get all leads, otherwise filter by assigned user
    if (!admin) {
      // For now, return all leads - you can add user filtering logic here
      // const { data: { user } } = await supabase.auth.getUser()
      // if (user) {
      //   query = query.eq('assigned_to', user.id)
      // }
    }

    const { data: leads, error } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    return NextResponse.json(leads || [])
  } catch (error) {
    console.error('Error in leads API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createLeadsClient()
    const body = await request.json()

    const { data: lead, error } = await supabase
      .from('leads')
      .insert([body])
      .select(`
        *,
        lead_status:lead_statuses(name),
        lead_source:lead_sources(name),
        assigned_to:users(first_name, last_name, profile_picture)
      `)
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error in leads POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createLeadsClient()
    const body = await request.json()
    const { resource } = body

    if (resource === 'statuses') {
      const { data: statuses, error } = await supabase
        .from('lead_statuses')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching lead statuses:', error)
        return NextResponse.json({ error: 'Failed to fetch lead statuses' }, { status: 500 })
      }

      return NextResponse.json(statuses || [])
    }

    if (resource === 'sources') {
      const { data: sources, error } = await supabase
        .from('lead_sources')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching lead sources:', error)
        return NextResponse.json({ error: 'Failed to fetch lead sources' }, { status: 500 })
      }

      return NextResponse.json(sources || [])
    }

    return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
  } catch (error) {
    console.error('Error in leads PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
