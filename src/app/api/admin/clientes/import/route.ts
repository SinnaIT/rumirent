import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import * as XLSX from 'xlsx'

interface ClienteRow {
  nombre: string
  rut: string
  telefono?: string
  correo?: string
  direccion?: string
  'fecha de nacimiento'?: string
  brokerAsignado?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando POST /api/admin/clientes/import')

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('❌ No se proporcionó archivo')
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    console.log('📄 Archivo recibido:', file.name, 'Tipo:', file.type)

    // Verificar que sea un archivo válido (Excel o CSV)
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      console.log('❌ Formato de archivo no válido:', file.type)
      return NextResponse.json(
        {
          success: false,
          error: 'Formato de archivo no válido. Use Excel (.xlsx, .xls) o CSV',
          details: `Tipo de archivo recibido: ${file.type}`
        },
        { status: 400 }
      )
    }

    // Convertir el archivo a buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Leer el archivo con xlsx
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convertir a JSON
    const data: ClienteRow[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: ''
    })

    console.log('📊 Registros encontrados:', data.length)

    if (data.length === 0) {
      console.log('❌ El archivo no contiene datos')
      return NextResponse.json(
        { success: false, error: 'El archivo no contiene datos' },
        { status: 400 }
      )
    }

    // Validar columnas requeridas (case insensitive) - nombre, telefono y correo son obligatorios
    const requiredColumns = ['nombre', 'telefono', 'correo']
    const firstRow = data[0]
    const columnNames = Object.keys(firstRow).map(k => k.toLowerCase())

    const missingColumns = requiredColumns.filter(col =>
      !columnNames.some(cn => cn.includes(col) || (col === 'correo' && (cn.includes('email') || cn.includes('mail'))) || (col === 'telefono' && cn.includes('teléfono')))
    )

    if (missingColumns.length > 0) {
      console.log('❌ Columnas faltantes:', missingColumns)
      return NextResponse.json(
        {
          success: false,
          error: `Faltan las siguientes columnas requeridas: ${missingColumns.join(', ')}`,
          details: `Columnas encontradas: ${columnNames.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Procesar cada fila
    const results = {
      created: 0,
      updated: 0,
      errors: [] as { row: number; error: string; data: Partial<ClienteRow> }[]
    }

    // Obtener todos los brokers de una vez para mapeo
    const brokers = await prisma.user.findMany({
      where: { role: 'BROKER', activo: true },
      select: { id: true, rut: true, email: true, nombre: true }
    })

    console.log('👥 Brokers disponibles:', brokers.length)

    // Crear un mapa de RUT/email a ID de broker
    const brokerMap = new Map<string, string>()
    brokers.forEach(broker => {
      brokerMap.set(broker.rut.toLowerCase(), broker.id)
      brokerMap.set(broker.email.toLowerCase(), broker.id)
      brokerMap.set(broker.nombre.toLowerCase(), broker.id)
    })

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // +2 porque la primera fila es el encabezado y Excel empieza en 1

      try {
        // Normalizar nombres de columnas (buscar case insensitive)
        const getNormalizedValue = (possibleNames: string[]): string | undefined => {
          for (const name of possibleNames) {
            const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase())
            if (key && row[key as keyof ClienteRow]) {
              return String(row[key as keyof ClienteRow]).trim()
            }
          }
          return undefined
        }

        const nombre = getNormalizedValue(['nombre'])
        const rut = getNormalizedValue(['rut'])
        const telefono = getNormalizedValue(['telefono', 'teléfono', 'phone'])
        const email = getNormalizedValue(['correo', 'email', 'mail'])
        const direccion = getNormalizedValue(['direccion', 'dirección', 'address'])
        const fechaNacimientoStr = getNormalizedValue([
          'fecha de nacimiento',
          'fechanacimiento',
          'fecha_nacimiento',
          'birthdate'
        ])
        const brokerAsignado = getNormalizedValue([
          'brokerasignado',
          'broker asignado',
          'broker_asignado',
          'broker'
        ])

        // Validar campos requeridos - nombre, telefono y correo son obligatorios
        if (!nombre || !telefono || !email) {
          results.errors.push({
            row: rowNumber,
            error: 'Faltan campos requeridos: nombre, telefono y/o correo',
            data: { nombre, telefono, correo: email }
          })
          continue
        }

        // Buscar broker solo si se proporcionó el campo
        let brokerId: string | null = null
        if (brokerAsignado && brokerAsignado.trim()) {
          brokerId = brokerMap.get(brokerAsignado.toLowerCase()) || null

          // Solo mostrar error si se proporcionó un valor pero no se encontró el broker
          if (!brokerId) {
            results.errors.push({
              row: rowNumber,
              error: `Broker no encontrado: ${brokerAsignado}`,
              data: { nombre, rut, brokerAsignado }
            })
            continue
          }
        }

        // Parsear fecha de nacimiento si existe
        let fechaNacimiento: Date | null = null
        if (fechaNacimientoStr) {
          try {
            // Intentar varios formatos de fecha
            const dateStr = fechaNacimientoStr.trim()

            // Formato Excel serial number
            if (/^\d+$/.test(dateStr)) {
              const excelDate = parseInt(dateStr)
              fechaNacimiento = new Date((excelDate - 25569) * 86400 * 1000)
            }
            // Formato ISO o estándar
            else {
              fechaNacimiento = new Date(dateStr)
              if (isNaN(fechaNacimiento.getTime())) {
                fechaNacimiento = null
              }
            }
          } catch (e: unknown) {
            console.warn(`⚠️ No se pudo parsear fecha para fila ${rowNumber}:`, fechaNacimientoStr, e)
          }
        }

        // Upsert: crear o actualizar por telefono (campo único)
        const clienteData = {
          nombre,
          rut: rut || null,
          email: email || null,
          telefono,
          direccion: direccion || null,
          fechaNacimiento,
          brokerId
        }

        const cliente = await prisma.cliente.upsert({
          where: { telefono },
          create: clienteData,
          update: clienteData,
          include: {
            broker: {
              select: {
                nombre: true
              }
            }
          }
        })

        if (cliente.createdAt.getTime() === cliente.updatedAt.getTime()) {
          results.created++
          console.log(`✅ Cliente creado: ${nombre} (${rut})`)
        } else {
          results.updated++
          console.log(`🔄 Cliente actualizado: ${nombre} (${rut})`)
        }

      } catch (error) {
        console.error(`❌ Error en fila ${rowNumber}:`, error)
        results.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Error desconocido',
          data: { nombre: row.nombre, rut: row.rut }
        })
      }
    }

    console.log('📊 Resultados de importación:', results)

    return NextResponse.json({
      success: true,
      message: `Importación completada: ${results.created} creados, ${results.updated} actualizados`,
      results: {
        total: data.length,
        created: results.created,
        updated: results.updated,
        errors: results.errors
      }
    })

  } catch (error) {
    console.error('❌ Error al importar clientes:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    // Log detallado del error para debugging
    console.error('Tipo de error:', error)
    console.error('Mensaje:', errorMessage)
    if (errorStack) {
      console.error('Stack trace:', errorStack)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al procesar el archivo',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Contacte al administrador'
      },
      { status: 500 }
    )
  }
}
