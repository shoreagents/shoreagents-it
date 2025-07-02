'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppPage from './Dashboard'
import Dashboard from './Dashboard'
import { Button } from '@shoreagents/shoreagents-shared-ui/src/components/Button'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else {
        console.log('Logged in successfully')
        setIsLoggedIn(true)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setEmail('')
    setPassword('')
    setError(null)
  }

  // Show Dashboard if logged in
  if (isLoggedIn) {
    return <Dashboard email={email} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-montserrat">
      {/* Left: Branding */}
      <div 
        className="hidden md:flex flex-col justify-center items-center w-1/2 min-h-screen text-white relative overflow-hidden"
        style={{ 
          backgroundImage: 'url("/images/Login-Background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'local'
        }}
      >
        {/* Green overlay */}
        <div 
          className="absolute inset-0 w-full h-full" 
          style={{ backgroundColor: '#7EAC0B', opacity: 0.3 }}
        ></div>
        
       
         </div>

      {/* Right: Login Form (no card) */}
      <div className="flex flex-1 flex-col justify-center items-center w-full md:w-1/2 min-h-screen bg-white">
        <div className="w-full max-w-md space-y-8 p-8">
          <div className="text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back! <span className="inline-block">👋</span></h2>
            <p className="text-gray-600 text-sm mb-4">
            An all-in-one IT management platform that helps you streamline operations, monitor systems in real time — all through a clean and responsive web interface.
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-0 py-2 border-b-2 border-gray-200 bg-transparent outline-none transition-colors"
                onFocus={(e) => e.currentTarget.style.borderBottomColor = '#C3DB63'}
                onBlur={(e) => e.currentTarget.style.borderBottomColor = '#d1d5db'}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-0 py-2 border-b-2 border-gray-200 bg-transparent outline-none transition-colors"
                onFocus={(e) => e.currentTarget.style.borderBottomColor = '#C3DB63'}
                onBlur={(e) => e.currentTarget.style.borderBottomColor = '#d1d5db'}
                placeholder="Enter your password"
              />
            </div>
            <div className="space-y-6 mt-15">
              <Button type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Login Now'}
              </Button>
              <button
                type="button"
                className="w-full py-3 px-4 rounded-md border border-gray-300 flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                {/* Google icon placeholder */}
                <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C35.82 2.7 30.28 0 24 0 14.61 0 6.44 5.82 2.69 14.09l7.98 6.19C12.13 13.16 17.56 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.64 7.01l7.19 5.6C43.98 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.27c-1.01-2.99-1.01-6.21 0-9.2l-7.98-6.19C.64 16.61 0 20.21 0 24c0 3.79.64 7.39 1.69 10.12l7.98-6.19z"/><path fill="#EA4335" d="M24 48c6.28 0 11.56-2.08 15.41-5.66l-7.19-5.6c-2.01 1.35-4.59 2.16-8.22 2.16-6.44 0-11.87-3.66-14.33-8.79l-7.98 6.19C6.44 42.18 14.61 48 24 48z"/></g></svg>
                Login with Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 