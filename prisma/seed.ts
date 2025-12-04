import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos con nueva estructura...')

  // Limpiar datos existentes (orden importante por foreign keys)
  console.log('🧹 Limpiando datos existentes...')
  await prisma.lead.deleteMany({})
  await prisma.cliente.deleteMany({})
  await prisma.unidad.deleteMany({})
  await prisma.cambioComisionProgramado.deleteMany({})
  await prisma.caracteristicaEdificio.deleteMany({})
  await prisma.imagenEdificio.deleteMany({})
  await prisma.tipoCaracteristica.deleteMany({})
  await prisma.tipoUnidadEdificio.deleteMany({})
  await prisma.edificio.deleteMany({})
  await prisma.empresa.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.comision.deleteMany({})
  await prisma.plantillaTipoUnidad.deleteMany({})

  // 1. Crear tipos de características
  console.log('🏷️ Creando tipos de características...')
  const tipoAmenities = await prisma.tipoCaracteristica.create({
    data: {
      nombre: 'Amenities',
      descripcion: 'Amenidades y servicios del edificio',
      activo: true
    }
  })

  const tipoUbicacion = await prisma.tipoCaracteristica.create({
    data: {
      nombre: 'Ubicación',
      descripcion: 'Información sobre ubicación y accesos',
      activo: true
    }
  })

  const tipoServicios = await prisma.tipoCaracteristica.create({
    data: {
      nombre: 'Servicios',
      descripcion: 'Servicios incluidos en el proyecto',
      activo: true
    }
  })

  const tipoSeguridad = await prisma.tipoCaracteristica.create({
    data: {
      nombre: 'Seguridad',
      descripcion: 'Sistemas de seguridad y control',
      activo: true
    }
  })

  const tipoSustentabilidad = await prisma.tipoCaracteristica.create({
    data: {
      nombre: 'Sustentabilidad',
      descripcion: 'Características ecológicas y sustentables',
      activo: true
    }
  })

  const tipoTecnologia = await prisma.tipoCaracteristica.create({
    data: {
      nombre: 'Tecnología',
      descripcion: 'Sistemas tecnológicos y automatización',
      activo: true
    }
  })

  // 2. Crear comisiones base (porcentajes)
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

  // 2. Crear plantillas de tipos de unidad
  console.log('📋 Creando plantillas de tipos de unidad...')
  const plantillaStudio = await prisma.plantillaTipoUnidad.create({
    data: {
      nombre: 'Studio',
      codigo: 'STU',
      bedrooms: 0,
      bathrooms: 1,
      descripcion: 'Departamento tipo studio sin dormitorios separados',
      activo: true
    }
  })

  const plantilla1D = await prisma.plantillaTipoUnidad.create({
    data: {
      nombre: '1 Dormitorio',
      codigo: '1D',
      bedrooms: 1,
      bathrooms: 1,
      descripcion: 'Departamento de 1 dormitorio y 1 baño',
      activo: true
    }
  })

  const plantilla2D = await prisma.plantillaTipoUnidad.create({
    data: {
      nombre: '2 Dormitorios',
      codigo: '2D',
      bedrooms: 2,
      bathrooms: 2,
      descripcion: 'Departamento de 2 dormitorios y 2 baños',
      activo: true
    }
  })

  const plantilla3D = await prisma.plantillaTipoUnidad.create({
    data: {
      nombre: '3 Dormitorios',
      codigo: '3D',
      bedrooms: 3,
      bathrooms: 2,
      descripcion: 'Departamento de 3 dormitorios y 2 baños',
      activo: true
    }
  })

  const plantillaPenthouse = await prisma.plantillaTipoUnidad.create({
    data: {
      nombre: 'Penthouse',
      codigo: 'PH',
      bedrooms: 3,
      bathrooms: 3,
      descripcion: 'Penthouse de lujo con 3 dormitorios y 3 baños',
      activo: true
    }
  })

  const plantillaLoft = await prisma.plantillaTipoUnidad.create({
    data: {
      nombre: 'Loft',
      codigo: 'LOFT',
      bedrooms: 1,
      bathrooms: 1,
      descripcion: 'Loft de concepto abierto',
      activo: true
    }
  })

  console.log(`✅ Creadas ${6} plantillas de tipos de unidad`)

  // 3. Crear empresas e inversionistas
  console.log('🏢 Creando empresas...')
  const empresaPrincipal = await prisma.empresa.create({
    data: {
      nombre: 'Inmobiliaria Principal',
      rut: '76123456-7',
      razonSocial: 'Inmobiliaria Principal S.A.',
      tipoEntidad: 'COMPANY',
      direccion: 'Av. Apoquindo 3000, Las Condes, Santiago',
      telefono: '+56912345678',
      email: 'contacto@inmobiliariaprincipal.cl',
      activa: true
    }
  })

  const empresaSecundaria = await prisma.empresa.create({
    data: {
      nombre: 'Desarrolladora Costa',
      rut: '76654321-0',
      razonSocial: 'Desarrolladora Costa Limitada',
      tipoEntidad: 'COMPANY',
      direccion: 'Av. del Mar 1500, Viña del Mar',
      telefono: '+56987654321',
      email: 'contacto@desarrolladoracosta.cl',
      activa: true
    }
  })

  console.log('💼 Creando inversionistas...')
  const inversionista1 = await prisma.empresa.create({
    data: {
      nombre: 'Carlos Mendoza',
      rut: '15234567-8',
      razonSocial: 'Carlos Mendoza Inversiones',
      tipoEntidad: 'INVESTOR',
      direccion: 'Los Leones 1234, Providencia, Santiago',
      telefono: '+56987654320',
      email: 'cmendoza@inversiones.cl',
      activa: true
    }
  })

  // 3. Crear usuarios con RUT (1 admin + 6 brokers)
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

  const broker1 = await prisma.user.create({
    data: {
      email: 'carlos.rodriguez@email.com',
      password: hashedPassword,
      nombre: 'Carlos Rodríguez',
      rut: '98765432-1',
      telefono: '+569 8765 4321',
      role: 'BROKER',
    }
  })

  const broker2 = await prisma.user.create({
    data: {
      email: 'maria.gonzalez@email.com',
      password: hashedPassword,
      nombre: 'María González',
      rut: '87654321-0',
      telefono: '+569 8765 1234',
      role: 'BROKER',
    }
  })

  const broker3 = await prisma.user.create({
    data: {
      email: 'juan.lopez@email.com',
      password: hashedPassword,
      nombre: 'Juan López',
      rut: '76543210-K',
      telefono: '+569 7654 3210',
      role: 'BROKER',
    }
  })

  const broker4 = await prisma.user.create({
    data: {
      email: 'ana.martinez@email.com',
      password: hashedPassword,
      nombre: 'Ana Martínez',
      rut: '65432109-8',
      telefono: '+569 6543 2109',
      role: 'BROKER',
    }
  })

  const broker5 = await prisma.user.create({
    data: {
      email: 'pedro.sanchez@email.com',
      password: hashedPassword,
      nombre: 'Pedro Sánchez',
      rut: '54321098-7',
      telefono: '+569 5432 1098',
      role: 'BROKER',
    }
  })

  const broker6 = await prisma.user.create({
    data: {
      email: 'lucia.torres@email.com',
      password: hashedPassword,
      nombre: 'Lucía Torres',
      rut: '43210987-6',
      telefono: '+569 4321 0987',
      role: 'BROKER',
    }
  })

  // 4. Crear edificios con comisión base y empresa
  console.log('🏢 Creando edificios...')
  const edificio1 = await prisma.edificio.create({
    data: {
      nombre: 'Torres del Sol',
      direccion: 'Av. Las Condes 12345',
      comuna: 'Las Condes',
      ciudad: 'Santiago',
      region: 'Región Metropolitana',
      codigoPostal: '7550000',
      urlGoogleMaps: 'https://maps.google.com/?q=Av.+Las+Condes+12345+Santiago',
      telefono: '+56 2 2345 6789',
      email: 'ventas@torresdelsol.cl',
      descripcion: 'Moderno conjunto habitacional con vista panorámica a la cordillera',
      empresaId: empresaPrincipal.id,
      comisionId: comisionStandard.id, // 5% base
      imagenes: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
            descripcion: 'Fachada principal',
            orden: 1
          },
          {
            url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
            descripcion: 'Lobby de ingreso',
            orden: 2
          },
          {
            url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            descripcion: 'Vista desde terraza',
            orden: 3
          }
        ]
      },
      caracteristicas: {
        create: [
          {
            tipoCaracteristicaId: tipoAmenities.id,
            nombre: 'Piscina',
            valor: 'Piscina temperada todo el año',
            mostrarEnResumen: true,
            icono: 'Waves',
            tipoIcono: 'LUCIDE'
          },
          {
            tipoCaracteristicaId: tipoAmenities.id,
            nombre: 'Gimnasio',
            valor: 'Equipamiento completo',
            mostrarEnResumen: true,
            icono: 'Dumbbell',
            tipoIcono: 'LUCIDE'
          },
          {
            tipoCaracteristicaId: tipoSeguridad.id,
            nombre: 'Seguridad 24/7',
            valor: 'Guardias y cámaras',
            mostrarEnResumen: true,
            icono: 'Shield',
            tipoIcono: 'LUCIDE'
          },
          {
            tipoCaracteristicaId: tipoUbicacion.id,
            nombre: 'Metro',
            valor: 'A 5 min caminando',
            mostrarEnResumen: true,
            icono: 'Train',
            tipoIcono: 'LUCIDE'
          },
          {
            tipoCaracteristicaId: tipoServicios.id,
            nombre: 'Estacionamiento',
            valor: 'Subterráneo techado',
            mostrarEnResumen: false,
            icono: 'Car',
            tipoIcono: 'LUCIDE'
          }
        ]
      }
    }
  })

  const edificio2 = await prisma.edificio.create({
    data: {
      nombre: 'Residencial Vista Mar',
      direccion: 'Av. del Mar 6789',
      comuna: 'Viña del Mar',
      ciudad: 'Viña del Mar',
      region: 'Región de Valparaíso',
      codigoPostal: '2520000',
      urlGoogleMaps: 'https://maps.google.com/?q=Av.+del+Mar+6789+Viña+del+Mar',
      telefono: '+56 32 2789 0123',
      email: 'contacto@vistamar.cl',
      descripcion: 'Exclusivo proyecto frente al océano con amenities de lujo',
      empresaId: empresaSecundaria.id,
      comisionId: comisionPremium.id, // 7% base
      imagenes: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
            descripcion: 'Vista al mar',
            orden: 1
          },
          {
            url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
            descripcion: 'Sala de estar modelo',
            orden: 2
          }
        ]
      },
      caracteristicas: {
        create: [
          {
            tipoCaracteristicaId: tipoAmenities.id,
            nombre: 'Acceso directo a playa',
            valor: 'Playa privada',
            mostrarEnResumen: true,
            icono: 'Umbrella',
            tipoIcono: 'LUCIDE'
          },
          {
            tipoCaracteristicaId: tipoAmenities.id,
            nombre: 'Spa',
            valor: 'Sauna y jacuzzi',
            mostrarEnResumen: true,
            icono: 'Sparkles',
            tipoIcono: 'LUCIDE'
          },
          {
            tipoCaracteristicaId: tipoSeguridad.id,
            nombre: 'Acceso controlado',
            valor: 'Portón automático',
            mostrarEnResumen: true,
            icono: 'Lock',
            tipoIcono: 'LUCIDE'
          }
        ]
      }
    }
  })

  const edificio3 = await prisma.edificio.create({
    data: {
      nombre: 'Parque Central',
      direccion: 'Calle Nueva 1234',
      comuna: 'Providencia',
      ciudad: 'Santiago',
      region: 'Región Metropolitana',
      codigoPostal: '7500000',
      descripcion: 'Proyecto urbano en el corazón de la ciudad',
      empresaId: empresaPrincipal.id,
      comisionId: comisionBasica.id // 3% base
    }
  })

  const edificio4 = await prisma.edificio.create({
    data: {
      nombre: 'Alto Mirador',
      direccion: 'Av. Apoquindo 5678',
      comuna: 'Las Condes',
      ciudad: 'Santiago',
      region: 'Región Metropolitana',
      codigoPostal: '7560000',
      descripcion: 'Torre de lujo con vista panorámica',
      empresaId: empresaPrincipal.id,
      comisionId: comisionVip.id // 10% base
    }
  })

  const edificio5 = await prisma.edificio.create({
    data: {
      nombre: 'Condominio Verde',
      direccion: 'Pasaje Los Olivos 987',
      comuna: 'Ñuñoa',
      ciudad: 'Santiago',
      region: 'Región Metropolitana',
      codigoPostal: '7750000',
      descripcion: 'Proyecto sustentable con áreas verdes',
      empresaId: empresaSecundaria.id,
      comisionId: comisionStandard.id // 5% base
    }
  })

  // 5. Crear tipos de unidad por edificio
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

  const tipoPenthouseTorres = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: 'Penthouse Torres',
      codigo: 'PH',
      comisionId: null, // Usará la comisión del proyecto (5%)
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

  const tipo1DormParque = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: '1 Dormitorio Estándar',
      codigo: '1DORM',
      comisionId: null, // Usará la comisión del proyecto (3%)
      edificioId: edificio3.id
    }
  })

  // Alto Mirador - Tipos de unidad
  const tipoLuxuryMirador = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: 'Luxury Suite',
      codigo: 'LUXURY',
      comisionId: comisionVip.id, // 10%
      edificioId: edificio4.id
    }
  })

  const tipoPenthouseMirador = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: 'Penthouse Mirador',
      codigo: 'PH',
      comisionId: null, // Usará la comisión del proyecto (10%)
      edificioId: edificio4.id
    }
  })

  // Condominio Verde - Tipos de unidad
  const tipoEcoStudio = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: 'Eco Studio',
      codigo: 'ECO_STUDIO',
      comisionId: comisionStandard.id, // 5%
      edificioId: edificio5.id
    }
  })

  const tipo2DormVerde = await prisma.tipoUnidadEdificio.create({
    data: {
      nombre: '2 Dormitorios Verde',
      codigo: '2DORM',
      comisionId: comisionPremium.id, // 7%
      edificioId: edificio5.id
    }
  })

  // 5. Crear unidades
  console.log('🏘️ Creando unidades...')

  // Torres del Sol - Unidades
  await prisma.unidad.createMany({
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
  await prisma.unidad.createMany({
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
  await prisma.unidad.createMany({
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

  // Alto Mirador - Unidades
  await prisma.unidad.createMany({
    data: [
      {
        numero: 'L101',
        estado: 'DISPONIBLE',
        descripcion: 'Luxury suite con vista panorámica',
        metros2: 95.0,
        edificioId: edificio4.id,
        tipoUnidadEdificioId: tipoLuxuryMirador.id
      },
      {
        numero: 'L201',
        estado: 'VENDIDA',
        descripcion: 'Luxury suite premium',
        metros2: 98.5,
        edificioId: edificio4.id,
        tipoUnidadEdificioId: tipoLuxuryMirador.id
      },
      {
        numero: 'PH01',
        estado: 'RESERVADA',
        descripcion: 'Penthouse con terraza exclusiva',
        metros2: 200.0,
        edificioId: edificio4.id,
        tipoUnidadEdificioId: tipoPenthouseMirador.id
      }
    ]
  })

  // Condominio Verde - Unidades
  await prisma.unidad.createMany({
    data: [
      {
        numero: 'E101',
        estado: 'DISPONIBLE',
        descripcion: 'Eco studio con balcón verde',
        metros2: 38.0,
        edificioId: edificio5.id,
        tipoUnidadEdificioId: tipoEcoStudio.id
      },
      {
        numero: 'E102',
        estado: 'VENDIDA',
        descripcion: 'Eco studio con orientación sur',
        metros2: 35.5,
        edificioId: edificio5.id,
        tipoUnidadEdificioId: tipoEcoStudio.id
      },
      {
        numero: 'V201',
        estado: 'DISPONIBLE',
        descripcion: '2 dormitorios con jardín privado',
        metros2: 72.0,
        edificioId: edificio5.id,
        tipoUnidadEdificioId: tipo2DormVerde.id
      },
      {
        numero: 'V202',
        estado: 'RESERVADA',
        descripcion: '2 dormitorios con vista al parque',
        metros2: 75.5,
        edificioId: edificio5.id,
        tipoUnidadEdificioId: tipo2DormVerde.id
      }
    ]
  })

  // 6. Crear clientes (20 clientes distribuidos entre 6 brokers)
  console.log('👥 Creando clientes...')
  const clientes = await Promise.all([
    // Clientes para broker1 (Carlos)
    prisma.cliente.create({
      data: {
        nombre: 'Ana García Pérez',
        rut: '15234567-8',
        email: 'ana.garcia@email.com',
        telefono: '+569 1523 4567',
        brokerId: broker1.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Roberto Silva Morales',
        rut: '16345678-9',
        email: 'roberto.silva@email.com',
        telefono: '+569 1634 5678',
        brokerId: broker1.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Carla Fernández Ruiz',
        rut: '19678901-2',
        email: 'carla.fernandez@email.com',
        telefono: '+569 1967 8901',
        brokerId: broker1.id
      }
    }),
    // Clientes para broker2 (María)
    prisma.cliente.create({
      data: {
        nombre: 'Carmen Ruiz Torres',
        rut: '17456789-0',
        email: 'carmen.ruiz@email.com',
        telefono: '+569 1745 6789',
        brokerId: broker2.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Francisco Herrera Lima',
        rut: '21890123-4',
        email: 'francisco.herrera@email.com',
        telefono: '+569 2189 0123',
        brokerId: broker2.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Isabel Castro Méndez',
        rut: '22901234-5',
        email: 'isabel.castro@email.com',
        telefono: '+569 2290 1234',
        brokerId: broker2.id
      }
    }),
    // Clientes para broker3 (Juan)
    prisma.cliente.create({
      data: {
        nombre: 'Diego Mendoza Castro',
        rut: '18567890-1',
        email: 'diego.mendoza@email.com',
        telefono: '+569 1856 7890',
        brokerId: broker3.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Valentina Ramos Ortiz',
        rut: '24123456-7',
        email: 'valentina.ramos@email.com',
        telefono: '+569 2412 3456',
        brokerId: broker3.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Mateo Vargas León',
        rut: '25234567-8',
        email: 'mateo.vargas@email.com',
        telefono: '+569 2523 4567',
        brokerId: broker3.id
      }
    }),
    // Clientes para broker4 (Ana)
    prisma.cliente.create({
      data: {
        nombre: 'Sofía Jiménez Rojas',
        rut: '26345678-9',
        email: 'sofia.jimenez@email.com',
        telefono: '+569 2634 5678',
        brokerId: broker4.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Andrés Guerrero Soto',
        rut: '27456789-0',
        email: 'andres.guerrero@email.com',
        telefono: '+569 2745 6789',
        brokerId: broker4.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Patricia Núñez Flores',
        rut: '28567890-1',
        email: 'patricia.nunez@email.com',
        telefono: '+569 2856 7890',
        brokerId: broker4.id
      }
    }),
    // Clientes para broker5 (Pedro)
    prisma.cliente.create({
      data: {
        nombre: 'Gabriel Morales Díaz',
        rut: '29678901-2',
        email: 'gabriel.morales@email.com',
        telefono: '+569 2967 8901',
        brokerId: broker5.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Camila Aguilar Ponce',
        rut: '30789012-3',
        email: 'camila.aguilar@email.com',
        telefono: '+569 3078 9012',
        brokerId: broker5.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Tomás Espinoza Cruz',
        rut: '31890123-4',
        email: 'tomas.espinoza@email.com',
        telefono: '+569 3189 0123',
        brokerId: broker5.id
      }
    }),
    // Clientes para broker6 (Lucía)
    prisma.cliente.create({
      data: {
        nombre: 'Natalia Campos Reyes',
        rut: '32901234-5',
        email: 'natalia.campos@email.com',
        telefono: '+569 3290 1234',
        brokerId: broker6.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Sebastián Vidal Herrera',
        rut: '33012345-6',
        email: 'sebastian.vidal@email.com',
        telefono: '+569 3301 2345',
        brokerId: broker6.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Elena Paredes Molina',
        rut: '34123456-7',
        email: 'elena.paredes@email.com',
        telefono: '+569 3412 3456',
        brokerId: broker6.id
      }
    }),
    // Clientes adicionales para variedad
    prisma.cliente.create({
      data: {
        nombre: 'Martín Sánchez Torres',
        rut: '35234567-8',
        email: 'martin.sanchez@email.com',
        telefono: '+569 3523 4567',
        brokerId: broker1.id
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Fernanda López Moreno',
        rut: '36345678-9',
        email: 'fernanda.lopez@email.com',
        telefono: '+569 3634 5678',
        brokerId: broker2.id
      }
    })
  ])

  // 7. Crear leads distribuidos en 2024 (~50 leads)
  console.log('📋 Creando ~50 leads distribuidos en 2024...')

  // Función auxiliar para generar fechas aleatorias en 2024
  const getRandomDate2024 = (startMonth: number, endMonth: number) => {
    const start = new Date(2024, startMonth - 1, 1)
    const end = new Date(2024, endMonth - 1, 28)
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  }

  // Función auxiliar para generar fechas aleatorias en 2025
  const getRandomDate2025 = (startMonth: number, endMonth: number) => {
    const start = new Date(2025, startMonth - 1, 1)
    const end = new Date(2025, endMonth - 1, 28)
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  }

  // Obtener unidades para asignar a algunos leads
  const unidades = await prisma.unidad.findMany({
    include: {
      tipoUnidadEdificio: {
        include: {
          comision: true,
          edificio: { include: { comision: true } }
        }
      },
      edificio: true
    }
  })

  // Estados de lead para variedad
  const estados: ('ENTREGADO' | 'RESERVA_PAGADA' | 'APROBADO' | 'RECHAZADO')[] =
    ['ENTREGADO', 'RESERVA_PAGADA', 'APROBADO', 'RECHAZADO']

  // Postulaciones típicas
  const postulaciones = [
    'Crédito hipotecario Banco Estado',
    'Crédito hipotecario BancoChile',
    'Crédito hipotecario Santander',
    'Pago contado',
    'Crédito hipotecario BCI',
    'Subsidio habitacional',
    'Crédito CORFO'
  ]

  // Crear 50 leads
  const brokers = [broker1, broker2, broker3, broker4, broker5, broker6]
  const edificios = [edificio1, edificio2, edificio3, edificio4, edificio5]
  const unidadesUsadas = new Set<string>() // Para evitar duplicados

  for (let i = 0; i < 50; i++) {
    const contraInd = i % 6 // Rotar entre brokers
    const clienteInd = Math.floor(i / 6) % Math.floor(clientes.length / 6) + (contraInd * Math.floor(clientes.length / 6))
    const contraId = brokers[contraInd].id
    const clienteId = clientes[clienteInd % clientes.length].id

    // Seleccionar unidad disponible (no usada) o null para lead manual
    let unidad = null
    if (i < unidades.length && Math.random() > 0.3) { // Solo usar unidades reales si hay disponibles
      const unidadesDisponibles = unidades.filter(u => !unidadesUsadas.has(u.id))
      if (unidadesDisponibles.length > 0) {
        unidad = unidadesDisponibles[Math.floor(Math.random() * unidadesDisponibles.length)]
        unidadesUsadas.add(unidad.id)
      }
    }

    const edificio = unidad ? unidad.edificio : edificios[Math.floor(Math.random() * edificios.length)]

    // Generar precio aleatorio según tipo
    const precioBase = unidad ?
      (unidad.metros2! * 1500000) + Math.random() * 50000000 : // Precio por m2 + variación
      50000000 + Math.random() * 150000000 // Precio manual

    const totalLead = Math.round(precioBase / 1000000) * 1000000 // Redondear a millones
    const montoUf = Math.round(totalLead / 35000) // Aprox UF a 35.000 CLP

    // Calcular comisión según tipo de unidad
    let porcentajeComision = 0.05 // Default 5%
    if (unidad) {
      const comisionTipo = unidad.tipoUnidadEdificio.comision
      const comisionEdificio = unidad.tipoUnidadEdificio.edificio.comision
      porcentajeComision = comisionTipo ? comisionTipo.porcentaje : comisionEdificio.porcentaje
    }

    const comision = Math.round(totalLead * porcentajeComision)
    const estado = estados[Math.floor(Math.random() * estados.length)]

    // Fechas progresivas a lo largo del año
    const mesBase = Math.floor((i / 50) * 12) + 1
    const fechaReserva = getRandomDate2024(mesBase, mesBase + 1)
    const fechalead = estado !== 'ENTREGADO' ?
      new Date(fechaReserva.getTime() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000) :
      undefined
    const fechaCheckin = estado === 'APROBADO' ?
      new Date((fechalead || fechaReserva).getTime() + (60 + Math.random() * 120) * 24 * 60 * 60 * 1000) :
      undefined

    const codigoUnidad = unidad ?
      `${unidad.edificio.nombre.split(' ')[0].toUpperCase()}-${unidad.numero}` :
      `MANUAL-${String(i + 1).padStart(3, '0')}`

    const leadData = {
      codigoUnidad,
      totalLead: totalLead,
      montoUf,
      comision,
      estado,
      fechaPagoReserva: fechaReserva,
      fechaPagoLead: fechalead,
      fechaCheckin: fechaCheckin,
      postulacion: postulaciones[Math.floor(Math.random() * postulaciones.length)],
      observaciones: [
        'Proceso estándar sin observaciones',
        'Cliente solicita modificaciones menores',
        'Entrega anticipada solicitada',
        'Documentación pendiente',
        'Proceso completado exitosamente',
        null
      ][Math.floor(Math.random() * 6)],
      conciliado: Math.random() > 0.7, // 30% conciliados
      fechaConciliacion: Math.random() > 0.7 ? getRandomDate2024(mesBase + 1, 12) : undefined,
      brokerId: contraId,
      clienteId: clienteId,
      unidadId: unidad?.id || null,
      edificioId: edificio.id
    }

    await prisma.lead.create({ data: leadData })
  }

  // 7b. Crear 20 leads adicionales distribuidos en 2025
  console.log('📋 Creando 20 leads adicionales distribuidos en 2025...')

  for (let i = 0; i < 20; i++) {
    const contraInd = i % 6 // Rotar entre brokers
    const clienteInd = Math.floor(i / 6) % Math.floor(clientes.length / 6) + (contraInd * Math.floor(clientes.length / 6))
    const contraId = brokers[contraInd].id
    const clienteId = clientes[clienteInd % clientes.length].id

    // Para 2025, usar más leads manuales ya que las unidades físicas están agotadas
    let unidad = null
    const unidadesDisponibles = unidades.filter(u => !unidadesUsadas.has(u.id))
    if (unidadesDisponibles.length > 0 && Math.random() > 0.7) { // 30% con unidades físicas, 70% manuales
      unidad = unidadesDisponibles[Math.floor(Math.random() * unidadesDisponibles.length)]
      unidadesUsadas.add(unidad.id)
    }

    const edificio = unidad ? unidad.edificio : edificios[Math.floor(Math.random() * edificios.length)]

    // Generar precio aleatorio (precios 2025 ligeramente más altos)
    const precioBase = unidad ?
      (unidad.metros2! * 1600000) + Math.random() * 60000000 : // Precios 2025 más altos
      60000000 + Math.random() * 180000000 // Precio manual 2025

    const totalLead = Math.round(precioBase / 1000000) * 1000000 // Redondear a millones
    const montoUf = Math.round(totalLead / 36000) // UF estimada a 36.000 CLP en 2025

    // Calcular comisión según tipo de unidad
    let porcentajeComision = 0.05 // Default 5%
    if (unidad) {
      const comisionTipo = unidad.tipoUnidadEdificio.comision
      const comisionEdificio = unidad.tipoUnidadEdificio.edificio.comision
      porcentajeComision = comisionTipo ? comisionTipo.porcentaje : comisionEdificio.porcentaje
    }

    const comision = Math.round(totalLead * porcentajeComision)
    const estado = estados[Math.floor(Math.random() * estados.length)]

    // Distribuir fechas a lo largo de 2025 (cada lead en diferente mes)
    // Para 20 leads, asegurar que se cubran todos los meses del año
    const mesesDistribucion = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 11, 12]
    const mes2025 = mesesDistribucion[i] || ((i % 12) + 1)
    const fechaReserva = getRandomDate2025(mes2025, mes2025)

    const fechalead = estado !== 'ENTREGADO' ?
      new Date(fechaReserva.getTime() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000) :
      undefined
    const fechaCheckin = estado === 'APROBADO' ?
      new Date((fechalead || fechaReserva).getTime() + (60 + Math.random() * 120) * 24 * 60 * 60 * 1000) :
      undefined

    const codigoUnidad = unidad ?
      `${unidad.edificio.nombre.split(' ')[0].toUpperCase()}-${unidad.numero}-2025` :
      `FUTURO-${String(i + 1).padStart(3, '0')}-2025`

    const leadData2025 = {
      codigoUnidad,
      totalLead,
      montoUf,
      comision,
      estado,
      fechaPagoReserva: fechaReserva,
      fechaPagoLead: fechalead,
      fechaCheckin: fechaCheckin,
      postulacion: postulaciones[Math.floor(Math.random() * postulaciones.length)],
      observaciones: [
        'lead futuro 2025 - condiciones especiales',
        'Pre-venta con descuento por pago anticipado',
        'Cliente preferencial con historial exitoso',
        'Proyecto en fase de planificación',
        'Entrega programada para 2026',
        'Reserva de unidad futura'
      ][Math.floor(Math.random() * 6)],
      conciliado: Math.random() > 0.8, // 20% conciliados (menos que en 2024 por ser futuros)
      fechaConciliacion: Math.random() > 0.8 ? getRandomDate2025(Math.min(mes2025 + 1, 12), 12) : undefined,
      brokerId: contraId,
      clienteId: clienteId,
      unidadId: unidad?.id || null,
      edificioId: edificio.id
    }

    await prisma.lead.create({ data: leadData2025 })
  }

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
  console.log(`- 4 Comisiones (3%, 5%, 7%, 10%)`)
  console.log(`- 7 Usuarios (1 admin, 6 brokers)`)
  console.log(`- 5 Edificios`)
  console.log(`- 12 Tipos de unidad por edificio`)
  console.log(`- 20 Unidades`)
  console.log(`- 20 Clientes (distribuidos entre brokers)`)
  console.log(`- 50 leads (distribuidos en 2024)`)
  console.log(`- 20 leads adicionales (distribuidos en 2025)`)
  console.log(`- 2 Cambios programados`)
  console.log('\n🔧 Casos de prueba incluidos:')
  console.log('- 6 brokers activos con ventas distribuidas')
  console.log('- 70 leads totales: 50 en 2024 + 20 en 2025')
  console.log('- leads 2025 distribuidos en todos los meses del año')
  console.log('- Precios 2025 ajustados por inflación')
  console.log('- Variedad en estados de leads y unidades')
  console.log('- leads con y sin unidades específicas')
  console.log('- Diferentes tipos de comisiones por edificio y tipo de unidad')
  console.log('- Postulaciones y métodos de pago variados')
  console.log('- Algunos leads conciliados para reportes')
  console.log('- leads futuros con observaciones específicas para 2025')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })