import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos con nueva estructura...')

  // 1. Crear comisiones base (porcentajes)
  console.log('💰 Creando comisiones...')
  const comisionBasica = await prisma.comision.create({
    data: {
      nombre: 'Comisión Básica',
      codigo: 'COM_BASICA',
      porcentaje: 0.03, // 3%
      activa: true
    }
  })

  const comisionStandard = await prisma.comision.create({
    data: {
      nombre: 'Comisión Standard',
      codigo: 'COM_STANDARD',
      porcentaje: 0.05, // 5%
      activa: true
    }
  })

  const comisionPremium = await prisma.comision.create({
    data: {
      nombre: 'Comisión Premium',
      codigo: 'COM_PREMIUM',
      porcentaje: 0.07, // 7%
      activa: true
    }
  })

  const comisionVip = await prisma.comision.create({
    data: {
      nombre: 'Comisión VIP',
      codigo: 'COM_VIP',
      porcentaje: 0.10, // 10%
      activa: true
    }
  })

  // 2. Crear usuarios con RUT
  console.log('👤 Creando usuarios...')
  const hashedPassword = await bcrypt.hash('123456', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@rumirent.com',
      password: hashedPassword,
      nombre: 'Administrador Principal',
      rut: '12345678-9',
      telefono: '+569 1234 5678',
      role: 'ADMIN',
    }
  })

  const contratista1 = await prisma.user.create({
    data: {
      email: 'carlos.rodriguez@email.com',
      password: hashedPassword,
      nombre: 'Carlos Rodríguez',
      rut: '98765432-1',
      telefono: '+569 8765 4321',
      role: 'CONTRATISTA',
    }
  })

  const contratista2 = await prisma.user.create({
    data: {
      email: 'maria.gonzalez@email.com',
      password: hashedPassword,
      nombre: 'María González',
      rut: '87654321-0',
      telefono: '+569 8765 1234',
      role: 'CONTRATISTA',
    }
  })

  const contratista3 = await prisma.user.create({
    data: {
      email: 'juan.lopez@email.com',
      password: hashedPassword,
      nombre: 'Juan López',
      rut: '76543210-K',
      telefono: '+569 7654 3210',
      role: 'CONTRATISTA',
    }
  })

  // 3. Crear edificios con comisión base
  console.log('🏢 Creando edificios...')
  const edificio1 = await prisma.edificio.create({
    data: {
      nombre: 'Torres del Sol',
      direccion: 'Av. Las Condes 12345, Las Condes, Santiago',
      descripcion: 'Moderno conjunto habitacional con vista panorámica a la cordillera',
      estado: 'CONSTRUCCION',
      comisionId: comisionStandard.id // 5% base
    }
  })

  const edificio2 = await prisma.edificio.create({
    data: {
      nombre: 'Residencial Vista Mar',
      direccion: 'Av. del Mar 6789, Viña del Mar, Valparaíso',
      descripcion: 'Exclusivo proyecto frente al océano con amenities de lujo',
      estado: 'PLANIFICACION',
      comisionId: comisionPremium.id // 7% base
    }
  })

  const edificio3 = await prisma.edificio.create({
    data: {
      nombre: 'Parque Central',
      direccion: 'Calle Nueva 1234, Providencia, Santiago',
      descripcion: 'Proyecto urbano en el corazón de la ciudad',
      estado: 'COMPLETADO',
      comisionId: comisionBasica.id // 3% base
    }
  })

  // 4. Crear tipos de unidad por edificio
  console.log('🏠 Creando tipos de unidad por edificio...')

  // Torres del Sol - Tipos de unidad
  const tipoStudioTorres = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: 'Studio Premium',
      codigo: 'STUDIO',
      comisionId: comisionStandard.id, // 5%
      edificioId: edificio1.id
    }
  })

  const tipo1DormTorres = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: '1 Dormitorio Plus',
      codigo: '1DORM',
      comisionId: comisionPremium.id, // 7%
      edificioId: edificio1.id
    }
  })

  const tipo2DormTorres = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: '2 Dormitorios Deluxe',
      codigo: '2DORM',
      comisionId: comisionPremium.id, // 7%
      edificioId: edificio1.id
    }
  })

  // Vista Mar - Tipos de unidad
  const tipoPenthouseVista = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: 'Penthouse Exclusivo',
      codigo: 'PENTHOUSE',
      comisionId: comisionVip.id, // 10%
      edificioId: edificio2.id
    }
  })

  const tipo3DormVista = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: '3 Dormitorios Vista Mar',
      codigo: '3DORM',
      comisionId: comisionPremium.id, // 7%
      edificioId: edificio2.id
    }
  })

  // Parque Central - Tipos de unidad
  const tipoStudioParque = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: 'Studio Urbano',
      codigo: 'STUDIO',
      comisionId: comisionBasica.id, // 3%
      edificioId: edificio3.id
    }
  })

  // Tipo sin comisión específica (usa la del proyecto)
  const tipo1DormParque = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: '1 Dormitorio Estándar',
      codigo: '1DORM',
      comisionId: null, // Usará la comisión del proyecto (3%)
      edificioId: edificio3.id
    }
  })

  // Torres del Sol - Tipo sin comisión específica
  const tipoPenthouseTorres = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: 'Penthouse Torres',
      codigo: 'PH',
      comisionId: null, // Usará la comisión del proyecto (5%)
      edificioId: edificio1.id
    }
  })

  // 5. Crear unidades
  console.log('🏘️ Creando unidades...')

  // Torres del Sol - Unidades
  const unidades1 = await prisma.unidad.createMany({
    data: [
      {
        numero: '101',
        estado: 'DISPONIBLE',
        descripcion: 'Studio en primer piso con terraza',
        metros2: 45.5,
        edificioId: edificio1.id,
        tipoUnidadEdificioId: tipoStudioTorres.id
      },
      {
        numero: '201',
        estado: 'DISPONIBLE',
        descripcion: '1 dormitorio con vista norte',
        metros2: 62.0,
        edificioId: edificio1.id,
        tipoUnidadEdificioId: tipo1DormTorres.id
      },
      {
        numero: '301',
        estado: 'RESERVADA',
        descripcion: '2 dormitorios esquina',
        metros2: 85.5,
        edificioId: edificio1.id,
        tipoUnidadEdificioId: tipo2DormTorres.id
      },
      {
        numero: '401',
        estado: 'DISPONIBLE',
        descripcion: '2 dormitorios con terraza',
        metros2: 90.0,
        edificioId: edificio1.id,
        tipoUnidadEdificioId: tipo2DormTorres.id
      },
      {
        numero: '501',
        estado: 'VENDIDA',
        descripcion: '1 dormitorio último piso',
        metros2: 58.0,
        edificioId: edificio1.id,
        tipoUnidadEdificioId: tipo1DormTorres.id
      },
      {
        numero: 'PH01',
        estado: 'DISPONIBLE',
        descripcion: 'Penthouse con terraza exclusiva',
        metros2: 180.0,
        edificioId: edificio1.id,
        tipoUnidadEdificioId: tipoPenthouseTorres.id
      }
    ]
  })

  // Vista Mar - Unidades
  const unidades2 = await prisma.unidad.createMany({
    data: [
      {
        numero: 'PH01',
        estado: 'DISPONIBLE',
        descripcion: 'Penthouse con vista panorámica al mar',
        metros2: 150.0,
        edificioId: edificio2.id,
        tipoUnidadEdificioId: tipoPenthouseVista.id
      },
      {
        numero: '301',
        estado: 'DISPONIBLE',
        descripcion: '3 dormitorios vista frontal al mar',
        metros2: 120.0,
        edificioId: edificio2.id,
        tipoUnidadEdificioId: tipo3DormVista.id
      },
      {
        numero: '302',
        estado: 'RESERVADA',
        descripcion: '3 dormitorios vista lateral',
        metros2: 115.0,
        edificioId: edificio2.id,
        tipoUnidadEdificioId: tipo3DormVista.id
      }
    ]
  })

  // Parque Central - Unidades
  const unidades3 = await prisma.unidad.createMany({
    data: [
      {
        numero: '101',
        estado: 'VENDIDA',
        descripcion: 'Studio con balcón al parque',
        metros2: 40.0,
        edificioId: edificio3.id,
        tipoUnidadEdificioId: tipoStudioParque.id
      },
      {
        numero: '102',
        estado: 'DISPONIBLE',
        descripcion: 'Studio esquina con más luz',
        metros2: 42.5,
        edificioId: edificio3.id,
        tipoUnidadEdificioId: tipoStudioParque.id
      },
      {
        numero: '201',
        estado: 'DISPONIBLE',
        descripcion: '1 dormitorio con vista al parque',
        metros2: 55.0,
        edificioId: edificio3.id,
        tipoUnidadEdificioId: tipo1DormParque.id
      },
      {
        numero: '202',
        estado: 'RESERVADA',
        descripcion: '1 dormitorio con balcón amplio',
        metros2: 58.5,
        edificioId: edificio3.id,
        tipoUnidadEdificioId: tipo1DormParque.id
      }
    ]
  })

  // 6. Crear clientes
  console.log('👥 Creando clientes...')
  const cliente1 = await prisma.cliente.create({
    data: {
      nombre: 'Ana García Pérez',
      rut: '15234567-8',
      email: 'ana.garcia@email.com',
      telefono: '+569 1523 4567',
      contratistaId: contratista1.id
    }
  })

  const cliente2 = await prisma.cliente.create({
    data: {
      nombre: 'Roberto Silva Morales',
      rut: '16345678-9',
      email: 'roberto.silva@email.com',
      telefono: '+569 1634 5678',
      contratistaId: contratista1.id
    }
  })

  const cliente3 = await prisma.cliente.create({
    data: {
      nombre: 'Carmen Ruiz Torres',
      rut: '17456789-0',
      email: 'carmen.ruiz@email.com',
      telefono: '+569 1745 6789',
      contratistaId: contratista2.id
    }
  })

  const cliente4 = await prisma.cliente.create({
    data: {
      nombre: 'Diego Mendoza Castro',
      rut: '18567890-1',
      email: 'diego.mendoza@email.com',
      telefono: '+569 1856 7890',
      contratistaId: contratista3.id
    }
  })

  // 7. Crear contratos
  console.log('📋 Creando contratos...')

  // Obtener las unidades creadas para asignar a contratos
  const unidadTorres301 = await prisma.unidad.findFirst({
    where: { numero: '301', edificioId: edificio1.id }
  })

  const unidadTorres501 = await prisma.unidad.findFirst({
    where: { numero: '501', edificioId: edificio1.id }
  })

  const unidadVista302 = await prisma.unidad.findFirst({
    where: { numero: '302', edificioId: edificio2.id }
  })

  const unidadParque101 = await prisma.unidad.findFirst({
    where: { numero: '101', edificioId: edificio3.id }
  })

  // Contratos con unidades específicas
  await prisma.contrato.create({
    data: {
      codigoUnidad: 'TDS-301',
      totalContrato: 120000000, // $120M CLP
      montoUf: 3500, // UF
      comision: 8400000, // 7% del total
      estado: 'RESERVA_PAGADA',
      fechaPagoReserva: new Date('2024-01-15'),
      fechaPagoContrato: new Date('2024-03-15'),
      fechaCheckin: new Date('2024-06-01'),
      postulacion: 'Credito hipotecario Banco Estado',
      observaciones: 'Cliente prefiere entrega anticipada',
      contratistaId: contratista1.id,
      clienteId: cliente1.id,
      unidadId: unidadTorres301?.id,
      edificioId: edificio1.id
    }
  })

  await prisma.contrato.create({
    data: {
      codigoUnidad: 'TDS-501',
      totalContrato: 95000000, // $95M CLP
      montoUf: 2800, // UF
      comision: 6650000, // 7% del total
      estado: 'APROBADO',
      fechaPagoReserva: new Date('2023-12-10'),
      fechaPagoContrato: new Date('2024-02-10'),
      fechaCheckin: new Date('2024-04-01'),
      postulacion: 'Credito hipotecario BancoChile',
      observaciones: 'Venta finalizada exitosamente',
      contratistaId: contratista1.id,
      clienteId: cliente2.id,
      unidadId: unidadTorres501?.id,
      edificioId: edificio1.id
    }
  })

  await prisma.contrato.create({
    data: {
      codigoUnidad: 'RVM-302',
      totalContrato: 180000000, // $180M CLP
      montoUf: 5100, // UF
      comision: 12600000, // 7% del total
      estado: 'ENTREGADO',
      fechaPagoReserva: new Date('2024-02-01'),
      observaciones: 'Proceso en curso, esperando documentación',
      contratistaId: contratista2.id,
      clienteId: cliente3.id,
      unidadId: unidadVista302?.id,
      edificioId: edificio2.id
    }
  })

  await prisma.contrato.create({
    data: {
      codigoUnidad: 'PC-101',
      totalContrato: 75000000, // $75M CLP
      montoUf: 2200, // UF
      comision: 2250000, // 3% del total
      estado: 'APROBADO',
      fechaPagoReserva: new Date('2023-11-20'),
      fechaPagoContrato: new Date('2024-01-20'),
      fechaCheckin: new Date('2024-03-01'),
      postulacion: 'Pago contado',
      observaciones: 'Venta completada satisfactoriamente',
      contratistaId: contratista3.id,
      clienteId: cliente4.id,
      unidadId: unidadParque101?.id,
      edificioId: edificio3.id
    }
  })

  // Contrato manual (sin unidad específica asignada)
  await prisma.contrato.create({
    data: {
      codigoUnidad: 'MANUAL-001',
      totalContrato: 110000000, // $110M CLP
      montoUf: 3200, // UF
      comision: 7700000, // 7% del total
      estado: 'ENTREGADO',
      postulacion: 'Venta futura - terreno adyacente',
      observaciones: 'Contrato pre-venta para nueva fase del proyecto',
      contratistaId: contratista2.id,
      clienteId: cliente3.id,
      unidadId: null, // Sin unidad específica
      edificioId: edificio2.id
    }
  })

  // 8. Crear cambios programados de comisión
  console.log('⏰ Creando cambios programados de comisión...')
  await prisma.cambioComisionProgramado.create({
    data: {
      fechaCambio: new Date('2024-07-01'),
      comisionId: comisionVip.id, // Cambiar a 10%
      edificioId: edificio1.id,
      tipoUnidadEdificioId: tipo2DormTorres.id, // Solo para 2 dormitorios
      ejecutado: false
    }
  })

  await prisma.cambioComisionProgramado.create({
    data: {
      fechaCambio: new Date('2024-08-15'),
      comisionId: comisionPremium.id, // Cambiar todo el edificio a 7%
      edificioId: edificio3.id,
      tipoUnidadEdificioId: null, // Todo el edificio
      ejecutado: false
    }
  })

  console.log('✅ Seed completado exitosamente!')
  console.log('\n📊 Resumen de datos creados:')
  console.log(`- ${4} Comisiones (3%, 5%, 7%, 10%)`)
  console.log(`- ${4} Usuarios (1 admin, 3 contratistas)`)
  console.log(`- ${3} Edificios`)
  console.log(`- ${8} Tipos de unidad por edificio (incluyendo 2 sin comisión específica)`)
  console.log(`- ${13} Unidades`)
  console.log(`- ${4} Clientes`)
  console.log(`- ${5} Contratos`)
  console.log(`- ${2} Cambios programados`)
  console.log('\n🔧 Casos de prueba incluidos:')
  console.log('- Tipos de unidad con comisión específica')
  console.log('- Tipos de unidad sin comisión (usan la del proyecto)')
  console.log('- Diferentes estados de unidades y contratos')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })