import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Crear usuario administrador
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rumirent.com' },
    update: {},
    create: {
      email: 'admin@rumirent.com',
      password: adminPassword,
      nombre: 'Administrador Principal',
      role: 'ADMIN',
    },
  })

  // Crear usuarios contratistas
  const contratistaPassword = await bcrypt.hash('contratista123', 12)
  const contratista1 = await prisma.user.upsert({
    where: { email: 'juan.perez@rumirent.com' },
    update: {},
    create: {
      email: 'juan.perez@rumirent.com',
      password: contratistaPassword,
      nombre: 'Juan Pérez',
      telefono: '+56 9 1234 5678',
      role: 'CONTRATISTA',
    },
  })

  const contratista2 = await prisma.user.upsert({
    where: { email: 'maria.garcia@rumirent.com' },
    update: {},
    create: {
      email: 'maria.garcia@rumirent.com',
      password: contratistaPassword,
      nombre: 'María García',
      telefono: '+56 9 8765 4321',
      role: 'CONTRATISTA',
    },
  })

  // Crear tipos de comisión
  const comisionBasica = await prisma.comision.upsert({
    where: { codigo: 'BASICA' },
    update: {},
    create: {
      nombre: 'Comisión Básica',
      codigo: 'BASICA',
      porcentaje: 0.03, // 3%
      activa: true
    }
  })

  const comisionStandard = await prisma.comision.upsert({
    where: { codigo: 'STANDARD' },
    update: {},
    create: {
      nombre: 'Comisión Standard',
      codigo: 'STANDARD',
      porcentaje: 0.05, // 5%
      activa: true
    }
  })

  const comisionPremium = await prisma.comision.upsert({
    where: { codigo: 'PREMIUM' },
    update: {},
    create: {
      nombre: 'Comisión Premium',
      codigo: 'PREMIUM',
      porcentaje: 0.08, // 8%
      activa: true
    }
  })

  // Crear edificios de ejemplo
  let edificio1 = await prisma.edificio.findFirst({
    where: { nombre: 'Torres del Sol' }
  })
  if (!edificio1) {
    edificio1 = await prisma.edificio.create({
      data: {
        nombre: 'Torres del Sol',
        direccion: 'Av. Las Condes 12345, Las Condes',
        descripcion: 'Moderno conjunto habitacional con vista panorámica',
        estado: 'CONSTRUCCION'
      }
    })
  }

  let edificio2 = await prisma.edificio.findFirst({
    where: { nombre: 'Residencial Vista Mar' }
  })
  if (!edificio2) {
    edificio2 = await prisma.edificio.create({
      data: {
        nombre: 'Residencial Vista Mar',
        direccion: 'Av. del Mar 6789, Viña del Mar',
        descripcion: 'Exclusivo proyecto frente al océano',
        estado: 'PLANIFICACION'
      }
    })
  }

  // Los tipos de unidad ahora están definidos como enum, no como modelo separado
  console.log('📦 Tipos de unidad disponibles:', ['STUDIO', 'UN_DORMITORIO', 'DOS_DORMITORIOS', 'TRES_DORMITORIOS', 'PENTHOUSE'])

  // Crear unidades de ejemplo (solo si no existen)
  const unidadesExistentes = await prisma.unidad.count()
  if (unidadesExistentes === 0) {
    await prisma.unidad.createMany({
      data: [
        // Torres del Sol - Studios
        { edificioId: edificio1.id, tipo: 'STUDIO', numero: '101', precio: 95000000, estado: 'DISPONIBLE', metros2: 42 },
        { edificioId: edificio1.id, tipo: 'STUDIO', numero: '201', precio: 98000000, estado: 'DISPONIBLE', metros2: 42 },
        { edificioId: edificio1.id, tipo: 'STUDIO', numero: '301', precio: 101000000, estado: 'RESERVADA', metros2: 42 },

        // Torres del Sol - 1 Dormitorio
        { edificioId: edificio1.id, tipo: 'UN_DORMITORIO', numero: '102', precio: 125000000, estado: 'DISPONIBLE', metros2: 58 },
        { edificioId: edificio1.id, tipo: 'UN_DORMITORIO', numero: '202', precio: 128000000, estado: 'DISPONIBLE', metros2: 58 },

        // Torres del Sol - 2 Dormitorios
        { edificioId: edificio1.id, tipo: 'DOS_DORMITORIOS', numero: '103', precio: 165000000, estado: 'VENDIDA', metros2: 75 },
        { edificioId: edificio1.id, tipo: 'DOS_DORMITORIOS', numero: '203', precio: 168000000, estado: 'DISPONIBLE', metros2: 75 },

        // Vista Mar - Penthouses
        { edificioId: edificio2.id, tipo: 'PENTHOUSE', numero: 'PH01', precio: 350000000, estado: 'DISPONIBLE', metros2: 120 },
        { edificioId: edificio2.id, tipo: 'PENTHOUSE', numero: 'PH02', precio: 380000000, estado: 'DISPONIBLE', metros2: 135 }
      ]
    })
  }

  // Crear contratos de ejemplo
  const unidadVendida = await prisma.unidad.findFirst({
    where: { estado: 'VENDIDA' }
  })

  if (unidadVendida) {
    const contratoExistente = await prisma.contrato.findFirst({
      where: { unidadId: unidadVendida.id }
    })

    if (!contratoExistente) {
      await prisma.contrato.create({
        data: {
          comisionCalculada: 8250000, // 5% de 165M
          comisionReal: 8250000,
          comisionPagada: false,
          observaciones: 'Cliente prefiere entrega en diciembre',
          clienteNombre: 'Carlos Rodríguez',
          clienteEmail: 'carlos.rodriguez@email.com',
          clienteTelefono: '+56 9 9876 5432',
          contratistaId: contratista1.id,
          unidadId: unidadVendida.id
        }
      })
    }
  }

  // Crear cambios programados de ejemplo
  const cambioExistente = await prisma.cambioComisionProgramado.findFirst({
    where: {
      edificioId: edificio1.id,
      tipoUnidad: 'STUDIO'
    }
  })

  if (!cambioExistente) {
    await prisma.cambioComisionProgramado.create({
      data: {
        fechaCambio: new Date('2024-12-01'),
        comisionId: comisionPremium.id,
        edificioId: edificio1.id,
        tipoUnidad: 'STUDIO',
        ejecutado: false
      }
    })
  }

  console.log('✅ Seed completado exitosamente')
  console.log('👤 Admin: admin@rumirent.com / admin123')
  console.log('👤 Contratista 1: juan.perez@rumirent.com / contratista123')
  console.log('👤 Contratista 2: maria.garcia@rumirent.com / contratista123')
  console.log('🏢 Edificios creados: Torres del Sol, Residencial Vista Mar')
  console.log('💰 Comisiones creadas: Básica (3%), Standard (5%), Premium (8%)')
  console.log('🏠 Unidades y contratos de ejemplo creados')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })