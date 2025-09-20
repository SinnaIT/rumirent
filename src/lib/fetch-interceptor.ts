'use client'

// Client-side fetch interceptor to add auth headers
let isInterceptorSetup = false

export function setupFetchInterceptor() {
  if (isInterceptorSetup || typeof window === 'undefined') return

  const originalFetch = window.fetch

  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const token = localStorage.getItem('auth-token')

    if (token && init) {
      init.headers = {
        ...init.headers,
        'Authorization': `Bearer ${token}`
      }
    } else if (token) {
      const newInit: RequestInit = {
        ...init,
        headers: {
          ...(init?.headers || {}),
          'Authorization': `Bearer ${token}`
        }
      }
      return originalFetch(input, newInit)
    }

    return originalFetch(input, init)
  }

  isInterceptorSetup = true
}