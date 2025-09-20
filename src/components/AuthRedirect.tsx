'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AuthRedirectProps {
  role: 'ADMIN' | 'CONTRATISTA'
  token: string
}

export function AuthRedirect({ role, token }: AuthRedirectProps) {
  useEffect(() => {
    // Store token in localStorage
    console.log('Storing token in localStorage')
    localStorage.setItem('auth-token', token)

    // Also try to set as a non-httpOnly cookie for development
    console.log('Setting cookie manually')
    document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

    // Navigate directly to the target URL
    const targetUrl = role === 'ADMIN' ? '/admin' : '/contratista'
    console.log('Navigating to:', targetUrl)

    // Small delay to ensure storage is set
    setTimeout(() => {
      window.location.href = targetUrl
    }, 200)
  }, [role, token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg">Redirecting...</p>
      </div>
    </div>
  )
}