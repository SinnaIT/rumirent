export interface Caracteristica {
  id: string
  nombre: string
  valor: string
  icono?: string
  tipoIcono: 'LUCIDE' | 'URL' | 'UPLOAD'
  mostrarEnResumen: boolean
  tipoCaracteristica: {
    id: string
    nombre: string
    descripcion?: string
  }
}
