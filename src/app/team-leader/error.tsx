'use client'

import { Button } from '@/components/ui/button'

export default function TeamLeaderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Algo salió mal</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </div>
  )
}
