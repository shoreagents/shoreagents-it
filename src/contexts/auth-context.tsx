'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  userType: string
  firstName: string
  lastName: string
  profilePicture?: string
  roleName?: string
  isAuthenticated: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, role?: 'it' | 'admin' | 'nurse') => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...')
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()
      
      if (error || !supabaseUser) {
        console.log('No Supabase user found, setting user to null')
        setUser(null)
        setLoading(false)
        return
      }

      console.log('Supabase user found:', supabaseUser.email)
      
      // Get user data from Railway PostgreSQL via API
      const response = await fetch(`/api/auth/user?email=${encodeURIComponent(supabaseUser.email || '')}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('User data from API:', data.user)
        setUser(data.user)
      } else {
        console.log('User not found in database')
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string, role: 'it' | 'admin' | 'nurse' = 'it') => {
    try {
      console.log('🔐 Starting login process for:', email, 'role:', role)
      
      // First, authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.log('❌ Supabase auth error:', error.message)
        // Provide more user-friendly error messages
        let userFriendlyError = 'Invalid Credentials'
        if (error.message.includes('Invalid login credentials')) {
          userFriendlyError = 'Invalid Email or Password'
        } else if (error.message.includes('Email not confirmed')) {
          userFriendlyError = 'Please verify your email address'
        } else if (error.message.includes('Too many requests')) {
          userFriendlyError = 'Too many login attempts. Please try again later'
        }
        return { success: false, error: userFriendlyError }
      }

      if (!data.user) {
        console.log('❌ No user data from Supabase')
        return { success: false, error: 'Authentication failed' }
      }

      console.log('✅ Supabase authentication successful')

      // Check if user exists in our Railway PostgreSQL database via API with role requirement
      const response = await fetch(`/api/auth/user?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`)
      
      if (!response.ok) {
        console.log('❌ User not found in Railway database or role not authorized')
        // Logout from Supabase if user doesn't exist or role not authorized in our database
        await supabase.auth.signOut()
        return { success: false, error: 'Access Denied' }
      }

      const userData = await response.json()
      console.log('✅ User found in Railway database:', userData.user)
      setUser(userData.user)

      return { success: true }
    } catch (error) {
      console.error('❌ Login error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    try {
      console.log('🚪 Logging out user...')
      await supabase.auth.signOut()
      setUser(null)
      
    } catch (error) {
      console.error('❌ Logout error:', error)
    }
  }

  useEffect(() => {
    checkAuth()
    
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Auth check timeout, setting loading to false')
        setLoading(false)
      }
    }, 5000) // 5 second timeout
    
    return () => clearTimeout(timeout)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 