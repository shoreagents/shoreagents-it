import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createLeadsClient() {
  const cookieStore = cookies()
  
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_LEADS_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_LEADS_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}

// Create a client with service role key for Leads storage operations
export function createLeadsServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_LEADS_SUPABASE_URL!,
    process.env.LEADS_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}
