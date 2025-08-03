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
  const publicRoutes = ['/login', '/login/']

  useEffect(() => {
    // Skip protection for public routes
    if (publicRoutes.includes(pathname)) {
      return
    }

    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router, pathname])

  // For public routes, always render children
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>
  }

  // Show loading state while checking authentication (except for public routes)
  if (loading && !publicRoutes.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // For protected routes, only render if user is authenticated
  if (!user) {
    return null // Will redirect to login
  }

  return <>{children}</>
} 