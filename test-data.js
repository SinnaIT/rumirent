const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Creando datos de prueba...')

  // Verificar si ya hay datos
  const existingUsers = await prisma.user.count()
  if (existingUsers > 0) {
    console.log('Ya hay datos en la base de datos')
    return
  }

  // Crear comisiones
  const comision = await prisma.comision.create({
    data: {
      nombre: 'Comisión Standard',
      codigo: 'COM_STD',
      porcentaje: 0.05,
      activa: true
    }
  })

  // Crear usuario contratista
  const hashedPassword = await bcrypt.hash('123456', 10)
  const contratista = await prisma.user.create({
    data: {
      email: 'contratista@test.com',
      password: hashedPassword,
      nombre: 'Test Contratista',
      rut: '12345678-9',
      telefono: '+569 1234 5678',
      role: 'CONTRATISTA',
    }
  })

  // Crear edificio
  const edificio = await prisma.edificio.create({
    data: {
      nombre: 'Torres Test',
      direccion: 'Av. Test 123, Santiago',
      descripcion: 'Edificio de prueba',
      estado: 'ENTREGA_INMEDIATA',
      comisionId: comision.id
    }
  })

  // Crear tipo de unidad
  const tipoUnidad = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: '2 Dormitorios',
      codigo: '2D',
      comisionId: comision.id,
      edificioId: edificio.id
    }
  })

  // Crear unidades
  await prisma.unidad.createMany({
    data: [
      {
        numero: '101',
        estado: 'DISPONIBLE',
        descripcion: 'Unidad en primer piso',
        metros2: 75.0,
        edificioId: edificio.id,
        tipoUnidadEdificioId: tipoUnidad.id
      },
      {
        numero: '201',
        estado: 'DISPONIBLE',
        descripcion: 'Unidad en segundo piso',
        metros2: 75.0,
        edificioId: edificio.id,
        tipoUnidadEdificioId: tipoUnidad.id
      }
    ]
  })

  console.log('✅ Datos de prueba creados exitosamente!')
  console.log('Usuario: contratista@test.com / 123456')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })