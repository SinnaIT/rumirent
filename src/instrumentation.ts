/**
 * Next.js Instrumentation File
 * Este archivo se ejecuta automáticamente al iniciar la aplicación
 * tanto en desarrollo como en producción
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Solo ejecutar en el servidor
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Initializing server instrumentation...')

    // Importar dinámicamente para evitar problemas en el cliente
    const { initializeCronJobs } = await import('./lib/cron')

    // Inicializar los trabajos programados
    initializeCronJobs()

    console.log('✅ Server instrumentation initialized successfully')
  }
}

export async function onRequestError(
  err: Error,
  request: Request,
  context: {
    routerKind: 'Pages Router' | 'App Router'
    routePath: string
    routeType: 'render' | 'route' | 'action' | 'middleware'
    revalidateReason?: 'on-demand' | 'stale'
    renderSource?: 'react-server-components' | 'react-server-components-payload' | 'server-rendering'
  }
) {
  // Log de errores para debugging
  console.error('❌ Request error:', {
    error: err.message,
    stack: err.stack,
    route: context.routePath,
    type: context.routeType,
    router: context.routerKind
  })
}
