'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface AppProtectionProps {
  children: React.ReactNode
}

export function AppProtection({ children }: AppProtectionProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // List of public routes that don't require authentication
  const publicRoutes = ['/login', '/login/', '/']

  useEffect(() => {
    // Skip protection for public routes
    if (publicRoutes.includes(pathname)) return
    if (loading) return

    // If no user, redirect to login
    if (!user) {
      router.push('/login')
      return
    }

    const roleName = (user as any).roleName as string | undefined
    const role = roleName?.toLowerCase()
    const isAdminRoute = pathname.startsWith('/admin')
    const isItRoute = pathname.startsWith('/it')

    // Enforce strict separation: Admin cannot access IT, IT cannot access Admin
    if (isAdminRoute && role !== 'admin') {
      // Non-admin trying to access admin → send to IT dashboard by default
      router.push('/it/dashboard')
      return
    }

    if (isItRoute && role === 'admin') {
      // Admin trying to access IT → send to Admin dashboard
      router.push('/admin/dashboard')
      return
    }

    // Optionally: if you want to require explicit IT role for /it
    if (isItRoute && role !== 'it') {
      router.push('/login')
      return
    }
  }, [user, loading, router, pathname])

  // For public routes, always render children
  if (publicRoutes.includes(pathname)) return <>{children}</>

  // Render protected content
  return <>{children}</>
} 