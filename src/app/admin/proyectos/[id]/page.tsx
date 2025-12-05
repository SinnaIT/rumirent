'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Home,
  Settings,
  Image as ImageIcon,
  X,
  Tag,
  CheckCircle,
  XCircle,
  Upload,
  Link,
  Copy
} from 'lucide-react'
import { IconPicker } from '@/components/admin/icon-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import * as LucideIcons from 'lucide-react'

interface TipoUnidad {
  tipo: string
  cantidad: number
}

interface TipoUnidadDetail {
  id: string
  nombre: string
  codigo: string
  comisionId: string
  comision: {
    id: string
    nombre: string
    codigo: string
    porcentaje: number
    activa: boolean
  }
  _count: {
    unidades: number
  }
  createdAt: string
  updatedAt: string
}

interface Comision {
  id: string
  nombre: string
  codigo: string
  porcentaje: number
  activa: boolean
}

interface Unidad {
  id: string
  numero: string
  tipoUnidadEdificioId: string
  estado: 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA'
  descripcion?: string
  metros2?: number
  tipoUnidadEdificio?: {
    id: string
    nombre: string
    codigo: string
  }
}

interface ImagenEdificio {
  id: string
  edificioId: string
  url: string
  descripcion?: string
  orden: number
  imageType: 'URL' | 'UPLOAD'
  createdAt: string
  updatedAt: string
}

interface TipoCaracteristica {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
}

interface CaracteristicaEdificio {
  id: string
  edificioId: string
  tipoCaracteristicaId: string
  nombre: string
  valor: string
  mostrarEnResumen: boolean
  icono?: string
  tipoIcono: 'LUCIDE' | 'URL' | 'UPLOAD'
  tipoCaracteristica: TipoCaracteristica
  createdAt: string
  updatedAt: string
}

interface EdificioDetail {
  id: string
  nombre: string
  direccion: string
  ciudad: string
  comuna: string
  region: string
  codigoPostal?: string
  urlGoogleMaps?: string
  telefono?: string
  email?: string
  descripcion?: string
  totalUnidades: number
  totalTiposUnidad: number
  unidadesDisponibles: number
  unidadesVendidas: number
  unidadesReservadas: number
  unidades: Unidad[]
  tiposUnidad: TipoUnidad[]
  comision?: {
    id: string
    nombre: string
    codigo: string
    porcentaje: number
    activa: boolean
  }
  createdAt: string
  updatedAt: string
}


