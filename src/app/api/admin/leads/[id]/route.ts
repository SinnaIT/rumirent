import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 GET /api/admin/leads/' + id)

    // En desarrollo, omitir verificación de autenticación por ahora
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Modo desarrollo - omitiendo autenticación')
    } else {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rut: true
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            rut: true,
            email: true,
            telefono: true
          }
        },
        unidad: {
          select: {
            id: true,
            numero: true,
            descripcion: true,
            metros2: true,
            edificio: {
              select: {
                id: true,
                nombre: true,
                direccion: true
              }
            }
          }
        },
        edificio: {
          select: {
            id: true,
            nombre: true,
            direccion: true
          }
        },
        reglaComision: {
          select: {
            id: true,
            cantidadMinima: true,
            cantidadMaxima: true,
            porcentaje: true,
            comision: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        },
        comisionBase: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            porcentaje: true
          }
        }
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    const leadFormatted = {
      id: lead.id,
      codigoUnidad: lead.codigoUnidad,
      totalLead: lead.totalLead,
      montoUf: lead.montoUf,
      comision: lead.comision,
      estado: lead.estado,
      fechaPagoReserva: lead.fechaPagoReserva?.toISOString() || null,
      fechaPagoLead: lead.fechaPagoLead?.toISOString() || null,
      fechaCheckin: lead.fechaCheckin?.toISOString() || null,
      postulacion: lead.postulacion,
      observaciones: lead.observaciones,
      conciliado: lead.conciliado,
      fechaConciliacion: lead.fechaConciliacion?.toISOString() || null,
      broker: {
        id: lead.broker.id,
        nombre: lead.broker.nombre,
        email: lead.broker.email,
        rut: lead.broker.rut
      },
      cliente: lead.cliente,
      unidad: lead.unidad,
      edificio: lead.edificio,
      reglaComision: lead.reglaComision,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      lead: leadFormatted
    })

  } catch (error) {
    console.error('❌ Error al obtener lead:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔄 PUT /api/admin/leads/' + id)

    // En desarrollo, omitir verificación de autenticación por ahora
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Modo desarrollo - omitiendo autenticación')
    } else {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const {
      codigoUnidad,
      totalLead,
      montoUf,
      comision,
      estado,
      fechaPagoReserva,
      fechaPagoLead,
      fechaCheckin,
      postulacion,
      observaciones,
      conciliado,
      brokerId,
      clienteId,
      reglaComisionId,
      comisionId
    } = body

    console.log('📝 Datos a actualizar:', body)

    // Validaciones básicas
    if (!totalLead || !montoUf || !brokerId || !clienteId) {
      return NextResponse.json(
        { error: 'Total lead, monto UF, broker y cliente son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el lead existe
    const existingLead = await prisma.lead.findUnique({
      where: { id }
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el broker existe
    const brokerExists = await prisma.user.findUnique({
      where: {
        id: brokerId,
        role: 'BROKER'
      }
    })

    if (!brokerExists) {
      return NextResponse.json(
        { error: 'El broker especificado no existe o no es válido' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const clienteExists = await prisma.cliente.findUnique({
      where: { id: clienteId }
    })

    if (!clienteExists) {
      return NextResponse.json(
        { error: 'El cliente especificado no existe' },
        { status: 400 }
      )
    }

    // Calculate commission if estado is changing to DEPARTAMENTO_ENTREGADO
    let calculatedComision = comision ? parseFloat(comision) : 0
    const calculatedReglaComisionId = reglaComisionId || null
    let calculatedComisionId = comisionId || null

    if (estado === 'DEPARTAMENTO_ENTREGADO' && existingLead.estado !== 'DEPARTAMENTO_ENTREGADO') {
      // Only recalculate if we're transitioning TO DEPARTAMENTO_ENTREGADO
      const leadWithRelations = await prisma.lead.findUnique({
        where: { id },
        include: {
          unidad: {
            include: {
              tipoUnidadEdificio: {
                include: {
                  comision: true
                }
              }
            }
          },
          edificio: {
            include: {
              comision: true
            }
          },
          tipoUnidadEdificio: {
            include: {
              comision: true
            }
          }
        }
      })

      if (leadWithRelations) {
        const totalLeadAmount = parseFloat(totalLead)
        let comisionPorcentaje = 0
        let selectedComisionId = null

        // Priority 1: TipoUnidadEdificio commission (direct from lead)
        if (leadWithRelations.tipoUnidadEdificio?.comision) {
          comisionPorcentaje = leadWithRelations.tipoUnidadEdificio.comision.porcentaje
          selectedComisionId = leadWithRelations.tipoUnidadEdificio.comision.id
        }
        // Priority 2: Unidad's TipoUnidadEdificio commission
        else if (leadWithRelations.unidad?.tipoUnidadEdificio?.comision) {
          comisionPorcentaje = leadWithRelations.unidad.tipoUnidadEdificio.comision.porcentaje
          selectedComisionId = leadWithRelations.unidad.tipoUnidadEdificio.comision.id
        }
        // Priority 3: Edificio commission
        else if (leadWithRelations.edificio?.comision) {
          comisionPorcentaje = leadWithRelations.edificio.comision.porcentaje
          selectedComisionId = leadWithRelations.edificio.comision.id
        }

        // Calculate commission amount
        calculatedComision = totalLeadAmount * comisionPorcentaje
        calculatedComisionId = selectedComisionId

        console.log('💰 Comisión calculada automáticamente:', {
          totalLead: totalLeadAmount,
          porcentaje: comisionPorcentaje,
          comision: calculatedComision,
          comisionId: selectedComisionId
        })
      }
    }

    // Actualizar lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        codigoUnidad: codigoUnidad || null,
        totalLead: parseFloat(totalLead),
        montoUf: parseFloat(montoUf),
        comision: calculatedComision,
        estado: estado || 'INGRESADO',
        fechaPagoReserva: fechaPagoReserva ? new Date(fechaPagoReserva) : null,
        fechaPagoLead: fechaPagoLead ? new Date(fechaPagoLead) : null,
        fechaCheckin: fechaCheckin ? new Date(fechaCheckin) : null,
        postulacion: postulacion || null,
        observaciones: observaciones || null,
        conciliado: conciliado || false,
        brokerId,
        clienteId,
        reglaComisionId: calculatedReglaComisionId,
        comisionId: calculatedComisionId
      },
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rut: true
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            rut: true,
            email: true,
            telefono: true
          }
        },
        unidad: {
          select: {
            id: true,
            numero: true,
            descripcion: true,
            metros2: true,
            edificio: {
              select: {
                id: true,
                nombre: true,
                direccion: true
              }
            }
          }
        },
        edificio: {
          select: {
            id: true,
            nombre: true,
            direccion: true
          }
        },
        reglaComision: {
          select: {
            id: true,
            cantidadMinima: true,
            cantidadMaxima: true,
            porcentaje: true,
            comision: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        },
        comisionBase: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            porcentaje: true
          }
        }
      }
    })

    console.log('✅ Lead actualizado exitosamente')

    const leadFormatted = {
      id: updatedLead.id,
      codigoUnidad: updatedLead.codigoUnidad,
      totalLead: updatedLead.totalLead,
      montoUf: updatedLead.montoUf,
      comision: updatedLead.comision,
      estado: updatedLead.estado,
      fechaPagoReserva: updatedLead.fechaPagoReserva?.toISOString() || null,
      fechaPagoLead: updatedLead.fechaPagoLead?.toISOString() || null,
      fechaCheckin: updatedLead.fechaCheckin?.toISOString() || null,
      postulacion: updatedLead.postulacion,
      observaciones: updatedLead.observaciones,
      conciliado: updatedLead.conciliado,
      fechaConciliacion: updatedLead.fechaConciliacion?.toISOString() || null,
      broker: {
        id: updatedLead.broker.id,
        nombre: updatedLead.broker.nombre,
        email: updatedLead.broker.email,
        rut: updatedLead.broker.rut
      },
      cliente: updatedLead.cliente,
      unidad: updatedLead.unidad,
      edificio: updatedLead.edificio,
      reglaComision: updatedLead.reglaComision,
      comisionBase: updatedLead.comisionBase,
      createdAt: updatedLead.createdAt.toISOString(),
      updatedAt: updatedLead.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Lead actualizado exitosamente',
      lead: leadFormatted
    })

  } catch (error) {
    console.error('❌ Error al actualizar lead:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}