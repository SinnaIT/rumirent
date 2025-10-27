import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { saveUploadedFile, isValidUrl } from '@/lib/uploadUtils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const imagenes = await prisma.imagenEdificio.findMany({
      where: { edificioId: id },
      orderBy: { orden: 'asc' }
    })

    return NextResponse.json({
      success: true,
      imagenes
    })

  } catch (error) {
    console.error('Error al obtener imágenes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Verificar autenticación
    if (process.env.NODE_ENV !== 'development') {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    // Verificar que el edificio existe
    const edificio = await prisma.edificio.findUnique({
      where: { id }
    })

    if (!edificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // Determinar si es FormData (file upload) o JSON (URL)
    const contentType = request.headers.get('content-type') || ''
    let imageUrl: string
    let imageType: 'URL' | 'UPLOAD'
    let descripcion: string | null = null
    let orden: number | undefined

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get('file') as File
      const descripcionValue = formData.get('descripcion') as string
      const ordenValue = formData.get('orden') as string

      if (!file) {
        return NextResponse.json(
          { error: 'No se proporcionó ningún archivo' },
          { status: 400 }
        )
      }

      // Save uploaded file
      const uploadResult = await saveUploadedFile(file, 'edificios')

      if (!uploadResult.success || !uploadResult.url) {
        return NextResponse.json(
          { error: uploadResult.error || 'Error al subir el archivo' },
          { status: 400 }
        )
      }

      imageUrl = uploadResult.url
      imageType = 'UPLOAD'
      descripcion = descripcionValue || null
      orden = ordenValue ? parseInt(ordenValue) : undefined

    } else {
      // Handle URL input (JSON)
      const body = await request.json()
      const { url, descripcion: desc, orden: ord } = body

      // Validaciones
      if (!url || url.trim() === '') {
        return NextResponse.json(
          { error: 'La URL de la imagen es requerida' },
          { status: 400 }
        )
      }

      // Validate URL format
      if (!isValidUrl(url)) {
        return NextResponse.json(
          { error: 'La URL proporcionada no es válida' },
          { status: 400 }
        )
      }

      imageUrl = url
      imageType = 'URL'
      descripcion = desc || null
      orden = ord
    }

    // Si no se proporciona orden, usar el siguiente disponible
    let ordenFinal = orden
    if (ordenFinal === undefined || ordenFinal === null) {
      const lastImage = await prisma.imagenEdificio.findFirst({
        where: { edificioId: id },
        orderBy: { orden: 'desc' }
      })
      ordenFinal = lastImage ? lastImage.orden + 1 : 1
    }

    // Crear imagen
    const imagen = await prisma.imagenEdificio.create({
      data: {
        edificioId: id,
        url: imageUrl,
        descripcion,
        orden: ordenFinal,
        imageType
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Imagen agregada exitosamente',
      imagen
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear imagen:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Verificar autenticación
    if (process.env.NODE_ENV !== 'development') {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const imagenId = searchParams.get('imagenId')

    if (!imagenId) {
      return NextResponse.json(
        { error: 'ID de imagen requerido' },
        { status: 400 }
      )
    }

    // Eliminar imagen
    await prisma.imagenEdificio.delete({
      where: { id: imagenId }
    })

    return NextResponse.json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar imagen:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
