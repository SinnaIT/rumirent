import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

const MESES_NOMBRES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const mesParam = searchParams.get("mes");
    const anioParam = searchParams.get("anio");

    // Default to current month/year if not provided
    const now = new Date();
    const mes = mesParam ? parseInt(mesParam) : now.getMonth() + 1;
    const anio = anioParam ? parseInt(anioParam) : now.getFullYear();

    // Validate parameters
    if (mes < 1 || mes > 12) {
      return NextResponse.json(
        { error: "Mes inválido. Debe estar entre 1 y 12." },
        { status: 400 }
      );
    }

    if (anio < 2000 || anio > 2100) {
      return NextResponse.json(
        { error: "Año inválido." },
        { status: 400 }
      );
    }

    // Calculate date range for the month
    const startDate = new Date(anio, mes - 1, 1);
    const endDate = new Date(anio, mes, 0, 23, 59, 59, 999);

    // Fetch all leads for the specified month (excluding RECHAZADO)
    // Use fechaPagoReserva to determine month for Rumi Race ranking
    const leads = await prisma.lead.findMany({
      where: {
        fechaPagoReserva: {
          gte: startDate,
          lte: endDate,
        },
        estado: {
          not: 'RECHAZADO'
        }
      },
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            role: true,
          },
        },
        cliente: {
          select: {
            nombre: true,
            rut: true
          }
        },
        edificio: {
          select: {
            nombre: true
          }
        }
      },
    });

    // Group leads by broker and calculate metrics
    const brokerMap = new Map<string, {
      brokerId: string;
      nombre: string;
      mes: string;
      reservas: number;
      checkin: number;
      montoBruto: number;
      anticipos: number;
      despAnticipo: number;
      liquido: number;
      leads: Array<{
        id: string;
        clienteNombre: string;
        clienteRut: string;
        edificioNombre: string;
        codigoUnidad: string;
        totalLead: number;
        comision: number;
        estado: string;
        fechaCheckin: Date | null;
      }>;
    }>();

    leads.forEach(lead => {
      // Only process if broker has BROKER role
      if (lead.broker.role !== "BROKER") {
        return;
      }

      const brokerId = lead.broker.id;

      if (!brokerMap.has(brokerId)) {
        brokerMap.set(brokerId, {
          brokerId: brokerId,
          nombre: lead.broker.nombre,
          mes: MESES_NOMBRES[mes - 1],
          reservas: 0,
          checkin: 0,
          montoBruto: 0,
          anticipos: 0,
          despAnticipo: 0,
          liquido: 0,
          leads: [],
        });
      }

      const brokerData = brokerMap.get(brokerId)!;

      // Add lead details to array
      brokerData.leads.push({
        id: lead.id,
        clienteNombre: lead.cliente.nombre,
        clienteRut: lead.cliente.rut,
        edificioNombre: lead.edificio.nombre,
        codigoUnidad: lead.codigoUnidad,
        totalLead: lead.totalLead,
        comision: lead.comision,
        estado: lead.estado,
        fechaCheckin: lead.fechaCheckin,
      });

      // Count all reservas (excluding RECHAZADO which is already filtered in query)
      brokerData.reservas++;

      // Count checkins (fechaCheckin not null)
      if (lead.fechaCheckin) {
        brokerData.checkin++;
      }

      // Sum monto bruto
      brokerData.montoBruto += lead.totalLead;

      // Sum liquido (comision)
      brokerData.liquido += lead.comision;
    });

    // Convert map to array and sort by broker name
    const brokersData = Array.from(brokerMap.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );

    // Calculate totals
    const totales = brokersData.reduce((acc, broker) => ({
      reservas: acc.reservas + broker.reservas,
      checkin: acc.checkin + broker.checkin,
      montoBruto: acc.montoBruto + broker.montoBruto,
      liquido: acc.liquido + broker.liquido,
    }), {
      reservas: 0,
      checkin: 0,
      montoBruto: 0,
      liquido: 0,
    });

    return NextResponse.json({
      mes,
      anio,
      mesNombre: MESES_NOMBRES[mes - 1],
      brokers: brokersData,
      totales,
    });

  } catch (error) {
    console.error("Error fetching monthly broker report:", error);
    return NextResponse.json(
      { error: "Error al obtener el reporte" },
      { status: 500 }
    );
  }
}
