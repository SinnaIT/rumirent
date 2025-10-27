import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface ExcelData {
  fechaLead: string
  monto: number
  proyecto: string
  unidad: string
  raw: unknown
}

interface LeadSistema {
  id: string
  fechaLead: string
  totalLead: number
  edificioNombre: string
  unidadCodigo: string
  clienteNombre: string
  brokerNombre: string
  comision: number
  conciliado: boolean
}

interface ConciliacionMatch {
  id: string
  excel: ExcelData
  sistema: LeadSistema
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
function findAutomaticMatches(excelData: ExcelData[], leadsSistema: LeadSistema[]): {
  matches: ConciliacionMatch[]
  remainingExcel: ExcelData[]
  remainingLeads: LeadSistema[]
} {
  const matches: ConciliacionMatch[] = []
  const usedExcelIndices = new Set<number>()
  const usedLeadIds = new Set<string>()

  excelData.forEach((excel, excelIndex) => {
    if (usedExcelIndices.has(excelIndex)) return

    let bestMatch: { lead: LeadSistema; confidence: number } | null = null

    leadsSistema.forEach((lead) => {
      if (usedLeadIds.has(lead.id)) return

      // Calcular confidence basado en múltiples factores
      let confidence = 0
      let factors = 0

      // Factor 1: Similitud del proyecto/edificio (peso: 0.4)
      const proyectoSimilarity = calculateSimilarity(excel.proyecto, lead.edificioNombre)
      confidence += proyectoSimilarity * 0.4
      factors += 0.4

      // Factor 2: Similitud de la unidad (peso: 0.3)
      const unidadSimilarity = calculateSimilarity(excel.unidad, lead.unidadCodigo)
      confidence += unidadSimilarity * 0.3
      factors += 0.3

      // Factor 3: Diferencia de monto (peso: 0.3)
      const montoDifference = Math.abs(excel.monto - lead.totalLead) / Math.max(excel.monto, lead.totalLead)
      const montoSimilarity = Math.max(0, 1 - montoDifference)
      confidence += montoSimilarity * 0.3
      factors += 0.3

      // Normalizar confidence
      confidence = confidence / factors

      // Solo considerar matches con alta confidence (>= 0.85)
      if (confidence >= 0.85 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { lead, confidence }
      }
    })

    // Si encontramos un match automático de alta confidence
    if (bestMatch && bestMatch.confidence >= 0.85) {
      matches.push({
        id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        excel,
        sistema: bestMatch.lead,
        tipo: 'automatico',
        confidence: bestMatch.confidence,
      })

      usedExcelIndices.add(excelIndex)
      usedLeadIds.add(bestMatch.lead.id)
    }
  })

  const remainingExcel = excelData.filter((_, index) => !usedExcelIndices.has(index))
  const remainingLeads = leadsSistema.filter(lead => !usedLeadIds.has(lead.id))

  return { matches, remainingExcel, remainingLeads }
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
    let parsedData: Record<string, unknown>[] = []

    if (file.name.endsWith('.csv')) {
      // Procesar CSV
      const text = new TextDecoder().decode(buffer)
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
      parsedData = parsed.data as Record<string, unknown>[]
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
      const fechaLead = row['fecha lead'] || row['fecha_lead'] || row['fechaLead'] ||
                           row['Fecha Lead'] || row['FECHA CONTRATO'] || row['fecha'] || row['Fecha']

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
        fechaLead: fechaLead ? new Date(fechaLead).toISOString() : new Date().toISOString(),
        monto: isNaN(monto) ? 0 : monto,
        proyecto: String(proyecto),
        unidad: String(unidad),
        raw: row,
      }
    }).filter(item => item.monto > 0) // Filtrar registros sin monto válido

    console.log('Processed excel data:', excelData.length, 'valid records')

    // Obtener leads del sistema para el período
    const fechaInicio = new Date(yearNum, mesNum, 1)
    const fechaFin = new Date(yearNum, mesNum + 1, 0, 23, 59, 59, 999)

    const leads = await prisma.lead.findMany({
      where: {
        fechaCheckin: {
          gte: fechaInicio,
          lte: fechaFin,
        },
        conciliado: false,
      },
      include: {
        cliente: { select: { nombre: true } },
        broker: { select: { nombre: true } },
        edificio: { select: { nombre: true } },
        unidad: { select: { numero: true } },
      },
      orderBy: { fechaCheckin: 'desc' },
    })

    const leadsSistema: LeadSistema[] = leads.map((lead) => ({
      id: lead.id,
      fechaLead: lead.fechaCheckin?.toISOString() || lead.createdAt.toISOString(),
      totalLead: lead.totalLead,
      edificioNombre: lead.edificio.nombre,
      unidadCodigo: lead.unidad?.numero || lead.codigoUnidad || 'Sin código',
      clienteNombre: lead.cliente.nombre,
      brokerNombre: lead.broker.nombre,
      comision: lead.comision || 0,
      conciliado: lead.conciliado,
    }))

    console.log('Sistema contracts:', leadsSistema.length)

    // Realizar matching automático
    const { matches, remainingExcel, remainingLeads } = findAutomaticMatches(excelData, leadsSistema)

    console.log('Automatic matches found:', matches.length)
    console.log('Remaining excel records:', remainingExcel.length)
    console.log('Remaining system contracts:', remainingLeads.length)

    return NextResponse.json({
      excelData: remainingExcel,
      leadsSistema: remainingLeads,
      matches,
      stats: {
        totalExcelRecords: excelData.length,
        totalSystemContracts: leadsSistema.length,
        automaticMatches: matches.length,
        remainingExcel: remainingExcel.length,
        remainingSystem: remainingLeads.length,
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