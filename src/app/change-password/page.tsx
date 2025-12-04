'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([])
  const [success, setSuccess] = useState(false)
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [userRole, setUserRole] = useState<'ADMIN' | 'BROKER' | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated and needs to change password
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })

        if (!response.ok) {
          // User not authenticated, redirect to login
          router.push('/login')
          return
        }

        const data = await response.json()
        setIsFirstLogin(data.user?.mustChangePassword || false)
        setUserRole(data.user?.role || null)
      } catch (error) {
        console.error('Error checking auth:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setErrors([])
    setSuccess(false)

    try {
      const body: {
        currentPassword?: string
        password: string
        confirmPassword: string
      } = {
        password,
        confirmPassword
      }

      // Only send current password if it's not first login
      if (!isFirstLogin) {
        body.currentPassword = currentPassword
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors)
        } else {
          throw new Error(data.error || 'Error al cambiar la contraseña')
        }
        return
      }

      setSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        const dashboardUrl = userRole === 'ADMIN' ? '/admin' : '/broker'
        router.push(dashboardUrl)
      }, 2000)
    } catch (error) {
      console.error('Error en change-password:', error)
      setError(error instanceof Error ? error.message : 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const getFieldError = (field: string) => {
    return errors.find((err) => err.field === field)?.message
  }

  const passwordRequirements = [
    { text: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { text: 'Una letra mayúscula', met: /[A-Z]/.test(password) },
    { text: 'Una letra minúscula', met: /[a-z]/.test(password) },
    { text: 'Un número', met: /[0-9]/.test(password) },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-800 dark:from-gray-900 dark:to-gray-950">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/10 dark:bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Logo and Header */}
            <div className="text-center space-y-4">
              {/* Logo */}
              <div className="flex justify-center">
                <Logo size="lg" showText={false} />
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                {isFirstLogin ? 'Cambio de Contraseña Obligatorio' : 'Cambiar Contraseña'}
              </h1>

              {/* Description */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isFirstLogin
                  ? 'Por seguridad, debes cambiar tu contraseña antes de continuar'
                  : 'Actualiza tu contraseña de acceso'}
              </p>
            </div>

            {success ? (
              /* Success Message */
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        Contraseña actualizada exitosamente
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Serás redirigido al panel de control...
                  </p>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Login Warning */}
                {isFirstLogin && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Este es tu primer inicio de sesión. Por razones de seguridad, debes establecer una nueva contraseña.
                      </p>
                    </div>
                  </div>
                )}

                {/* Current Password Field - Only show if NOT first login */}
                {!isFirstLogin && (
                  <div className="space-y-2">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        className={`block w-full pl-10 pr-10 py-3 border ${
                          getFieldError('currentPassword')
                            ? 'border-red-300 dark:border-red-700'
                            : 'border-gray-200 dark:border-gray-600'
                        } rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-sm`}
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    </div>
                    {getFieldError('currentPassword') && (
                      <p className="text-sm text-red-600 dark:text-red-400">{getFieldError('currentPassword')}</p>
                    )}
                  </div>
                )}

                {/* New Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className={`block w-full pl-10 pr-10 py-3 border ${
                        getFieldError('password')
                          ? 'border-red-300 dark:border-red-700'
                          : 'border-gray-200 dark:border-gray-600'
                      } rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-sm`}
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
                        <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>
                  </div>
                  {getFieldError('password') && (
                    <p className="text-sm text-red-600 dark:text-red-400">{getFieldError('password')}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className={`block w-full pl-10 pr-10 py-3 border ${
                        getFieldError('confirmPassword')
                          ? 'border-red-300 dark:border-red-700'
                          : 'border-gray-200 dark:border-gray-600'
                      } rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-sm`}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>
                  </div>
                  {getFieldError('confirmPassword') && (
                    <p className="text-sm text-red-600 dark:text-red-400">{getFieldError('confirmPassword')}</p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    La contraseña debe contener:
                  </p>
                  <ul className="space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            req.met
                              ? 'bg-green-500 dark:bg-green-600'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          {req.met && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <span
                          className={
                            req.met
                              ? 'text-green-700 dark:text-green-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }
                        >
                          {req.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 text-white/70 text-xs sm:text-sm flex items-center space-x-1">
        <span className="hidden sm:inline">© 2025 RumiRent. Todos los derechos reservados.</span>
        <span className="sm:hidden">© 2025 RumiRent</span>
      </div>
    </div>
  )
}