export default function ProyectoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [edificio, setEdificio] = useState<EdificioDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateUnidadDialogOpen, setIsCreateUnidadDialogOpen] = useState(false)
  const [editingUnidad, setEditingUnidad] = useState<Unidad | null>(null)
  const [activeTab, setActiveTab] = useState('informacion')

  // State for editing project information
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [infoFormData, setInfoFormData] = useState({
    nombre: '',
    direccion: '',
    ciudad: '',
    comuna: '',
    region: '',
    codigoPostal: '',
    telefono: '',
    email: '',
    urlGoogleMaps: '',
    descripcion: ''
  })

  // Tipos de unidad state
  const [tiposUnidadDetalle, setTiposUnidadDetalle] = useState<TipoUnidadDetail[]>([])
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [isCreateTipoUnidadDialogOpen, setIsCreateTipoUnidadDialogOpen] = useState(false)
  const [editingTipoUnidad, setEditingTipoUnidad] = useState<TipoUnidadDetail | null>(null)
  const [loadingTiposUnidad, setLoadingTiposUnidad] = useState(false)

  // Plantillas state
  const [plantillas, setPlantillas] = useState<any[]>([])
  const [loadingPlantillas, setLoadingPlantillas] = useState(false)
  const [togglingPlantilla, setTogglingPlantilla] = useState<string | null>(null)

  // Dialog states
  const [isNewPlantillaDialogOpen, setIsNewPlantillaDialogOpen] = useState(false)
  const [isEditComisionDialogOpen, setIsEditComisionDialogOpen] = useState(false)
  const [editingComisionTipo, setEditingComisionTipo] = useState<TipoUnidadDetail | null>(null)

  // Form state for new plantilla
  const [newPlantillaFormData, setNewPlantillaFormData] = useState({
    nombre: '',
    codigo: '',
    bedrooms: '',
    bathrooms: '',
    descripcion: ''
  })

  // Form state for editing commission
  const [comisionFormData, setComisionFormData] = useState({
    comisionId: 'none'
  })


  // Form state for unidades
  const [unidadFormData, setUnidadFormData] = useState<{
    numero: string
    tipoUnidadEdificioId: string
    estado: 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA'
    descripcion: string
    metros2: string
  }>({
    numero: '',
    tipoUnidadEdificioId: '',
    estado: 'DISPONIBLE',
    descripcion: '',
    metros2: ''
  })

  // Form state for tipos de unidad
  const [tipoUnidadFormData, setTipoUnidadFormData] = useState({
    nombre: '',
    codigo: '',
    comisionId: ''
  })

  // Imágenes state
  const [imagenes, setImagenes] = useState<ImagenEdificio[]>([])
  const [loadingImagenes, setLoadingImagenes] = useState(false)
  const [isCreateImagenDialogOpen, setIsCreateImagenDialogOpen] = useState(false)
  const [imagenUploadType, setImagenUploadType] = useState<'url' | 'file'>('url')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagenFormData, setImagenFormData] = useState({
    url: '',
    descripcion: '',
    orden: ''
  })

  // Características state
  const [caracteristicas, setCaracteristicas] = useState<CaracteristicaEdificio[]>([])
  const [tiposCaracteristica, setTiposCaracteristica] = useState<TipoCaracteristica[]>([])
  const [loadingCaracteristicas, setLoadingCaracteristicas] = useState(false)
  const [isCreateCaracteristicaDialogOpen, setIsCreateCaracteristicaDialogOpen] = useState(false)
  const [isCreateTipoDialogOpen, setIsCreateTipoDialogOpen] = useState(false)
  const [editingCaracteristica, setEditingCaracteristica] = useState<CaracteristicaEdificio | null>(null)
  const [caracteristicaFormData, setCaracteristicaFormData] = useState({
    tipoCaracteristicaId: '',
    nombre: '',
    valor: '',
    mostrarEnResumen: true,
    icono: '',
    tipoIcono: 'LUCIDE' as 'LUCIDE' | 'URL' | 'UPLOAD'
  })
  const [nuevoTipoFormData, setNuevoTipoFormData] = useState({
    nombre: '',
    descripcion: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchEdificio()
      fetchComisiones()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    if (params.id && activeTab === 'tipos-unidad') {
      fetchTiposUnidadDetalle()
      fetchPlantillas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, activeTab])

  useEffect(() => {
    if (params.id && activeTab === 'imagenes') {
      fetchImagenes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, activeTab])

  useEffect(() => {
    if (params.id && activeTab === 'caracteristicas') {
      fetchCaracteristicas()
      fetchTiposCaracteristica()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, activeTab])

  const fetchEdificio = async () => {
    try {
      setLoading(true)
      console.log('🔄 Refrescando datos del edificio...')
      const response = await fetch(`/api/admin/edificios/${params.id}`)
      const data = await response.json()

      console.log('📦 Datos del edificio recibidos:', data)

      if (data.success) {
        setEdificio(data.edificio)
        // Initialize form data with current values
        setInfoFormData({
          nombre: data.edificio.nombre || '',
          direccion: data.edificio.direccion || '',
          ciudad: data.edificio.ciudad || '',
          comuna: data.edificio.comuna || '',
          region: data.edificio.region || '',
          codigoPostal: data.edificio.codigoPostal || '',
          telefono: data.edificio.telefono || '',
          email: data.edificio.email || '',
          urlGoogleMaps: data.edificio.urlGoogleMaps || '',
          descripcion: data.edificio.descripcion || ''
        })
        console.log('✅ Edificio actualizado en estado local')
      } else {
        toast.error('Error al cargar proyecto')
        router.push('/admin/proyectos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
      router.push('/admin/proyectos')
    } finally {
      setLoading(false)
    }
  }

  const fetchTiposUnidadDetalle = async () => {
    try {
      setLoadingTiposUnidad(true)
      const response = await fetch(`/api/admin/edificios/${params.id}/tipos-unidad`)
      const data = await response.json()

      if (data.success) {
        setTiposUnidadDetalle(data.tiposUnidad)
      } else {
        toast.error('Error al cargar tipos de unidad')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoadingTiposUnidad(false)
    }
  }

  const fetchComisiones = async () => {
    try {
      const response = await fetch('/api/admin/comisiones')
      const data = await response.json()

      if (data.success) {
        setComisiones(data.comisiones)
      } else {
        console.error('Error al cargar comisiones')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchImagenes = async () => {
    try {
      setLoadingImagenes(true)
      const response = await fetch(`/api/admin/edificios/${params.id}/imagenes`)
      const data = await response.json()

      if (data.success) {
        setImagenes(data.imagenes)
      } else {
        toast.error('Error al cargar imágenes')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoadingImagenes(false)
    }
  }

  const resetImagenForm = () => {
    setImagenFormData({
      url: '',
      descripcion: '',
      orden: ''
    })
    setSelectedFile(null)
    setImagenUploadType('url')
  }

  const handleSubmitImagen = async () => {
    // Validations
    if (imagenUploadType === 'url') {
      if (!imagenFormData.url.trim()) {
        toast.error('La URL de la imagen es requerida')
        return
      }
    } else {
      if (!selectedFile) {
        toast.error('Por favor selecciona un archivo')
        return
      }
    }

    try {
      setSaving(true)
      let response

      if (imagenUploadType === 'file' && selectedFile) {
        // Upload file using FormData
        const formData = new FormData()
        formData.append('file', selectedFile)
        if (imagenFormData.descripcion) {
          formData.append('descripcion', imagenFormData.descripcion)
        }
        if (imagenFormData.orden) {
          formData.append('orden', imagenFormData.orden)
        }

        response = await fetch(`/api/admin/edificios/${params.id}/imagenes`, {
          method: 'POST',
          body: formData
        })
      } else {
        // Upload URL using JSON
        response = await fetch(`/api/admin/edificios/${params.id}/imagenes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: imagenFormData.url,
            descripcion: imagenFormData.descripcion || undefined,
            orden: imagenFormData.orden ? parseInt(imagenFormData.orden) : undefined
          })
        })
      }

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setIsCreateImagenDialogOpen(false)
        resetImagenForm()
        fetchImagenes()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        toast.error('Tipo de archivo no válido. Usa JPEG, PNG, WebP o GIF')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error('El archivo no debe superar los 5MB')
        return
      }

      setSelectedFile(file)
    }
  }

  const handleDeleteImagen = async (imagenId: string) => {
    try {
      const response = await fetch(`/api/admin/edificios/${params.id}/imagenes?imagenId=${imagenId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchImagenes()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }

  // Características functions
  const fetchCaracteristicas = async () => {
    try {
      setLoadingCaracteristicas(true)
      const response = await fetch(`/api/admin/edificios/${params.id}/caracteristicas`)
      const data = await response.json()

      if (data.success) {
        setCaracteristicas(data.caracteristicas)
      } else {
        toast.error('Error al cargar características')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoadingCaracteristicas(false)
    }
  }

  const fetchTiposCaracteristica = async () => {
    try {
      const response = await fetch('/api/admin/tipos-caracteristica')
      const data = await response.json()

      if (data.success) {
        setTiposCaracteristica(data.tiposCaracteristica.filter((t: TipoCaracteristica) => t.activo))
      } else {
        console.error('Error al cargar tipos de característica')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const resetCaracteristicaForm = () => {
    setCaracteristicaFormData({
      tipoCaracteristicaId: '',
      nombre: '',
      valor: '',
      mostrarEnResumen: true,
      icono: '',
      tipoIcono: 'LUCIDE'
    })
    setEditingCaracteristica(null)
  }

  const resetNuevoTipoForm = () => {
    setNuevoTipoFormData({
      nombre: '',
      descripcion: ''
    })
  }

  const handleOpenCreateCaracteristicaDialog = () => {
    resetCaracteristicaForm()
    setIsCreateCaracteristicaDialogOpen(true)
  }

  const handleCreateNuevoTipo = async () => {
    if (!nuevoTipoFormData.nombre.trim()) {
      toast.error('El nombre del tipo es requerido')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/tipos-caracteristica', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoTipoFormData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Tipo de característica creado exitosamente')
        setIsCreateTipoDialogOpen(false)
        resetNuevoTipoForm()
        // Recargar tipos y seleccionar el nuevo
        await fetchTiposCaracteristica()
        setCaracteristicaFormData({ ...caracteristicaFormData, tipoCaracteristicaId: data.tipoCaracteristica.id })
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear tipo de característica')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenEditCaracteristicaDialog = (caracteristica: CaracteristicaEdificio) => {
    setCaracteristicaFormData({
      tipoCaracteristicaId: caracteristica.tipoCaracteristicaId,
      nombre: caracteristica.nombre,
      valor: caracteristica.valor,
      mostrarEnResumen: caracteristica.mostrarEnResumen,
      icono: caracteristica.icono || '',
      tipoIcono: caracteristica.tipoIcono
    })
    setEditingCaracteristica(caracteristica)
    setIsCreateCaracteristicaDialogOpen(true)
  }

  const handleSubmitCaracteristica = async () => {
    if (!caracteristicaFormData.tipoCaracteristicaId || !caracteristicaFormData.nombre.trim() || !caracteristicaFormData.valor.trim()) {
      toast.error('Tipo, nombre y valor son requeridos')
      return
    }

    try {
      setSaving(true)
      const url = editingCaracteristica
        ? `/api/admin/edificios/${params.id}/caracteristicas`
        : `/api/admin/edificios/${params.id}/caracteristicas`

      const method = editingCaracteristica ? 'PUT' : 'POST'

      const payload = editingCaracteristica
        ? { caracteristicaId: editingCaracteristica.id, ...caracteristicaFormData }
        : caracteristicaFormData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setIsCreateCaracteristicaDialogOpen(false)
        resetCaracteristicaForm()
        fetchCaracteristicas()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCaracteristica = async (caracteristicaId: string) => {
    try {
      const response = await fetch(`/api/admin/edificios/${params.id}/caracteristicas?caracteristicaId=${caracteristicaId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchCaracteristicas()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }



  // Plantillas functions
  const fetchPlantillas = async () => {
    try {
      setLoadingPlantillas(true)
      const response = await fetch('/api/admin/plantillas-tipo-unidad?activeOnly=true')
      const data = await response.json()

      if (data.success) {
        setPlantillas(data.templates)
      } else {
        console.error('Error al cargar plantillas')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoadingPlantillas(false)
    }
  }

  const handleTogglePlantillaCheckbox = async (plantillaId: string) => {
    try {
      setTogglingPlantilla(plantillaId)
      const response = await fetch(`/api/admin/edificios/${params.id}/tipos-unidad/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plantillaId })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        // Refresh both lists
        fetchTiposUnidadDetalle()
        fetchEdificio()
      } else {
        toast.error(data.error || 'Error al aplicar plantilla')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setTogglingPlantilla(null)
    }
  }

  const handleOpenNewPlantillaDialog = () => {
    setNewPlantillaFormData({
      nombre: '',
      codigo: '',
      bedrooms: '',
      bathrooms: '',
      descripcion: ''
    })
    setIsNewPlantillaDialogOpen(true)
  }

  const handleSubmitNewPlantilla = async () => {
    if (!newPlantillaFormData.nombre.trim() || !newPlantillaFormData.codigo.trim()) {
      toast.error('Nombre y código son requeridos')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/plantillas-tipo-unidad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: newPlantillaFormData.nombre,
          codigo: newPlantillaFormData.codigo.toUpperCase(),
          bedrooms: newPlantillaFormData.bedrooms ? parseInt(newPlantillaFormData.bedrooms) : null,
          bathrooms: newPlantillaFormData.bathrooms ? parseInt(newPlantillaFormData.bathrooms) : null,
          descripcion: newPlantillaFormData.descripcion || null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Plantilla creada exitosamente')
        setIsNewPlantillaDialogOpen(false)
        fetchPlantillas()
      } else {
        toast.error(data.error || 'Error al crear plantilla')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenEditComisionDialog = (tipoUnidad: TipoUnidadDetail) => {
    setEditingComisionTipo(tipoUnidad)
    setComisionFormData({
      comisionId: tipoUnidad.comisionId || 'none'
    })
    setIsEditComisionDialogOpen(true)
  }

  const handleSubmitComision = async () => {
    if (!editingComisionTipo) return

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/edificios/${params.id}/tipos-unidad/${editingComisionTipo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: editingComisionTipo.nombre,
          codigo: editingComisionTipo.codigo,
          comisionId: comisionFormData.comisionId === 'none' ? null : comisionFormData.comisionId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Comisión actualizada exitosamente')
        setIsEditComisionDialogOpen(false)
        setEditingComisionTipo(null)
        fetchTiposUnidadDetalle()
      } else {
        toast.error(data.error || 'Error al actualizar comisión')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Tipo Unidad management functions
  const resetTipoUnidadForm = () => {
    setTipoUnidadFormData({
      nombre: '',
      codigo: '',
      comisionId: ''
    })
    setEditingTipoUnidad(null)
  }

  const handleOpenCreateTipoUnidadDialog = () => {
    resetTipoUnidadForm()
    setIsCreateTipoUnidadDialogOpen(true)
  }

  const handleOpenEditTipoUnidadDialog = (tipoUnidad: TipoUnidadDetail) => {
    setTipoUnidadFormData({
      nombre: tipoUnidad.nombre,
      codigo: tipoUnidad.codigo,
      comisionId: tipoUnidad.comisionId || 'none'
    })
    setEditingTipoUnidad(tipoUnidad)
    setIsCreateTipoUnidadDialogOpen(true)
  }

  const handleSubmitTipoUnidad = async () => {
    if (!tipoUnidadFormData.nombre.trim() || !tipoUnidadFormData.codigo.trim()) {
      toast.error('Nombre y código son requeridos')
      return
    }

    try {
      setSaving(true)
      const url = editingTipoUnidad
        ? `/api/admin/edificios/${params.id}/tipos-unidad/${editingTipoUnidad.id}`
        : `/api/admin/edificios/${params.id}/tipos-unidad`

      const method = editingTipoUnidad ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tipoUnidadFormData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setIsCreateTipoUnidadDialogOpen(false)
        resetTipoUnidadForm()
        fetchTiposUnidadDetalle()
        fetchEdificio() // Refresh para actualizar estadísticas
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTipoUnidad = async (tipoUnidad: TipoUnidadDetail) => {
    try {
      const response = await fetch(`/api/admin/edificios/${params.id}/tipos-unidad/${tipoUnidad.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchTiposUnidadDetalle()
        fetchEdificio() // Refresh para actualizar estadísticas
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }

  // Unidad management functions
  const resetUnidadForm = () => {
    setUnidadFormData({
      numero: '',
      tipoUnidadEdificioId: '',
      estado: 'DISPONIBLE',
      descripcion: '',
      metros2: ''
    })
    setEditingUnidad(null)
  }

  const handleOpenCreateUnidadDialog = () => {
    resetUnidadForm()
    setIsCreateUnidadDialogOpen(true)
  }

  const handleOpenEditUnidadDialog = (unidad: Unidad) => {
    console.log('🔧 Abriendo edición de unidad:', unidad)
    console.log('🔍 Tipos de unidad disponibles:', tiposUnidadDetalle)
    console.log('🎯 tipoUnidadEdificioId de la unidad:', unidad.tipoUnidadEdificioId)
    console.log('🎯 tipoUnidadEdificio completo:', unidad.tipoUnidadEdificio)

    const formData = {
      numero: unidad.numero,
      tipoUnidadEdificioId: unidad.tipoUnidadEdificioId,
      estado: unidad.estado,
      descripcion: unidad.descripcion || '',
      metros2: unidad.metros2?.toString() || ''
    }

    console.log('📝 Form data que se va a establecer:', formData)

    setUnidadFormData(formData)
    setEditingUnidad(unidad)
    setIsCreateUnidadDialogOpen(true)
  }

  const handleSubmitUnidad = async () => {
    console.log('📝 Datos del formulario antes de enviar:', unidadFormData)
    console.log('🔄 Editando unidad:', editingUnidad)

    if (!unidadFormData.numero.trim() || !unidadFormData.tipoUnidadEdificioId) {
      toast.error('Número y tipo de unidad son requeridos')
      return
    }

    const metros2 = unidadFormData.metros2 ? parseFloat(unidadFormData.metros2) : undefined
    if (metros2 && (isNaN(metros2) || metros2 <= 0)) {
      toast.error('Los metros cuadrados deben ser un número válido mayor a 0')
      return
    }

    try {
      setSaving(true)
      const url = editingUnidad
        ? `/api/admin/unidades/${editingUnidad.id}`
        : '/api/admin/unidades'

      const method = editingUnidad ? 'PUT' : 'POST'

      const payload = {
        numero: unidadFormData.numero,
        tipoUnidadEdificioId: unidadFormData.tipoUnidadEdificioId,
        estado: unidadFormData.estado,
        descripcion: unidadFormData.descripcion || undefined,
        metros2,
        edificioId: params.id
      }

      console.log('📤 Payload enviado:', payload)
      console.log('🌐 URL:', url)
      console.log('🔧 Método:', method)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      console.log('📥 Respuesta del servidor:', data)

      if (data.success) {
        toast.success(data.message)
        setIsCreateUnidadDialogOpen(false)
        resetUnidadForm()
        fetchEdificio()
      } else {
        console.error('❌ Error del servidor:', data)
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUnidad = async (unidad: Unidad) => {
    try {
      const response = await fetch(`/api/admin/unidades/${unidad.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchEdificio()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }

  // Project information handlers
  const handleEditInfo = () => {
    if (edificio) {
      setInfoFormData({
        nombre: edificio.nombre || '',
        direccion: edificio.direccion || '',
        ciudad: edificio.ciudad || '',
        comuna: edificio.comuna || '',
        region: edificio.region || '',
        codigoPostal: edificio.codigoPostal || '',
        telefono: edificio.telefono || '',
        email: edificio.email || '',
        urlGoogleMaps: edificio.urlGoogleMaps || '',
        descripcion: edificio.descripcion || ''
      })
      setIsEditingInfo(true)
    }
  }

  const handleCancelEditInfo = () => {
    setIsEditingInfo(false)
    if (edificio) {
      setInfoFormData({
        nombre: edificio.nombre || '',
        direccion: edificio.direccion || '',
        ciudad: edificio.ciudad || '',
        comuna: edificio.comuna || '',
        region: edificio.region || '',
        codigoPostal: edificio.codigoPostal || '',
        telefono: edificio.telefono || '',
        email: edificio.email || '',
        urlGoogleMaps: edificio.urlGoogleMaps || '',
        descripcion: edificio.descripcion || ''
      })
    }
  }

  const handleSaveInfo = async () => {
    if (!infoFormData.nombre.trim() || !infoFormData.direccion.trim()) {
      toast.error('Nombre y dirección son requeridos')
      return
    }

    if (!infoFormData.ciudad.trim() || !infoFormData.comuna.trim() || !infoFormData.region.trim()) {
      toast.error('Ciudad, comuna y región son requeridos')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/edificios/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(infoFormData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Información actualizada exitosamente')
        setIsEditingInfo(false)
        await fetchEdificio()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (!edificio) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/proyectos')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{edificio.nombre}</h1>
            <p className="text-muted-foreground flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {edificio.direccion}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={fetchEdificio}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Unidades</p>
                <p className="text-2xl font-bold">{edificio.totalUnidades}</p>
              </div>
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipos de Unidad</p>
                <p className="text-2xl font-bold">{edificio.totalTiposUnidad}</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unidades Vendidas</p>
                <p className="text-2xl font-bold">{edificio.unidadesVendidas}</p>
              </div>
              <Home className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold">{edificio.unidadesDisponibles}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="informacion">Información</TabsTrigger>
          <TabsTrigger value="imagenes">Imágenes</TabsTrigger>
          <TabsTrigger value="caracteristicas">Características</TabsTrigger>
          <TabsTrigger value="tipos-unidad">Tipos de Unidad</TabsTrigger>
          <TabsTrigger value="unidades">Unidades</TabsTrigger>
        </TabsList>

        <TabsContent value="informacion" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Información del Proyecto</CardTitle>
                  <CardDescription>
                    Datos básicos y de contacto del proyecto inmobiliario
                  </CardDescription>
                </div>
                {!isEditingInfo ? (
                  <Button onClick={handleEditInfo} variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCancelEditInfo}
                      variant="outline"
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveInfo}
                      disabled={saving}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Proyecto *</Label>
                    <Input
                      id="nombre"
                      value={isEditingInfo ? infoFormData.nombre : (edificio?.nombre || '')}
                      onChange={(e) => setInfoFormData({ ...infoFormData, nombre: e.target.value })}
                      disabled={!isEditingInfo}
                      className={!isEditingInfo ? "bg-muted" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección (Calle y Número) *</Label>
                    <Input
                      id="direccion"
                      value={isEditingInfo ? infoFormData.direccion : (edificio?.direccion || '')}
                      onChange={(e) => setInfoFormData({ ...infoFormData, direccion: e.target.value })}
                      disabled={!isEditingInfo}
                      className={!isEditingInfo ? "bg-muted" : ""}
                      placeholder={isEditingInfo ? "ej: Av. Apoquindo 1234" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad *</Label>
                    <Input
                      id="ciudad"
                      value={isEditingInfo ? infoFormData.ciudad : (edificio?.ciudad || '')}
                      onChange={(e) => setInfoFormData({ ...infoFormData, ciudad: e.target.value })}
                      disabled={!isEditingInfo}
                      className={!isEditingInfo ? "bg-muted" : ""}
                      placeholder={isEditingInfo ? "ej: Santiago" : "No especificado"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comuna">Comuna *</Label>
                    <Input
                      id="comuna"
                      value={isEditingInfo ? infoFormData.comuna : (edificio?.comuna || '')}
                      onChange={(e) => setInfoFormData({ ...infoFormData, comuna: e.target.value })}
                      disabled={!isEditingInfo}
                      className={!isEditingInfo ? "bg-muted" : ""}
                      placeholder={isEditingInfo ? "ej: Las Condes" : "No especificado"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Región *</Label>
                    <Input
                      id="region"
                      value={isEditingInfo ? infoFormData.region : (edificio?.region || '')}
                      onChange={(e) => setInfoFormData({ ...infoFormData, region: e.target.value })}
                      disabled={!isEditingInfo}
                      className={!isEditingInfo ? "bg-muted" : ""}
                      placeholder={isEditingInfo ? "ej: Región Metropolitana" : "No especificado"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigoPostal">Código Postal</Label>
                    <Input
                      id="codigoPostal"
                      value={isEditingInfo ? infoFormData.codigoPostal : (edificio?.codigoPostal || '')}
                      onChange={(e) => setInfoFormData({ ...infoFormData, codigoPostal: e.target.value })}
                      disabled={!isEditingInfo}
                      className={!isEditingInfo ? "bg-muted" : ""}
                      placeholder={isEditingInfo ? "ej: 7550000" : "No especificado"}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="urlGoogleMaps">URL Google Maps</Label>
                    <div className="flex gap-2">
                      <Input
                        id="urlGoogleMaps"
                        value={isEditingInfo ? infoFormData.urlGoogleMaps : (edificio?.urlGoogleMaps || '')}
                        onChange={(e) => setInfoFormData({ ...infoFormData, urlGoogleMaps: e.target.value })}
                        disabled={!isEditingInfo}
                        className={!isEditingInfo ? "bg-muted flex-1" : "flex-1"}
                        placeholder={isEditingInfo ? "https://maps.google.com/..." : "No especificado"}
                      />
                      {!isEditingInfo && edificio?.urlGoogleMaps && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(edificio.urlGoogleMaps, '_blank')}
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono de Contacto</Label>
                    <Input
                      id="telefono"
                      value={isEditingInfo ? infoFormData.telefono : (edificio?.telefono || '')}
                      onChange={(e) => setInfoFormData({ ...infoFormData, telefono: e.target.value })}
                      disabled={!isEditingInfo}
                      className={!isEditingInfo ? "bg-muted" : ""}
                      placeholder={isEditingInfo ? "ej: +56 9 1234 5678" : "No especificado"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Contacto</Label>
                    <Input
                      id="email"
                      type="email"
                      value={isEditingInfo ? infoFormData.email : (edificio?.email || '')}
                      onChange={(e) => setInfoFormData({ ...infoFormData, email: e.target.value })}
                      disabled={!isEditingInfo}
                      className={!isEditingInfo ? "bg-muted" : ""}
                      placeholder={isEditingInfo ? "ej: contacto@proyecto.cl" : "No especificado"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={isEditingInfo ? infoFormData.descripcion : (edificio?.descripcion || '')}
                    onChange={(e) => setInfoFormData({ ...infoFormData, descripcion: e.target.value })}
                    disabled={!isEditingInfo}
                    className={!isEditingInfo ? "bg-muted" : ""}
                    placeholder={isEditingInfo ? "Descripción del proyecto..." : "Sin descripción"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imagenes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Imágenes del Proyecto</CardTitle>
                  <CardDescription>
                    Gestiona las imágenes que se mostrarán en el proyecto
                  </CardDescription>
                </div>
                <Dialog open={isCreateImagenDialogOpen} onOpenChange={setIsCreateImagenDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetImagenForm(); setIsCreateImagenDialogOpen(true) }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Imagen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Agregar Imagen</DialogTitle>
                      <DialogDescription>
                        Agrega una nueva imagen al proyecto mediante URL o subiendo un archivo
                      </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="grid gap-4 py-4">
                      {/* Toggle between URL and File upload */}
                      <div className="flex gap-2 p-1 bg-muted rounded-lg">
                        <Button
                          type="button"
                          variant={imagenUploadType === 'url' ? 'default' : 'ghost'}
                          className="flex-1"
                          onClick={() => setImagenUploadType('url')}
                        >
                          URL
                        </Button>
                        <Button
                          type="button"
                          variant={imagenUploadType === 'file' ? 'default' : 'ghost'}
                          className="flex-1"
                          onClick={() => setImagenUploadType('file')}
                        >
                          Subir Archivo
                        </Button>
                      </div>

                      {/* URL Input */}
                      {imagenUploadType === 'url' && (
                        <div className="grid grid-cols-1 gap-2">
                          <Label htmlFor="url">URL de la Imagen *</Label>
                          <Input
                            id="url"
                            value={imagenFormData.url}
                            onChange={(e) => setImagenFormData({ ...imagenFormData, url: e.target.value })}
                            placeholder="https://ejemplo.com/imagen.jpg"
                          />
                        </div>
                      )}

                      {/* File Upload Input */}
                      {imagenUploadType === 'file' && (
                        <div className="grid grid-cols-1 gap-2">
                          <Label htmlFor="file">Archivo de Imagen *</Label>
                          <Input
                            id="file"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            onChange={handleFileChange}
                          />
                          {selectedFile && (
                            <p className="text-sm text-muted-foreground">
                              Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Formatos aceptados: JPEG, PNG, WebP, GIF. Máximo 5MB.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="descripcion-imagen">Descripción</Label>
                        <Input
                          id="descripcion-imagen"
                          value={imagenFormData.descripcion}
                          onChange={(e) => setImagenFormData({ ...imagenFormData, descripcion: e.target.value })}
                          placeholder="Descripción de la imagen..."
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="orden">Orden (opcional)</Label>
                        <Input
                          id="orden"
                          type="number"
                          value={imagenFormData.orden}
                          onChange={(e) => setImagenFormData({ ...imagenFormData, orden: e.target.value })}
                          placeholder="1"
                        />
                      </div>
                      </div>
                    </ScrollArea>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateImagenDialogOpen(false)}
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmitImagen} disabled={saving}>
                        {saving ? 'Guardando...' : 'Agregar'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingImagenes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Cargando imágenes...</p>
                  </div>
                </div>
              ) : imagenes.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay imágenes</h3>
                  <p className="text-muted-foreground mb-4">
                    Agrega la primera imagen para este proyecto
                  </p>
                  <Button onClick={() => { resetImagenForm(); setIsCreateImagenDialogOpen(true) }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primera Imagen
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imagenes.map((imagen) => (
                    <div key={imagen.id} className="relative group rounded-lg border overflow-hidden">
                      <div className="aspect-video relative">
                        <img
                          src={imagen.url}
                          alt={imagen.descripcion || 'Imagen del proyecto'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Error+al+cargar'
                          }}
                        />
                        <div className="absolute top-2 left-2 flex gap-2">
                          <Badge variant="secondary">#{imagen.orden}</Badge>
                          <Badge variant={imagen.imageType === 'UPLOAD' ? 'default' : 'outline'} className="flex items-center gap-1">
                            {imagen.imageType === 'UPLOAD' ? (
                              <>
                                <Upload className="h-3 w-3" />
                                Subida
                              </>
                            ) : (
                              <>
                                <Link className="h-3 w-3" />
                                URL
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente esta imagen del proyecto.
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteImagen(imagen.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {imagen.descripcion && (
                        <div className="p-3 bg-muted">
                          <p className="text-sm text-muted-foreground">{imagen.descripcion}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caracteristicas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Características del Proyecto</CardTitle>
                  <CardDescription>
                    Define las amenidades, servicios y características destacadas
                  </CardDescription>
                </div>
                <Dialog open={isCreateCaracteristicaDialogOpen} onOpenChange={setIsCreateCaracteristicaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleOpenCreateCaracteristicaDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Característica
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCaracteristica ? 'Editar Característica' : 'Nueva Característica'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingCaracteristica
                          ? 'Modifica los datos de la característica existente'
                          : 'Agrega una nueva característica al proyecto'
                        }
                      </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="tipoCaracteristica">Tipo de Característica *</Label>
                          <Dialog open={isCreateTipoDialogOpen} onOpenChange={setIsCreateTipoDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7"
                                onClick={() => setIsCreateTipoDialogOpen(true)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Nuevo Tipo
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Nuevo Tipo de Característica</DialogTitle>
                                <DialogDescription>
                                  Crea un nuevo tipo para categorizar las características
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="tipo-nombre">Nombre *</Label>
                                  <Input
                                    id="tipo-nombre"
                                    value={nuevoTipoFormData.nombre}
                                    onChange={(e) => setNuevoTipoFormData({ ...nuevoTipoFormData, nombre: e.target.value })}
                                    placeholder="ej: Amenidades, Seguridad, Deportivas..."
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="tipo-descripcion">Descripción (opcional)</Label>
                                  <Input
                                    id="tipo-descripcion"
                                    value={nuevoTipoFormData.descripcion}
                                    onChange={(e) => setNuevoTipoFormData({ ...nuevoTipoFormData, descripcion: e.target.value })}
                                    placeholder="Descripción del tipo de característica..."
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setIsCreateTipoDialogOpen(false)
                                    resetNuevoTipoForm()
                                  }}
                                  disabled={saving}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleCreateNuevoTipo}
                                  disabled={saving}
                                >
                                  {saving ? 'Creando...' : 'Crear Tipo'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <Select
                          value={caracteristicaFormData.tipoCaracteristicaId}
                          onValueChange={(value) => setCaracteristicaFormData({ ...caracteristicaFormData, tipoCaracteristicaId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposCaracteristica.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id}>
                                {tipo.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-1 gap-2">
                          <Label htmlFor="nombre-carac">Nombre *</Label>
                          <Input
                            id="nombre-carac"
                            value={caracteristicaFormData.nombre}
                            onChange={(e) => setCaracteristicaFormData({ ...caracteristicaFormData, nombre: e.target.value })}
                            placeholder="ej: Piscina"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <Label htmlFor="valor-carac">Valor *</Label>
                          <Input
                            id="valor-carac"
                            value={caracteristicaFormData.valor}
                            onChange={(e) => setCaracteristicaFormData({ ...caracteristicaFormData, valor: e.target.value })}
                            placeholder="ej: Temperada todo el año"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <IconPicker
                          value={caracteristicaFormData.icono}
                          onChange={(iconName) => setCaracteristicaFormData({ ...caracteristicaFormData, icono: iconName })}
                          label="Icono"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="mostrarEnResumen"
                          checked={caracteristicaFormData.mostrarEnResumen}
                          onCheckedChange={(checked) => setCaracteristicaFormData({ ...caracteristicaFormData, mostrarEnResumen: !!checked })}
                        />
                        <Label
                          htmlFor="mostrarEnResumen"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Mostrar en resumen
                        </Label>
                      </div>
                      </div>
                    </ScrollArea>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateCaracteristicaDialogOpen(false)}
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmitCaracteristica} disabled={saving}>
                        {saving ? 'Guardando...' : (editingCaracteristica ? 'Actualizar' : 'Crear')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCaracteristicas ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Cargando características...</p>
                  </div>
                </div>
              ) : caracteristicas.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay características</h3>
                  <p className="text-muted-foreground mb-4">
                    Agrega la primera característica para este proyecto
                  </p>
                  <Button onClick={handleOpenCreateCaracteristicaDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primera Característica
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Icono</TableHead>
                        <TableHead>Característica</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>En Resumen</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caracteristicas.map((caracteristica) => {
                        const IconComponent = caracteristica.icono && LucideIcons[caracteristica.icono as keyof typeof LucideIcons]
                          ? (LucideIcons[caracteristica.icono as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>)
                          : null

                        return (
                          <TableRow key={caracteristica.id}>
                            <TableCell>
                              {IconComponent ? (
                                <IconComponent className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Tag className="h-5 w-5 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{caracteristica.nombre}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{caracteristica.tipoCaracteristica.nombre}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">{caracteristica.valor}</div>
                            </TableCell>
                            <TableCell>
                              {caracteristica.mostrarEnResumen ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditCaracteristicaDialog(caracteristica)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar característica?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción eliminará permanentemente la característica &quot;{caracteristica.nombre}&quot;.
                                        Esta acción no se puede deshacer.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteCaracteristica(caracteristica.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tipos-unidad" className="space-y-4">
          {/* Section 1: Available Templates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plantillas Disponibles</CardTitle>
                  <CardDescription>
                    Selecciona las plantillas que deseas usar en este proyecto
                  </CardDescription>
                </div>
                <Button onClick={handleOpenNewPlantillaDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Plantilla
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPlantillas ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Cargando plantillas...</p>
                  </div>
                </div>
              ) : plantillas.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/50">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay plantillas</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea la primera plantilla de tipo de unidad
                  </p>
                  <Button onClick={handleOpenNewPlantillaDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Plantilla
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg divide-y">
                  {plantillas.map((plantilla) => {
                    const isApplied = tiposUnidadDetalle.some(
                      t => t.plantillaOrigenId === plantilla.id
                    )
                    const isToggling = togglingPlantilla === plantilla.id

                    return (
                      <div
                        key={plantilla.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <Checkbox
                            checked={isApplied}
                            onCheckedChange={() => handleTogglePlantillaCheckbox(plantilla.id)}
                            disabled={isToggling}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{plantilla.nombre}</p>
                              <Badge variant="outline" className="text-xs">
                                {plantilla.codigo}
                              </Badge>
                              {isApplied && (
                                <Badge variant="default" className="text-xs">
                                  Aplicado
                                </Badge>
                              )}
                            </div>
                            {(plantilla.bedrooms || plantilla.bathrooms || plantilla.descripcion) && (
                              <div className="flex gap-3 mt-1">
                                {plantilla.bedrooms && (
                                  <p className="text-sm text-muted-foreground">
                                    {plantilla.bedrooms} {plantilla.bedrooms === 1 ? 'dormitorio' : 'dormitorios'}
                                  </p>
                                )}
                                {plantilla.bathrooms && (
                                  <p className="text-sm text-muted-foreground">
                                    {plantilla.bathrooms} {plantilla.bathrooms === 1 ? 'baño' : 'baños'}
                                  </p>
                                )}
                                {plantilla.descripcion && (
                                  <p className="text-sm text-muted-foreground italic">
                                    {plantilla.descripcion}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          {plantilla.usageCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Usado en {plantilla.usageCount} {plantilla.usageCount === 1 ? 'proyecto' : 'proyectos'}
                            </Badge>
                          )}
                        </div>
                        {isToggling && (
                          <div className="ml-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Assigned Types to Project */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos Asignados a este Proyecto</CardTitle>
              <CardDescription>
                Gestiona las comisiones de los tipos de unidad aplicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTiposUnidad ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Cargando tipos...</p>
                  </div>
                </div>
              ) : tiposUnidadDetalle.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/50">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay tipos asignados</h3>
                  <p className="text-muted-foreground">
                    Selecciona plantillas en la sección superior para asignarlas a este proyecto
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Comisión</TableHead>
                      <TableHead className="text-center">Unidades</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiposUnidadDetalle.map((tipoUnidad) => (
                      <TableRow key={tipoUnidad.id}>
                        <TableCell>
                          <div className="font-medium">{tipoUnidad.nombre}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tipoUnidad.codigo}</Badge>
                        </TableCell>
                        <TableCell>
                          {tipoUnidad.comision ? (
                            <div>
                              <div className="font-medium text-sm">{tipoUnidad.comision.nombre}</div>
                              <div className="text-sm text-muted-foreground">
                                {(tipoUnidad.comision.porcentaje * 100).toFixed(1)}%
                              </div>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Sin asignar
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium">{tipoUnidad._count.unidades}</div>
                          <div className="text-xs text-muted-foreground">unidades</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditComisionDialog(tipoUnidad)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar Comisión
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dialog: New Template */}
          <Dialog open={isNewPlantillaDialogOpen} onOpenChange={setIsNewPlantillaDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nueva Plantilla de Tipo de Unidad</DialogTitle>
                <DialogDescription>
                  Crea una nueva plantilla global que podrás reutilizar en otros proyectos
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="template-nombre">Nombre *</Label>
                      <Input
                        id="template-nombre"
                        value={newPlantillaFormData.nombre}
                        onChange={(e) => setNewPlantillaFormData({ ...newPlantillaFormData, nombre: e.target.value })}
                        placeholder="ej: Studio, 1 Dormitorio"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="template-codigo">Código *</Label>
                      <Input
                        id="template-codigo"
                        value={newPlantillaFormData.codigo}
                        onChange={(e) => setNewPlantillaFormData({ ...newPlantillaFormData, codigo: e.target.value.toUpperCase() })}
                        placeholder="ej: STU, 1D"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="template-bedrooms">Dormitorios</Label>
                      <Input
                        id="template-bedrooms"
                        type="number"
                        min="0"
                        value={newPlantillaFormData.bedrooms}
                        onChange={(e) => setNewPlantillaFormData({ ...newPlantillaFormData, bedrooms: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="template-bathrooms">Baños</Label>
                      <Input
                        id="template-bathrooms"
                        type="number"
                        min="0"
                        value={newPlantillaFormData.bathrooms}
                        onChange={(e) => setNewPlantillaFormData({ ...newPlantillaFormData, bathrooms: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="template-descripcion">Descripción</Label>
                    <Input
                      id="template-descripcion"
                      value={newPlantillaFormData.descripcion}
                      onChange={(e) => setNewPlantillaFormData({ ...newPlantillaFormData, descripcion: e.target.value })}
                      placeholder="Descripción opcional..."
                    />
                  </div>
                </div>
              </ScrollArea>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsNewPlantillaDialogOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSubmitNewPlantilla} disabled={saving}>
                  {saving ? 'Creando...' : 'Crear Plantilla'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog: Edit Commission */}
          <Dialog open={isEditComisionDialogOpen} onOpenChange={setIsEditComisionDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Editar Comisión</DialogTitle>
                <DialogDescription>
                  Asigna una comisión específica para el tipo "{editingComisionTipo?.nombre}"
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="comision-select">Comisión</Label>
                  <Select
                    value={comisionFormData.comisionId}
                    onValueChange={(value: string) => setComisionFormData({ comisionId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin comisión asignada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin comisión asignada</SelectItem>
                      {comisiones.filter(c => c.activa).map((comision) => (
                        <SelectItem key={comision.id} value={comision.id}>
                          {comision.nombre} - {(comision.porcentaje * 100).toFixed(1)}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Si no asignas comisión, usará la comisión del proyecto por defecto
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditComisionDialogOpen(false)
                    setEditingComisionTipo(null)
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSubmitComision} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="unidades" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Unidades del Proyecto</CardTitle>
                  <CardDescription>
                    Gestiona las unidades individuales de este proyecto
                  </CardDescription>
                </div>
                {tiposUnidadDetalle.length > 0 && (
                  <Dialog open={isCreateUnidadDialogOpen} onOpenChange={setIsCreateUnidadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleOpenCreateUnidadDialog}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Unidad
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>
                          {editingUnidad ? 'Editar Unidad' : 'Nueva Unidad'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingUnidad
                            ? 'Modifica los datos de la unidad existente'
                            : 'Crea una nueva unidad para este proyecto'
                          }
                        </DialogDescription>
                      </DialogHeader>

                      <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="numero">Número de Unidad *</Label>
                            <Input
                              id="numero"
                              value={unidadFormData.numero}
                              onChange={(e) => setUnidadFormData({ ...unidadFormData, numero: e.target.value })}
                              placeholder="ej: 101"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="metros2">Metros Cuadrados</Label>
                            <Input
                              id="metros2"
                              type="number"
                              value={unidadFormData.metros2}
                              onChange={(e) => setUnidadFormData({ ...unidadFormData, metros2: e.target.value })}
                              placeholder="ej: 85.5"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="tipoUnidad">Tipo de Unidad *</Label>
                            <Select value={unidadFormData.tipoUnidadEdificioId} onValueChange={(value: string) => setUnidadFormData({ ...unidadFormData, tipoUnidadEdificioId: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {tiposUnidadDetalle.map((tipoUnidad) => (
                                  <SelectItem key={tipoUnidad.id} value={tipoUnidad.id}>
                                    {tipoUnidad.nombre} ({tipoUnidad.codigo})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="estado">Estado</Label>
                            <Select value={unidadFormData.estado} onValueChange={(value: 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA') => setUnidadFormData({ ...unidadFormData, estado: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                                <SelectItem value="RESERVADA">Reservada</SelectItem>
                                <SelectItem value="VENDIDA">Vendida</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>


                        <div className="grid grid-cols-1 gap-2">
                          <Label htmlFor="descripcion">Descripción</Label>
                          <Input
                            id="descripcion"
                            value={unidadFormData.descripcion}
                            onChange={(e) => setUnidadFormData({ ...unidadFormData, descripcion: e.target.value })}
                            placeholder="Descripción opcional de la unidad..."
                          />
                        </div>
                        </div>
                      </ScrollArea>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateUnidadDialogOpen(false)}
                          disabled={saving}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleSubmitUnidad} disabled={saving}>
                          {saving ? 'Guardando...' : (editingUnidad ? 'Actualizar' : 'Crear')}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {tiposUnidadDetalle.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Primero crea tipos de unidad</h3>
                  <p className="text-muted-foreground mb-4">
                    Necesitas crear al menos un tipo de unidad antes de poder agregar unidades
                  </p>
                  <Button onClick={() => setActiveTab('tipos-unidad')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Ir a Tipos de Unidad
                  </Button>
                </div>
              ) : edificio.unidades.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay unidades</h3>
                  <p className="text-muted-foreground mb-4">
                    Comienza creando la primera unidad para este proyecto
                  </p>
                  <Button onClick={handleOpenCreateUnidadDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Unidad
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>m²</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {edificio.unidades.map((unidad) => (
                        <TableRow key={unidad.id}>
                          <TableCell>
                            <div className="font-medium">{unidad.numero}</div>
                            {unidad.descripcion && (
                              <div className="text-sm text-muted-foreground">{unidad.descripcion}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              console.log('🔍 Datos de unidad para tabla:', {
                                unidadId: unidad.id,
                                numero: unidad.numero,
                                tipoUnidadEdificioId: unidad.tipoUnidadEdificioId,
                                tipoUnidadEdificio: unidad.tipoUnidadEdificio,
                                tiposUnidadDetalle: tiposUnidadDetalle.map(t => ({ id: t.id, nombre: t.nombre }))
                              })

                              const tipoUnidadInfo = tiposUnidadDetalle.find(t => t.id === unidad.tipoUnidadEdificioId) || unidad.tipoUnidadEdificio

                              console.log('🎯 Tipo de unidad encontrado:', tipoUnidadInfo)

                              return (
                                <div>
                                  <div className="font-medium text-sm">
                                    {tipoUnidadInfo?.nombre || 'Sin tipo'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {tipoUnidadInfo?.codigo || 'N/A'}
                                  </div>
                                </div>
                              )
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              unidad.estado === 'DISPONIBLE' ? 'bg-green-100 text-green-800' :
                              unidad.estado === 'RESERVADA' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {unidad.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {unidad.metros2 ? `${unidad.metros2} m²` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditUnidadDialog(unidad)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar unidad?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción eliminará permanentemente la unidad &quot;{unidad.numero}&quot;.
                                      Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUnidad(unidad)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}