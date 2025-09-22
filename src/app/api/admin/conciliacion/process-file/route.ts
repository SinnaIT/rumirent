import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface ExcelData {
  fechaContrato: string
  monto: number
  proyecto: string
  unidad: string
  raw: any
}

interface ContratoSistema {
  id: string
  fechaContrato: string
  totalContrato: number
  edificioNombre: string
  unidadCodigo: string
  clienteNombre: string
  contratistaNombre: string
  comision: number
  conciliado: boolean
}

interface ConciliacionMatch {
  id: string
  excel: ExcelData
  sistema: ContratoSistema
  tipo: 'automatico' | 'manual'
  confidence: number
}

// Función para normalizar texto para comparación
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]/g, '') // Solo letras y números
}

// Función para calcular similitud entre strings
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1)
  const norm2 = normalizeText(str2)

  if (norm1 === norm2) return 1.0

  // Usar algoritmo de Levenshtein simplificado
  const longer = norm1.length > norm2.length ? norm1 : norm2
  const shorter = norm1.length > norm2.length ? norm2 : norm1

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

// Función para hacer matching automático
function findAutomaticMatches(excelData: ExcelData[], contratosSistema: ContratoSistema[]): {
  matches: ConciliacionMatch[]
  remainingExcel: ExcelData[]
  remainingContratos: ContratoSistema[]
} {
  const matches: ConciliacionMatch[] = []
  const usedExcelIndices = new Set<number>()
  const usedContratoIds = new Set<string>()

  excelData.forEach((excel, excelIndex) => {
    if (usedExcelIndices.has(excelIndex)) return

    let bestMatch: { contrato: ContratoSistema; confidence: number } | null = null

    contratosSistema.forEach((contrato) => {
      if (usedContratoIds.has(contrato.id)) return

      // Calcular confidence basado en múltiples factores
      let confidence = 0
      let factors = 0

      // Factor 1: Similitud del proyecto/edificio (peso: 0.4)
      const proyectoSimilarity = calculateSimilarity(excel.proyecto, contrato.edificioNombre)
      confidence += proyectoSimilarity * 0.4
      factors += 0.4

      // Factor 2: Similitud de la unidad (peso: 0.3)
      const unidadSimilarity = calculateSimilarity(excel.unidad, contrato.unidadCodigo)
      confidence += unidadSimilarity * 0.3
      factors += 0.3

      // Factor 3: Diferencia de monto (peso: 0.3)
      const montoDifference = Math.abs(excel.monto - contrato.totalContrato) / Math.max(excel.monto, contrato.totalContrato)
      const montoSimilarity = Math.max(0, 1 - montoDifference)
      confidence += montoSimilarity * 0.3
      factors += 0.3

      // Normalizar confidence
      confidence = confidence / factors

      // Solo considerar matches con alta confidence (>= 0.85)
      if (confidence >= 0.85 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { contrato, confidence }
      }
    })

    // Si encontramos un match automático de alta confidence
    if (bestMatch && bestMatch.confidence >= 0.85) {
      matches.push({
        id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        excel,
        sistema: bestMatch.contrato,
        tipo: 'automatico',
        confidence: bestMatch.confidence,
      })

      usedExcelIndices.add(excelIndex)
      usedContratoIds.add(bestMatch.contrato.id)
    }
  })

  const remainingExcel = excelData.filter((_, index) => !usedExcelIndices.has(index))
  const remainingContratos = contratosSistema.filter(contrato => !usedContratoIds.has(contrato.id))

  return { matches, remainingExcel, remainingContratos }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mes = formData.get('mes') as string
    const year = formData.get('year') as string

    if (!file || !mes || !year) {
      return NextResponse.json({ error: 'Archivo, mes y año son requeridos' }, { status: 400 })
    }

    const mesNum = parseInt(mes)
    const yearNum = parseInt(year)

    console.log('Processing file:', file.name, 'for period:', { mes: mesNum, year: yearNum })

    // Leer el archivo
    const buffer = await file.arrayBuffer()
    let parsedData: any[] = []

    if (file.name.endsWith('.csv')) {
      // Procesar CSV
      const text = new TextDecoder().decode(buffer)
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
      parsedData = parsed.data as any[]
    } else {
      // Procesar Excel
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      parsedData = XLSX.utils.sheet_to_json(worksheet)
    }

    console.log('Parsed data length:', parsedData.length)

    // Mapear datos del Excel/CSV (intentar diferentes nombres de columnas)
    const excelData: ExcelData[] = parsedData.map((row, index) => {
      // Buscar columnas por diferentes nombres posibles
      const fechaContrato = row['fecha contrato'] || row['fecha_contrato'] || row['fechaContrato'] ||
                           row['Fecha Contrato'] || row['FECHA CONTRATO'] || row['fecha'] || row['Fecha']

      const monto = parseFloat(row['monto'] || row['Monto'] || row['MONTO'] ||
                              row['total'] || row['Total'] || row['TOTAL'] ||
                              row['valor'] || row['Valor'] || row['VALOR'] || '0')

      const proyecto = row['proyecto'] || row['Proyecto'] || row['PROYECTO'] ||
                      row['edificio'] || row['Edificio'] || row['EDIFICIO'] ||
                      row['building'] || row['Building'] || 'Sin proyecto'

      const unidad = row['unidad'] || row['Unidad'] || row['UNIDAD'] ||
                    row['unit'] || row['Unit'] || row['numero'] || row['Numero'] ||
                    row['codigo'] || row['Codigo'] || 'Sin unidad'

      return {
        fechaContrato: fechaContrato ? new Date(fechaContrato).toISOString() : new Date().toISOString(),
        monto: isNaN(monto) ? 0 : monto,
        proyecto: String(proyecto),
        unidad: String(unidad),
        raw: row,
      }
    }).filter(item => item.monto > 0) // Filtrar registros sin monto válido

    console.log('Processed excel data:', excelData.length, 'valid records')

    // Obtener contratos del sistema para el período
    const fechaInicio = new Date(yearNum, mesNum, 1)
    const fechaFin = new Date(yearNum, mesNum + 1, 0, 23, 59, 59, 999)

    const contratos = await prisma.contrato.findMany({
      where: {
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin,
        },
        conciliado: false,
      },
      include: {
        cliente: { select: { nombre: true } },
        contratista: { select: { nombre: true } },
        edificio: { select: { nombre: true } },
        unidad: { select: { numero: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const contratosSistema: ContratoSistema[] = contratos.map((contrato) => ({
      id: contrato.id,
      fechaContrato: contrato.createdAt.toISOString(),
      totalContrato: contrato.totalContrato,
      edificioNombre: contrato.edificio.nombre,
      unidadCodigo: contrato.unidad?.numero || contrato.codigoUnidad || 'Sin código',
      clienteNombre: contrato.cliente.nombre,
      contratistaNombre: contrato.contratista.nombre,
      comision: contrato.comision || 0,
      conciliado: contrato.conciliado,
    }))

    console.log('Sistema contracts:', contratosSistema.length)

    // Realizar matching automático
    const { matches, remainingExcel, remainingContratos } = findAutomaticMatches(excelData, contratosSistema)

    console.log('Automatic matches found:', matches.length)
    console.log('Remaining excel records:', remainingExcel.length)
    console.log('Remaining system contracts:', remainingContratos.length)

    return NextResponse.json({
      excelData: remainingExcel,
      contratosSistema: remainingContratos,
      matches,
      stats: {
        totalExcelRecords: excelData.length,
        totalSystemContracts: contratosSistema.length,
        automaticMatches: matches.length,
        remainingExcel: remainingExcel.length,
        remainingSystem: remainingContratos.length,
      },
    })
  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json(
      { error: 'Error procesando el archivo' },
      { status: 500 }
    )
  }
}