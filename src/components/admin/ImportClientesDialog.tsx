'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Download } from 'lucide-react'

interface ImportResult {
  total: number
  created: number
  updated: number
  errors: Array<{
    row: number
    error: string
    data: Record<string, unknown>
  }>
}

interface ErrorState {
  hasError: boolean
  message: string
  details?: string
}

interface ImportClientesDialogProps {
  onImportComplete?: () => void
}

export function ImportClientesDialog({ onImportComplete }: ImportClientesDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [errorState, setErrorState] = useState<ErrorState>({ hasError: false, message: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validar tipo de archivo
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ]

      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx?|csv)$/i)) {
        toast.error('Formato de archivo no válido. Use Excel (.xlsx, .xls) o CSV')
        return
      }

      setFile(selectedFile)
      setImportResult(null)
      setErrorState({ hasError: false, message: '' })
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Por favor seleccione un archivo')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setErrorState({ hasError: false, message: '' })

      const formData = new FormData()
      formData.append('file', file)

      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/admin/clientes/import', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Verificar si la respuesta HTTP fue exitosa
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error del servidor' }))
        setErrorState({
          hasError: true,
          message: errorData.error || `Error HTTP ${response.status}`,
          details: errorData.details || undefined
        })
        toast.error(errorData.error || 'Error al importar clientes')
        return
      }

      const data = await response.json()

      if (data.success) {
        setImportResult(data.results)

        if (data.results.errors.length === 0) {
          toast.success(data.message)
          // Solo llamar callback si no hay errores
          if (onImportComplete) {
            setTimeout(() => {
              onImportComplete()
            }, 1000)
          }
        } else {
          toast.warning(`${data.message}, pero con ${data.results.errors.length} errores`)
          // No cerrar automáticamente si hay errores - usuario debe revisar
        }
      } else {
        // Error general pero con estructura de respuesta
        setErrorState({
          hasError: true,
          message: data.error || 'Error al importar clientes',
          details: data.details || undefined
        })
        toast.error(data.error || 'Error al importar clientes')
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error de conexión'
      setErrorState({
        hasError: true,
        message: 'Error de conexión con el servidor',
        details: errorMessage
      })
      toast.error('Error de conexión')
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setImportResult(null)
    setUploadProgress(0)
    setErrorState({ hasError: false, message: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    handleReset()
    setIsOpen(false)
  }

  const downloadTemplate = () => {
    // Crear un CSV de ejemplo
    const csvContent = `nombre,rut,telefono,correo,direccion,fecha de nacimiento,brokerAsignado
Juan Pérez,12.345.678-9,+56 9 1234 5678,juan@example.com,Calle Principal 123,1990-01-15,carlos.rodriguez@email.com
María González,98.765.432-1,+56 9 8765 4321,maria@example.com,Avenida Central 456,1985-05-20,
Pedro Silva,11.222.333-4,+56 9 2233 4455,pedro@example.com,Pasaje Las Flores 789,1992-08-10,maria.gonzalez@email.com`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', 'plantilla_clientes.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Plantilla descargada')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Importar Clientes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Importar Clientes Masivamente
          </DialogTitle>
          <DialogDescription>
            Sube un archivo Excel (.xlsx, .xls) o CSV con los datos de los clientes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información sobre el formato */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Formato requerido</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
              <p>El archivo debe contener las siguientes columnas:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li><strong>nombre</strong> (requerido)</li>
                <li><strong>rut</strong> (requerido, único)</li>
                <li><strong>telefono</strong> (opcional)</li>
                <li><strong>correo</strong> (opcional)</li>
                <li><strong>direccion</strong> (opcional)</li>
                <li><strong>fecha de nacimiento</strong> (opcional, formato: YYYY-MM-DD)</li>
                <li><strong>brokerAsignado</strong> (opcional, RUT, email o nombre del broker - deje vacío si no tiene broker asignado)</li>
              </ul>
              <div className="mt-3">
                <Button
                  variant="link"
                  size="sm"
                  onClick={downloadTemplate}
                  className="h-auto p-0"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Descargar plantilla CSV de ejemplo
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* Selector de archivo */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />

            {!file ? (
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-muted-foreground">
                  Excel (.xlsx, .xls) o CSV hasta 10MB
                </p>
              </label>
            ) : (
              <div className="space-y-3">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-green-600" />
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isUploading}
                >
                  Cambiar archivo
                </Button>
              </div>
            )}
          </div>

          {/* Progreso de carga */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Importando clientes...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Error general del servidor */}
          {errorState.hasError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error en la importación</AlertTitle>
              <AlertDescription>
                <p className="font-medium">{errorState.message}</p>
                {errorState.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">Ver detalles técnicos</summary>
                    <pre className="mt-2 text-xs bg-red-50 border border-red-200 rounded p-2 overflow-x-auto">
                      {errorState.details}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Resultados de la importación */}
          {importResult && (
            <div className="space-y-3">
              <Alert variant={importResult.errors.length > 0 ? "default" : "default"} className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">Importación completada</AlertTitle>
                <AlertDescription className="text-green-800">
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-green-600">Total procesados</p>
                      <p className="text-lg font-bold">{importResult.total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Creados</p>
                      <p className="text-lg font-bold text-green-700">{importResult.created}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Actualizados</p>
                      <p className="text-lg font-bold text-blue-700">{importResult.updated}</p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Errores encontrados ({importResult.errors.length})</AlertTitle>
                  <AlertDescription>
                    <div className="max-h-[200px] overflow-y-auto mt-2 space-y-2">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-xs bg-red-50 border border-red-200 rounded p-2">
                          <p className="font-medium">Fila {error.row}: {error.error}</p>
                          <p className="text-red-600 mt-1">
                            {JSON.stringify(error.data, null, 2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          {/* Mostrar botón de reintentar si hay error general */}
          {errorState.hasError && !importResult && (
            <Button
              variant="outline"
              onClick={() => setErrorState({ hasError: false, message: '' })}
              disabled={isUploading}
            >
              Limpiar error
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            {importResult || errorState.hasError ? 'Cerrar' : 'Cancelar'}
          </Button>

          {/* Botón de importar solo si no hay resultados previos */}
          {!importResult && !errorState.hasError && (
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? 'Importando...' : 'Importar'}
            </Button>
          )}

          {/* Botón para reintentar después de ver resultados con errores */}
          {(importResult || errorState.hasError) && (
            <Button
              onClick={handleReset}
              disabled={isUploading}
            >
              Importar otro archivo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
