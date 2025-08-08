"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Route based on role if available
        // Admin to admin dashboard; otherwise IT dashboard
        const roleName = (user as any).roleName as string | undefined
        if (roleName && roleName.toLowerCase() === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/it/dashboard')
        }
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen"></div>
  )
}
