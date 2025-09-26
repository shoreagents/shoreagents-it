import { createClient } from '@supabase/supabase-js'

// Leads-specific Supabase configuration
const leadsSupabaseUrl = process.env.NEXT_PUBLIC_LEADS_SUPABASE_URL!
const leadsSupabaseAnonKey = process.env.NEXT_PUBLIC_LEADS_SUPABASE_ANON_KEY!

export const leadsSupabase = createClient(leadsSupabaseUrl, leadsSupabaseAnonKey)

// Helper function to get user from Leads Supabase auth
export async function getLeadsSupabaseUser() {
  const { data: { user }, error } = await leadsSupabase.auth.getUser()
  if (error) {
    console.error('Error getting leads user:', error)
    return null
  }
  return user
}

// Helper function to check if user is authenticated in Leads database
export async function isLeadsAuthenticated() {
  const user = await getLeadsSupabaseUser()
  return !!user
}

// Helper function to get public URL for Leads Supabase Storage files
export function getLeadsStorageUrl(path: string, isPreview: boolean = false): string {
  if (!path) return ''
  
  // If it's already a full URL, return as is
  if (path.startsWith('http')) {
    return path
  }
  
  // If the path already includes the bucket/folder structure, use it directly
  if (path.startsWith('leads/')) {
    const cleanPath = path.replace(/^\/+/, '')
    // Remove duplicate attachments folder if it exists
    const fixedPath = cleanPath.replace(/attachments\/attachments\//, 'attachments/')
    const baseUrl = `${leadsSupabaseUrl}/storage/v1/object/public/${fixedPath}`
    
    // Add image optimization parameters for previews
    if (isPreview) {
      const fileExtension = path.split('.').pop()?.toLowerCase()
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')
      if (isImage) {
        return `${baseUrl}?width=200&height=200&quality=60&format=webp`
      }
    }
    
    return baseUrl
  }
  
  // If it's just a filename, add the folder structure
  const bucketName = 'leads'
  const folderName = 'attachments'
  const cleanPath = path.replace(/^\/+/, '')
  
  const baseUrl = `${leadsSupabaseUrl}/storage/v1/object/public/${bucketName}/${folderName}/${cleanPath}`
  
  // Add image optimization parameters for previews
  if (isPreview) {
    const fileExtension = cleanPath.split('.').pop()?.toLowerCase()
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')
    if (isImage) {
      return `${baseUrl}?width=200&height=200&quality=60&format=webp`
    }
  }
  
  // Debug logging
  console.log('getLeadsStorageUrl input:', path)
  console.log('getLeadsStorageUrl constructed URL:', baseUrl)
  
  return baseUrl
}
