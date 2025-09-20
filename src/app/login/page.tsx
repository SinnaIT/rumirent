'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Mail, Lock, Eye, EyeOff, HelpCircle } from 'lucide-react'
import { AuthRedirect } from '@/components/AuthRedirect'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginSuccess, setLoginSuccess] = useState<{ role: 'ADMIN' | 'CONTRATISTA', token: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Enviando login request...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Error en el login')
      }

      console.log('Login exitoso, iniciando redirección...')

      // Set login success state to trigger AuthRedirect component
      setLoginSuccess({
        role: data.user.role as 'ADMIN' | 'CONTRATISTA',
        token: data.token
      })
    } catch (error) {
      console.error('Error en login:', error)
      setError(error instanceof Error ? error.message : 'Error en el login')
    } finally {
      setLoading(false)
    }
  }

  // If login was successful, show redirect component
  if (loginSuccess) {
    return <AuthRedirect role={loginSuccess.role} token={loginSuccess.token} />
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
    }}>
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Logo and Header */}
            <div className="text-center space-y-4">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                RumiRent
              </h1>

              {/* Subtitle */}
              <h2 className="text-base sm:text-lg font-semibold text-gray-700">
                Panel de Administración
              </h2>

              {/* Description */}
              <p className="text-sm text-gray-500">
                Gestiona tus alquileres y comisiones
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-sm"
                    placeholder="contratista@rumirent.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me and Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Recordarme
                  </label>
                </div>
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
              </button>
            </form>

            {/* Contact admin */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                ¿Necesitas acceso?{' '}
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Contacta al administrador
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 text-white/70 text-xs sm:text-sm flex items-center space-x-1">
        <span className="hidden sm:inline">© 2025 RumiRent. Todos los derechos reservados.</span>
        <span className="sm:hidden">© 2025 RumiRent</span>
      </div>

      {/* Help Button */}
      <div className="absolute bottom-4 right-4">
        <button className="w-10 h-10 sm:w-12 sm:h-12 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-white transition-colors duration-200">
          <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  )
}