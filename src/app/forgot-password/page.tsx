'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el correo')
      }

      setSuccess(true)
      setEmail('')
    } catch (error) {
      console.error('Error en forgot-password:', error)
      setError(error instanceof Error ? error.message : 'Error al enviar el correo')
    } finally {
      setLoading(false)
    }
  }

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
            {/* Back Button */}
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </button>

            {/* Logo and Header */}
            <div className="text-center space-y-4">
              {/* Logo */}
              <div className="flex justify-center">
                <Logo size="lg" showText={false} />
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                ¿Olvidaste tu contraseña?
              </h1>

              {/* Description */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
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
                        Correo enviado exitosamente
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Si el correo existe en nuestro sistema, recibirás un enlace de recuperación en los próximos minutos.
                    Revisa tu bandeja de entrada y la carpeta de spam.
                  </p>
                </div>

                <button
                  onClick={() => router.push('/login')}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                      placeholder="broker@rumirent.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Info Message */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    El enlace de recuperación expirará en 1 hora por razones de seguridad.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
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
